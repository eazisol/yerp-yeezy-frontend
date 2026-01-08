// API client for backend communication

// export const API_URL = import.meta.env.VITE_API_URL || "https://yerp-yeezy.yehtohoga.com";
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5234";

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem("auth_token");
    
    const headers: HeadersInit = {
      ...options.headers,
    };

    // Only set Content-Type if not FormData (browser will set it with boundary for FormData)
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = headers["Content-Type"] || "application/json";
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText || "An error occurred",
      }));
      
      // Create error object with full error data for better error handling
      const error = new Error(errorData.message || "An error occurred");
      // Attach full error data to error object for extraction
      (error as any).response = {
        data: errorData,
        status: response.status,
        statusText: response.statusText,
      };
      throw error;
    }

    // Handle empty responses
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }
    
    return {} as T;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const isFormData = data instanceof FormData;
    const headers: HeadersInit = {};
    
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }
    // For FormData, let browser set Content-Type with boundary

    return this.request<T>(endpoint, {
      method: "POST",
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
      headers,
      ...options,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient(API_URL);
