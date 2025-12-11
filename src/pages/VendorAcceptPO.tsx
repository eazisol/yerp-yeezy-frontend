import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { apiClient, API_URL } from "@/services/api";
import { PurchaseOrder } from "@/services/purchaseOrders";

export default function VendorAcceptPO() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Token is required");
      setLoading(false);
      return;
    }

    // Fetch PO by token (no auth required)
    const fetchPO = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/VendorAcceptance/po-by-token?token=${token}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            message: "Failed to load purchase order",
          }));
          throw new Error(errorData.message || "Failed to load purchase order");
        }

        const data = await response.json();
        setPO(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load purchase order");
      } finally {
        setLoading(false);
      }
    };

    fetchPO();
  }, [token]);

  const handleAccept = async (isAccepted: boolean) => {
    if (!token) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/api/VendorAcceptance/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            isAccepted,
            notes: notes.trim() || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: "Failed to process acceptance",
        }));
        throw new Error(errorData.message || "Failed to process acceptance");
      }

      setSuccess(true);
      if (po) {
        setPO({
          ...po,
          isVendorAccepted: isAccepted,
          vendorNotes: notes.trim() || undefined,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process acceptance");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading purchase order...</p>
        </div>
      </div>
    );
  }

  if (error && !po) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!po) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl">{po.poNumber}</CardTitle>
                <p className="text-muted-foreground mt-1">
                  Vendor: {po.vendorName}
                </p>
              </div>
              <Badge
                variant={
                  success
                    ? po.isVendorAccepted
                      ? "default"
                      : "destructive"
                    : "outline"
                }
              >
                {success
                  ? po.isVendorAccepted
                    ? "Accepted"
                    : "Rejected"
                  : po.status}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Success Message */}
        {success && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <p className="font-medium">
                  {po.isVendorAccepted
                    ? "Purchase order accepted successfully!"
                    : "Purchase order rejected."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="h-5 w-5" />
                <p className="font-medium">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PO Details */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Value</span>
                <span className="font-medium">
                  ${po.totalValue.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              {po.expectedDeliveryDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected Delivery</span>
                  <span className="font-medium">
                    {new Date(po.expectedDeliveryDate).toLocaleDateString()}
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
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline">{po.status}</Badge>
              </div>
              {po.paymentStatus && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Status</span>
                  <Badge variant="outline">{po.paymentStatus}</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">{item.sku}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Ordered</p>
                      <p className="font-medium">{item.orderedQuantity}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Unit Price</p>
                      <p className="font-medium">
                        ${item.unitPrice.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-medium">
                        ${item.lineTotal.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
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
              <p className="text-muted-foreground">{po.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Acceptance Form */}
        {!success && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Accept or Reject Purchase Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Notes (Optional)
                </label>
                <Textarea
                  placeholder="Add any notes or comments..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={() => handleAccept(true)}
                  disabled={submitting}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept PO
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleAccept(false)}
                  disabled={submitting}
                  variant="destructive"
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject PO
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
