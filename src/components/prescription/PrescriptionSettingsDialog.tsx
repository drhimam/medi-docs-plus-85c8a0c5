import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Bold, Underline, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PrescriptionSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface HeaderLine {
  text: string;
  bold: boolean;
  underline: boolean;
  fontSize: number;
}

export default function PrescriptionSettingsDialog({ open, onOpenChange }: PrescriptionSettingsDialogProps) {
  const [paperSize, setPaperSize] = useState("letter");
  const [bodyFont, setBodyFont] = useState("Courier New");
  const [bodyFontSize, setBodyFontSize] = useState("12");
  const [footerFontSize, setFooterFontSize] = useState("10");
  const [headerFont, setHeaderFont] = useState("Arial");
  const [bodyTextColor, setBodyTextColor] = useState("#333333");
  const [footerTextColor, setFooterTextColor] = useState("#666666");
  const [useOwnLetterhead, setUseOwnLetterhead] = useState(false);
  const [headerLeftLines, setHeaderLeftLines] = useState<HeaderLine[]>(
    Array(5).fill({ text: "", bold: false, underline: false, fontSize: 12 })
  );
  const [headerRightLines, setHeaderRightLines] = useState<HeaderLine[]>(
    Array(5).fill({ text: "", bold: false, underline: false, fontSize: 12 })
  );
  const [headerBackgroundColor, setHeaderBackgroundColor] = useState("#ffffff");
  const [headerLineSpacing, setHeaderLineSpacing] = useState("6");
  const [barcodeEnabled, setBarcodeEnabled] = useState(true);
  const [footerLineEnabled, setFooterLineEnabled] = useState(true);
  const [logoPath, setLogoPath] = useState<string>("");
  const [logoPosition, setLogoPosition] = useState("top-left");
  const [logoWidth, setLogoWidth] = useState("60");
  const [logoHeight, setLogoHeight] = useState("40");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [signaturePath, setSignaturePath] = useState<string>("");
  const [signaturePosition, setSignaturePosition] = useState("bottom-right");
  const [signatureWidth, setSignatureWidth] = useState("80");
  const [signatureHeight, setSignatureHeight] = useState("40");
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
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
        setPaperSize(data.paper_size);
        setBodyFont(data.body_font);
        setBodyFontSize(data.body_font_size.toString());
        setFooterFontSize(data.footer_font_size.toString());
        setHeaderFont(data.header_font);
        setBodyTextColor(data.body_text_color);
        setFooterTextColor(data.footer_text_color);
        setUseOwnLetterhead(data.use_own_letterhead);
        setHeaderBackgroundColor(data.header_background_color);
        setHeaderLineSpacing(data.header_line_spacing.toString());
        setBarcodeEnabled(data.barcode_enabled);
        setFooterLineEnabled(data.footer_line_enabled ?? true);
        setLogoPath(data.logo_path || "");
        setLogoPosition(data.logo_position || "top-left");
        setLogoWidth(data.logo_width?.toString() || "60");
        setLogoHeight(data.logo_height?.toString() || "40");
        setSignaturePath(data.signature_path || "");
        setSignaturePosition(data.signature_position || "bottom-right");
        setSignatureWidth(data.signature_width?.toString() || "80");
        setSignatureHeight(data.signature_height?.toString() || "40");
        
        if (data.logo_path) {
          const { data: signedUrlData } = await supabase.storage
            .from('prescription-logos')
            .createSignedUrl(data.logo_path, 3600);
          if (signedUrlData?.signedUrl) {
            setLogoPreview(signedUrlData.signedUrl);
          }
        }
        
        if (data.signature_path) {
          const { data: signedUrlData } = await supabase.storage
            .from('prescription-signatures')
            .createSignedUrl(data.signature_path, 3600);
          if (signedUrlData?.signedUrl) {
            setSignaturePreview(signedUrlData.signedUrl);
          }
        }
        
        if (data.header_left_lines) {
          setHeaderLeftLines(JSON.parse(JSON.stringify(data.header_left_lines)));
        }
        if (data.header_right_lines) {
          setHeaderRightLines(JSON.parse(JSON.stringify(data.header_right_lines)));
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let uploadedLogoPath = logoPath;
      let uploadedSignaturePath = signaturePath;

      // Upload logo if new file selected
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        // Delete old logo if exists
        if (logoPath) {
          await supabase.storage
            .from('prescription-logos')
            .remove([logoPath]);
        }

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('prescription-logos')
          .upload(fileName, logoFile);

        if (uploadError) throw uploadError;
        uploadedLogoPath = uploadData.path;
      }

      // Upload signature if new file selected
      if (signatureFile) {
        const fileExt = signatureFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        // Delete old signature if exists
        if (signaturePath) {
          await supabase.storage
            .from('prescription-signatures')
            .remove([signaturePath]);
        }

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('prescription-signatures')
          .upload(fileName, signatureFile);

        if (uploadError) throw uploadError;
        uploadedSignaturePath = uploadData.path;
      }

      const settings = {
        user_id: user.id,
        paper_size: paperSize,
        body_font: bodyFont,
        body_font_size: parseInt(bodyFontSize),
        footer_font_size: parseInt(footerFontSize),
        header_font: headerFont,
        body_text_color: bodyTextColor,
        footer_text_color: footerTextColor,
        use_own_letterhead: useOwnLetterhead,
        header_left_lines: headerLeftLines as any,
        header_right_lines: headerRightLines as any,
        header_background_color: headerBackgroundColor,
        header_line_spacing: parseInt(headerLineSpacing),
        barcode_enabled: barcodeEnabled,
        footer_line_enabled: footerLineEnabled,
        logo_path: uploadedLogoPath || null,
        logo_position: logoPosition,
        logo_width: parseInt(logoWidth),
        logo_height: parseInt(logoHeight),
        signature_path: uploadedSignaturePath || null,
        signature_position: signaturePosition,
        signature_width: parseInt(signatureWidth),
        signature_height: parseInt(signatureHeight),
      };

      const { error } = await supabase
        .from("prescription_settings")
        .upsert([settings], { onConflict: "user_id" });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Prescription settings saved successfully",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateHeaderLine = (side: "left" | "right", index: number, updates: Partial<HeaderLine>) => {
    const lines = side === "left" ? [...headerLeftLines] : [...headerRightLines];
    lines[index] = { ...lines[index], ...updates };
    side === "left" ? setHeaderLeftLines(lines) : setHeaderRightLines(lines);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Logo file size must be less than 2MB",
          variant: "destructive",
        });
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = async () => {
    if (logoPath) {
      try {
        await supabase.storage
          .from('prescription-logos')
          .remove([logoPath]);
      } catch (error) {
        console.error("Error removing logo:", error);
      }
    }
    setLogoPath("");
    setLogoFile(null);
    setLogoPreview("");
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Signature file size must be less than 2MB",
          variant: "destructive",
        });
        return;
      }
      setSignatureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSignature = async () => {
    if (signaturePath) {
      try {
        await supabase.storage
          .from('prescription-signatures')
          .remove([signaturePath]);
      } catch (error) {
        console.error("Error removing signature:", error);
      }
    }
    setSignaturePath("");
    setSignatureFile(null);
    setSignaturePreview("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prescription Export Options</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="export">Export Settings</TabsTrigger>
            <TabsTrigger value="header">Header Settings</TabsTrigger>
            <TabsTrigger value="logo">Logo</TabsTrigger>
            <TabsTrigger value="signature">Signature</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Paper Size</Label>
                <Select value={paperSize} onValueChange={setPaperSize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="letter">Letter (8.5 × 11 in)</SelectItem>
                    <SelectItem value="a4">A4 (210 × 297 mm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Body Font</Label>
                <Select value={bodyFont} onValueChange={setBodyFont}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Courier New">Courier New</SelectItem>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Body Font Size (pt)</Label>
                <Input
                  type="number"
                  value={bodyFontSize}
                  onChange={(e) => setBodyFontSize(e.target.value)}
                  min="8"
                  max="24"
                />
              </div>

              <div className="space-y-2">
                <Label>Footer Font Size (pt)</Label>
                <Input
                  type="number"
                  value={footerFontSize}
                  onChange={(e) => setFooterFontSize(e.target.value)}
                  min="6"
                  max="18"
                />
              </div>

              <div className="space-y-2">
                <Label>Header Font</Label>
                <Select value={headerFont} onValueChange={setHeaderFont}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Courier New">Courier New</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Body Text Color</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="color"
                    value={bodyTextColor}
                    onChange={(e) => setBodyTextColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={bodyTextColor}
                    onChange={(e) => setBodyTextColor(e.target.value)}
                    placeholder="#333333"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Footer Text Color</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="color"
                    value={footerTextColor}
                    onChange={(e) => setFooterTextColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={footerTextColor}
                    onChange={(e) => setFooterTextColor(e.target.value)}
                    placeholder="#666666"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="header" className="space-y-4">
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label>Include Patient ID Barcode</Label>
                <Switch checked={barcodeEnabled} onCheckedChange={setBarcodeEnabled} />
              </div>

              <div className="flex items-center justify-between">
                <Label>Use my own letterhead</Label>
                <Switch checked={useOwnLetterhead} onCheckedChange={setUseOwnLetterhead} />
              </div>
              {useOwnLetterhead && (
                <p className="text-sm text-muted-foreground">
                  Enable this if you plan to print on pre-printed stationery. The exported letterhead area will be empty.
                </p>
              )}
            </Card>

            {!useOwnLetterhead && (
              <>
                <div className="space-y-2">
                  <Label>Header Background Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="color"
                      value={headerBackgroundColor}
                      onChange={(e) => setHeaderBackgroundColor(e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={headerBackgroundColor}
                      onChange={(e) => setHeaderBackgroundColor(e.target.value)}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Show Footer Line</Label>
                  <Switch checked={footerLineEnabled} onCheckedChange={setFooterLineEnabled} />
                </div>

                <div className="space-y-2">
                  <Label>Header Line Spacing (pt)</Label>
                  <Input
                    type="number"
                    value={headerLineSpacing}
                    onChange={(e) => setHeaderLineSpacing(e.target.value)}
                    min="4"
                    max="12"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Left Panel</Label>
                    {headerLeftLines.map((line, index) => (
                      <div key={`left-${index}`} className="space-y-2 p-2 border rounded">
                        <Input
                          placeholder={`Line ${index + 1}`}
                          value={line.text}
                          onChange={(e) => updateHeaderLine("left", index, { text: e.target.value })}
                        />
                        <div className="flex gap-2 items-center">
                          <Button
                            type="button"
                            size="sm"
                            variant={line.bold ? "default" : "outline"}
                            onClick={() => updateHeaderLine("left", index, { bold: !line.bold })}
                          >
                            <Bold className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={line.underline ? "default" : "outline"}
                            onClick={() => updateHeaderLine("left", index, { underline: !line.underline })}
                          >
                            <Underline className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            className="w-20"
                            placeholder="Size"
                            value={line.fontSize}
                            onChange={(e) => updateHeaderLine("left", index, { fontSize: parseInt(e.target.value) || 12 })}
                            min="8"
                            max="24"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Right Panel</Label>
                    {headerRightLines.map((line, index) => (
                      <div key={`right-${index}`} className="space-y-2 p-2 border rounded">
                        <Input
                          placeholder={`Line ${index + 1}`}
                          value={line.text}
                          onChange={(e) => updateHeaderLine("right", index, { text: e.target.value })}
                        />
                        <div className="flex gap-2 items-center">
                          <Button
                            type="button"
                            size="sm"
                            variant={line.bold ? "default" : "outline"}
                            onClick={() => updateHeaderLine("right", index, { bold: !line.bold })}
                          >
                            <Bold className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={line.underline ? "default" : "outline"}
                            onClick={() => updateHeaderLine("right", index, { underline: !line.underline })}
                          >
                            <Underline className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            className="w-20"
                            placeholder="Size"
                            value={line.fontSize}
                            onChange={(e) => updateHeaderLine("right", index, { fontSize: parseInt(e.target.value) || 12 })}
                            min="8"
                            max="24"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="logo" className="space-y-4">
            <Card className="p-4 space-y-4">
              <div className="space-y-2">
                <Label>Upload Logo</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="flex-1"
                  />
                  {(logoPreview || logoPath) && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={handleRemoveLogo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Recommended: PNG or JPG, max 2MB. Logo will appear in prescription header.
                </p>
              </div>

              {logoPreview && (
                <div className="space-y-2">
                  <Label>Logo Preview</Label>
                  <div className="border rounded p-4 bg-muted/50 flex justify-center">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      style={{ 
                        width: `${logoWidth}px`, 
                        height: `${logoHeight}px`,
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Logo Position</Label>
                <Select value={logoPosition} onValueChange={setLogoPosition}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top-left">Top Left</SelectItem>
                    <SelectItem value="top-center">Top Center</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Logo Width (px)</Label>
                  <Input
                    type="number"
                    value={logoWidth}
                    onChange={(e) => setLogoWidth(e.target.value)}
                    min="20"
                    max="200"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Logo Height (px)</Label>
                  <Input
                    type="number"
                    value={logoHeight}
                    onChange={(e) => setLogoHeight(e.target.value)}
                    min="20"
                    max="200"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="signature" className="space-y-4">
            <Card className="p-4 space-y-4">
              <div className="space-y-2">
                <Label>Upload Digital Signature</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="flex-1"
                  />
                  {(signaturePreview || signaturePath) && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={handleRemoveSignature}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Recommended: PNG with transparent background, max 2MB. Signature will appear at the bottom of prescription.
                </p>
              </div>

              {signaturePreview && (
                <div className="space-y-2">
                  <Label>Signature Preview</Label>
                  <div className="border rounded p-4 bg-muted/50 flex justify-center">
                    <img
                      src={signaturePreview}
                      alt="Signature preview"
                      style={{ 
                        width: `${signatureWidth}px`, 
                        height: `${signatureHeight}px`,
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Signature Position</Label>
                <Select value={signaturePosition} onValueChange={setSignaturePosition}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="bottom-center">Bottom Center</SelectItem>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Signature Width (px)</Label>
                  <Input
                    type="number"
                    value={signatureWidth}
                    onChange={(e) => setSignatureWidth(e.target.value)}
                    min="40"
                    max="200"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Signature Height (px)</Label>
                  <Input
                    type="number"
                    value={signatureHeight}
                    onChange={(e) => setSignatureHeight(e.target.value)}
                    min="20"
                    max="150"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="border rounded-lg p-4 bg-background">
              <div className="text-sm text-muted-foreground mb-4">Preview of prescription layout:</div>
              
              {/* Header Preview */}
              {!useOwnLetterhead && (
                <div 
                  className="p-4 mb-4 rounded"
                  style={{ backgroundColor: headerBackgroundColor }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div style={{ fontFamily: headerFont }}>
                      {headerLeftLines.map((line, index) => (
                        line.text && (
                          <div
                            key={`preview-left-${index}`}
                            style={{
                              fontSize: `${line.fontSize}px`,
                              fontWeight: line.bold ? 'bold' : 'normal',
                              textDecoration: line.underline ? 'underline' : 'none',
                              marginBottom: `${headerLineSpacing}px`,
                            }}
                          >
                            {line.text}
                          </div>
                        )
                      ))}
                    </div>
                    <div style={{ fontFamily: headerFont, textAlign: 'right' }}>
                      {headerRightLines.map((line, index) => (
                        line.text && (
                          <div
                            key={`preview-right-${index}`}
                            style={{
                              fontSize: `${line.fontSize}px`,
                              fontWeight: line.bold ? 'bold' : 'normal',
                              textDecoration: line.underline ? 'underline' : 'none',
                              marginBottom: `${headerLineSpacing}px`,
                            }}
                          >
                            {line.text}
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                  {barcodeEnabled && (
                    <div className="mt-4 flex justify-center">
                      <div className="text-xs text-muted-foreground border px-4 py-2 rounded">
                        [Patient ID Barcode]
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Body Preview */}
              <div 
                className="p-4 min-h-[200px] rounded border"
                style={{ 
                  fontFamily: bodyFont,
                  fontSize: `${bodyFontSize}px`,
                  color: bodyTextColor,
                }}
              >
                <div className="mb-2">
                  <strong>Patient Name:</strong> Sample Patient
                </div>
                <div className="mb-4">
                  <strong>Date:</strong> {new Date().toLocaleDateString()}
                </div>
                <div>
                  <strong>Prescription:</strong>
                  <div className="mt-2">
                    This is a sample prescription text to show how your body content will appear with the selected font, size, and color.
                  </div>
                </div>
              </div>

              {/* Footer Preview */}
              <div className="mt-4">
                {footerLineEnabled && (
                  <div className="border-t border-border mb-2"></div>
                )}
                <div 
                  className="text-center"
                  style={{ 
                    fontSize: `${footerFontSize}px`,
                    color: footerTextColor,
                  }}
                >
                  Generated on {new Date().toLocaleString()} | Patient ID: SAMPLE-001
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={saveSettings} disabled={loading}>
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
