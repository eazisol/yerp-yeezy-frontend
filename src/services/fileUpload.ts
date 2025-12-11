import { API_URL } from "./api";

export interface FileUploadResponse {
  filePath?: string; // Relative path to the uploaded file
  fileName?: string; // Original file name
  fileSize?: number; // File size in bytes
  fileType?: string; // File extension
  error?: string; // Error message if upload failed
}

// Upload a single file for GRN attachment
export const uploadGRNAttachment = async (file: File): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const token = localStorage.getItem("auth_token");
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/FileUpload/grn-attachment`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: response.statusText || "Failed to upload file",
    }));
    throw new Error(errorData.message || "Failed to upload file");
  }

  const result = await response.json();
  // Ensure camelCase mapping
  return {
    filePath: result.filePath || result.FilePath,
    fileName: result.fileName || result.FileName,
    fileSize: result.fileSize || result.FileSize,
    fileType: result.fileType || result.FileType,
    error: result.error || result.Error,
  };
};

// Upload multiple files for GRN attachments
export const uploadGRNAttachments = async (files: File[]): Promise<FileUploadResponse[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const token = localStorage.getItem("auth_token");
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/FileUpload/grn-attachments`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: response.statusText || "Failed to upload files",
    }));
    throw new Error(errorData.message || "Failed to upload files");
  }

  const results = await response.json();
  // Ensure camelCase mapping for array
  return Array.isArray(results) 
    ? results.map((result: any) => ({
        filePath: result.filePath || result.FilePath,
        fileName: result.fileName || result.FileName,
        fileSize: result.fileSize || result.FileSize,
        fileType: result.fileType || result.FileType,
        error: result.error || result.Error,
      }))
    : [];
};

// Get file download URL
export const getFileDownloadUrl = (filePath: string): string => {
  return `${API_URL}/api/FileUpload/grn-attachment?filePath=${encodeURIComponent(filePath)}`;
};
