import jsPDF from "jspdf";
import { PurchaseOrder } from "@/services/purchaseOrders";
import { fileUploadService } from "@/services/fileUpload";
import { loadIBMPlexMonoFont, getFontFamily } from "./fontLoader";

// Helper function to format date
const formatDate = (dateString?: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
};

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Helper function to parse attributes JSON
const parseAttributes = (attributesJson: string | null | undefined): any => {
  if (!attributesJson) return {};
  try {
    return JSON.parse(attributesJson);
  } catch {
    return {};
  }
};

// Helper function to get images from attributes
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
  
  if (attributes.image && typeof attributes.image === 'string') {
    images.push(attributes.image);
  }
  
  return images;
};

// Helper function to get color from attributes
const getColorFromAttributes = (attributes: any): string => {
  // Check for 'color' field (case-insensitive)
  if (attributes.color) {
    return String(attributes.color);
  }
  if (attributes.Color) {
    return String(attributes.Color);
  }
  if (attributes.COLOR) {
    return String(attributes.COLOR);
  }
  
  // Check for nested color in attributes object
  if (attributes.attributes && typeof attributes.attributes === 'object') {
    if (attributes.attributes.color) {
      return String(attributes.attributes.color);
    }
  }
  
  return "";
};

// Helper function to load image from URL
const loadImage = async (url: string): Promise<string | null> => {
  try {
    // Try to get image URL from file upload service if it's a relative path
    if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
      const fullUrl = await fileUploadService.getSignatureUrl(url);
      if (fullUrl) {
        const response = await fetch(fullUrl);
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      }
    }
    
    // Try direct fetch
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error loading image:", error);
    return null;
  }
};

// Resize and compress image for PDF to reduce file size (max dimensions + JPEG quality)
const resizeAndCompressForPdf = (
  dataUrl: string,
  maxWidth: number = 200,
  maxHeight: number = 200,
  jpegQuality: number = 0.65
): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w <= maxWidth && h <= maxHeight) {
          w = img.naturalWidth;
          h = img.naturalHeight;
        } else {
          const r = Math.min(maxWidth / w, maxHeight / h);
          w = Math.round(w * r);
          h = Math.round(h * r);
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        // Fill with white so transparent PNG areas become white in JPEG (JPEG has no transparency; default would be black)
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", jpegQuality));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
};

