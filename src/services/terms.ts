import { apiClient } from "./api";

export interface Term {
  termId: number;
  term: string;
  isActive: boolean;
  orderBy: number;
  createdDate: string;
  editDate?: string;
}

// Get all terms (optionally filter by active status)
export const getTerms = async (activeOnly?: boolean): Promise<Term[]> => {
  const params = new URLSearchParams();
  if (activeOnly !== undefined) {
    params.append("activeOnly", activeOnly.toString());
  }

  return apiClient.get<Term[]>(`/api/Terms?${params.toString()}`);
};

// Get term by ID
export const getTermById = async (id: number): Promise<Term> => {
  return apiClient.get<Term>(`/api/Terms/${id}`);
};

// Create term
export const createTerm = async (request: {
  term: string;
  isActive?: boolean;
  orderBy?: number;
}): Promise<Term> => {
  return apiClient.post<Term>("/api/Terms", request);
};

// Update term
export const updateTerm = async (
  id: number,
  request: {
    term?: string;
    isActive?: boolean;
    orderBy?: number;
  }
): Promise<Term> => {
  return apiClient.put<Term>(`/api/Terms/${id}`, request);
};

// Delete term
export const deleteTerm = async (id: number): Promise<void> => {
  return apiClient.delete<void>(`/api/Terms/${id}`);
};
