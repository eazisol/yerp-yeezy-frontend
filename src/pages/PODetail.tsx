import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

export default function PODetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canModify } = usePermissions();

  // Mock PO data
  const po = {
    id,
    poNumber: "PO-2024-001",
    vendor: "CN Factory A",
    status: "approved",
    createdDate: "2024-01-10",
    expectedDate: "2024-02-15",
    warehouse: "CN",
    items: [
      { sku: "YZY-SLIDE-BN-42", name: "Yeezy Slide Bone", ordered: 500, received: 500, pending: 0 },
      { sku: "YZY-350-CW-40", name: "Yeezy 350 Cloud White", ordered: 300, received: 150, pending: 150 },
    ],
    totalValue: "$45,000",
  };

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
            <p className="text-muted-foreground mt-1">{po.vendor}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="default">{po.status}</Badge>
          {canModify("PURCHASE_ORDERS") && (
          <Button size="sm">
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
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
              <span className="font-medium text-foreground">{po.createdDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expected</span>
              <span className="font-medium text-foreground">{po.expectedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Warehouse</span>
              <Badge variant="outline">{po.warehouse}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vendor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium text-foreground">{po.vendor}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Value</span>
              <span className="font-medium text-foreground">{po.totalValue}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Items</span>
              <span className="font-medium text-foreground">{po.items.reduce((acc, item) => acc + item.ordered, 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Received</span>
              <span className="font-medium text-success">{po.items.reduce((acc, item) => acc + item.received, 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending</span>
              <span className="font-medium text-warning">{po.items.reduce((acc, item) => acc + item.pending, 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {po.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-4 bg-secondary/50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.sku}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Ordered</p>
                    <p className="font-medium text-foreground">{item.ordered}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Received</p>
                    <p className="font-medium text-success">{item.received}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="font-medium text-warning">{item.pending}</p>
                  </div>
                  {item.pending === 0 ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-warning" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
