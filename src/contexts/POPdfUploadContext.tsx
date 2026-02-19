// Tracks which PO (if any) has a PDF upload in progress (e.g. from Create/Update redirect).
// PODetail uses this to show loader on Generate PDF when user lands while background upload is running.

import { createContext, useContext, useState, ReactNode } from "react";

interface POPdfUploadContextType {
  pdfUploadPoId: number | null;
  setPdfUploadPoId: (id: number | null) => void;
}

const POPdfUploadContext = createContext<POPdfUploadContextType | undefined>(undefined);

export function POPdfUploadProvider({ children }: { children: ReactNode }) {
  const [pdfUploadPoId, setPdfUploadPoId] = useState<number | null>(null);
  return (
    <POPdfUploadContext.Provider value={{ pdfUploadPoId, setPdfUploadPoId }}>
      {children}
    </POPdfUploadContext.Provider>
  );
}

export function usePOPdfUpload() {
  const ctx = useContext(POPdfUploadContext);
  if (ctx === undefined) throw new Error("usePOPdfUpload must be used within POPdfUploadProvider");
  return ctx;
}
