import { apiClient } from "./api";

// Warehouse interface matching backend DTO
export interface Warehouse {
  warehouseId: number;
  warehouseCode: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  contactPerson1?: string | null;
  contactPhone1?: string | null;
  contactPerson2?: string | null;
  contactPhone2?: string | null;
  email?: string | null;
  status: string;
  isActive: boolean;
  createdDate: string;
  editDate?: string | null;
}

// Paginated response for warehouses
export interface WarehousesResponse {
  data: Warehouse[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// Create warehouse request
export interface CreateWarehouseRequest {
  warehouseCode: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  contactPerson1?: string;
  contactPhone1?: string;
  contactPerson2?: string;
  contactPhone2?: string;
  email?: string;
  status?: string;
}

// Update warehouse request
export interface UpdateWarehouseRequest {
  warehouseCode?: string;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  contactPerson1?: string;
  contactPhone1?: string;
  contactPerson2?: string;
  contactPhone2?: string;
  email?: string;
  status?: string;
  isActive?: boolean;
}

class WarehouseService {
  // Get all warehouses with pagination and filters
  async getWarehouses(
    page: number = 1,
    pageSize: number = 50,
    search?: string,
    isActive?: boolean
  ): Promise<WarehousesResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    if (search) params.append("search", search);
    if (isActive !== undefined) params.append("isActive", isActive.toString());

    return apiClient.get<WarehousesResponse>(`/api/Warehouses?${params.toString()}`);
  }

  // Get warehouse by ID
  async getWarehouseById(id: number): Promise<Warehouse> {
    return apiClient.get<Warehouse>(`/api/Warehouses/${id}`);
  }

  // Create new warehouse
  async createWarehouse(warehouseData: CreateWarehouseRequest): Promise<Warehouse> {
    return apiClient.post<Warehouse>("/api/Warehouses", warehouseData);
  }

  // Update warehouse
  async updateWarehouse(id: number, warehouseData: UpdateWarehouseRequest): Promise<Warehouse> {
    return apiClient.put<Warehouse>(`/api/Warehouses/${id}`, warehouseData);
  }

  // Delete warehouse (soft delete)
  async deleteWarehouse(id: number): Promise<void> {
    return apiClient.delete(`/api/Warehouses/${id}`);
  }
}

export const warehouseService = new WarehouseService();

