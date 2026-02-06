import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, Eye, Download, RefreshCw, Upload, Calendar, FileSpreadsheet, Repeat } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { orderService, Order, OrderStats, OrderSyncResult, OrderImportResult } from "@/services/orders";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [fulfillmentFilter, setFulfillmentFilter] = useState<string | null>(null); // null = all, "unfulfilled" = unfulfilled, "partial" = partial
  const [warehouseFilter, setWarehouseFilter] = useState<string | null>(null); // null = all, "na" = N/A, "cn" = China, "us" = US, "mixed" = CN+US
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [swellOrderCount, setSwellOrderCount] = useState<number | null>(null);
  const [syncFromDate, setSyncFromDate] = useState<string>(""); // Optional sync-from date for bulk sync
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string>("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importResult, setImportResult] = useState<OrderImportResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showBulkResyncConfirm, setShowBulkResyncConfirm] = useState(false);
  const [showResyncConfirm, setShowResyncConfirm] = useState(false);
  const [resyncOrderId, setResyncOrderId] = useState<number | null>(null);
  const [isWarehouseCheckDone, setIsWarehouseCheckDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasRunWarehouseCheckRef = useRef(false);
  const navigate = useNavigate();
  const { canRead, canModify } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resyncOrderMutation = useMutation({
    mutationFn: (orderId: number) => orderService.resyncOrder(orderId),
    onSuccess: (data) => {
      toast({
        title: "Resync triggered",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setShowResyncConfirm(false);
      setResyncOrderId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resync order",
        variant: "destructive",
      });
    },
  });

  const resyncChinaMutation = useMutation({
    mutationFn: () => orderService.resyncChinaOrders(),
    onSuccess: (data) => {
      toast({
        title: "Bulk resync triggered",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setShowBulkResyncConfirm(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to bulk resync orders",
        variant: "destructive",
      });
    },
  });

  // Assign missing warehouses before loading orders list
  const assignMissingWarehousesMutation = useMutation({
    mutationFn: () => orderService.assignMissingWarehouses(),
    onSuccess: () => {
      setIsWarehouseCheckDone(true);
    },
    onError: () => {
      setIsWarehouseCheckDone(true);
    },
  });

  // Run the warehouse assignment once on page load
  useEffect(() => {
    if (hasRunWarehouseCheckRef.current || isWarehouseCheckDone) {
      return;
    }
    hasRunWarehouseCheckRef.current = true;
    assignMissingWarehousesMutation.mutate();
  }, [assignMissingWarehousesMutation, isWarehouseCheckDone]);

  const canResyncChinaOrder = (order: Order) => {
    const hasChinaWarehouse = (order.warehouseIds ?? []).includes(2);
    return hasChinaWarehouse && order.orderSyncTo === 0;
  };

  // Fetch orders with pagination (do not block on warehouse assignment)
  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ["orders", page, pageSize, searchTerm, fulfillmentFilter, warehouseFilter, startDate, endDate],
    queryFn: () =>
      orderService.getOrders(
        page,
        pageSize,
        searchTerm || undefined,
        fulfillmentFilter || undefined,
        "paid",
        startDate || undefined,
        endDate || undefined,
        warehouseFilter || undefined
      ),
  });

  // Fetch stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["orderStats"],
    queryFn: () => orderService.getOrderStats(),
  });

  // Only depend on orders query loading state so list renders while warehouse assignment runs in background
  const isOrdersLoading = loadingOrders;

  // Get Swell order count mutation
  const countMutation = useMutation({
    mutationFn: () => orderService.getSwellOrderCount(),
    onSuccess: (data) => {
      setSwellOrderCount(data.count);
      if (data.count > 0) {
        setShowSyncConfirm(true);
      } else {
        toast({
          title: "No Orders",
          description: "No orders found in Swell",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch order count from Swell",
        variant: "destructive",
      });
    },
  });

  // Sync orders mutation
  const syncMutation = useMutation({
    mutationFn: async (fromDate?: string) => {
      setSyncProgress("Fetching orders from Swell...");
      await new Promise(resolve => setTimeout(resolve, 100));
      setSyncProgress("Processing orders and syncing to database...");
      return orderService.syncOrdersFromSwell(fromDate);
    },
    onSuccess: (result: OrderSyncResult) => {
      setSyncProgress("");
      toast({
        title: "Sync Completed",
        description: result.message || `Created: ${result.created}, Updated: ${result.updated}, Failed: ${result.failed}`,
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orderStats"] });
      setShowSyncConfirm(false);
      setSwellOrderCount(null);
    },
    onError: (error: any) => {
      setSyncProgress("");
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync orders from Swell",
        variant: "destructive",
        duration: 5000,
      });
      setShowSyncConfirm(false);
    },
  });

  const handleCheckSwellCount = () => {
    countMutation.mutate();
  };

  const handleConfirmSync = () => {
    setSyncProgress("Initializing sync...");
    // Pass selected from-date if provided, otherwise let backend use current month start default
    const effectiveFromDate = syncFromDate || undefined;
    syncMutation.mutate(effectiveFromDate);
  };

  // Excel import mutation
  const importMutation = useMutation({
    mutationFn: (file: File) => orderService.importOrdersFromExcel(file),
    onSuccess: (result: OrderImportResult) => {
      setImportResult(result);
      toast({
        title: "Import Completed",
        description: result.message || `Created: ${result.ordersCreated}, Updated: ${result.ordersUpdated}`,
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orderStats"] });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import orders from Excel",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];
      if (!allowedTypes.includes(file.type) && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        toast({
          title: "Invalid File",
          description: "Please select an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (50MB max)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "File size must be less than 50MB",
          variant: "destructive",
        });
        return;
      }

      setShowImportDialog(true);
      setImportResult(null);
      importMutation.mutate(file);
    }
  };

  const handleCloseImportDialog = () => {
    setShowImportDialog(false);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Export to CSV handler
  const handleExportToCsv = async () => {
    try {
      setIsExporting(true);
      const blob = await orderService.exportOrdersToCsv(
        searchTerm || undefined,
        fulfillmentFilter || undefined,
        "paid",
        startDate || undefined,
        endDate || undefined
      );

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: "Orders exported to CSV successfully",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export orders",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const orders = ordersData?.data || [];
  const totalCount = ordersData?.totalCount || 0;
  const totalPages = ordersData?.totalPages || 1;
  const hasNextPage = ordersData?.hasNextPage || false;
  const hasPreviousPage = ordersData?.hasPreviousPage || false;
  const resyncEligibleCount = orders.filter(canResyncChinaOrder).length;

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Get payment status colors
  const getPaymentStatus = (payment: string | null) => {
    if (!payment) {
      return {
        bgColor: "bg-gray-100",
        textColor: "text-gray-600",
        dotColor: "bg-gray-500",
        label: "Unknown",
      };
    }

    switch (payment.toLowerCase()) {
      case "paid":
        return {
          bgColor: "bg-green-100",
          textColor: "text-green-700",
          dotColor: "bg-green-600",
          label: "Paid",
        };
      case "pending":
        return {
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-700",
          dotColor: "bg-yellow-600",
          label: "Pending",
        };
      case "refunded":
        return {
          bgColor: "bg-red-100",
          textColor: "text-red-700",
          dotColor: "bg-red-600",
          label: "Refunded",
        };
      default:
        return {
          bgColor: "bg-gray-100",
          textColor: "text-gray-600",
          dotColor: "bg-gray-500",
          label: payment,
        };
    }
  };

  // Get fulfillment status from FulfillmentStatus field or fallback to Status
  const getFulfillmentStatus = (order: Order) => {
    const fulfillmentStatus = order.fulfillmentStatus || "unfulfilled";
    
    switch (fulfillmentStatus?.toLowerCase()) {
      case "fulfilled":
      case "shipped":
      case "delivered":
        return {
          bgColor: "bg-green-100",
          textColor: "text-green-700",
          dotColor: "bg-green-600",
          label: "Fulfilled",
        };
      case "unfulfilled":
      case "pending":
      case "processing":
        return {
          bgColor: "bg-orange-100",
          textColor: "text-orange-700",
          dotColor: "bg-orange-600",
          label: "Unfulfilled",
        };
      case "partial":
      case "partially fulfilled":
        return {
          bgColor: "bg-blue-100",
          textColor: "text-blue-700",
          dotColor: "bg-blue-600",
          label: "Partially Fulfilled",
        };
      case "cancelled":
      case "canceled":
        return {
          bgColor: "bg-red-100",
          textColor: "text-red-700",
          dotColor: "bg-red-600",
          label: "Cancelled",
        };
      default:
        return {
          bgColor: "bg-gray-100",
          textColor: "text-gray-600",
          dotColor: "bg-gray-500",
          label: fulfillmentStatus || "Unknown",
        };
    }
  };

  // Map warehouse IDs to labels
  const getWarehouseLabel = (warehouseId: number) => {
    if (warehouseId === 2) return "CN";
    if (warehouseId === 3) return "US";
    return warehouseId.toString();
  };

  // Build warehouse summary for list
  const getWarehouseSummary = (order: Order) => {
    const ids = order.warehouseIds ?? [];
    if (ids.length === 0) return "N/A";
    const uniqueIds = Array.from(new Set(ids));
    return uniqueIds.map(getWarehouseLabel).join(" / ");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orders</h1>
        </div>
        <div className="flex gap-2">
          {canModify("ORDERS") && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowBulkResyncConfirm(true)}
                disabled={resyncChinaMutation.isPending}
              >
                <Repeat className="h-4 w-4 mr-2" />
                {resyncChinaMutation.isPending ? "Resyncing..." : "Bulk Resync China"}
              </Button>
              <Button
                variant="outline"
                onClick={handleImportClick}
                disabled={importMutation.isPending}
              >
                <Upload className="h-4 w-4 mr-2" />
                {importMutation.isPending ? "Importing..." : "Import Excel"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={handleCheckSwellCount}
                disabled={countMutation.isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                {countMutation.isPending
                  ? "Checking..."
                  : swellOrderCount !== null
                  ? `${swellOrderCount} Orders in Swell`
                  : "Check Swell Orders"}
              </Button>
              <Button
                variant="outline"
                onClick={handleExportToCsv}
                disabled={isExporting || isOrdersLoading}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export CSV"}
              </Button>
            </>
          )}
          {/* {canRead("ORDERS") && (
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )} */}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats ? "..." : stats?.totalOrders || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unfulfilled Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loadingStats ? "..." : stats?.unfulfilledOrders || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Partially Fulfilled Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {loadingStats ? "..." : stats?.partiallyFulfilledOrders || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by order ID or customer..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1); // Reset to first page on search
                  }}
                />
              </div>
              <Select
                value={fulfillmentFilter || "all"}
                onValueChange={(value) => {
                  setFulfillmentFilter(value === "all" ? null : value);
                  setPage(1); // Reset to first page on filter change
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Fulfillment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unfulfilled">Unfulfilled</SelectItem>
                  <SelectItem value="partial">Partially Fulfilled</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={warehouseFilter || "all"}
                onValueChange={(value) => {
                  setWarehouseFilter(value === "all" ? null : value);
                  setPage(1); // Reset to first page on filter change
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="na">N/A</SelectItem>
                  <SelectItem value="cn">CN</SelectItem>
                  <SelectItem value="us">US</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Date Range Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="Start Date"
                  className="pl-9"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="End Date"
                  className="pl-9"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setPage(1);
                  }}
                >
                  Clear Dates
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Order List ({totalCount} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {isOrdersLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Loading orders...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Fulfillment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => {
                    const paymentStatus = getPaymentStatus(order.paymentStatus);
                    const fulfillmentStatus = getFulfillmentStatus(order);
                    const warehouseIds = order.warehouseIds ?? [];
                    const hasWarehouseIds = warehouseIds.length > 0;
                    const warehouseSummary = hasWarehouseIds ? getWarehouseSummary(order) : "N/A";
                    return (
                      <TableRow
                        key={order.orderId}
                        className="cursor-pointer hover:bg-secondary/50"
                      >
                        <TableCell className="font-medium">
                          {order.orderNumber || `#${order.orderId}`}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(order.createdDate)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-foreground">
                              {order.customerName || "N/A"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {order.customerEmail || ""}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div
                            className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentStatus.bgColor} ${paymentStatus.textColor}`}
                          >
                            <div
                              className={`h-2 w-2 rounded-full ${paymentStatus.dotColor}`}
                            />
                            <span>{paymentStatus.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div
                            className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${fulfillmentStatus.bgColor} ${fulfillmentStatus.textColor}`}
                          >
                            <div
                              className={`h-2 w-2 rounded-full ${fulfillmentStatus.dotColor}`}
                            />
                            <span>{fulfillmentStatus.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {hasWarehouseIds ? (
                            <Badge variant="outline">{warehouseSummary}</Badge>
                          ) : (
                            // Tooltip for missing warehouse assignment
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="outline"
                                  className="cursor-help"
                                >
                                  {warehouseSummary}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent
                                side="bottom"
                                align="center"
                                collisionPadding={8}
                              >
                                <p>Items are out of stock.</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(order.total, order.currency || "USD")}
                        </TableCell>
                        <TableCell className="text-right">
                          {canRead("ORDERS") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/orders/${order.orderId}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {canModify("ORDERS") && canResyncChinaOrder(order) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setResyncOrderId(order.orderId);
                                setShowResyncConfirm(true);
                              }}
                              title="Resend to China"
                            >
                              <Repeat className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className={!hasPreviousPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setPage(pageNum)}
                              isActive={page === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          className={!hasNextPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <div className="text-center text-sm text-muted-foreground mt-2">
                    Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} orders
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Sync Confirmation Dialog */}
      <AlertDialog 
        open={showSyncConfirm} 
        onOpenChange={(open) => {
          // Prevent closing dialog during sync
          if (!syncMutation.isPending && !open) {
            setShowSyncConfirm(false);
          }
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {syncMutation.isPending && (
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              )}
              {syncMutation.isPending ? "Syncing Orders..." : "Sync Orders from Swell"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {syncMutation.isPending ? (
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <p className="font-medium text-foreground">Processing sync...</p>
                      {syncProgress && (
                        <p className="text-sm text-muted-foreground">{syncProgress}</p>
                      )}
                      {swellOrderCount !== null && (
                        <p className="text-sm text-muted-foreground">
                          Syncing <strong>{swellOrderCount}</strong> orders from Swell. Please wait...
                        </p>
                      )}
                    </div>
                    <div className="bg-muted rounded-md p-3 border">
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm text-muted-foreground">
                            ⏳ This may take a few minutes depending on the number of orders.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Please do not close this dialog or refresh the page.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  swellOrderCount !== null && (
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <p>
                          Found <strong>{swellOrderCount}</strong> orders in Swell.
                        </p>
                        <p>
                          This will sync orders from Swell. New orders will be created and existing orders will be updated.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="flex flex-col gap-1 text-sm">
                          <span className="font-medium">Sync from date (optional)</span>
                          <Input
                            type="date"
                            value={syncFromDate}
                            onChange={(e) => setSyncFromDate(e.target.value)}
                          />
                          <span className="text-xs text-muted-foreground">
                            If empty, sync will start from the first day of the current month (backend default).
                          </span>
                        </label>
                      </div>
                    </div>
                  )
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={syncMutation.isPending}
              onClick={() => {
                if (!syncMutation.isPending) {
                  setShowSyncConfirm(false);
                }
              }}
            >
              {syncMutation.isPending ? "Syncing..." : "Cancel"}
            </AlertDialogCancel>
            {!syncMutation.isPending ? (
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleConfirmSync();
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Download className="h-4 w-4 mr-2" />
                Sync Now
              </AlertDialogAction>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Syncing...</span>
              </div>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Resync Confirmation Dialog */}
      <AlertDialog
        open={showBulkResyncConfirm}
        onOpenChange={(open) => {
          if (!resyncChinaMutation.isPending && !open) {
            setShowBulkResyncConfirm(false);
          }
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {resyncChinaMutation.isPending && (
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              )}
              {resyncChinaMutation.isPending ? "Resyncing..." : "Bulk Resync China Orders"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will resend all China-bound orders that have not been synced yet.
              <div className="text-sm text-muted-foreground mt-2">
                Eligible orders on this page: <strong>{resyncEligibleCount}</strong>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={resyncChinaMutation.isPending}
              onClick={() => {
                if (!resyncChinaMutation.isPending) {
                  setShowBulkResyncConfirm(false);
                }
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                resyncChinaMutation.mutate();
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Repeat className="h-4 w-4 mr-2" />
              Resend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single Resync Confirmation Dialog */}
      <AlertDialog
        open={showResyncConfirm}
        onOpenChange={(open) => {
          if (!resyncOrderMutation.isPending && !open) {
            setShowResyncConfirm(false);
            setResyncOrderId(null);
          }
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {resyncOrderMutation.isPending && (
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              )}
              {resyncOrderMutation.isPending ? "Resyncing..." : "Resend Order to China"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will resend the selected order to the external China API.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={resyncOrderMutation.isPending}
              onClick={() => {
                if (!resyncOrderMutation.isPending) {
                  setShowResyncConfirm(false);
                  setResyncOrderId(null);
                }
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (resyncOrderId) {
                  resyncOrderMutation.mutate(resyncOrderId);
                }
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Repeat className="h-4 w-4 mr-2" />
              Resend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <AlertDialog 
        open={showImportDialog} 
        onOpenChange={(open) => {
          // Prevent closing dialog during import
          if (!importMutation.isPending && !open) {
            handleCloseImportDialog();
          }
        }}
      >
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {importMutation.isPending && (
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              )}
              {importMutation.isPending ? "Importing Orders..." : importResult ? "Import Completed" : "Import Orders from Excel"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {importMutation.isPending ? (
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <p className="font-medium text-foreground">Processing import...</p>
                      <p className="text-sm text-muted-foreground">
                        Please wait while we import orders from your Excel file.
                      </p>
                    </div>
                    <div className="bg-muted rounded-md p-3 border">
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm text-muted-foreground">
                            ⏳ This may take a few minutes depending on the number of orders.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Please do not close this dialog or refresh the page.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : importResult ? (
                  <div className="space-y-4 mt-4">
                    {/* Success Summary */}
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="h-5 w-5 bg-green-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-green-900 dark:text-green-100">
                            Import completed successfully!
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            {importResult.message}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted rounded-md p-3 border">
                        <div className="text-sm text-muted-foreground">Total Rows</div>
                        <div className="text-2xl font-bold mt-1">{importResult.totalRows}</div>
                      </div>
                      <div className="bg-muted rounded-md p-3 border">
                        <div className="text-sm text-muted-foreground">Errors</div>
                        <div className="text-2xl font-bold mt-1 text-red-600">{importResult.errors}</div>
                      </div>
                      <div className="bg-muted rounded-md p-3 border">
                        <div className="text-sm text-muted-foreground">Orders Created</div>
                        <div className="text-2xl font-bold mt-1 text-green-600">{importResult.ordersCreated}</div>
                      </div>
                      <div className="bg-muted rounded-md p-3 border">
                        <div className="text-sm text-muted-foreground">Orders Updated</div>
                        <div className="text-2xl font-bold mt-1 text-blue-600">{importResult.ordersUpdated}</div>
                      </div>
                      <div className="bg-muted rounded-md p-3 border">
                        <div className="text-sm text-muted-foreground">Items Created</div>
                        <div className="text-2xl font-bold mt-1 text-green-600">{importResult.orderItemsCreated}</div>
                      </div>
                      <div className="bg-muted rounded-md p-3 border">
                        <div className="text-sm text-muted-foreground">Items Updated</div>
                        <div className="text-2xl font-bold mt-1 text-blue-600">{importResult.orderItemsUpdated}</div>
                      </div>
                    </div>

                    {/* Error Messages */}
                    {importResult.errorMessages && importResult.errorMessages.length > 0 && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="h-5 w-5 bg-red-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">!</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-red-900 dark:text-red-100 mb-2">
                              Errors ({importResult.errorMessages.length})
                            </p>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {importResult.errorMessages.map((error, index) => (
                                <p key={index} className="text-sm text-red-700 dark:text-red-300">
                                  • {error}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 mt-4">
                    <p>
                      Select an Excel file (.xlsx or .xls) containing orders data.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      The file should have columns: Order Number, Email, Payment Status, Fulfillment Status, Date Created, Item SKU, Item Quantity, Item Quantity Fulfilled, Item Quantity Canceled, Item Quantity Returned, Shipping Name, Shipping Address Line 1, Shipping Address Line 2, Shipping City, Shipping State, Shipping Zip, Shipping Country, Shipping Phone, Shipping Tax ID, Comments, Notes, and Canceled.
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={handleCloseImportDialog}
              disabled={importMutation.isPending}
            >
              {importMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                "Close"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
