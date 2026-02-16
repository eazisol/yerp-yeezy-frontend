import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Truck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Warehouse,
  FileText,
  BarChart3,
  Eye,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { kpiService } from "@/services/kpi";
import { dashboardService } from "@/services/dashboard";
import { useQuery } from "@tanstack/react-query";

// Role-based view types
type KPIViewType = "executive" | "ops" | "merch";

// Helper function to determine view based on user roles
const getViewFromRoles = (roles: string[]): KPIViewType => {
  if (roles.includes("ADMIN") || roles.includes("EXECUTIVE")) {
    return "executive";
  }
  if (roles.includes("LOGISTICS_MANAGER") || roles.includes("WAREHOUSE_INCHARGE")) {
    return "ops";
  }
  if (roles.includes("PROCUREMENT_MANAGER")) {
    return "merch";
  }
  // Default to executive view
  return "executive";
};

export default function KPI() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { roles, isAdmin, canAccess, canRead } = usePermissions();
  
  // Auto-detect view based on user role, but allow manual override
  const userView = getViewFromRoles(roles || []);
  const [selectedRole, setSelectedRole] = useState<KPIViewType>(userView);
  
  // Update selectedRole when user changes
  useEffect(() => {
    if (user && roles && roles.length > 0) {
      const detectedView = getViewFromRoles(roles);
      setSelectedRole(detectedView);
    }
  }, [user, roles]);

  // Core KPI metrics (5 fields, optimized) - loads first for fast initial paint
  const { data: kpiCore } = useQuery({
    queryKey: ["kpi-core"],
    queryFn: () => kpiService.getKpiMetrics(),
    enabled: canAccess("DASHBOARD"),
  });

  // Full dashboard metrics - loads in background only after core KPIs are ready
  const { data: dashboardMetrics, isFetching: isDashboardLoading } = useQuery({
    queryKey: ["dashboard-metrics-kpi"],
    queryFn: () => dashboardService.getDashboardMetrics(),
    enabled: canAccess("DASHBOARD") && kpiCore !== undefined,
  });

  // Summary metrics include stock alerts, GRN status, and PO aging used by moved dashboard cards.
  const { data: dashboardSummaryMetrics } = useQuery({
    queryKey: ["dashboard-metrics-summary-kpi"],
    queryFn: () => dashboardService.getDashboardSummaryMetrics(),
    enabled: canAccess("DASHBOARD"),
  });

  // Role-based visibility helpers
  const isExecutiveView = selectedRole === "executive";
  const isOpsView = selectedRole === "ops";
  const isMerchView = selectedRole === "merch";

  // Executive: summary strip + margin + inventory risk + forecast vs actual
  // Ops: shipping backlog + SLA + inventory by warehouse + PO status
  // Merch: sell-through + SKU velocity + weeks on hand + drop performance
  // Admin par bhi yahi role selection apply hoga (no extra sections)
  const showExecutiveStrip = isExecutiveView || isOpsView || isMerchView;
  const showSalesPerformance = isExecutiveView || isMerchView; // Exec + Merch
  const showShippingFulfillment = isOpsView; // Ops only
  const showInventory = isExecutiveView || isOpsView || isMerchView; // All views
  const showPurchaseOrders = isOpsView; // Ops only
  const showProfitability = isExecutiveView || isMerchView; // Exec + Merch
  const showAlerts = isExecutiveView || isOpsView || isMerchView; // All views see alerts
  
  // Role-based data filtering
  const getFilteredAlerts = () => {
    if (isAdmin) {
      return alerts; // Admin sees all
    }
    if (selectedRole === "ops") {
      // Ops view: Show shipping/fulfillment related alerts
      return alerts.filter(a => 
        a.message.includes("SLA") || 
        a.message.includes("Backlog") || 
        a.message.includes("shipping")
      );
    }
    if (selectedRole === "merch") {
      // Merch view: Show inventory related alerts
      return alerts.filter(a => 
        a.message.includes("weeks on hand") || 
        a.message.includes("SKU") ||
        a.message.includes("inventory")
      );
    }
    // Executive view: Show all alerts
    return alerts;
  };

  // Top Sellers Data (real-time from backend)
  const topSellersByUnits = dashboardMetrics?.topSellersByUnits ?? [];
  const topSellersByRevenue = dashboardMetrics?.topSellersByRevenue ?? [];
  const topSellersByMargin = dashboardMetrics?.topSellersByMargin ?? [];
  const bottomSKUsByMargin = dashboardMetrics?.bottomSellersByMargin ?? [];

  // Top SKUs Backlog Risk (real-time from backend)
  const topSKUsBacklogRisk = dashboardMetrics?.topSkusBacklogRisk || [];

  // Shipping & Fulfillment Data
  const shippingKPIs = {
    openOrdersReadyToShip: dashboardMetrics?.openOrdersReadyToShip ?? 0,
    ordersFulfilledToday: dashboardMetrics?.ordersFulfilledToday ?? 0,
    ordersReceivedToday: dashboardMetrics?.ordersReceivedToday ?? 0,
    ordersFulfilledMTD: dashboardMetrics?.ordersFulfilledMtd ?? 0,
    backlogGrowthRate: dashboardMetrics?.backlogGrowthRate ?? 0,
    averageTimeToShip: dashboardMetrics?.averageTimeToShipHours ?? 0,
    ordersBreachingSLA: dashboardMetrics?.ordersBreachingSla ?? 0,
    oldestUnshippedOrder: dashboardMetrics?.oldestUnshippedOrderHours ?? 0,
  };

  // Inventory Data
  const warehouseInventory = dashboardMetrics?.warehouseInventory || [];

  const warehouses = warehouseInventory.map((w) => ({
    name: w.warehouse === "CN" ? "China Warehouse" : "US Warehouse",
    totalSKUs: w.totalSKUs,
    totalUnits: w.totalUnits,
    totalValue: w.totalValue,
  }));

  const totalInventoryValue = warehouses.reduce(
    (sum, w) => sum + w.totalValue,
    0
  );

  const backendGlobalInventory = dashboardMetrics?.globalInventory;
  const financeKpis = dashboardMetrics?.financeKpis;

  const globalInventory = {
    totalValue: backendGlobalInventory?.totalValue ?? totalInventoryValue,
    weeksOnHand: backendGlobalInventory?.weeksOnHand ?? 0,
    inventoryTurnsTTM: backendGlobalInventory?.inventoryTurnsTTM ?? 0,
    // Prefer core KPI inventoryTurnoverRatio (optimized)
    inventoryTurnsMTD: kpiCore?.inventoryTurnoverRatio ?? backendGlobalInventory?.inventoryTurnsMTD ?? 0,
    deadStockValue: backendGlobalInventory?.deadStockValue ?? 0,
    lowVelocity30Days: backendGlobalInventory?.lowVelocity30Days ?? 0,
    lowVelocity60Days: backendGlobalInventory?.lowVelocity60Days ?? 0,
    lowVelocity90Days: backendGlobalInventory?.lowVelocity90Days ?? 0,
  };

  // Executive Control Strip Data (derived from backend KPIs, approximate for some fields)
  const totalOrdersToday = dashboardMetrics?.dailyOrderMetrics?.totalOrders ?? 0;
  const totalOrderValueToday = dashboardMetrics?.dailyOrderMetrics?.totalOrderValue ?? 0;
  const averageOrderValueToday =
    totalOrdersToday > 0 ? totalOrderValueToday / totalOrdersToday : 0;

  const openBacklogUnits = shippingKPIs.openOrdersReadyToShip;
  const openBacklogValue = openBacklogUnits * averageOrderValueToday;

  // Net revenue MTD: prefer core KPI (optimized), then backend finance, then approximation
  const netRevenueMtdApprox =
    dashboardMetrics?.ordersFulfilledMtd && averageOrderValueToday > 0
      ? dashboardMetrics.ordersFulfilledMtd * averageOrderValueToday
      : 0;
  const netRevenueMtd =
    kpiCore?.revenueThisMonth ?? financeKpis?.netRevenueMtd ?? netRevenueMtdApprox;

  // Margin % MTD from backend (approx based on current cost model)
  const grossMarginPercentMtd =
    financeKpis?.grossMarginPercentMtd ?? 42.5;
  const contributionMarginPercentMtd =
    financeKpis?.contributionMarginPercentMtd ?? 38.2;

  // Approximate fulfillment SLA hit rate (7-day style): based on current backlog + MTD fulfilled vs breaches
  const totalRelevantOrdersForSla =
    openBacklogUnits + shippingKPIs.ordersFulfilledMTD;
  let fulfillmentSlaRate = 100;
  if (totalRelevantOrdersForSla > 0) {
    const breachRatio =
      shippingKPIs.ordersBreachingSLA / totalRelevantOrdersForSla;
    fulfillmentSlaRate = Math.max(0, Math.min(100, 100 * (1 - breachRatio)));
    fulfillmentSlaRate = Math.round(fulfillmentSlaRate * 10) / 10;
  }

  const executiveStrip = {
    // Today view
    netRevenueToday: totalOrderValueToday,
    // MTD revenue (backend + fallback)
    netRevenueMTD: netRevenueMtd,
    // Margin % from backend finance KPIs (approx)
    grossMarginMTD: grossMarginPercentMtd,
    contributionMarginMTD: contributionMarginPercentMtd,
    // Orders shipped = fulfilled today, received = paid orders created today
    ordersShippedToday: shippingKPIs.ordersFulfilledToday,
    ordersReceivedToday: shippingKPIs.ordersReceivedToday,
    // Backlog units from backend + approximate value using today's AOV
    openOrderBacklog: { value: openBacklogValue, units: openBacklogUnits },
    // Global inventory weeks on hand
    inventoryWeeksOnHand: globalInventory.weeksOnHand,
    // Approximate SLA hit rate
    fulfillmentSLARate: fulfillmentSlaRate,
  };

  // Sales Performance Data (derived from backend KPIs)
  const netRevenueTodayMetric =
    dashboardMetrics?.dailyOrderMetrics?.totalOrderValue ?? 0;
  const totalPaidOrdersToday = shippingKPIs.ordersReceivedToday; // paid orders created today
  const averageOrderValueTodaySales =
    totalPaidOrdersToday > 0
      ? netRevenueTodayMetric / totalPaidOrdersToday
      : 0;

  const grossMarginMtdDollar = financeKpis?.grossMarginMtd ?? 0;

  const dailySales = {
    totalPaidOrders: totalPaidOrdersToday,
    netRevenue: netRevenueTodayMetric,
    averageOrderValue: averageOrderValueTodaySales,
    // Approximate daily gross margin using MTD margin %
    grossMarginDollar:
      grossMarginPercentMtd > 0
        ? netRevenueTodayMetric * (grossMarginPercentMtd / 100)
        : 0,
    grossMarginPercent: grossMarginPercentMtd,
  };

  const totalPaidOrdersMtd = dashboardMetrics?.ordersFulfilledMtd ?? 0;
  const netRevenueMtdValue = netRevenueMtd;
  // Prefer core KPI averageOrderValue (optimized)
  const averageOrderValueMtd =
    kpiCore?.averageOrderValue ?? (totalPaidOrdersMtd > 0 ? netRevenueMtdValue / totalPaidOrdersMtd : 0);

  const mtdSales = {
    totalPaidOrders: totalPaidOrdersMtd,
    netRevenue: netRevenueMtdValue,
    averageOrderValue: averageOrderValueMtd,
    grossMarginDollar: grossMarginMtdDollar,
    grossMarginPercent: grossMarginPercentMtd,
    // Core KPI: revenue growth vs last month (optimized endpoint)
    revenueGrowthPercentage: kpiCore?.revenueGrowthPercentage ?? 0,
    revenueLastMonth: kpiCore?.revenueLastMonth ?? 0,
    // Comparative KPIs from backend (approximate)
    vsForecast: financeKpis?.vsForecast ?? 100,
    vsPriorMonth: financeKpis?.vsPriorMonth ?? 100,
    vsSameMonthLY: financeKpis?.vsSameMonthLy ?? 100,
  };

  const topSKUsByInventoryValue = dashboardMetrics?.topSkusByInventoryValue || [];

  // Purchase Orders Data (from backend)
  const poKPIs = dashboardMetrics?.poKpis;
  const poAgingByVendor = dashboardMetrics?.poAgingByVendor || [];
  // Vendor balance & performance (moved from Dashboard; data from full or summary metrics)
  const vendorBalanceSummary =
    dashboardMetrics?.vendorBalanceSummary ??
    dashboardSummaryMetrics?.vendorBalanceSummary ?? {
      pendingAmount: 0,
      paidAmount: 0,
      totalBalance: 0,
    };
  const vendorPerformanceData = (dashboardMetrics?.vendorPerformance ?? []).map((v) => ({
    name: v.vendorName.split(" ")[0],
    performance: v.onTimePercentage,
    deliveries: v.totalDeliveries,
  }));
  const opsMetrics = dashboardSummaryMetrics || dashboardMetrics;
  const poAging = opsMetrics?.poAging || {
    age0To30: { count: 0, value: 0 },
    age31To60: { count: 0, value: 0 },
    age61To90: { count: 0, value: 0 },
    age90Plus: { count: 0, value: 0 },
  };
  const poAgingBuckets = [
    { name: "0-30 Days", count: poAging.age0To30.count, value: poAging.age0To30.value },
    { name: "31-60 Days", count: poAging.age31To60.count, value: poAging.age31To60.value },
    { name: "61-90 Days", count: poAging.age61To90.count, value: poAging.age61To90.value },
    { name: "90+ Days", count: poAging.age90Plus.count, value: poAging.age90Plus.value },
  ];
  const stockAlerts = opsMetrics?.stockAlerts || [];
  const stockAlertsCriticalCount =
    opsMetrics?.stockAlertsCriticalCount ??
    stockAlerts.filter((item) => item.status === "critical").length;
  const stockAlertsLowCount =
    opsMetrics?.stockAlertsLowCount ??
    stockAlerts.filter((item) => item.status === "low").length;
  const grnStatus = opsMetrics?.grnStatus || {
    pending: 0,
    completed: 0,
    total: 0,
    recentGrns: [],
  };

  // Profitability Data
  const profitability = {
    grossMarginByCategory: [
      { category: "Footwear", margin: 45.2, revenue: 850000 },
      { category: "Apparel", margin: 38.5, revenue: 320000 },
      { category: "Accessories", margin: 25.8, revenue: 80000 },
    ],
    marginTrend7Days: [42.1, 42.3, 42.5, 42.4, 42.6, 42.5, 42.5],
    marginTrend30Days: [41.8, 42.0, 42.2, 42.3, 42.5],
  };

  // Alerts Data
  const alerts = [
    { type: "warning", message: "SKU YZ-101 < 2 weeks on hand", sku: "YZ-101" },
    { type: "warning", message: "SKU YZ-205 > 20 weeks on hand", sku: "YZ-205" },
    { type: "error", message: "8 orders breaching SLA", count: 8 },
    { type: "warning", message: "Backlog growth > 5%", growth: 2.5 },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  const formatDecimal = (value: number, maximumFractionDigits: number = 2) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits,
    }).format(value);
  };

  const normalizeGrnStatus = (status?: string | null) => (status || "").toLowerCase();
  const formatGrnStatus = (status?: string | null) => {
    switch (normalizeGrnStatus(status)) {
      case "completed":
        return "Fully Received";
      case "partial":
        return "Partially Received";
      case "pending":
        return "Pending";
      default:
        return status || "N/A";
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">KPI Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as KPIViewType)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="executive">Executive View</option>
            <option value="ops">Ops View</option>
            <option value="merch">Merch/Planning View</option>
          </select>
        </div>
      </div>

      {/* Core KPIs - loads first, shows immediately */}
      {kpiCore && (
        <Card className="bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Core KPIs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Revenue This Month</p>
                <p className="text-xl font-bold">{formatCurrency(kpiCore.revenueThisMonth)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Revenue Last Month</p>
                <p className="text-xl font-bold">{formatCurrency(kpiCore.revenueLastMonth)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Revenue Growth %</p>
                <p className={`text-xl font-bold ${kpiCore.revenueGrowthPercentage >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatDecimal(kpiCore.revenueGrowthPercentage, 1)}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Avg Order Value</p>
                <p className="text-xl font-bold">{formatCurrency(kpiCore.averageOrderValue)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Inventory Turnover</p>
                <p className="text-xl font-bold">{formatDecimal(kpiCore.inventoryTurnoverRatio, 2)}</p>
              </div>
            </div>
            {isDashboardLoading && (
              <p className="text-xs text-muted-foreground mt-3">Loading full metrics...</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* LEVEL 1 - Executive Control Strip */}
      {showExecutiveStrip && (
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Executive Control Strip
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Net Revenue Today</p>
              <p className="text-2xl font-bold">{formatCurrency(executiveStrip.netRevenueToday)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Net Revenue MTD</p>
              <p className="text-2xl font-bold">{formatCurrency(executiveStrip.netRevenueMTD)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Gross Margin % (MTD)</p>
              <p className="text-2xl font-bold">{formatDecimal(executiveStrip.grossMarginMTD, 1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Contribution Margin %</p>
              <p className="text-2xl font-bold">{formatDecimal(executiveStrip.contributionMarginMTD, 1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Orders Shipped vs Received</p>
              <p className="text-2xl font-bold">
                {formatNumber(executiveStrip.ordersShippedToday)} / {formatNumber(executiveStrip.ordersReceivedToday)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Open Order Backlog</p>
              <p className="text-lg font-bold">{formatCurrency(executiveStrip.openOrderBacklog.value)}</p>
              <p className="text-sm">{formatNumber(executiveStrip.openOrderBacklog.units)} units</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Inventory Weeks on Hand</p>
              <p className="text-2xl font-bold">{formatDecimal(executiveStrip.inventoryWeeksOnHand, 1)}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Fulfillment SLA Hit Rate (7-day rolling)</span>
              <Badge variant={executiveStrip.fulfillmentSLARate >= 95 ? "default" : "secondary"}>
                {formatDecimal(executiveStrip.fulfillmentSLARate, 1)}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Vendor Balance Summary & Vendor On-Time Performance (moved from Dashboard) */}
      {canRead("VENDORS") && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vendor Balance Summary</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Pending vs Paid</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pending</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                    {formatCurrency(vendorBalanceSummary.pendingAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-500">
                    {formatCurrency(vendorBalanceSummary.paidAmount)}
                  </p>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p className="text-xl font-semibold text-foreground">
                    {formatCurrency(vendorBalanceSummary.totalBalance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
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

      {/* SALES PERFORMANCE */}
      {showSalesPerformance && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sales Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="daily" className="space-y-4">
            <TabsList>
              <TabsTrigger value="daily">Daily Sales</TabsTrigger>
              <TabsTrigger value="mtd">MTD Sales</TabsTrigger>
              <TabsTrigger value="top-sellers">Top Sellers</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Paid Orders</p>
                  <p className="text-2xl font-bold">{formatNumber(dailySales.totalPaidOrders)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Net Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(dailySales.netRevenue)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Average Order Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(dailySales.averageOrderValue)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Gross Margin $</p>
                  <p className="text-2xl font-bold">{formatCurrency(dailySales.grossMarginDollar)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Gross Margin %</p>
                  <p className="text-2xl font-bold">{formatDecimal(dailySales.grossMarginPercent, 1)}%</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="mtd" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Paid Orders</p>
                  <p className="text-2xl font-bold">{formatNumber(mtdSales.totalPaidOrders)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Net Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(mtdSales.netRevenue)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Average Order Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(mtdSales.averageOrderValue)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Gross Margin $</p>
                  <p className="text-2xl font-bold">{formatCurrency(mtdSales.grossMarginDollar)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Gross Margin %</p>
                  <p className="text-2xl font-bold">{formatDecimal(mtdSales.grossMarginPercent, 1)}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">MTD vs Forecast</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{formatDecimal(mtdSales.vsForecast, 1)}%</p>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">MTD vs Prior Month</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{formatDecimal(mtdSales.vsPriorMonth, 1)}%</p>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">MTD vs Same Month LY</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{formatDecimal(mtdSales.vsSameMonthLY, 1)}%</p>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Revenue Last Month</p>
                  <p className="text-2xl font-bold">{formatCurrency(mtdSales.revenueLastMonth)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Revenue Growth % vs Last Month</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{formatDecimal(mtdSales.revenueGrowthPercentage, 1)}%</p>
                    {mtdSales.revenueGrowthPercentage >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="top-sellers" className="space-y-4">
              <Tabs defaultValue="units">
                <TabsList>
                  <TabsTrigger value="units">Top 15 by Units</TabsTrigger>
                  <TabsTrigger value="revenue">Top 15 by Revenue</TabsTrigger>
                  <TabsTrigger value="margin">Top 15 by Gross Margin $</TabsTrigger>
                  <TabsTrigger value="bottom">Bottom 10 by Margin</TabsTrigger>
                  <TabsTrigger value="backlog">Top SKUs Backlog Risk</TabsTrigger>
                </TabsList>

                <TabsContent value="units">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead className="text-right">Units</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Gross Margin $</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topSellersByUnits.map((item) => (
                        <TableRow key={item.sku}>
                          <TableCell className="font-medium">{item.sku}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right">{formatNumber(item.units)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.margin)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="revenue">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead className="text-right">Units</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Gross Margin $</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topSellersByRevenue.map((item) => (
                        <TableRow key={item.sku}>
                          <TableCell className="font-medium">{item.sku}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right">{formatNumber(item.units)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.margin)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="margin">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead className="text-right">Units</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Gross Margin $</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topSellersByMargin.map((item) => (
                        <TableRow key={item.sku}>
                          <TableCell className="font-medium">{item.sku}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right">{formatNumber(item.units)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.margin)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="bottom">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead className="text-right">Units</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Gross Margin $</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bottomSKUsByMargin.map((item) => (
                        <TableRow key={item.sku}>
                          <TableCell className="font-medium">{item.sku}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right">{formatNumber(item.units)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                          <TableCell className="text-right text-red-600">{formatCurrency(item.margin)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="backlog">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead className="text-right">Backlog Units</TableHead>
                        <TableHead className="text-right">Weeks on Hand</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topSKUsBacklogRisk.map((item) => (
                        <TableRow key={item.sku}>
                          <TableCell className="font-medium">{item.sku}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right">{formatNumber(item.backlogUnits)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={item.weeksOnHand < 3 ? "destructive" : "secondary"}>
                              {formatDecimal(item.weeksOnHand, 1)} weeks
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      )}

      {/* SHIPPING & FULFILLMENT */}
      {showShippingFulfillment && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping & Fulfillment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Open Orders Ready to Ship</p>
              <p className="text-2xl font-bold">{formatNumber(shippingKPIs.openOrdersReadyToShip)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Orders Fulfilled Today</p>
              <p className="text-2xl font-bold">{formatNumber(shippingKPIs.ordersFulfilledToday)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Orders Received Today</p>
              <p className="text-2xl font-bold">{formatNumber(shippingKPIs.ordersReceivedToday)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Orders Fulfilled MTD</p>
              <p className="text-2xl font-bold">{formatNumber(shippingKPIs.ordersFulfilledMTD)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Backlog Growth Rate</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{formatDecimal(shippingKPIs.backlogGrowthRate, 1)}%</p>
                <TrendingUp className="h-4 w-4 text-red-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Average Time to Ship</p>
              <p className="text-2xl font-bold">{formatDecimal(shippingKPIs.averageTimeToShip, 1)} hrs</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Orders Breaching SLA</p>
              <Badge variant="destructive" className="text-lg px-3 py-1">
                {formatNumber(shippingKPIs.ordersBreachingSLA)}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Oldest Unshipped Order</p>
              <p className="text-2xl font-bold">{formatDecimal(shippingKPIs.oldestUnshippedOrder, 1)} hrs</p>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* INVENTORY SECTION */}
      {showInventory && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Inventory
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Warehouse Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {warehouses.map((warehouse) => (
              <Card key={warehouse.name}>
                <CardHeader>
                  <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total SKUs</span>
                    <span className="font-medium">{formatNumber(warehouse.totalSKUs)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Units</span>
                    <span className="font-medium">{formatNumber(warehouse.totalUnits)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Value</span>
                    <span className="font-medium">{formatCurrency(warehouse.totalValue)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Global Inventory KPIs */}
          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold mb-4">
              {selectedRole === "merch" ? "Inventory Performance & Sell-Through" : "Global Inventory KPIs"}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Inventory Value</p>
                <p className="text-2xl font-bold">{formatCurrency(globalInventory.totalValue)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Weeks on Hand</p>
                <p className="text-2xl font-bold">{globalInventory.weeksOnHand}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Inventory Turns (TTM)</p>
                <p className="text-2xl font-bold">{globalInventory.inventoryTurnsTTM}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Inventory Turns (MTD)</p>
                <p className="text-2xl font-bold">{globalInventory.inventoryTurnsMTD}</p>
              </div>
              {selectedRole === "merch" && (
                <>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">30-Day Sell-Through %</p>
                    <p className="text-2xl font-bold">65.2%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">60-Day Sell-Through %</p>
                    <p className="text-2xl font-bold">78.5%</p>
                  </div>
                </>
              )}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Dead Stock Value</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(globalInventory.deadStockValue)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Low Velocity (30 days)</p>
                <p className="text-2xl font-bold">{formatCurrency(globalInventory.lowVelocity30Days)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Low Velocity (60 days)</p>
                <p className="text-2xl font-bold">{formatCurrency(globalInventory.lowVelocity60Days)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Low Velocity (90 days)</p>
                <p className="text-2xl font-bold">{formatCurrency(globalInventory.lowVelocity90Days)}</p>
              </div>
            </div>
          </div>

          {/* Top SKUs by Inventory Value */}
          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold mb-4">Top 20 SKUs by Inventory Value</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSKUsByInventoryValue.map((item) => (
                  <TableRow key={item.sku}>
                    <TableCell className="font-medium">{item.sku}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.units)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      )}

      {/* PURCHASE ORDERS & SUPPLY CHAIN */}
      {showPurchaseOrders && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Purchase Orders & Supply Chain
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Open POs</p>
              <p className="text-lg font-bold">
                {formatNumber(poKPIs?.openPoUnits ?? 0)} units
              </p>
              <p className="text-sm">{formatCurrency(poKPIs?.openPoValue ?? 0)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Partially Fulfilled POs</p>
              <p className="text-2xl font-bold">
                {formatNumber(poKPIs?.partiallyFulfilledPos ?? 0)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">GRNs</p>
              <p className="text-2xl font-bold">
                {formatNumber(poKPIs?.grnCount ?? 0)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Inbound Inventory Value</p>
              <p className="text-2xl font-bold">
                {formatCurrency(poKPIs?.inboundInventoryValue ?? 0)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">POs Past Due</p>
              <p className="text-lg font-bold text-red-600">
                {formatNumber(poKPIs?.pastDuePoUnits ?? 0)} units
              </p>
              <p className="text-sm text-red-600">
                {formatCurrency(poKPIs?.pastDuePoValue ?? 0)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Vendor Fill Rate</p>
              <p className="text-2xl font-bold">
                {(poKPIs?.vendorFillRate ?? 0).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* PO Aging by Vendor */}
          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold mb-4">PO Aging by Vendor</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Total POs</TableHead>
                  <TableHead className="text-right">Avg Days</TableHead>
                  <TableHead className="text-right">On-Time %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {poAgingByVendor.map((vendor) => (
                  <TableRow key={vendor.vendor}>
                    <TableCell className="font-medium">{vendor.vendor}</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(vendor.totalPos)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(vendor.avgDays)} days
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={vendor.onTime >= 90 ? "default" : "secondary"}>
                        {vendor.onTime.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      )}

      {/* OPERATIONS SNAPSHOT (moved from Dashboard) */}
      {(canRead("INVENTORY") || canRead("GRN") || canRead("PURCHASE_ORDERS")) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Operations Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {canRead("INVENTORY") && (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg">Stock Alerts</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Critical: {formatNumber(stockAlertsCriticalCount)} | Low: {formatNumber(stockAlertsLowCount)}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate("/stock-alerts")}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stockAlerts.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No stock alerts found</div>
                      ) : (
                        stockAlerts.slice(0, 5).map((item, index) => (
                          <div key={`${item.sku}-${item.variantSku || "product"}-${item.warehouse}-${index}`} className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{item.variantSku || item.sku}</p>
                              <p className="text-xs text-muted-foreground">{item.name}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant={item.status === "critical" ? "destructive" : "secondary"}>
                                {item.status}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">{item.currentStock} units</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {canRead("GRN") && (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg">GRN Status</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Pending: {formatNumber(grnStatus.pending)} | Fully Received: {formatNumber(grnStatus.completed)}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate("/grn")}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {grnStatus.recentGrns.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No GRN records found</div>
                      ) : (
                        grnStatus.recentGrns.slice(0, 5).map((grn) => (
                          <div key={grn.id} className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{grn.grnNumber}</p>
                              <p className="text-xs text-muted-foreground">PO: {grn.poNumber}</p>
                            </div>
                            <Badge variant={normalizeGrnStatus(grn.status) === "completed" ? "default" : "secondary"}>
                              {formatGrnStatus(grn.status)}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {canRead("PURCHASE_ORDERS") && (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">PO Aging Report</CardTitle>
                      <Button variant="outline" size="sm" onClick={() => navigate("/purchase-orders")}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {poAgingBuckets.map((bucket) => (
                        <div key={bucket.name} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                          <div>
                            <p className="text-sm font-medium">{bucket.name}</p>
                            <p className="text-xs text-muted-foreground">{formatNumber(bucket.count)} POs</p>
                          </div>
                          <p className="text-sm font-semibold">{formatCurrency(bucket.value)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* PROFITABILITY */}
      {/* {showProfitability && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Profitability
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Gross Margin by Category</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Margin %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profitability.grossMarginByCategory.map((cat) => (
                  <TableRow key={cat.category}>
                    <TableCell className="font-medium">{cat.category}</TableCell>
                    <TableCell className="text-right">{formatCurrency(cat.revenue)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={cat.margin >= 40 ? "default" : "secondary"}>
                        {cat.margin}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      )} */}
      

      {/* ALERTS & EXCEPTIONS */}
      {/* {showAlerts && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alerts & Exceptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {getFilteredAlerts().map((alert, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  alert.type === "error" ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"
                }`}
              >
                {alert.type === "error" ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-600" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{alert.message}</p>
                  {alert.sku && <p className="text-sm text-muted-foreground">SKU: {alert.sku}</p>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      )} */}
      
    </div>
  );
}

