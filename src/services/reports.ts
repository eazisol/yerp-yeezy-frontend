import { apiClient, API_URL } from "./api";

// Filter DTO
export interface ReportFilter {
  dateRangeType: "Today" | "Weekly" | "Monthly" | "Yearly" | "Custom";
  startDate?: string;
  endDate?: string;
  warehouse?: string;
  warehouseId?: number;
  vendorId?: number;
  sku?: string;
  variantId?: number;
  pageNumber?: number;
  pageSize?: number;
  /** Used only to force refetch when Apply is clicked; not sent to API. */
  appliedAt?: number;
}

// Orders Report
export interface DateWiseOrderTrend {
  date: string;
  orderCount: number;
}

export interface VariantWiseOrderVolume {
  sku: string;
  variantName?: string;
  quantity: number;
}

export interface OrderReportTable {
  orderId: number;
  orderNumber?: string;
  orderDate: string;
  
  // Customer details
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  
  // SKU/Variant details
  sku?: string;
  variantName?: string;
  quantity: number;
  quantityFulfilled: number;
  quantityNotFulfilled: number;
  
  productId?: number; // ProductId for navigation to ProductDetail page
  
  fulfillmentWarehouse?: string;
  status: string;
  paymentStatus?: string;
}

export interface OrdersReport {
  totalOrders: number;
  fulfilledOrders: number;
  pendingOrders: number;
  partialOrders: number;
  chinaOrders: number;
  usOrders: number;
  dateWiseTrend: DateWiseOrderTrend[];
  variantWiseVolume: VariantWiseOrderVolume[];
  orders: OrderReportTable[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// Revenue Report
export interface RevenueTrend {
  date: string;
  revenue: number;
}

export interface VariantWiseRevenue {
  sku: string;
  variantName?: string;
  revenue: number;
}

export interface WarehouseWiseRevenue {
  warehouse: string;
  revenue: number;
}

export interface RevenueReportTable {
  revenueAmount: number;
  currency: string;
  sku?: string;
  variantName?: string;
  warehouse?: string;
  date: string;
}

export interface RevenueReport {
  totalRevenue: number;
  currency: string;
  revenueTrend: RevenueTrend[];
  variantWiseRevenue: VariantWiseRevenue[];
  warehouseWiseRevenue: WarehouseWiseRevenue[];
  revenueDetails: RevenueReportTable[];
}

// Purchase Orders Report
export interface VendorWisePOValue {
  vendorName: string;
  poValue: number;
}

export interface POAging {
  poNumber: string;
  daysOpen: number;
}

export interface POReportTable {
  purchaseOrderId: number;
  poNumber: string;
  vendorName: string;
  items?: string; // Aggregated items summary (same format as Orders items)
  productId?: number;
  poDate?: string;
  orderedQuantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
  status: string;
  expectedDeliveryDate?: string;
}

export interface PurchaseOrdersReport {
  openPOs: number;
  closedPOs: number;
  partialPOs: number;
  totalPOValue: number;
  totalReceivedValue: number;
  totalOutstandingValue: number;
  vendorWisePOValue: VendorWisePOValue[];
  poAging: POAging[];
  purchaseOrders: POReportTable[];
}

// Inventory Report
export interface WarehouseStockDistribution {
  warehouse: string;
  totalUnits: number;
  totalValue: number;
}

export interface InventoryReportTable {
  sku?: string;
  variantName?: string;
  warehouse: string;
  availableQuantity: number;
  reservedQuantity?: number;
  usedStock?: number;
  totalStock: number;
  lastUpdatedDate?: string;
}

export interface InventoryReport {
  totalSKUs: number;
  totalUnits: number;
  totalValue: number;
  lowStockItems: number;
  overstockItems: number;
  warehouseDistribution: WarehouseStockDistribution[];
  inventoryDetails: InventoryReportTable[];
}

// Payments Report
export interface VendorWiseOutstanding {
  vendorName: string;
  outstandingBalance: number;
}

export interface PaymentReportTable {
  vendorName: string;
  poRef: string;
  billAmount: number;
  paidAmount: number;
  dueAmount: number;
  dueDate?: string;
}

export interface PaymentsReport {
  totalPendingPayments: number;
  totalPaidAmount: number;
  totalOutstandingBalance: number;
  pendingPaymentCount: number;
  vendorWiseOutstanding: VendorWiseOutstanding[];
  paymentDetails: PaymentReportTable[];
}

// Vendors Report
export interface VendorReportTable {
  vendorName: string;
  totalPOs: number;
  onTimePercentage: number;
  delayedPercentage: number;
  totalSpend: number;
  outstandingBalance: number;
  averageDeliveryTime?: number;
}

export interface VendorsReport {
  totalVendors: number;
  activeVendors: number;
  totalSpend: number;
  totalOutstandingBalance: number;
  vendorDetails: VendorReportTable[];
}

// Variants Report
export interface VariantReportTable {
  sku: string;
  variantName?: string;
  date: string;
  ordersCount: number;
  revenue: number;
  stockLevel: number;
}

export interface VariantsReport {
  variantDetails: VariantReportTable[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// Order Projections (YEEZY ORDER PROJECTIONS)
export interface OrderProjectionRow {
  item: string;
  totalSold: number;
  totalInventory: number;
  salesPerDay: number;
  openToSell: number;
  weeksOnHand: number | null;
  suggestedOrder: number;
  actualOrder: number;
  factory?: string;
  price: number;
  totalCost: number;
}

export interface OrderProjectionsResponse {
  items: OrderProjectionRow[];
}

class ReportsService {
  async getOrdersReport(filter: ReportFilter): Promise<OrdersReport> {
    return apiClient.post<OrdersReport>("/api/Reports/orders", filter);
  }

  async getRevenueReport(filter: ReportFilter): Promise<RevenueReport> {
    return apiClient.post<RevenueReport>("/api/Reports/revenue", filter);
  }

  async getPurchaseOrdersReport(filter: ReportFilter): Promise<PurchaseOrdersReport> {
    return apiClient.post<PurchaseOrdersReport>("/api/Reports/purchase-orders", filter);
  }

  async getInventoryReport(filter: ReportFilter): Promise<InventoryReport> {
    return apiClient.post<InventoryReport>("/api/Reports/inventory", filter);
  }

  async getPaymentsReport(filter: ReportFilter): Promise<PaymentsReport> {
    return apiClient.post<PaymentsReport>("/api/Reports/payments", filter);
  }

  async getVendorsReport(filter: ReportFilter): Promise<VendorsReport> {
    return apiClient.post<VendorsReport>("/api/Reports/vendors", filter);
  }

  async getVariantsReport(filter: ReportFilter): Promise<VariantsReport> {
    return apiClient.post<VariantsReport>("/api/Reports/variants", filter);
  }

  async getOrderProjections(filter: ReportFilter): Promise<OrderProjectionsResponse> {
    return apiClient.post<OrderProjectionsResponse>("/api/Reports/order-projections", filter);
  }

  async exportReport(
    reportType: string,
    format: "pdf" | "excel" | "csv",
    filter: ReportFilter
  ): Promise<Blob> {
    const token = localStorage.getItem("auth_token");
    
    const response = await fetch(
      `${API_URL}/api/Reports/export?reportType=${reportType}&format=${format}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(filter),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText || "Export failed",
      }));
      throw new Error(errorData.message || "Export failed");
    }

    return response.blob();
  }
}

export const reportsService = new ReportsService();
