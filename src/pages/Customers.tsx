import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Eye, Download, RefreshCw } from "lucide-react";
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
import { customerService, Customer, CustomerSyncResult } from "@/services/customers";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [swellCustomerCount, setSwellCustomerCount] = useState<number | null>(null);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string>("");
  const [maxCustomers, setMaxCustomers] = useState<number | undefined>(undefined);
  const navigate = useNavigate();
  const { canRead, canModify } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch customers with pagination
  const { data: customersData, isLoading: loadingCustomers } = useQuery({
    queryKey: ["customers", page, pageSize, searchTerm],
    queryFn: () => customerService.getCustomers(page, pageSize, searchTerm || undefined),
  });

  // Get Swell customer count mutation
  const countMutation = useMutation({
    mutationFn: () => customerService.getSwellCustomerCount(),
    onSuccess: (data) => {
      setSwellCustomerCount(data.count);
      if (data.count > 0) {
        setShowSyncConfirm(true);
      } else {
        toast({
          title: "No Customers",
          description: "No customers found in Swell",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch customer count from Swell",
        variant: "destructive",
      });
    },
  });

  // Sync customers mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      setSyncProgress("Fetching customers from Swell...");
      await new Promise(resolve => setTimeout(resolve, 100));
      setSyncProgress("Processing customers and syncing to database...");
      return customerService.syncCustomersFromSwell(maxCustomers);
    },
    onSuccess: (result: CustomerSyncResult) => {
      setSyncProgress("");
      toast({
        title: "Sync Completed",
        description: result.message || `Created: ${result.created}, Updated: ${result.updated}, Failed: ${result.failed}`,
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setShowSyncConfirm(false);
      setSwellCustomerCount(null);
      setMaxCustomers(undefined); // Reset limit after sync
    },
    onError: (error: any) => {
      setSyncProgress("");
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync customers from Swell",
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
    syncMutation.mutate();
  };

  const customers = customersData?.data || [];
  const totalCount = customersData?.totalCount || 0;
  const totalPages = customersData?.totalPages || 1;
  const hasNextPage = customersData?.hasNextPage || false;
  const hasPreviousPage = customersData?.hasPreviousPage || false;

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
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

  // Get customer name for display
  const getCustomerName = (customer: Customer) => {
    if (customer.name) return customer.name;
    if (customer.firstName || customer.lastName) {
      return `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
    }
    return "N/A";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1">
            Auto-imported customers from Swell
          </p>
        </div>
        <div className="flex gap-2">
          {canModify("CUSTOMERS") && (
            <>
              <Button
                variant="outline"
                onClick={handleCheckSwellCount}
                disabled={countMutation.isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                {countMutation.isPending
                  ? "Checking..."
                  : swellCustomerCount !== null
                  ? `${swellCustomerCount} Customers in Swell`
                  : "Check Swell Customers"}
              </Button>
            </>
          )}
          {/*{canRead("CUSTOMERS") && (
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}*/}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingCustomers ? "..." : totalCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingCustomers ? "..." : customers.reduce((sum, c) => sum + c.orderCount, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingCustomers ? "..." : formatCurrency(customers.reduce((sum, c) => sum + c.orderValue, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Email Opt-In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingCustomers ? "..." : customers.filter(c => c.emailOptIn).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1); // Reset to first page on search
                }}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List ({totalCount} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCustomers ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Loading customers...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead className="text-right">Order Value</TableHead>
                    <TableHead>First Order</TableHead>
                    <TableHead>Last Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No customers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((customer) => (
                      <TableRow
                        key={customer.customerId}
                        className="cursor-pointer hover:bg-secondary/50"
                      >
                        <TableCell className="font-medium">
                          {getCustomerName(customer)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {customer.email || "N/A"}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {customer.type || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{customer.orderCount}</span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(customer.orderValue, customer.currency || "USD")}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(customer.dateFirstOrder)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(customer.dateLastOrder)}
                        </TableCell>
                        <TableCell className="text-right">
                          {canRead("CUSTOMERS") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/customers/${customer.customerId}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
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
                    Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} customers
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
              {syncMutation.isPending ? "Syncing Customers..." : "Sync Customers from Swell"}
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
                      {swellCustomerCount !== null && (
                        <p className="text-sm text-muted-foreground">
                          Syncing <strong>{swellCustomerCount}</strong> customers from Swell. Please wait...
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
                            ⏳ This may take a few minutes depending on the number of customers.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Please do not close this dialog or refresh the page.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  swellCustomerCount !== null && (
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <p>
                          Found <strong>{swellCustomerCount}</strong> customers in Swell.
                        </p>
                        <p>
                          This will sync customers from Swell. New customers will be created and existing customers will be updated.
                        </p>
                      </div>
                      
                      {/* Max Customers Limit Input */}
                      <div className="space-y-2">
                        <label htmlFor="maxCustomers" className="text-sm font-medium text-foreground">
                          Limit Sync (Optional)
                        </label>
                        <Input
                          id="maxCustomers"
                          type="number"
                          placeholder="Leave empty to sync all customers"
                          value={maxCustomers || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setMaxCustomers(value === "" ? undefined : parseInt(value, 10) || undefined);
                          }}
                          min="1"
                          disabled={syncMutation.isPending}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          {maxCustomers 
                            ? `Will sync only the first ${maxCustomers} customers.`
                            : "Will sync all customers from Swell."}
                        </p>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        This may take a few minutes depending on the number of customers.
                      </p>
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
    </div>
  );
}
