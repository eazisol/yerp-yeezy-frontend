import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export default function Warehouses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [deleteWarehouseId, setDeleteWarehouseId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CreateWarehouseRequest>({
    warehouseCode: "",
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "China",
    contactPerson1: "",
    contactPhone1: "",
    contactPerson2: "",
    contactPhone2: "",
    email: "",
    status: "Active",
  });
  const [isEditMode, setIsEditMode] = useState(false);

  const { canRead, canModify, canDelete } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch warehouses with pagination
  const { data: warehousesData, isLoading: loadingWarehouses } = useQuery({
    queryKey: ["warehouses", page, pageSize, searchTerm, isActiveFilter],
    queryFn: () => warehouseService.getWarehouses(page, pageSize, searchTerm || undefined, isActiveFilter),
  });

  // Create warehouse mutation
  const createWarehouseMutation = useMutation({
    mutationFn: (data: CreateWarehouseRequest) => warehouseService.createWarehouse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast({
        title: "Success",
        description: "Warehouse created successfully",
      });
      setShowWarehouseForm(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to create warehouse",
        variant: "destructive",
      });
    },
  });

  // Update warehouse mutation
  const updateWarehouseMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateWarehouseRequest }) =>
      warehouseService.updateWarehouse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast({
        title: "Success",
        description: "Warehouse updated successfully",
      });
      setShowWarehouseForm(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update warehouse",
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
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to delete warehouse",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      warehouseCode: "",
      name: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "China",
      contactPerson1: "",
      contactPhone1: "",
      contactPerson2: "",
      contactPhone2: "",
      email: "",
      status: "Active",
    });
    setIsEditMode(false);
    setSelectedWarehouse(null);
  };

  const handleAddWarehouse = () => {
    resetForm();
    setIsEditMode(false);
    setShowWarehouseForm(true);
  };

  const handleEditWarehouse = (warehouse: Warehouse) => {
    // Sync status from IsActive if status is not set
    const status = warehouse.status || (warehouse.isActive ? "Active" : "Inactive");
    setFormData({
      warehouseCode: warehouse.warehouseCode,
      name: warehouse.name,
      address: warehouse.address || "",
      city: warehouse.city || "",
      state: warehouse.state || "",
      zipCode: warehouse.zipCode || "",
      country: warehouse.country || "China",
      contactPerson1: warehouse.contactPerson1 || "",
      contactPhone1: warehouse.contactPhone1 || "",
      contactPerson2: warehouse.contactPerson2 || "",
      contactPhone2: warehouse.contactPhone2 || "",
      email: warehouse.email || "",
      status: status,
    });
    setIsEditMode(true);
    setSelectedWarehouse(warehouse);
    setShowWarehouseForm(true);
  };

  const handleDeleteWarehouse = (warehouseId: number) => {
    setDeleteWarehouseId(warehouseId);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (deleteWarehouseId) {
      deleteWarehouseMutation.mutate(deleteWarehouseId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email format only if provided (email is optional)
    if (formData.email && formData.email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        return;
      }
    }

    if (isEditMode && selectedWarehouse) {
      // Status will automatically sync IsActive in backend
      const updateData: UpdateWarehouseRequest = {
        ...formData,
        // Include email only if provided (convert empty string to undefined)
        email: formData.email && formData.email.trim() !== "" ? formData.email : undefined,
      };
      updateWarehouseMutation.mutate({ id: selectedWarehouse.warehouseId, data: updateData });
    } else {
      // For create, convert empty string to undefined
      const createData = {
        ...formData,
        email: formData.email && formData.email.trim() !== "" ? formData.email : undefined,
      };
      createWarehouseMutation.mutate(createData);
    }
  };

  const warehouses = warehousesData?.data || [];
  const totalPages = warehousesData?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Warehouses</h1>
          <p className="text-muted-foreground mt-1">Manage warehouse locations and information</p>
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
                              onClick={() => handleEditWarehouse(warehouse)}
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
      <Dialog open={showWarehouseForm} onOpenChange={setShowWarehouseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Warehouse" : "Add New Warehouse"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Update warehouse information" : "Create a new warehouse in the system"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="warehouseCode">
                    Warehouse Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="warehouseCode"
                    value={formData.warehouseCode}
                    onChange={(e) => setFormData({ ...formData, warehouseCode: e.target.value })}
                    required
                    placeholder="e.g., DG-MIKEDO"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status || "Active"}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Warehouse Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson1">Primary Contact Person</Label>
                  <Input
                    id="contactPerson1"
                    value={formData.contactPerson1}
                    onChange={(e) => setFormData({ ...formData, contactPerson1: e.target.value })}
                    placeholder="e.g., Terry, Mr Lee"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone1">Primary Contact Phone</Label>
                  <Input
                    id="contactPhone1"
                    type="tel"
                    value={formData.contactPhone1}
                    onChange={(e) => setFormData({ ...formData, contactPhone1: e.target.value })}
                    placeholder="e.g., 15819851440"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson2">Secondary Contact Person</Label>
                  <Input
                    id="contactPerson2"
                    value={formData.contactPerson2}
                    onChange={(e) => setFormData({ ...formData, contactPerson2: e.target.value })}
                    placeholder="e.g., Cally"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone2">Secondary Contact Phone</Label>
                  <Input
                    id="contactPhone2"
                    type="tel"
                    value={formData.contactPhone2}
                    onChange={(e) => setFormData({ ...formData, contactPhone2: e.target.value })}
                    placeholder="e.g., 156 5796 3655"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g., warehouse@example.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowWarehouseForm(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createWarehouseMutation.isPending || updateWarehouseMutation.isPending}>
                {isEditMode ? "Update" : "Create"} Warehouse
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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

