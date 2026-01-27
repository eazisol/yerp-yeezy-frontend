import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CreateWarehouseRequest, UpdateWarehouseRequest, Warehouse } from "@/services/warehouses";

type PublicCredentials = {
  clientId: string;
  clientSecret: string;
} | null;

type WarehouseFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  initialWarehouse?: Warehouse | null;
  publicCredentials: PublicCredentials;
  isSubmitting: boolean;
  isRegenerating?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateWarehouseRequest | UpdateWarehouseRequest) => void;
  onCancel: () => void;
  onCopyValue: (value: string, label: string) => void;
  onRegenerateCredentials?: () => void;
};

// Build default form values for create/edit mode.
const buildFormData = (warehouse?: Warehouse | null): CreateWarehouseRequest => {
  const status = warehouse?.status || (warehouse?.isActive ? "Active" : "Inactive");
  return {
    warehouseCode: warehouse?.warehouseCode || "",
    name: warehouse?.name || "",
    address: warehouse?.address || "",
    city: warehouse?.city || "",
    state: warehouse?.state || "",
    zipCode: warehouse?.zipCode || "",
    country: warehouse?.country || "China",
    contactPerson1: warehouse?.contactPerson1 || "",
    contactPhone1: warehouse?.contactPhone1 || "",
    contactPerson2: warehouse?.contactPerson2 || "",
    contactPhone2: warehouse?.contactPhone2 || "",
    email: warehouse?.email || "",
    status: status,
  };
};

// Normalize email to undefined when empty.
const normalizeEmail = (email?: string) => {
  if (!email || email.trim() === "") return undefined;
  return email.trim();
};

// Warehouse create/edit dialog with shared form fields.
export default function WarehouseFormDialog({
  open,
  mode,
  initialWarehouse,
  publicCredentials,
  isSubmitting,
  isRegenerating,
  onOpenChange,
  onSubmit,
  onCancel,
  onCopyValue,
  onRegenerateCredentials,
}: WarehouseFormDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<CreateWarehouseRequest>(buildFormData(initialWarehouse));

  useEffect(() => {
    if (open) {
      setFormData(buildFormData(initialWarehouse));
    } else {
      setFormData(buildFormData(null));
    }
  }, [open, initialWarehouse]);

  // Validate and submit form data.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.email) {
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

    const payload = {
      ...formData,
      email: normalizeEmail(formData.email),
    };

    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Warehouse" : "Add New Warehouse"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Update warehouse information" : "Create a new warehouse in the system"}
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

          {publicCredentials && (
            <div className="mt-4 rounded-lg border p-4 bg-secondary/40 space-y-3">
              <div className="text-sm font-medium">Public API Credentials (copy now)</div>
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm truncate">
                  <span className="text-muted-foreground">Client ID:</span> {publicCredentials.clientId}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onCopyValue(publicCredentials.clientId, "Client ID")}
                >
                  Copy
                </Button>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm truncate">
                  <span className="text-muted-foreground">Client Secret:</span> {publicCredentials.clientSecret}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onCopyValue(publicCredentials.clientSecret, "Client Secret")}
                >
                  Copy
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {mode === "edit" && onRegenerateCredentials && (
              <Button
                type="button"
                variant="outline"
                onClick={onRegenerateCredentials}
                disabled={isRegenerating || isSubmitting}
              >
                {isRegenerating ? "Regenerating..." : "Regenerate Credentials"}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {mode === "edit" ? "Update" : "Create"} Warehouse
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
