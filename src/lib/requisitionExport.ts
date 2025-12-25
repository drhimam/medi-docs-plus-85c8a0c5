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

interface SelectedInvestigation {
  category: string;
  tests: string[];
}

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

export const exportRequisitionToPDF = async (
  selectedInvestigations: SelectedInvestigation[],
  patientId: string,
  patientName: string,
  patientAge?: string,
  patientGender?: string,
  patientContact?: string,
  patientAddress?: string,
  clinicalNotes?: string,
  priority?: string,
  fasting?: boolean,
  settings?: PrescriptionSettings,
  logoDataUrl?: string,
  signatureDataUrl?: string,
  options?: {
    output?: "download" | "blob";
    fileName?: string;
  }
): Promise<{ blob: Blob; fileName: string } | void> => {
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

        if (settings.logo_position === "top-center") {
          logoX = (pageWidth - logoWidth) / 2;
        } else if (settings.logo_position === "top-right") {
          logoX = pageWidth - margin - logoWidth;
        }

        try {
          doc.addImage(logoDataUrl, "PNG", logoX, 10, logoWidth, logoHeight);
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

  // Draw header
  drawHeader();

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("INVESTIGATION REQUISITION", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 12;

  // Draw line under title
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  // Patient Information Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Patient Information", margin, yPosition);
  yPosition += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  // Patient details in a compact format
  let patientLine = `Name: ${patientName}`;
  if (patientAge) patientLine += `  |  Age: ${patientAge}`;
  if (patientGender) patientLine += `  |  Gender: ${patientGender}`;
  doc.text(patientLine, margin, yPosition);
  yPosition += 5;

  if (patientContact) {
    doc.text(`Contact: ${patientContact}`, margin, yPosition);
    yPosition += 5;
  }

  doc.text(
    `Date: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
    margin,
    yPosition,
  );
  yPosition += 5;

  // Priority and Fasting on same line
  let statusLine = `Priority: ${(priority || "Routine").toUpperCase()}`;
  if (fasting) statusLine += "  |  ⚠ FASTING REQUIRED";
  doc.setFont("helvetica", "bold");
  doc.text(statusLine, margin, yPosition);
  yPosition += 8;

  // Add barcode if enabled
  if (settings?.barcode_enabled && patientId) {
    try {
      const canvas = document.createElement("canvas");
      JsBarcode(canvas, patientId, {
        format: "CODE128",
        width: 1.5,
        height: 25,
        displayValue: true,
        fontSize: 8,
      });
      const barcodeImage = canvas.toDataURL("image/png");
      doc.addImage(barcodeImage, "PNG", pageWidth - margin - 45, yPosition - 25, 40, 15);
    } catch (error) {
      console.error("Error generating barcode:", error);
    }
  }

  // Separator
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  // Investigations Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Investigations Requested", margin, yPosition);
  yPosition += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const checkIfNeedNewPage = () => {
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 30;
      return true;
    }
    return false;
  };

  // Render investigations by category in a compact table-like format
  selectedInvestigations.forEach((group) => {
    checkIfNeedNewPage();

    // Category header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPosition - 3, maxWidth, 6, "F");
    doc.text(group.category.toUpperCase(), margin + 2, yPosition);
    yPosition += 6;

    // Tests in two columns
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const colWidth = maxWidth / 2;
    const tests = group.tests;

    for (let i = 0; i < tests.length; i += 2) {
      checkIfNeedNewPage();

      // Left column
      doc.text(`☐ ${tests[i]}`, margin + 4, yPosition);

      // Right column if exists
      if (tests[i + 1]) {
        doc.text(`☐ ${tests[i + 1]}`, margin + colWidth + 4, yPosition);
      }

      yPosition += 5;
    }

    yPosition += 3;
  });

  // Clinical Notes section
  if (clinicalNotes && clinicalNotes.trim()) {
    checkIfNeedNewPage();

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Clinical Notes:", margin, yPosition);
    yPosition += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const noteLines = doc.splitTextToSize(clinicalNotes.trim(), maxWidth - 10);
    noteLines.forEach((line: string) => {
      checkIfNeedNewPage();
      doc.text(line, margin + 4, yPosition);
      yPosition += 4;
    });
  }

  // Get total page count
  const totalPages = doc.getNumberOfPages();

  // Add footer and signature to all pages
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);

    const footerY = pageHeight - 30;

    // Signature line
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.3);
    doc.line(pageWidth - margin - 60, footerY, pageWidth - margin, footerY);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Physician's Signature", pageWidth - margin - 30, footerY + 5, { align: "center" });

    // Add digital signature on last page only
    if (pageNum === totalPages && signatureDataUrl && settings?.signature_path) {
      const sigWidth = settings.signature_width || 60;
      const sigHeight = settings.signature_height || 30;
      const sigX = pageWidth - margin - sigWidth;
      const sigY = footerY - sigHeight - 5;

      try {
        doc.addImage(signatureDataUrl, "PNG", sigX, sigY, sigWidth, sigHeight);
      } catch (error) {
        console.error("Error adding signature:", error);
      }
    }

    // Footer line if enabled
    if (settings?.footer_line_enabled !== false) {
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, footerY + 10, pageWidth - margin, footerY + 10);
    }

    // Footer text
    doc.setFontSize(settings?.footer_font_size || 8);
    if (settings?.footer_text_color) {
      const rgb = hexToRgb(settings.footer_text_color);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
    } else {
      doc.setTextColor(100, 100, 100);
    }
    doc.setFont("helvetica", "italic");
    doc.text("This requisition is computer generated.", margin, footerY + 15);

    // Page number
    const pageNumberText = `Page ${pageNum} of ${totalPages}`;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const textWidth = doc.getTextWidth(pageNumberText);
    doc.text(pageNumberText, (pageWidth - textWidth) / 2, pageHeight - 10);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  const defaultFileName = `Investigation_Requisition_${patientName.replace(/\s+/g, "_")}_${timestamp}.pdf`;
  const fileName = options?.fileName || defaultFileName;

  if (options?.output === "blob") {
    const blob = doc.output("blob") as Blob;
    return { blob, fileName };
  }

  doc.save(fileName);
};
