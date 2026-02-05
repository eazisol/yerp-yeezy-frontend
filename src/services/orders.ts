import { apiClient } from "./api";

export interface Order {
  orderId: number;
  swellOrderId: string | null;
  orderNumber: string | null;
  status: string;
  fulfillmentStatus?: string | null; // Fulfillment status from backend
  customerName: string | null;
  customerEmail: string | null;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string | null;
  paymentStatus: string | null;
  route: string | null;
  createdDate: string;
  itemCount: number;
  warehouseIds?: number[];
  orderSyncTo?: number;
}

export interface OrderStats {
  totalOrders: number;
  unfulfilledOrders: number;
  partiallyFulfilledOrders: number;
}

export interface OrdersResponse {
  data: Order[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

class OrderService {
  async getOrders(
    page: number = 1,
    pageSize: number = 50,
    search?: string,
    status?: string,
    paymentStatus?: string,
    startDate?: string,
    endDate?: string,
    warehouse?: string
  ): Promise<OrdersResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (paymentStatus) params.append("paymentStatus", paymentStatus);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (warehouse) params.append("warehouse", warehouse);

    return apiClient.get<OrdersResponse>(`/api/Orders?${params.toString()}`);
  }

  // Export orders to CSV
  async exportOrdersToCsv(
    search?: string,
    status?: string,
    paymentStatus?: string,
    startDate?: string,
    endDate?: string
  ): Promise<Blob> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (paymentStatus) params.append("paymentStatus", paymentStatus);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const token = localStorage.getItem("auth_token");
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5234";
    
    const response = await fetch(`${baseUrl}/api/Orders/export-csv?${params.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to export orders");
    }

    return response.blob();
  }

  async getOrderById(id: number): Promise<any> {
    return apiClient.get(`/api/Orders/${id}`);
  }

  async getOrderStats(): Promise<OrderStats> {
    return apiClient.get<OrderStats>("/api/Orders/stats");
  }

  async resyncOrder(orderId: number): Promise<{ message: string; orderId: number }> {
    return apiClient.post(`/api/Orders/resync/${orderId}`);
  }

  // Create shipment in Swell for an order
  async createShipment(orderId: number): Promise<{ message: string; shipment_id?: string }> {
    return apiClient.post(`/api/Orders/${orderId}/create-shipment`);
  }

  async resyncChinaOrders(): Promise<{ message: string; totalOrders: number }> {
    return apiClient.post("/api/Orders/resync-china");
  }

  // Assign warehouses for order items missing WarehouseId (VariantId only)
  async assignMissingWarehouses(): Promise<{ message: string; updatedCount: number }> {
    return apiClient.post("/api/Orders/assign-missing-warehouses");
  }

  // Get total order count from Swell
  async getSwellOrderCount(): Promise<{ count: number; message: string }> {
    return apiClient.get<{ count: number; message: string }>("/api/Orders/sync/count");
  }

  // Sync all orders from Swell
  // fromDate: optional ISO date string (yyyy-MM-dd). If omitted, backend defaults to current month start.
  async syncOrdersFromSwell(fromDate?: string): Promise<OrderSyncResult> {
    const url = fromDate
      ? `/api/Orders/sync?fromDate=${encodeURIComponent(fromDate)}`
      : "/api/Orders/sync";
    return apiClient.post<OrderSyncResult>(url);
  }

  // Import orders from Excel file
  async importOrdersFromExcel(file: File): Promise<OrderImportResult> {
    const formData = new FormData();
    formData.append("file", file);
    
    return apiClient.post<OrderImportResult>("/api/Orders/import-excel", formData);
  }
}

export interface OrderSyncResult {
  totalOrders: number;
  created: number;
  updated: number;
  failed: number;
  errors: string[];
  syncDate: string;
  message: string;
}

export interface OrderImportResult {
  totalRows: number;
  ordersCreated: number;
  ordersUpdated: number;
  orderItemsCreated: number;
  orderItemsUpdated: number;
  errors: number;
  errorMessages: string[];
  message: string;
}

export const orderService = new OrderService();

