import { apiClient } from "./api";

/** Core KPI response - 5 metrics only. Optimized endpoint. */
export interface KpiCoreResponse {
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueGrowthPercentage: number;
  averageOrderValue: number;
  inventoryTurnoverRatio: number;
}

/** Top seller row (same shape as dashboard TopSellerKpi). */
export interface TopSellerKpiRow {
  sku: string;
  name: string;
  units: number;
  revenue: number;
  margin: number;
}

/** Top Sellers API response (Day, Week, Month, YTD). */
export interface TopSellersResponse {
  timePeriod: string;
  startDateUtc: string;
  endDateUtc: string;
  topSellersByUnits: TopSellerKpiRow[];
  topSellersByRevenue: TopSellerKpiRow[];
  topSellersByMargin: TopSellerKpiRow[];
  bottomSellersByMargin: TopSellerKpiRow[];
  topSkusBacklogRisk: TopSkuBacklogRiskRow[];
}

/** Top SKU backlog risk row (same period as top sellers). */
export interface TopSkuBacklogRiskRow {
  sku: string;
  name: string;
  backlogUnits: number;
  weeksOnHand: number;
}

/** Time period for Top Sellers and Category Revenue. */
export type TopSellersTimePeriod = "Day" | "Week" | "Month" | "YTD";

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

  /** Top Sellers by units, revenue, margin and Bottom by margin. timePeriod: Day, Week, Month, YTD. */
  async getTopSellers(timePeriod: TopSellersTimePeriod = "Month"): Promise<TopSellersResponse> {
    return apiClient.get<TopSellersResponse>(`/api/Kpi/top-sellers?timePeriod=${encodeURIComponent(timePeriod)}`);
  }
}

export const kpiService = new KpiService();
