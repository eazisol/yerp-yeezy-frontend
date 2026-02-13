import { apiClient } from "./api";

/** Core KPI response - 5 metrics only. Optimized endpoint. */
export interface KpiCoreResponse {
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueGrowthPercentage: number;
  averageOrderValue: number;
  inventoryTurnoverRatio: number;
}

// Dedicated KPI service so KPI page uses separate APIs.
class KpiService {
  /** Core KPI metrics only (optimized, 5 fields). */
  async getKpiMetrics(): Promise<KpiCoreResponse> {
    return apiClient.get<KpiCoreResponse>("/api/Kpi/metrics");
  }

  /** Core KPI metrics (same as getKpiMetrics). */
  async getKpiSummaryMetrics(): Promise<KpiCoreResponse> {
    return apiClient.get<KpiCoreResponse>("/api/Kpi/summary");
  }

  /** Core KPI metrics (same as getKpiMetrics). */
  async getKpiInventoryMetrics(): Promise<KpiCoreResponse> {
    return apiClient.get<KpiCoreResponse>("/api/Kpi/inventory");
  }

  /** Core KPI metrics (same as getKpiMetrics). */
  async getKpiFinanceMetrics(): Promise<KpiCoreResponse> {
    return apiClient.get<KpiCoreResponse>("/api/Kpi/finance");
  }
}

export const kpiService = new KpiService();
