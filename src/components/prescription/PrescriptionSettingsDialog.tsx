import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Bold, Underline } from "lucide-react";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prescription Export Options</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="export">Export Settings</TabsTrigger>
            <TabsTrigger value="header">Header Settings</TabsTrigger>
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
