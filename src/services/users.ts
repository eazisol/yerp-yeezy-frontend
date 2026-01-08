import { apiClient } from "./api";

// User interface matching backend DTO
export interface User {
  id: number;
  email: string;
  fullName: string | null;
  roles: string[];
  isActive: boolean;
  isPOApprover: boolean;
  vendorId?: number | null; // Vendor ID (for vendor portal users)
  createdDate: string;
  editDate: string | null;
}

// Paginated response for users
export interface UsersResponse {
  data: User[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// Create user request
export interface CreateUserRequest {
  email: string;
  password: string;
  fullName?: string;
  roleIds?: number[];
  isPOApprover?: boolean;
  vendorId?: number | null; // Vendor ID (for vendor portal users)
}

// Update user request
export interface UpdateUserRequest {
  email?: string;
  password?: string;
  fullName?: string;
  isActive?: boolean;
  roleIds?: number[];
  isPOApprover?: boolean;
  vendorId?: number | null; // Vendor ID (for vendor portal users)
}

class UserService {
  // Get all users with pagination and filters
  async getUsers(
    page: number = 1,
    pageSize: number = 50,
    search?: string,
    isActive?: boolean
  ): Promise<UsersResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    if (search) params.append("search", search);
    if (isActive !== undefined) params.append("isActive", isActive.toString());

    return apiClient.get<UsersResponse>(`/api/Users?${params.toString()}`);
  }

  // Get user by ID
  async getUserById(id: number): Promise<User> {
    return apiClient.get<User>(`/api/Users/${id}`);
  }

  // Create new user
  async createUser(userData: CreateUserRequest): Promise<User> {
    return apiClient.post<User>("/api/Users", userData);
  }

  // Update user
  async updateUser(id: number, userData: UpdateUserRequest): Promise<User> {
    return apiClient.put<User>(`/api/Users/${id}`, userData);
  }

  // Delete user (soft delete)
  async deleteUser(id: number): Promise<void> {
    return apiClient.delete(`/api/Users/${id}`);
  }
}

export const userService = new UserService();

