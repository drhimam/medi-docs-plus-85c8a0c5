import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Printer, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, differenceInYears } from "date-fns";
import DOMPurify from "dompurify";

interface SOAPExportSettings {
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

interface Patient {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  contact_number: string;
}

interface SOAPLivePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

const defaultSettings: SOAPExportSettings = {
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

export function SOAPLivePreviewDialog({
  open,
  onOpenChange,
  patient,
  subjective,
  objective,
  assessment,
  plan,
}: SOAPLivePreviewDialogProps) {
  const [settings, setSettings] = useState<SOAPExportSettings>(defaultSettings);
  const [logoUrl, setLogoUrl] = useState<string>("");
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
        .from("soap_export_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data as SOAPExportSettings);
        if (data.logo_path && data.logo_enabled) {
          const { data: signedUrl } = await supabase.storage
            .from("prescription-logos")
            .createSignedUrl(data.logo_path, 3600);
          if (signedUrl?.signedUrl) {
            setLogoUrl(signedUrl.signedUrl);
          }
        } else {
          setLogoUrl("");
        }
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

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>SOAP Note - ${patient?.first_name} ${patient?.last_name}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: ${getFontFamily()}, sans-serif;
              color: ${settings.body_text_color};
              font-size: ${settings.body_font_size}pt;
              background: white;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @media print {
              @page { size: A4; margin: 10mm; }
              body { margin: 0; padding: 0; }
            }
            .print-wrapper {
              display: flex;
              justify-content: center;
              padding: 0;
            }
            .print-wrapper > div {
              width: 595px !important;
              min-height: 842px !important;
              transform: none !important;
              box-shadow: none !important;
              border: none !important;
              margin: 0 auto;
            }
            p { margin: 0; }
            .font-bold { font-weight: bold; }
            .text-white { color: white; }
            .text-center { text-align: center; }
            .text-sm { font-size: 0.875rem; }
            .text-xl { font-size: 1.25rem; }
            .italic { font-style: italic; }
            .flex { display: flex; }
            .flex-1 { flex: 1; }
            .flex-wrap { flex-wrap: wrap; }
            .items-start { align-items: flex-start; }
            .justify-between { justify-content: space-between; }
            .gap-x-6 { column-gap: 1.5rem; }
            .gap-y-1 { row-gap: 0.25rem; }
            .space-y-4 > * + * { margin-top: 1rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mt-1 { margin-top: 0.25rem; }
            .mt-8 { margin-top: 2rem; }
            .ml-4 { margin-left: 1rem; }
            .mr-2 { margin-right: 0.5rem; }
            .p-3 { padding: 0.75rem; }
            .p-4 { padding: 1rem; }
            .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
            .py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
            .pt-4 { padding-top: 1rem; }
            .rounded { border-radius: 0.25rem; }
            .rounded-t { border-top-left-radius: 0.25rem; border-top-right-radius: 0.25rem; }
            .rounded-b { border-bottom-left-radius: 0.25rem; border-bottom-right-radius: 0.25rem; }
            .border { border: 1px solid #e5e7eb; }
            .border-t { border-top: 1px solid #e5e7eb; }
            .border-t-0 { border-top: none; }
            .bg-gray-50 { background-color: #f9fafb; }
            .bg-white { background-color: white; }
            .text-gray-400 { color: #9ca3af; }
            .relative { position: relative; }
            strong { font-weight: bold; }
            em { font-style: italic; }
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

  const getFontFamily = () => {
    switch (settings.body_font) {
      case "times": return "Times New Roman";
      case "courier": return "Courier New";
      default: return "Helvetica";
    }
  };

  const calculateAge = () => {
    if (!patient?.date_of_birth) return "";
    return differenceInYears(new Date(), new Date(patient.date_of_birth));
  };

  const renderContent = (content: string) => {
    if (!content) return <p className="text-gray-400 italic">No data</p>;
    
    return content.split('\n').map((line, idx) => {
      // Check for bold text
      const boldMatch = line.match(/\*\*(.+?)\*\*/g);
      let processedLine = line;
      
      if (boldMatch) {
        boldMatch.forEach(match => {
          const text = match.replace(/\*\*/g, '');
          processedLine = processedLine.replace(match, `<strong>${text}</strong>`);
        });
      }
      
      // Check for italic text
      const italicMatch = processedLine.match(/\*(.+?)\*/g);
      if (italicMatch) {
        italicMatch.forEach(match => {
          if (!match.includes('**')) {
            const text = match.replace(/\*/g, '');
            processedLine = processedLine.replace(match, `<em>${text}</em>`);
          }
        });
      }

      // Handle bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        processedLine = processedLine.replace(/^[\s]*[-•]\s*/, '');
        return (
          <p key={idx} className="ml-4" style={{ marginBottom: 2 }}>
            <span className="mr-2">•</span>
            <span dangerouslySetInnerHTML={{ __html: processedLine }} />
          </p>
        );
      }

      // Handle numbered lists
      const numberedMatch = line.trim().match(/^(\d+)\.\s/);
      if (numberedMatch) {
        processedLine = processedLine.replace(/^[\s]*\d+\.\s*/, '');
        return (
          <p key={idx} className="ml-4" style={{ marginBottom: 2 }}>
            <span className="mr-2">{numberedMatch[1]}.</span>
            <span dangerouslySetInnerHTML={{ __html: processedLine }} />
          </p>
        );
      }

      // Check if it's a section header (all caps or ends with colon)
      if (line === line.toUpperCase() && line.length > 3 && line.trim().length > 0) {
        return (
          <p key={idx} style={{ fontWeight: 'bold', marginTop: idx > 0 ? 8 : 0, marginBottom: 4 }}>
            {line}
          </p>
        );
      }

      if (line.trim().endsWith(':') && line.length < 50) {
        return (
          <p key={idx} style={{ fontWeight: 600, marginTop: idx > 0 ? 6 : 0, marginBottom: 2 }}>
            {line}
          </p>
        );
      }

      return (
        <p key={idx} style={{ marginBottom: 2 }} dangerouslySetInnerHTML={{ __html: processedLine }} />
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>SOAP Note Preview</DialogTitle>
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
                  <TooltipContent>Print SOAP Note</TooltipContent>
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
                className="bg-white text-black border shadow-lg relative"
                style={{ 
                  width: "595px",
                  minHeight: "842px",
                  fontFamily: getFontFamily(),
                  fontSize: `${settings.body_font_size}pt`,
                  color: settings.body_text_color,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top center',
                  padding: "20px 25px",
                }}
              >
                {/* Header */}
                <div 
                  className="p-4 mb-4 rounded"
                  style={{ backgroundColor: settings.header_background_color }}
                >
                  <div className="flex items-start justify-between">
                    {settings.logo_enabled && logoUrl && (
                      <img 
                        src={logoUrl} 
                        alt="Logo" 
                        style={{ 
                          width: settings.logo_width, 
                          height: settings.logo_height,
                          objectFit: 'contain'
                        }} 
                      />
                    )}
                    <div className="flex-1 text-center">
                      <h1 
                        className="text-xl font-bold"
                        style={{ color: settings.header_text_color }}
                      >
                        {settings.header_title}
                      </h1>
                      <p 
                        className="text-sm mt-1"
                        style={{ color: settings.header_text_color }}
                      >
                        {format(new Date(), "MMMM d, yyyy")}
                      </p>
                    </div>
                    <div style={{ width: settings.logo_enabled && logoUrl ? settings.logo_width : 0 }} />
                  </div>
                </div>

                {/* Patient Information */}
                <div className="mb-4 p-3 bg-gray-50 rounded border">
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <span><strong>Patient:</strong> {patient?.first_name} {patient?.last_name}</span>
                    <span><strong>Age:</strong> {calculateAge()} years</span>
                    <span><strong>Gender:</strong> {patient?.gender}</span>
                    <span><strong>Contact:</strong> {patient?.contact_number}</span>
                  </div>
                </div>

                {/* SOAP Sections */}
                <div className="space-y-4">
                  {/* Subjective */}
                  <div>
                    <div 
                      className="px-3 py-1.5 rounded-t font-bold text-white"
                      style={{ backgroundColor: settings.subjective_color }}
                    >
                      SUBJECTIVE
                    </div>
                    <div className="p-3 border border-t-0 rounded-b">
                      {renderContent(subjective)}
                    </div>
                  </div>

                  {/* Objective */}
                  <div>
                    <div 
                      className="px-3 py-1.5 rounded-t font-bold text-white"
                      style={{ backgroundColor: settings.objective_color }}
                    >
                      OBJECTIVE
                    </div>
                    <div className="p-3 border border-t-0 rounded-b">
                      {renderContent(objective)}
                    </div>
                  </div>

                  {/* Assessment */}
                  <div>
                    <div 
                      className="px-3 py-1.5 rounded-t font-bold text-white"
                      style={{ backgroundColor: settings.assessment_color }}
                    >
                      ASSESSMENT
                    </div>
                    <div className="p-3 border border-t-0 rounded-b">
                      {renderContent(assessment)}
                    </div>
                  </div>

                  {/* Plan */}
                  <div>
                    <div 
                      className="px-3 py-1.5 rounded-t font-bold text-white"
                      style={{ backgroundColor: settings.plan_color }}
                    >
                      PLAN
                    </div>
                    <div className="p-3 border border-t-0 rounded-b">
                      {renderContent(plan)}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                {settings.footer_enabled && (
                  <div className="mt-8 pt-4 border-t">
                    <p 
                      className="text-center italic text-sm"
                      style={{ color: settings.footer_text_color }}
                    >
                      {settings.footer_text || "This SOAP note is computer generated and reviewed by the attending physician."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