// Helper function to split long text into multiple lines
const splitText = (text: string, maxWidth: number, doc: jsPDF): string[] => {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = doc.getTextWidth(testLine);

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

// Generate PO PDF
export const generatePOPDF = async (
  po: PurchaseOrder,
  warehouseAddress?: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    phone?: string;
    contactPerson?: string;
  },
  vendorAddress?: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    phone?: string;
    contactPerson?: string;
  },
  approvals?: Array<{
    poApprovalId: number;
    purchaseOrderId: number;
    userId: number;
    userName?: string;
    userEmail?: string;
    status: string;
    comment?: string;
    signatureUrl?: string;
    approvedDate?: string;
    rejectedDate?: string;
    createdDate: string;
  }>
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter", // 8.5 x 11 inches
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  // Load IBM Plex Mono font (matches application font)
  await loadIBMPlexMonoFont(doc);
  const fontFamily = getFontFamily(); // Returns 'IBMPlexMono' or 'courier' as fallback

  // Set font
  doc.setFont(fontFamily);

  // Header Section
  // Title: PURCHASE ORDER (small, left) and YEEZY (right, parallel)
  doc.setFontSize(14); // Smaller font size
  doc.setFont(fontFamily, "bold");
  doc.text("PURCHASE ORDER", margin, yPos + 10);

  // YEEZY on right side, parallel to PURCHASE ORDER
  const yeezyTextWidth = doc.getTextWidth("YEEZY");
  const yeezyX = pageWidth - margin - yeezyTextWidth;
  doc.text("YEEZY", yeezyX, yPos + 10);

  yPos += 20; // Reduced spacing

  // Three Column Layout: SHIP TO, VENDOR, and PO DETAILS (all in one row)
  const columnGap = 3; // Gap between columns to prevent overlap (reduced from 5)
  const colWidth = (contentWidth - (2 * columnGap)) / 3; // Reduced width with gaps
  const col1X = margin; // SHIP TO
  const col2X = margin + colWidth + columnGap; // VENDOR
  const col3X = margin + 2 * colWidth + 2 * columnGap; // PO DETAILS

  // Column 1: SHIP TO (Warehouse)
  doc.setFontSize(10); // Reduced from 12
  doc.setFont(fontFamily, "bold");
  doc.text("SHIP TO:", col1X, yPos);

  doc.setFontSize(9); // Reduced from 10
  doc.setFont(fontFamily, "normal");
  const startY = yPos + 5; // Reduced spacing from 6
  let shipToY = startY;

  if (warehouseAddress) {
    if (warehouseAddress.name) {
      // Wrap long names to prevent overlap
      const nameLines = splitText(warehouseAddress.name, colWidth - 3, doc);
      nameLines.forEach((line) => {
        doc.text(line, col1X, shipToY);
        shipToY += 4; // Reduced from 5
      });
    }
    if (warehouseAddress.address) {
      // Wrap long addresses
      const addressLines = splitText(warehouseAddress.address, colWidth - 3, doc);
      addressLines.forEach((line) => {
        doc.text(line, col1X, shipToY);
        shipToY += 4; // Reduced from 5
      });
    }
    const cityStateZip = [
      warehouseAddress.city,
      warehouseAddress.state,
      warehouseAddress.zipCode,
    ]
      .filter(Boolean)
      .join(", ");
    if (cityStateZip) {
      // Wrap long city/state/zip to prevent overlap
      const cityLines = splitText(cityStateZip, colWidth - 3, doc);
      cityLines.forEach((line) => {
        doc.text(line, col1X, shipToY);
        shipToY += 4; // Reduced from 5
      });
    }
    if (warehouseAddress.phone) {
      // Wrap long phone numbers to prevent overlap
      const phoneLines = splitText(warehouseAddress.phone, colWidth - 3, doc);
      phoneLines.forEach((line) => {
        doc.text(line, col1X, shipToY);
        shipToY += 4; // Reduced from 5
      });
    }
    if (warehouseAddress.contactPerson) {
      // Wrap contact person to prevent overlap
      const contactLines = splitText(`ATTN: ${warehouseAddress.contactPerson}`, colWidth - 3, doc);
      contactLines.forEach((line) => {
        doc.text(line, col1X, shipToY);
        shipToY += 4; // Reduced from 5
      });
    }
  } else if (po.warehouseName) {
    // Wrap warehouse name to prevent overlap
    const warehouseNameLines = splitText(po.warehouseName, colWidth - 3, doc);
    warehouseNameLines.forEach((line) => {
      doc.text(line, col1X, shipToY);
      shipToY += 4; // Reduced from 5
    });
  }

  // Column 2: VENDOR
  doc.setFontSize(10); // Reduced from 12
  doc.setFont(fontFamily, "bold");
  doc.text("VENDOR:", col2X, yPos);

  doc.setFontSize(9); // Reduced from 10
  doc.setFont(fontFamily, "normal");
  let vendorY = startY;

  if (vendorAddress) {
    if (vendorAddress.name) {
      // Wrap long names to prevent overlap
      const nameLines = splitText(vendorAddress.name, colWidth - 3, doc);
      nameLines.forEach((line) => {
        doc.text(line, col2X, vendorY);
        vendorY += 4; // Reduced from 5
      });
    }
    if (vendorAddress.address) {
      // Wrap long addresses
      const addressLines = splitText(vendorAddress.address, colWidth - 3, doc);
      addressLines.forEach((line) => {
        doc.text(line, col2X, vendorY);
        vendorY += 4; // Reduced from 5
      });
    }
    const cityStateZip = [
      vendorAddress.city,
      vendorAddress.state,
      vendorAddress.zipCode,
    ]
      .filter(Boolean)
      .join(",");
    if (cityStateZip) {
      // Wrap long city/state/zip to prevent overlap
      const cityLines = splitText(cityStateZip, colWidth - 3, doc);
      cityLines.forEach((line) => {
        doc.text(line, col2X, vendorY);
        vendorY += 4; // Reduced from 5
      });
    }
    if (vendorAddress.phone) {
      // Wrap long phone numbers to prevent overlap
      const phoneLines = splitText(vendorAddress.phone, colWidth - 3, doc);
      phoneLines.forEach((line) => {
        doc.text(line, col2X, vendorY);
        vendorY += 4; // Reduced from 5
      });
    }
    if (vendorAddress.contactPerson) {
      // Wrap contact person to prevent overlap
      const contactLines = splitText(`ATTN: ${vendorAddress.contactPerson}`, colWidth - 3, doc);
      contactLines.forEach((line) => {
        doc.text(line, col2X, vendorY);
        vendorY += 4; // Reduced from 5
      });
    }
  } else if (po.vendorName) {
    // Wrap vendor name to prevent overlap
    const vendorNameLines = splitText(po.vendorName, colWidth - 3, doc);
    vendorNameLines.forEach((line) => {
      doc.text(line, col2X, vendorY);
      vendorY += 4; // Reduced from 5
    });
  }

  // Column 3: PO DETAILS (DATE, PO NUMBER, PO TOTAL)
  doc.setFontSize(10); // Reduced from 12
  doc.setFont(fontFamily, "bold");
  doc.text("PO DETAILS:", col3X, yPos);

  doc.setFontSize(9); // Reduced from 10
  doc.setFont(fontFamily, "normal");
  let poDetailsY = startY;
  
  // Calculate maximum label width for alignment with reduced spacing
  doc.setFont(fontFamily, "bold");
  const labelSpacing = 3; // Reduced spacing between label and value
  const maxLabelWidth = Math.max(
    doc.getTextWidth("DATE:"),
    doc.getTextWidth("PO NUMBER:"),
    doc.getTextWidth("PO TOTAL:")
  );
  const valueX = col3X + maxLabelWidth + labelSpacing; // Aligned value position

  // DATE
  doc.setFont(fontFamily, "bold");
  doc.text("DATE:", col3X, poDetailsY);
  doc.setFont(fontFamily, "normal");
  const dateText = formatDate(po.poDate) || formatDate(po.createdDate);
  doc.text(dateText, valueX, poDetailsY);
  poDetailsY += 4; // Reduced from 5

  // PO NUMBER
  doc.setFont(fontFamily, "bold");
  doc.text("PO NUMBER:", col3X, poDetailsY);
  doc.setFont(fontFamily, "normal");
  doc.text(po.poNumber, valueX, poDetailsY);
  poDetailsY += 4; // Reduced from 5

  // PO TOTAL (with dollar sign)
  doc.setFont(fontFamily, "bold");
  doc.text("PO TOTAL:", col3X, poDetailsY);
  doc.setFont(fontFamily, "normal");
  doc.text(`$${formatCurrency(po.totalValue)}`, valueX, poDetailsY);

  // Calculate max height of all three sections for proper spacing
  const maxSectionHeight = Math.max(shipToY - yPos, vendorY - yPos, poDetailsY - yPos);
  yPos += maxSectionHeight + 15; // Spacing after all sections

  // Line Items Table
  if (po.lineItems && po.lineItems.length > 0) {
    // Table Header
    const headerHeight = 8;
    const tableStartY = yPos;
    const rowHeight = 15;
    // Column widths - proportional to contentWidth
    const totalColWidth = 205; // Sum of base widths
    const scaleFactor = contentWidth / totalColWidth;
    const baseWidths = [25, 25, 45, 25, 30, 25, 30]; // IMAGE, ITEM, DESCRIPTION, COLOR, UNIT PRICE, QUANTITY, TOTAL
    const colWidths = baseWidths.map(w => w * scaleFactor);
    let tableX = margin;

    doc.setFontSize(10);
    doc.setFont(fontFamily, "bold");
    doc.setFillColor(0, 0, 0);
    // Header bar: 8mm height, starting at tableStartY
    const headerY = tableStartY - headerHeight;
    doc.rect(tableX, headerY, contentWidth, headerHeight, "F");
    doc.setTextColor(255, 255, 255);

    const headers = ["IMAGE", "ITEM", "DESCRIPTION", "COLOR", "UNIT PRICE", "QUANTITY", "TOTAL"];
    // Calculate text Y position to center vertically in header
    const headerTextY = headerY + (headerHeight / 2) + 2; // Center of header bar + small offset for font baseline
    
    // Draw header text and vertical borders
    let headerX = margin;
    headers.forEach((header, index) => {
      const cellWidth = colWidths[index];
      // Center align ITEM header (index 1), left align others
      if (index === 1) {
        const textWidth = doc.getTextWidth(header);
        const textX = headerX + (cellWidth - textWidth) / 2;
        doc.text(header, textX, headerTextY);
      } else {
        // Left align other headers with padding
        doc.text(header, headerX + 3, headerTextY);
      }
      
      // Draw vertical border after each column (except last)
      if (index < headers.length - 1) {
        doc.setDrawColor(0, 0, 0);
        doc.line(headerX + cellWidth, headerY, headerX + cellWidth, headerY + headerHeight);
      }
      
      headerX += cellWidth;
    });

    doc.setTextColor(0, 0, 0);
    doc.setFont(fontFamily, "normal");

    // Table Rows - start after header with proper spacing
    // Fix: Start rows after header ends (tableStartY) with additional spacing to prevent overlap
    let currentY = tableStartY + headerHeight - 2; // Start 2mm after header ends (was tableStartY + 2, causing overlap)
    
    // Draw outer table border (will be completed after all rows)
    doc.setDrawColor(0, 0, 0);
    const tableTopY = headerY;
    
    // Draw header bottom border (top border of table body)
    doc.line(margin, tableStartY, margin + contentWidth, tableStartY);
    
    // Note: Left and right borders will be drawn after all rows to get correct bottom position
    
    // Sort line items product-wise (by productId, then sku) so same product's variants appear together
    const sortedLineItems = [...po.lineItems].sort((a, b) => {
      if (a.productId !== b.productId) return a.productId - b.productId;
      return (a.sku ?? "").localeCompare(b.sku ?? "");
    });

    // Per-product fallback: one image URL per productId from any variant (so every variant row can show an image)
    const productFallbackImageUrls = new Map<number, string>();
    for (const li of sortedLineItems) {
      if (!li.productId || productFallbackImageUrls.has(li.productId)) continue;
      if (li.productVariantAttributes) {
        const imgs = getImagesFromAttributes(parseAttributes(li.productVariantAttributes));
        if (imgs.length > 0) productFallbackImageUrls.set(li.productId, imgs[0]);
      }
    }

    // Cache: productId -> loaded image data URL (so we load each product image once)
    const productImageCache = new Map<number, string>();

    for (let index = 0; index < sortedLineItems.length; index++) {
      const item = sortedLineItems[index];
      
      if (currentY > pageHeight - 40) {
        // New page
        doc.addPage();
        currentY = margin + 10;
        // Redraw table borders on new page
        doc.setDrawColor(0, 0, 0);
        const newPageTableTopY = currentY - rowHeight;
        const remainingRows = sortedLineItems.length - index;
        const newPageTableBottomY = newPageTableTopY + (remainingRows * rowHeight);
        // Draw borders for new page
        doc.line(margin, newPageTableTopY, margin, newPageTableBottomY); // Left border
        doc.line(margin + contentWidth, newPageTableTopY, margin + contentWidth, newPageTableBottomY); // Right border
        doc.line(margin, newPageTableTopY, margin + contentWidth, newPageTableTopY); // Top border
        
        // Draw vertical column borders for header on new page
        let newPageHeaderX = margin;
        colWidths.forEach((cellWidth, colIndex) => {
          if (colIndex < colWidths.length - 1) {
            doc.line(newPageHeaderX + cellWidth, newPageTableTopY, newPageHeaderX + cellWidth, newPageTableTopY + rowHeight);
          }
          newPageHeaderX += cellWidth;
        });
      }

      tableX = margin;
      
      // Get image and color from variant attributes — show image for every variant row
      let itemImage: string | null = null;
      let itemColor: string = "";
      if (item.productVariantAttributes) {
        const variantAttributes = parseAttributes(item.productVariantAttributes);
        itemColor = getColorFromAttributes(variantAttributes);
        const variantImages = getImagesFromAttributes(variantAttributes);
        if (variantImages.length > 0) {
          itemImage = await loadImage(variantImages[0]);
          if (itemImage && item.productId) productImageCache.set(item.productId, itemImage);
        }
      }
      // Fallback: if this variant had no image, use same product's image (load from any variant's URL once, then reuse)
      if (!itemImage && item.productId) {
        itemImage = productImageCache.get(item.productId) ?? null;
        if (!itemImage) {
          const fallbackUrl = productFallbackImageUrls.get(item.productId);
          if (fallbackUrl) {
            itemImage = await loadImage(fallbackUrl);
            if (itemImage) productImageCache.set(item.productId, itemImage);
          }
        }
      }

      const rowData = [
        item.sku || "",
        item.notes || "", // DESCRIPTION shows line item notes
        itemColor, // COLOR from variant attributes
        `$${formatCurrency(item.unitPrice)}`, // UNIT PRICE with dollar sign
        item.orderedQuantity.toString(),
        `$${formatCurrency(item.lineTotal)}`, // TOTAL with dollar sign
      ];

      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, currentY - 6, contentWidth, rowHeight, "F");
      }

      // Draw vertical border after image column
      doc.setDrawColor(0, 0, 0);
      doc.line(margin + colWidths[0], currentY - 6, margin + colWidths[0], currentY - 6 + rowHeight);

      // Draw image in first column — keep inside cell (row height 15mm, column width varies)
      const imageColWidth = colWidths[0];
      const imageSize = Math.min(12, rowHeight - 2, imageColWidth - 2); // Fit inside cell with 1mm margin
      const imageX = tableX + (imageColWidth - imageSize) / 2;
      const imageY = currentY - 6 + (rowHeight - imageSize) / 2; // Vertically centered in row
      
      if (itemImage) {
        try {
          // Resize and compress to JPEG to keep PDF size minimal (max 200x200px, quality 0.65)
          const compressed = await resizeAndCompressForPdf(itemImage, 200, 200, 0.65);
          const imageToAdd = compressed ?? itemImage;
          const imageFormat = imageToAdd.startsWith("data:image/png") ? "PNG" : "JPEG";
          doc.addImage(imageToAdd, imageFormat, imageX, imageY, imageSize, imageSize);
        } catch (error) {
          console.error("Error adding image to PDF:", error);
        }
      }
      
      tableX += colWidths[0]; // Move past image column

      // Draw other columns with vertical borders
      rowData.forEach((data, colIndex) => {
        doc.setFontSize(9);
        const cellWidth = colWidths[colIndex + 1]; // +1 because we already handled image column
        
        // Center align ITEM column (first column in rowData, which is SKU)
        if (colIndex === 0) {
          const textWidth = doc.getTextWidth(data);
          const textX = tableX + (cellWidth - textWidth) / 2;
          doc.text(data, textX, currentY);
        } else {
          // Left align other columns with padding
          doc.text(data, tableX + 3, currentY);
        }
        
        // Draw vertical border after each column (except last)
        if (colIndex < rowData.length - 1) {
          doc.setDrawColor(0, 0, 0);
          doc.line(tableX + cellWidth, currentY - 6, tableX + cellWidth, currentY - 6 + rowHeight);
        }
        
        tableX += cellWidth;
      });

      // Draw horizontal border after each row (except last row - outer border will cover it)
      if (index < sortedLineItems.length - 1) {
        doc.setDrawColor(0, 0, 0);
        const rowBottomY = currentY - 6 + rowHeight;
        doc.line(margin, rowBottomY, margin + contentWidth, rowBottomY);
      }

      currentY += rowHeight;
    }

    // Draw outer table borders (left, right, and bottom) after all rows are drawn
    doc.setDrawColor(0, 0, 0);
    // Last row's bottom edge: currentY has been incremented, so last row bottom is at currentY - 6
    const finalTableBottomY = currentY - 6;
    doc.line(margin, tableTopY, margin, finalTableBottomY); // Left border
    doc.line(margin + contentWidth, tableTopY, margin + contentWidth, finalTableBottomY); // Right border
    doc.line(margin, finalTableBottomY, margin + contentWidth, finalTableBottomY); // Bottom border

    yPos = currentY + 10;
  }

  // Financial Summary Section
  const totalPayments = po.paymentsTotal || 0;
  const deposit = po.payments?.find((p) => p.type === 1)?.amount || 0; // Type 1 = Advance
  const balance = po.paymentBalance || po.totalValue - totalPayments;

  const financialY = yPos;
  const financialTableWidth = 60;
  const financialTableX = pageWidth - margin - financialTableWidth;

  doc.setFontSize(10);
  doc.setFont(fontFamily, "bold");

  // Table borders
  doc.rect(financialTableX, financialY, financialTableWidth, 8, "S");
  doc.rect(financialTableX, financialY + 8, financialTableWidth, 8, "S");
  doc.rect(financialTableX, financialY + 16, financialTableWidth, 8, "S");

  // TOTAL row
  doc.text("TOTAL", financialTableX + 2, financialY + 6);
  doc.setFont(fontFamily, "normal");
  doc.text(`$${formatCurrency(po.totalValue)}`, financialTableX + 35, financialY + 6);

  // DEPOSIT row
  doc.setFont(fontFamily, "bold");
  doc.text("DEPOSIT", financialTableX + 2, financialY + 14);
  doc.setFont(fontFamily, "normal");
  doc.text(`$${formatCurrency(deposit)}`, financialTableX + 35, financialY + 14);

  // BALANCE row
  doc.setFont(fontFamily, "bold");
  doc.text("BALANCE", financialTableX + 2, financialY + 22);
  doc.setFont(fontFamily, "normal");
  doc.text(`$${formatCurrency(balance)}`, financialTableX + 35, financialY + 22);

  yPos = financialY + 35;

  

  // Approval Signatures Section
  doc.setFontSize(12);
  doc.setFont(fontFamily, "bold");
  doc.setFillColor(0, 0, 0);
  doc.rect(margin, yPos, contentWidth, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.text("YEEZY APPROVALS:", margin + 2, yPos + 6);

  doc.setTextColor(0, 0, 0);
  yPos += 15;
// Instructions Section
if (yPos > pageHeight - 60) {
  doc.addPage();
  yPos = margin;
}

doc.setFontSize(9);
doc.setFont(fontFamily, "normal");
doc.text("Approved PO will have 2 approved Signatures Below", margin, yPos);
yPos += 5;
doc.text("PO MUST BE EMAILED TO AP@YEEZY.COM AND HUSSEIN@YEEZY.COM PRIOR TO SUPPLIER", margin, yPos);
yPos += 5;
doc.text("If you have any questions concerning this purchase order contact drtoin@yeezy.com", margin, yPos);

yPos += 15;
  // Helper function to add signature image
  const addSignatureImage = async (signatureUrl: string, x: number, y: number, width: number = 40, height: number = 15) => {
    try {
      if (!signatureUrl) {
        console.warn("No signature URL provided");
        return;
      }

      // Get full URL using fileUploadService
      const fullUrl = fileUploadService.getSignatureUrl(signatureUrl);
      
      // Get auth token for authenticated requests
      const token = localStorage.getItem("auth_token");

      // Load image from URL with authentication
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      return new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          console.warn("Signature image load timeout");
          resolve();
        }, 5000); // 5 second timeout

        img.onload = () => {
          clearTimeout(timeout);
          try {
            doc.addImage(img, "PNG", x, y, width, height);
            console.log("Signature image added successfully");
            resolve();
          } catch (error) {
            console.error("Error adding signature image to PDF:", error);
            resolve();
          }
        };
        
        img.onerror = (error) => {
          clearTimeout(timeout);
          console.error("Error loading signature image:", error, fullUrl);
          // Try loading with fetch and blob if direct image load fails
          fetch(fullUrl, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })
            .then((response) => response.blob())
            .then((blob) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64data = reader.result as string;
                const img2 = new Image();
                img2.onload = () => {
                  try {
                    doc.addImage(img2, "PNG", x, y, width, height);
                    console.log("Signature image added via blob");
                  } catch (err) {
                    console.error("Error adding signature from blob:", err);
                  }
                  resolve();
                };
                img2.onerror = () => resolve();
                img2.src = base64data;
              };
              reader.readAsDataURL(blob);
            })
            .catch(() => resolve());
        };
        
        img.src = fullUrl;
      });
    } catch (error) {
      console.error("Error in addSignatureImage:", error);
    }
  };

  // Approval Signatures - Side by Side (Parallel)
  const signatureSectionWidth = (contentWidth - 10) / 2; // Two signatures side by side with gap
  const signatureHeight = 25;
  const signatureY = yPos;
  
  // First Approval (Left Side)
  const firstSignatureX = margin;
  // Use passed approvals or fallback to po.approvals
  const approvalList = approvals || po.approvals || [];
  
  console.log("Approvals data:", approvalList);
  
  if (approvalList.length > 0) {
    const firstApproval = approvalList[0];
    
    if (firstApproval.signatureUrl) {
      // Add signature image (no X fallback)
      console.log("Adding first signature:", firstApproval.signatureUrl);
      await addSignatureImage(firstApproval.signatureUrl, firstSignatureX, signatureY, 40, 15);
    }
    
    // Signature line
    doc.line(firstSignatureX, signatureY + 15, firstSignatureX + 50, signatureY + 15);
    
    // Name and role
    doc.setFontSize(10);
    doc.setFont(fontFamily, "normal");
    if (firstApproval.userName) {
      doc.text(firstApproval.userName, firstSignatureX, signatureY + 18); // Increased spacing slightly
    }
    doc.text("CFO", firstSignatureX, signatureY + 22); // Increased spacing slightly
  } else {
    // Placeholder - just line, no X
    doc.line(firstSignatureX, signatureY + 15, firstSignatureX + 50, signatureY + 15);
    doc.setFontSize(10);
    doc.setFont(fontFamily, "normal");
    doc.text("CFO", firstSignatureX, signatureY + 22); // Increased spacing slightly
  }

  // Second Approval (Right Side)
  const secondSignatureX = margin + signatureSectionWidth + 10;
  if (approvalList.length > 1) {
    const secondApproval = approvalList[1];
    
    console.log("Second approval:", secondApproval);
    
    if (secondApproval.signatureUrl) {
      // Add signature image (no X fallback)
      console.log("Adding second signature:", secondApproval.signatureUrl);
      await addSignatureImage(secondApproval.signatureUrl, secondSignatureX, signatureY, 40, 15);
    } else {
      console.log("No signature URL for second approval");
    }
    
    // Signature line
    doc.line(secondSignatureX, signatureY + 15, secondSignatureX + 50, signatureY + 15);
    
    // Name and role
    doc.setFontSize(10);
    doc.setFont(fontFamily, "normal");
    doc.text("DIRECTOR", secondSignatureX, signatureY + 22); // Increased spacing slightly, removed SECOND APPROVAL text
  } else {
    // Placeholder - just line, no X
    doc.line(secondSignatureX, signatureY + 15, secondSignatureX + 50, signatureY + 15);
    doc.setFontSize(10);
    doc.setFont(fontFamily, "normal");
    doc.text("DIRECTOR", secondSignatureX, signatureY + 22); // Removed SECOND APPROVAL text, increased spacing slightly
  }

  // Footer Bar
  const footerY = pageHeight - 10;
  doc.setFillColor(0, 0, 0);
  doc.rect(margin, footerY, contentWidth, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont(fontFamily, "normal");

  const footerText = [
    `ORDER PLACED BY: ${po.createdByName || "YEEZY"}`,
    `SHIP DATE: ${formatDate(po.expectedDeliveryDate) || "TBD"}`,
    `SHIP VIA: ${po.deliveryTerm || "TBD"}`,
  ].join(" | ");

  doc.text(footerText, margin + 2, footerY + 6);

  // Check if there's any content to show
  const hasNotes = po.notes && po.notes.trim() !== "";
  const hasDeliveryTerm = po.deliveryTerm && po.deliveryTerm.trim() !== "";
  const hasPacking = po.packing && po.packing.trim() !== "";

  // Only add new page if there's content to show
  if (hasNotes || hasDeliveryTerm || hasPacking) {
    // Add new page for Notes, Delivery Term, and Packing
    doc.addPage();
    // Reset text color to black after page break (footer might have set it to white)
    doc.setTextColor(0, 0, 0);
    let notesY = margin + 10;

    // Helper function to add text section with page breaks
    const addTextSection = (title: string, content: string | null | undefined, startY: number): number => {
      if (!content || content.trim() === "") {
        return startY;
      }

      let currentY = startY;

      // Check if we need a new page
      if (currentY > pageHeight - 40) {
        doc.addPage();
        // Reset text color to black after page break
        doc.setTextColor(0, 0, 0);
        currentY = margin + 10;
      }

      // Section Title
      doc.setFontSize(12);
      doc.setFont(fontFamily, "bold");
      doc.setTextColor(0, 0, 0); // Ensure black text color
      doc.text(title, margin, currentY);
      currentY += 8;

      // Section Content
      doc.setFontSize(9);
      doc.setFont(fontFamily, "normal");
      doc.setTextColor(0, 0, 0); // Ensure black text color
      
      // Split content by newlines first, then by width
      const paragraphs = content.split('\n');
      const allLines: string[] = [];
      
      for (const paragraph of paragraphs) {
        if (paragraph.trim() === "") {
          // Empty line - add spacing
          allLines.push("");
        } else {
          // Split long paragraphs by width
          const wrappedLines = splitText(paragraph.trim(), contentWidth, doc);
          allLines.push(...wrappedLines);
        }
      }
      
      for (const line of allLines) {
        // Check if we need a new page
        if (currentY > pageHeight - 20) {
          doc.addPage();
          // Reset text color to black after page break
          doc.setTextColor(0, 0, 0);
          currentY = margin + 10;
        }
        
        if (line === "") {
          // Empty line - just add spacing
          currentY += 3;
        } else {
          doc.text(line, margin, currentY);
          currentY += 5;
        }
      }

      // Add spacing after section
      currentY += 10;
      return currentY;
    };

    // 1. PO Notes (first)
    if (hasNotes) {
      notesY = addTextSection("PO NOTES", po.notes, notesY);
    }

    // 2. Delivery Term (second)
    if (hasDeliveryTerm) {
      notesY = addTextSection("DELIVERY TERM", po.deliveryTerm, notesY);
    }

    // 3. Packing (third)
    if (hasPacking) {
      notesY = addTextSection("PACKING", po.packing, notesY);
    }
  }

  // Return PDF as blob
  return doc.output('blob');
};

// Helper function to generate and save PDF (for manual generation)
export const generateAndSavePOPDF = async (
  po: PurchaseOrder,
  warehouseAddress?: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    phone?: string;
    contactPerson?: string;
  },
  vendorAddress?: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    phone?: string;
    contactPerson?: string;
  },
  approvals?: Array<{
    poApprovalId: number;
    purchaseOrderId: number;
    userId: number;
    userName?: string;
    userEmail?: string;
    status: string;
    comment?: string;
    signatureUrl?: string;
    approvedDate?: string;
    rejectedDate?: string;
    createdDate: string;
  }>
) => {
  const blob = await generatePOPDF(po, warehouseAddress, vendorAddress, approvals);
  // Convert blob to file and trigger download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `PO-${po.poNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
