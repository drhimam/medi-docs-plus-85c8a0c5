import { useState, useEffect } from "react";
import { Save, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NewPatientForm } from "./NewPatientForm";
import { ExistingPatientSearch } from "./ExistingPatientSearch";
import { AppointmentScheduler } from "./AppointmentScheduler";
import { TimeSlotSettings } from "./TimeSlotSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  preselectedPatientId?: string | null;
}

export function AddAppointmentDialog({
  open,
  onOpenChange,
  onSuccess,
  preselectedPatientId = null,
}: AddAppointmentDialogProps) {
  const [patientType, setPatientType] = useState<"new" | "existing">("existing");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(preselectedPatientId);
  const [newPatientData, setNewPatientData] = useState<any>(null);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);

  // Update selectedPatientId when preselectedPatientId changes
  useEffect(() => {
    if (preselectedPatientId) {
      setSelectedPatientId(preselectedPatientId);
      setPatientType("existing");
    }
  }, [preselectedPatientId]);

  const handleClose = () => {
    setPatientType("existing");
    setSelectedPatientId(preselectedPatientId);
    setNewPatientData(null);
    setAppointmentData(null);
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!appointmentData || (!selectedPatientId && !newPatientData)) {
      toast.error("Please complete all required fields");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let patientId = selectedPatientId;

      // Create new patient if needed
      if (patientType === "new" && newPatientData) {
        const { data: patient, error: patientError } = await supabase
          .from("patients")
          .insert({
            first_name: newPatientData.first_name,
            last_name: newPatientData.last_name,
            date_of_birth: newPatientData.date_of_birth,
            gender: newPatientData.gender,
            contact_number: newPatientData.contact_number,
            email: newPatientData.email || null,
            address: newPatientData.address || null,
            health_card_number: newPatientData.health_card_number || null,
            smoking_status: newPatientData.smoking_status || "NEVER",
            alcohol_consumption: newPatientData.alcohol_consumption || "NEVER",
            birth_history: newPatientData.birth_history || null,
            developmental_history: newPatientData.developmental_history || null,
            childhood_illnesses: newPatientData.childhood_illnesses || null,
            accidents_injuries: newPatientData.accidents_injuries || null,
            menstrual_pregnancy_history: newPatientData.menstrual_pregnancy_history || null,
            preventive_screening_history: newPatientData.preventive_screening_history || null,
            user_id: user.id,
            completion_status: "incomplete",
          })
          .select()
          .single();

        if (patientError) {
          console.error("Patient creation error:", patientError);
          throw new Error(`Failed to create patient: ${patientError.message}`);
        }
        patientId = patient.id;
      }

      if (!patientId) throw new Error("Patient ID is required");

      // Check for duplicate appointment
      const { data: existingAppointment } = await supabase
        .from("appointments")
        .select("id")
        .eq("user_id", user.id)
        .eq("appointment_date", appointmentData.date)
        .eq("appointment_time", appointmentData.time)
        .maybeSingle();

      if (existingAppointment) {
        toast.error("An appointment already exists at this time slot");
        setSaving(false);
        return;
      }

      // Create appointment
      const { data: newAppointment, error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          user_id: user.id,
          patient_id: patientId,
          appointment_date: appointmentData.date,
          appointment_time: appointmentData.time,
          reason: appointmentData.reason,
          status: "scheduled",
        })
        .select()
        .single();

      if (appointmentError) {
        console.error("Appointment creation error:", appointmentError);
        throw new Error(`Failed to create appointment: ${appointmentError.message}`);
      }

      // Send confirmation email
      try {
        await supabase.functions.invoke("send-appointment-confirmation", {
          body: { appointmentId: newAppointment.id },
        });
        console.log("Confirmation email sent");
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the appointment creation if email fails
      }

      toast.success("Appointment created successfully");
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error("Error saving appointment:", error);
      toast.error(error.message || "Failed to save appointment");
    } finally {
      setSaving(false);
    }
  };

  if (showSettings) {
    return (
      <TimeSlotSettings
        open={open}
        onOpenChange={(open) => {
          if (!open) setShowSettings(false);
        }}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle>Add Appointment</DialogTitle>
          <TooltipProvider delayDuration={300}>
            <div className="flex items-center gap-2 pr-8">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowSettings(true)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Settings</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="icon"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{saving ? "Saving..." : "Save"}</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Patient Type Selection */}
          <div className="space-y-4">
            <Label>Patient Type</Label>
            <RadioGroup
              value={patientType}
              onValueChange={(value) => {
                setPatientType(value as "new" | "existing");
                setSelectedPatientId(null);
                setNewPatientData(null);
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="existing" />
                <Label htmlFor="existing" className="cursor-pointer">
                  Existing Patient
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="new" />
                <Label htmlFor="new" className="cursor-pointer">
                  New Patient
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Patient Selection/Creation */}
          {patientType === "existing" ? (
            <ExistingPatientSearch
              selectedPatientId={selectedPatientId}
              onSelectPatient={setSelectedPatientId}
            />
          ) : (
            <NewPatientForm
              onDataChange={setNewPatientData}
            />
          )}

          {/* Appointment Scheduling */}
          {(selectedPatientId || newPatientData) && (
            <AppointmentScheduler
              onDataChange={setAppointmentData}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
