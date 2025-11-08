import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, Calendar, Activity, FileText } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  contact_number: string;
  email: string | null;
  blood_group: string | null;
  medical_history_ongoing: string | null;
  medical_history_past: string | null;
  ongoing_medications: string[];
  allergic_history_drug: string[];
  smoking_status: string;
  alcohol_consumption: string;
  occupation: string | null;
}

interface Visit {
  id: string;
  visit_date: string;
  visit_type: string;
  chief_complaint: string;
  status: string;
}

const PatientDetail = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    visit_type: "CONSULTATION",
    chief_complaint: "",
    history_of_present_illness: "",
    duration: "",
    onset: "",
    severity: "",
    vital_signs: {
      bp: "",
      pulse: "",
      temp: "",
      resp: "",
      spo2: "",
      weight: "",
      height: "",
    },
    general_appearance: "",
    physical_examination: "",
    review_of_systems: "",
  });

  useEffect(() => {
    fetchPatient();
    fetchVisits();
  }, [patientId]);

  const fetchPatient = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();

      if (error) throw error;
      setPatient(data);
    } catch (error: any) {
      toast.error("Failed to load patient");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVisits = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("visits")
        .select("*")
        .eq("patient_id", patientId)
        .order("visit_date", { ascending: false });

      if (error) throw error;
      setVisits(data || []);
    } catch (error: any) {
      console.error(error);
    }
  };

  const handleSubmitVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await (supabase as any)
        .from("visits")
        .insert([
          {
            patient_id: patientId,
            ...formData,
            vital_signs: formData.vital_signs,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        toast.success("Visit added successfully!");
        setDialogOpen(false);
        fetchVisits();
        navigate(`/dashboard/patients/${patientId}/visits/${data.id}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to add visit");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading patient...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Patient not found</p>
        <Button onClick={() => navigate("/dashboard/patients")} className="mt-4">
          Back to Patients
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate("/dashboard/patients")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Patients
      </Button>

      {/* Patient Header */}
      <Card className="p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              {patient.first_name} {patient.last_name}
            </h2>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>{calculateAge(patient.date_of_birth)} years old</span>
              <span>•</span>
              <span>{patient.gender}</span>
              <span>•</span>
              <span>{patient.contact_number}</span>
              {patient.blood_group && (
                <>
                  <span>•</span>
                  <span>Blood Group: {patient.blood_group}</span>
                </>
              )}
            </div>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Visit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Visit</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmitVisit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Visit Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="visit_type">Visit Type</Label>
                      <Select 
                        value={formData.visit_type} 
                        onValueChange={(value) => setFormData({ ...formData, visit_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CONSULTATION">Consultation</SelectItem>
                          <SelectItem value="FOLLOW_UP">Follow-up</SelectItem>
                          <SelectItem value="EMERGENCY">Emergency</SelectItem>
                          <SelectItem value="ROUTINE_CHECKUP">Routine Checkup</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="chief_complaint">Chief Complaint *</Label>
                      <Input
                        id="chief_complaint"
                        value={formData.chief_complaint}
                        onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                        placeholder="e.g., Chest pain, Fever, Headache"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">History of Present Illness</h3>
                  <Textarea
                    value={formData.history_of_present_illness}
                    onChange={(e) => setFormData({ ...formData, history_of_present_illness: e.target.value })}
                    rows={4}
                    placeholder="Describe the patient's current illness..."
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration</Label>
                      <Input
                        id="duration"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="e.g., 3 days"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="onset">Onset</Label>
                      <Input
                        id="onset"
                        value={formData.onset}
                        onChange={(e) => setFormData({ ...formData, onset: e.target.value })}
                        placeholder="e.g., Sudden"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="severity">Severity</Label>
                      <Select
                        value={formData.severity}
                        onValueChange={(value) => setFormData({ ...formData, severity: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MILD">Mild</SelectItem>
                          <SelectItem value="MODERATE">Moderate</SelectItem>
                          <SelectItem value="SEVERE">Severe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Vital Signs</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bp">Blood Pressure</Label>
                      <Input
                        id="bp"
                        value={formData.vital_signs.bp}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          vital_signs: { ...formData.vital_signs, bp: e.target.value }
                        })}
                        placeholder="120/80"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pulse">Pulse (bpm)</Label>
                      <Input
                        id="pulse"
                        value={formData.vital_signs.pulse}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          vital_signs: { ...formData.vital_signs, pulse: e.target.value }
                        })}
                        placeholder="72"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="temp">Temperature (°F)</Label>
                      <Input
                        id="temp"
                        value={formData.vital_signs.temp}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          vital_signs: { ...formData.vital_signs, temp: e.target.value }
                        })}
                        placeholder="98.6"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="spo2">SpO2 (%)</Label>
                      <Input
                        id="spo2"
                        value={formData.vital_signs.spo2}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          vital_signs: { ...formData.vital_signs, spo2: e.target.value }
                        })}
                        placeholder="98"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        value={formData.vital_signs.weight}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          vital_signs: { ...formData.vital_signs, weight: e.target.value }
                        })}
                        placeholder="70"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        value={formData.vital_signs.height}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          vital_signs: { ...formData.vital_signs, height: e.target.value }
                        })}
                        placeholder="170"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Physical Examination</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="general_appearance">General Appearance</Label>
                      <Textarea
                        id="general_appearance"
                        value={formData.general_appearance}
                        onChange={(e) => setFormData({ ...formData, general_appearance: e.target.value })}
                        rows={2}
                        placeholder="Patient appears well, alert and oriented..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="physical_examination">Physical Examination Findings</Label>
                      <Textarea
                        id="physical_examination"
                        value={formData.physical_examination}
                        onChange={(e) => setFormData({ ...formData, physical_examination: e.target.value })}
                        rows={3}
                        placeholder="Cardiovascular, Respiratory, Abdominal findings..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Visit"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Medical History Summary */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {patient.medical_history_ongoing && (
            <div>
              <h3 className="font-semibold mb-2">Ongoing Conditions</h3>
              <p className="text-sm text-muted-foreground">{patient.medical_history_ongoing}</p>
            </div>
          )}
          {patient.ongoing_medications && patient.ongoing_medications.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Current Medications</h3>
              <p className="text-sm text-muted-foreground">{patient.ongoing_medications.join(", ")}</p>
            </div>
          )}
          {patient.allergic_history_drug && patient.allergic_history_drug.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-destructive">Drug Allergies</h3>
              <p className="text-sm text-destructive">{patient.allergic_history_drug.join(", ")}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Visits Section */}
      <div>
        <h3 className="text-2xl font-bold mb-4">Visit History</h3>
        {visits.length === 0 ? (
          <Card className="p-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-semibold mb-2">No visits recorded</h4>
            <p className="text-muted-foreground mb-4">Create the first visit for this patient</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Visit
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {visits.map((visit) => (
              <Card
                key={visit.id}
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50"
                onClick={() => navigate(`/dashboard/patients/${patientId}/visits/${visit.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{visit.chief_complaint}</h4>
                      <p className="text-sm text-muted-foreground">
                        {visit.visit_type.replace("_", " ")} • {new Date(visit.visit_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      visit.status === "COMPLETED" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    }`}>
                      {visit.status}
                    </span>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetail;
