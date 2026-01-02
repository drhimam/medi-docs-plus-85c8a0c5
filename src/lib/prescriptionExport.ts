import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";

interface HeaderLine {
  text: string;
  bold: boolean;
  underline: boolean;
  fontSize: number;
}

interface PrescriptionSettings {
  paper_size: string;
  body_font: string;
  body_font_size: number;
  footer_font_size: number;
  header_font: string;
  body_text_color: string;
  footer_text_color: string;
  use_own_letterhead: boolean;
  header_left_lines: HeaderLine[];
  header_right_lines: HeaderLine[];
  header_background_color: string;
  header_line_spacing: number;
  barcode_enabled: boolean;
  footer_line_enabled: boolean;
  logo_path?: string;
  logo_position?: string;
  logo_width?: number;
  logo_height?: number;
  signature_path?: string;
  signature_position?: string;
  signature_width?: number;
  signature_height?: number;
}

// Page break marker for splitting content
const PAGE_BREAK_MARKER = '{{PAGE_BREAK}}';

// Function to convert HTML to plain text while preserving structure
const htmlToPlainText = (html: string): string => {
  let result = html;
  
  // Replace page break divs with marker FIRST (handle various formats)
  // Match div with data-page-break attribute
  result = result.replace(/<div[^>]*data-page-break\s*=\s*["']true["'][^>]*>[^<]*<\/div>/gi, PAGE_BREAK_MARKER);
  // Also match divs with class="page-break"
  result = result.replace(/<div[^>]*class\s*=\s*["'][^"']*page-break[^"']*["'][^>]*>[^<]*<\/div>/gi, PAGE_BREAK_MARKER);
  // Match text-based page break markers (%%%%% Page Break %%%%% or ───── Page Break ─────)
  result = result.replace(/%{3,}\s*Page\s*Break\s*%{3,}/gi, PAGE_BREAK_MARKER);
  result = result.replace(/─{3,}\s*Page\s*Break\s*─{3,}/gi, PAGE_BREAK_MARKER);
  result = result.replace(/[-─]{3,}\s*Page\s*Break\s*[-─]{3,}/gi, PAGE_BREAK_MARKER);
  
  return result
    // Convert block elements to newlines
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<h[1-6][^>]*>/gi, '')
    // Handle lists - add bullet/number and newlines
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/?[ou]l[^>]*>/gi, '\n')
    // Handle blockquotes
    .replace(/<blockquote[^>]*>/gi, '')
    .replace(/<\/blockquote>/gi, '\n')
    // Remove remaining HTML tags
    .replace(/<[^>]*>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    // Strip markdown formatting
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/!\[(.+?)\]\(.+?\)/g, '$1')
    // Clean up excessive newlines but preserve structure
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const exportPrescriptionToPDF = async (
  prescription: string,
  patientId: string,
  patientName: string,
  patientAge?: string,
  patientContact?: string,
  patientAddress?: string,
  settings?: PrescriptionSettings,
  logoDataUrl?: string,
  signatureDataUrl?: string
) => {
  const doc = new jsPDF({
    format: settings?.paper_size === "a4" ? "a4" : "letter",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = 20;

  // Function to draw header
  const drawHeader = () => {
    yPosition = 20;
    
    if (!settings?.use_own_letterhead && settings) {
    // Draw header background
    if (settings.header_background_color && settings.header_background_color !== "#ffffff") {
      doc.setFillColor(settings.header_background_color);
      doc.rect(0, 0, pageWidth, 60, "F");
    }

    // Add logo if provided
    if (logoDataUrl && settings.logo_path) {
      const logoWidth = settings.logo_width || 60;
      const logoHeight = settings.logo_height || 40;
      let logoX = margin;
      
      if (settings.logo_position === 'top-center') {
        logoX = (pageWidth - logoWidth) / 2;
      } else if (settings.logo_position === 'top-right') {
        logoX = pageWidth - margin - logoWidth;
      }
      
      try {
        doc.addImage(logoDataUrl, 'PNG', logoX, 10, logoWidth, logoHeight);
      } catch (error) {
        console.error("Error adding logo:", error);
      }
    }

    // Add header text
    const leftX = margin;
    const rightX = pageWidth / 2 + 10;
    let leftY = 20;
    let rightY = 20;

    doc.setFont(settings.header_font.toLowerCase().replace(/\s+/g, ""));

    // Left panel
    settings.header_left_lines.forEach((line) => {
      if (line.text) {
        doc.setFontSize(line.fontSize);
        let fontStyle = "normal";
        if (line.bold && line.underline) fontStyle = "boldunderline";
        else if (line.bold) fontStyle = "bold";
        else if (line.underline) fontStyle = "underline";
        doc.setFont(settings.header_font.toLowerCase().replace(/\s+/g, ""), fontStyle);
        doc.text(line.text, leftX, leftY);
        leftY += settings.header_line_spacing;
      }
    });

    // Right panel
    settings.header_right_lines.forEach((line) => {
      if (line.text) {
        doc.setFontSize(line.fontSize);
        let fontStyle = "normal";
        if (line.bold && line.underline) fontStyle = "boldunderline";
        else if (line.bold) fontStyle = "bold";
        else if (line.underline) fontStyle = "underline";
        doc.setFont(settings.header_font.toLowerCase().replace(/\s+/g, ""), fontStyle);
        doc.text(line.text, rightX, rightY);
        rightY += settings.header_line_spacing;
      }
    });

      // Draw separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, 65, pageWidth - margin, 65);
      yPosition = 75;
    }
  };

  // Function to draw patient particulars
  const drawPatientParticulars = (includeBarcode: boolean = false) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    
    // Line 1: Patient name and Age
    let line1 = `Patient: ${patientName}`;
    if (patientAge) {
      line1 += `  |  Age: ${patientAge}`;
    }
    line1 += `  |  Date: ${new Date().toLocaleDateString()}`;
    doc.text(line1, margin, yPosition);
    yPosition += 6;

    // Line 2: Contact
    doc.setFont("helvetica", "normal");
    if (patientContact) {
      let line2 = `Contact: ${patientContact}`;
      doc.text(line2, margin, yPosition);
      yPosition += 6;
    }

    // Line 3: Address
    if (patientAddress) {
      doc.text(`Address: ${patientAddress}`, margin, yPosition);
      yPosition += 6;
    }
    
    yPosition += 4;

    // Add barcode if enabled (only on first page)
    if (includeBarcode && settings?.barcode_enabled && patientId) {
      try {
        const canvas = document.createElement("canvas");
        JsBarcode(canvas, patientId, {
          format: "CODE128",
          width: 1.5,
          height: 30,
          displayValue: true,
          fontSize: 10,
        });
        const barcodeImage = canvas.toDataURL("image/png");
        doc.addImage(barcodeImage, "PNG", margin, yPosition, 50, 16);
        yPosition += 20;
      } catch (error) {
        console.error("Error generating barcode:", error);
      }
    }

    yPosition += 5;
  };

  // Draw initial header and patient particulars
  drawHeader();
  drawPatientParticulars(true); // Include barcode on first page

  // Add prescription content
  const addText = (text: string, fontSize?: number, color?: string) => {
    doc.setFontSize(fontSize || settings?.body_font_size || 12);
    doc.setFont(settings?.body_font.toLowerCase().replace(/\s+/g, "") || "courier", "normal");
    
    if (color) {
      const rgb = hexToRgb(color);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
    } else if (settings?.body_text_color) {
      const rgb = hexToRgb(settings.body_text_color);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
    }

    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        drawHeader();
        drawPatientParticulars(false); // No barcode on subsequent pages
      }
      doc.text(line, margin, yPosition);
      yPosition += (fontSize || settings?.body_font_size || 12) / 2 + 3;
    });
  };

  // Add prescription text - convert HTML to plain text and handle page breaks
  const cleanPrescription = htmlToPlainText(prescription || "No prescription details");
  
  // Split by page break marker
  const sections = cleanPrescription.split(PAGE_BREAK_MARKER);
  
  sections.forEach((section, index) => {
    const cleanSection = section.trim();
    
    if (!cleanSection) return; // Skip empty sections
    
    if (index > 0) {
      // Add new page for each section after page break
      doc.addPage();
      drawHeader();
      drawPatientParticulars(false); // No barcode on subsequent pages
    }
    
    // Process line by line to preserve structure
    const lines = cleanSection.split('\n');
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        addText(trimmedLine);
      } else {
        // Add spacing for empty lines (paragraph breaks)
        yPosition += 4;
      }
    });
  });

  // Get total page count
  const totalPages = doc.getNumberOfPages();

  // Add footer, signature, and page numbers to all pages
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);
    
    // Add footer line if enabled
    const footerY = pageHeight - 25;
    if (settings?.footer_line_enabled !== false) {
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    }
    
    // Add footer text
    doc.setFontSize(settings?.footer_font_size || 10);
    if (settings?.footer_text_color) {
      const rgb = hexToRgb(settings.footer_text_color);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
    } else {
      doc.setTextColor(100, 100, 100);
    }
    doc.setFont("helvetica", "italic");
    doc.text("This prescription is computer generated and valid.", margin, footerY);

    // Add page number at center bottom
    const pageNumberText = `Page ${pageNum} of ${totalPages}`;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const textWidth = doc.getTextWidth(pageNumberText);
    doc.text(pageNumberText, (pageWidth - textWidth) / 2, pageHeight - 10);

    // Add digital signature on last page only
    if (pageNum === totalPages && signatureDataUrl && settings?.signature_path) {
      const sigWidth = settings.signature_width || 80;
      const sigHeight = settings.signature_height || 40;
      let sigX = margin;
      const sigY = pageHeight - 55;
      
      if (settings.signature_position === 'bottom-center') {
        sigX = (pageWidth - sigWidth) / 2;
      } else if (settings.signature_position === 'bottom-right') {
        sigX = pageWidth - margin - sigWidth;
      }
      
      try {
        doc.addImage(signatureDataUrl, 'PNG', sigX, sigY, sigWidth, sigHeight);
      } catch (error) {
        console.error("Error adding signature:", error);
      }
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  doc.save(`Prescription_${patientName.replace(/\s+/g, "_")}_${timestamp}.pdf`);
};

