// Role service for fetching roles from API

import { apiClient } from "./api";

export interface Role {
  id: number;
  name: string;
  code: string;
  description: string | null;
  orderBy: number;
  isActive: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export const roleService = {
  // Get all active roles (returns all roles, not paginated)
  async getRoles(): Promise<Role[]> {
    // Request with large pageSize to get all roles
    const response = await apiClient.get<PaginatedResponse<Role>>("/api/roles?page=1&pageSize=1000");
    return response.data || [];
  },

  // Get role by ID
  async getRoleById(id: number): Promise<Role> {
    return apiClient.get<Role>(`/api/roles/${id}`);
  },
};

