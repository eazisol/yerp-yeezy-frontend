import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, Loader2, Send, DollarSign, Pencil, FileCheck, Users, Download } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPurchaseOrderById,
  submitForApproval,
  approvePurchaseOrder,
  sendPurchaseOrderToVendor,
  updatePaymentStatus,
  PurchaseOrder,
} from "@/services/purchaseOrders";
import { getPOApprovals, approvePO, POApproval } from "@/services/poApprovals";
import POApprovalModal from "@/components/POApprovalModal";
import { fileUploadService } from "@/services/fileUpload";
import { useToast } from "@/hooks/use-toast";
import { generateAndSavePOPDF } from "@/utils/generatePOPDF";
import { warehouseService, Warehouse } from "@/services/warehouses";
import { vendorService, Vendor } from "@/services/vendors";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PODetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canModify } = usePermissions();
  const { user } = useAuth();
  const { toast } = useToast();
  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [approvals, setApprovals] = useState<POApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ url: string; variantName: string; allImages: string[] } | null>(null);
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    const fetchPO = async () => {
      if (!id) {
        console.error("PODetail: No ID provided");
        return;
      }

      // Validate ID is a number
      const poId = parseInt(id);
      if (isNaN(poId)) {
        console.error("PODetail: Invalid ID", id);
        toast({
          title: "Error",
          description: "Invalid purchase order ID",
          variant: "destructive",
        });
        navigate("/purchase-orders");
        return;
      }

      try {
        setLoading(true);
        console.log("PODetail: Fetching PO with ID:", poId);
        
        const [poData, approvalsData] = await Promise.all([
          getPurchaseOrderById(poId),
          getPOApprovals(poId).catch((err) => {
            console.warn("PODetail: Error fetching approvals:", err);
            return [];
          }),
        ]);
        
        console.log("PODetail: PO data received:", poData);
        console.log("PODetail: Approvals data received:", approvalsData);
        
        if (!poData) {
          console.error("PODetail: No PO data returned from API");
          toast({
            title: "Error",
            description: "Purchase order not found",
            variant: "destructive",
          });
          navigate("/purchase-orders");
          return;
        }
        
        setPO(poData);
        setApprovals(approvalsData);
        
        // Also set approvals in PO object for PDF generation
        if (poData) {
          poData.approvals = approvalsData;
        }

        // Fetch warehouse and vendor details for PDF
        if (poData.warehouseId) {
          try {
            const warehouseData = await warehouseService.getWarehouseById(poData.warehouseId);
            setWarehouse(warehouseData);
          } catch (error) {
            console.error("PODetail: Error fetching warehouse:", error);
          }
        }

        if (poData.vendorId) {
          try {
            const vendorData = await vendorService.getVendorById(poData.vendorId);
            setVendor(vendorData);
          } catch (error) {
            console.error("PODetail: Error fetching vendor:", error);
          }
        }
      } catch (error) {
        console.error("PODetail: Error fetching PO:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to load purchase order";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        // Don't navigate away immediately - let user see the error
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchPO();
  }, [id, navigate, toast]);

  const handleApprove = async (isApproved: boolean, comment?: string, signatureUrl?: string) => {
    if (!id) return;
    try {
      setActionLoading(true);
      await approvePO(parseInt(id), {
        isApproved,
        comment,
        signatureUrl,
      });
      
      toast({
        title: "Success",
        description: isApproved ? "PO approved successfully" : "PO rejected",
      });

      // Refresh data
      const [poData, approvalsData] = await Promise.all([
        getPurchaseOrderById(parseInt(id)),
        getPOApprovals(parseInt(id)),
      ]);
      setPO(poData);
      setApprovals(approvalsData);
      if (poData) {
        poData.approvals = approvalsData;
      }
      setShowApprovalModal(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update approval",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      await submitForApproval(parseInt(id));
      toast({
        title: "Success",
        description: "PO submitted for approval successfully. Approvers will be notified via email.",
      });
      // Refresh PO data
      const data = await getPurchaseOrderById(parseInt(id));
      setPO(data);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit PO for approval",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Get latest rejection date for resubmission checks
  const getLatestRejectedDate = (items: POApproval[]) => {
    const rejectedDates = items
      .filter((approval) => approval.status === "Rejected" && approval.rejectedDate)
      .map((approval) => new Date(approval.rejectedDate as string).getTime());
    if (rejectedDates.length === 0) return null;
    return new Date(Math.max(...rejectedDates));
  };

  // Check if PO was edited after last rejection
  const isEditedAfterRejection = (editDate?: string, rejectedDate?: Date | null) => {
    if (!editDate || !rejectedDate) return false;
    return new Date(editDate).getTime() > rejectedDate.getTime();
  };

  const handleSendToVendor = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      await sendPurchaseOrderToVendor(parseInt(id));
      toast({
        title: "Success",
        description: "PO sent to vendor successfully",
      });
      // Refresh PO data
      const updated = await getPurchaseOrderById(parseInt(id));
      setPO(updated);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send PO to vendor",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaymentStatusChange = async (status: string) => {
    if (!id) return;
    try {
      setActionLoading(true);
      const updated = await updatePaymentStatus(parseInt(id), status);
      setPO(updated);
      toast({
        title: "Success",
        description: "Payment status updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update payment status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatStatus = (status: string | null | undefined): string => {
    if (!status) return "";
    // Add space before capital letters (except first one)
    return status.replace(/([A-Z])/g, " $1").trim();
  };

  // Parse variant attributes JSON
  const parseAttributes = (attributesJson: string | null | undefined) => {
    if (!attributesJson) return {};
    try {
      return JSON.parse(attributesJson);
    } catch {
      return {};
    }
  };

  // Get images from attributes
  const getImagesFromAttributes = (attributes: any): string[] => {
    const images: string[] = [];
    
    // Check for 'images' or 'image' field
    if (attributes.images) {
      if (Array.isArray(attributes.images)) {
        images.push(...attributes.images);
      } else if (typeof attributes.images === 'string') {
        try {
          const parsed = JSON.parse(attributes.images);
          if (Array.isArray(parsed)) {
            images.push(...parsed);
          } else {
            images.push(attributes.images);
          }
        } catch {
          images.push(attributes.images);
        }
      }
    }
    
    if (attributes.image && !images.includes(attributes.image)) {
      images.push(attributes.image);
    }
    
    return images.filter(img => img && typeof img === 'string');
  };

  // Get product image (fallback)
  const getProductImage = (productId: number): string | null => {
    // This would need product data, for now return null
    // Can be enhanced to fetch product images if needed
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!po) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Purchase order not found</p>
      </div>
    );
  }

  const canSubmitForApproval = po.status === "Draft" && canModify("PURCHASE_ORDERS");
  const latestRejectedDate = getLatestRejectedDate(approvals);
  const hasEditAfterReject = isEditedAfterRejection(po.editDate, latestRejectedDate);
  const canResubmitForApproval =
    canModify("PURCHASE_ORDERS") && po.status === "Rejected" && hasEditAfterReject;
  const canApprove = po.approvalStatus === "Pending" && canModify("PURCHASE_ORDERS");
  const canSendToVendor = po.status === "Approved" && !po.isSentToVendor && canModify("PURCHASE_ORDERS");
  const canEdit = canModify("PURCHASE_ORDERS"); // Always allow edit if user has modify permissions
  
  // Check if current user has pending approval (only show button to assigned approver)
  const userApproval = approvals.find((a) => a.status === "Pending" && a.userId === user?.id);
  const canReviewAndApprove = !!userApproval && po.status === "PendingApproval";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* <Button variant="ghost" size="sm" onClick={() => navigate("/purchase-orders")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button> */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">{po.poNumber}</h1>
            {/* <p className="text-muted-foreground mt-1">{po.vendorName || "N/A"}</p> */}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Generate PDF: open server PDF if pdfPath exists, else generate from frontend */}
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              if (!po) return;
              try {
                if (po.pdfPath?.trim()) {
                  const url = fileUploadService.getPOPDFUrl(po.pdfPath);
                  const token = localStorage.getItem("auth_token");
                  const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
                  if (!res.ok) throw new Error("Failed to load PDF");
                  const blob = await res.blob();
                  const objectUrl = URL.createObjectURL(blob);
                  window.open(objectUrl, "_blank");
                  setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
                } else {
                  await generateAndSavePOPDF(
                    po,
                    warehouse ? {
                      name: warehouse.name,
                      address: warehouse.address || undefined,
                      city: warehouse.city || undefined,
                      state: warehouse.state || undefined,
                      zipCode: warehouse.zipCode || undefined,
                      country: warehouse.country || undefined,
                      phone: warehouse.contactPhone1 || undefined,
                      contactPerson: warehouse.contactPerson1 || undefined,
                    } : undefined,
                    vendor ? {
                      name: vendor.name,
                      address: vendor.address || undefined,
                      city: vendor.city || undefined,
                      state: vendor.state || undefined,
                      zipCode: vendor.zipCode || undefined,
                      country: vendor.country || undefined,
                      phone: vendor.phone || undefined,
                      contactPerson: vendor.contactPerson || vendor.attention || undefined,
                    } : undefined,
                    approvals
                  );
                }
              } catch (error) {
                console.error("Error with PDF:", error);
                toast({
                  title: "Error",
                  description: "Failed to open/generate PDF. Please try again.",
                  variant: "destructive",
                });
              }
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Generate PDF
          </Button>
          <Badge variant="default">{formatStatus(po.status)}</Badge>
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/purchase-orders/${id}/edit`)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canSubmitForApproval && (
            <Button
              size="sm"
              onClick={handleSubmitForApproval}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4 mr-2" />
                  Submit for Approval
                </>
              )}
            </Button>
          )}
          {canResubmitForApproval && (
            <Button
              size="sm"
              onClick={handleSubmitForApproval}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resubmitting...
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4 mr-2" />
                  Resubmit for Approval
                </>
              )}
            </Button>
          )}
          {canReviewAndApprove && (
            <Button
              size="sm"
              onClick={() => setShowApprovalModal(true)}
              disabled={actionLoading}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Review & Approve
            </Button>
          )}
          {canSendToVendor && (
            <Button size="sm" onClick={handleSendToVendor} disabled={actionLoading}>
              <Send className="h-4 w-4 mr-2" />
              Send to Vendor
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-sm font-medium text-foreground">{formatDate(po.createdDate)}</span>
            </div>
            {po.expectedDeliveryDate && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Expected</span>
                <span className="text-sm font-medium text-foreground">
                  {formatDate(po.expectedDeliveryDate)}
                </span>
              </div>
            )}
            {po.warehouseName && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Warehouse</span>
                <Badge variant="outline">{po.warehouseName}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vendor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm font-medium text-foreground">{po.vendorName || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Value</span>
              <span className="text-sm font-medium text-foreground">{formatCurrency(po.totalValue)}</span>
            </div>
            {po.isVendorAccepted !== undefined && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Vendor Accepted</span>
                <Badge variant={po.isVendorAccepted ? "default" : "destructive"}>
                  {po.isVendorAccepted ? "Yes" : "No"}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Items</span>
              <span className="text-sm font-medium text-foreground">
                {po.lineItems.reduce((acc, item) => acc + item.orderedQuantity, 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Received</span>
              <span className="text-sm font-medium text-green-600">
                {po.lineItems.reduce((acc, item) => acc + item.receivedQuantity, 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pending</span>
              <span className="text-sm font-medium text-yellow-600">
                {po.lineItems.reduce((acc, item) => acc + item.pendingQuantity, 0)}
              </span>
            </div>
            
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Summary
            </CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Payment Status</span>
              {canModify("PURCHASE_ORDERS") ? (
                <Select
                  value={po.paymentStatus || "Pending"}
                  onValueChange={handlePaymentStatusChange}
                  disabled={actionLoading}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Partial">Partial</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline">{formatStatus(po.paymentStatus || "Pending")}</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">{formatCurrency(po.totalValue ?? 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Received Value</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(po.receivedValue ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Deposit</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(po.paymentsTotal ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining Balance</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency((po.totalValue ?? 0) - (po.paymentsTotal ?? 0))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {po.lineItems.map((item) => {
              // Get variant images from attributes
              const variantAttributes = parseAttributes(item.productVariantAttributes);
              const variantImages = getImagesFromAttributes(variantAttributes);
              const firstVariantImage = variantImages.length > 0 ? variantImages[0] : null;
              
              return (
                <div
                  key={item.lineItemId}
                  className="flex justify-between items-center p-4 bg-secondary/50 rounded-lg"
                >
                  <div className="flex-1 flex items-start gap-3">
                    {/* Variant Image Thumbnail */}
                    {firstVariantImage ? (
                      <div className="flex-shrink-0 relative">
                        <button
                          onClick={() => setImagePreview({ 
                            url: firstVariantImage, 
                            variantName: item.productVariantName || item.productName || "Item",
                            allImages: variantImages
                          })}
                          className="flex-shrink-0 hover:opacity-80 transition-opacity"
                          title="Click to preview images"
                        >
                          <img
                            src={firstVariantImage}
                            alt={item.productVariantName || item.productName || "Item"}
                            className="w-16 h-16 object-cover rounded border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </button>
                        {variantImages.length > 1 && (
                          <Badge variant="secondary" className="text-xs absolute -top-1 -right-1">
                            +{variantImages.length - 1}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-16 h-16 bg-muted rounded border flex items-center justify-center">
                        <span className="text-xs text-muted-foreground text-center">No image</span>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.productName || "N/A"}</p>
                      {item.productVariantName && (
                        <p className="text-sm text-primary font-medium mt-1">
                          Variant: {item.productVariantName}
                          {item.productVariantSku && ` (${item.productVariantSku})`}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        SKU: {item.productVariantSku || item.sku || "N/A"}
                      </p>
                    </div>
                  </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Ordered</p>
                    <p className="font-medium text-foreground">{item.orderedQuantity}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Received</p>
                    <p className="font-medium text-green-600">{item.receivedQuantity}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="font-medium text-yellow-600">{item.pendingQuantity}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Unit Price</p>
                    <p className="font-medium">{formatCurrency(item.unitPrice)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-medium">{formatCurrency(item.lineTotal)}</p>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={!!imagePreview} onOpenChange={(open) => !open && setImagePreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{imagePreview?.variantName || "Image Preview"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {imagePreview && (
              <>
                <div className="flex justify-center">
                  <img
                    src={imagePreview.url}
                    alt={imagePreview.variantName}
                    className="max-w-full max-h-96 object-contain rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                {imagePreview.allImages.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                    {imagePreview.allImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setImagePreview({ ...imagePreview, url: img })}
                        className={`border-2 rounded ${
                          img === imagePreview.url ? 'border-primary' : 'border-transparent'
                        } hover:border-primary/50 transition-colors`}
                      >
                        <img
                          src={img}
                          alt={`Image ${idx + 1}`}
                          className="w-full h-20 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Approval Status */}
      {approvals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Approval Status ({approvals.filter(a => a.status === "Approved").length}/{approvals.length} Approved)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {approvals.map((approval) => (
                <div
                  key={approval.poApprovalId}
                  className="p-2 bg-secondary/50 rounded-lg"
                >
                  <p className="text-sm font-medium mb-1">{approval.userName || approval.userEmail || "Unknown"}</p>
                  {approval.comment && (
                    <p className="text-xs text-muted-foreground mb-1 line-clamp-2">{approval.comment}</p>
                  )}
                  {approval.signatureUrl && (
                    <div className="mb-1 inline-block">
                      <img
                        src={fileUploadService.getSignatureUrl(approval.signatureUrl)}
                        alt="Signature"
                        className="max-w-20 max-h-20 w-auto h-auto object-contain border rounded bg-white"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge
                      variant={
                        approval.status === "Approved"
                          ? "default"
                          : approval.status === "Rejected"
                          ? "destructive"
                          : "outline"
                      }
                      className="text-xs"
                    >
                      {formatStatus(approval.status)}
                    </Badge>
                    {approval.approvedDate && (
                      <span className="text-xs text-muted-foreground">
                        {formatDate(approval.approvedDate)}
                      </span>
                    )}
                    {approval.rejectedDate && (
                      <span className="text-xs text-muted-foreground">
                        {formatDate(approval.rejectedDate)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {po.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{po.notes}</p>
          </CardContent>
        </Card>
      )}

      {po.vendorNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vendor Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{po.vendorNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Approval Modal */}
      <POApprovalModal
        open={showApprovalModal}
        onOpenChange={setShowApprovalModal}
        onApprove={handleApprove}
        isApproving={actionLoading}
        initialSignatureUrl={user?.signatureUrl || null}
      />
    </div>
  );
}
