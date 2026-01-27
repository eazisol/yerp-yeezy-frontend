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

// Missing variant SKU list item from dashboard API
export interface MissingVariantSkuItem {
  sku: string;
  productName: string;
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

export interface DashboardMetrics {
  dailyOrderMetrics: DailyOrderMetrics;
  orderStatusBreakdown: OrderStatusBreakdown;
  dailyShipments: DailyShipments;
  warehouseInventory: WarehouseInventory[];
  stockAlerts: StockAlert[];
  stockAlertsCriticalCount: number;
  stockAlertsLowCount: number;
  grnStatus: GrnStatus;
}

class DashboardService {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return apiClient.get<DashboardMetrics>("/api/Dashboard/metrics");
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

