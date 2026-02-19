import { apiClient } from "./api";

export interface DailyOrderMetrics {
  totalOrders: number;
  totalOrderValue: number;
  previousDayOrders: number;
  previousDayValue: number;
  changePercentage: number;
  valueChangePercentage: number;
}

export interface OrderStatusBreakdown {
  fulfilled: number;
  pending: number;
  partiallyShipped: number;
  total: number;
}

export interface DailyShipments {
  cnShipments: number;
  usShipments: number;
  totalShipments: number;
  date: string;
}

export interface WarehouseInventory {
  warehouse: "CN" | "US";
  totalValue: number;
  totalSKUs: number;
  totalUnits: number;
}

export interface StockAlert {
  sku: string;
  name: string;
  variantName?: string; // Variant name (if variant-level alert)
  variantSku?: string; // Variant SKU (if variant-level alert)
  currentStock: number;
  warehouse: string;
  status: "low" | "critical";
  threshold: number;
}

export interface StockAlertsResponse {
  data: StockAlert[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface GrnRecent {
  id: number;
  grnNumber: string;
  poNumber: string;
  status: string;
  date: string;
}

export interface GrnStatus {
  pending: number;
  completed: number;
  total: number;
  recentGrns: GrnRecent[];
}

// PO aging bucket summary
export interface PoAgingBucket {
  count: number;
  value: number;
}

// PO aging summary for dashboard
export interface PoAgingSummary {
  age0To30: PoAgingBucket;
  age31To60: PoAgingBucket;
  age61To90: PoAgingBucket;
  age90Plus: PoAgingBucket;
}

// Vendor balance summary from dashboard API
export interface VendorBalanceSummary {
  pendingAmount: number;
  paidAmount: number;
  totalBalance: number;
}

// Vendor on-time performance from dashboard API
export interface VendorPerformance {
  vendorId: number;
  vendorName: string;
  totalDeliveries: number;
  onTimeDeliveries: number;
  onTimePercentage: number;
}

// Finance / profitability KPIs (MTD)
export interface FinanceKpis {
  netRevenueMtd: number;
  grossMarginMtd: number;
  grossMarginPercentMtd: number;
  contributionMarginMtd: number;
  contributionMarginPercentMtd: number;
  vsForecast: number;
  vsPriorMonth: number;
  vsSameMonthLy: number;
}

// Purchase orders & supply chain KPIs
export interface PoKpi {
  openPoUnits: number; // Total open units across all open POs
  openPoValue: number; // Total remaining value across all open POs
  partiallyFulfilledPos: number; // Number of partially fulfilled POs
  grnCount: number; // Total GRNs
  inboundInventoryValue: number; // Value of inbound inventory (open POs)
  pastDuePoUnits: number; // Units on past-due POs
  pastDuePoValue: number; // Remaining value on past-due POs
  vendorFillRate: number; // Overall vendor fill rate (%)
}

// PO aging by vendor for KPI dashboard
export interface PoAgingByVendor {
  vendor: string;
  totalPos: number;
  avgDays: number;
  onTime: number; // On-time %
}

// Recent order summary from dashboard API
export interface RecentOrder {
  orderId: number;
  orderNumber?: string;
  customerName?: string;
  route?: string;
  status: string;
  total: number;
  currency?: string;
}

// Missing variant SKU list item from dashboard API
export interface MissingVariantSkuItem {
  sku: string;
  productName: string;
  swellVariantId?: string; // Swell variant ID (if provided)
  latestOrderNumber?: string;
  latestOrderDate: string;
  totalUses: number;
}

// Paged response for missing variant SKUs
export interface MissingVariantSkusResponse {
  data: MissingVariantSkuItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// Top seller KPI (sales performance) for dashboard
export interface TopSellerKpi {
  sku: string;
  name: string;
  units: number; // Units sold (MTD)
  revenue: number; // Net revenue (MTD)
  margin: number; // Gross margin dollars (MTD, approximate)
}

export interface DashboardMetrics {
  dailyOrderMetrics: DailyOrderMetrics;
  orderStatusBreakdown: OrderStatusBreakdown;
  dailyShipments: DailyShipments;
  financeKpis: FinanceKpis;
  // Total count of open, paid orders that are ready to ship
  openOrdersReadyToShip: number;
  // Total count of paid orders that were fulfilled today
  ordersFulfilledToday: number;
   // Total count of paid orders that were received (created) today
  ordersReceivedToday: number;
  // Total count of paid orders that were fulfilled month-to-date
  ordersFulfilledMtd: number;
  // Approximate backlog growth rate vs yesterday (percentage)
  backlogGrowthRate: number;
  // Average time to ship for MTD fulfilled orders (in hours)
  averageTimeToShipHours: number;
  // Total count of orders breaching fulfillment SLA
  ordersBreachingSla: number;
  // Oldest unshipped order age (in hours) among paid, not fulfilled orders
  oldestUnshippedOrderHours: number;
  // Global inventory KPIs (cost-based)
  globalInventory?: GlobalInventoryKpis;
  warehouseInventory: WarehouseInventory[];
  topSkusByInventoryValue: TopSkuInventoryValue[];
  topSellersByUnits: TopSellerKpi[]; // Top 15 SKUs by units (MTD)
  topSellersByRevenue: TopSellerKpi[]; // Top 15 SKUs by revenue (MTD)
  topSellersByMargin: TopSellerKpi[]; // Top 15 SKUs by gross margin $ (MTD)
  bottomSellersByMargin: TopSellerKpi[]; // Bottom 10 SKUs by gross margin $ (MTD)
  topSkusBacklogRisk: TopSkuBacklogRisk[]; // Top SKUs by backlog risk (backlog units + weeks on hand)
  stockAlerts: StockAlert[];
  stockAlertsCriticalCount: number;
  stockAlertsLowCount: number;
  grnStatus: GrnStatus;
  recentOrders: RecentOrder[];
  poAging: PoAgingSummary;
  vendorBalanceSummary: VendorBalanceSummary;
  vendorPerformance: VendorPerformance[];
  poKpis: PoKpi;
  poAgingByVendor: PoAgingByVendor[];
}

export interface GlobalInventoryKpis {
  totalValue: number;
  weeksOnHand: number;
  inventoryTurnsTTM: number;
  inventoryTurnsMTD: number;
  deadStockValue: number;
  lowVelocity30Days: number;
  lowVelocity60Days: number;
  lowVelocity90Days: number;
}

export interface TopSkuInventoryValue {
  sku: string;
  name: string;
  units: number;
  value: number;
}

// Top SKU backlog risk (backlog units and weeks on hand per SKU)
export interface TopSkuBacklogRisk {
  sku: string;
  name: string;
  backlogUnits: number; // Total backlog units (paid, not fulfilled)
  weeksOnHand: number; // Approximate weeks on hand based on MTD sales velocity
}

// Period metrics for Dashboard (daily, weekly, yearly, or custom) — same 10 cards, values vary by period
export interface DashboardPeriodMetrics {
  period: "daily" | "weekly" | "monthly" | "yearly" | "custom";
  totalOrders: number;
  totalOrderValue: number;
  shippingCollected: number;
  taxCollected: number;
  taxPercentOfTotal: number;
  refunds: number;
  refundsPercentOfTotal: number;
  netSales: number;
  netSalesVsPriorPercent: number | null;
  totalOrdersFulfilled: number;
  totalOrdersFulfilledVsPriorPercent: number | null;
  totalOrdersPartiallyShipped: number;
  totalOrdersPartiallyShippedVsPriorPercent: number | null;
  averageDaysToShip: number;
  orderBacklogWeeklyAverage: number;
}

class DashboardService {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return apiClient.get<DashboardMetrics>("/api/Dashboard/metrics");
  }

  // Fetch fast summary metrics for first paint
  async getDashboardSummaryMetrics(): Promise<DashboardMetrics> {
    return apiClient.get<DashboardMetrics>("/api/Dashboard/metrics/summary");
  }

  // Fetch period metrics (daily, weekly, yearly, or custom) for the 10 combined cards. For custom, pass startDate and endDate (yyyy-MM-dd).
  async getPeriodMetrics(
    period: "daily" | "weekly" | "monthly" | "yearly" | "custom",
    startDate?: string,
    endDate?: string
  ): Promise<DashboardPeriodMetrics> {
    const params = new URLSearchParams({ period });
    if (period === "custom" && startDate && endDate) {
      params.append("startDate", startDate);
      params.append("endDate", endDate);
    }
    return apiClient.get<DashboardPeriodMetrics>(`/api/Dashboard/metrics/period?${params.toString()}`);
  }

  // Fetch inventory-heavy dashboard metrics
  async getDashboardInventoryMetrics(): Promise<DashboardMetrics> {
    return apiClient.get<DashboardMetrics>("/api/Dashboard/metrics/inventory");
  }

  // Fetch finance/PO dashboard metrics
  async getDashboardFinanceMetrics(): Promise<DashboardMetrics> {
    return apiClient.get<DashboardMetrics>("/api/Dashboard/metrics/finance");
  }

  // Fetch paged stock alerts with optional SKU filter
  async getStockAlerts(
    page: number = 1,
    pageSize: number = 10,
    sku?: string
  ): Promise<StockAlertsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    if (sku) params.append("sku", sku);

    return apiClient.get<StockAlertsResponse>(`/api/Dashboard/stock-alerts?${params.toString()}`);
  }

  // Export all filtered stock alerts as CSV from backend
  async exportStockAlertsToCsv(sku?: string): Promise<Blob> {
    const params = new URLSearchParams();
    if (sku) params.append("sku", sku);

    const token = localStorage.getItem("auth_token");
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5234";
    const response = await fetch(`${baseUrl}/api/Dashboard/stock-alerts/export-csv?${params.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to export stock alerts");
    }

    return response.blob();
  }

  // Fetch paged missing variant SKUs from orders
  async getMissingVariantSkus(
    page: number = 1,
    pageSize: number = 10
  ): Promise<MissingVariantSkusResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    return apiClient.get<MissingVariantSkusResponse>(`/api/Dashboard/missing-variant-skus?${params.toString()}`);
  }
}

export const dashboardService = new DashboardService();

