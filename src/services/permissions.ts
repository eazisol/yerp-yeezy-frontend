// Permission service for managing permissions

import { apiClient } from "./api";

export interface Permission {
  id: number;
  menuId: number;
  roleId: number;
  menuName: string;
  menuCode: string;
  roleName: string;
  roleCode: string;
  read: boolean;
  modify: boolean;
  delete: boolean;
}

export interface PermissionRequest {
  menuId: number;
  roleId: number;
  read: boolean;
  modify: boolean;
  delete: boolean;
}

export const permissionService = {
  // Get all permissions
  async getPermissions(): Promise<Permission[]> {
    return apiClient.get<Permission[]>("/api/permissions");
  },

  // Get current user's permissions
  async getMyPermissions(): Promise<Permission[]> {
    return apiClient.get<Permission[]>("/api/permissions/me");
  },

  // Get permissions for a specific user
  async getUserPermissions(userId: number): Promise<Permission[]> {
    return apiClient.get<Permission[]>(`/api/permissions/user/${userId}`);
  },

  // Get permissions for a specific role
  async getRolePermissions(roleId: number): Promise<Permission[]> {
    return apiClient.get<Permission[]>(`/api/permissions/role/${roleId}`);
  },

  // Create or update permission
  async createOrUpdatePermission(
    request: PermissionRequest
  ): Promise<Permission> {
    return apiClient.post<Permission>("/api/permissions", request);
  },

  // Delete permission
  async deletePermission(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/permissions/${id}`);
  },
};

