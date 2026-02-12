import { apiClient } from "./api";
import { DashboardMetrics } from "./dashboard";

// Dedicated KPI service so KPI page uses separate APIs.
class KpiService {
  async getKpiMetrics(): Promise<DashboardMetrics> {
    return apiClient.get<DashboardMetrics>("/api/Kpi/metrics");
  }

  async getKpiSummaryMetrics(): Promise<DashboardMetrics> {
    return apiClient.get<DashboardMetrics>("/api/Kpi/summary");
  }

  async getKpiInventoryMetrics(): Promise<DashboardMetrics> {
    return apiClient.get<DashboardMetrics>("/api/Kpi/inventory");
  }

  async getKpiFinanceMetrics(): Promise<DashboardMetrics> {
    return apiClient.get<DashboardMetrics>("/api/Kpi/finance");
  }
}

export const kpiService = new KpiService();
