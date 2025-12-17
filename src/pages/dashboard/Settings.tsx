import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Settings as SettingsIcon, Bell, Globe, Clock, Loader2, ArrowLeft, Moon, Sun, Monitor, Smartphone } from "lucide-react";
import { usePresetMobilePresentation } from "@/hooks/usePresetMobilePresentation";

interface UserSettings {
  id?: string;
  user_id: string;
  theme: string;
  email_notifications: boolean;
  appointment_reminders: boolean;
  reminder_time: number;
  language: string;
  date_format: string;
  time_format: string;
}

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { presentation, setPresentation } = usePresetMobilePresentation();
  const [settings, setSettings] = useState<UserSettings>({
    user_id: "",
    theme: "system",
    email_notifications: true,
    appointment_reminders: true,
    reminder_time: 24,
    language: "en",
    date_format: "MM/dd/yyyy",
    time_format: "12h",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      setUser(user);

      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setSettings(data);
      } else {
        setSettings({
          user_id: user.id,
          theme: "system",
          email_notifications: true,
          appointment_reminders: true,
          reminder_time: 24,
          language: "en",
          date_format: "MM/dd/yyyy",
          time_format: "12h",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { data: existing } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_settings")
          .update({
            theme: settings.theme,
            email_notifications: settings.email_notifications,
            appointment_reminders: settings.appointment_reminders,
            reminder_time: settings.reminder_time,
            language: settings.language,
            date_format: settings.date_format,
            time_format: settings.time_format,
          })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_settings")
          .insert({
            user_id: user.id,
            theme: settings.theme,
            email_notifications: settings.email_notifications,
            appointment_reminders: settings.appointment_reminders,
            reminder_time: settings.reminder_time,
            language: settings.language,
            date_format: settings.date_format,
            time_format: settings.time_format,
          });

        if (error) throw error;
      }

      toast.success("Settings saved successfully");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your application preferences</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Appearance Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize how the app looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Theme</Label>
              <div className="flex gap-3">
                <Button
                  variant={settings.theme === "light" ? "default" : "outline"}
                  className="flex-1 gap-2"
                  onClick={() => setSettings({ ...settings, theme: "light" })}
                >
                  <Sun className="h-4 w-4" />
                  Light
                </Button>
                <Button
                  variant={settings.theme === "dark" ? "default" : "outline"}
                  className="flex-1 gap-2"
                  onClick={() => setSettings({ ...settings, theme: "dark" })}
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </Button>
                <Button
                  variant={settings.theme === "system" ? "default" : "outline"}
                  className="flex-1 gap-2"
                  onClick={() => setSettings({ ...settings, theme: "system" })}
                >
                  <Monitor className="h-4 w-4" />
                  System
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preset Dialogs (Mobile) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Preset Dialogs (Mobile)
            </CardTitle>
            <CardDescription>Choose how long preset lists open on small screens</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Full-screen drawer on mobile</Label>
                <p className="text-sm text-muted-foreground">
                  Makes long lists easier to scroll and keeps actions always reachable.
                </p>
              </div>
              <Switch
                checked={presentation === "drawer"}
                onCheckedChange={(checked) => setPresentation(checked ? "drawer" : "modal")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Configure how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive important updates via email
                </p>
              </div>
              <Switch
                checked={settings.email_notifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, email_notifications: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Appointment Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Send reminder emails for upcoming appointments
                </p>
              </div>
              <Switch
                checked={settings.appointment_reminders}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, appointment_reminders: checked })
                }
              />
            </div>
            {settings.appointment_reminders && (
              <div className="space-y-2">
                <Label>Reminder Time</Label>
                <Select
                  value={settings.reminder_time.toString()}
                  onValueChange={(value) =>
                    setSettings({ ...settings, reminder_time: parseInt(value) })
                  }
                >
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour before</SelectItem>
                    <SelectItem value="2">2 hours before</SelectItem>
                    <SelectItem value="6">6 hours before</SelectItem>
                    <SelectItem value="12">12 hours before</SelectItem>
                    <SelectItem value="24">24 hours before</SelectItem>
                    <SelectItem value="48">48 hours before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Regional Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Regional Settings
            </CardTitle>
            <CardDescription>Set your locale and format preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) => setSettings({ ...settings, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="bn">Bengali</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Date Format
                </Label>
                <Select
                  value={settings.date_format}
                  onValueChange={(value) => setSettings({ ...settings, date_format: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                    <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                    <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                    <SelectItem value="dd-MMM-yyyy">DD-MMM-YYYY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time Format</Label>
                <Select
                  value={settings.time_format}
                  onValueChange={(value) => setSettings({ ...settings, time_format: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                    <SelectItem value="24h">24 Hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Account
            </CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border rounded-lg">
              <div>
                <p className="font-medium">Email Address</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Change Email
              </Button>
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border rounded-lg">
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted-foreground">Last changed: Unknown</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  supabase.auth.resetPasswordForEmail(user?.email || "", {
                    redirectTo: `${window.location.origin}/login`,
                  });
                  toast.success("Password reset email sent");
                }}
              >
                Reset Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default Settings;

