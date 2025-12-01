// Application constants

export const APP_NAME = "Yeezy Global ERP";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  PRODUCTS: "/products",
  ORDERS: "/orders",
  PURCHASE_ORDERS: "/purchase-orders",
  GRN: "/grn",
  INVENTORY: "/inventory",
  VENDORS: "/vendors",
  USERS: "/users",
  SETTINGS: "/settings",
} as const;

export const WAREHOUSES = {
  CN: "CN",
  US: "US",
} as const;

export const ORDER_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  CANCELLED: "cancelled",
} as const;

export const ROUTE_TYPES = {
  CN: "CN",
  US: "US",
  MIXED: "Mixed",
} as const;

export const USER_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff",
  VIEWER: "viewer",
} as const;

export const STOCK_ALERT_THRESHOLD = {
  CRITICAL: 20,
  LOW: 50,
} as const;

