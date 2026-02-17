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
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardService, DashboardMetrics } from "@/services/dashboard";
import { useQuery } from "@tanstack/react-query";
import {
  orderTrendData,
  monthlyOrderTrendData,
} from "@/data/mockDashboardData";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type MetricsPeriod = "daily" | "weekly" | "yearly" | "custom";

// Default custom range: today
function getTodayYyyyMmDd() {
  return new Date().toISOString().slice(0, 10);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { canRead, canModify, canAccess } = usePermissions();
  const { user } = useAuth();
  const [metricsPeriod, setMetricsPeriod] = useState<MetricsPeriod>("daily");
  const today = getTodayYyyyMmDd();
  const [customStartDate, setCustomStartDate] = useState(today);
  const [customEndDate, setCustomEndDate] = useState(today);
  // Applied range (used for API) — updated when user clicks Apply
  const [appliedCustomStart, setAppliedCustomStart] = useState(today);
  const [appliedCustomEnd, setAppliedCustomEnd] = useState(today);

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

  // Period metrics for the 10 combined cards (daily, weekly, yearly, or custom). Custom uses applied range (set by Apply).
  const appliedRangeValid = metricsPeriod !== "custom" || (appliedCustomStart && appliedCustomEnd && appliedCustomStart <= appliedCustomEnd);
  const { data: periodMetrics, isLoading: loadingPeriodMetrics } = useQuery({
    queryKey: ["dashboard-period-metrics", metricsPeriod, metricsPeriod === "custom" ? appliedCustomStart : "", metricsPeriod === "custom" ? appliedCustomEnd : ""],
    queryFn: () =>
      metricsPeriod === "custom"
        ? dashboardService.getPeriodMetrics("custom", appliedCustomStart, appliedCustomEnd)
        : dashboardService.getPeriodMetrics(metricsPeriod),
    enabled: canAccess("DASHBOARD") && canRead("ORDERS") && (metricsPeriod !== "custom" || appliedRangeValid),
    staleTime: 60 * 1000,
  });

  const handleApplyCustomRange = () => {
    if (customStartDate && customEndDate && customStartDate <= customEndDate) {
      setAppliedCustomStart(customStartDate);
      setAppliedCustomEnd(customEndDate);
    }
  };

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

      {/* Order & Sales Metrics — 10 combined cards with Daily / Weekly filter */}
      {canRead("ORDERS") && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold">
              {metricsPeriod === "daily" ? "Daily Metrics" : metricsPeriod === "weekly" ? "Week's Metrics" : metricsPeriod === "yearly" ? "Year's Metrics" : "Custom Range"}
            </h2>
            <Tabs value={metricsPeriod} onValueChange={(v) => setMetricsPeriod(v as MetricsPeriod)}>
              <TabsList>
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="yearly">Yearly</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {metricsPeriod === "custom" && (
            <div className="flex flex-wrap items-center gap-4 mb-4 p-3 rounded-lg bg-muted/50">
              <label className="text-sm font-medium text-muted-foreground">Start date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              />
              <label className="text-sm font-medium text-muted-foreground">End date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              />
              <Button
                type="button"
                onClick={handleApplyCustomRange}
                disabled={!customStartDate || !customEndDate || customStartDate > customEndDate}
              >
                Apply
              </Button>
              {customStartDate && customEndDate && customStartDate > customEndDate && (
                <span className="text-sm text-destructive">Start must be before end</span>
              )}
            </div>
          )}
          {metricsPeriod === "custom" && !appliedRangeValid ? (
            <div className="text-center py-8 text-muted-foreground">Select a valid date range and click Apply.</div>
          ) : loadingPeriodMetrics ? (
            <div className="text-center py-8 text-muted-foreground">Loading metrics...</div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {/* 1. Total Orders */}
                <Card className="card-hover">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Orders
                    </CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {formatNumber(periodMetrics?.totalOrders ?? 0)}
                    </div>
                  </CardContent>
                </Card>
                {/* 2. Total Order Value */}
                <Card className="card-hover">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Order Value
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {formatCurrency(periodMetrics?.totalOrderValue ?? 0)}
                    </div>
                  </CardContent>
                </Card>
                {/* 3. Shipping Collected */}
                <Card className="card-hover">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Shipping $ Collected
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-success" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {formatCurrency(periodMetrics?.shippingCollected ?? 0)}
                    </div>
                  </CardContent>
                </Card>
                {/* 4. Tax Collected */}
                <Card className="card-hover">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Tax $ Collected
                    </CardTitle>
                    <Clock className="h-4 w-4 text-warning" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {formatCurrency(periodMetrics?.taxCollected ?? 0)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(periodMetrics?.taxPercentOfTotal ?? 0).toFixed(1)}% of total
                    </p>
                  </CardContent>
                </Card>
                {/* 5. Refunds */}
                <Card className="card-hover">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Refunds $ 
                    </CardTitle>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {periodMetrics?.refunds != null && periodMetrics.refunds > 0
                        ? formatCurrency(periodMetrics.refunds)
                        : "–"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(periodMetrics?.refundsPercentOfTotal ?? 0).toFixed(1)}% of total
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mt-4">
                {/* 6. Net Sales */}
                <Card className="card-hover">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Net Sales
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {periodMetrics?.netSales != null && periodMetrics.netSales > 0
                        ? formatCurrency(periodMetrics.netSales)
                        : "–"}
                    </div>
                    {metricsPeriod !== "daily" && (
                      <p className={`text-xs mt-1 ${typeof periodMetrics?.netSalesVsPriorPercent === "number" ? (periodMetrics.netSalesVsPriorPercent >= 0 ? "text-green-600" : "text-red-600") : "text-muted-foreground"}`}>
                        {metricsPeriod === "yearly" ? "Vs prior yr " : metricsPeriod === "custom" ? "Vs prior period " : "Vs prior wk "}
                        {typeof periodMetrics?.netSalesVsPriorPercent === "number"
                          ? (periodMetrics.netSalesVsPriorPercent >= 0 ? "+" : "") + periodMetrics.netSalesVsPriorPercent.toFixed(1) + "%"
                          : "No prior data"}
                      </p>
                    )}
                  </CardContent>
                </Card>
                {/* 7. Total Orders Marked Fulfilled */}
                <Card className="card-hover">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Orders Marked Fulfilled
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-success" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {formatNumber(periodMetrics?.totalOrdersFulfilled ?? 0)}
                    </div>
                    {(metricsPeriod === "weekly" || metricsPeriod === "yearly" || metricsPeriod === "custom") && (
                      <p className={`text-xs mt-1 ${typeof periodMetrics?.totalOrdersFulfilledVsPriorPercent === "number" ? "text-red-600" : "text-muted-foreground"}`}>
                        {metricsPeriod === "yearly" ? "Vs prior yr " : metricsPeriod === "custom" ? "Vs prior period " : "Vs prior wk "}
                        {typeof periodMetrics?.totalOrdersFulfilledVsPriorPercent === "number"
                          ? (periodMetrics.totalOrdersFulfilledVsPriorPercent >= 0 ? "+" : "") + periodMetrics.totalOrdersFulfilledVsPriorPercent.toFixed(1) + "%"
                          : "No prior data"}
                      </p>
                    )}
                  </CardContent>
                </Card>
                {/* 8. Total Orders Partially Shipped */}
                <Card className="card-hover">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Orders Partially Shipped
                    </CardTitle>
                    <Truck className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {formatNumber(periodMetrics?.totalOrdersPartiallyShipped ?? 0)}
                    </div>
                    {(metricsPeriod === "weekly" || metricsPeriod === "yearly" || metricsPeriod === "custom") && (
                      <p className={`text-xs mt-1 ${typeof periodMetrics?.totalOrdersPartiallyShippedVsPriorPercent === "number" ? "text-red-600" : "text-muted-foreground"}`}>
                        {metricsPeriod === "yearly" ? "Vs prior yr " : metricsPeriod === "custom" ? "Vs prior period " : "Vs prior wk "}
                        {typeof periodMetrics?.totalOrdersPartiallyShippedVsPriorPercent === "number"
                          ? (periodMetrics.totalOrdersPartiallyShippedVsPriorPercent >= 0 ? "+" : "") + periodMetrics.totalOrdersPartiallyShippedVsPriorPercent.toFixed(1) + "%"
                          : "No prior data"}
                      </p>
                    )}
                  </CardContent>
                </Card>
                {/* 9. Average Days to Ship */}
                <Card className="card-hover">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Average Days to Ship
                    </CardTitle>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {(periodMetrics?.averageDaysToShip ?? 0).toFixed(1)}
                    </div>
                  </CardContent>
                </Card>
                {/* 10. Order Backlog Weekly Average */}
                <Card className="card-hover">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Order Backlog
                    </CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {formatNumber(periodMetrics?.orderBacklogWeeklyAverage ?? 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* Warehouse Inventory Levels */}
      {canRead("INVENTORY") && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Warehouse Inventory Levels</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Total Inventory Value - combined across warehouses */}
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Total Inventory Value</CardTitle>
                </div>
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
                    <p className="text-xs text-muted-foreground">Live warehouse totals</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
