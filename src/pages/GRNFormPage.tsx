import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { ArrowLeft, Loader2, X, Upload, File } from "lucide-react";
import {
  CreateGRNRequest,
  CreateGRNLineItemRequest,
  getPurchaseOrderById,
  PurchaseOrder,
  updatePurchaseOrder,
} from "@/services/purchaseOrders";
import { warehouseService, Warehouse } from "@/services/warehouses";
import { createGRN, updateGRN, getGRNById, GRN, UpdateGRNRequest, UpdateGRNLineItemRequest, CreateGRNAttachmentRequest, UpdateGRNAttachmentRequest } from "@/services/grn";
import { uploadGRNAttachment } from "@/services/fileUpload";
import { useToast } from "@/hooks/use-toast";
import { getPurchaseOrders } from "@/services/purchaseOrders";
import { useParams } from "react-router-dom";

export default function GRNFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id && id !== "new";
  const grnId = id && isEdit ? parseInt(id) : 0;

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [existingGRN, setExistingGRN] = useState<GRN | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form type that supports both create and edit
  type GRNFormData = Omit<CreateGRNRequest, "lineItems" | "attachments"> & {
    lineItems: Array<CreateGRNLineItemRequest & { grnLineItemId?: number }>;
    attachments: Array<CreateGRNAttachmentRequest & { attachmentId?: number; file?: File }>;
  };

  const form = useForm<GRNFormData>({
    defaultValues: {
      purchaseOrderId: 0,
      warehouseId: 0,
      receivedDate: new Date().toISOString().split("T")[0],
      receivedBy: "",
      notes: "",
      attachmentPath: "",
      attachments: [],
      lineItems: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  const { fields: attachmentFields, append: appendAttachment, remove: removeAttachment } = useFieldArray({
    control: form.control,
    name: "attachments",
  });

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch purchase orders
        const poRes = await getPurchaseOrders(1, 1000);
        
        console.log("PO API Response:", poRes);
        console.log("POs Data:", poRes.data);
        
        // Filter POs that can have GRN created
        // Allow: Approved, Released, VendorAccepted, PartiallyReceived, FullyReceived
        // Exclude: Draft, PendingApproval, Rejected, Cancelled
        const validPOs = poRes.data.filter(
          (po) => {
            const status = (po.status || "").toLowerCase();
            const excludedStatuses = ["draft", "pendingapproval", "rejected", "cancelled", "vendorrejected"];
            const isValid = !excludedStatuses.includes(status) && po.status;
            return isValid;
          }
        );
        
        console.log("Valid POs after filter:", validPOs);
        console.log("PO Statuses found:", [...new Set(poRes.data.map(po => po.status))]);
        
        setPurchaseOrders(validPOs);
        
        // If no valid POs, show all POs for debugging (remove this later)
        if (validPOs.length === 0 && poRes.data.length > 0) {
          console.warn("No valid POs found, showing all POs for debugging");
          setPurchaseOrders(poRes.data); // Temporarily show all POs
        }

        // Fetch warehouses
        const warehousesRes = await warehouseService.getWarehouses(1, 100);
        setWarehouses(warehousesRes.data.filter((w) => w.isActive));

        // If editing, fetch GRN data
        if (isEdit && grnId) {
          const grn = await getGRNById(grnId);
          setExistingGRN(grn);
          
          // Load PO for this GRN
          const po = await getPurchaseOrderById(grn.purchaseOrderId);
          setSelectedPO(po);
          
          // Set form values
          form.reset({
            purchaseOrderId: grn.purchaseOrderId,
            warehouseId: grn.warehouseId,
            receivedDate: new Date(grn.receivedDate).toISOString().split("T")[0],
            receivedBy: grn.receivedBy || "",
            notes: grn.notes || "",
            attachmentPath: grn.attachmentPath || "",
            attachments: grn.attachments?.map((att) => ({
              filePath: att.filePath,
              fileName: att.fileName,
              fileType: att.fileType,
              fileSize: att.fileSize,
              description: att.description,
              attachmentId: att.attachmentId, // Preserve ID for updates
            })) || [],
            lineItems: grn.lineItems.map((item) => ({
              purchaseOrderLineItemId: item.purchaseOrderLineItemId,
              receivedQuantity: item.receivedQuantity,
              condition: item.condition || "Good",
              notes: item.notes || "",
              grnLineItemId: item.grnLineItemId, // Preserve ID for updates
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
  }, [isEdit, grnId, form, toast]);

  // Load PO line items when PO is selected
  const handlePOChange = async (poId: number) => {
    try {
      const po = await getPurchaseOrderById(poId);
      setSelectedPO(po);

      // Set warehouse if PO has one
      if (po.warehouseId) {
        form.setValue("warehouseId", po.warehouseId);
      }

      // Create GRN line items from PO line items (only pending ones)
      const grnLineItems: CreateGRNLineItemRequest[] = po.lineItems
        .filter((item) => item.pendingQuantity > 0)
        .map((item) => ({
          purchaseOrderLineItemId: item.lineItemId,
          receivedQuantity: 0,
          condition: "Good",
          notes: "",
        }));

      replace(grnLineItems);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load purchase order",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: GRNFormData) => {
    try {
      setSubmitting(true);

      // Validate purchase order
      if (!data.purchaseOrderId || data.purchaseOrderId === 0) {
        toast({
          title: "Error",
          description: "Please select a purchase order",
          variant: "destructive",
        });
        return;
      }

      // Validate warehouse
      if (!data.warehouseId || data.warehouseId === 0) {
        toast({
          title: "Error",
          description: "Please select a warehouse",
          variant: "destructive",
        });
        return;
      }

      // Validate line items
      if (!data.lineItems || data.lineItems.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one line item",
          variant: "destructive",
        });
        return;
      }

      // Validate received quantities
      const validLineItems = data.lineItems.filter((item) => item.receivedQuantity > 0);
      if (validLineItems.length === 0) {
        toast({
          title: "Error",
          description: "Please enter received quantities for at least one item",
          variant: "destructive",
        });
        return;
      }

      // Check if received quantity exceeds pending quantity
      if (selectedPO) {
        for (const grnItem of validLineItems) {
          const poItem = selectedPO.lineItems.find(
            (item) => item.lineItemId === grnItem.purchaseOrderLineItemId
          );
          if (poItem && grnItem.receivedQuantity > poItem.pendingQuantity) {
            toast({
              title: "Error",
              description: `Received quantity (${grnItem.receivedQuantity}) exceeds pending quantity (${poItem.pendingQuantity}) for ${poItem.productName}`,
              variant: "destructive",
            });
            return;
          }
        }
      }

      // Process attachments - upload new files to server first
      const processedAttachments: CreateGRNAttachmentRequest[] = [];
      for (const attachment of data.attachments || []) {
        if (attachment.file) {
          // New file upload - upload to server first
          try {
            const uploadResult = await uploadGRNAttachment(attachment.file);
            if (uploadResult.error || !uploadResult.filePath) {
              toast({
                title: "Error",
                description: uploadResult.error || `Failed to upload file ${attachment.file.name}`,
                variant: "destructive",
              });
              return;
            }
            // Validate filePath is not base64 and is within length limit
            if (!uploadResult.filePath || uploadResult.filePath.length > 500) {
              toast({
                title: "Error",
                description: `Invalid file path returned for ${attachment.file.name}. Please try again.`,
                variant: "destructive",
              });
              return;
            }
            
            // Ensure filePath is not base64 data URL
            if (uploadResult.filePath.startsWith("data:")) {
              toast({
                title: "Error",
                description: `File upload failed for ${attachment.file.name}. Please upload file to server first.`,
                variant: "destructive",
              });
              return;
            }
            
            processedAttachments.push({
              filePath: uploadResult.filePath,
              fileName: uploadResult.fileName || attachment.file.name,
              fileType: uploadResult.fileType || getFileExtension(attachment.file.name),
              fileSize: uploadResult.fileSize || attachment.file.size,
              description: attachment.description,
            });
          } catch (error) {
            toast({
              title: "Error",
              description: error instanceof Error ? error.message : `Failed to upload file ${attachment.file.name}`,
              variant: "destructive",
            });
            return;
          }
        } else if (attachment.filePath) {
          // Existing attachment (from edit mode)
          // Validate filePath is not base64 and is within length limit
          if (attachment.filePath.length > 500) {
            toast({
              title: "Error",
              description: `Invalid file path for attachment. File path is too long.`,
              variant: "destructive",
            });
            return;
          }
          
          // Ensure filePath is not base64 data URL
          if (attachment.filePath.startsWith("data:")) {
            toast({
              title: "Error",
              description: `Invalid file path format. Please re-upload the file.`,
              variant: "destructive",
            });
            return;
          }
          
          processedAttachments.push({
            filePath: attachment.filePath,
            fileName: attachment.fileName,
            fileType: attachment.fileType,
            fileSize: attachment.fileSize,
            description: attachment.description,
          });
        }
      }

      const submitData = {
        ...data,
        lineItems: validLineItems,
        attachments: processedAttachments,
        receivedDate: new Date(data.receivedDate).toISOString(),
      };

      // Save GRN (create or update)
      if (isEdit && grnId) {
        // Update existing GRN
        const updateData: UpdateGRNRequest = {
          warehouseId: data.warehouseId,
          receivedDate: new Date(data.receivedDate).toISOString(),
          receivedBy: data.receivedBy || undefined,
          notes: data.notes || undefined,
          attachmentPath: data.attachmentPath || undefined,
          attachments: processedAttachments.map((att, index) => {
            // Match with existing attachments by index or filePath
            const existingAtt = existingGRN?.attachments?.[index] || 
              existingGRN?.attachments?.find(a => a.filePath === att.filePath);
            return {
              attachmentId: existingAtt?.attachmentId,
              filePath: att.filePath,
              fileName: att.fileName,
              fileType: att.fileType,
              fileSize: att.fileSize,
              description: att.description,
            };
          }),
          lineItems: validLineItems.map((item) => {
            // Find existing line item if editing
            const existingItem = existingGRN?.lineItems.find(
              (li) => li.purchaseOrderLineItemId === item.purchaseOrderLineItemId
            );
            return {
              grnLineItemId: existingItem?.grnLineItemId,
              purchaseOrderLineItemId: item.purchaseOrderLineItemId,
              receivedQuantity: item.receivedQuantity,
              condition: item.condition || "Good",
              notes: item.notes || undefined,
            };
          }),
        };
        
        await updateGRN(grnId, updateData);
        toast({
          title: "Success",
          description: "GRN updated successfully",
        });
      } else {
        // Create new GRN
        await createGRN(submitData);
        toast({
          title: "Success",
          description: "GRN created successfully",
        });
      }

      // Update PO warehouseId if it's different
      if (selectedPO && selectedPO.warehouseId !== data.warehouseId) {
        try {
          await updatePurchaseOrder(data.purchaseOrderId, {
            warehouseId: data.warehouseId,
            notes: selectedPO.notes,
            expectedDeliveryDate: selectedPO.expectedDeliveryDate,
          });
        } catch (error) {
          // Log error but don't fail the GRN save
          console.error("Failed to update PO warehouse:", error);
        }
      }

      navigate("/grn");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create GRN",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getPOItemInfo = (lineItemId: number) => {
    if (!selectedPO) return null;
    return selectedPO.lineItems.find((item) => item.lineItemId === lineItemId);
  };

  const calculateTotal = () => {
    if (!selectedPO) return 0;
    return fields.reduce((sum, field, index) => {
      const receivedQty = form.watch(`lineItems.${index}.receivedQuantity`) || 0;
      const poItem = getPOItemInfo(field.purchaseOrderLineItemId);
      if (poItem) {
        return sum + receivedQty * poItem.unitPrice;
      }
      return sum;
    }, 0);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        appendAttachment({
          file: file,
          filePath: "", // Will be set after upload
          fileName: file.name,
          fileType: getFileExtension(file.name),
          fileSize: file.size,
          description: "",
        });
      });
    }
    // Reset input
    event.target.value = "";
  };


  // Get file extension from filename
  const getFileExtension = (filename: string): string => {
    const parts = filename.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
  };

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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
          <Button variant="ghost" size="sm" onClick={() => navigate("/grn")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isEdit ? "Edit GRN" : "Create GRN"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEdit ? "Update goods received note" : "Record goods received from vendor"}
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Receipt Information</CardTitle>
              <CardDescription>Select purchase order and warehouse</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {purchaseOrders.length === 0 && !loading && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>No purchase orders available.</strong> Please create and approve a purchase order first before creating a GRN.
                  </p>
                </div>
              )}
              
              <FormField
                control={form.control}
                name="purchaseOrderId"
                rules={{
                  required: "Purchase order is required",
                  min: { value: 1, message: "Please select a purchase order" },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Order *</FormLabel>
                    <Select
                      value={field.value && field.value > 0 ? field.value.toString() : undefined}
                      onValueChange={(value) => {
                        if (value !== "no-pos") {
                          field.onChange(parseInt(value));
                          handlePOChange(parseInt(value));
                        }
                      }}
                      disabled={purchaseOrders.length === 0 || isEdit}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            purchaseOrders.length === 0 
                              ? "No purchase orders available" 
                              : "Select purchase order"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {purchaseOrders.length === 0 ? (
                          <SelectItem value="no-pos" disabled>
                            No purchase orders available
                          </SelectItem>
                        ) : (
                          purchaseOrders.map((po) => (
                            <SelectItem key={po.purchaseOrderId} value={po.purchaseOrderId.toString()}>
                              {po.poNumber} - {po.vendorName || "N/A"} ({po.status})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="warehouseId"
                rules={{
                  required: "Warehouse is required",
                  min: { value: 1, message: "Please select a warehouse" },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warehouse *</FormLabel>
                    <Select
                      value={field.value && field.value > 0 ? field.value.toString() : undefined}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem
                            key={warehouse.warehouseId}
                            value={warehouse.warehouseId.toString()}
                          >
                            {warehouse.country ? `${warehouse.country} - ${warehouse.name}` : warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="receivedDate"
                  rules={{ required: "Received date is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Received Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="receivedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Received By</FormLabel>
                      <FormControl>
                        <Input placeholder="Name of person who received" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="GRN notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Proof Attachments</CardTitle>
                  <CardDescription>Upload multiple files as proof (invoices, packing lists, etc.)</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("file-upload-input")?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add Files
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                id="file-upload-input"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                accept="image/*,.pdf,.doc,.docx"
              />

              {attachmentFields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No attachments added. Click "Add Files" to upload proof documents.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attachmentFields.map((field, index) => {
                    const attachment = form.watch(`attachments.${index}`);
                    const fileName = attachment?.fileName || attachment?.file?.name || "Unknown";
                    const fileSize = attachment?.fileSize || attachment?.file?.size;

                    return (
                      <div
                        key={field.id}
                        className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <File className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{fileName}</p>
                            {fileSize && (
                              <p className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</p>
                            )}
                            {attachment?.description && (
                              <p className="text-xs text-muted-foreground mt-1">{attachment.description}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Line Items */}
          {selectedPO && fields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Received Items</CardTitle>
                <CardDescription>
                  Enter received quantities for items from {selectedPO.poNumber}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => {
                  const poItem = getPOItemInfo(field.purchaseOrderLineItemId);
                  if (!poItem) return null;

                  return (
                    <Card key={field.id} className="p-4">
                      <div className="grid grid-cols-12 gap-4 items-start">
                        <div className="col-span-12 md:col-span-4">
                          <div>
                            <p className="font-medium">{poItem.productName || "N/A"}</p>
                            {poItem.productVariantName && (
                              <p className="text-sm text-primary font-medium mt-1">
                                Variant: {poItem.productVariantName}
                                {poItem.productVariantSku && ` (${poItem.productVariantSku})`}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              SKU: {poItem.productVariantSku || poItem.sku || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="col-span-6 md:col-span-2">
                          <FormLabel>Ordered</FormLabel>
                          <div className="mt-2 p-2 bg-secondary rounded-md">
                            {poItem.orderedQuantity}
                          </div>
                        </div>

                        <div className="col-span-6 md:col-span-2">
                          <FormLabel>Already Received</FormLabel>
                          <div className="mt-2 p-2 bg-secondary rounded-md">
                            {poItem.receivedQuantity}
                          </div>
                        </div>

                        <div className="col-span-6 md:col-span-2">
                          <FormLabel>Pending</FormLabel>
                          <div className="mt-2 p-2 bg-yellow-100 rounded-md font-medium">
                            {poItem.pendingQuantity}
                          </div>
                        </div>

                        <div className="col-span-6 md:col-span-2">
                          <FormField
                            control={form.control}
                            name={`lineItems.${index}.receivedQuantity`}
                            rules={{
                              required: "Received quantity is required",
                              min: { value: 1, message: "Must be at least 1" },
                              max: {
                                value: poItem.pendingQuantity,
                                message: `Cannot exceed pending quantity (${poItem.pendingQuantity})`,
                              },
                            }}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Received Qty *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    max={poItem.pendingQuantity}
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <FormField
                          control={form.control}
                          name={`lineItems.${index}.condition`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Condition</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Good">Good</SelectItem>
                                  <SelectItem value="Damaged">Damaged</SelectItem>
                                  <SelectItem value="Partial">Partial</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`lineItems.${index}.notes`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes</FormLabel>
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

                <div className="flex justify-end pt-4 border-t">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Received Value</p>
                    <p className="text-2xl font-bold">${calculateTotal().toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedPO && fields.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No pending items found in this purchase order. All items have been received.
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/grn")}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || fields.length === 0}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEdit ? "Update GRN" : "Create GRN"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
