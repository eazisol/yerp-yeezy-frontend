import { apiClient } from "./api";

export interface GRNLineItem {
  grnLineItemId: number;
  grnId: number;
  purchaseOrderLineItemId: number;
  productId: number;
  productName?: string;
  productVariantId?: number;
  sku?: string;
  receivedQuantity: number;
  unitPrice: number;
  lineTotal: number;
  condition?: string;
  notes?: string;
}

export interface GRNAttachment {
  attachmentId: number;
  grnId: number;
  filePath: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  description?: string;
  createdDate: string;
}

export interface GRN {
  grnId: number;
  grnNumber: string;
  purchaseOrderId: number;
  poNumber?: string;
  warehouseId: number;
  warehouseName?: string;
  receivedDate: string;
  status?: string;
  receivedBy?: string;
  receivedByUserId?: number;
  notes?: string;
  attachmentPath?: string; // Deprecated - use attachments instead
  attachments: GRNAttachment[];
  totalReceivedValue: number;
  createdDate: string;
  editDate?: string;
  lineItems: GRNLineItem[];
}

export interface CreateGRNAttachmentRequest {
  filePath: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  description?: string;
}

export interface CreateGRNRequest {
  purchaseOrderId: number;
  warehouseId: number;
  receivedDate: string;
  receivedBy?: string;
  notes?: string;
  attachmentPath?: string; // Deprecated - use attachments instead
  attachments?: CreateGRNAttachmentRequest[];
  lineItems: CreateGRNLineItemRequest[];
}

export interface CreateGRNLineItemRequest {
  purchaseOrderLineItemId: number;
  receivedQuantity: number;
  condition?: string;
  notes?: string;
}

export interface UpdateGRNAttachmentRequest {
  attachmentId?: number; // null for new attachments
  filePath: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  description?: string;
}

export interface UpdateGRNRequest {
  warehouseId: number;
  receivedDate: string;
  receivedBy?: string;
  notes?: string;
  attachmentPath?: string; // Deprecated - use attachments instead
  attachments?: UpdateGRNAttachmentRequest[];
  lineItems: UpdateGRNLineItemRequest[];
}

export interface UpdateGRNLineItemRequest {
  grnLineItemId?: number;
  purchaseOrderLineItemId: number;
  receivedQuantity: number;
  condition?: string;
  notes?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Get all GRNs
export const getGRNs = async (
  page: number = 1,
  pageSize: number = 50,
  purchaseOrderId?: number,
  warehouseId?: number
): Promise<PaginatedResponse<GRN>> => {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("pageSize", pageSize.toString());
  if (purchaseOrderId) params.append("purchaseOrderId", purchaseOrderId.toString());
  if (warehouseId) params.append("warehouseId", warehouseId.toString());

  return apiClient.get<PaginatedResponse<GRN>>(
    `/api/GRN?${params.toString()}`
  );
};

// Get GRN by ID
export const getGRNById = async (id: number): Promise<GRN> => {
  return apiClient.get<GRN>(`/api/GRN/${id}`);
};

// Create GRN
export const createGRN = async (request: CreateGRNRequest): Promise<GRN> => {
  return apiClient.post<GRN>("/api/GRN", request);
};

// Update GRN
export const updateGRN = async (id: number, request: UpdateGRNRequest): Promise<GRN> => {
  return apiClient.put<GRN>(`/api/GRN/${id}`, request);
};
