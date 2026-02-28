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
  sizes?: string | null;
  createdDate: string;
  editDate: string | null;
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  cnStock: number;
  usStock: number;
  variantCount?: number;
  variants?: ProductVariant[];
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
    origin?: string,
    vendorId?: number,
    startDate?: string,
    endDate?: string
  ): Promise<ProductsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    if (search) params.append("search", search);
    if (isActive !== undefined) params.append("isActive", isActive);
    if (origin) params.append("origin", origin);
    if (vendorId !== undefined && vendorId > 0) params.append("vendorId", vendorId.toString());
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    return apiClient.get<ProductsResponse>(`/api/Products?${params.toString()}`);
  }

  // Export products to CSV
  async exportProductsToCsv(
    search?: string,
    isActive?: string,
    origin?: string,
    startDate?: string,
    endDate?: string
  ): Promise<Blob> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (isActive !== undefined) params.append("isActive", isActive);
    if (origin) params.append("origin", origin);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const token = localStorage.getItem("auth_token");
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5234";
    
    const response = await fetch(`${baseUrl}/api/Products/export-csv?${params.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to export products");
    }

    return response.blob();
  }

  async getProductById(id: number): Promise<ProductDetail> {
    return apiClient.get<ProductDetail>(`/api/Products/${id}`);
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

  // Import products from CSV file (same column format as export)
  async importProductsFromCsv(file: File): Promise<ProductImportResult> {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<ProductImportResult>("/api/Products/import-csv", formData);
  }

  // Get low-stock variants for a vendor (WeeksOnHand formula; for PO "Load low stock variants"). Returns cost price as vendorCost.
  async getLowStockVariantsByVendor(vendorId: number): Promise<LowStockVariantForVendor[]> {
    return apiClient.get<LowStockVariantForVendor[]>(
      `/api/Products/low-stock-variants-by-vendor?vendorId=${encodeURIComponent(vendorId)}`
    );
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

// Low-stock variant for a vendor (WeeksOnHand formula). VendorCost = cost price for PO line.
export interface LowStockVariantForVendor {
  productId: number;
  variantId: number;
  productName: string;
  productSku: string;
  variantName: string | null;
  variantSku: string | null;
  currentStock: number;
  weeksOnHand: number;
  averageDailySales: number;
  vendorCost: number; // Cost price from this vendor (for PO unit price)
  status: string; // "low" | "critical"
}

// Product Variant interface
export interface ProductVariant {
  variantId: number;
  name: string | null;
  sku: string | null;
  variantOptions?: string | null;
  description?: string | null;
  metaDescription?: string | null;
  price: number | null;
  comparePrice: number | null;
  attributes: string | null; // JSON string with variant attributes
  origin: string | null;
  chartOfAccount: string | null;
  revenueParentAccount: string | null;
  revenueSubAccount: string | null;
  hts?: string | null;
  upc: string | null;
  cog: string | null;
  cogParentAccount: string | null;
  cogSubAccount: string | null;
  variantSlug: string | null;
  availableStock: number;
  vendors: VariantVendor[];
  warehouseInventories?: WarehouseInventory[]; // Variant-level warehouse inventory
}

// Variant Vendor interface
export interface VariantVendor {
  vendorId: number;
  vendorName: string;
  supplierType: string;
  cost: number | null;
}

// Product Detail interface (includes variants)
export interface ProductDetail {
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
  color: string | null;
  sizes: string | null;
  gender: string | null;
  option: string | null;
  slot: string | null;
  shippingWeight: number | null;
  metaDescription: string | null;
  tags: string | null;
  images: string | null;
  createdDate: string;
  editDate: string | null;
  inventory: Inventory | null;
  warehouseInventories: WarehouseInventory[];
  variants: ProductVariant[];
}

// Inventory interface
export interface Inventory {
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  inTransit: number;
  reorderPoint: number;
  lastStockUpdate: string | null;
}

// Warehouse Inventory interface
export interface WarehouseInventory {
  warehouseInventoryId: number;
  productVariantId?: number | null; // Null for product-level, set for variant-level
  warehouseCode: string;
  availableStock: number;
  reservedStock: number;
  inTransit: number;
  lastUpdated: string | null;
}

export const productService = new ProductService();

