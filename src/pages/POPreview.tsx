import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, Loader2, DollarSign, Users } from "lucide-react";
import {
  getPurchaseOrderById,
  PurchaseOrder,
} from "@/services/purchaseOrders";
import { approvePO, getPOApprovals, POApproval } from "@/services/poApprovals";
import { useToast } from "@/hooks/use-toast";
import POApprovalModal from "@/components/POApprovalModal";
import { fileUploadService } from "@/services/fileUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function POPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [approvals, setApprovals] = useState<POApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ url: string; variantName: string; allImages: string[] } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      const poId = parseInt(id);
      if (isNaN(poId)) {
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
        const [poData, approvalsData] = await Promise.all([
          getPurchaseOrderById(poId),
          getPOApprovals(poId),
        ]);
        setPO(poData);
        setApprovals(approvalsData);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load purchase order",
          variant: "destructive",
        });
        navigate("/purchase-orders");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
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

  // Check if current user has pending approval
  const userApproval = approvals.find((a) => a.status === "Pending");
  const canApprove = !!userApproval && po.status === "PendingApproval";

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/purchase-orders")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{po.poNumber}</h1>
            <p className="text-muted-foreground mt-1">{po.vendorName || "N/A"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="default">{po.status}</Badge>
          {canApprove && (
            <Button
              size="sm"
              onClick={() => setShowApprovalModal(true)}
              disabled={actionLoading}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Review & Approve
            </Button>
          )}
        </div>
      </div>

      {/* Approval Status */}
      {approvals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Approval Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {approvals.map((approval) => (
                <div
                  key={approval.poApprovalId}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{approval.userName || approval.userEmail || "Unknown"}</p>
                    {approval.comment && (
                      <p className="text-sm text-muted-foreground mt-1">{approval.comment}</p>
                    )}
                    {approval.signatureUrl && (
                      <img
                        src={fileUploadService.getSignatureUrl(approval.signatureUrl)}
                        alt="Signature"
                        className="mt-2 max-w-xs h-auto border rounded"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        approval.status === "Approved"
                          ? "default"
                          : approval.status === "Rejected"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {approval.status}
                    </Badge>
                    {approval.approvedDate && (
                      <span className="text-sm text-muted-foreground">
                        {formatDate(approval.approvedDate)}
                      </span>
                    )}
                    {approval.rejectedDate && (
                      <span className="text-sm text-muted-foreground">
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

      {/* PO Details - Similar to PODetail but simplified */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">{formatDate(po.createdDate)}</span>
            </div>
            {po.expectedDeliveryDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected</span>
                <span className="font-medium">{formatDate(po.expectedDeliveryDate)}</span>
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
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{po.vendorName || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Value</span>
              <span className="font-medium">{formatCurrency(po.totalValue)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge>{po.status}</Badge>
            </div>
            {po.approvalStatus && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Approval</span>
                <Badge variant="outline">{po.approvalStatus}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">{formatCurrency(po.totalValue)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Received Value</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(po.receivedValue)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining Balance</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency(po.remainingBalance)}
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
                      <div className="flex-shrink-0">
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
                          <Badge variant="secondary" className="text-xs mt-1 block text-center">
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
                      <p className="text-sm text-muted-foreground">Quantity</p>
                      <p className="font-medium">{item.orderedQuantity}</p>
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

      {/* Approval Modal */}
      <POApprovalModal
        open={showApprovalModal}
        onOpenChange={setShowApprovalModal}
        onApprove={handleApprove}
        isApproving={actionLoading}
      />
    </div>
  );
}

