import { apiClient } from "./api";

export interface PurchaseOrderLineItem {
  lineItemId: number;
  purchaseOrderId: number;
  productId: number;
  productName?: string;
  productVariantId?: number;
  productVariantName?: string; // Variant name
  productVariantSku?: string; // Variant SKU
  productVariantAttributes?: string; // Variant attributes (JSON with images)
  sku?: string; // SKU (prefer variant SKU, fallback to product SKU)
  orderedQuantity: number;
  receivedQuantity: number;
  pendingQuantity: number;
  unitPrice: number;
  lineTotal: number;
  notes?: string;
}

export interface PurchaseOrder {
  purchaseOrderId: number;
  poNumber: string;
  vendorId: number;
  vendorName?: string;
  warehouseId?: number;
  warehouseName?: string;
  status: string;
  approvalStatus?: string;
  approvedBy?: number;
  approvedByName?: string;
  approvedDate?: string;
  releasedDate?: string;
  isSentToVendor: boolean;
  vendorAcceptedDate?: string;
  isVendorAccepted: boolean;
  notes?: string;
  vendorNotes?: string;
  deliveryTerm?: string;
  remarks?: string;
  specification?: string;
  packing?: string;
  others?: string;
  miscAmount: number;
  poDate?: string;
  termId?: number;
  termName?: string;
  totalValue: number;
  receivedValue: number;
  remainingBalance: number;
  paymentStatus?: string;
  expectedDeliveryDate?: string;
  pdfPath?: string;
  createdDate: string;
  editDate?: string;
  createdBy?: number;
  createdByName?: string;
  lineItems: PurchaseOrderLineItem[];
  approvals?: Array<{
    poApprovalId: number;
    purchaseOrderId: number;
    userId: number;
    userName?: string;
    userEmail?: string;
    status: string;
    comment?: string;
    signatureUrl?: string;
    approvedDate?: string;
    rejectedDate?: string;
    createdDate: string;
  }>;
  payments?: POPayment[];
  paymentsTotal: number;
  paymentBalance: number;
}

export interface POPayment {
  paymentId: number;
  purchaseOrderId: number;
  amount: number;
  type: number; // 1 = Advance, 2 = Normal Payment
  typeName: string; // "Advance" or "Normal Payment"
  paymentDate: string;
  notes?: string;
  createdDate: string;
  editDate?: string;
}

export interface CreatePurchaseOrderRequest {
  poNumber?: string;
  status?: string;
  paymentStatus?: string;
  vendorId: number;
  warehouseId?: number;
  notes?: string;
  deliveryTerm?: string;
  remarks?: string;
  specification?: string;
  packing?: string;
  others?: string;
  miscAmount?: number;
  poDate?: string;
  termId?: number;
  expectedDeliveryDate?: string;
  lineItems: CreatePurchaseOrderLineItemRequest[];
  payments?: CreatePOPaymentRequest[];
}

export interface CreatePOPaymentRequest {
  amount: number;
  type: number; // 1 = Advance, 2 = Normal Payment
  paymentDate: string;
  notes?: string;
}

export interface CreatePurchaseOrderLineItemRequest {
  productId: number;
  productVariantId?: number;
  orderedQuantity: number;
  unitPrice: number;
  notes?: string;
}

export interface UpdatePurchaseOrderRequest {
  poNumber?: string;
  status?: string;
  paymentStatus?: string;
  warehouseId?: number;
  notes?: string;
  deliveryTerm?: string;
  remarks?: string;
  specification?: string;
  packing?: string;
  others?: string;
  miscAmount?: number;
  poDate?: string;
  termId?: number;
  expectedDeliveryDate?: string;
  lineItems?: UpdatePurchaseOrderLineItemRequest[];
  payments?: CreatePOPaymentRequest[];
}

export interface UpdatePurchaseOrderLineItemRequest {
  lineItemId?: number;
  productId: number;
  productVariantId?: number;
  orderedQuantity: number;
  unitPrice: number;
  notes?: string;
}

export interface ApprovePurchaseOrderRequest {
  isApproved: boolean;
  notes?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Get all purchase orders
export const getPurchaseOrders = async (
  page: number = 1,
  pageSize: number = 50,
  status?: string,
  vendorId?: number
): Promise<PaginatedResponse<PurchaseOrder>> => {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("pageSize", pageSize.toString());
  if (status) params.append("status", status);
  if (vendorId) params.append("vendorId", vendorId.toString());

  return apiClient.get<PaginatedResponse<PurchaseOrder>>(
    `/api/PurchaseOrders?${params.toString()}`
  );
};

// Get purchase order by ID
export const getPurchaseOrderById = async (
  id: number
): Promise<PurchaseOrder> => {
  return apiClient.get<PurchaseOrder>(`/api/PurchaseOrders/${id}`);
};

// Create purchase order
export const createPurchaseOrder = async (
  request: CreatePurchaseOrderRequest
): Promise<PurchaseOrder> => {
  return apiClient.post<PurchaseOrder>("/api/PurchaseOrders", request);
};

// Update purchase order
export const updatePurchaseOrder = async (
  id: number,
  request: UpdatePurchaseOrderRequest
): Promise<PurchaseOrder> => {
  return apiClient.put<PurchaseOrder>(`/api/PurchaseOrders/${id}`, request);
};

// Delete purchase order
export const deletePurchaseOrder = async (id: number): Promise<void> => {
  return apiClient.delete<void>(`/api/PurchaseOrders/${id}`);
};

// Submit PO for approval
export const submitForApproval = async (
  id: number
): Promise<{ message: string }> => {
  return apiClient.post<{ message: string }>(
    `/api/PurchaseOrders/${id}/submit-for-approval`
  );
};

// Approve purchase order
export const approvePurchaseOrder = async (
  id: number,
  request: ApprovePurchaseOrderRequest
): Promise<PurchaseOrder> => {
  return apiClient.post<PurchaseOrder>(
    `/api/PurchaseOrders/${id}/approve`,
    request
  );
};

// Send purchase order to vendor
export const sendPurchaseOrderToVendor = async (
  id: number
): Promise<{ message: string }> => {
  return apiClient.post<{ message: string }>(
    `/api/PurchaseOrders/${id}/send-to-vendor`
  );
};

// Update payment status
export const updatePaymentStatus = async (
  id: number,
  paymentStatus: string
): Promise<PurchaseOrder> => {
  return apiClient.put<PurchaseOrder>(`/api/PurchaseOrders/${id}/payment-status`, {
    paymentStatus,
  });
};
