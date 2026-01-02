import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface SOAPSettings {
  header_title: string;
  header_background_color: string;
  header_text_color: string;
  logo_path: string | null;
  logo_width: number;
  logo_height: number;
  logo_enabled: boolean;
  subjective_color: string;
  objective_color: string;
  assessment_color: string;
  plan_color: string;
  body_font: string;
  body_font_size: number;
  body_text_color: string;
  footer_enabled: boolean;
  footer_text: string | null;
  footer_text_color: string;
}

interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface PatientInfo {
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  contact: string;
}

export const generateSOAPPDFBase64 = async (
  soapNote: SOAPNote,
  patientInfo: PatientInfo,
  settings?: Partial<SOAPSettings>
): Promise<string> => {
  const defaultSettings: SOAPSettings = {
    header_title: "SOAP NOTE",
    header_background_color: "#2980b9",
    header_text_color: "#ffffff",
    logo_path: null,
    logo_width: 50,
    logo_height: 30,
    logo_enabled: false,
    subjective_color: "#3498db",
    objective_color: "#2ecc71",
    assessment_color: "#9b59b6",
    plan_color: "#e67e22",
    body_font: "helvetica",
    body_font_size: 10,
    body_text_color: "#3c3c3c",
    footer_enabled: true,
    footer_text: null,
    footer_text_color: "#969696",
  };

  // Fetch user settings if not provided
  let finalSettings = { ...defaultSettings, ...settings };
  
  if (!settings) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("soap_export_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data) {
          finalSettings = { ...finalSettings, ...data };
        }
      }
    } catch (e) {
      console.error("Error fetching SOAP settings:", e);
    }
  }

  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  };

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;
  const fontSize = finalSettings.body_font_size;
  const lineHeight = fontSize * 0.5;

  const checkPageBreak = (neededHeight: number = 10) => {
    if (yPosition + neededHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  const cleanText = (text: string) => {
    return text
      .replace(/\n*---\s*[A-Z\s\/()0-9:-]+\s*---\n*/gi, '\n\n')
      .trim();
  };

  const renderFormattedText = (text: string, xOffset: number = 0) => {
    let cleanLine = text
      .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .trim();

    const wrappedLines = doc.splitTextToSize(cleanLine, contentWidth - xOffset - 4);
    wrappedLines.forEach((line: string) => {
      checkPageBreak(lineHeight);
      doc.text(line, margin + xOffset + 4, yPosition);
      yPosition += lineHeight;
    });
  };

  const renderContent = (content: string) => {
    const cleanedContent = cleanText(content || "N/A");
    const lines = cleanedContent.split('\n');
    
    lines.forEach((line) => {
      if (!line.trim()) {
        yPosition += 2;
        return;
      }
      
      const isSubHeader = /^[A-Z][A-Z\s\/()-]+:/.test(line.trim()) || 
                         /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*:/.test(line.trim());
      
      const bulletMatch = line.match(/^(\s*)[-•*]\s+(.+)/);
      const numberedMatch = line.match(/^(\s*)(\d+)[.)]\s+(.+)/);
      
      if (isSubHeader) {
        checkPageBreak(10);
        doc.setFont(finalSettings.body_font, "bold");
        doc.setFontSize(fontSize);
        doc.setTextColor(50, 50, 50);
        const headerText = line.replace(/\*\*/g, '').trim();
        const wrappedLines = doc.splitTextToSize(headerText, contentWidth - 4);
        wrappedLines.forEach((wrappedLine: string) => {
          checkPageBreak(lineHeight);
          doc.text(wrappedLine, margin + 4, yPosition);
          yPosition += lineHeight;
        });
        doc.setFont(finalSettings.body_font, "normal");
        doc.setTextColor(...hexToRgb(finalSettings.body_text_color));
      } else if (bulletMatch) {
        const indent = Math.min(bulletMatch[1].length / 2, 3) * 4;
        checkPageBreak(lineHeight);
        doc.setFont(finalSettings.body_font, "normal");
        doc.setFontSize(fontSize);
        doc.text("•", margin + 4 + indent, yPosition);
        renderFormattedText(bulletMatch[2], indent + 4);
      } else if (numberedMatch) {
        const indent = Math.min(numberedMatch[1].length / 2, 3) * 4;
        checkPageBreak(lineHeight);
        doc.setFont(finalSettings.body_font, "normal");
        doc.setFontSize(fontSize);
        doc.text(`${numberedMatch[2]}.`, margin + 4 + indent, yPosition);
        renderFormattedText(numberedMatch[3], indent + 6);
      } else {
        doc.setFont(finalSettings.body_font, "normal");
        doc.setFontSize(fontSize);
        doc.setTextColor(...hexToRgb(finalSettings.body_text_color));
        renderFormattedText(line, 0);
      }
    });
  };

  // Add header with logo support
  const headerRgb = hexToRgb(finalSettings.header_background_color);
  const headerTextRgb = hexToRgb(finalSettings.header_text_color);
  doc.setFillColor(...headerRgb);
  doc.rect(0, 0, pageWidth, 32, 'F');
  
  let headerXOffset = margin;
  
  // Load logo if enabled
  if (finalSettings.logo_enabled && finalSettings.logo_path) {
    try {
      const { data: logoData } = await supabase.storage
        .from("prescription-logos")
        .createSignedUrl(finalSettings.logo_path, 60);
      
      if (logoData?.signedUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve) => {
          img.onload = () => {
            doc.addImage(img, "PNG", margin, 4, finalSettings.logo_width / 3, finalSettings.logo_height / 3);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = logoData.signedUrl;
        });
        headerXOffset = margin + (finalSettings.logo_width / 3) + 5;
      }
    } catch (e) {
      console.error("Logo load error:", e);
    }
  }
  
  doc.setTextColor(...headerTextRgb);
  doc.setFontSize(16);
  doc.setFont(finalSettings.body_font, "bold");
  doc.text(finalSettings.header_title, headerXOffset, 12);
  
  doc.setFontSize(9);
  doc.setFont(finalSettings.body_font, "normal");
  doc.text(`Patient: ${patientInfo.firstName} ${patientInfo.lastName} | Age: ${patientInfo.age} yrs | ${patientInfo.gender}`, headerXOffset, 20);
  doc.text(`Contact: ${patientInfo.contact} | Date: ${format(new Date(), "MMMM dd, yyyy")}`, headerXOffset, 26);

  yPosition = 42;
  doc.setTextColor(0, 0, 0);

  const addSection = (title: string, content: string, colorHex: string) => {
    const color = hexToRgb(colorHex);
    checkPageBreak(20);
    
    doc.setFillColor(...color);
    doc.rect(margin, yPosition - 4, 3, 14, 'F');
    
    doc.setFontSize(12);
    doc.setFont(finalSettings.body_font, "bold");
    doc.setTextColor(...color);
    doc.text(title, margin + 6, yPosition + 4);
    yPosition += 14;
    
    doc.setFont(finalSettings.body_font, "normal");
    doc.setTextColor(...hexToRgb(finalSettings.body_text_color));
    doc.setFontSize(fontSize);
    
    renderContent(content);
    
    yPosition += 6;
  };

  addSection("SUBJECTIVE", soapNote.subjective, finalSettings.subjective_color);
  addSection("OBJECTIVE", soapNote.objective, finalSettings.objective_color);
  addSection("ASSESSMENT", soapNote.assessment, finalSettings.assessment_color);
  addSection("PLAN", soapNote.plan, finalSettings.plan_color);

  // Footer
  if (finalSettings.footer_enabled) {
    const footerRgb = hexToRgb(finalSettings.footer_text_color);
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(...footerRgb);
      doc.setFont(finalSettings.body_font, "normal");
      const footerText = finalSettings.footer_text || `Page ${i} of ${pageCount} | Generated: ${format(new Date(), "yyyy-MM-dd HH:mm")}`;
      doc.text(
        footerText,
        pageWidth / 2,
        pageHeight - 8,
        { align: "center" }
      );
    }
  }

  // Return base64 string
  return doc.output('datauristring').split(',')[1];
};
