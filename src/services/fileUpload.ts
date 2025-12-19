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
