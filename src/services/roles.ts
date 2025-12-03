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

export const roleService = {
  // Get all active roles
  async getRoles(): Promise<Role[]> {
    return apiClient.get<Role[]>("/api/roles");
  },

  // Get role by ID
  async getRoleById(id: number): Promise<Role> {
    return apiClient.get<Role>(`/api/roles/${id}`);
  },
};

