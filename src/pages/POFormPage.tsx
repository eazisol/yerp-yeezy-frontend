import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem as BaseFormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2 } from "lucide-react";
import {
  CreatePurchaseOrderRequest,
  CreatePurchaseOrderLineItemRequest,
  CreatePOPaymentRequest,
  UpdatePurchaseOrderRequest,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
} from "@/services/purchaseOrders";
import { vendorService, Vendor } from "@/services/vendors";
import { warehouseService, Warehouse } from "@/services/warehouses";
import { productService, Product, ProductVariant } from "@/services/products";
import { getTerms, Term } from "@/services/terms";
import { useToast } from "@/hooks/use-toast";
import { ProductCombobox } from "@/components/ProductCombobox";
import { generatePOPDF } from "@/utils/generatePOPDF";
import { fileUploadService } from "@/services/fileUpload";

// Custom FormItem component without space-y-2 for PO form
const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <BaseFormItem ref={ref} className={cn("space-y-0", className)} {...props} />;
  }
);
FormItem.displayName = "FormItem";

export default function POFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id && id !== "new";
  const poId = id && isEdit ? parseInt(id) : 0;

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  // Store variants for each line item (index -> variants array)
  const [lineItemVariants, setLineItemVariants] = useState<Record<number, ProductVariant[]>>({});
  // Store loading state for variant fetching
  const [loadingVariants, setLoadingVariants] = useState<Record<number, boolean>>({});
  // Store product details for each line item (for price lookup)
  const [lineItemProducts, setLineItemProducts] = useState<Record<number, Product>>({});

  // Default notes text for new POs
  const defaultNotesText = `STANDARD POLICIES & NOTES

1. Intellectual Property & Confidentiality
   • All designs, materials, and product specifications provided by YEEZY remain the exclusive property of YEEZY.
   • Vendors are strictly prohibited from reproducing, selling, or sharing YEEZY designs with any third party.
   • Violation will result in immediate termination and legal action.

2. Production & Quality Standards
   • All products must meet YEEZY's AQL 2.0 (Acceptable Quality Level) standards.
   • Third-party inspections (SGS, Bureau Veritas, or YEEZY-approved inspectors) are mandatory before shipment.
   • No substitutions in materials or construction without prior written approval from YEEZY.

3. Shipping & Packaging
   • Shipments must be on time - delays require 72-hour notice.
   • Packaging must comply with YEEZY sustainability guidelines (no excess plastic, recyclable materials preferred).

4. Compliance & Ethics
   • Vendors must comply with YEEZY's Code of Conduct (fair labor, no child labor, safe working conditions).
   • Failure to comply will result in contract termination.

Vendor Acknowledgment

By submitting this invoice, the vendor confirms:
☐ Compliance with all YEEZY policies.
☐ Products meet AQL 2.0 standards.
☐ No unauthorized use of YEEZY IP.`;

  // Default delivery term text for new POs
  const defaultDeliveryTermText = `Ticketing & Packaging

Apparel
• All apparel must be individually packaged in single packs, flat packed in a protective polybag, and sealed. (See Appendix A for example)
• Apparel may not be packed on hangers or with multiple units packed together in one bag or prepack, unless instructed otherwise.
• All packaged apparel must include a barcode sticker, placed at the lower right-hand corner of the polybag. (See Appendix A for example)

Headwear
• All caps are to be crown folded.
• White caps must be individually packaged in protective polybags.
• All other colors of caps are to be sleeve packed by dozen.
• Barcode sticker for caps is to be placed on the inner visor of the cap.
• Beanies must be individually polybagged and have a barcode sticker applied in the lower right-hand corner.

Accessories
• Accessories must be individually polybagged and have a barcode sticker applied in the lower right-hand corner.

Barcodes
• Labels must include SKU number, product name, color, size, and UPC-A barcode unless otherwise specified.
• (See Appendix A for Example layout and placement)`;

  // Default packing text for new POs
  const defaultPackingText = `Packing

Shipment Preparations:
• Each Purchase Order (PO) must be packed and identified separately.
• No single carton is allowed to contain multiple purchase orders.
• All merchandise must be packed in corrugated boxes.
• Individual cartons should not weigh more than 50 lbs.
• All boxes must have a minimum test of 250 pounds per square inch.
• Preferred carton dimensions: 24" L x 14" W x 14" H.
• Minimum carton dimensions: 12" L x 12" W x 12" H.
• All cartons must include chipboards at the top and bottom to prevent slitting garments when opening a box.
• Metal staples are prohibited.
• Headwear should be packed using inner cartons (refer to Appendix C for an example).
• Styles must be packed individually by size and color; mixing styles is not allowed.
• If multiple sizes are packed together, they must be layered and separated with paper or cardboard, and cartons must be marked accordingly.
• Any mixed cartons should be the last items in the lot.

Carton Markings:
• All cartons must be visibly marked on both the long and short ends.
• Each carton must be accompanied by a packing list detailing all styles and quantities.
• The markings and packing list should include:
  - Style Number
  - Style Name
  - Color
  - Size
  - Quantity
  - Barcode sticker(s) for the SKU packed inside (refer to Appendix B for an example).

Pallet Preparations:
• All cartons should be stacked with their faces towards the outside of the cube.
• The Packing List must be clearly visible to facilitate easy identification.
• Cartons are not allowed to hang over any edge of the pallet.
• The total weight of the pallet must not exceed the carton crush weight.
• Pallets must be shrink-wrapped to secure the cartons.

Packing List:
• A completed Packing List is mandatory for all cartons in a shipment.
• Each PO must have its own Packing List.
• The Packing List must be clearly visible on the outside of the lead carton, enclosed in a clear plastic envelope.
• The contents of the Packing List should match the markings on the outside of the cartons, including:
  - Brand Name
  - PO Number
  - Style Number
  - Color
  - Carton Number
  - Total Number of Units (specified as 1 SKU per box)
  - Carton label on the outside of the box with the UPC of the SKU packed inside.`;

  const form = useForm<CreatePurchaseOrderRequest>({
    defaultValues: {
      poNumber: "",
      status: "Draft",
      paymentStatus: "Pending",
      vendorId: 0,
      warehouseId: undefined,
      notes: defaultNotesText,
      deliveryTerm: defaultDeliveryTermText,
      remarks: "",
      specification: "",
      packing: defaultPackingText,
      others: "",
      miscAmount: 0,
      poDate: new Date().toISOString().split("T")[0],
      termId: undefined,
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
      payments: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  const { fields: paymentFields, append: appendPayment, remove: removePayment } = useFieldArray({
    control: form.control,
    name: "payments",
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

        // Fetch terms (active only)
        const termsData = await getTerms(true);
        setTerms(termsData);

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
          
          // Map payments data
          const paymentsData = (po.payments || []).map((payment) => ({
            amount: payment.amount,
            type: payment.type,
            paymentDate: payment.paymentDate
              ? new Date(payment.paymentDate).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
            notes: payment.notes || "",
          }));
          
          form.reset({
            poNumber: po.poNumber || "",
            status: po.status || "Draft",
            vendorId: po.vendorId,
            warehouseId: po.warehouseId || undefined,
            notes: po.notes || "",
            deliveryTerm: po.deliveryTerm || "",
            remarks: po.remarks || "",
            specification: po.specification || "",
            packing: po.packing || "",
            others: po.others || "",
            miscAmount: po.miscAmount || 0,
            poDate: po.poDate
              ? new Date(po.poDate).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
            termId: po.termId || undefined,
            expectedDeliveryDate: po.expectedDeliveryDate
              ? new Date(po.expectedDeliveryDate).toISOString().split("T")[0]
              : "",
            lineItems: lineItemsData,
            payments: paymentsData,
            paymentStatus: po.paymentStatus || "Pending",
          });

          // Fetch variants and product details for each line item in edit mode
          const variantsMap: Record<number, ProductVariant[]> = {};
          const productsMap: Record<number, Product> = {};
          for (let i = 0; i < lineItemsData.length; i++) {
            const item = lineItemsData[i];
            if (item.productId > 0) {
              try {
                const productDetail = await productService.getProductById(item.productId);
                variantsMap[i] = productDetail.variants || [];
                // Store product for price lookup
                productsMap[i] = {
                  productId: productDetail.productId,
                  swellProductId: productDetail.swellProductId,
                  sku: productDetail.sku,
                  name: productDetail.name,
                  description: productDetail.description,
                  price: productDetail.price,
                  comparePrice: productDetail.comparePrice,
                  currency: productDetail.currency,
                  status: productDetail.status,
                  type: productDetail.type,
                  isActive: productDetail.isActive,
                  origin: productDetail.origin,
                  category: productDetail.category,
                  createdDate: productDetail.createdDate,
                  editDate: productDetail.editDate,
                  totalStock: productDetail.inventory?.totalStock || 0,
                  availableStock: productDetail.inventory?.availableStock || 0,
                  reservedStock: productDetail.inventory?.reservedStock || 0,
                  cnStock: productDetail.warehouseInventories?.find(w => w.warehouseCode === "CN")?.availableStock || 0,
                  usStock: productDetail.warehouseInventories?.find(w => w.warehouseCode === "US")?.availableStock || 0,
                };
              } catch (error) {
                console.error(`Failed to load variants for product ${item.productId}:`, error);
                variantsMap[i] = [];
              }
            }
          }
          setLineItemVariants(variantsMap);
          setLineItemProducts(productsMap);
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

      // Filter out invalid payments (amount > 0)
      const validPayments = (data.payments || []).filter(
        (payment) => payment.amount > 0 && payment.type >= 1 && payment.type <= 2
      );

      const submitData = {
        ...data,
        lineItems: validLineItems,
        payments: validPayments.length > 0 ? validPayments : undefined,
        warehouseId: data.warehouseId || undefined,
      };

      let createdOrUpdatedPO;
      if (isEdit && poId) {
        createdOrUpdatedPO = await updatePurchaseOrder(poId, submitData as UpdatePurchaseOrderRequest);
        toast({
          title: "Success",
          description: "Purchase order updated successfully",
        });
      } else {
        createdOrUpdatedPO = await createPurchaseOrder(submitData);
        toast({
          title: "Success",
          description: "Purchase order created successfully",
        });
      }

      // Generate and upload PDF after PO create/update
      if (createdOrUpdatedPO) {
        try {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/72465c75-c7de-4a12-980e-add15152ec70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'POFormPage.tsx:413',message:'Starting PDF generation and upload',data:{poId:createdOrUpdatedPO.purchaseOrderId,poNumber:createdOrUpdatedPO.poNumber,hasWarehouse:!!createdOrUpdatedPO.warehouseId,hasVendor:!!createdOrUpdatedPO.vendorId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion

          // Fetch warehouse and vendor data for PDF
          const warehouse = warehouses.find(w => w.warehouseId === createdOrUpdatedPO.warehouseId);
          const vendor = vendors.find(v => v.vendorId === createdOrUpdatedPO.vendorId);
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/72465c75-c7de-4a12-980e-add15152ec70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'POFormPage.tsx:418',message:'Warehouse and vendor data fetched',data:{warehouseFound:!!warehouse,vendorFound:!!vendor,warehouseId:createdOrUpdatedPO.warehouseId,vendorId:createdOrUpdatedPO.vendorId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          
          // Fetch approvals if available
          const approvals = createdOrUpdatedPO.approvals || [];

          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/72465c75-c7de-4a12-980e-add15152ec70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'POFormPage.tsx:423',message:'Calling generatePOPDF',data:{poId:createdOrUpdatedPO.purchaseOrderId,approvalsCount:approvals.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion

          // Generate PDF blob
          const pdfBlob = await generatePOPDF(
            createdOrUpdatedPO,
            warehouse ? {
              name: warehouse.name,
              address: warehouse.address || undefined,
              city: warehouse.city || undefined,
              state: warehouse.state || undefined,
              zipCode: warehouse.zipCode || undefined,
              country: warehouse.country || undefined,
              phone: warehouse.contactPhone1 || undefined,
              contactPerson: warehouse.contactPerson1 || undefined,
            } : undefined,
            vendor ? {
              name: vendor.name,
              address: vendor.address || undefined,
              city: vendor.city || undefined,
              state: vendor.state || undefined,
              zipCode: vendor.zipCode || undefined,
              country: vendor.country || undefined,
              phone: vendor.phone || undefined,
              contactPerson: vendor.contactPerson || vendor.attention || undefined,
            } : undefined,
            approvals
          );

          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/72465c75-c7de-4a12-980e-add15152ec70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'POFormPage.tsx:449',message:'PDF blob generated',data:{blobSize:pdfBlob.size,blobType:pdfBlob.type,poNumber:createdOrUpdatedPO.poNumber},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion

          // Convert blob to File
          const pdfFile = new File([pdfBlob], `PO-${createdOrUpdatedPO.poNumber}.pdf`, { type: 'application/pdf' });

          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/72465c75-c7de-4a12-980e-add15152ec70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'POFormPage.tsx:452',message:'Calling uploadPOPDF',data:{fileName:pdfFile.name,fileSize:pdfFile.size,fileType:pdfFile.type,poId:createdOrUpdatedPO.purchaseOrderId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion

          // Upload PDF to backend
          const uploadResult = await fileUploadService.uploadPOPDF(pdfFile, createdOrUpdatedPO.purchaseOrderId);
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/72465c75-c7de-4a12-980e-add15152ec70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'POFormPage.tsx:455',message:'PDF upload completed',data:{uploadResult,poId:createdOrUpdatedPO.purchaseOrderId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
          // #endregion
          
          console.log("PO PDF generated and uploaded successfully", uploadResult);
        } catch (pdfError) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/72465c75-c7de-4a12-980e-add15152ec70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'POFormPage.tsx:457',message:'PDF generation/upload error',data:{error:String(pdfError),errorMessage:pdfError instanceof Error ? pdfError.message : 'Unknown error',poId:createdOrUpdatedPO.purchaseOrderId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
          // #endregion
          // Log error but don't block navigation
          console.error("Error generating/uploading PO PDF:", pdfError);
          toast({
            title: "Warning",
            description: `PO saved successfully, but PDF generation failed: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`,
            variant: "default",
          });
        }
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

  const addPayment = () => {
    appendPayment({
      amount: 0,
      type: 1, // Default to Advance
      paymentDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
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
      // Clear product from cache
      setLineItemProducts((prev) => {
        const updated = { ...prev };
        delete updated[lineItemIndex];
        return updated;
      });
      // Clear variant selection
      form.setValue(`lineItems.${lineItemIndex}.productVariantId`, undefined);
      form.setValue(`lineItems.${lineItemIndex}.unitPrice`, 0);
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

      // Store product for price lookup
      setLineItemProducts((prev) => ({
        ...prev,
        [lineItemIndex]: {
          productId: productDetail.productId,
          swellProductId: productDetail.swellProductId,
          sku: productDetail.sku,
          name: productDetail.name,
          description: productDetail.description,
          price: productDetail.price,
          comparePrice: productDetail.comparePrice,
          currency: productDetail.currency,
          status: productDetail.status,
          type: productDetail.type,
          isActive: productDetail.isActive,
          origin: productDetail.origin,
          category: productDetail.category,
          createdDate: productDetail.createdDate,
          editDate: productDetail.editDate,
          totalStock: productDetail.inventory?.totalStock || 0,
          availableStock: productDetail.inventory?.availableStock || 0,
          reservedStock: productDetail.inventory?.reservedStock || 0,
          cnStock: productDetail.warehouseInventories?.find(w => w.warehouseCode === "CN")?.availableStock || 0,
          usStock: productDetail.warehouseInventories?.find(w => w.warehouseCode === "US")?.availableStock || 0,
        },
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
      setLineItemProducts((prev) => {
        const updated = { ...prev };
        delete updated[lineItemIndex];
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
      const product = lineItemProducts[lineItemIndex];
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
      const product = lineItemProducts[lineItemIndex];
      const variantPrice = selectedVariant.price;
      const productPrice = product?.price || 0;

      // Prefer variant price, fallback to product price
      form.setValue(
        `lineItems.${lineItemIndex}.unitPrice`,
        variantPrice !== null && variantPrice !== undefined ? variantPrice : productPrice
      );
    }
  };

  // Get variant display name - only show Color and Size
  const getVariantDisplayName = (variant: ProductVariant): string => {
    const attrParts: string[] = [];
    
    // Try to parse attributes JSON to show only size and color
    if (variant.attributes) {
      try {
        const attrs = JSON.parse(variant.attributes);
        // Only add Color if it exists
        if (attrs.color) {
          attrParts.push(`Color: ${attrs.color}`);
        }
        // Only add Size if it exists
        if (attrs.size) {
          attrParts.push(`Size: ${attrs.size}`);
        }
      } catch {
        // If JSON parsing fails, continue with fallback
      }
    }
    
    // If we have color or size, use them; otherwise fallback to name or SKU
    if (attrParts.length > 0) {
      return attrParts.join(", ");
    }
    
    // Fallback to variant name, SKU, or variant ID
    return variant.name || variant.sku || `Variant ${variant.variantId}`;
  };

  const calculateLineTotal = (index: number) => {
    const quantity = form.watch(`lineItems.${index}.orderedQuantity`) || 0;
    const unitPrice = form.watch(`lineItems.${index}.unitPrice`) || 0;
    return quantity * unitPrice;
  };

  const calculateTotal = () => {
    const lineItemsTotal = fields.reduce((sum, _, index) => {
      return sum + calculateLineTotal(index);
    }, 0);
    const miscAmount = form.watch("miscAmount") || 0;
    return lineItemsTotal + miscAmount;
  };

  const calculatePaymentsTotal = () => {
    return paymentFields.reduce((sum, _, index) => {
      const amount = form.watch(`payments.${index}.amount`) || 0;
      return sum + amount;
    }, 0);
  };

  const calculatePaymentBalance = () => {
    return calculateTotal() - calculatePaymentsTotal();
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
          <div>
        <h1 className="text-2xl font-bold text-foreground">
              {isEdit ? "Edit Purchase Order" : "Create Purchase Order"}
            </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information - 2 Column Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="poNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PO Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Auto-generated if empty" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <FormField
                control={form.control}
                name="vendorId"
                rules={{ required: "Vendor is required", min: { value: 1, message: "Please select a vendor" } }}
                render={({ field }) => (
                  <FormItem>
                      <FormLabel>Vendor <span className="text-red-500">*</span></FormLabel>
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
                      <FormLabel>Warehouse</FormLabel>
                    <Select
                      value={field.value?.toString() || "none"}
                      onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None (Set at dispatch)</SelectItem>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.warehouseId} value={warehouse.warehouseId.toString()}>
                            {warehouse.country ? `${warehouse.country} - ${warehouse.name}` : warehouse.name}
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
                  name="poDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PO Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <FormField
                control={form.control}
                name="expectedDeliveryDate"
                  rules={{ required: "Expected Delivery Date is required" }}
                render={({ field }) => (
                  <FormItem>
                      <FormLabel>Expected Delivery Date <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                  name="termId"
                render={({ field }) => (
                  <FormItem>
                      <FormLabel>Term</FormLabel>
                      <Select
                        value={field.value?.toString() || "none"}
                        onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))}
                      >
                    <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select term" />
                          </SelectTrigger>
                    </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {terms.map((term) => (
                            <SelectItem key={term.termId} value={term.termId.toString()}>
                              {term.term}
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
                  name="miscAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Misc Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PO Status</FormLabel>
                      <Select value={field.value || "Draft"} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="PendingApproval">Pending Approval</SelectItem>
                          <SelectItem value="Approved">Approved</SelectItem>
                          <SelectItem value="Released">Released</SelectItem>
                          <SelectItem value="VendorAccepted">Vendor Accepted</SelectItem>
                          <SelectItem value="PartiallyReceived">Partially Received</SelectItem>
                          <SelectItem value="FullyReceived">Fully Received</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                          <SelectItem value="VendorRejected">Vendor Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Line Items</CardTitle>
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
                              <FormLabel>Product <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <ProductCombobox
                                  value={field.value && field.value > 0 ? field.value : undefined}
                                  onSelect={(productId) => {
                                    field.onChange(productId);
                                    handleProductChange(productId, index);
                                  }}
                                  placeholder="Search products..."
                                  vendorId={form.watch("vendorId") && form.watch("vendorId") > 0 ? form.watch("vendorId") : undefined}
                                />
                              </FormControl>
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
                                  Variant {variants.length > 0 ? <span className="text-red-500">*</span> : ""}
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
                              <FormLabel>Quantity <span className="text-red-500">*</span></FormLabel>
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
                              <FormLabel>Unit Price <span className="text-red-500">*</span></FormLabel>
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

                      <div className="col-span-12 md:col-span-2">
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

                      <div className="col-span-6 md:col-span-1 flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            remove(index);
                            // Clean up variants and product state for removed item
                            setLineItemVariants((prev) => {
                              const updated = { ...prev };
                              delete updated[index];
                              return updated;
                            });
                            setLineItemProducts((prev) => {
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

          {/* Financial Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Financial</CardTitle>
                </div>
                <Button type="button" onClick={addPayment} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentFields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="grid grid-cols-12 gap-4 items-start">
                    <div className="col-span-12 md:col-span-3">
                      <FormField
                        control={form.control}
                        name={`payments.${index}.amount`}
                        rules={{
                          required: "Amount is required",
                          min: { value: 0.01, message: "Amount must be greater than 0" },
                        }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-3">
                      <FormField
                        control={form.control}
                        name={`payments.${index}.type`}
                        rules={{
                          required: "Type is required",
                        }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type <span className="text-red-500">*</span></FormLabel>
                            <Select
                              value={field.value?.toString() || "1"}
                              onValueChange={(value) => field.onChange(parseInt(value))}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">Advance</SelectItem>
                                <SelectItem value="2">Normal Payment</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-3">
                      <FormField
                        control={form.control}
                        name={`payments.${index}.paymentDate`}
                        rules={{
                          required: "Payment date is required",
                        }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Date <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-2">
                      <FormField
                        control={form.control}
                        name={`payments.${index}.notes`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Input placeholder="Notes (optional)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePayment(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    </div>
                  </Card>
              ))}

              {paymentFields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No payments added. Click "Add Payment" to add payment entries.
                </div>
              )}

              {paymentFields.length > 0 && (
                <div className="flex justify-between items-end pt-4 border-t gap-6">
                  <div className="w-full md:w-auto">
                    <FormField
                      control={form.control}
                      name="paymentStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Status</FormLabel>
                          <Select value={field.value || "Pending"} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="w-full md:w-[200px]">
                                <SelectValue placeholder="Select payment status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Partial">Partial</SelectItem>
                              <SelectItem value="Paid">Paid</SelectItem>
                              <SelectItem value="Overdue">Overdue</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex gap-6">
                  <div className="text-right">
                      <p className="text-sm text-muted-foreground">Payments Total</p>
                      <p className="text-xl font-bold">${calculatePaymentsTotal().toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className={`text-xl font-bold ${calculatePaymentBalance() < 0 ? 'text-red-500' : calculatePaymentBalance() > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                        ${calculatePaymentBalance().toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Status - Show when no payments */}
              {paymentFields.length === 0 && (
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="paymentStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Status</FormLabel>
                          <Select value={field.value || "Pending"} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Partial">Partial</SelectItem>
                              <SelectItem value="Paid">Paid</SelectItem>
                              <SelectItem value="Overdue">Overdue</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea rows={2} placeholder="Internal notes..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Textarea rows={2} placeholder="Remarks..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}

                <FormField
                  control={form.control}
                  name="deliveryTerm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Term</FormLabel>
                      <FormControl>
                        <Textarea rows={2} placeholder="Delivery term..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* <FormField
                  control={form.control}
                  name="specification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specification</FormLabel>
                      <FormControl>
                        <Textarea rows={2} placeholder="Specification details..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}

                <FormField
                  control={form.control}
                  name="packing"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Packing</FormLabel>
                      <FormControl>
                        <Textarea rows={2} placeholder="Packing details..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="others"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Others</FormLabel>
                      <FormControl>
                        <Textarea rows={2} placeholder="Other details..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
