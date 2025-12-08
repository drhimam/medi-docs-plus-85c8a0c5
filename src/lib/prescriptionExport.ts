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

// Function to strip markdown formatting and prepare content
const stripMarkdown = (text: string): string => {
  return text
    // Replace page break divs with marker BEFORE stripping HTML
    .replace(/<div[^>]*data-page-break="true"[^>]*>.*?<\/div>/gi, PAGE_BREAK_MARKER)
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold **text**
    .replace(/\*(.+?)\*/g, '$1')     // Remove italic *text*
    .replace(/__(.+?)__/g, '$1')     // Remove bold __text__
    .replace(/_(.+?)_/g, '$1')       // Remove italic _text_
    .replace(/~~(.+?)~~/g, '$1')     // Remove strikethrough ~~text~~
    .replace(/`(.+?)`/g, '$1')       // Remove inline code `text`
    .replace(/#{1,6}\s/g, '')        // Remove heading markers
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links [text](url)
    .replace(/!\[(.+?)\]\(.+?\)/g, '$1'); // Remove images ![alt](url)
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

  // Draw initial header
  drawHeader();

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
        drawHeader(); // Draw header on new page
      }
      doc.text(line, margin, yPosition);
      yPosition += (fontSize || settings?.body_font_size || 12) / 2 + 3;
    });
  };

  // Add patient information - compact layout
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  
  // Line 1: Patient name and Age
  let line1 = `Patient: ${patientName}`;
  if (patientAge) {
    line1 += `  |  Age: ${patientAge}`;
  }
  line1 += `  |  Date: ${new Date().toLocaleDateString()}`;
  doc.text(line1, margin, yPosition);
  yPosition += 6;

  // Line 2: Contact and Gender (if available)
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

  // Add barcode if enabled
  if (settings?.barcode_enabled && patientId) {
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

  // Add prescription text (strip markdown formatting and handle page breaks)
  const cleanPrescription = stripMarkdown(prescription || "No prescription details");
  
  // Split by page break marker
  const sections = cleanPrescription.split(PAGE_BREAK_MARKER);
  
  sections.forEach((section, index) => {
    const cleanSection = section
      .replace(/<[^>]*>/g, ' ')  // Remove remaining HTML tags
      .replace(/&nbsp;/g, ' ')   // Replace non-breaking spaces
      .replace(/&amp;/g, '&')    // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')      // Normalize whitespace
      .trim();
    
    if (!cleanSection) return; // Skip empty sections
    
    if (index > 0) {
      // Add new page for each section after page break
      doc.addPage();
      drawHeader();
    }
    addText(cleanSection);
  });

  // Add footer
  yPosition = pageHeight - 25;
  
  // Add footer line if enabled
  if (settings?.footer_line_enabled !== false) {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
  }
  
  doc.setFontSize(settings?.footer_font_size || 10);
  if (settings?.footer_text_color) {
    const rgb = hexToRgb(settings.footer_text_color);
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
  }
  doc.setFont("helvetica", "italic");
  doc.text("This prescription is computer generated and valid.", margin, yPosition);

  // Add digital signature if provided
  if (signatureDataUrl && settings?.signature_path) {
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

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  doc.save(`Prescription_${patientName.replace(/\s+/g, "_")}_${timestamp}.pdf`);
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
