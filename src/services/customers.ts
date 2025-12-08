import { apiClient } from "./api";

export interface Customer {
  customerId: number;
  swellCustomerId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  type: string | null;
  currency: string | null;
  emailOptIn: boolean;
  orderCount: number;
  orderValue: number;
  balance: number;
  dateFirstOrder: string | null;
  dateLastOrder: string | null;
  createdDate: string;
  editDate: string | null;
}

export interface CustomersResponse {
  data: Customer[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

class CustomerService {
  async getCustomers(
    page: number = 1,
    pageSize: number = 50,
    search?: string,
    type?: string
  ): Promise<CustomersResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    if (search) params.append("search", search);
    if (type) params.append("type", type);

    return apiClient.get<CustomersResponse>(`/api/Customers?${params.toString()}`);
  }

  async getCustomerById(id: number): Promise<CustomerDetail> {
    return apiClient.get<CustomerDetail>(`/api/Customers/${id}`);
  }

  // Get total customer count from Swell
  async getSwellCustomerCount(): Promise<{ count: number; message: string }> {
    return apiClient.get<{ count: number; message: string }>("/api/Customers/sync/count");
  }

  // Sync all customers from Swell
  async syncCustomersFromSwell(maxCustomers?: number): Promise<CustomerSyncResult> {
    const url = maxCustomers ? `/api/Customers/sync?maxCustomers=${maxCustomers}` : "/api/Customers/sync";
    return apiClient.post<CustomerSyncResult>(url);
  }
}

export interface CustomerSyncResult {
  totalCustomers: number;
  created: number;
  updated: number;
  failed: number;
  errors: string[];
  syncDate: string;
  message: string;
}

export interface CustomerAddress {
  addressId: number;
  addressType: string | null;
  swellAddressId: string | null;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  isDefault: boolean;
}

export interface CustomerDetail extends Customer {
  addresses: CustomerAddress[];
}

export const customerService = new CustomerService();

