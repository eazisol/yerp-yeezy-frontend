// Shared TypeScript types for the application

export type AppRole = "admin" | "manager" | "staff" | "viewer";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderStatus {
  pending: "pending";
  processing: "processing";
  shipped: "shipped";
  cancelled: "cancelled";
}

export interface RouteType {
  CN: "CN";
  US: "US";
  Mixed: "Mixed";
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  origin: "CN" | "US";
  cnStock: number;
  usStock: number;
  price: string;
  status: "active" | "inactive";
}

export interface Order {
  id: string;
  customer: string;
  email: string;
  items: number;
  value: string;
  route: "CN" | "US" | "Mixed";
  status: "pending" | "processing" | "shipped";
  tracking: string;
  date: string;
}
