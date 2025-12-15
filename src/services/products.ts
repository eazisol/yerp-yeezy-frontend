import { apiClient } from "./api";

export interface Product {
  productId: number;
  swellProductId: string;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  comparePrice: number | null;
  currency: string | null;
  status: string;
  type: string;
  isActive: boolean;
  origin: string | null;
  category: string | null;
  createdDate: string;
  editDate: string | null;
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  cnStock: number;
  usStock: number;
}

export interface ProductsResponse {
  data: Product[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  description?: string;
  price: number;
  comparePrice?: number;
  currency?: string;
  status?: string;
  type?: string;
  origin?: string;
  category?: string;
  tags?: string;
  images?: string;
  totalStock?: number;
  reservedStock?: number;
  reorderPoint?: number;
  cnStock?: number;
  usStock?: number;
}

export interface UpdateProductRequest {
  sku?: string;
  name?: string;
  description?: string;
  price?: number;
  comparePrice?: number;
  currency?: string;
  status?: string;
  type?: string;
  origin?: string;
  category?: string;
  tags?: string;
  images?: string;
  totalStock?: number;
  reservedStock?: number;
  reorderPoint?: number;
  cnStock?: number;
  usStock?: number;
}

class ProductService {
  async getProducts(
    page: number = 1,
    pageSize: number = 50,
    search?: string,
    isActive?: string,
    origin?: string
  ): Promise<ProductsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    if (search) params.append("search", search);
    if (isActive !== undefined) params.append("isActive", isActive);
    if (origin) params.append("origin", origin);

    return apiClient.get<ProductsResponse>(`/api/Products?${params.toString()}`);
  }

  async getProductById(id: number): Promise<any> {
    return apiClient.get(`/api/Products/${id}`);
  }

  async createProduct(productData: CreateProductRequest): Promise<Product> {
    return apiClient.post<Product>("/api/Products", productData);
  }

  async updateProduct(id: number, productData: UpdateProductRequest): Promise<Product> {
    return apiClient.put<Product>(`/api/Products/${id}`, productData);
  }

  async deleteProduct(id: number): Promise<void> {
    return apiClient.delete(`/api/Products/${id}`);
  }

  // Get total product count from Swell
  async getSwellProductCount(): Promise<{ count: number; message: string }> {
    return apiClient.get<{ count: number; message: string }>("/api/Products/sync/count");
  }

  // Sync all products from Swell
  async syncProductsFromSwell(): Promise<ProductSyncResult> {
    return apiClient.post<ProductSyncResult>("/api/Products/sync");
  }

  // Import products from Excel file
  async importProductsFromExcel(file: File): Promise<ProductImportResult> {
    const formData = new FormData();
    formData.append("file", file);
    
    return apiClient.post<ProductImportResult>("/api/Products/import-excel", formData);
  }
}

export interface ProductSyncResult {
  totalProducts: number;
  created: number;
  updated: number;
  failed: number;
  errors: string[];
  syncDate: string;
  message: string;
}

export interface ProductImportResult {
  totalRows: number;
  totalVariantsInFile: number; // Total variants found in Excel file
  productsCreated: number;
  productsUpdated: number;
  variantsCreated: number;
  variantsUpdated: number;
  errors: number;
  errorMessages: string[];
  message: string;
}

export const productService = new ProductService();

