import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Calendar,
  Download,
  RefreshCw,
  Package,
  DollarSign,
  ShoppingCart,
  Warehouse,
  CreditCard,
  Users,
  Boxes,
  TrendingUp,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  reportsService,
  ReportFilter,
  OrdersReport,
  RevenueReport,
  PurchaseOrdersReport,
  InventoryReport,
  PaymentsReport,
  VendorsReport,
  VariantsReport,
} from "@/services/reports";
import { vendorService } from "@/services/vendors";
import { productService } from "@/services/products";

// Theme-based colors using CSS variables
const PRIMARY = "hsl(var(--primary))";
const SECONDARY = "hsl(var(--secondary))";
const ACCENT = "hsl(var(--accent))";
const MUTED = "hsl(var(--muted))";
const INFO = "hsl(var(--chart-5, var(--primary)))";
const COLORS = [PRIMARY, SECONDARY, ACCENT, MUTED, INFO];

// Format date as YYYY-MM-DD in local timezone (input[type="date"] expects this).
function toLocalYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Return start/end dates (YYYY-MM-DD) for preset date range types.
function getDateRangeForType(dateRangeType: string): { startDate: string; endDate: string } {
  const today = new Date();
  if (dateRangeType === "Today") {
    const d = toLocalYMD(today);
    return { startDate: d, endDate: d };
  }
  if (dateRangeType === "Weekly") {
    const start = new Date(today);
    start.setDate(start.getDate() - 7);
    return { startDate: toLocalYMD(start), endDate: toLocalYMD(today) };
  }
  if (dateRangeType === "Monthly") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { startDate: toLocalYMD(start), endDate: toLocalYMD(end) };
  }
  if (dateRangeType === "Yearly") {
    const start = new Date(today.getFullYear(), 0, 1);
    const end = new Date(today.getFullYear(), 11, 31);
    return { startDate: toLocalYMD(start), endDate: toLocalYMD(end) };
  }
  return { startDate: "", endDate: "" };
}

const defaultFilterBase: ReportFilter = {
  dateRangeType: "Today",
  warehouse: "All",
  pageNumber: 1,
  pageSize: 50,
};
const initialDates = getDateRangeForType("Today");

