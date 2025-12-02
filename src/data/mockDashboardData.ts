// Mock data for Dashboard KPIs

export interface DailyOrderMetrics {
  totalOrders: number;
  totalOrderValue: number;
  previousDayOrders: number;
  previousDayValue: number;
  changePercentage: number;
  valueChangePercentage: number;
}

export interface OrderStatusBreakdown {
  fulfilled: number;
  pending: number;
  partiallyShipped: number;
  total: number;
}

export interface DailyShipments {
  cnShipments: number;
  usShipments: number;
  totalShipments: number;
  date: string;
}

export interface WarehouseInventory {
  warehouse: "CN" | "US";
  totalValue: number;
  totalSKUs: number;
  totalUnits: number;
}

export interface StockAlert {
  sku: string;
  name: string;
  currentStock: number;
  warehouse: "CN" | "US";
  status: "low" | "critical";
  threshold: number;
}

export interface GRNStatus {
  pending: number;
  completed: number;
  total: number;
  recentGRNs: Array<{
    id: string;
    grnNumber: string;
    poNumber: string;
    status: "pending" | "completed";
    date: string;
  }>;
}

export interface VendorBalance {
  vendorId: number;
  vendorName: string;
  pendingAmount: number;
  paidAmount: number;
  totalBalance: number;
  lastUpdated: string;
}

export interface VendorPerformance {
  vendorId: number;
  vendorName: string;
  onTimePercentage: number;
  totalDeliveries: number;
  onTimeDeliveries: number;
  averageDeliveryDays: number;
}

export interface POAging {
  age0to30: { count: number; value: number };
  age31to60: { count: number; value: number };
  age61to90: { count: number; value: number };
  age90Plus: { count: number; value: number };
}

export interface TotalInventoryValue {
  totalValue: number;
  cnValue: number;
  usValue: number;
  previousMonthValue: number;
  changePercentage: number;
}

export interface TrendData {
  date: string;
  orders: number;
  value: number;
  shipments: number;
}

// Daily Metrics Mock Data
export const dailyOrderMetrics: DailyOrderMetrics = {
  totalOrders: 142,
  totalOrderValue: 28450.75,
  previousDayOrders: 128,
  previousDayValue: 25120.50,
  changePercentage: 10.9,
  valueChangePercentage: 13.2,
};

export const orderStatusBreakdown: OrderStatusBreakdown = {
  fulfilled: 89,
  pending: 32,
  partiallyShipped: 21,
  total: 142,
};

export const dailyShipments: DailyShipments = {
  cnShipments: 78,
  usShipments: 64,
  totalShipments: 142,
  date: new Date().toISOString().split('T')[0],
};

export const warehouseInventory: WarehouseInventory[] = [
  {
    warehouse: "CN",
    totalValue: 1250000.00,
    totalSKUs: 245,
    totalUnits: 12500,
  },
  {
    warehouse: "US",
    totalValue: 980000.00,
    totalSKUs: 198,
    totalUnits: 8900,
  },
];

export const stockAlerts: StockAlert[] = [
  { sku: "YZY-SLIDE-BN-42", name: "Yeezy Slide Bone", currentStock: 12, warehouse: "CN", status: "critical", threshold: 20 },
  { sku: "YZY-350-CW-40", name: "Yeezy 350 Cloud White", currentStock: 28, warehouse: "US", status: "low", threshold: 50 },
  { sku: "YZY-700-WR-43", name: "Yeezy 700 Wave Runner", currentStock: 18, warehouse: "CN", status: "critical", threshold: 20 },
  { sku: "YZY-FOAM-MXT-39", name: "Yeezy Foam Runner MXT", currentStock: 35, warehouse: "US", status: "low", threshold: 50 },
  { sku: "YZY-450-CLD-41", name: "Yeezy 450 Cloud", currentStock: 15, warehouse: "CN", status: "critical", threshold: 20 },
  { sku: "YZY-500-UTL-42", name: "Yeezy 500 Utility Black", currentStock: 42, warehouse: "US", status: "low", threshold: 50 },
];

