import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { orderService } from "@/services/orders";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface OrderItem {
  orderItemId: number;
  productId?: number | null;
  variantId?: number | null;
  warehouseId?: number | null;
  productName?: string | null;
  productSku?: string | null;
  variantName?: string | null; // Variant name
  productVariantAttributes?: string | null; // Product Variant attributes (JSON with images)
  quantity: number;
  shippedQuantity: number;
  quantityFulfilled: number;
  quantityCanceled: number;
  quantityReturned: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderShipment {
  orderShipmentId: number;
  swellShipmentId?: string | null;
  trackingCode?: string | null;
  carrier?: string | null;
  service?: string | null;
  createdDate: string;
}

interface OrderDetail {
  orderId: number;
  swellOrderId?: string | null;
  orderNumber?: string | null;
  status: string;
  fulfillmentStatus?: string | null;
  comments?: string | null;
  notes?: string | null;
  isCanceled: boolean;
  customerId?: number | null;
  customerName?: string | null;
  customerEmail?: string | null;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency?: string | null;
  paymentStatus?: string | null;
  route?: string | null;
  shippingAddress?: string | null; // Formatted string for backward compatibility
  shippingName?: string | null;
  shippingAddress1?: string | null;
  shippingAddress2?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingZip?: string | null;
  shippingCountry?: string | null;
  shippingPhone?: string | null;
  shippingTaxId?: string | null;
  billingAddress?: string | null;
  createdDate: string;
  editDate?: string | null;
  hasSwellShipmentCreated: boolean;
  warehouseIds: number[];
  orderItems: OrderItem[];
  orderShipments: OrderShipment[];
  statusHistory: any[];
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [imagePreview, setImagePreview] = useState<{
    url: string;
    variantName?: string;
    allImages?: string[];
  } | null>(null);

  // Real-time data fetching with auto-refresh every 5 seconds
  const {
    data: order,
    isLoading,
    error,
    refetch,
  } = useQuery<OrderDetail>({
    queryKey: ["order", id],
    queryFn: async () => {
      if (!id) throw new Error("Order ID is required");
      const orderId = parseInt(id);
      if (isNaN(orderId)) throw new Error("Invalid order ID");
      return await orderService.getOrderById(orderId);
    },
    enabled: !!id,
    refetchInterval: 5000, // Auto-refresh every 5 seconds for real-time updates
    refetchIntervalInBackground: true, // Continue refreshing even when tab is in background
    retry: 2,
  });

  const createShipmentMutation = useMutation({
    mutationFn: (orderId: number) => orderService.createShipment(orderId),
    onSuccess: (data) => {
      toast({
        title: "Shipment created",
        description: data.message,
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create shipment",
        variant: "destructive",
      });
    },
  });

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Refreshed",
        description: "Order data has been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh order data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
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

  // Format currency
  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Map warehouse IDs to labels
  const getWarehouseLabel = (warehouseId: number) => {
    if (warehouseId === 2) return "CN";
    if (warehouseId === 3) return "US";
    return warehouseId.toString();
  };

  // Build warehouse summary from order items
  const getWarehouseSummary = () => {
    const idsFromOrder = order?.warehouseIds ?? [];
    const idsFromItems = order?.orderItems
      ?.map((item) => item.warehouseId)
      .filter((id): id is number => typeof id === "number") ?? [];
    const uniqueIds = Array.from(new Set([...idsFromOrder, ...idsFromItems]));
    if (uniqueIds.length === 0) return "N/A";
    return uniqueIds.map(getWarehouseLabel).join(" / ");
  };

  const getItemWarehouseLabel = (warehouseId?: number | null) => {
    if (!warehouseId) return "N/A";
    return getWarehouseLabel(warehouseId);
  };

  // Build shipping address from separate fields
  const buildShippingAddress = () => {
    if (!order) return "N/A";
    
    const parts: string[] = [];
    
    if (order.shippingName) parts.push(order.shippingName);
    if (order.shippingAddress1) parts.push(order.shippingAddress1);
    if (order.shippingAddress2) parts.push(order.shippingAddress2);
    
    const cityStateZip: string[] = [];
    if (order.shippingCity) cityStateZip.push(order.shippingCity);
    if (order.shippingState) cityStateZip.push(order.shippingState);
    if (order.shippingZip) cityStateZip.push(order.shippingZip);
    if (cityStateZip.length > 0) parts.push(cityStateZip.join(", "));
    
    if (order.shippingCountry) parts.push(order.shippingCountry);
    if (order.shippingPhone) parts.push(`Phone: ${order.shippingPhone}`);
    if (order.shippingTaxId) parts.push(`Tax ID: ${order.shippingTaxId}`);
    
    // Fallback to formatted string if separate fields not available
    if (parts.length === 0 && order.shippingAddress) {
      try {
        const addr = JSON.parse(order.shippingAddress);
        const addrParts = [
          addr.name,
          addr.address1,
          addr.address2,
          addr.city,
          addr.state,
          addr.zip,
          addr.country,
        ].filter(Boolean);
        return addrParts.join(", ") || "N/A";
      } catch {
        return order.shippingAddress || "N/A";
      }
    }
    
    return parts.length > 0 ? parts.join(", ") : "N/A";
  };

  // Check if shipment create is allowed
  const canCreateShipment =
    !order.hasSwellShipmentCreated &&
    order.status?.toLowerCase() === "received from warehouse" &&
    order.orderItems.some((item) => item.shippedQuantity > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/orders")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              {error instanceof Error ? error.message : "Order not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/orders")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Order {order.orderNumber || `#${order.orderId}`}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* {canCreateShipment && (
            <Button
              variant="default"
              size="sm"
              onClick={() => createShipmentMutation.mutate(order.orderId)}
              disabled={createShipmentMutation.isPending}
            >
              {createShipmentMutation.isPending ? "Creating..." : "Create Shipment"}
            </Button>
          )} */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {/* <Badge variant={order.isCanceled ? "destructive" : "default"}>
            {order.status}
          </Badge> */}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Number</span>
              <span className="font-medium text-foreground">
                {order.orderNumber || `#${order.orderId}`}
              </span>
            </div>
            {order.swellOrderId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Swell Order ID</span>
                <span className="font-medium text-foreground text-sm">{order.swellOrderId}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={order.isCanceled ? "destructive" : "default"}>
                {order.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fulfillment Status</span>
              <Badge variant="outline">{order.fulfillmentStatus || "unfulfilled"}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Swell Shipment Created</span>
              <Badge variant={order.hasSwellShipmentCreated ? "default" : "secondary"}>
                {order.hasSwellShipmentCreated ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Status</span>
              <Badge variant="outline">{order.paymentStatus || "N/A"}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Warehouse</span>
              <Badge variant="outline">{getWarehouseSummary()}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Canceled</span>
              <Badge variant={order.isCanceled ? "destructive" : "secondary"}>
                {order.isCanceled ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created Date</span>
              <span className="font-medium text-foreground">{formatDate(order.createdDate)}</span>
            </div>
            {order.editDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-medium text-foreground">{formatDate(order.editDate)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium text-foreground">{order.customerName || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium text-foreground">{order.customerEmail || "N/A"}</span>
            </div>
            {order.customerId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer ID</span>
                <span className="font-medium text-foreground">{order.customerId}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Shipping Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.route && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Route</span>
                <Badge variant="outline">{order.route}</Badge>
              </div>
            )}
            <div className="space-y-2">
              <span className="text-muted-foreground">Shipping Address</span>
              <div className="font-medium text-foreground text-sm space-y-1">
                {order.shippingName && <p>{order.shippingName}</p>}
                {order.shippingAddress1 && <p>{order.shippingAddress1}</p>}
                {order.shippingAddress2 && <p>{order.shippingAddress2}</p>}
                {(order.shippingCity || order.shippingState || order.shippingZip) && (
                  <p>
                    {[order.shippingCity, order.shippingState, order.shippingZip]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
                {order.shippingCountry && <p>{order.shippingCountry}</p>}
                {order.shippingPhone && <p className="text-muted-foreground">Phone: {order.shippingPhone}</p>}
                {order.shippingTaxId && <p className="text-muted-foreground">Tax ID: {order.shippingTaxId}</p>}
                {!order.shippingName && !order.shippingAddress1 && order.shippingAddress && (
                  <p>{buildShippingAddress()}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">
                {formatCurrency(order.subtotal, order.currency || "USD")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium text-foreground">
                {formatCurrency(order.tax, order.currency || "USD")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium text-foreground">
                {formatCurrency(order.shipping, order.currency || "USD")}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t">
              <span className="text-lg font-semibold text-foreground">Total</span>
              <span className="text-lg font-semibold text-foreground">
                {formatCurrency(order.total, order.currency || "USD")}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comments and Notes */}
      {(order.comments || order.notes) && (
        <div className="grid gap-6 md:grid-cols-2">
          {order.comments && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap">{order.comments}</p>
              </CardContent>
            </Card>
          )}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Shipment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Shipment Details</CardTitle>
        </CardHeader>
        <CardContent>
          {order.orderShipments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No shipments found.</p>
          ) : (
            <div className="space-y-3">
              {order.orderShipments.map((shipment) => (
                <div
                  key={shipment.orderShipmentId}
                  className="flex flex-col gap-2 p-4 bg-secondary/50 rounded-lg"
                >
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span>
                      <span className="text-muted-foreground">Shipment ID:</span>{" "}
                      <span className="font-medium text-foreground">
                        {shipment.swellShipmentId || "N/A"}
                      </span>
                    </span>
                    <span>
                      <span className="text-muted-foreground">Tracking:</span>{" "}
                      <span className="font-medium text-foreground">
                        {shipment.trackingCode || "N/A"}
                      </span>
                    </span>
                    <span>
                      <span className="text-muted-foreground">Carrier:</span>{" "}
                      <span className="font-medium text-foreground">
                        {shipment.carrier || "N/A"}
                      </span>
                    </span>
                    <span>
                      <span className="text-muted-foreground">Service:</span>{" "}
                      <span className="font-medium text-foreground">
                        {shipment.service || "N/A"}
                      </span>
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Created: {formatDate(shipment.createdDate)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Items ({order.orderItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.orderItems.map((item) => {
              // Get variant images from attributes
              const variantAttributes = parseAttributes(item.productVariantAttributes);
              const variantImages = getImagesFromAttributes(variantAttributes);
              const firstVariantImage = variantImages.length > 0 ? variantImages[0] : null;
              
              // Extract size and color from attributes (case-insensitive)
              const size = variantAttributes?.size || variantAttributes?.Size || variantAttributes?.SIZE || "";
              const color = variantAttributes?.color || variantAttributes?.Color || variantAttributes?.COLOR || "";
              
              return (
                <div
                  key={item.orderItemId}
                  className="flex justify-between items-start p-4 bg-secondary/50 rounded-lg"
                >
                  <div className="flex-1 flex items-start gap-3">
                    {/* Variant Image Thumbnail */}
                    {firstVariantImage ? (
                      <div className="flex-shrink-0 flex items-center gap-1">
                        <button
                          onClick={() => setImagePreview({ 
                            url: firstVariantImage, 
                            variantName: item.variantName || item.productName || "Item",
                            allImages: variantImages
                          })}
                          className="flex-shrink-0 hover:opacity-80 transition-opacity"
                          title="Click to preview images"
                        >
                          <img
                            src={firstVariantImage}
                            alt={item.variantName || item.productName || "Item"}
                            className="w-16 h-16 object-cover rounded border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </button>
                        {variantImages.length > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            +{variantImages.length - 1}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-16 h-16 bg-muted rounded border flex items-center justify-center">
                        <span className="text-xs text-muted-foreground text-center">No image</span>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.productName || "N/A"}</p>
                      <div className="text-sm text-muted-foreground space-y-0.5 mt-1">
                        <p>SKU: {item.productSku || "N/A"}</p>
                        {item.variantName && (
                          <p className="text-xs">Variant: {item.variantName}</p>
                        )}
                      <p className="text-xs">
                        Warehouse: <span className="font-medium text-foreground">{getItemWarehouseLabel(item.warehouseId)}</span>
                      </p>
                        {/* Size and Color Display */}
                        {(size || color) && (
                          <div className="flex items-center gap-2 mt-1">
                            {size && (
                              <span className="text-xs">
                                Size: <span className="font-medium text-foreground">{size}</span>
                              </span>
                            )}
                            {size && color && (
                              <span className="text-xs text-muted-foreground">·</span>
                            )}
                            {color && (
                              <span className="text-xs">
                                Color: <span className="font-medium text-foreground">{color}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                <div className="text-right space-y-2">
                  <div>
                    <p className="font-medium text-foreground">
                      {formatCurrency(item.totalPrice, order.currency || "USD")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.unitPrice, order.currency || "USD")} × {item.quantity}
                    </p>
                  </div>
                  {/* Quantity Status - Always show all fields */}
                  <div className="text-xs space-y-0.5 pt-1 border-t">
                    <div className="flex items-center justify-end gap-3">
                      <span className="text-muted-foreground">Qty:</span>
                      <span className="font-medium">{item.quantity}</span>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-muted-foreground">Shipped:</span>
                      <span className={`font-medium ${item.shippedQuantity > 0 ? "text-green-600" : "text-muted-foreground"}`}>
                        {item.shippedQuantity}
                      </span>
                    </div>
                    {/* <div className="flex items-center justify-end gap-2">
                      <span className="text-muted-foreground">Fulfilled:</span>
                      <span className={`font-medium ${item.quantityFulfilled > 0 ? "text-green-600" : "text-muted-foreground"}`}>
                        {item.quantityFulfilled}
                      </span>
                    </div> */}
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-muted-foreground">Canceled:</span>
                      <span className={`font-medium ${item.quantityCanceled > 0 ? "text-red-600" : "text-muted-foreground"}`}>
                        {item.quantityCanceled}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-muted-foreground">Returned:</span>
                      <span className={`font-medium ${item.quantityReturned > 0 ? "text-orange-600" : "text-muted-foreground"}`}>
                        {item.quantityReturned}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-lg font-semibold text-foreground">Total</span>
              <span className="text-lg font-semibold text-foreground">
                {formatCurrency(order.total, order.currency || "USD")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          {imagePreview && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {imagePreview.variantName || "Product Image"}
                </h3>
                <div className="flex justify-center">
                  <img
                    src={imagePreview.url}
                    alt={imagePreview.variantName || "Product"}
                    className="max-w-full max-h-[70vh] object-contain rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-image.png';
                    }}
                  />
                </div>
              </div>
              {imagePreview.allImages && imagePreview.allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {imagePreview.allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setImagePreview({ ...imagePreview, url: img })}
                      className={`border-2 rounded overflow-hidden ${
                        imagePreview.url === img ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Image ${idx + 1}`}
                        className="w-full h-20 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
