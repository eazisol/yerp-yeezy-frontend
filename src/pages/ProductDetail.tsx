import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

// Component for variant image thumbnail with fallback to next image
function VariantImageThumbnail({ 
  images, 
  variantName, 
  onImageClick 
}: { 
  images: string[]; 
  variantName: string; 
  onImageClick: (url: string) => void;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  if (images.length === 0 || imageError) {
    return <span className="text-muted-foreground text-sm">No image</span>;
  }

  const currentImage = images[currentImageIndex];

  const handleImageError = () => {
    // Try next image if available
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    } else {
      // All images failed
      setImageError(true);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onImageClick(currentImage)}
        className="flex-shrink-0 hover:opacity-80 transition-opacity"
        title="Click to preview images"
      >
        <img
          src={currentImage}
          alt={variantName || "Variant"}
          className="w-10 h-10 object-cover rounded border"
          onError={handleImageError}
          onLoad={() => setImageError(false)}
        />
      </button>
      {images.length > 1 && (
        <Badge variant="secondary" className="text-xs">
          +{images.length - 1}
        </Badge>
      )}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canModify, canDelete } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ url: string; variantName: string } | null>(null);

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

  // Parse variant attributes JSON
  const parseAttributes = (attributesJson: string | null | undefined) => {
    if (!attributesJson) return {};
    try {
      return JSON.parse(attributesJson);
    } catch {
      return {};
    }
  };

  // Get images from attributes
  const getImagesFromAttributes = (attributes: any): string[] => {
    const images: string[] = [];
    
    // Check for 'images' or 'image' field
    if (attributes.images) {
      if (Array.isArray(attributes.images)) {
        images.push(...attributes.images);
      } else if (typeof attributes.images === 'string') {
        try {
          const parsed = JSON.parse(attributes.images);
          if (Array.isArray(parsed)) {
            images.push(...parsed);
          } else {
            images.push(attributes.images);
          }
        } catch {
          images.push(attributes.images);
        }
      }
    }
    
    if (attributes.image && !images.includes(attributes.image)) {
      images.push(attributes.image);
    }
    
    return images.filter(img => img && typeof img === 'string');
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
            <h1 className="text-2xl font-bold text-foreground">{productDetail.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* {canModify("PRODUCTS") && (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )} */}
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
            {/* <div className="flex justify-between">
              <span className="text-muted-foreground">Category</span>
              <span className="font-medium text-foreground">{productDetail.category || "N/A"}</span>
            </div> */}
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
                variant={productDetail.isActive ? "default" : "secondary"}
              >
                {productDetail.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            {/* <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium text-foreground">{productDetail.type || "N/A"}</span>
            </div> */}
            {productDetail.color && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Color</span>
                <span className="font-medium text-foreground">{productDetail.color}</span>
              </div>
            )}
            {productDetail.sizes && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sizes</span>
                <span className="font-medium text-foreground">{productDetail.sizes}</span>
              </div>
            )}
            {productDetail.gender && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gender</span>
                <span className="font-medium text-foreground">{productDetail.gender}</span>
              </div>
            )}
            {productDetail.option && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Option</span>
                <span className="font-medium text-foreground">{productDetail.option}</span>
              </div>
            )}
            {productDetail.slot && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slot</span>
                <span className="font-medium text-foreground">{productDetail.slot}</span>
              </div>
            )}
            {productDetail.shippingWeight && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping Weight</span>
                <span className="font-medium text-foreground">{productDetail.shippingWeight} kg</span>
              </div>
            )}
            {productDetail.metaDescription && (
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground">Meta Description</span>
                <span className="text-sm text-foreground">{productDetail.metaDescription}</span>
              </div>
            )}
            {productDetail.description !== null && productDetail.description !== undefined && (
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground">Description</span>
                {productDetail.description.trim() ? (
                  <div
                    className="text-sm text-foreground whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: productDetail.description }}
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">N/A</span>
                )}
              </div>
            )}
            {productDetail.images && (
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground">Product Images</span>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    try {
                      const images = typeof productDetail.images === 'string' 
                        ? JSON.parse(productDetail.images) 
                        : productDetail.images;
                      const imageArray = Array.isArray(images) ? images : [images];
                      return imageArray.filter((img: any) => img).map((img: string, index: number) => (
                        <img
                          key={index}
                          src={img}
                          alt={`Product image ${index + 1}`}
                          className="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-80"
                          onClick={() => window.open(img, '_blank')}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ));
                    } catch {
                      return <span className="text-sm text-muted-foreground">Invalid image data</span>;
                    }
                  })()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inventory Levels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[686px] overflow-y-auto">
            {/* {productDetail.inventory ? (
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
            ) : (
              <p className="text-sm text-muted-foreground">No inventory data available</p>
            )} */}
            {/* <div className="border-t pt-4 mt-4">
              <h4 className="font-semibold mb-3">Warehouse Inventory (Product Level)</h4>
              {productDetail.warehouseInventories && productDetail.warehouseInventories.length > 0 ? (
                productDetail.warehouseInventories.map((wi: any) => (
                  <div key={wi.warehouseInventoryId} className="flex justify-between mb-2">
                    <span className="text-muted-foreground">{wi.warehouseCode}</span>
                    <span className="font-medium text-foreground">{wi.availableStock} units</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No product-level warehouse inventory</p>
              )}
            </div> */}

            {/* Variant-level Warehouse Inventory Summary */}
            {productDetail.variants && productDetail.variants.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-3">Warehouse Inventory (Variant Level)</h4>
                {(() => {
                  // Collect all variant warehouse inventories
                  const variantWarehouseMap = new Map<string, { warehouseCode: string; totalStock: number; variants: Array<{ variantName: string; stock: number }> }>();
                  
                  productDetail.variants.forEach((variant: any) => {
                    const hasInventories =
                      variant.warehouseInventories &&
                      Array.isArray(variant.warehouseInventories) &&
                      variant.warehouseInventories.length > 0;

                    if (hasInventories) {
                      variant.warehouseInventories.forEach((wi: any) => {
                        const key = wi.warehouseId?.toString() || wi.warehouseCode || "Unknown";
                        if (!variantWarehouseMap.has(key)) {
                          variantWarehouseMap.set(key, {
                            warehouseCode: wi.warehouseCode || "Unknown",
                            totalStock: 0,
                            variants: [],
                          });
                        }
                        const warehouseData = variantWarehouseMap.get(key)!;
                        warehouseData.totalStock += wi.availableStock || 0;
                        // Include SKU in variant label for clarity
                        const variantLabel = variant.name
                          ? `${variant.name} (${variant.sku || "N/A"})`
                          : (variant.sku || `Variant ${variant.variantId}`);

                        warehouseData.variants.push({
                          variantName: variantLabel,
                          stock: wi.availableStock || 0,
                        });
                      });
                      return;
                    }

                    // Show zero-qty variants under CN/US
                    const ensureWarehouse = (key: string, code: string) => {
                      if (!variantWarehouseMap.has(key)) {
                        variantWarehouseMap.set(key, {
                          warehouseCode: code,
                          totalStock: 0,
                          variants: [],
                        });
                      }
                      return variantWarehouseMap.get(key)!;
                    };

                    const fallbackVariantLabel = variant.name
                      ? `${variant.name} (${variant.sku || "N/A"})`
                      : (variant.sku || `Variant ${variant.variantId}`);

                    const cnWarehouse = ensureWarehouse("2", "China");
                    cnWarehouse.variants.push({
                      variantName: fallbackVariantLabel,
                      stock: 0,
                    });

                    const usWarehouse = ensureWarehouse("3", "US");
                    usWarehouse.variants.push({
                      variantName: fallbackVariantLabel,
                      stock: 0,
                    });
                  });

                  if (variantWarehouseMap.size === 0) {
                    return <p className="text-sm text-muted-foreground">No variant-level warehouse inventory</p>;
                  }

                  return Array.from(variantWarehouseMap.values()).map((warehouseData) => (
                    <div key={warehouseData.warehouseCode} className="mb-4 last:mb-0">
                      <div className="flex justify-between items-center mb-2">
                        <Badge variant="outline" className="font-semibold">
                          {warehouseData.warehouseCode}
                        </Badge>
                        <span className="font-medium text-foreground">
                          Total: {warehouseData.totalStock} units
                        </span>
                      </div>
                      <div className="pl-2 space-y-1">
                        {warehouseData.variants.map((v, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-muted-foreground">
                            <span className="whitespace-normal break-words">{v.variantName}:</span>
                            <span className="font-medium ml-2">{v.stock} units</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Variants Section */}
      {productDetail.variants && productDetail.variants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Product Variants</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {productDetail.variants.length} variant(s) available
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Image</TableHead>
                    <TableHead className="whitespace-nowrap">Variant Name</TableHead>
                    <TableHead className="whitespace-nowrap">SKU</TableHead>
                    <TableHead className="whitespace-nowrap">Variant Options</TableHead>
                    <TableHead className="whitespace-nowrap">Description</TableHead>
                    <TableHead className="whitespace-nowrap">Meta Description</TableHead>
                    <TableHead className="whitespace-nowrap">Price</TableHead>
                    <TableHead className="whitespace-nowrap">Compare Price</TableHead>
                    <TableHead className="whitespace-nowrap">Origin</TableHead>
                    <TableHead className="whitespace-nowrap">Revenue Parent Account</TableHead>
                    <TableHead className="whitespace-nowrap">Revenue Sub Account</TableHead>
                    <TableHead className="whitespace-nowrap">HTS</TableHead>
                    <TableHead className="whitespace-nowrap">UPC</TableHead>
                    <TableHead className="whitespace-nowrap">COG Parent Account</TableHead>
                    <TableHead className="whitespace-nowrap">COG Sub Account</TableHead>
                    <TableHead className="whitespace-nowrap">Variant Slug</TableHead>
                    <TableHead className="whitespace-nowrap">Stock</TableHead>
                    <TableHead className="whitespace-nowrap">Vendors</TableHead>
                    <TableHead className="whitespace-nowrap">Attributes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productDetail.variants.map((variant: any) => {
                    const attributes = parseAttributes(variant.attributes);
                    const images = getImagesFromAttributes(attributes);
                    
                    return (
                      <TableRow key={variant.variantId}>
                        <TableCell className="whitespace-nowrap pr-8">
                          <VariantImageThumbnail
                            images={images}
                            variantName={variant.name || "Variant"}
                            onImageClick={(url) => setImagePreview({ url, variantName: variant.name || "Variant" })}
                          />
                        </TableCell>
                        <TableCell
                          className="font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] pl-4"
                          title={variant.name || "N/A"}
                        >
                          {variant.name || "N/A"}
                        </TableCell>
                        <TableCell
                          className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]"
                          title={variant.sku || "N/A"}
                        >
                          <span className="text-muted-foreground">{variant.sku || "N/A"}</span>
                        </TableCell>
                        <TableCell
                          className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]"
                          title={variant.variantOptions && variant.variantOptions.trim() ? variant.variantOptions : "N/A"}
                        >
                          <span className="text-sm text-foreground">
                            {variant.variantOptions && variant.variantOptions.trim() ? variant.variantOptions : "N/A"}
                          </span>
                        </TableCell>
                        <TableCell
                          className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[250px]"
                          title={variant.description && variant.description.trim() ? variant.description : "N/A"}
                        >
                          <span className="text-sm text-foreground">
                            {variant.description && variant.description.trim() ? variant.description : "N/A"}
                          </span>
                        </TableCell>
                        <TableCell
                          className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[250px]"
                          title={variant.metaDescription && variant.metaDescription.trim() ? variant.metaDescription : "N/A"}
                        >
                          <span className="text-sm text-foreground">
                            {variant.metaDescription && variant.metaDescription.trim() ? variant.metaDescription : "N/A"}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {variant.price !== null && variant.price !== undefined
                            ? formatCurrency(variant.price, productDetail.currency || "USD")
                            : productDetail.price !== null && productDetail.price !== undefined
                            ? formatCurrency(productDetail.price, productDetail.currency || "USD")
                            : "N/A"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {variant.comparePrice
                            ? formatCurrency(variant.comparePrice, productDetail.currency || "USD")
                            : "N/A"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {variant.origin ? (
                            <Badge variant="outline">{variant.origin}</Badge>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell
                          className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]"
                          title={variant.revenueParentAccount && variant.revenueParentAccount.trim() !== "" ? variant.revenueParentAccount : "N/A"}
                        >
                          <span className="text-sm text-foreground">
                            {variant.revenueParentAccount && variant.revenueParentAccount.trim() !== "" 
                              ? variant.revenueParentAccount 
                              : "N/A"}
                          </span>
                        </TableCell>
                        <TableCell
                          className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]"
                          title={variant.revenueSubAccount && variant.revenueSubAccount.trim() !== "" ? variant.revenueSubAccount : "N/A"}
                        >
                          <span className="text-sm text-foreground">
                            {variant.revenueSubAccount && variant.revenueSubAccount.trim() !== "" 
                              ? variant.revenueSubAccount 
                              : "N/A"}
                          </span>
                        </TableCell>
                        <TableCell
                          className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]"
                          title={variant.hts && variant.hts.trim() !== "" ? variant.hts : "N/A"}
                        >
                          <span className="text-sm text-foreground">
                            {variant.hts && variant.hts.trim() !== "" ? variant.hts : "N/A"}
                          </span>
                        </TableCell>
                        <TableCell
                          className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]"
                          title={variant.upc && variant.upc.trim() !== "" ? variant.upc : "N/A"}
                        >
                          <span className="text-sm text-foreground">
                            {variant.upc && variant.upc.trim() !== "" 
                              ? variant.upc 
                              : "N/A"}
                          </span>
                        </TableCell>
                        <TableCell
                          className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]"
                          title={variant.cogParentAccount && variant.cogParentAccount.trim() !== "" ? variant.cogParentAccount : "N/A"}
                        >
                          {variant.cogParentAccount && variant.cogParentAccount.trim() !== "" ? (
                            <span className="font-medium text-foreground">
                              {variant.cogParentAccount}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell
                          className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]"
                          title={variant.cogSubAccount && variant.cogSubAccount.trim() !== "" ? variant.cogSubAccount : "N/A"}
                        >
                          {variant.cogSubAccount && variant.cogSubAccount.trim() !== "" ? (
                            <span className="font-medium text-foreground">
                              {variant.cogSubAccount}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell
                          className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]"
                          title={variant.variantSlug && variant.variantSlug.trim() !== "" ? variant.variantSlug : "N/A"}
                        >
                          <span className="text-sm text-foreground font-mono">
                            {variant.variantSlug && variant.variantSlug.trim() !== "" 
                              ? variant.variantSlug 
                              : "N/A"}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex flex-col gap-1.5">
                            {(() => {
                              if (!variant.warehouseInventories || !Array.isArray(variant.warehouseInventories)) {
                                return null;
                              }

                              // Ensure China (2) and US (3) always show, others only when present
                              const warehouseList = variant.warehouseInventories;
                              const byId = new Map<number, any>();
                              warehouseList.forEach((wi: any) => {
                                if (typeof wi?.warehouseId === "number") {
                                  byId.set(wi.warehouseId, wi);
                                }
                              });

                              const normalized: Array<any> = [];
                              const pushWarehouse = (warehouseId: number, fallbackCode: string) => {
                                const wi = byId.get(warehouseId);
                                normalized.push({
                                  warehouseId,
                                  warehouseCode: wi?.warehouseCode || fallbackCode,
                                  availableStock: wi?.availableStock ?? 0,
                                  usedStock: wi?.usedStock ?? 0,
                                  warehouseInventoryId: wi?.warehouseInventoryId,
                                });
                              };

                              pushWarehouse(2, "China");
                              pushWarehouse(3, "US");

                              // Add other warehouses only if they exist in API response
                              warehouseList.forEach((wi: any) => {
                                if (wi?.warehouseId !== 2 && wi?.warehouseId !== 3) {
                                  normalized.push(wi);
                                }
                              });

                              if (normalized.length === 0) {
                                return null;
                              }

                              return (
                                <div className="text-xs space-y-1 mt-1 pt-1 border-t border-border">
                                  <div className="font-semibold text-muted-foreground mb-0.5">Warehouse:</div>
                                  {normalized.map((wi: any, idx: number) => (
                                    <div
                                      key={wi.warehouseInventoryId || wi.warehouseId || wi.warehouseCode || idx}
                                      className="flex items-center justify-between gap-3"
                                    >
                                      <Badge variant="outline" className="text-xs">
                                        {wi.warehouseCode || "N/A"}
                                      </Badge>
                                      <span className="text-muted-foreground">Qty: {wi.availableStock ?? 0}</span>
                                      <span className="text-muted-foreground">Used: {wi.usedStock ?? 0}</span>
                                      <span className="font-medium text-foreground">
                                        Available: {(wi.availableStock ?? 0) - (wi.usedStock ?? 0)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap max-w-[200px]">
                          {variant.vendors && variant.vendors.length > 0 ? (
                            <div className="flex flex-col gap-1.5">
                              {variant.vendors.map((vendor: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="text-sm overflow-hidden text-ellipsis"
                                  title={vendor.vendorName}
                                >
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium">{vendor.vendorName}</span>
                                    {vendor.cost !== null && vendor.cost !== undefined && (
                                      <Badge variant="secondary" className="text-xs font-normal">
                                        Cost: {formatCurrency(vendor.cost, productDetail.currency || "USD")}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No vendors</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap max-w-[200px] overflow-x-auto">
                          {Object.keys(attributes).length > 0 ? (
                            <div className="flex gap-2 overflow-x-auto">
                              {Object.entries(attributes)
                                .filter(([key]) => key.toLowerCase() !== 'images' && key.toLowerCase() !== 'image') // Filter out images
                                .map(([key, value]) => (
                                  <Badge key={key} variant="outline" className="flex-shrink-0">
                                    {key}: {String(value)}
                                  </Badge>
                                ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No attributes</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Preview Dialog */}
      <Dialog open={!!imagePreview} onOpenChange={(open) => !open && setImagePreview(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {imagePreview?.variantName} - Images
            </DialogTitle>
          </DialogHeader>
          {imagePreview && (() => {
            const variant = productDetail.variants.find((v: any) => {
              const attrs = parseAttributes(v.attributes);
              const imgs = getImagesFromAttributes(attrs);
              return imgs.includes(imagePreview.url);
            });
            const allImages = variant ? getImagesFromAttributes(parseAttributes(variant.attributes)) : [imagePreview.url];
            
            return (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {allImages.map((img, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={img}
                      alt={`${imagePreview.variantName} - Image ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(img, '_blank')}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

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
