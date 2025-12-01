// Authentication service for backend API

import { apiClient } from "./api";

export interface User {
  id: number;
  email: string;
  fullName: string | null;
  roles: string[];
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

  // Register new user
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
    localStorage.setItem(this.userKey, JSON.stringify(authResponse.user));
  }

  // Set user data
  private setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  // Clear authentication data
  clearAuth(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }
}

export const authService = new AuthService();

