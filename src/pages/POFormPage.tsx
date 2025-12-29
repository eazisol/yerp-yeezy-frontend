import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import {
  CreatePurchaseOrderRequest,
  CreatePurchaseOrderLineItemRequest,
  UpdatePurchaseOrderRequest,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
} from "@/services/purchaseOrders";
import { vendorService, Vendor } from "@/services/vendors";
import { warehouseService, Warehouse } from "@/services/warehouses";
import { productService, Product, ProductVariant } from "@/services/products";
import { useToast } from "@/hooks/use-toast";

export default function POFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id && id !== "new";
  const poId = id && isEdit ? parseInt(id) : 0;

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  // Store variants for each line item (index -> variants array)
  const [lineItemVariants, setLineItemVariants] = useState<Record<number, ProductVariant[]>>({});
  // Store loading state for variant fetching
  const [loadingVariants, setLoadingVariants] = useState<Record<number, boolean>>({});

  const form = useForm<CreatePurchaseOrderRequest>({
    defaultValues: {
      vendorId: 0,
      warehouseId: undefined,
      notes: "",
      expectedDeliveryDate: "",
      lineItems: [
        {
          productId: 0,
          productVariantId: undefined,
          orderedQuantity: 1,
          unitPrice: 0,
          notes: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch vendors
        const vendorsRes = await vendorService.getVendors(1, 100);
        setVendors(vendorsRes.data.filter((v) => v.isActive));

        // Fetch warehouses
        const warehousesRes = await warehouseService.getWarehouses(1, 100);
        setWarehouses(warehousesRes.data.filter((w) => w.isActive));

        // Fetch products
        const productsRes = await productService.getProducts(1, 1000);
        setProducts(productsRes.data);

        // If editing, fetch PO data
        if (isEdit && poId) {
          const po = await getPurchaseOrderById(poId);
          const lineItemsData = po.lineItems.map((item) => ({
            productId: item.productId,
            productVariantId: item.productVariantId || undefined,
            orderedQuantity: item.orderedQuantity,
            unitPrice: item.unitPrice,
            notes: item.notes || "",
          }));
          
          form.reset({
            vendorId: po.vendorId,
            warehouseId: po.warehouseId || undefined,
            notes: po.notes || "",
            expectedDeliveryDate: po.expectedDeliveryDate
              ? new Date(po.expectedDeliveryDate).toISOString().split("T")[0]
              : "",
            lineItems: lineItemsData,
          });

          // Fetch variants for each line item in edit mode
          const variantsMap: Record<number, ProductVariant[]> = {};
          for (let i = 0; i < lineItemsData.length; i++) {
            const item = lineItemsData[i];
            if (item.productId > 0) {
              try {
                const productDetail = await productService.getProductById(item.productId);
                variantsMap[i] = productDetail.variants || [];
              } catch (error) {
                console.error(`Failed to load variants for product ${item.productId}:`, error);
                variantsMap[i] = [];
              }
            }
          }
          setLineItemVariants(variantsMap);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isEdit, poId, form, toast]);

  const onSubmit = async (data: CreatePurchaseOrderRequest) => {
    try {
      setSubmitting(true);

      // Validate line items
      if (!data.lineItems || data.lineItems.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one line item",
          variant: "destructive",
        });
        return;
      }

      // Validate vendor
      if (!data.vendorId || data.vendorId === 0) {
        toast({
          title: "Error",
          description: "Please select a vendor",
          variant: "destructive",
        });
        return;
      }

      // Validate variant selection for products with variants
      for (let i = 0; i < data.lineItems.length; i++) {
        const item = data.lineItems[i];
        if (item.productId > 0) {
          const variants = lineItemVariants[i] || [];
          if (variants.length > 0 && !item.productVariantId) {
            toast({
              title: "Error",
              description: `Please select a variant for product in line item ${i + 1}`,
              variant: "destructive",
            });
            return;
          }
        }
      }

      // Filter out invalid line items
      const validLineItems = data.lineItems.filter(
        (item) => item.productId > 0 && item.orderedQuantity > 0 && item.unitPrice >= 0
      );

      if (validLineItems.length === 0) {
        toast({
          title: "Error",
          description: "Please add valid line items",
          variant: "destructive",
        });
        return;
      }

      const submitData = {
        ...data,
        lineItems: validLineItems,
        warehouseId: data.warehouseId || undefined,
      };

      if (isEdit && poId) {
        await updatePurchaseOrder(poId, submitData as UpdatePurchaseOrderRequest);
        toast({
          title: "Success",
          description: "Purchase order updated successfully",
        });
      } else {
        await createPurchaseOrder(submitData);
        toast({
          title: "Success",
          description: "Purchase order created successfully",
        });
      }

      navigate("/purchase-orders");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save purchase order",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const addLineItem = () => {
    const newIndex = fields.length;
    append({
      productId: 0,
      productVariantId: undefined,
      orderedQuantity: 1,
      unitPrice: 0,
      notes: "",
    });
    // Initialize variants array for new line item
    setLineItemVariants((prev) => ({ ...prev, [newIndex]: [] }));
  };

  // Fetch variants when product is selected
  const handleProductChange = async (productId: number, lineItemIndex: number) => {
    if (!productId || productId === 0) {
      // Clear variants if no product selected
      setLineItemVariants((prev) => {
        const updated = { ...prev };
        updated[lineItemIndex] = [];
        return updated;
      });
      // Clear variant selection
      form.setValue(`lineItems.${lineItemIndex}.productVariantId`, undefined);
      // Reset price to product price
      const product = products.find((p) => p.productId === productId);
      if (product) {
        form.setValue(`lineItems.${lineItemIndex}.unitPrice`, product.price || 0);
      }
      return;
    }

    try {
      // Set loading state
      setLoadingVariants((prev) => ({ ...prev, [lineItemIndex]: true }));

      // Fetch product details with variants
      const productDetail = await productService.getProductById(productId);

      // Store variants for this line item
      setLineItemVariants((prev) => ({
        ...prev,
        [lineItemIndex]: productDetail.variants || [],
      }));

      // Clear variant selection when product changes
      form.setValue(`lineItems.${lineItemIndex}.productVariantId`, undefined);

      // Set default price from product (will be overridden if variant selected)
      form.setValue(`lineItems.${lineItemIndex}.unitPrice`, productDetail.price || 0);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load product variants",
        variant: "destructive",
      });
      setLineItemVariants((prev) => {
        const updated = { ...prev };
        updated[lineItemIndex] = [];
        return updated;
      });
    } finally {
      setLoadingVariants((prev) => ({ ...prev, [lineItemIndex]: false }));
    }
  };

  // Handle variant selection
  const handleVariantChange = (variantId: number | undefined, lineItemIndex: number) => {
    if (!variantId) {
      // If no variant selected, use product price
      const productId = form.watch(`lineItems.${lineItemIndex}.productId`);
      const product = products.find((p) => p.productId === productId);
      if (product) {
        form.setValue(`lineItems.${lineItemIndex}.unitPrice`, product.price || 0);
      }
      return;
    }

    // Find selected variant
    const variants = lineItemVariants[lineItemIndex] || [];
    const selectedVariant = variants.find((v) => v.variantId === variantId);

    if (selectedVariant) {
      // Use variant price if available, otherwise use product price
      const productId = form.watch(`lineItems.${lineItemIndex}.productId`);
      const product = products.find((p) => p.productId === productId);
      const variantPrice = selectedVariant.price;
      const productPrice = product?.price || 0;

      // Prefer variant price, fallback to product price
      form.setValue(
        `lineItems.${lineItemIndex}.unitPrice`,
        variantPrice !== null && variantPrice !== undefined ? variantPrice : productPrice
      );
    }
  };

  // Get variant display name
  const getVariantDisplayName = (variant: ProductVariant): string => {
    let displayName = variant.name || variant.sku || `Variant ${variant.variantId}`;
    
    // Try to parse attributes JSON to show size/color etc.
    if (variant.attributes) {
      try {
        const attrs = JSON.parse(variant.attributes);
        const attrParts: string[] = [];
        if (attrs.size) attrParts.push(`Size: ${attrs.size}`);
        if (attrs.color) attrParts.push(`Color: ${attrs.color}`);
        if (attrParts.length > 0) {
          displayName += ` (${attrParts.join(", ")})`;
        }
      } catch {
        // If JSON parsing fails, just use the name
      }
    }
    
    if (variant.sku && variant.sku !== displayName) {
      displayName += ` - ${variant.sku}`;
    }
    
    return displayName;
  };

  const getProductName = (productId: number) => {
    const product = products.find((p) => p.productId === productId);
    return product ? `${product.name} (${product.sku})` : "Select Product";
  };

  const calculateLineTotal = (index: number) => {
    const quantity = form.watch(`lineItems.${index}.orderedQuantity`) || 0;
    const unitPrice = form.watch(`lineItems.${index}.unitPrice`) || 0;
    return quantity * unitPrice;
  };

  const calculateTotal = () => {
    return fields.reduce((sum, _, index) => {
      return sum + calculateLineTotal(index);
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/purchase-orders")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isEdit ? "Edit Purchase Order" : "Create Purchase Order"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEdit ? "Update purchase order details" : "Create a new purchase order"}
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Select vendor and warehouse details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="vendorId"
                rules={{ required: "Vendor is required", min: { value: 1, message: "Please select a vendor" } }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor *</FormLabel>
                    <Select
                      value={field.value && field.value > 0 ? field.value.toString() : undefined}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.vendorId} value={vendor.vendorId.toString()}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="warehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warehouse (Optional)</FormLabel>
                    <Select
                      value={field.value?.toString() || "none"}
                      onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select warehouse (can be set later)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None (Set at dispatch)</SelectItem>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.warehouseId} value={warehouse.warehouseId.toString()}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expectedDeliveryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Delivery Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Internal notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Line Items</CardTitle>
                  <CardDescription>Add products to the purchase order</CardDescription>
                </div>
                <Button type="button" onClick={addLineItem} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => {
                const variants = lineItemVariants[index] || [];
                const isLoadingVariants = loadingVariants[index] || false;
                const selectedProductId = form.watch(`lineItems.${index}.productId`);
                const selectedVariantId = form.watch(`lineItems.${index}.productVariantId`);

                return (
                  <Card key={field.id} className="p-4">
                    <div className="grid grid-cols-12 gap-4 items-start">
                      <div className={`col-span-12 ${selectedProductId > 0 && variants.length > 0 ? 'md:col-span-3' : 'md:col-span-4'}`}>
                        <FormField
                          control={form.control}
                          name={`lineItems.${index}.productId`}
                          rules={{
                            required: "Product is required",
                            min: { value: 1, message: "Please select a product" },
                          }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product *</FormLabel>
                              <Select
                                value={field.value && field.value > 0 ? field.value.toString() : undefined}
                                onValueChange={(value) => {
                                  field.onChange(parseInt(value));
                                  handleProductChange(parseInt(value), index);
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select product" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {products.map((product) => (
                                    <SelectItem
                                      key={product.productId}
                                      value={product.productId.toString()}
                                    >
                                      {product.name} ({product.sku})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Variant Selection */}
                      {selectedProductId > 0 && (
                        <div className="col-span-12 md:col-span-3">
                          <FormField
                            control={form.control}
                            name={`lineItems.${index}.productVariantId`}
                            rules={{
                              required: variants.length > 0 ? "Variant is required for this product" : false,
                              validate: (value) => {
                                if (variants.length > 0 && !value) {
                                  return "Please select a variant";
                                }
                                return true;
                              }
                            }}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Variant {variants.length > 0 ? "*" : ""}
                                </FormLabel>
                                {isLoadingVariants ? (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading variants...
                                  </div>
                                ) : variants.length > 0 ? (
                                  <Select
                                    value={field.value?.toString() || ""}
                                    onValueChange={(value) => {
                                      field.onChange(parseInt(value));
                                      handleVariantChange(parseInt(value), index);
                                    }}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select variant *" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {variants.map((variant) => (
                                        <SelectItem
                                          key={variant.variantId}
                                          value={variant.variantId.toString()}
                                        >
                                          {getVariantDisplayName(variant)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <div className="text-sm text-muted-foreground p-2 bg-secondary rounded-md">
                                    No variants available for this product
                                  </div>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      <div className="col-span-6 md:col-span-2">
                        <FormField
                          control={form.control}
                          name={`lineItems.${index}.orderedQuantity`}
                          rules={{
                            required: "Quantity is required",
                            min: { value: 1, message: "Quantity must be at least 1" },
                          }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-6 md:col-span-2">
                        <FormField
                          control={form.control}
                          name={`lineItems.${index}.unitPrice`}
                          rules={{
                            required: "Unit price is required",
                            min: { value: 0, message: "Price must be 0 or greater" },
                          }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit Price *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-6 md:col-span-1">
                        <FormLabel>Total</FormLabel>
                        <div className="mt-2 p-2 bg-secondary rounded-md font-medium text-sm">
                          ${calculateLineTotal(index).toFixed(2)}
                        </div>
                      </div>

                      <div className="col-span-6 md:col-span-1 flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            remove(index);
                            // Clean up variants state for removed item
                            // Note: Variants will be refetched when products are selected in remaining items
                            setLineItemVariants((prev) => {
                              const updated = { ...prev };
                              delete updated[index];
                              return updated;
                            });
                          }}
                          disabled={fields.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      </div>

                    <div className="mt-4">
                      <FormField
                        control={form.control}
                        name={`lineItems.${index}.notes`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Line item notes (optional)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </Card>
                );
              })}

              {fields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No line items added. Click "Add Item" to add products.
                </div>
              )}

              {fields.length > 0 && (
                <div className="flex justify-end pt-4 border-t">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-bold">${calculateTotal().toFixed(2)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/purchase-orders")}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>{isEdit ? "Update" : "Create"} Purchase Order</>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
