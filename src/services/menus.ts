// Menu service for fetching menus from API

import { apiClient } from "./api";

export interface Menu {
  id: number;
  name: string;
  code: string | null;
  route: string | null;
  icon: string | null;
  parentMenuId: number | null;
  orderBy: number;
  isActive: boolean;
}

// Paginated response interface
interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export const menuService = {
  // Get all active menus (fetches all with large pageSize)
  async getMenus(): Promise<Menu[]> {
    // Fetch all menus with a large page size to get everything
    const response = await apiClient.get<PaginatedResponse<Menu>>("/api/menus?pageSize=1000");
    return response.data;
  },

  // Get menus with pagination
  async getMenusPaginated(page: number = 1, pageSize: number = 50, search?: string): Promise<PaginatedResponse<Menu>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    if (search) {
      params.append("search", search);
    }
    return apiClient.get<PaginatedResponse<Menu>>(`/api/menus?${params.toString()}`);
  },

  // Get menu by ID
  async getMenuById(id: number): Promise<Menu> {
    return apiClient.get<Menu>(`/api/menus/${id}`);
  },
};