export const grnStatus: GRNStatus = {
  pending: 8,
  completed: 24,
  total: 32,
  recentGRNs: [
    { id: "1", grnNumber: "GRN-2025-001", poNumber: "PO-2025-045", status: "pending", date: "2025-01-12" },
    { id: "2", grnNumber: "GRN-2025-002", poNumber: "PO-2025-046", status: "completed", date: "2025-01-11" },
    { id: "3", grnNumber: "GRN-2025-003", poNumber: "PO-2025-047", status: "pending", date: "2025-01-12" },
    { id: "4", grnNumber: "GRN-2025-004", poNumber: "PO-2025-048", status: "completed", date: "2025-01-10" },
  ],
};

// Monthly/Strategic Metrics Mock Data
export const vendorBalances: VendorBalance[] = [
  {
    vendorId: 1,
    vendorName: "Sneaker Supply Co.",
    pendingAmount: 45000.00,
    paidAmount: 125000.00,
    totalBalance: 170000.00,
    lastUpdated: "2025-01-10T10:30:00Z",
  },
  {
    vendorId: 2,
    vendorName: "Global Footwear Ltd.",
    pendingAmount: 32000.00,
    paidAmount: 98000.00,
    totalBalance: 130000.00,
    lastUpdated: "2025-01-11T14:20:00Z",
  },
  {
    vendorId: 3,
    vendorName: "Premium Shoes Inc.",
    pendingAmount: 28000.00,
    paidAmount: 75000.00,
    totalBalance: 103000.00,
    lastUpdated: "2025-01-09T09:15:00Z",
  },
];

export const vendorPerformance: VendorPerformance[] = [
  {
    vendorId: 1,
    vendorName: "Sneaker Supply Co.",
    onTimePercentage: 94.5,
    totalDeliveries: 45,
    onTimeDeliveries: 42,
    averageDeliveryDays: 5.2,
  },
  {
    vendorId: 2,
    vendorName: "Global Footwear Ltd.",
    onTimePercentage: 87.2,
    totalDeliveries: 38,
    onTimeDeliveries: 33,
    averageDeliveryDays: 6.8,
  },
  {
    vendorId: 3,
    vendorName: "Premium Shoes Inc.",
    onTimePercentage: 91.3,
    totalDeliveries: 32,
    onTimeDeliveries: 29,
    averageDeliveryDays: 5.5,
  },
];

export const poAging: POAging = {
  age0to30: { count: 12, value: 125000.00 },
  age31to60: { count: 8, value: 85000.00 },
  age61to90: { count: 5, value: 45000.00 },
  age90Plus: { count: 3, value: 28000.00 },
};

export const totalInventoryValue: TotalInventoryValue = {
  totalValue: 2230000.00,
  cnValue: 1250000.00,
  usValue: 980000.00,
  previousMonthValue: 2100000.00,
  changePercentage: 6.2,
};

// Trend Data for Charts
export const orderTrendData: TrendData[] = [
  { date: "2025-01-06", orders: 118, value: 23500, shipments: 115 },
  { date: "2025-01-07", orders: 125, value: 24800, shipments: 122 },
  { date: "2025-01-08", orders: 132, value: 26200, shipments: 128 },
  { date: "2025-01-09", orders: 128, value: 25120, shipments: 125 },
  { date: "2025-01-10", orders: 135, value: 26800, shipments: 132 },
  { date: "2025-01-11", orders: 140, value: 27800, shipments: 138 },
  { date: "2025-01-12", orders: 142, value: 28450, shipments: 142 },
];

export const monthlyOrderTrendData = [
  { month: "Jul", orders: 820, value: 185000 },
  { month: "Aug", orders: 950, value: 210000 },
  { month: "Sep", orders: 1100, value: 245000 },
  { month: "Oct", orders: 1050, value: 235000 },
  { month: "Nov", orders: 1200, value: 268000 },
  { month: "Dec", orders: 1284, value: 285000 },
  { month: "Jan", orders: 1420, value: 315000 },
];

export const recentOrders = [
  { id: "#ORD-1284", customer: "John Smith", value: "$489", status: "fulfilled", route: "CN", date: "2025-01-12" },
  { id: "#ORD-1283", customer: "Emma Wilson", value: "$712", status: "processing", route: "US", date: "2025-01-12" },
  { id: "#ORD-1282", customer: "Michael Brown", value: "$298", status: "partiallyShipped", route: "Mixed", date: "2025-01-12" },
  { id: "#ORD-1281", customer: "Sarah Davis", value: "$1,024", status: "pending", route: "CN", date: "2025-01-12" },
];