// Generate PDF and return as base64 string (for email attachment)
export const generatePrescriptionPDFBase64 = async (
  prescription: string,
  patientId: string,
  patientName: string,
  patientAge?: string,
  patientContact?: string,
  patientAddress?: string,
  settings?: PrescriptionSettings,
  logoDataUrl?: string,
  signatureDataUrl?: string
): Promise<string> => {
  const doc = new jsPDF({
    format: settings?.paper_size === "a4" ? "a4" : "letter",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = 20;

  const drawHeader = () => {
    yPosition = 20;
    
    if (!settings?.use_own_letterhead && settings) {
      if (settings.header_background_color && settings.header_background_color !== "#ffffff") {
        doc.setFillColor(settings.header_background_color);
        doc.rect(0, 0, pageWidth, 60, "F");
      }

      if (logoDataUrl && settings.logo_path) {
        const logoWidth = settings.logo_width || 60;
        const logoHeight = settings.logo_height || 40;
        let logoX = margin;
        
        if (settings.logo_position === 'top-center') {
          logoX = (pageWidth - logoWidth) / 2;
        } else if (settings.logo_position === 'top-right') {
          logoX = pageWidth - margin - logoWidth;
        }
        
        try {
          doc.addImage(logoDataUrl, 'PNG', logoX, 10, logoWidth, logoHeight);
        } catch (error) {
          console.error("Error adding logo:", error);
        }
      }

      const leftX = margin;
      const rightX = pageWidth / 2 + 10;
      let leftY = 20;
      let rightY = 20;

      doc.setFont(settings.header_font.toLowerCase().replace(/\s+/g, ""));

      settings.header_left_lines.forEach((line) => {
        if (line.text) {
          doc.setFontSize(line.fontSize);
          let fontStyle = "normal";
          if (line.bold && line.underline) fontStyle = "boldunderline";
          else if (line.bold) fontStyle = "bold";
          else if (line.underline) fontStyle = "underline";
          doc.setFont(settings.header_font.toLowerCase().replace(/\s+/g, ""), fontStyle);
          doc.text(line.text, leftX, leftY);
          leftY += settings.header_line_spacing;
        }
      });

      settings.header_right_lines.forEach((line) => {
        if (line.text) {
          doc.setFontSize(line.fontSize);
          let fontStyle = "normal";
          if (line.bold && line.underline) fontStyle = "boldunderline";
          else if (line.bold) fontStyle = "bold";
          else if (line.underline) fontStyle = "underline";
          doc.setFont(settings.header_font.toLowerCase().replace(/\s+/g, ""), fontStyle);
          doc.text(line.text, rightX, rightY);
          rightY += settings.header_line_spacing;
        }
      });

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, 65, pageWidth - margin, 65);
      yPosition = 75;
    }
  };

  const drawPatientParticulars = (includeBarcode: boolean = false) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    
    let line1 = `Patient: ${patientName}`;
    if (patientAge) {
      line1 += `  |  Age: ${patientAge}`;
    }
    line1 += `  |  Date: ${new Date().toLocaleDateString()}`;
    doc.text(line1, margin, yPosition);
    yPosition += 6;

    doc.setFont("helvetica", "normal");
    if (patientContact) {
      let line2 = `Contact: ${patientContact}`;
      doc.text(line2, margin, yPosition);
      yPosition += 6;
    }

    if (patientAddress) {
      doc.text(`Address: ${patientAddress}`, margin, yPosition);
      yPosition += 6;
    }
    
    yPosition += 4;

    if (includeBarcode && settings?.barcode_enabled && patientId) {
      try {
        const canvas = document.createElement("canvas");
        JsBarcode(canvas, patientId, {
          format: "CODE128",
          width: 1.5,
          height: 30,
          displayValue: true,
          fontSize: 10,
        });
        const barcodeImage = canvas.toDataURL("image/png");
        doc.addImage(barcodeImage, "PNG", margin, yPosition, 50, 16);
        yPosition += 20;
      } catch (error) {
        console.error("Error generating barcode:", error);
      }
    }

    yPosition += 5;
  };

  drawHeader();
  drawPatientParticulars(true);

  const addText = (text: string, fontSize?: number, color?: string) => {
    doc.setFontSize(fontSize || settings?.body_font_size || 12);
    doc.setFont(settings?.body_font.toLowerCase().replace(/\s+/g, "") || "courier", "normal");
    
    if (color) {
      const rgb = hexToRgb(color);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
    } else if (settings?.body_text_color) {
      const rgb = hexToRgb(settings.body_text_color);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
    }

    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        drawHeader();
        drawPatientParticulars(false);
      }
      doc.text(line, margin, yPosition);
      yPosition += (fontSize || settings?.body_font_size || 12) / 2 + 3;
    });
  };

  const cleanPrescription = htmlToPlainText(prescription || "No prescription details");
  const PAGE_BREAK_MARKER = '{{PAGE_BREAK}}';
  const sections = cleanPrescription.split(PAGE_BREAK_MARKER);
  
  sections.forEach((section, index) => {
    const cleanSection = section.trim();
    if (!cleanSection) return;
    
    if (index > 0) {
      doc.addPage();
      drawHeader();
      drawPatientParticulars(false);
    }
    
    const lines = cleanSection.split('\n');
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        addText(trimmedLine);
      } else {
        yPosition += 4;
      }
    });
  });

  const totalPages = doc.getNumberOfPages();

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);
    
    const footerY = pageHeight - 25;
    if (settings?.footer_line_enabled !== false) {
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    }
    
    doc.setFontSize(settings?.footer_font_size || 10);
    if (settings?.footer_text_color) {
      const rgb = hexToRgb(settings.footer_text_color);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
    } else {
      doc.setTextColor(100, 100, 100);
    }
    doc.setFont("helvetica", "italic");
    doc.text("This prescription is computer generated and valid.", margin, footerY);

    const pageNumberText = `Page ${pageNum} of ${totalPages}`;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const textWidth = doc.getTextWidth(pageNumberText);
    doc.text(pageNumberText, (pageWidth - textWidth) / 2, pageHeight - 10);

    if (pageNum === totalPages && signatureDataUrl && settings?.signature_path) {
      const sigWidth = settings.signature_width || 80;
      const sigHeight = settings.signature_height || 40;
      let sigX = margin;
      const sigY = pageHeight - 55;
      
      if (settings.signature_position === 'bottom-center') {
        sigX = (pageWidth - sigWidth) / 2;
      } else if (settings.signature_position === 'bottom-right') {
        sigX = pageWidth - margin - sigWidth;
      }
      
      try {
        doc.addImage(signatureDataUrl, 'PNG', sigX, sigY, sigWidth, sigHeight);
      } catch (error) {
        console.error("Error adding signature:", error);
      }
    }
  }

  // Return as base64 string without data URI prefix
  return doc.output('datauristring').split(',')[1];
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}
