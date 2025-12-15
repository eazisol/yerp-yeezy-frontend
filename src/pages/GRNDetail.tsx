import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Loader2, Pencil, File } from "lucide-react";
import { getGRNById, GRN } from "@/services/grn";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { getFileDownloadUrl } from "@/services/fileUpload";

export default function GRNDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canModify } = usePermissions();
  const [grn, setGRN] = useState<GRN | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGRN = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getGRNById(parseInt(id));
        setGRN(data);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load GRN",
          variant: "destructive",
        });
        navigate("/grn");
      } finally {
        setLoading(false);
      }
    };

    fetchGRN();
  }, [id, navigate, toast]);

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

  if (!grn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">GRN not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/grn")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{grn.grnNumber}</h1>
            <p className="text-muted-foreground mt-1">
              PO:{" "}
              <Button
                variant="link"
                className="h-auto p-0 text-primary"
                onClick={() => navigate(`/purchase-orders/${grn.purchaseOrderId}`)}
              >
                {grn.poNumber || `PO-${grn.purchaseOrderId}`}
              </Button>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {canModify("GRN") && (
            <Button
              variant="outline"
              onClick={() => navigate(`/grn/${id}/edit`)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {grn.attachmentPath && (
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Attachment
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Receipt Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Received Date</span>
              <span className="font-medium text-foreground">{formatDate(grn.receivedDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Received By</span>
              <span className="font-medium text-foreground">{grn.receivedBy || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Warehouse</span>
              <Badge variant="outline">{grn.warehouseName || "N/A"}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline">{grn.status || "N/A"}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Purchase Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">PO Number</span>
              <Button
                variant="link"
                className="h-auto p-0 text-primary font-medium"
                onClick={() => navigate(`/purchase-orders/${grn.purchaseOrderId}`)}
              >
                {grn.poNumber || `PO-${grn.purchaseOrderId}`}
              </Button>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Items</span>
              <span className="font-medium text-foreground">{grn.lineItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Quantity</span>
              <span className="font-medium text-foreground">
                {grn.lineItems.reduce((sum, item) => sum + item.receivedQuantity, 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Received Value</span>
              <span className="font-medium text-green-600">
                {formatCurrency(grn.totalReceivedValue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created Date</span>
              <span className="font-medium text-foreground">{formatDate(grn.createdDate)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Received Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {grn.lineItems.map((item) => (
              <div
                key={item.grnLineItemId}
                className="flex justify-between items-center p-4 bg-secondary/50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.productName || "N/A"}</p>
                  <p className="text-sm text-muted-foreground">{item.sku || "N/A"}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Received Qty</p>
                    <p className="font-medium text-green-600">{item.receivedQuantity}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Unit Price</p>
                    <p className="font-medium">{formatCurrency(item.unitPrice)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Line Total</p>
                    <p className="font-medium">{formatCurrency(item.lineTotal)}</p>
                  </div>
                  {item.condition && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Condition</p>
                      <Badge variant="outline">{item.condition}</Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {grn.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{grn.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Attachments */}
      {grn.attachments && grn.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Proof Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {grn.attachments.map((attachment) => (
                <div
                  key={attachment.attachmentId}
                  className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <File className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{attachment.fileName || "Attachment"}</p>
                      {attachment.fileSize && (
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(attachment.fileSize)}
                        </p>
                      )}
                      {attachment.description && (
                        <p className="text-xs text-muted-foreground mt-1">{attachment.description}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Open attachment download URL
                      const downloadUrl = getFileDownloadUrl(attachment.filePath);
                      window.open(downloadUrl, "_blank");
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Format file size helper
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
