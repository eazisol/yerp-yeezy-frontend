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

export const menuService = {
  // Get all active menus
  async getMenus(): Promise<Menu[]> {
    return apiClient.get<Menu[]>("/api/menus");
  },

  // Get menu by ID
  async getMenuById(id: number): Promise<Menu> {
    return apiClient.get<Menu>(`/api/menus/${id}`);
  },
};

