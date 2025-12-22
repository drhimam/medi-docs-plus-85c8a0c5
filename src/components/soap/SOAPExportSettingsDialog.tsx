import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload, X } from "lucide-react";

interface SOAPExportSettings {
  id?: string;
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

interface SOAPExportSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SOAPExportSettingsDialog({ open, onOpenChange }: SOAPExportSettingsDialogProps) {
  const [settings, setSettings] = useState<SOAPExportSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open]);

  const fetchSettings = async () => {
    setIsLoading(true);
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
        if (data.logo_path) {
          const { data: logoData } = await supabase.storage
            .from("prescription-logos")
            .createSignedUrl(data.logo_path, 3600);
          if (logoData?.signedUrl) {
            setLogoPreview(logoData.signedUrl);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("soap_export_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("soap_export_settings")
          .update(settings)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("soap_export_settings")
          .insert({ ...settings, user_id: user.id });
        if (error) throw error;
      }

      toast({ title: "Settings saved", description: "SOAP export settings updated successfully" });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/soap-logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("prescription-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      setSettings(prev => ({ ...prev, logo_path: filePath, logo_enabled: true }));
      
      const { data: signedUrl } = await supabase.storage
        .from("prescription-logos")
        .createSignedUrl(filePath, 3600);
      
      if (signedUrl?.signedUrl) {
        setLogoPreview(signedUrl.signedUrl);
      }

      toast({ title: "Logo uploaded", description: "Logo uploaded successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleRemoveLogo = () => {
    setSettings(prev => ({ ...prev, logo_path: null, logo_enabled: false }));
    setLogoPreview(null);
  };

  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>SOAP PDF Export Settings</DialogTitle>
          <DialogDescription>
            Customize the appearance of your SOAP note PDF exports
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="header" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="header">Header</TabsTrigger>
              <TabsTrigger value="sections">Sections</TabsTrigger>
              <TabsTrigger value="body">Body</TabsTrigger>
              <TabsTrigger value="footer">Footer</TabsTrigger>
            </TabsList>

            <TabsContent value="header" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Header Title</Label>
                <Input
                  value={settings.header_title}
                  onChange={(e) => setSettings(prev => ({ ...prev, header_title: e.target.value }))}
                  placeholder="SOAP NOTE"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Header Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.header_background_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, header_background_color: e.target.value }))}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={settings.header_background_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, header_background_color: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Header Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.header_text_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, header_text_color: e.target.value }))}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={settings.header_text_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, header_text_color: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <Label>Logo</Label>
                  <Switch
                    checked={settings.logo_enabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, logo_enabled: checked }))}
                  />
                </div>

                {settings.logo_enabled && (
                  <>
                    <div className="flex items-center gap-4">
                      {logoPreview ? (
                        <div className="relative">
                          <img src={logoPreview} alt="Logo" className="h-16 object-contain border rounded" />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={handleRemoveLogo}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-2 cursor-pointer border rounded-lg p-4 hover:bg-muted/50">
                          <Upload className="h-5 w-5" />
                          <span>Upload Logo</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        </label>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Logo Width (mm)</Label>
                        <Input
                          type="number"
                          value={settings.logo_width}
                          onChange={(e) => setSettings(prev => ({ ...prev, logo_width: parseInt(e.target.value) || 50 }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Logo Height (mm)</Label>
                        <Input
                          type="number"
                          value={settings.logo_height}
                          onChange={(e) => setSettings(prev => ({ ...prev, logo_height: parseInt(e.target.value) || 30 }))}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="sections" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">Customize section header colors</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: settings.subjective_color }}></span>
                    Subjective
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.subjective_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, subjective_color: e.target.value }))}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={settings.subjective_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, subjective_color: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: settings.objective_color }}></span>
                    Objective
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.objective_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, objective_color: e.target.value }))}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={settings.objective_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, objective_color: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: settings.assessment_color }}></span>
                    Assessment
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.assessment_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, assessment_color: e.target.value }))}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={settings.assessment_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, assessment_color: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: settings.plan_color }}></span>
                    Plan
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.plan_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, plan_color: e.target.value }))}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={settings.plan_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, plan_color: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="body" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Font</Label>
                  <Select
                    value={settings.body_font}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, body_font: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="helvetica">Helvetica</SelectItem>
                      <SelectItem value="times">Times New Roman</SelectItem>
                      <SelectItem value="courier">Courier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Font Size</Label>
                  <Select
                    value={settings.body_font_size.toString()}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, body_font_size: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">8pt</SelectItem>
                      <SelectItem value="9">9pt</SelectItem>
                      <SelectItem value="10">10pt</SelectItem>
                      <SelectItem value="11">11pt</SelectItem>
                      <SelectItem value="12">12pt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Body Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={settings.body_text_color}
                    onChange={(e) => setSettings(prev => ({ ...prev, body_text_color: e.target.value }))}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={settings.body_text_color}
                    onChange={(e) => setSettings(prev => ({ ...prev, body_text_color: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="footer" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label>Enable Footer</Label>
                <Switch
                  checked={settings.footer_enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, footer_enabled: checked }))}
                />
              </div>

              {settings.footer_enabled && (
                <>
                  <div className="space-y-2">
                    <Label>Custom Footer Text (optional)</Label>
                    <Input
                      value={settings.footer_text || ""}
                      onChange={(e) => setSettings(prev => ({ ...prev, footer_text: e.target.value || null }))}
                      placeholder="Leave empty for default (page number and date)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Footer Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.footer_text_color}
                        onChange={(e) => setSettings(prev => ({ ...prev, footer_text_color: e.target.value }))}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={settings.footer_text_color}
                        onChange={(e) => setSettings(prev => ({ ...prev, footer_text_color: e.target.value }))}
                      />
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}