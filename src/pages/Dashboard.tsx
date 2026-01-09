import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  AlertTriangle,
  Plus,
  Eye,
  RefreshCw,
  CheckCircle,
  Clock,
  Truck,
  Warehouse,
  FileText,
  Users,
  BarChart3,
  PieChart
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { dashboardService, DashboardMetrics } from "@/services/dashboard";
import { useQuery } from "@tanstack/react-query";
import {
  grnStatus,
  vendorBalances,
  vendorPerformance,
  poAging,
  totalInventoryValue,
  orderTrendData,
  monthlyOrderTrendData,
  recentOrders,
} from "@/data/mockDashboardData";

export default function Dashboard() {
  const navigate = useNavigate();
  const { canRead, canModify, canAccess } = usePermissions();

  // Fetch real-time dashboard metrics
  const { data: dashboardMetrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: () => dashboardService.getDashboardMetrics(),
    refetchInterval: 60000, // Refetch every 60 seconds for real-time updates
  });

  // Use real data if available, otherwise use empty defaults
  const dailyOrderMetrics = dashboardMetrics?.dailyOrderMetrics || {
    totalOrders: 0,
    totalOrderValue: 0,
    previousDayOrders: 0,
    previousDayValue: 0,
    changePercentage: 0,
    valueChangePercentage: 0,
  };

  const orderStatusBreakdown = dashboardMetrics?.orderStatusBreakdown || {
    fulfilled: 0,
    pending: 0,
    partiallyShipped: 0,
    total: 0,
  };

  const dailyShipments = dashboardMetrics?.dailyShipments || {
    cnShipments: 0,
    usShipments: 0,
    totalShipments: 0,
    date: new Date().toISOString().split('T')[0],
  };

  const warehouseInventory = dashboardMetrics?.warehouseInventory || [];

  const stockAlerts = dashboardMetrics?.stockAlerts || [];

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format number with commas
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Calculate critical vs low stock counts
  const criticalStockCount = stockAlerts.filter(item => item.status === "critical").length;
  const lowStockCount = stockAlerts.filter(item => item.status === "low").length;

  // Order status breakdown for pie chart
  const orderStatusChartData = [
    { name: "Fulfilled", value: orderStatusBreakdown.fulfilled, color: "hsl(var(--success))" },
    { name: "Pending", value: orderStatusBreakdown.pending, color: "hsl(var(--warning))" },
    { name: "Partially Shipped", value: orderStatusBreakdown.partiallyShipped, color: "hsl(var(--primary))" },
  ];

  // PO Aging chart data
  const poAgingChartData = [
    { name: "0-30 Days", value: poAging.age0to30.value, count: poAging.age0to30.count },
    { name: "31-60 Days", value: poAging.age31to60.value, count: poAging.age31to60.count },
    { name: "61-90 Days", value: poAging.age61to90.value, count: poAging.age61to90.count },
    { name: "90+ Days", value: poAging.age90Plus.value, count: poAging.age90Plus.count },
  ];

  // Vendor performance chart data
  const vendorPerformanceData = vendorPerformance.map(v => ({
    name: v.vendorName.split(' ')[0], // First word only for chart
    performance: v.onTimePercentage,
    deliveries: v.totalDeliveries,
  }));

  // Check if user has any dashboard-related permissions
  const hasOrdersPermission = canRead("ORDERS");
  const hasInventoryPermission = canRead("INVENTORY");
  const hasGrnPermission = canRead("GRN");
  const hasVendorsPermission = canRead("VENDORS");
  const hasPurchaseOrdersPermission = canRead("PURCHASE_ORDERS");
  const hasDashboardPermission = canAccess("DASHBOARD");

  // Check if user has any permission to view dashboard sections
  const hasAnySectionPermission = hasOrdersPermission || hasInventoryPermission || hasGrnPermission || hasVendorsPermission || hasPurchaseOrdersPermission || hasDashboardPermission;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            disabled={loadingMetrics}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingMetrics ? 'animate-spin' : ''}`} />
            {loadingMetrics ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Daily Metrics - Row 1 */}
      {canRead("ORDERS") && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Daily Metrics</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Orders */}
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Orders (Today)
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatNumber(dailyOrderMetrics.totalOrders)}
                </div>
                <p className={`text-xs mt-1 flex items-center gap-1 ${dailyOrderMetrics.changePercentage >= 0 ? "text-success" : "text-destructive"
                  }`}>
                  {dailyOrderMetrics.changePercentage >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {dailyOrderMetrics.changePercentage >= 0 ? "+" : ""}
                  {dailyOrderMetrics.changePercentage.toFixed(1)}% from yesterday
                </p>
              </CardContent>
            </Card>

            {/* Total Order Value */}
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Order Value (Today)
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(dailyOrderMetrics.totalOrderValue)}
                </div>
                <p className={`text-xs mt-1 flex items-center gap-1 ${dailyOrderMetrics.valueChangePercentage >= 0 ? "text-success" : "text-destructive"
                  }`}>
                  {dailyOrderMetrics.valueChangePercentage >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {dailyOrderMetrics.valueChangePercentage >= 0 ? "+" : ""}
                  {dailyOrderMetrics.valueChangePercentage.toFixed(1)}% from yesterday
                </p>
              </CardContent>
            </Card>

            {/* Orders Fulfilled */}
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Orders Fulfilled
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {orderStatusBreakdown.fulfilled}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((orderStatusBreakdown.fulfilled / orderStatusBreakdown.total) * 100).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>

            {/* Orders Pending */}
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Orders Pending
                </CardTitle>
                <Clock className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {orderStatusBreakdown.pending}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((orderStatusBreakdown.pending / orderStatusBreakdown.total) * 100).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Metrics - Row 2 */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-2">
            {/* Partially Shipped */}
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Partially Shipped
                </CardTitle>
                <Truck className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {orderStatusBreakdown.partiallyShipped}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((orderStatusBreakdown.partiallyShipped / orderStatusBreakdown.total) * 100).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>

            {/* CN Shipments */}
            {/* <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CN Shipments (Today)
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {dailyShipments.cnShipments}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((dailyShipments.cnShipments / dailyShipments.totalShipments) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card> */}

            {/* US Shipments */}
            {/* <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              US Shipments (Today)
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {dailyShipments.usShipments}
                </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((dailyShipments.usShipments / dailyShipments.totalShipments) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card> */}

            {/* Total Shipments */}
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Shipments (Today)
                </CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {dailyShipments.totalShipments}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  CN: {dailyShipments.cnShipments} | US: {dailyShipments.usShipments}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Warehouse Inventory Levels */}
      {canRead("INVENTORY") && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Warehouse Inventory Levels</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {warehouseInventory.map((warehouse) => (
              <Card key={warehouse.warehouse} className="card-hover">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Warehouse className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{warehouse.warehouse} Warehouse</CardTitle>
                  </div>
                  <Badge variant="outline">{warehouse.warehouse}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Inventory Value</p>
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(warehouse.totalValue)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total SKUs</p>
                        <p className="text-xl font-semibold text-foreground">
                          {formatNumber(warehouse.totalSKUs)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Units</p>
                        <p className="text-xl font-semibold text-foreground">
                          {formatNumber(warehouse.totalUnits)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Stock Alerts & GRN Status */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Stock Alerts */}
        {canRead("INVENTORY") && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Stock Alerts</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Critical: {criticalStockCount} | Low: {lowStockCount}
                </p>
              </div>
              {canRead("INVENTORY") && (
                <Button variant="outline" size="sm" onClick={() => navigate("/inventory")}>
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stockAlerts.slice(0, 5).map((item) => (
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
                      <p className="text-sm font-medium text-foreground">{item.currentStock} units</p>
                      <p className="text-xs text-muted-foreground">{item.warehouse}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* GRN Status */}
        {canRead("GRN") && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">GRN Status</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Pending: {grnStatus.pending} | Completed: {grnStatus.completed}
                </p>
              </div>
              {canRead("GRN") && (
                <Button variant="outline" size="sm" onClick={() => navigate("/grn")}>
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {grnStatus.recentGRNs.map((grn) => (
                  <div
                    key={grn.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-smooth cursor-pointer"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{grn.grnNumber}</span>
                        <Badge
                          variant={grn.status === "completed" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {grn.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">PO: {grn.poNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{grn.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts Section */}
      {/* <div> */}
      {/* <h2 className="text-xl font-semibold mb-4">Trends & Analytics</h2> */}
      {/* <div className="grid gap-6 md:grid-cols-2"> */}
      {/* Daily Orders Trend */}
      {/* <Card>
            <CardHeader>
              <CardTitle className="text-lg">7-Day Orders Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={orderTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                      name="Orders"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card> */}

      {/* Order Status Breakdown */}
      {/* <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={orderStatusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {orderStatusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card> */}
      {/* </div>
      </div> */}

      {/* Monthly/Strategic Metrics */}
      {(canRead("VENDORS") || canRead("PURCHASE_ORDERS") || canRead("INVENTORY")) && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Monthly / Strategic Metrics</h2>

          {/* Vendor Balance & Performance */}
          {canRead("VENDORS") && (
            <div className="grid gap-6 md:grid-cols-2 mb-6">
              {/* Vendor Balance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vendor Balance Summary</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Pending vs Paid (Manual Updates)</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Pending</p>
                      <p className="text-2xl font-bold text-warning">
                        {formatCurrency(vendorBalances.reduce((sum, v) => sum + v.pendingAmount, 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Paid</p>
                      <p className="text-2xl font-bold text-success">
                        {formatCurrency(vendorBalances.reduce((sum, v) => sum + v.paidAmount, 0))}
                      </p>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">Total Balance</p>
                      <p className="text-xl font-semibold text-foreground">
                        {formatCurrency(vendorBalances.reduce((sum, v) => sum + v.totalBalance, 0))}
                      </p>
                    </div>
                    {canRead("VENDORS") && (
                      <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/vendors")}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Vendor Details
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Vendor Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vendor On-Time Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={vendorPerformanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="name"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          domain={[0, 100]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => `${value.toFixed(1)}%`}
                        />
                        <Bar
                          dataKey="performance"
                          fill="hsl(var(--primary))"
                          name="On-Time %"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* PO Aging & Total Inventory Value */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* PO Aging Report */}
            {canRead("PURCHASE_ORDERS") && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">PO Aging Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={poAgingChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="name"
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
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Bar
                          dataKey="value"
                          fill="hsl(var(--primary))"
                          name="Value"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    {poAgingChartData.map((item) => (
                      <div key={item.name} className="flex justify-between">
                        <span className="text-muted-foreground">{item.name}:</span>
                        <span className="font-medium">{item.count} POs</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Total Inventory Value */}
            {canRead("INVENTORY") && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Inventory Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Value</p>
                      <p className="text-3xl font-bold text-foreground">
                        {formatCurrency(totalInventoryValue.totalValue)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">CN Warehouse</p>
                        <p className="text-xl font-semibold text-foreground">
                          {formatCurrency(totalInventoryValue.cnValue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">US Warehouse</p>
                        <p className="text-xl font-semibold text-foreground">
                          {formatCurrency(totalInventoryValue.usValue)}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <p className={`text-xs flex items-center gap-1 ${totalInventoryValue.changePercentage >= 0 ? "text-success" : "text-destructive"
                        }`}>
                        {totalInventoryValue.changePercentage >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {totalInventoryValue.changePercentage >= 0 ? "+" : ""}
                        {totalInventoryValue.changePercentage.toFixed(1)}% from last month
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Monthly Orders Trend */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Orders Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyOrderTrendData}>
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
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                  name="Orders"
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--success))", r: 4 }}
                  name="Value ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card> */}

      {/* Recent Orders */}
      {canRead("ORDERS") && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Orders</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Latest customer orders</p>
            </div>
            {canRead("ORDERS") && (
              <Button variant="outline" size="sm" onClick={() => navigate("/orders")}>
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            )}
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
                        order.status === "fulfilled"
                          ? "default"
                          : order.status === "processing"
                            ? "secondary"
                            : order.status === "partiallyShipped"
                              ? "outline"
                              : "outline"
                      }
                      className="text-xs mt-1"
                    >
                      {order.status === "partiallyShipped" ? "Partially Shipped" : order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {canAccess("PURCHASE_ORDERS") && (
              <Button onClick={() => navigate("/purchase-orders")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Purchase Order
              </Button>
            )}
            {canRead("INVENTORY") && (
              <Button variant="outline" onClick={() => navigate("/inventory")}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                View Low Stock Items
              </Button>
            )}
            {canRead("GRN") && (
              <Button variant="outline" onClick={() => navigate("/grn")}>
                <FileText className="h-4 w-4 mr-2" />
                View GRN
              </Button>
            )}
            {canModify("INVENTORY") && (
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Inventory
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* No Data Message - Show if user has DASHBOARD permission but no section permissions */}
      {hasDashboardPermission && !hasAnySectionPermission && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">You have Dashboard access, but you need specific permissions to view data.</p>
              <p className="text-sm text-muted-foreground">Please contact your administrator to grant permissions for Orders, Inventory, GRN, Vendors, or Purchase Orders.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
