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

export default function POPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [approvals, setApprovals] = useState<POApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

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
            {po.lineItems.map((item) => (
              <div
                key={item.lineItemId}
                className="flex justify-between items-center p-4 bg-secondary/50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{item.productName || "N/A"}</p>
                  <p className="text-sm text-muted-foreground">{item.sku || "N/A"}</p>
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
            ))}
          </div>
        </CardContent>
      </Card>

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

