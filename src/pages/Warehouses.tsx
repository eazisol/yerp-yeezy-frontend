import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import WarehouseFormDialog from "@/components/warehouses/WarehouseFormDialog";
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
} from "@/components/ui/pagination";
import { Search, Plus, Edit, Trash2, Eye } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { warehouseService, Warehouse, CreateWarehouseRequest, UpdateWarehouseRequest } from "@/services/warehouses";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { extractErrorMessage } from "@/utils/errorUtils";

// Warehouses list with create/edit/delete actions.
export default function Warehouses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(true);
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [deleteWarehouseId, setDeleteWarehouseId] = useState<number | null>(null);
  const [publicCredentials, setPublicCredentials] = useState<{
    clientId: string;
    clientSecret: string;
  } | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const navigate = useNavigate();
  const { canRead, canModify, canDelete } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Close warehouse dialog and clear selection.
  const handleCloseWarehouseForm = () => {
    setShowWarehouseForm(false);
    setSelectedWarehouse(null);
    setPublicCredentials(null);
  };

  // Fetch warehouses with pagination
  const { data: warehousesData, isLoading: loadingWarehouses } = useQuery({
    queryKey: ["warehouses", page, pageSize, searchTerm, isActiveFilter],
    queryFn: () => warehouseService.getWarehouses(page, pageSize, searchTerm || undefined, isActiveFilter),
  });

  // Create warehouse mutation
  const createWarehouseMutation = useMutation({
    mutationFn: (data: CreateWarehouseRequest) => warehouseService.createWarehouse(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast({
        title: "Success",
        description: "Warehouse created successfully",
      });
      if (response.publicClientId && response.publicClientSecret) {
        setPublicCredentials({
          clientId: response.publicClientId,
          clientSecret: response.publicClientSecret,
        });
      } else {
        handleCloseWarehouseForm();
      }
    },
    onError: (error: any) => {
      const errorMessage = extractErrorMessage(error, "Failed to create warehouse");
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update warehouse mutation
  const updateWarehouseMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateWarehouseRequest }) =>
      warehouseService.updateWarehouse(id, data),
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
        handleCloseWarehouseForm();
      }
    },
    onError: (error: any) => {
      const errorMessage = extractErrorMessage(error, "Failed to update warehouse");
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Delete warehouse mutation
  const deleteWarehouseMutation = useMutation({
    mutationFn: (id: number) => warehouseService.deleteWarehouse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast({
        title: "Success",
        description: "Warehouse deleted successfully",
      });
      setShowDeleteDialog(false);
      setDeleteWarehouseId(null);
    },
    onError: (error: any) => {
      const errorMessage = extractErrorMessage(error, "Failed to delete warehouse");
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Open dialog for create mode.
  const handleAddWarehouse = () => {
    setSelectedWarehouse(null);
    setPublicCredentials(null);
    setShowWarehouseForm(true);
  };

  // Open dialog for edit mode.
  const handleEditWarehouse = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setPublicCredentials(null);
    setShowWarehouseForm(true);
  };

  const handleDeleteWarehouse = (warehouseId: number) => {
    setDeleteWarehouseId(warehouseId);
    setShowDeleteDialog(true);
  };

  const handleCopyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: "Copied",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleConfirmDelete = () => {
    if (deleteWarehouseId) {
      deleteWarehouseMutation.mutate(deleteWarehouseId);
    }
  };

  // Submit warehouse form based on mode.
  const handleSubmit = (data: CreateWarehouseRequest | UpdateWarehouseRequest) => {
    if (selectedWarehouse) {
      updateWarehouseMutation.mutate({ id: selectedWarehouse.warehouseId, data });
    } else {
      createWarehouseMutation.mutate(data as CreateWarehouseRequest);
    }
  };

  // Regenerate public credentials for the selected warehouse.
  const handleRegenerateCredentials = async () => {
    if (!selectedWarehouse) return;
    setIsRegenerating(true);
    try {
      const response = await warehouseService.regenerateCredentials(selectedWarehouse.warehouseId);
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
    } catch (error) {
      const errorMessage = extractErrorMessage(error, "Failed to regenerate credentials");
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const warehouses = warehousesData?.data || [];
  const totalPages = warehousesData?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Warehouses</h1>
        </div>
        {canModify("WAREHOUSES") && (
          <Button onClick={handleAddWarehouse}>
            <Plus className="h-4 w-4 mr-2" />
            Add Warehouse
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by warehouse name, code, city, state, phone, or email..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={isActiveFilter === undefined ? "default" : "outline"}
                onClick={() => setIsActiveFilter(undefined)}
              >
                All
              </Button>
              <Button
                variant={isActiveFilter === true ? "default" : "outline"}
                onClick={() => setIsActiveFilter(true)}
              >
                Active
              </Button>
              <Button
                variant={isActiveFilter === false ? "default" : "outline"}
                onClick={() => setIsActiveFilter(false)}
              >
                Inactive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warehouses Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Warehouse List ({warehousesData?.totalCount || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingWarehouses ? (
            <div className="text-center py-8">Loading warehouses...</div>
          ) : warehouses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No warehouses found</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Warehouse Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>City, State</TableHead>
                    <TableHead>Contacts</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.map((warehouse) => (
                    <TableRow key={warehouse.warehouseId}>
                      <TableCell className="font-medium">{warehouse.warehouseCode}</TableCell>
                      <TableCell className="font-medium">{warehouse.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {warehouse.address && <div>{warehouse.address}</div>}
                          {warehouse.zipCode && <div>{warehouse.zipCode}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {warehouse.city && warehouse.state && `${warehouse.city}, ${warehouse.state}`}
                          {warehouse.country && <div className="text-muted-foreground">{warehouse.country}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {warehouse.contactPerson1 && warehouse.contactPhone1 && (
                            <div>
                              <span className="font-medium">{warehouse.contactPerson1}:</span> {warehouse.contactPhone1}
                            </div>
                          )}
                          {warehouse.contactPerson2 && warehouse.contactPhone2 && (
                            <div>
                              <span className="font-medium">{warehouse.contactPerson2}:</span> {warehouse.contactPhone2}
                            </div>
                          )}
                          {warehouse.email && (
                            <div className="text-muted-foreground">{warehouse.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={warehouse.isActive ? "default" : "secondary"}>
                          {warehouse.status || (warehouse.isActive ? "Active" : "Inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canRead("WAREHOUSES") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/warehouses/${warehouse.warehouseId}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {canModify("WAREHOUSES") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditWarehouse(warehouse)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete("WAREHOUSES") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteWarehouse(warehouse.warehouseId)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
                          className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setPage(pageNum)}
                            isActive={page === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Warehouse Form Dialog */}
      <WarehouseFormDialog
        open={showWarehouseForm}
        mode={selectedWarehouse ? "edit" : "create"}
        initialWarehouse={selectedWarehouse}
        publicCredentials={publicCredentials}
        isSubmitting={createWarehouseMutation.isPending || updateWarehouseMutation.isPending}
        isRegenerating={isRegenerating}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseWarehouseForm();
          } else {
            setShowWarehouseForm(true);
          }
        }}
        onSubmit={handleSubmit}
        onCancel={handleCloseWarehouseForm}
        onCopyValue={handleCopyValue}
        onRegenerateCredentials={selectedWarehouse ? handleRegenerateCredentials : undefined}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft delete the warehouse. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

