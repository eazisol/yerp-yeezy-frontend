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
import { vendorService, Vendor, CreateVendorRequest, UpdateVendorRequest } from "@/services/vendors";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { extractErrorMessage } from "@/utils/errorUtils";

export default function Vendors() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [deleteVendorId, setDeleteVendorId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CreateVendorRequest>({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "USA",
    phone: "",
    email: "",
    contactPerson: "",
    attention: "",
    status: "Active",
    isLoginAllowed: false,
    password: "",
  });
  const [isEditMode, setIsEditMode] = useState(false);

  const { canRead, canModify, canDelete } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vendors with pagination
  const { data: vendorsData, isLoading: loadingVendors } = useQuery({
    queryKey: ["vendors", page, pageSize, searchTerm, isActiveFilter],
    queryFn: () => vendorService.getVendors(page, pageSize, searchTerm || undefined, isActiveFilter),
  });

  // Create vendor mutation
  const createVendorMutation = useMutation({
    mutationFn: (data: CreateVendorRequest) => vendorService.createVendor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast({
        title: "Success",
        description: "Vendor created successfully",
      });
      setShowVendorForm(false);
      resetForm();
    },
    onError: (error: any) => {
      const errorMessage = extractErrorMessage(error, "Failed to create vendor");
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update vendor mutation
  const updateVendorMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateVendorRequest }) =>
      vendorService.updateVendor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast({
        title: "Success",
        description: "Vendor updated successfully",
      });
      setShowVendorForm(false);
      resetForm();
    },
    onError: (error: any) => {
      const errorMessage = extractErrorMessage(error, "Failed to update vendor");
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Delete vendor mutation
  const deleteVendorMutation = useMutation({
    mutationFn: (id: number) => vendorService.deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast({
        title: "Success",
        description: "Vendor deleted successfully",
      });
      setShowDeleteDialog(false);
      setDeleteVendorId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to delete vendor",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "USA",
      phone: "",
      email: "",
      contactPerson: "",
      attention: "",
      status: "Active",
      isLoginAllowed: false,
      password: "",
    });
    setIsEditMode(false);
    setSelectedVendor(null);
  };

  const handleAddVendor = () => {
    resetForm();
    setIsEditMode(false);
    setShowVendorForm(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    // Sync status from IsActive if status is not set
    const status = vendor.status || (vendor.isActive ? "Active" : "Inactive");
    setFormData({
      name: vendor.name,
      address: vendor.address || "",
      city: vendor.city || "",
      state: vendor.state || "",
      zipCode: vendor.zipCode || "",
      country: vendor.country || "USA",
      phone: vendor.phone || "",
      email: vendor.email || "",
      contactPerson: vendor.contactPerson || "",
      attention: vendor.attention || "",
      status: status,
      isLoginAllowed: vendor.isLoginAllowed || false,
      password: "", // Don't pre-fill password for security
    });
    setIsEditMode(true);
    setSelectedVendor(vendor);
    setShowVendorForm(true);
  };

  const handleDeleteVendor = (vendorId: number) => {
    setDeleteVendorId(vendorId);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (deleteVendorId) {
      deleteVendorMutation.mutate(deleteVendorId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password when IsLoginAllowed is true (for create mode)
    if (!isEditMode && formData.isLoginAllowed && !formData.password?.trim()) {
      toast({
        title: "Validation Error",
        description: "Password is required when login access is enabled",
        variant: "destructive",
      });
      return;
    }
    
    if (isEditMode && selectedVendor) {
      // Status will automatically sync IsActive in backend
      // Only include password if it's provided (for update)
      const updateData: UpdateVendorRequest = {
        ...formData,
        // Remove password from update if empty (backend will keep current password)
        password: formData.password?.trim() || undefined,
      };
      updateVendorMutation.mutate({ id: selectedVendor.vendorId, data: updateData });
    } else {
      createVendorMutation.mutate(formData);
    }
  };

  const vendors = vendorsData?.data || [];
  const totalPages = vendorsData?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vendors</h1>
        </div>
        {canModify("VENDORS") && (
          <Button onClick={handleAddVendor}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
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
                placeholder="Search by vendor name, city, state, phone, or email..."
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

      {/* Vendors Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Vendor List ({vendorsData?.totalCount || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingVendors ? (
            <div className="text-center py-8">Loading vendors...</div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No vendors found</div>
          ) : (
            <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>City, State</TableHead>
                <TableHead>Contact</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                  {vendors.map((vendor) => (
                    <TableRow key={vendor.vendorId}>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>
                        <div className="text-sm">
                          {vendor.address && <div>{vendor.address}</div>}
                          {vendor.zipCode && <div>{vendor.zipCode}</div>}
                        </div>
                  </TableCell>
                  <TableCell>
                        <div className="text-sm">
                          {vendor.city && vendor.state && `${vendor.city}, ${vendor.state}`}
                          {vendor.country && <div className="text-muted-foreground">{vendor.country}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                        <div className="text-sm">
                          {vendor.contactPerson && <div>{vendor.contactPerson}</div>}
                          {vendor.attention && <div className="text-muted-foreground">{vendor.attention}</div>}
                    </div>
                  </TableCell>
                      <TableCell>{vendor.phone || "-"}</TableCell>
                      <TableCell>{vendor.email || "-"}</TableCell>
                  <TableCell>
                        <Badge variant={vendor.isActive ? "default" : "secondary"}>
                          {vendor.status || (vendor.isActive ? "Active" : "Inactive")}
                        </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                    {canRead("VENDORS") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditVendor(vendor)}
                            >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                          {canModify("VENDORS") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditVendor(vendor)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete("VENDORS") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteVendor(vendor.vendorId)}
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

      {/* Vendor Form Dialog */}
      <Dialog open={showVendorForm} onOpenChange={setShowVendorForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Update vendor information" : "Create a new vendor in the system"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Vendor Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isLoginAllowed"
                  checked={formData.isLoginAllowed || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isLoginAllowed: checked === true })
                  }
                />
                <Label htmlFor="isLoginAllowed" className="cursor-pointer">
                  Allow Login Access
                </Label>
                <span className="text-sm text-muted-foreground">
                  (Creates user account for vendor portal access)
                </span>
              </div>

              {formData.isLoginAllowed && (
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password {isEditMode ? "(Leave empty to keep current password)" : "*"}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={isEditMode ? "Enter new password or leave empty" : "Enter password for vendor login"}
                    required={!isEditMode}
                  />
                  <p className="text-sm text-muted-foreground">
                    {isEditMode
                      ? "Leave empty to keep the current password unchanged"
                      : "Password will be used for vendor portal login"}
                  </p>
                </div>
              )}

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
                  <Label htmlFor="state">State</Label>
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
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attention">Attention</Label>
                  <Input
                    id="attention"
                    value={formData.attention}
                    onChange={(e) => setFormData({ ...formData, attention: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowVendorForm(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createVendorMutation.isPending || updateVendorMutation.isPending}>
                {isEditMode ? "Update" : "Create"} Vendor
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
              This will soft delete the vendor. This action cannot be undone.
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
