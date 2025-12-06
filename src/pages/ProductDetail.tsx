import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
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
import { productService } from "@/services/products";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canModify, canDelete } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const productId = id ? parseInt(id) : 0;

  // Fetch product detail
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productService.getProductById(productId),
    enabled: !!productId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => productService.deleteProduct(productId),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      navigate("/products");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    navigate(`/products/${productId}/edit`);
  };

  const handleDelete = () => {
    setIsDeleteOpen(true);
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/products")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">Product not found</p>
        </div>
      </div>
    );
  }

  const productDetail = product as any; // Type assertion for product detail response

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/products")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{productDetail.name}</h1>
            <p className="text-muted-foreground mt-1">SKU: {productDetail.sku}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {canModify("PRODUCTS") && (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canDelete("PRODUCTS") && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">SKU</span>
              <span className="font-medium text-foreground">{productDetail.sku}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category</span>
              <span className="font-medium text-foreground">{productDetail.category || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Origin</span>
              <Badge variant="outline">{productDetail.origin || "N/A"}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price</span>
              <span className="font-medium text-foreground">
                {formatCurrency(productDetail.price, productDetail.currency || "USD")}
              </span>
            </div>
            {productDetail.comparePrice && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Compare Price</span>
                <span className="font-medium text-foreground line-through text-muted-foreground">
                  {formatCurrency(productDetail.comparePrice, productDetail.currency || "USD")}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge
                variant={productDetail.status?.toLowerCase() === "active" ? "default" : "secondary"}
              >
                {productDetail.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium text-foreground">{productDetail.type || "N/A"}</span>
            </div>
            {productDetail.description && (
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground">Description</span>
                <p className="text-sm text-foreground">{productDetail.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inventory Levels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {productDetail.inventory && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Stock</span>
                  <span className="font-medium text-foreground">
                    {productDetail.inventory.totalStock} units
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available Stock</span>
                  <span className="font-medium text-foreground">
                    {productDetail.inventory.availableStock} units
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reserved Stock</span>
                  <span className="font-medium text-foreground">
                    {productDetail.inventory.reservedStock} units
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reorder Point</span>
                  <span className="font-medium text-foreground">
                    {productDetail.inventory.reorderPoint} units
                  </span>
                </div>
              </>
            )}
            {productDetail.warehouseInventories && productDetail.warehouseInventories.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-3">Warehouse Inventory</h4>
                {productDetail.warehouseInventories.map((wi: any) => (
                  <div key={wi.warehouseInventoryId} className="flex justify-between mb-2">
                    <span className="text-muted-foreground">{wi.warehouseCode}</span>
                    <span className="font-medium text-foreground">{wi.availableStock} units</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will soft delete the product "{productDetail.name}" and mark it as inactive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
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
