import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Plus, Eye, Edit, Trash2, RefreshCw, Download, Upload, FileSpreadsheet, Calendar } from "lucide-react";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { productService, Product, ProductSyncResult, ProductImportResult } from "@/services/products";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null); // null = all, "true" = active, "false" = inactive
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);
  const [swellProductCount, setSwellProductCount] = useState<number | null>(null);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string>("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importResult, setImportResult] = useState<ProductImportResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { canRead, canModify, canDelete } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch products with pagination
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["products", page, pageSize, searchTerm, activeFilter, startDate, endDate],
    queryFn: () => productService.getProducts(
      page, 
      pageSize, 
      searchTerm || undefined, 
      activeFilter || undefined,
      undefined, // origin
      startDate || undefined,
      endDate || undefined
    ),
  });

  const products = productsData?.data || [];
  const totalCount = productsData?.totalCount || 0;
  const totalPages = productsData?.totalPages || 1;
  const hasNextPage = productsData?.hasNextPage || false;
  const hasPreviousPage = productsData?.hasPreviousPage || false;

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

  // Calculate total stock - use totalStock if available, otherwise calculate from cnStock + usStock
  const getTotalStock = (product: Product) => {
    // Use totalStock if available (from Inventory table)
    if (product.totalStock !== undefined && product.totalStock !== null) {
      return product.totalStock;
    }
    // Fallback: calculate from cnStock + usStock (from WarehouseInventories)
    const cnStock = product.cnStock || 0;
    const usStock = product.usStock || 0;
    return cnStock + usStock;
  };

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => productService.deleteProduct(id),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeleteProductId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  // Get Swell product count mutation
  const countMutation = useMutation({
    mutationFn: () => productService.getSwellProductCount(),
    onSuccess: (data) => {
      setSwellProductCount(data.count);
      if (data.count > 0) {
        setShowSyncConfirm(true);
      } else {
        toast({
          title: "No Products",
          description: "No products found in Swell",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch product count from Swell",
        variant: "destructive",
      });
    },
  });

  // Sync products mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      setSyncProgress("Fetching products from Swell...");
      // Add a small delay to show the progress message
      await new Promise(resolve => setTimeout(resolve, 100));
      setSyncProgress("Processing products and syncing to database...");
      return productService.syncProductsFromSwell();
    },
    onSuccess: (result: ProductSyncResult) => {
      setSyncProgress("");
      toast({
        title: "Sync Completed",
        description: result.message || `Created: ${result.created}, Updated: ${result.updated}, Failed: ${result.failed}`,
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowSyncConfirm(false);
      setSwellProductCount(null);
    },
    onError: (error: any) => {
      setSyncProgress("");
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync products from Swell",
        variant: "destructive",
        duration: 5000,
      });
      setShowSyncConfirm(false);
    },
  });

  const handleAddProduct = () => {
    navigate("/products/new");
  };

  const handleEditProduct = (product: Product) => {
    navigate(`/products/${product.productId}/edit`);
  };

  const handleDeleteProduct = (productId: number) => {
    setDeleteProductId(productId);
  };

  const handleCheckSwellCount = () => {
    countMutation.mutate();
  };

  const handleConfirmSync = () => {
    // Ensure dialog stays open and show progress immediately
    setSyncProgress("Initializing sync...");
    syncMutation.mutate();
  };

  // Excel import mutation
  const importMutation = useMutation({
    mutationFn: (file: File) => productService.importProductsFromExcel(file),
    onSuccess: (result: ProductImportResult) => {
      setImportResult(result);
      toast({
        title: "Import Completed",
        description: result.message || `Created: ${result.productsCreated}, Updated: ${result.productsUpdated}`,
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import products from Excel",
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
      const blob = await productService.exportProductsToCsv(
        searchTerm || undefined,
        activeFilter || undefined,
        undefined, // origin
        startDate || undefined,
        endDate || undefined
      );

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: "Products exported to CSV successfully",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export products",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your product catalog from Swell</p>
        </div>
        <div className="flex gap-2">
          {canModify("PRODUCTS") && (
            <>
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
                  : swellProductCount !== null
                  ? `${swellProductCount} Products in Swell`
                  : "Check Swell Products"}
              </Button>
              <Button
                variant="outline"
                onClick={handleExportToCsv}
                disabled={isExporting || loadingProducts}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export CSV"}
              </Button>
              {/*<Button onClick={handleAddProduct}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>*/}
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by SKU or product name..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1); // Reset to first page on search
                  }}
                />
              </div>
              <Select
                value={activeFilter || "all"}
                onValueChange={(value) => {
                  setActiveFilter(value === "all" ? null : value);
                  setPage(1); // Reset to first page on filter change
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
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

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product List ({totalCount} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingProducts ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Loading products...</p>
            </div>
          ) : (
            <>
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[20%]">Product</TableHead>
                    <TableHead className="w-[15%]">Stock</TableHead>
                    <TableHead className="w-[15%]">Price</TableHead>
                    <TableHead className="w-[15%]">Status</TableHead>
                    <TableHead className="w-[15%]">Updated</TableHead>
                    <TableHead className="text-right w-[20%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => {
                    const totalStock = getTotalStock(product);
                    return (
                      <TableRow
                        key={product.productId}
                        className="cursor-pointer hover:bg-secondary/50"
                      >
                        <TableCell className="w-[20%]">
                          <div>
                            <div className="font-medium text-foreground">
                              {product.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {product.sku}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="w-[15%]">
                          <span
                            className={`font-medium ${
                              totalStock > 0
                                ? totalStock < 50
                                  ? "text-yellow-600"
                                  : "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {totalStock}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium w-[15%]">
                          {formatCurrency(
                            product.price,
                            product.currency || "USD"
                          )}
                        </TableCell>
                        <TableCell className="w-[15%]">
                          <div
                            className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              product.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            <div
                              className={`h-2 w-2 rounded-full ${
                                product.isActive
                                  ? "bg-green-600"
                                  : "bg-gray-500"
                              }`}
                            />
                            <span>{product.isActive ? "Active" : "Inactive"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground w-[15%]">
                          {formatDate(
                            product.editDate || product.createdDate
                          )}
                        </TableCell>
                        <TableCell className="text-right w-[20%]">
                          <div className="flex items-center justify-end gap-2">
                            {canRead("PRODUCTS") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  navigate(`/products/${product.productId}`)
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {/* {canModify("PRODUCTS") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditProduct(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )} */}
                            {canDelete("PRODUCTS") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteProduct(product.productId)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
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
                    Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} products
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteProductId !== null} onOpenChange={(open) => !open && setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will soft delete the product and mark it as inactive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProductId && deleteMutation.mutate(deleteProductId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              {syncMutation.isPending ? "Syncing Products..." : "Sync Products from Swell"}
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
                      {swellProductCount !== null && (
                        <p className="text-sm text-muted-foreground">
                          Syncing <strong>{swellProductCount}</strong> products from Swell. Please wait...
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
                            ⏳ This may take a few minutes depending on the number of products.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Please do not close this dialog or refresh the page.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  swellProductCount !== null && (
                    <div className="space-y-2 mt-4">
                      <p>
                        Found <strong>{swellProductCount}</strong> products in Swell.
                      </p>
                      <p>
                        This will sync all products from Swell. New products will be created and existing products will be updated.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        This may take a few minutes depending on the number of products.
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

      {/* Excel Import Dialog */}
      <AlertDialog open={showImportDialog} onOpenChange={handleCloseImportDialog}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {importMutation.isPending && (
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              )}
              {importMutation.isPending
                ? "Importing Products..."
                : importResult
                ? "Import Completed"
                : "Import Products from Excel"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {importMutation.isPending
                ? "Please wait while we process your Excel file. This may take a few moments..."
                : importResult
                ? "Products have been imported successfully."
                : "Select an Excel file (.xlsx or .xls) to import products."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {importMutation.isPending && (
            <div className="py-4">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Processing Excel file...</span>
              </div>
            </div>
          )}

          {importResult && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Rows</div>
                  <div className="text-2xl font-bold">{importResult.totalRows}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Variants in File</div>
                  <div className="text-2xl font-bold text-purple-600">{importResult.totalVariantsInFile || importResult.totalRows}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Products Created</div>
                  <div className="text-2xl font-bold text-green-600">{importResult.productsCreated}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Products Updated</div>
                  <div className="text-2xl font-bold text-blue-600">{importResult.productsUpdated}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Variants Created</div>
                  <div className="text-2xl font-bold text-green-600">{importResult.variantsCreated}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Variants Updated</div>
                  <div className="text-2xl font-bold text-blue-600">{importResult.variantsUpdated}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Errors</div>
                  <div className="text-2xl font-bold text-red-600">{importResult.errors}</div>
                </div>
              </div>

              {importResult.errorMessages && importResult.errorMessages.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-semibold mb-2 text-red-600">Error Messages:</div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importResult.errorMessages.map((error, index) => (
                      <div key={index} className="text-sm text-muted-foreground p-2 bg-red-50 dark:bg-red-950 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importResult.message && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded text-sm text-green-800 dark:text-green-200">
                  {importResult.message}
                </div>
              )}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseImportDialog} disabled={importMutation.isPending}>
              {importMutation.isPending ? "Importing..." : "Close"}
            </AlertDialogCancel>
            {!importMutation.isPending && !importResult && (
              <AlertDialogAction onClick={handleImportClick} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Select File
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
