import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock order data
  const order = {
    id,
    orderId: "#ORD-1284",
    customer: "John Smith",
    email: "john@example.com",
    value: "$489",
    status: "shipped",
    route: "CN",
    items: [
      { sku: "YZY-SLIDE-BN-42", name: "Yeezy Slide Bone", qty: 1, price: "$89.99" },
      { sku: "YZY-350-CW-40", name: "Yeezy 350 Cloud White", qty: 2, price: "$199.99" },
    ],
    shippingAddress: "123 Main St, New York, NY 10001",
    trackingNumber: "1Z999AA10123456784",
    createdAt: "2024-01-15",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/orders")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Order {order.orderId}</h1>
            <p className="text-muted-foreground mt-1">{order.customer}</p>
          </div>
        </div>
        <Badge variant="default">{order.status}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium text-foreground">{order.customer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium text-foreground">{order.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Date</span>
              <span className="font-medium text-foreground">{order.createdAt}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Shipping Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Route</span>
              <Badge variant="outline">{order.route}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tracking Number</span>
              <span className="font-medium text-foreground text-sm">{order.trackingNumber}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Shipping Address</span>
              <p className="font-medium text-foreground mt-1">{order.shippingAddress}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.sku}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">{item.price}</p>
                  <p className="text-sm text-muted-foreground">Qty: {item.qty}</p>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-lg font-semibold text-foreground">Total</span>
              <span className="text-lg font-semibold text-foreground">{order.value}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
