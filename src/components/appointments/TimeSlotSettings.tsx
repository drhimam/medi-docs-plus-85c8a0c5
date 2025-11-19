import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TimeSlotSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function TimeSlotSettings({ open, onOpenChange }: TimeSlotSettingsProps) {
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [slotDuration, setSlotDuration] = useState(30);
  const [workingDays, setWorkingDays] = useState<string[]>([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ]);
  const [breakStartTime, setBreakStartTime] = useState("");
  const [breakEndTime, setBreakEndTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open]);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("appointment_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettingsId(data.id);
        setStartTime(data.start_time);
        setEndTime(data.end_time);
        setSlotDuration(data.slot_duration);
        setWorkingDays(data.working_days as string[]);
        setBreakStartTime(data.break_start_time || "");
        setBreakEndTime(data.break_end_time || "");
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleSave = async () => {
    if (workingDays.length === 0) {
      toast.error("Please select at least one working day");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const settingsData = {
        user_id: user.id,
        start_time: startTime,
        end_time: endTime,
        slot_duration: slotDuration,
        working_days: workingDays,
        break_start_time: breakStartTime || null,
        break_end_time: breakEndTime || null,
      };

      if (settingsId) {
        const { error } = await supabase
          .from("appointment_settings")
          .update(settingsData)
          .eq("id", settingsId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("appointment_settings")
          .insert(settingsData);

        if (error) throw error;
      }

      toast.success("Settings saved successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: string) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Time Slot Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="slot_duration">Slot Duration (minutes)</Label>
                <Input
                  id="slot_duration"
                  type="number"
                  min="15"
                  step="15"
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(Number(e.target.value))}
                />
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-4">
            <Label>Working Days</Label>
            <div className="grid grid-cols-2 gap-3">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={day}
                    checked={workingDays.includes(day)}
                    onCheckedChange={() => toggleDay(day)}
                  />
                  <Label htmlFor={day} className="cursor-pointer">
                    {day}
                  </Label>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 space-y-4">
            <Label>Break Time (Optional)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="break_start">Break Start</Label>
                <Input
                  id="break_start"
                  type="time"
                  value={breakStartTime}
                  onChange={(e) => setBreakStartTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="break_end">Break End</Label>
                <Input
                  id="break_end"
                  type="time"
                  value={breakEndTime}
                  onChange={(e) => setBreakEndTime(e.target.value)}
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
