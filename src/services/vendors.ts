import { apiClient } from "./api";

// Vendor interface matching backend DTO
export interface Vendor {
  vendorId: number;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  contactPerson?: string | null;
  attention?: string | null;
  status: string;
  isActive: boolean;
  createdDate: string;
  editDate?: string | null;
}

// Paginated response for vendors
export interface VendorsResponse {
  data: Vendor[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// Create vendor request
export interface CreateVendorRequest {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  attention?: string;
  status?: string;
}

// Update vendor request
export interface UpdateVendorRequest {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  attention?: string;
  status?: string;
  isActive?: boolean;
}

class VendorService {
  // Get all vendors with pagination and filters
  async getVendors(
    page: number = 1,
    pageSize: number = 50,
    search?: string,
    isActive?: boolean
  ): Promise<VendorsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    if (search) params.append("search", search);
    if (isActive !== undefined) params.append("isActive", isActive.toString());

    return apiClient.get<VendorsResponse>(`/api/Vendors?${params.toString()}`);
  }

  // Get vendor by ID
  async getVendorById(id: number): Promise<Vendor> {
    return apiClient.get<Vendor>(`/api/Vendors/${id}`);
  }

  // Create new vendor
  async createVendor(vendorData: CreateVendorRequest): Promise<Vendor> {
    return apiClient.post<Vendor>("/api/Vendors", vendorData);
  }

  // Update vendor
  async updateVendor(id: number, vendorData: UpdateVendorRequest): Promise<Vendor> {
    return apiClient.put<Vendor>(`/api/Vendors/${id}`, vendorData);
  }

  // Delete vendor (soft delete)
  async deleteVendor(id: number): Promise<void> {
    return apiClient.delete(`/api/Vendors/${id}`);
  }
}

export const vendorService = new VendorService();

