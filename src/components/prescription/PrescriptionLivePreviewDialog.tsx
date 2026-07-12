import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Printer, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

interface PrescriptionLivePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prescription: string;
  patientName: string;
  patientAge?: string;
  patientContact?: string;
  patientAddress?: string;
  patientId: string;
}

const htmlToPlainText = (html: string): string => {
  let result = html;
  result = result.replace(/<div[^>]*data-page-break\s*=\s*["']true["'][^>]*>[^<]*<\/div>/gi, '\n--- Page Break ---\n');
  
  return result
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<h[1-6][^>]*>/gi, '')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/?[ou]l[^>]*>/gi, '\n')
    .replace(/<blockquote[^>]*>/gi, '')
    .replace(/<\/blockquote>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export function PrescriptionLivePreviewDialog({
  open,
  onOpenChange,
  prescription,
  patientName,
  patientAge,
  patientContact,
  patientAddress,
  patientId,
}: PrescriptionLivePreviewDialogProps) {
  const [settings, setSettings] = useState<PrescriptionSettings | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [signatureUrl, setSignatureUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      loadSettings();
      setZoom(1);
    }
  }, [open]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("prescription_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          paper_size: data.paper_size,
          body_font: data.body_font,
          body_font_size: data.body_font_size,
          footer_font_size: data.footer_font_size,
          header_font: data.header_font,
          body_text_color: data.body_text_color,
          footer_text_color: data.footer_text_color,
          use_own_letterhead: data.use_own_letterhead,
          header_left_lines: (data.header_left_lines as unknown as HeaderLine[]) || [],
          header_right_lines: (data.header_right_lines as unknown as HeaderLine[]) || [],
          header_background_color: data.header_background_color,
          header_line_spacing: data.header_line_spacing,
          barcode_enabled: data.barcode_enabled,
          footer_line_enabled: data.footer_line_enabled ?? true,
          logo_path: data.logo_path || undefined,
          logo_position: data.logo_position || undefined,
          logo_width: data.logo_width || undefined,
          logo_height: data.logo_height || undefined,
          signature_path: data.signature_path || undefined,
          signature_position: data.signature_position || undefined,
          signature_width: data.signature_width || undefined,
          signature_height: data.signature_height || undefined,
        });

        if (data.logo_path) {
          const { data: signed } = await supabase.storage
            .from('prescription-logos')
            .createSignedUrl(data.logo_path, 3600);
          setLogoUrl(signed?.signedUrl || "");
        } else {
          setLogoUrl("");
        }

        if (data.signature_path) {
          const { data: signed } = await supabase.storage
            .from('prescription-signatures')
            .createSignedUrl(data.signature_path, 3600);
          setSignatureUrl(signed?.signedUrl || "");
        } else {
          setSignatureUrl("");
        }
      } else {
        // Default settings
        setSettings({
          paper_size: "letter",
          body_font: "Courier New",
          body_font_size: 12,
          footer_font_size: 10,
          header_font: "Arial",
          body_text_color: "#333333",
          footer_text_color: "#666666",
          use_own_letterhead: false,
          header_left_lines: Array(5).fill({ text: "", bold: false, underline: false, fontSize: 12 }),
          header_right_lines: Array(5).fill({ text: "", bold: false, underline: false, fontSize: 12 }),
          header_background_color: "#ffffff",
          header_line_spacing: 6,
          barcode_enabled: true,
          footer_line_enabled: true,
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;

    const printContent = printRef.current.outerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const pageWidth = settings?.paper_size === "a4" ? "595px" : "612px";
    const pageHeight = settings?.paper_size === "a4" ? "842px" : "792px";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prescription - ${patientName}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: ${settings?.body_font || "Courier New"}, monospace;
              color: ${settings?.body_text_color || "#333333"};
              background: white;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @media print {
              @page { 
                size: ${settings?.paper_size === "a4" ? "A4" : "letter"}; 
                margin: 10mm; 
              }
              body { margin: 0; padding: 0; }
            }
            .print-wrapper {
              display: flex;
              justify-content: center;
              padding: 0;
            }
            .print-wrapper > div {
              width: ${pageWidth} !important;
              min-height: ${pageHeight} !important;
              transform: none !important;
              box-shadow: none !important;
              border: none !important;
              margin: 0 auto;
            }
            p { margin: 0; }
            hr { border: none; border-top: 1px solid #d1d5db; margin: 8px 0; }
            .font-bold { font-weight: bold; }
            .italic { font-style: italic; }
            .text-center { text-align: center; }
            .text-xs { font-size: 0.75rem; }
            .text-sm { font-size: 0.875rem; }
            .whitespace-pre-wrap { white-space: pre-wrap; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .justify-center { justify-content: center; }
            .justify-start { justify-content: flex-start; }
            .justify-end { justify-content: flex-end; }
            .items-center { align-items: center; }
            .gap-4 { gap: 1rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mt-2 { margin-top: 0.5rem; }
            .mt-4 { margin-top: 1rem; }
            .mt-8 { margin-top: 2rem; }
            .mt-auto { margin-top: auto; }
            .ml-4 { margin-left: 1rem; }
            .mr-2 { margin-right: 0.5rem; }
            .p-2 { padding: 0.5rem; }
            .p-8 { padding: 2rem; }
            .pb-4 { padding-bottom: 1rem; }
            .pt-8 { padding-top: 2rem; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            .ml-auto { margin-left: auto; }
            .border { border: 1px solid #e5e7eb; }
            .border-dashed { border-style: dashed; }
            .border-gray-400 { border-color: #9ca3af; }
            .border-gray-300 { border-color: #d1d5db; }
            .inline-block { display: inline-block; }
            .text-gray-500 { color: #6b7280; }
            .relative { position: relative; }
            .bg-white { background-color: white; }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
            ${printContent}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleZoomReset = () => setZoom(1);

  const getLogoPositionStyle = () => {
    switch (settings?.logo_position) {
      case 'top-center':
        return 'mx-auto';
      case 'top-right':
        return 'ml-auto';
      default:
        return '';
    }
  };

  const getSignaturePositionStyle = () => {
    switch (settings?.signature_position) {
      case 'bottom-center':
        return 'justify-center';
      case 'bottom-right':
        return 'justify-end';
      default:
        return 'justify-start';
    }
  };

  const cleanPrescription = htmlToPlainText(prescription || "No prescription details");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Prescription Preview</DialogTitle>
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoom <= 0.5}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom Out</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <span className="text-sm text-muted-foreground min-w-[50px] text-center">
                {Math.round(zoom * 100)}%
              </span>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoom >= 2}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom In</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleZoomReset}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reset Zoom</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="w-px h-6 bg-border mx-2" />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handlePrint}>
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Print Prescription</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="h-[70vh]">
            <div className="flex justify-center p-4">
              <div 
                ref={printRef}
                className="bg-white text-black border shadow-lg p-8 relative"
                style={{ 
                  width: settings?.paper_size === "a4" ? "595px" : "612px",
                  minHeight: settings?.paper_size === "a4" ? "842px" : "792px",
                  fontFamily: settings?.body_font || "Courier New",
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top center',
                }}
              >
                {/* Header */}
                {!settings?.use_own_letterhead && (
                  <div 
                    className="pb-4 mb-4"
                    style={{ backgroundColor: settings?.header_background_color || "#ffffff" }}
                  >
                    {/* Logo */}
                    {logoUrl && (
                      <div className={`mb-2 ${getLogoPositionStyle()}`} style={{ width: 'fit-content' }}>
                        <img 
                          src={logoUrl} 
                          alt="Logo" 
                          style={{ 
                            width: settings?.logo_width || 60, 
                            height: settings?.logo_height || 40,
                            objectFit: 'contain'
                          }} 
                        />
                      </div>
                    )}

                    {/* Header Text */}
                    <div className="flex justify-between gap-4">
                      <div style={{ fontFamily: settings?.header_font || "Arial" }}>
                        {settings?.header_left_lines.map((line, idx) => (
                          line.text && (
                            <p 
                              key={idx}
                              style={{ 
                                fontSize: line.fontSize,
                                fontWeight: line.bold ? 'bold' : 'normal',
                                textDecoration: line.underline ? 'underline' : 'none',
                                marginBottom: settings?.header_line_spacing || 6,
                              }}
                            >
                              {line.text}
                            </p>
                          )
                        ))}
                      </div>
                      <div style={{ fontFamily: settings?.header_font || "Arial" }}>
                        {settings?.header_right_lines.map((line, idx) => (
                          line.text && (
                            <p 
                              key={idx}
                              style={{ 
                                fontSize: line.fontSize,
                                fontWeight: line.bold ? 'bold' : 'normal',
                                textDecoration: line.underline ? 'underline' : 'none',
                                marginBottom: settings?.header_line_spacing || 6,
                              }}
                            >
                              {line.text}
                            </p>
                          )
                        ))}
                      </div>
                    </div>
                    
                    <hr className="border-gray-300 mt-2" />
                  </div>
                )}

                {/* Patient Information */}
                <div className="mb-4 text-sm">
                  <p className="font-bold">
                    Patient: {patientName}
                    {patientAge && <span className="ml-4">| Age: {patientAge}</span>}
                    <span className="ml-4">| Date: {new Date().toLocaleDateString()}</span>
                  </p>
                  {patientContact && (
                    <p>Contact: {patientContact}</p>
                  )}
                  {patientAddress && (
                    <p>Address: {patientAddress}</p>
                  )}
                </div>

                {/* Barcode Placeholder */}
                {settings?.barcode_enabled && (
                  <div className="mb-4 p-2 border border-dashed border-gray-400 inline-block">
                    <p className="text-xs text-gray-500">Barcode: {patientId.slice(0, 8)}</p>
                  </div>
                )}

                {/* Prescription Content */}
                <div 
                  className="mt-4 whitespace-pre-wrap"
                  style={{ 
                    fontFamily: settings?.body_font || "Courier New",
                    fontSize: settings?.body_font_size || 12,
                    color: settings?.body_text_color || "#333333",
                  }}
                >
                  {cleanPrescription}
                </div>

                {/* Signature */}
                {signatureUrl && (
                  <div className={`flex mt-8 ${getSignaturePositionStyle()}`}>
                    <img 
                      src={signatureUrl} 
                      alt="Signature" 
                      style={{ 
                        width: settings?.signature_width || 80, 
                        height: settings?.signature_height || 40,
                        objectFit: 'contain'
                      }} 
                    />
                  </div>
                )}

                {/* Footer */}
                <div className="mt-auto pt-8">
                  {settings?.footer_line_enabled !== false && (
                    <hr className="border-gray-300 mb-2" />
                  )}
                  <p 
                    className="italic text-center"
                    style={{ 
                      fontSize: settings?.footer_font_size || 10,
                      color: settings?.footer_text_color || "#666666",
                    }}
                  >
                    This prescription is computer generated and valid.
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
