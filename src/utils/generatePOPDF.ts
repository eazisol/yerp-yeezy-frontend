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
  const colWidth = contentWidth / 3;
  const col1X = margin; // SHIP TO
  const col2X = margin + colWidth; // VENDOR
  const col3X = margin + 2 * colWidth; // PO DETAILS

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
      doc.text(warehouseAddress.name, col1X, shipToY);
      shipToY += 4; // Reduced from 5
    }
    if (warehouseAddress.address) {
      // Wrap long addresses
      const addressLines = splitText(warehouseAddress.address, colWidth - 5, doc);
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
      doc.text(cityStateZip, col1X, shipToY);
      shipToY += 4; // Reduced from 5
    }
    if (warehouseAddress.phone) {
      doc.text(warehouseAddress.phone, col1X, shipToY);
      shipToY += 4; // Reduced from 5
    }
    if (warehouseAddress.contactPerson) {
      doc.text(`ATTN: ${warehouseAddress.contactPerson}`, col1X, shipToY);
    }
  } else if (po.warehouseName) {
    doc.text(po.warehouseName, col1X, shipToY);
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
      doc.text(vendorAddress.name, col2X, vendorY);
      vendorY += 4; // Reduced from 5
    }
    if (vendorAddress.address) {
      // Wrap long addresses
      const addressLines = splitText(vendorAddress.address, colWidth - 5, doc);
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
      doc.text(cityStateZip, col2X, vendorY);
      vendorY += 4; // Reduced from 5
    }
    if (vendorAddress.phone) {
      doc.text(vendorAddress.phone, col2X, vendorY);
      vendorY += 4; // Reduced from 5
    }
    if (vendorAddress.contactPerson) {
      doc.text(`ATTN: ${vendorAddress.contactPerson}`, col2X, vendorY);
    }
  } else if (po.vendorName) {
    doc.text(po.vendorName, col2X, vendorY);
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
  yPos += maxSectionHeight + 10; // Spacing after all sections

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
    headers.forEach((header, index) => {
      const cellWidth = colWidths[index];
      // Center align ITEM header (index 1), left align others
      if (index === 1) {
        const textWidth = doc.getTextWidth(header);
        const textX = tableX + (cellWidth - textWidth) / 2;
        doc.text(header, textX, headerTextY);
      } else {
        // Left align other headers with padding
        doc.text(header, tableX + 3, headerTextY);
      }
      tableX += cellWidth;
    });

    doc.setTextColor(0, 0, 0);
    doc.setFont(fontFamily, "normal");

    // Table Rows - start after header with proper spacing
    // Fix: Start rows after header ends (tableStartY) with additional spacing to prevent overlap
    let currentY = tableStartY + headerHeight + 2; // Start 2mm after header ends (was tableStartY + 2, causing overlap)
    for (let index = 0; index < po.lineItems.length; index++) {
      const item = po.lineItems[index];
      
      if (currentY > pageHeight - 40) {
        // New page
        doc.addPage();
        currentY = margin + 10;
      }

      tableX = margin;
      
      // Get image and color from variant attributes
      let itemImage: string | null = null;
      let itemColor: string = "";
      if (item.productVariantAttributes) {
        const variantAttributes = parseAttributes(item.productVariantAttributes);
        const variantImages = getImagesFromAttributes(variantAttributes);
        if (variantImages.length > 0) {
          itemImage = await loadImage(variantImages[0]);
        }
        itemColor = getColorFromAttributes(variantAttributes);
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

      // Draw image in first column
      const imageColWidth = colWidths[0];
      const imageSize = 18; // Image size in mm (increased from 10)
      const imageX = tableX + (imageColWidth - imageSize) / 2;
      const imageY = currentY - 8;
      
      if (itemImage) {
        try {
          // Detect image format from data URL
          let imageFormat: string = 'JPEG';
          if (itemImage.startsWith('data:image/png')) {
            imageFormat = 'PNG';
          } else if (itemImage.startsWith('data:image/jpeg') || itemImage.startsWith('data:image/jpg')) {
            imageFormat = 'JPEG';
          }
          doc.addImage(itemImage, imageFormat, imageX, imageY, imageSize, imageSize);
        } catch (error) {
          console.error("Error adding image to PDF:", error);
        }
      }
      
      tableX += colWidths[0]; // Move past image column

      // Draw other columns
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
        
        tableX += cellWidth;
      });

      currentY += rowHeight;
    }

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

  // Approval Signatures Section
  doc.setFontSize(12);
  doc.setFont(fontFamily, "bold");
  doc.setFillColor(0, 0, 0);
  doc.rect(margin, yPos, contentWidth, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.text("YEEZY APPROVALS:", margin + 2, yPos + 6);

  doc.setTextColor(0, 0, 0);
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
      doc.text(firstApproval.userName, firstSignatureX, signatureY + 20);
    }
    doc.text("CFO", firstSignatureX, signatureY + 25);
  } else {
    // Placeholder - just line, no X
    doc.line(firstSignatureX, signatureY + 15, firstSignatureX + 50, signatureY + 15);
    doc.setFontSize(10);
    doc.setFont(fontFamily, "normal");
    doc.text("CFO", firstSignatureX, signatureY + 25);
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
    doc.text("SECOND APPROVAL", secondSignatureX, signatureY + 20);
    doc.text("DIRECTOR", secondSignatureX, signatureY + 25);
  } else {
    // Placeholder - just line, no X
    doc.line(secondSignatureX, signatureY + 15, secondSignatureX + 50, signatureY + 15);
    doc.setFontSize(10);
    doc.setFont(fontFamily, "normal");
    doc.text("SECOND APPROVAL", secondSignatureX, signatureY + 20);
    doc.text("DIRECTOR", secondSignatureX, signatureY + 25);
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
