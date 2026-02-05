import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
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
  const { user } = useAuth();
  const { roles, isAdmin } = usePermissions();
  const { canAccess } = usePermissions();
  
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

  // Load dashboard metrics for shared KPIs (including openOrdersReadyToShip)
  const { data: dashboardMetrics } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: () => dashboardService.getDashboardMetrics(),
    enabled: canAccess("DASHBOARD"),
    refetchInterval: 60000,
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
    inventoryTurnsMTD: backendGlobalInventory?.inventoryTurnsMTD ?? 0,
    deadStockValue: backendGlobalInventory?.deadStockValue ?? 0,
    lowVelocity30Days: backendGlobalInventory?.lowVelocity30Days ?? 0,
    lowVelocity60Days: backendGlobalInventory?.lowVelocity60Days ?? 0,
    lowVelocity90Days: backendGlobalInventory?.lowVelocity90Days ?? 0,
  };

  // Executive Control Strip Data (derived from backend KPIs, approximate for some fields)
  const totalOrdersToday = dashboardMetrics?.dailyOrderMetrics.totalOrders ?? 0;
  const totalOrderValueToday = dashboardMetrics?.dailyOrderMetrics.totalOrderValue ?? 0;
  const averageOrderValueToday =
    totalOrdersToday > 0 ? totalOrderValueToday / totalOrdersToday : 0;

  const openBacklogUnits = shippingKPIs.openOrdersReadyToShip;
  const openBacklogValue = openBacklogUnits * averageOrderValueToday;

  // Net revenue MTD: prefer backend finance KPI, fallback to simple approximation
  const netRevenueMtdApprox =
    dashboardMetrics?.ordersFulfilledMtd && averageOrderValueToday > 0
      ? dashboardMetrics.ordersFulfilledMtd * averageOrderValueToday
      : 0;
  const netRevenueMtd =
    financeKpis?.netRevenueMtd ?? netRevenueMtdApprox;

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
    dashboardMetrics?.dailyOrderMetrics.totalOrderValue ?? 0;
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
  const averageOrderValueMtd =
    totalPaidOrdersMtd > 0 ? netRevenueMtdValue / totalPaidOrdersMtd : 0;

  const mtdSales = {
    totalPaidOrders: totalPaidOrdersMtd,
    netRevenue: netRevenueMtdValue,
    averageOrderValue: averageOrderValueMtd,
    grossMarginDollar: grossMarginMtdDollar,
    grossMarginPercent: grossMarginPercentMtd,
    // Comparative KPIs from backend (approximate)
    vsForecast: financeKpis?.vsForecast ?? 100,
    vsPriorMonth: financeKpis?.vsPriorMonth ?? 100,
    vsSameMonthLY: financeKpis?.vsSameMonthLy ?? 100,
  };

  const topSKUsByInventoryValue = dashboardMetrics?.topSkusByInventoryValue || [];

  // Purchase Orders Data (from backend)
  const poKPIs = dashboardMetrics?.poKpis;
  const poAgingByVendor = dashboardMetrics?.poAgingByVendor || [];

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
              <p className="text-2xl font-bold">{executiveStrip.grossMarginMTD}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Contribution Margin %</p>
              <p className="text-2xl font-bold">{executiveStrip.contributionMarginMTD}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Orders Shipped vs Received</p>
              <p className="text-2xl font-bold">
                {executiveStrip.ordersShippedToday} / {executiveStrip.ordersReceivedToday}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Open Order Backlog</p>
              <p className="text-lg font-bold">{formatCurrency(executiveStrip.openOrderBacklog.value)}</p>
              <p className="text-sm">{executiveStrip.openOrderBacklog.units} units</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Inventory Weeks on Hand</p>
              <p className="text-2xl font-bold">{executiveStrip.inventoryWeeksOnHand}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Fulfillment SLA Hit Rate (7-day rolling)</span>
              <Badge variant={executiveStrip.fulfillmentSLARate >= 95 ? "default" : "secondary"}>
                {executiveStrip.fulfillmentSLARate}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
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
                  <p className="text-2xl font-bold">{dailySales.totalPaidOrders}</p>
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
                  <p className="text-2xl font-bold">{dailySales.grossMarginPercent}%</p>
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
                  <p className="text-2xl font-bold">{mtdSales.grossMarginPercent}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">MTD vs Forecast</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{mtdSales.vsForecast}%</p>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">MTD vs Prior Month</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{mtdSales.vsPriorMonth}%</p>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">MTD vs Same Month LY</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{mtdSales.vsSameMonthLY}%</p>
                    <TrendingDown className="h-4 w-4 text-red-600" />
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
                              {item.weeksOnHand} weeks
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
              <p className="text-2xl font-bold">{shippingKPIs.openOrdersReadyToShip}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Orders Fulfilled Today</p>
              <p className="text-2xl font-bold">{shippingKPIs.ordersFulfilledToday}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Orders Received Today</p>
              <p className="text-2xl font-bold">{shippingKPIs.ordersReceivedToday}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Orders Fulfilled MTD</p>
              <p className="text-2xl font-bold">{formatNumber(shippingKPIs.ordersFulfilledMTD)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Backlog Growth Rate</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{shippingKPIs.backlogGrowthRate}%</p>
                <TrendingUp className="h-4 w-4 text-red-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Average Time to Ship</p>
              <p className="text-2xl font-bold">{shippingKPIs.averageTimeToShip} hrs</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Orders Breaching SLA</p>
              <Badge variant="destructive" className="text-lg px-3 py-1">
                {shippingKPIs.ordersBreachingSLA}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Oldest Unshipped Order</p>
              <p className="text-2xl font-bold">{shippingKPIs.oldestUnshippedOrder} hrs</p>
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

