import { apiClient } from "./api";

export interface Order {
  orderId: number;
  swellOrderId: string;
  orderNumber: string | null;
  status: string;
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
}

export interface OrderStats {
  totalOrders: number;
  cnRouted: number;
  usRouted: number;
  mixedRouted: number;
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
    status?: string
  ): Promise<OrdersResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    if (search) params.append("search", search);
    if (status) params.append("status", status);

    return apiClient.get<OrdersResponse>(`/api/Orders?${params.toString()}`);
  }

  async getOrderById(id: number): Promise<any> {
    return apiClient.get(`/api/Orders/${id}`);
  }

  async getOrderStats(): Promise<OrderStats> {
    return apiClient.get<OrderStats>("/api/Orders/stats");
  }

  // Get total order count from Swell
  async getSwellOrderCount(): Promise<{ count: number; message: string }> {
    return apiClient.get<{ count: number; message: string }>("/api/Orders/sync/count");
  }

  // Sync all orders from Swell
  async syncOrdersFromSwell(): Promise<OrderSyncResult> {
    return apiClient.post<OrderSyncResult>("/api/Orders/sync");
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

export const orderService = new OrderService();

