import { apiClient } from "./api";

export interface FileUploadResponse {
  filePath: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  error?: string;
}

class FileUploadService {
  // Upload PO signature
  async uploadPOSignature(file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("auth_token");
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5234";

    const response = await fetch(`${baseUrl}/api/FileUpload/po-signature`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to upload signature");
    }

    return response.json();
  }

  // Get signature file URL
  getSignatureUrl(filePath: string): string {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5234";
    return `${baseUrl}/api/FileUpload/po-signature?filePath=${encodeURIComponent(filePath)}`;
  }

  // Upload GRN attachment
  async uploadGRNAttachment(file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("auth_token");
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5234";

    const response = await fetch(`${baseUrl}/api/FileUpload/grn-attachment`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to upload GRN attachment");
    }

    return response.json();
  }

  // Get GRN attachment file download URL
  getGRNAttachmentUrl(filePath: string): string {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5234";
    return `${baseUrl}/api/FileUpload/grn-attachment?filePath=${encodeURIComponent(filePath)}`;
  }

  // Upload PO PDF
  async uploadPOPDF(file: File, purchaseOrderId: number): Promise<FileUploadResponse> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/72465c75-c7de-4a12-980e-add15152ec70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'fileUpload.ts:73',message:'uploadPOPDF entry',data:{fileName:file.name,fileSize:file.size,fileType:file.type,purchaseOrderId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion

    const formData = new FormData();
    formData.append("file", file);
    formData.append("purchaseOrderId", purchaseOrderId.toString());

    const token = localStorage.getItem("auth_token");
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5234";

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/72465c75-c7de-4a12-980e-add15152ec70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'fileUpload.ts:81',message:'Sending upload request',data:{url:`${baseUrl}/api/FileUpload/po-pdf`,hasToken:!!token,formDataKeys:['file','purchaseOrderId']},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    // #endregion

    const response = await fetch(`${baseUrl}/api/FileUpload/po-pdf`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/72465c75-c7de-4a12-980e-add15152ec70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'fileUpload.ts:89',message:'Upload response received',data:{status:response.status,statusText:response.statusText,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
    // #endregion

    if (!response.ok) {
      const error = await response.json();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/72465c75-c7de-4a12-980e-add15152ec70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'fileUpload.ts:92',message:'Upload error',data:{error,status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
      // #endregion
      throw new Error(error.message || "Failed to upload PO PDF");
    }

    const result = await response.json();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/72465c75-c7de-4a12-980e-add15152ec70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'fileUpload.ts:97',message:'Upload success',data:{result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
    // #endregion
    return result;
  }

  // Get PO PDF download URL
  getPOPDFUrl(filePath: string): string {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5234";
    return `${baseUrl}/api/FileUpload/po-pdf?filePath=${encodeURIComponent(filePath)}`;
  }
}

export const fileUploadService = new FileUploadService();

// Export individual functions for backward compatibility
export const getFileDownloadUrl = (filePath: string): string => {
  // Determine file type based on path and return appropriate URL
  if (filePath.includes("po-signatures")) {
    return fileUploadService.getSignatureUrl(filePath);
  } else if (filePath.includes("grn-attachments")) {
    return fileUploadService.getGRNAttachmentUrl(filePath);
  }
  // Default to GRN attachment for backward compatibility
  return fileUploadService.getGRNAttachmentUrl(filePath);
};

export const uploadGRNAttachment = (file: File): Promise<FileUploadResponse> => {
  return fileUploadService.uploadGRNAttachment(file);
};
