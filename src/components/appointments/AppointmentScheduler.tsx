import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface AppointmentSchedulerProps {
  onDataChange: (data: { date: string; time: string; reason: string } | null) => void;
}

export function AppointmentScheduler({ onDataChange }: AppointmentSchedulerProps) {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>("");
  const [reason, setReason] = useState("");
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Fetch appointment settings and generate time slots
  useEffect(() => {
    const fetchSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("appointment_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setSettings(data);
        generateTimeSlots(data);
      } else {
        // Default settings
        const defaultSettings = {
          start_time: "09:00",
          end_time: "17:00",
          slot_duration: 30,
          working_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        };
        setSettings(defaultSettings);
        generateTimeSlots(defaultSettings);
      }
    };

    fetchSettings();
  }, []);

  // Fetch booked slots when date changes
  useEffect(() => {
    if (date) {
      fetchBookedSlots(format(date, "yyyy-MM-dd"));
    }
  }, [date]);

  const generateTimeSlots = (config: any) => {
    const slots: string[] = [];
    const [startHour, startMin] = config.start_time.split(":").map(Number);
    const [endHour, endMin] = config.end_time.split(":").map(Number);
    const duration = config.slot_duration;

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      // Skip break time if configured
      const currentTime = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`;
      
      if (config.break_start_time && config.break_end_time) {
        if (currentTime >= config.break_start_time && currentTime < config.break_end_time) {
          currentMin += duration;
          if (currentMin >= 60) {
            currentHour += Math.floor(currentMin / 60);
            currentMin = currentMin % 60;
          }
          continue;
        }
      }

      slots.push(currentTime);

      currentMin += duration;
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60);
        currentMin = currentMin % 60;
      }
    }

    setTimeSlots(slots);
  };

  const fetchBookedSlots = async (selectedDate: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("appointments")
      .select("appointment_time")
      .eq("user_id", user.id)
      .eq("appointment_date", selectedDate);

    if (data) {
      setBookedSlots(data.map((apt) => apt.appointment_time));
    }
  };

  const isDayDisabled = (date: Date) => {
    if (!settings) return false;
    const dayName = format(date, "EEEE");
    return !settings.working_days.includes(dayName);
  };

  useEffect(() => {
    if (date && time && reason.trim()) {
      onDataChange({
        date: format(date, "yyyy-MM-dd"),
        time,
        reason: reason.trim(),
      });
    } else {
      onDataChange(null);
    }
  }, [date, time, reason, onDataChange]);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Schedule Appointment</h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Appointment Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={isDayDisabled}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {date && (
          <div className="space-y-2">
            <Label>Appointment Time *</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select time slot">
                  {time && (
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      {time}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem
                    key={slot}
                    value={slot}
                    disabled={bookedSlots.includes(slot)}
                  >
                    {slot} {bookedSlots.includes(slot) && "(Booked)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="reason">Reason for Visit *</Label>
          <Textarea
            id="reason"
            placeholder="Enter reason for appointment..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
      </div>
    </Card>
  );
}