export default function Reports() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Draft filter (what user edits in UI); applied filter (what we send to API).
  const [filter, setFilter] = useState<ReportFilter>({
    ...defaultFilterBase,
    startDate: initialDates.startDate,
    endDate: initialDates.endDate,
  });
  // Initial load: Today is already applied so first fetch uses today's range.
  const [appliedFilter, setAppliedFilter] = useState<ReportFilter>(() => ({
    ...defaultFilterBase,
    startDate: initialDates.startDate,
    endDate: initialDates.endDate,
    appliedAt: 0,
  }));
  const [activeTab, setActiveTab] = useState("orders");

  // Fetch vendors for filter dropdown
  const { data: vendorsData } = useQuery({
    queryKey: ["vendors-list"],
    queryFn: () => vendorService.getVendors(1, 1000),
  });

  // Fetch products for SKU filter
  const { data: productsData } = useQuery({
    queryKey: ["products-list"],
    queryFn: () => productService.getProducts(1, 1000, ""),
  });

  // Fetch reports based on active tab (use applied filter, not draft).
  const { data: ordersReport, isLoading: loadingOrders } = useQuery({
    queryKey: ["orders-report", appliedFilter],
    queryFn: () => reportsService.getOrdersReport(appliedFilter),
    enabled: activeTab === "orders",
  });

  const { data: revenueReport, isLoading: loadingRevenue } = useQuery({
    queryKey: ["revenue-report", appliedFilter],
    queryFn: () => reportsService.getRevenueReport(appliedFilter),
    enabled: activeTab === "revenue",
  });

  const { data: poReport, isLoading: loadingPO } = useQuery({
    queryKey: ["po-report", appliedFilter],
    queryFn: () => reportsService.getPurchaseOrdersReport(appliedFilter),
    enabled: activeTab === "purchase-orders",
  });

  const { data: inventoryReport, isLoading: loadingInventory } = useQuery({
    queryKey: ["inventory-report", appliedFilter],
    queryFn: () => reportsService.getInventoryReport(appliedFilter),
    enabled: activeTab === "inventory",
  });

  const { data: paymentsReport, isLoading: loadingPayments } = useQuery({
    queryKey: ["payments-report", appliedFilter],
    queryFn: () => reportsService.getPaymentsReport(appliedFilter),
    enabled: activeTab === "payments",
  });

  const { data: vendorsReport, isLoading: loadingVendors } = useQuery({
    queryKey: ["vendors-report", appliedFilter],
    queryFn: () => reportsService.getVendorsReport(appliedFilter),
    enabled: activeTab === "vendors",
  });

  const { data: variantsReport, isLoading: loadingVariants } = useQuery({
    queryKey: ["variants-report", appliedFilter],
    queryFn: () => reportsService.getVariantsReport(appliedFilter),
    enabled: activeTab === "variants",
  });

  // Auto-fill start/end dates when date range type changes (preset) or on mount.
  useEffect(() => {
    const type = filter.dateRangeType;
    if (type === "Today" || type === "Weekly" || type === "Monthly" || type === "Yearly") {
      const { startDate, endDate } = getDateRangeForType(type);
      setFilter((prev) => ({ ...prev, startDate, endDate }));
    }
  }, [filter.dateRangeType]);

  const handleFilterChange = useCallback((updated: Partial<ReportFilter>) => {
    setFilter((prev) => {
      const next = { ...prev, ...updated };
      if ("startDate" in updated || "endDate" in updated) next.dateRangeType = "Custom";
      return next;
    });
  }, []);

  const handleApplyFilter = useCallback(() => {
    setAppliedFilter((prev) => ({
      ...filter,
      pageNumber: 1,
      appliedAt: Date.now(),
    }));
  }, [filter]);

  // Transform revenue data for pie chart
  const warehouseRevenueData =
    (revenueReport?.warehouseWiseRevenue || []).map((w) => ({
      name: w.warehouse,
      value: w.revenue,
    }));

  const handleExport = async (format: "pdf" | "excel" | "csv") => {
    try {
      const blob = await reportsService.exportReport(activeTab, format, appliedFilter);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeTab}-report-${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Export successful",
        description: `Report exported as ${format.toUpperCase()}`,
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message || "Failed to export report",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  // Format PO status with spaces (e.g., "PartiallyReceived" -> "Partially Received")
  const formatPOStatus = (status: string) => {
    if (!status) return status;
    // Insert space before capital letters (except the first one)
    return status.replace(/([a-z])([A-Z])/g, '$1 $2');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Reports</h1>
          <Button variant="outline" size="sm" onClick={() => navigate("/order-projections")}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Order Projections
          </Button>
        </div>
        {/* <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport("excel")}
            disabled={activeTab === "orders" && loadingOrders}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport("pdf")}
            disabled={activeTab === "orders" && loadingOrders}
          >
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport("csv")}
            disabled={activeTab === "orders" && loadingOrders}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div> */}
      </div>

      {/* Filters */}
      <Card>
        {/* <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader> */}
        <CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Select
                value={filter.dateRangeType}
                onValueChange={(value) =>
                  handleFilterChange({ dateRangeType: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Today">Today</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Yearly">Yearly</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Input
                type="date"
                value={filter.startDate || ""}
                onChange={(e) => handleFilterChange({ startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={filter.endDate || ""}
                onChange={(e) => handleFilterChange({ endDate: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Warehouse</label>
              <Select
                value={filter.warehouse || "All"}
                onValueChange={(value) =>
                  handleFilterChange({ warehouse: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="CN">China</SelectItem>
                  <SelectItem value="US">US</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(activeTab === "purchase-orders" || activeTab === "payments" || activeTab === "vendors") && (
              <div>
                <label className="text-sm font-medium mb-2 block">Vendor</label>
                <Select
                  value={filter.vendorId?.toString() || "all"}
                  onValueChange={(value) =>
                    handleFilterChange({
                      vendorId: value === "all" ? undefined : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vendors</SelectItem>
                    {vendorsData?.data.map((vendor) => (
                      <SelectItem key={vendor.vendorId} value={vendor.vendorId.toString()}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(activeTab === "orders" || activeTab === "revenue" || activeTab === "inventory" || activeTab === "variants") && (
              <div>
                <label className="text-sm font-medium mb-2 block">SKU</label>
                <Input
                  placeholder="Enter SKU"
                  value={filter.sku || ""}
                  onChange={(e) =>
                  handleFilterChange({ sku: e.target.value || undefined })
                  }
                />
              </div>
            )}
            <div>
              <Button onClick={handleApplyFilter}>Apply</Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="orders">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Orders
          </TabsTrigger>
          {/* <TabsTrigger value="revenue">
            <DollarSign className="mr-2 h-4 w-4" />
            Revenue
          </TabsTrigger> */}
          <TabsTrigger value="purchase-orders">
            <Package className="mr-2 h-4 w-4" />
            Purchase Orders
          </TabsTrigger>
          {/* <TabsTrigger value="inventory">
            <Warehouse className="mr-2 h-4 w-4" />
            Inventory
          </TabsTrigger> */}
          <TabsTrigger value="payments">
            <CreditCard className="mr-2 h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="vendors">
            <Users className="mr-2 h-4 w-4" />
            Vendors
          </TabsTrigger>
          <TabsTrigger value="variants">
            <Boxes className="mr-2 h-4 w-4" />
            Variants
          </TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          {loadingOrders ? (
            <div className="text-center py-8">Loading...</div>
          ) : ordersReport ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(ordersReport.totalOrders)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Fulfilled</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(ordersReport.fulfilledOrders)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(ordersReport.pendingOrders)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Partial</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(ordersReport.partialOrders)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">China</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(ordersReport.chinaOrders)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">US</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(ordersReport.usOrders)}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Date-wise Order Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={ordersReport.dateWiseTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="orderCount" stroke={PRIMARY} name="Orders" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Variant-wise Order Volume</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={ordersReport.variantWiseVolume.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="sku" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="quantity" fill={PRIMARY} name="Quantity" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Orders Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order Number</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer Details</TableHead>
                        <TableHead>SKU / Variant / Quantity</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Payment Status</TableHead>
                        <TableHead>Order Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ordersReport.orders.map((order) => (
                        <TableRow key={`${order.orderId}-${order.sku}`}>
                          <TableCell>{order.orderNumber || "-"}</TableCell>
                          <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                          
                          {/* Customer Details Column */}
                          <TableCell>
                            <div className="flex flex-col space-y-1">
                              {order.customerName && (
                                <div className="font-medium">{order.customerName}</div>
                              )}
                              {order.customerEmail && (
                                <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                              )}
                              {order.customerPhone && (
                                <div className="text-sm text-muted-foreground">{order.customerPhone}</div>
                              )}
                              {!order.customerName && !order.customerEmail && !order.customerPhone && (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </div>
                          </TableCell>
                          
                          {/* SKU/Variant/Quantity Column */}
                          <TableCell>
                            <div className="flex flex-col space-y-1">
                              <div className="font-medium">Items</div>
                              <div className="text-sm text-muted-foreground">
                                {order.sku ? (
                                  order.sku.split('\n').map((line, idx) => {
                                    // Parse line: "SKU (Variant) - Qty:X Fulfilled:Y Pending:Z"
                                    const match = line.match(/^(.+?)\s*\((.+?)\)\s*-/);
                                    if (match && order.productId) {
                                      const sku = match[1].trim();
                                      const variant = match[2].trim();
                                      const restOfLine = line.split('-').slice(1).join('-');
                                      return (
                                        <div key={idx} className="mb-1">
                                          <span>{sku} (</span>
                                          <button
                                            onClick={() => navigate(`/products/${order.productId}`)}
                                            className="text-primary hover:underline cursor-pointer font-medium"
                                            title={`View product: ${sku}`}
                                          >
                                            {variant}
                                          </button>
                                          <span>) - {restOfLine}</span>
                                        </div>
                                      );
                                    }
                                    return <div key={idx} className="mb-1">{line}</div>;
                                  })
                                ) : (
                                  "-"
                                )}
                              </div>
                              <div className="text-sm">
                                <span>Total Qty: {formatNumber(order.quantity)}</span>
                                {order.quantityFulfilled > 0 && (
                                  <span className="text-green-600 ml-2">✓ Fulfilled: {formatNumber(order.quantityFulfilled)}</span>
                                )}
                                {order.quantityNotFulfilled > 0 && (
                                  <span className="text-orange-600 ml-2">Pending: {formatNumber(order.quantityNotFulfilled)}</span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>{order.fulfillmentWarehouse || "-"}</TableCell>
                          <TableCell>{order.paymentStatus || "-"}</TableCell>
                          <TableCell>{order.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination */}
                  {ordersReport.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {formatNumber(((ordersReport.pageNumber - 1) * ordersReport.pageSize) + 1)} to{" "}
                        {formatNumber(Math.min(ordersReport.pageNumber * ordersReport.pageSize, ordersReport.totalCount))} of{" "}
                        {formatNumber(ordersReport.totalCount)} orders
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setAppliedFilter((prev) => ({
                              ...prev,
                              pageNumber: Math.max((prev.pageNumber || 1) - 1, 1),
                            }))
                          }
                          disabled={(appliedFilter.pageNumber || 1) <= 1 || loadingOrders}
                        >
                          Previous
                        </Button>
                        <div className="text-sm">
                          Page {formatNumber(ordersReport.pageNumber)} of {formatNumber(ordersReport.totalPages)}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setAppliedFilter((prev) => ({
                              ...prev,
                              pageNumber: Math.min((prev.pageNumber || 1) + 1, ordersReport.totalPages),
                            }))
                          }
                          disabled={(appliedFilter.pageNumber || 1) >= ordersReport.totalPages || loadingOrders}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          {loadingRevenue ? (
            <div className="text-center py-8">Loading...</div>
          ) : revenueReport ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">
                    {formatCurrency(revenueReport.totalRevenue)} {revenueReport.currency}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={revenueReport.revenueTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke={PRIMARY} name="Revenue" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Warehouse-wise Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={warehouseRevenueData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill={PRIMARY}
                          dataKey="value"
                        >
                          {warehouseRevenueData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Variant</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Currency</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenueReport.revenueDetails.slice(0, 50).map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                          <TableCell>{item.sku || "-"}</TableCell>
                          <TableCell>{item.variantName || "-"}</TableCell>
                          <TableCell>{item.warehouse || "-"}</TableCell>
                          <TableCell>{formatCurrency(item.revenueAmount)}</TableCell>
                          <TableCell>{item.currency}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* Purchase Orders Tab */}
        <TabsContent value="purchase-orders" className="space-y-4">
          {loadingPO ? (
            <div className="text-center py-8">Loading...</div>
          ) : poReport ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Open POs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(poReport.openPOs)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Closed POs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(poReport.closedPOs)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Partial POs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(poReport.partialPOs)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total PO Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(poReport.totalPOValue)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Received Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(poReport.totalReceivedValue)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(poReport.totalOutstandingValue)}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Vendor-wise PO Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={poReport.vendorWisePOValue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="vendorName" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                        <Bar dataKey="poValue" fill={PRIMARY} name="PO Value" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Purchase Orders Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PO Number</TableHead>
                        <TableHead>PO Date</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Ordered Qty</TableHead>
                        <TableHead>Received Qty</TableHead>
                        <TableHead>Remaining Qty</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expected Delivery</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {poReport.purchaseOrders.slice(0, 50).map((po, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <button
                              onClick={() => navigate(`/purchase-orders/${po.purchaseOrderId}`)}
                              className="text-primary hover:underline cursor-pointer font-medium"
                              title={`View PO ${po.poNumber}`}
                            >
                              {po.poNumber}
                            </button>
                          </TableCell>
                          <TableCell>
                            {po.poDate
                              ? new Date(po.poDate).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>{po.vendorName}</TableCell>
                          
                          {/* Items column, same pattern as Orders items */}
                          <TableCell>
                            <div className="flex flex-col space-y-1">
                              <div className="font-medium">Items</div>
                              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {po.items ? (
                                  po.items.split('\n').map((line, idx) => {
                                    // Parse line: "SKU (Variant) - Qty:X Received:Y Pending:Z"
                                    const match = line.match(/^(.+?)\s*\((.+?)\)\s*-/);
                                    if (match && po.productId) {
                                      const sku = match[1].trim();
                                      const variant = match[2].trim();
                                      const restOfLine = line.split('-').slice(1).join('-');
                                      return (
                                        <div key={idx} className="mb-1">
                                          <span>{sku} (</span>
                                          <button
                                            onClick={() => navigate(`/products/${po.productId}`)}
                                            className="text-primary hover:underline cursor-pointer font-medium"
                                            title={`View product: ${sku}`}
                                          >
                                            {variant}
                                          </button>
                                          <span>) - {restOfLine}</span>
                                        </div>
                                      );
                                    }
                                    return <div key={idx} className="mb-1">{line}</div>;
                                  })
                                ) : (
                                  "-"
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <span>Total Qty: {formatNumber(po.orderedQuantity)}</span>
                                {po.receivedQuantity > 0 && (
                                  <span className="text-green-600 ml-2">
                                    Received: {formatNumber(po.receivedQuantity)}
                                  </span>
                                )}
                                {po.remainingQuantity > 0 && (
                                  <span className="text-orange-600 ml-2">
                                    Pending: {formatNumber(po.remainingQuantity)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>{formatNumber(po.orderedQuantity)}</TableCell>
                          <TableCell>{formatNumber(po.receivedQuantity)}</TableCell>
                          <TableCell>{formatNumber(po.remainingQuantity)}</TableCell>
                          <TableCell>{formatPOStatus(po.status)}</TableCell>
                          <TableCell>
                            {po.expectedDeliveryDate
                              ? new Date(po.expectedDeliveryDate).toLocaleDateString()
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          {loadingInventory ? (
            <div className="text-center py-8">Loading...</div>
          ) : inventoryReport ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total SKUs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(inventoryReport.totalSKUs)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Units</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(inventoryReport.totalUnits)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(inventoryReport.totalValue)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(inventoryReport.lowStockItems)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Overstock</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(inventoryReport.overstockItems)}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Warehouse Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={inventoryReport.warehouseDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="warehouse" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="totalUnits" fill={PRIMARY} name="Total Units" />
                      <Bar dataKey="totalValue" fill={SECONDARY} name="Total Value" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inventory Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Variant</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Used Qty</TableHead>
                        <TableHead>Total Stock</TableHead>
                        <TableHead>Last Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryReport.inventoryDetails.slice(0, 50).map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.sku || "-"}</TableCell>
                          <TableCell>{item.variantName || "-"}</TableCell>
                          <TableCell>{item.warehouse}</TableCell>
                          <TableCell>{formatNumber(item.availableQuantity)}</TableCell>
                          <TableCell>{formatNumber(item.usedStock ?? item.reservedQuantity ?? 0)}</TableCell>
                          <TableCell>{formatNumber(item.totalStock)}</TableCell>
                          <TableCell>
                            {item.lastUpdatedDate
                              ? new Date(item.lastUpdatedDate).toLocaleDateString()
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          {loadingPayments ? (
            <div className="text-center py-8">Loading...</div>
          ) : paymentsReport ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(paymentsReport.totalPendingPayments)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(paymentsReport.totalPaidAmount)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(paymentsReport.totalOutstandingBalance)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Pending Count</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(paymentsReport.pendingPaymentCount)}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Vendor-wise Outstanding</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={paymentsReport.vendorWiseOutstanding}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="vendorName" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="outstandingBalance" fill={PRIMARY} name="Outstanding" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor</TableHead>
                        <TableHead>PO Reference</TableHead>
                        <TableHead>Bill Amount</TableHead>
                        <TableHead>Paid Amount</TableHead>
                        <TableHead>Due Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentsReport.paymentDetails.slice(0, 50).map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.vendorName}</TableCell>
                          <TableCell>{item.poRef}</TableCell>
                          <TableCell>{formatCurrency(item.billAmount)}</TableCell>
                          <TableCell>{formatCurrency(item.paidAmount)}</TableCell>
                          <TableCell>{formatCurrency(item.dueAmount)}</TableCell>
                          <TableCell>
                            {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* Vendors Tab */}
        <TabsContent value="vendors" className="space-y-4">
          {loadingVendors ? (
            <div className="text-center py-8">Loading...</div>
          ) : vendorsReport ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(vendorsReport.totalVendors)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(vendorsReport.activeVendors)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(vendorsReport.totalSpend)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(vendorsReport.totalOutstandingBalance)}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Vendor Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor Name</TableHead>
                        <TableHead>Total POs</TableHead>
                        <TableHead>On-time %</TableHead>
                        <TableHead>Delayed %</TableHead>
                        <TableHead>Total Spend</TableHead>
                        <TableHead>Outstanding</TableHead>
                        <TableHead>Avg Delivery (days)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendorsReport.vendorDetails.map((vendor, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{vendor.vendorName}</TableCell>
                          <TableCell>{formatNumber(vendor.totalPOs)}</TableCell>
                          <TableCell>{vendor.onTimePercentage.toFixed(1)}%</TableCell>
                          <TableCell>{vendor.delayedPercentage.toFixed(1)}%</TableCell>
                          <TableCell>{formatCurrency(vendor.totalSpend)}</TableCell>
                          <TableCell>{formatCurrency(vendor.outstandingBalance)}</TableCell>
                          <TableCell>
                            {vendor.averageDeliveryTime
                              ? `${vendor.averageDeliveryTime.toFixed(1)} days`
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* Variants Tab */}
        <TabsContent value="variants" className="space-y-4">
          {loadingVariants ? (
            <div className="text-center py-8">Loading...</div>
          ) : variantsReport ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Variant Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Variant</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Orders Count</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Stock Level</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variantsReport.variantDetails.map((variant, idx) => (
                        <TableRow key={`${variant.sku}-${variant.date}-${idx}`}>
                          <TableCell>{variant.sku}</TableCell>
                          <TableCell>{variant.variantName || "-"}</TableCell>
                          <TableCell>{variant.date}</TableCell>
                          <TableCell>{formatNumber(variant.ordersCount)}</TableCell>
                          <TableCell>{formatCurrency(variant.revenue)}</TableCell>
                          <TableCell>{formatNumber(variant.stockLevel)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Variants pagination controls (backend-driven) */}
              {variantsReport.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing{" "}
                    {formatNumber(((variantsReport.pageNumber - 1) * variantsReport.pageSize) + 1)}{" "}
                    to{" "}
                    {formatNumber(Math.min(
                      variantsReport.pageNumber * variantsReport.pageSize,
                      variantsReport.totalCount
                    ))}{" "}
                    of {formatNumber(variantsReport.totalCount)} variants
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAppliedFilter((prev) => ({
                          ...prev,
                          pageNumber: Math.max((prev.pageNumber || 1) - 1, 1),
                        }))
                      }
                      disabled={(appliedFilter.pageNumber || 1) <= 1 || loadingVariants}
                    >
                      Previous
                    </Button>
                    <div className="text-sm">
                      Page {formatNumber(variantsReport.pageNumber)} of {formatNumber(variantsReport.totalPages)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAppliedFilter((prev) => ({
                          ...prev,
                          pageNumber: (prev.pageNumber || 1) + 1,
                        }))
                      }
                      disabled={
                        !appliedFilter.pageNumber ||
                        appliedFilter.pageNumber >= variantsReport.totalPages ||
                        loadingVariants
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
