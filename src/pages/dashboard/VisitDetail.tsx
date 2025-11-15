import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileText, Pill, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Visit {
  id: string;
  visit_date: string;
  visit_type: string;
  reason_for_visit: string;
  status: string;
  hpi: string | null;
  ros: string | null;
  vital_signs_bp: string | null;
  vital_signs_pulse: string | null;
  vital_signs_temp: string | null;
  vital_signs_respiratory_rate: string | null;
  vital_signs_spo2: string | null;
  vital_signs_weight: string | null;
  vital_signs_height: string | null;
  vital_signs_bmi: string | null;
  vital_signs_general_appearance: string | null;
  physical_examination: string | null;
  soap_subjective: string | null;
  soap_objective: string | null;
  soap_assessment: string | null;
  soap_plan: string | null;
  prescription: string | null;
  patient_id: string;
}

interface Patient {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  medical_history_ongoing: string | null;
  ongoing_medications: string[];
  allergic_history_drug: string[];
}

interface SOAPNote {
  id: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface Prescription {
  id: string;
  content: string;
}

const VisitDetail = () => {
  const { patientId, visitId } = useParams();
  const navigate = useNavigate();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [soapData, setSOAPData] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });
  const [prescriptionContent, setPrescriptionContent] = useState("");

  useEffect(() => {
    fetchVisit();
    fetchPatient();
  }, [visitId, patientId]);

  const fetchVisit = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("visits")
        .select("*")
        .eq("id", visitId)
        .single();

      if (error) throw error;
      setVisit(data);
      
      // Load SOAP data and prescription from visit
      if (data) {
        setSOAPData({
          subjective: data.soap_subjective || "",
          objective: data.soap_objective || "",
          assessment: data.soap_assessment || "",
          plan: data.soap_plan || "",
        });
        setPrescriptionContent(data.prescription || "");
      }
    } catch (error: any) {
      toast.error("Failed to load visit");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatient = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("patients")
        .select("first_name, last_name, date_of_birth, gender, medical_history_ongoing, ongoing_medications, allergic_history_drug")
        .eq("id", patientId)
        .single();

      if (error) throw error;
      setPatient(data);
    } catch (error: any) {
      console.error(error);
    }
  };

  const fetchSOAPNote = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("soap_notes")
        .select("*")
        .eq("visit_id", visitId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSOAPNote(data);
        setSOAPData({
          subjective: data.subjective,
          objective: data.objective,
          assessment: data.assessment,
          plan: data.plan,
        });
      } else {
        // Auto-populate Subjective and Objective from visit data
        buildSOAPFromVisit();
      }
    } catch (error: any) {
      console.error(error);
    }
  };

  const fetchPrescription = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("prescriptions")
        .select("*")
        .eq("visit_id", visitId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setPrescription(data);
        setPrescriptionContent(data.content);
      }
    } catch (error: any) {
      console.error(error);
    }
  };

  const buildSOAPFromVisit = () => {
    if (!visit || !patient) return;

    // Build Subjective section
    let subjective = `PATIENT: ${patient.first_name} ${patient.last_name}, ${calculateAge(patient.date_of_birth)}yo ${patient.gender}\n\n`;
    subjective += `CHIEF COMPLAINT: ${visit.chief_complaint}\n\n`;
    
    if (visit.history_of_present_illness) {
      subjective += `HISTORY OF PRESENT ILLNESS:\n${visit.history_of_present_illness}\n\n`;
    }
    
    if (visit.duration || visit.onset || visit.severity) {
      subjective += `SYMPTOM ANALYSIS:\n`;
      if (visit.duration) subjective += `Duration: ${visit.duration}\n`;
      if (visit.onset) subjective += `Onset: ${visit.onset}\n`;
      if (visit.severity) subjective += `Severity: ${visit.severity}\n`;
      subjective += `\n`;
    }
    
    if (patient.medical_history_ongoing) {
      subjective += `PAST MEDICAL HISTORY:\n${patient.medical_history_ongoing}\n\n`;
    }
    
    if (patient.ongoing_medications && patient.ongoing_medications.length > 0) {
      subjective += `CURRENT MEDICATIONS:\n${patient.ongoing_medications.join(", ")}\n\n`;
    }
    
    if (patient.allergic_history_drug && patient.allergic_history_drug.length > 0) {
      subjective += `ALLERGIES:\n${patient.allergic_history_drug.join(", ")}\n\n`;
    }
    
    if (visit.review_of_systems) {
      subjective += `REVIEW OF SYSTEMS:\n${visit.review_of_systems}`;
    }

    // Build Objective section
    let objective = "";
    
    if (visit.vital_signs) {
      objective += `VITAL SIGNS:\n`;
      if (visit.vital_signs.bp) objective += `Blood Pressure: ${visit.vital_signs.bp} mmHg\n`;
      if (visit.vital_signs.pulse) objective += `Pulse: ${visit.vital_signs.pulse} bpm\n`;
      if (visit.vital_signs.temp) objective += `Temperature: ${visit.vital_signs.temp} °F\n`;
      if (visit.vital_signs.resp) objective += `Respiratory Rate: ${visit.vital_signs.resp} /min\n`;
      if (visit.vital_signs.spo2) objective += `SpO2: ${visit.vital_signs.spo2}%\n`;
      if (visit.vital_signs.weight) objective += `Weight: ${visit.vital_signs.weight} kg\n`;
      if (visit.vital_signs.height) objective += `Height: ${visit.vital_signs.height} cm\n`;
      objective += `\n`;
    }
    
    if (visit.general_appearance) {
      objective += `GENERAL APPEARANCE:\n${visit.general_appearance}\n\n`;
    }
    
    if (visit.physical_examination) {
      objective += `PHYSICAL EXAMINATION:\n${visit.physical_examination}`;
    }

    setSOAPData({
      subjective,
      objective,
      assessment: "",
      plan: "",
    });
  };

  const handleSaveSOAP = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (soapNote) {
        // Update existing
        const { error } = await (supabase as any)
          .from("soap_notes")
          .update(soapData)
          .eq("id", soapNote.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await (supabase as any)
          .from("soap_notes")
          .insert([
            {
              visit_id: visitId,
              user_id: user.id,
              ...soapData,
            },
          ]);

        if (error) throw error;
      }

      toast.success("SOAP note saved successfully!");
      fetchSOAPNote();
    } catch (error: any) {
      toast.error(error.message || "Failed to save SOAP note");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWithAI = async () => {
    setLoading(true);
    toast.info("Generating with AI... This may take a moment.");

    try {
      const response = await (supabase as any).functions.invoke("generate-soap", {
        body: {
          visitId,
          patientId,
          subjective: soapData.subjective,
          objective: soapData.objective,
          patientHistory: patient?.medical_history_ongoing || "",
          currentMedications: patient?.ongoing_medications || [],
          allergies: patient?.allergic_history_drug || [],
        },
      });

      if (response.error) throw response.error;

      const aiResult = response.data;
      const updatedSOAPData = {
        subjective: aiResult.enhancedSubjective || soapData.subjective,
        objective: aiResult.enhancedObjective || soapData.objective,
        assessment: aiResult.assessment,
        plan: aiResult.plan,
      };

      setSOAPData(updatedSOAPData);

      // Auto-save
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await (supabase as any)
        .from("soap_notes")
        .upsert([
          {
            visit_id: visitId,
            user_id: user.id,
            ...updatedSOAPData,
          },
        ]);

      if (error) throw error;

      toast.success("AI-generated SOAP note saved!");
      fetchSOAPNote();
    } catch (error: any) {
      toast.error(error.message || "Failed to generate with AI");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrescription = async () => {
    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from("visits")
        .update({
          prescription: prescriptionContent,
        })
        .eq("id", visitId);

      if (error) throw error;

      toast.success("Prescription saved successfully!");
      fetchVisit();
    } catch (error: any) {
      toast.error(error.message || "Failed to save prescription");
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
        <p className="text-muted-foreground">Loading visit...</p>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Visit not found</p>
        <Button onClick={() => navigate(`/dashboard/patients/${patientId}`)} className="mt-4">
          Back to Patient
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate(`/dashboard/patients/${patientId}`)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Patient
      </Button>

      {/* Visit Header */}
      <Card className="p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">{visit.reason_for_visit}</h2>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>{new Date(visit.visit_date).toLocaleDateString()}</span>
              <span>•</span>
              <span>{visit.visit_type}</span>
              <span>•</span>
              <span className={`font-medium ${visit.status === "completed" ? "text-success" : "text-warning"}`}>
                {visit.status}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs for SOAP Note and Prescription */}
      <Tabs defaultValue="soap" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="soap">
            <FileText className="h-4 w-4 mr-2" />
            SOAP Note
          </TabsTrigger>
          <TabsTrigger value="prescription">
            <Pill className="h-4 w-4 mr-2" />
            Prescription
          </TabsTrigger>
        </TabsList>

        {/* SOAP Note Tab */}
        <TabsContent value="soap" className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subjective" className="text-lg font-semibold">
                Subjective (Pre-filled from visit + patient data)
              </Label>
              <Textarea
                id="subjective"
                value={soapData.subjective}
                onChange={(e) => setSOAPData({ ...soapData, subjective: e.target.value })}
                rows={12}
                className="font-mono text-sm bg-soap-subjective border-soap-subjectiveBorder"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="objective" className="text-lg font-semibold">
                Objective (Pre-filled from examination data)
              </Label>
              <Textarea
                id="objective"
                value={soapData.objective}
                onChange={(e) => setSOAPData({ ...soapData, objective: e.target.value })}
                rows={10}
                className="font-mono text-sm bg-soap-objective border-soap-objectiveBorder"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assessment" className="text-lg font-semibold">
                Assessment (Enter manually or generate with AI)
              </Label>
              <Textarea
                id="assessment"
                value={soapData.assessment}
                onChange={(e) => setSOAPData({ ...soapData, assessment: e.target.value })}
                rows={8}
                className="font-mono text-sm bg-soap-assessment border-soap-assessmentBorder"
                placeholder="Differential diagnosis and clinical reasoning..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan" className="text-lg font-semibold">
                Plan (Treatment, medications, follow-up)
              </Label>
              <Textarea
                id="plan"
                value={soapData.plan}
                onChange={(e) => setSOAPData({ ...soapData, plan: e.target.value })}
                rows={8}
                className="font-mono text-sm bg-soap-plan border-soap-planBorder"
                placeholder="Treatment plan, medications, lifestyle modifications, follow-up..."
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSaveSOAP} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Only
              </Button>
              <Button onClick={handleGenerateWithAI} disabled={loading} variant="default" className="bg-accent hover:bg-accent/90">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate with AI
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              AI will enhance Subjective & Objective, then generate Assessment & Plan using patient context
            </p>
          </div>
        </TabsContent>

        {/* Prescription Tab */}
        <TabsContent value="prescription" className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prescription" className="text-lg font-semibold">
                Prescription Content
              </Label>
              <Textarea
                id="prescription"
                value={prescriptionContent}
                onChange={(e) => setPrescriptionContent(e.target.value)}
                rows={20}
                className="font-mono text-sm"
                placeholder="Enter prescription details including medications, dosages, duration, and instructions..."
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSavePrescription} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Prescription
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VisitDetail;
