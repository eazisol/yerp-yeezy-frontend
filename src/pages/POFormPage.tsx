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
import { productService, Product } from "@/services/products";
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
          form.reset({
            vendorId: po.vendorId,
            warehouseId: po.warehouseId || undefined,
            notes: po.notes || "",
            expectedDeliveryDate: po.expectedDeliveryDate
              ? new Date(po.expectedDeliveryDate).toISOString().split("T")[0]
              : "",
            lineItems: po.lineItems.map((item) => ({
              productId: item.productId,
              productVariantId: item.productVariantId || undefined,
              orderedQuantity: item.orderedQuantity,
              unitPrice: item.unitPrice,
              notes: item.notes || "",
            })),
          });
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
    append({
      productId: 0,
      productVariantId: undefined,
      orderedQuantity: 1,
      unitPrice: 0,
      notes: "",
    });
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
              {fields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="grid grid-cols-12 gap-4 items-start">
                    <div className="col-span-12 md:col-span-4">
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
                                // Optionally set default price from product
                                const product = products.find((p) => p.productId === parseInt(value));
                                if (product) {
                                  form.setValue(`lineItems.${index}.unitPrice`, product.price || 0);
                                }
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

                    <div className="col-span-8 md:col-span-2">
                      <FormLabel>Line Total</FormLabel>
                      <div className="mt-2 p-2 bg-secondary rounded-md font-medium">
                        ${calculateLineTotal(index).toFixed(2)}
                      </div>
                    </div>

                    <div className="col-span-4 md:col-span-2 flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
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
              ))}

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
