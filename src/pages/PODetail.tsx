import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, Loader2, Send, DollarSign, Pencil } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import {
  getPurchaseOrderById,
  approvePurchaseOrder,
  sendPurchaseOrderToVendor,
  updatePaymentStatus,
  PurchaseOrder,
} from "@/services/purchaseOrders";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PODetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canModify } = usePermissions();
  const { toast } = useToast();
  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchPO = async () => {
      if (!id) return;

      // Validate ID is a number
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
        const data = await getPurchaseOrderById(poId);
        setPO(data);
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

    fetchPO();
  }, [id, navigate, toast]);

  const handleApprove = async (isApproved: boolean) => {
    if (!id || !po) return;
    try {
      setActionLoading(true);
      const updated = await approvePurchaseOrder(parseInt(id), {
        isApproved,
        notes: "",
      });
      setPO(updated);
      toast({
        title: "Success",
        description: isApproved ? "PO approved successfully" : "PO rejected",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update PO",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
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

  const canApprove = po.approvalStatus === "Pending" && canModify("PURCHASE_ORDERS");
  const canSendToVendor = po.status === "Approved" && !po.isSentToVendor && canModify("PURCHASE_ORDERS");
  const canEdit = (po.status === "Draft" || po.status === "PendingApproval") && canModify("PURCHASE_ORDERS");

  return (
    <div className="space-y-6">
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
          {canApprove && (
            <>
              <Button
                size="sm"
                onClick={() => handleApprove(true)}
                disabled={actionLoading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleApprove(false)}
                disabled={actionLoading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
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
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium text-foreground">{formatDate(po.createdDate)}</span>
            </div>
            {po.expectedDeliveryDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected</span>
                <span className="font-medium text-foreground">
                  {formatDate(po.expectedDeliveryDate)}
                </span>
              </div>
            )}
            {po.warehouseName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Warehouse</span>
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
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium text-foreground">{po.vendorName || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Value</span>
              <span className="font-medium text-foreground">{formatCurrency(po.totalValue)}</span>
            </div>
            {po.isVendorAccepted !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendor Accepted</span>
                <Badge variant={po.isVendorAccepted ? "default" : "destructive"}>
                  {po.isVendorAccepted ? "Yes" : "No"}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status & Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Items</span>
              <span className="font-medium text-foreground">
                {po.lineItems.reduce((acc, item) => acc + item.orderedQuantity, 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Received</span>
              <span className="font-medium text-green-600">
                {po.lineItems.reduce((acc, item) => acc + item.receivedQuantity, 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending</span>
              <span className="font-medium text-yellow-600">
                {po.lineItems.reduce((acc, item) => acc + item.pendingQuantity, 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Payment Status</span>
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
                <Badge variant="outline">{po.paymentStatus || "Pending"}</Badge>
              )}
            </div>
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
                  <p className="font-medium text-foreground">{item.productName || "N/A"}</p>
                  <p className="text-sm text-muted-foreground">{item.sku || "N/A"}</p>
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
                  {item.pendingQuantity === 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-yellow-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
}
