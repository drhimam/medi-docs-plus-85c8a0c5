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
}

export const exportPrescriptionToPDF = (
  prescription: string,
  patientId: string,
  patientName: string,
  settings?: PrescriptionSettings
) => {
  const doc = new jsPDF({
    format: settings?.paper_size === "a4" ? "a4" : "letter",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = 20;

  // Add header if not using own letterhead
  if (!settings?.use_own_letterhead && settings) {
    // Draw header background
    if (settings.header_background_color && settings.header_background_color !== "#ffffff") {
      doc.setFillColor(settings.header_background_color);
      doc.rect(0, 0, pageWidth, 60, "F");
    }

    // Add barcode if enabled
    if (settings.barcode_enabled && patientId) {
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
        doc.addImage(barcodeImage, "PNG", pageWidth - 60, 10, 50, 16);
      } catch (error) {
        console.error("Error generating barcode:", error);
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
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += (fontSize || settings?.body_font_size || 12) / 2 + 3;
    });
  };

  // Add patient information
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Prescription", margin, yPosition);
  yPosition += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Patient: ${patientName}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Patient ID: ${patientId}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPosition);
  yPosition += 15;

  // Add prescription text
  addText(prescription || "No prescription details");

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
