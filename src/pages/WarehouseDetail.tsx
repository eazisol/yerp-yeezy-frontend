import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Edit, Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import WarehouseFormDialog from "@/components/warehouses/WarehouseFormDialog";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { extractErrorMessage } from "@/utils/errorUtils";
import { UpdateWarehouseRequest, warehouseService } from "@/services/warehouses";
import { ReportFilter, reportsService } from "@/services/reports";

type PublicCredentials = {
  clientId: string;
  clientSecret: string;
} | null;

// Format dates for display.
const formatDate = (dateString?: string | null) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Format numbers with thousands separators.
const formatNumber = (value: number) => {
  return new Intl.NumberFormat("en-US").format(value);
};

// Warehouse detail view with edit dialog.
export default function WarehouseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { canModify } = usePermissions();
  const [showEditForm, setShowEditForm] = useState(false);
  const [publicCredentials, setPublicCredentials] = useState<PublicCredentials>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [stockSearch, setStockSearch] = useState("");

  const {
    data: warehouse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["warehouse", id],
    queryFn: async () => {
      if (!id) throw new Error("Warehouse ID is required");
      const warehouseId = Number(id);
      if (Number.isNaN(warehouseId)) throw new Error("Invalid warehouse ID");
      return warehouseService.getWarehouseById(warehouseId);
    },
    enabled: !!id,
  });

  const updateWarehouseMutation = useMutation({
    mutationFn: ({ warehouseId, data }: { warehouseId: number; data: UpdateWarehouseRequest }) =>
      warehouseService.updateWarehouse(warehouseId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast({
        title: "Success",
        description: "Warehouse updated successfully",
      });
      if (response.publicClientId && response.publicClientSecret) {
        setPublicCredentials({
          clientId: response.publicClientId,
          clientSecret: response.publicClientSecret,
        });
      } else {
        setShowEditForm(false);
        setPublicCredentials(null);
      }
      refetch();
    },
    onError: (errorValue: any) => {
      const errorMessage = extractErrorMessage(errorValue, "Failed to update warehouse");
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const {
    data: inventoryReport,
    isLoading: loadingInventoryReport,
  } = useQuery({
    queryKey: ["warehouse-inventory-report", warehouse?.warehouseId],
    queryFn: () => {
      if (!warehouse) {
        throw new Error("Warehouse is required");
      }

      const filter: ReportFilter = {
        dateRangeType: "Days",
        warehouseId: warehouse.warehouseId,
        pageNumber: 1,
        pageSize: 1000,
      };

      return reportsService.getInventoryReport(filter);
    },
    enabled: !!warehouse,
  });

  // Copy credentials to clipboard.
  const handleCopyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: "Copied",
        description: `${label} copied to clipboard`,
      });
    } catch (copyError) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Regenerate public credentials for this warehouse.
  const handleRegenerateCredentials = async () => {
    if (!warehouse) return;
    setIsRegenerating(true);
    try {
      const response = await warehouseService.regenerateCredentials(warehouse.warehouseId);
      if (response.publicClientId && response.publicClientSecret) {
        setPublicCredentials({
          clientId: response.publicClientId,
          clientSecret: response.publicClientSecret,
        });
        toast({
          title: "Success",
          description: "Credentials regenerated",
        });
      }
    } catch (regenerateError) {
      const errorMessage = extractErrorMessage(regenerateError, "Failed to regenerate credentials");
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  // Build stock summary from inventory report data.
  const stockSummary = useMemo(() => {
    const details = inventoryReport?.inventoryDetails || [];
    const usedSum = details.reduce((sum, item) => sum + (item.usedStock ?? item.reservedQuantity ?? 0), 0);
    const onHand = details.reduce((sum, item) => sum + (item.totalStock || 0), 0);
    const available = details.reduce((sum, item) => sum + (item.availableQuantity || 0), 0);

    return {
      totalSkus: inventoryReport?.totalSKUs ?? 0,
      onHand,
      reserved: usedSum,
      available,
    };
  }, [inventoryReport]);

  // Filter inventory details by SKU or variant name.
  const filteredInventoryDetails = useMemo(() => {
    const details = inventoryReport?.inventoryDetails || [];
    if (!stockSearch.trim()) return details;
    const term = stockSearch.toLowerCase();
    return details.filter((item) => {
      const sku = item.sku?.toLowerCase() || "";
      const variantName = item.variantName?.toLowerCase() || "";
      return sku.includes(term) || variantName.includes(term);
    });
  }, [inventoryReport, stockSearch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !warehouse) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/warehouses")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Warehouse not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusLabel = warehouse.status || (warehouse.isActive ? "Active" : "Inactive");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/warehouses")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{warehouse.name}</h1>
            <p className="text-sm text-muted-foreground">{warehouse.warehouseCode}</p>
          </div>
        </div>
        {canModify("WAREHOUSES") && (
          <Button size="sm" onClick={() => setShowEditForm(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Warehouse Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={warehouse.isActive ? "default" : "secondary"}>{statusLabel}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Country</span>
              <span className="font-medium">{warehouse.country || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">{formatDate(warehouse.createdDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span className="font-medium">{formatDate(warehouse.editDate)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Primary</span>
              <span className="font-medium">
                {warehouse.contactPerson1 || "N/A"}
                {warehouse.contactPhone1 ? ` (${warehouse.contactPhone1})` : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Secondary</span>
              <span className="font-medium">
                {warehouse.contactPerson2 || "N/A"}
                {warehouse.contactPhone2 ? ` (${warehouse.contactPhone2})` : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{warehouse.email || "N/A"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stock Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total SKUs</span>
              <span className="font-medium">
                {loadingInventoryReport ? "..." : formatNumber(stockSummary.totalSkus)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Qty</span>
              <span className="font-medium">
                {loadingInventoryReport ? "..." : formatNumber(stockSummary.available)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Used</span>
              <span className="font-medium">
                {loadingInventoryReport ? "..." : formatNumber(stockSummary.reserved)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Available</span>
              <span className="font-medium">
                {loadingInventoryReport ? "..." : formatNumber(stockSummary.available - stockSummary.reserved)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Address</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-1">
            {warehouse.address && <div>{warehouse.address}</div>}
            {(warehouse.city || warehouse.state || warehouse.zipCode) && (
              <div>{[warehouse.city, warehouse.state, warehouse.zipCode].filter(Boolean).join(", ")}</div>
            )}
            {warehouse.country && <div>{warehouse.country}</div>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">SKU Stock Details</CardTitle>
            <Badge variant="outline">
              {loadingInventoryReport ? "..." : `${filteredInventoryDetails.length} items`}
            </Badge>
          </div>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by SKU or variant..."
              className="pl-9"
              value={stockSearch}
              onChange={(event) => setStockSearch(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loadingInventoryReport ? (
            <div className="text-center py-6 text-sm text-muted-foreground">Loading stock details...</div>
          ) : filteredInventoryDetails.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">No SKU stock found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Used Qty</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="text-right">Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventoryDetails.map((item, index) => (
                  <TableRow key={`${item.sku || "sku"}-${item.variantName || "variant"}-${index}`}>
                    <TableCell className="font-mono text-sm">{item.sku || "N/A"}</TableCell>
                    <TableCell>{item.variantName || "N/A"}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.availableQuantity || 0)}</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(item.usedStock ?? item.reservedQuantity ?? 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber((item.availableQuantity || 0) - (item.usedStock ?? item.reservedQuantity ?? 0))}
                    </TableCell>
                    <TableCell className="text-right">{formatDate(item.lastUpdatedDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <WarehouseFormDialog
        open={showEditForm}
        mode="edit"
        initialWarehouse={warehouse}
        publicCredentials={publicCredentials}
        isSubmitting={updateWarehouseMutation.isPending}
        isRegenerating={isRegenerating}
        onOpenChange={(open) => {
          if (!open) {
            setShowEditForm(false);
            setPublicCredentials(null);
          } else {
            setShowEditForm(true);
          }
        }}
        onSubmit={(data) => updateWarehouseMutation.mutate({ warehouseId: warehouse.warehouseId, data })}
        onCancel={() => {
          setShowEditForm(false);
          setPublicCredentials(null);
        }}
        onCopyValue={handleCopyValue}
        onRegenerateCredentials={handleRegenerateCredentials}
      />
    </div>
  );
}
