// Authentication service for backend API

import { apiClient } from "./api";
import { Permission } from "./permissions";

export interface User {
  id: number;
  email: string;
  fullName: string | null;
  roles: string[];
  permissions?: Permission[]; // Make it optional
  vendorId?: number | null; // Vendor ID (for vendor portal users)
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
}

export interface ChangePasswordRequest {
  newPassword: string;
  currentPassword?: string;
  isAdminOverride?: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ValidateTokenRequest {
  token: string;
}

class AuthService {
  private tokenKey = "auth_token";
  private userKey = "auth_user";

  // Login user
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      "/api/auth/login",
      credentials
    );
    this.setAuth(response);
    return response;
  }

  // Reg ister new user
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      "/api/auth/register",
      data
    );
    this.setAuth(response);
    return response;
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const user = await apiClient.get<User>("/api/auth/me");
      this.setUser(user);
      return user;
    } catch (error) {
      this.clearAuth();
      return null;
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await apiClient.post("/api/auth/logout");
    } catch (error) {
      // Ignore errors on logout
    } finally {
      this.clearAuth();
    }
  }

  // Change password
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    return apiClient.post("/api/auth/change-password", data);
  }

  // Forgot password - request password reset
  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    return apiClient.post("/api/auth/forgot-password", data);
  }

  // Validate reset token
  async validateResetToken(data: ValidateTokenRequest): Promise<{ message: string }> {
    return apiClient.post("/api/auth/validate-reset-token", data);
  }

  // Reset password
  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    return apiClient.post("/api/auth/reset-password", data);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Get stored user
  getUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // Set authentication data
  private setAuth(authResponse: AuthResponse): void {
    localStorage.setItem(this.tokenKey, authResponse.token);
    // Ensure permissions array exists
    const userWithPermissions = {
      ...authResponse.user,
      permissions: authResponse.user.permissions || []
    };
    localStorage.setItem(this.userKey, JSON.stringify(userWithPermissions));
  }

  // Set user data
  private setUser(user: User): void {
    // Ensure permissions array exists
    const userWithPermissions = {
      ...user,
      permissions: user.permissions || []
    };
    localStorage.setItem(this.userKey, JSON.stringify(userWithPermissions));
  }

  // Clear authentication data
  clearAuth(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }
}

// Export auth service instance
const authService = new AuthService();
export { authService };

