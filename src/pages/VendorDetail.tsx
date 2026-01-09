import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Mail, Phone, MapPin } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

export default function VendorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canModify, canDelete } = usePermissions();

  // Mock vendor data
  const vendor = {
    id,
    name: "CN Factory A",
    location: "Guangzhou, China",
    contact: "Wei Zhang",
    email: "wei@cnfactorya.com",
    phone: "+86 20 1234 5678",
    rating: 4.8,
    onTimeDelivery: "95%",
    avgLeadTime: "30 days",
    totalOrders: 45,
    activeOrders: 3,
    performance: [
      { metric: "Quality Score", value: "4.9/5" },
      { metric: "Response Time", value: "2 hours" },
      { metric: "Defect Rate", value: "0.5%" },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/vendors")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{vendor.name}</h1>
            <p className="text-muted-foreground mt-1">{vendor.location}</p>
          </div>
        </div>
        {canModify("VENDORS") && (
          <Button size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{vendor.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{vendor.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{vendor.location}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Orders</span>
              <span className="font-medium text-foreground">{vendor.totalOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Orders</span>
              <Badge variant="outline">{vendor.activeOrders}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Lead Time</span>
              <span className="font-medium text-foreground">{vendor.avgLeadTime}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rating</span>
              <span className="font-medium text-foreground">{vendor.rating}/5.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">On-Time Delivery</span>
              <span className="font-medium text-success">{vendor.onTimeDelivery}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {vendor.performance.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                <span className="text-foreground">{item.metric}</span>
                <span className="font-medium text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
