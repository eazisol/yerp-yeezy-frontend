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
import { useAuth } from "@/contexts/AuthContext";
import { dashboardService, DashboardMetrics } from "@/services/dashboard";
import { useQuery } from "@tanstack/react-query";
import {
  orderTrendData,
  monthlyOrderTrendData,
} from "@/data/mockDashboardData";

export default function Dashboard() {
  const navigate = useNavigate();
  const { canRead, canModify, canAccess } = usePermissions();
  const { user } = useAuth();

  // Fetch dashboard summary first (fast path)
  const { data: dashboardSummaryMetrics, isLoading: loadingSummaryMetrics } = useQuery({
    queryKey: ["dashboard-metrics-summary"],
    queryFn: () => dashboardService.getDashboardSummaryMetrics(),
    enabled: canAccess("DASHBOARD"),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
console.log("dashboard summery ",dashboardSummaryMetrics) 
  // Fetch inventory-heavy metrics after summary (disabled: not called on dashboard)
  const { data: dashboardInventoryMetrics, isLoading: loadingInventoryMetrics } = useQuery({
    queryKey: ["dashboard-metrics-inventory"],
    queryFn: () => dashboardService.getDashboardInventoryMetrics(),
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  // Fetch finance/PO metrics after summary (disabled: not called on dashboard)
  const { data: dashboardFinanceMetrics, isLoading: loadingFinanceMetrics } = useQuery({
    queryKey: ["dashboard-metrics-finance"],
    queryFn: () => dashboardService.getDashboardFinanceMetrics(),
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  // Use only summary metrics (inventory/finance API calls disabled)
  const dashboardMetrics: DashboardMetrics | undefined = (dashboardSummaryMetrics || undefined) as DashboardMetrics | undefined;

  const loadingMetrics = loadingSummaryMetrics;

  // Fetch missing variant SKUs (top 5)
  const { data: missingVariantSkusData, isLoading: loadingMissingVariantSkus } = useQuery({
    queryKey: ["missing-variant-skus", 1, 5],
    queryFn: () => dashboardService.getMissingVariantSkus(1, 5),
    enabled: canAccess("DASHBOARD"),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
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


  const vendorBalanceSummary = dashboardMetrics?.vendorBalanceSummary || {
    pendingAmount: 0,
    paidAmount: 0,
    totalBalance: 0,
  };

  const cnWarehouse = warehouseInventory.find((warehouse) => warehouse.warehouse === "CN");
  const usWarehouse = warehouseInventory.find((warehouse) => warehouse.warehouse === "US");
  const totalInventoryValue = (cnWarehouse?.totalValue || 0) + (usWarehouse?.totalValue || 0);

  // Format currency
  const formatCurrency = (value: number, currency: string = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format number with commas
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Format ISO date string to short date
  const formatShortDate = (value?: string) => {
    if (!value) return "N/A";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "N/A";
    return parsed.toLocaleDateString("en-US");
  };

  // API returns array directly; support both array and paged { data, totalCount } shape
  const missingVariantSkus = Array.isArray(missingVariantSkusData)
    ? missingVariantSkusData
    : (missingVariantSkusData?.data || []);
  const missingVariantSkusTotal = Array.isArray(missingVariantSkusData)
    ? missingVariantSkusData.length
    : (missingVariantSkusData?.totalCount || 0);

  // // Order status breakdown for pie chart
  // const orderStatusChartData = [
  //   { name: "Fulfilled", value: orderStatusBreakdown.fulfilled, color: "hsl(var(--success))" },
  //   { name: "Pending", value: orderStatusBreakdown.pending, color: "hsl(var(--warning))" },
  //   { name: "Partially Shipped", value: orderStatusBreakdown.partiallyShipped, color: "hsl(var(--primary))" },
  // ];

  // Vendor performance chart data
  const vendorPerformanceData = (dashboardMetrics?.vendorPerformance || []).map(v => ({
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

  if (!hasDashboardPermission) {
    const displayName = user?.fullName || user?.email || "there";
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h1 className="text-2xl font-bold text-foreground">Welcome, {displayName}</h1>
              {/* <p className="text-sm text-muted-foreground mt-2">
                Your dashboard access is not enabled yet.
              </p> */}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                {/* <p className={`text-xs mt-1 flex items-center gap-1 ${dailyOrderMetrics.changePercentage >= 0 ? "text-success" : "text-destructive"
                  }`}>
                  {dailyOrderMetrics.changePercentage >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {dailyOrderMetrics.changePercentage >= 0 ? "+" : ""}
                  {dailyOrderMetrics.changePercentage.toFixed(1)}% from yesterday
                </p> */}
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
                {/* <p className={`text-xs mt-1 flex items-center gap-1 ${dailyOrderMetrics.valueChangePercentage >= 0 ? "text-success" : "text-destructive"
                  }`}>
                  {dailyOrderMetrics.valueChangePercentage >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {dailyOrderMetrics.valueChangePercentage >= 0 ? "+" : ""}
                  {dailyOrderMetrics.valueChangePercentage.toFixed(1)}% from yesterday
                </p> */}
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
                  {formatNumber(orderStatusBreakdown.fulfilled)}
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
                  {formatNumber(orderStatusBreakdown.pending)}
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
                  {formatNumber(orderStatusBreakdown.partiallyShipped)}
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
                  {formatNumber(dailyShipments.totalShipments)}
                </div>
                {/* <p className="text-xs text-muted-foreground mt-1">
                  CN: {dailyShipments.cnShipments} | US: {dailyShipments.usShipments}
                </p> */}
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

      {/* Missing Variant SKUs */}
      {canRead("ORDERS") && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Missing Variant SKUs</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Latest SKUs used in orders without a variant
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Total: {formatNumber(missingVariantSkusTotal)}
              </Badge>
            <Button variant="outline" size="sm" onClick={() => navigate("/missing-variant-skus")}>
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loadingMissingVariantSkus ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Loading missing variant SKUs...
                </div>
              ) : missingVariantSkus.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No missing variant SKUs found
                </div>
              ) : (
                missingVariantSkus.map((item, index) => (
                  <div
                    key={`${item.sku}-${index}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-smooth"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {item.sku}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {formatNumber(item.totalUses)} uses
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.productName || "Unknown product"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Variant ID: {item.swellVariantId || "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {item.latestOrderNumber || "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatShortDate(item.latestOrderDate)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
                  <p className="text-sm text-muted-foreground mt-1">Pending vs Paid </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Pending</p>
                      <p className="text-2xl font-bold text-warning">
                        {formatCurrency(vendorBalanceSummary.pendingAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Paid</p>
                      <p className="text-2xl font-bold text-success">
                        {formatCurrency(vendorBalanceSummary.paidAmount)}
                      </p>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">Total Balance</p>
                      <p className="text-xl font-semibold text-foreground">
                        {formatCurrency(vendorBalanceSummary.totalBalance)}
                      </p>
                    </div>
                    {/* {canRead("VENDORS") && (
                      <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/vendors")}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Vendor Details
                      </Button>
                    )} */}
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
                      {formatCurrency(totalInventoryValue)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">CN Warehouse</p>
                      <p className="text-xl font-semibold text-foreground">
                        {formatCurrency(cnWarehouse?.totalValue || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">US Warehouse</p>
                      <p className="text-xl font-semibold text-foreground">
                        {formatCurrency(usWarehouse?.totalValue || 0)}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Live warehouse totals
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
              <Button variant="outline" onClick={() => navigate("/stock-alerts")}>
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
            {/* {canModify("INVENTORY") && (
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Inventory
              </Button>
            )} */}
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
