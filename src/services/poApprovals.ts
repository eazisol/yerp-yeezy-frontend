import { apiClient } from "./api";

export interface POApproval {
  poApprovalId: number;
  purchaseOrderId: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  status: string; // Pending, Approved, Rejected
  comment?: string;
  signatureUrl?: string;
  approvedDate?: string;
  rejectedDate?: string;
  createdDate: string;
}

export interface ApprovePORequest {
  isApproved: boolean;
  comment?: string;
  signatureUrl?: string;
}

// Submit PO for approval
export const submitPOForApproval = async (
  purchaseOrderId: number
): Promise<{ message: string }> => {
  return apiClient.post<{ message: string }>(
    `/api/POApproval/${purchaseOrderId}/submit`
  );
};

// Approve or reject PO
export const approvePO = async (
  purchaseOrderId: number,
  request: ApprovePORequest
): Promise<POApproval> => {
  return apiClient.post<POApproval>(
    `/api/POApproval/${purchaseOrderId}/approve`,
    request
  );
};

// Get all approvals for a PO
export const getPOApprovals = async (
  purchaseOrderId: number
): Promise<POApproval[]> => {
  return apiClient.get<POApproval[]>(
    `/api/POApproval/${purchaseOrderId}/approvals`
  );
};

