import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download } from "lucide-react";

export default function GRNDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock GRN data
  const grn = {
    id,
    grnNumber: "GRN-2024-015",
    poNumber: "PO-2024-001",
    vendor: "CN Factory A",
    warehouse: "CN",
    receivedDate: "2024-01-25",
    receivedBy: "Admin User",
    items: [
      { sku: "YZY-SLIDE-BN-42", name: "Yeezy Slide Bone", ordered: 500, received: 500, condition: "Good" },
      { sku: "YZY-350-CW-40", name: "Yeezy 350 Cloud White", ordered: 300, received: 300, condition: "Good" },
    ],
    attachments: [
      { name: "packing-list.pdf", size: "2.4 MB" },
      { name: "invoice.pdf", size: "1.8 MB" },
    ],
  };

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
            <p className="text-muted-foreground mt-1">PO: {grn.poNumber}</p>
          </div>
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
              <span className="font-medium text-foreground">{grn.receivedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Received By</span>
              <span className="font-medium text-foreground">{grn.receivedBy}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Warehouse</span>
              <Badge variant="outline">{grn.warehouse}</Badge>
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
              <span className="font-medium text-foreground">{grn.vendor}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attachments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {grn.attachments.map((file, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{file.size}</p>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Received Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {grn.items.map((item, index) => (
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
                    <p className="text-sm text-muted-foreground">Condition</p>
                    <Badge variant="outline">{item.condition}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
