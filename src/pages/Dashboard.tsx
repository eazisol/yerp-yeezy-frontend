import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  AlertTriangle,
  Plus,
  Eye,
  RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";

const orderTrendData = [
  { month: "Jan", orders: 820 },
  { month: "Feb", orders: 950 },
  { month: "Mar", orders: 1100 },
  { month: "Apr", orders: 1050 },
  { month: "May", orders: 1200 },
  { month: "Jun", orders: 1284 },
];

const kpiData = [
  {
    title: "Total Orders",
    value: "1,284",
    change: "+12.5%",
    trend: "up",
    icon: TrendingUp,
  },
  {
    title: "Order Value",
    value: "$248,392",
    change: "+8.2%",
    trend: "up",
    icon: DollarSign,
  },
  {
    title: "CN Shipments",
    value: "642",
    change: "+5.1%",
    trend: "up",
    icon: Package,
  },
  {
    title: "US Shipments",
    value: "587",
    change: "+15.3%",
    trend: "up",
    icon: Package,
  },
];

const lowStockItems = [
  { sku: "YZY-SLIDE-BN-42", name: "Yeezy Slide Bone", stock: 12, warehouse: "CN", status: "critical" },
  { sku: "YZY-350-CW-40", name: "Yeezy 350 Cloud White", stock: 28, warehouse: "US", status: "low" },
  { sku: "YZY-700-WR-43", name: "Yeezy 700 Wave Runner", stock: 18, warehouse: "CN", status: "critical" },
  { sku: "YZY-FOAM-MXT-39", name: "Yeezy Foam Runner MXT", stock: 35, warehouse: "US", status: "low" },
];

const recentOrders = [
  { id: "#ORD-1284", customer: "John Smith", value: "$489", status: "shipped", route: "CN" },
  { id: "#ORD-1283", customer: "Emma Wilson", value: "$712", status: "processing", route: "US" },
  { id: "#ORD-1282", customer: "Michael Brown", value: "$298", status: "shipped", route: "Mixed" },
  { id: "#ORD-1281", customer: "Sarah Davis", value: "$1,024", status: "pending", route: "CN" },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your Yeezy Global operations</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync with Swell
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title} className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
              <p className="text-xs text-success mt-1">{kpi.change} from last month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Orders Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={orderTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Shipment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Shipment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-sm text-foreground">China (CN)</span>
                </div>
                <span className="text-sm font-medium text-foreground">642 orders</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "52%" }} />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-accent-foreground" />
                  <span className="text-sm text-foreground">United States (US)</span>
                </div>
                <span className="text-sm font-medium text-foreground">587 orders</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-accent-foreground" style={{ width: "48%" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts & Recent Orders */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Low Stock Alerts</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Items requiring reorder</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/inventory")}>
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.map((item) => (
                <div
                  key={item.sku}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-smooth cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{item.sku}</span>
                      <Badge
                        variant={item.status === "critical" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{item.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{item.stock} units</p>
                    <p className="text-xs text-muted-foreground">{item.warehouse}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Orders</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Latest customer orders</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/orders")}>
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-smooth cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{order.id}</span>
                      <Badge variant="outline" className="text-xs">
                        {order.route}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{order.value}</p>
                    <Badge
                      variant={
                        order.status === "shipped"
                          ? "default"
                          : order.status === "processing"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-xs mt-1"
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate("/purchase-orders")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Purchase Order
            </Button>
            <Button variant="outline" onClick={() => navigate("/inventory")}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              View Low Stock Items
            </Button>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Inventory
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
