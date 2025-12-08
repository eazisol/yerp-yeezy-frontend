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
  currentStock: number;
  warehouse: "CN" | "US";
  status: "low" | "critical";
  threshold: number;
}

export interface DashboardMetrics {
  dailyOrderMetrics: DailyOrderMetrics;
  orderStatusBreakdown: OrderStatusBreakdown;
  dailyShipments: DailyShipments;
  warehouseInventory: WarehouseInventory[];
  stockAlerts: StockAlert[];
}

class DashboardService {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return apiClient.get<DashboardMetrics>("/api/Dashboard/metrics");
  }
}

export const dashboardService = new DashboardService();

