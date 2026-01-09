import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Save, Key, Building2, Truck, Bell } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your ERP system</p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="api" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="api" className="gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="warehouses" className="gap-2">
            <Building2 className="h-4 w-4" />
            Warehouses
          </TabsTrigger>
          <TabsTrigger value="couriers" className="gap-2">
            <Truck className="h-4 w-4" />
            Couriers
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Swell API Configuration</CardTitle>
              <CardDescription>
                Connect your Swell e-commerce platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="swell-store">Store ID</Label>
                <Input id="swell-store" placeholder="your-store-id" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="swell-key">Secret Key</Label>
                <Input id="swell-key" type="password" placeholder="••••••••••••••••" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Connection Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Current status of Swell integration
                  </p>
                </div>
                <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
                  Connected
                </Badge>
              </div>
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Courier API Configuration</CardTitle>
              <CardDescription>
                Configure YunExpress and 33 Degrees integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">YunExpress (China)</h4>
                <div className="space-y-2">
                  <Label htmlFor="yun-key">API Key</Label>
                  <Input id="yun-key" type="password" placeholder="••••••••••••••••" />
                </div>
                <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
                  Connected
                </Badge>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">33 Degrees (US)</h4>
                <div className="space-y-2">
                  <Label htmlFor="33d-key">API Key</Label>
                  <Input id="33d-key" type="password" placeholder="••••••••••••••••" />
                </div>
                <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
                  Connected
                </Badge>
              </div>

              <Button>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Warehouses Tab */}
        <TabsContent value="warehouses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Locations</CardTitle>
              <CardDescription>
                Manage your warehouse network
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "China Warehouse", location: "Guangzhou, China", status: "active" },
                { name: "US Fulfillment Center", location: "Los Angeles, CA", status: "active" },
              ].map((warehouse) => (
                <div
                  key={warehouse.name}
                  className="flex items-center justify-between p-4 rounded-lg border bg-secondary/50"
                >
                  <div>
                    <h4 className="font-medium">{warehouse.name}</h4>
                    <p className="text-sm text-muted-foreground">{warehouse.location}</p>
                  </div>
                  <Badge variant="default">active</Badge>
                </div>
              ))}
              <Button variant="outline">
                <Building2 className="h-4 w-4 mr-2" />
                Add Warehouse
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Couriers Tab */}
        <TabsContent value="couriers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Partners</CardTitle>
              <CardDescription>
                Configure your courier integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "YunExpress", region: "China", status: "active" },
                { name: "33 Degrees", region: "United States", status: "active" },
              ].map((courier) => (
                <div
                  key={courier.name}
                  className="flex items-center justify-between p-4 rounded-lg border bg-secondary/50"
                >
                  <div>
                    <h4 className="font-medium">{courier.name}</h4>
                    <p className="text-sm text-muted-foreground">{courier.region}</p>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
                    {courier.status}
                  </Badge>
                </div>
              ))}
              <Button variant="outline">
                <Truck className="h-4 w-4 mr-2" />
                Add Courier
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage your notification settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { id: "low-stock", label: "Low Stock Alerts", description: "Get notified when inventory is low" },
                { id: "new-orders", label: "New Orders", description: "Notification for new customer orders" },
                { id: "po-approval", label: "PO Approval Required", description: "When a purchase order needs approval" },
                { id: "grn-received", label: "GRN Received", description: "When goods are received at warehouse" },
                { id: "shipment-updates", label: "Shipment Updates", description: "Track shipment status changes" },
              ].map((notification) => (
                <div key={notification.id} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor={notification.id}>{notification.label}</Label>
                    <p className="text-sm text-muted-foreground">{notification.description}</p>
                  </div>
                  <Switch id={notification.id} defaultChecked />
                </div>
              ))}
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
