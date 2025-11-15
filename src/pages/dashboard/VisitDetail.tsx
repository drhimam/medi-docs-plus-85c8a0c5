import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileText, Pill, Save } from "lucide-react";
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
  ongoing_medications: any;
  allergic_history_drug: any;
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
    fetchData();
  }, [visitId, patientId]);

  const fetchData = async () => {
    try {
      // Fetch visit
      const { data: visitData, error: visitError } = await (supabase as any)
        .from("visits")
        .select("*")
        .eq("id", visitId)
        .single();

      if (visitError) throw visitError;
      setVisit(visitData);
      
      // Fetch patient
      const { data: patientData, error: patientError } = await (supabase as any)
        .from("patients")
        .select("first_name, last_name, date_of_birth, gender, medical_history_ongoing, ongoing_medications, allergic_history_drug")
        .eq("id", patientId)
        .single();

      if (patientError) throw patientError;
      setPatient(patientData);
      
      // Load SOAP data and prescription from visit
      if (visitData) {
        setSOAPData({
          subjective: visitData.soap_subjective || "",
          objective: visitData.soap_objective || "",
          assessment: visitData.soap_assessment || "",
          plan: visitData.soap_plan || "",
        });
        setPrescriptionContent(visitData.prescription || "");
      }
    } catch (error: any) {
      toast.error("Failed to load visit");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSOAP = async () => {
    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from("visits")
        .update({
          soap_subjective: soapData.subjective,
          soap_objective: soapData.objective,
          soap_assessment: soapData.assessment,
          soap_plan: soapData.plan,
        })
        .eq("id", visitId);

      if (error) throw error;

      toast.success("SOAP note saved successfully!");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save SOAP note");
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
      fetchData();
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
            {patient && (
              <p className="mt-2 text-sm">
                Patient: {patient.first_name} {patient.last_name}, {calculateAge(patient.date_of_birth)} years old, {patient.gender}
              </p>
            )}
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
            {/* Subjective */}
            <Card className="p-6">
              <Label className="text-lg font-semibold">Subjective</Label>
              <Textarea
                value={soapData.subjective}
                onChange={(e) => setSOAPData({ ...soapData, subjective: e.target.value })}
                className="mt-2 min-h-[150px]"
                placeholder="Enter subjective findings..."
              />
            </Card>

            {/* Objective */}
            <Card className="p-6">
              <Label className="text-lg font-semibold">Objective</Label>
              <Textarea
                value={soapData.objective}
                onChange={(e) => setSOAPData({ ...soapData, objective: e.target.value })}
                className="mt-2 min-h-[150px]"
                placeholder="Enter objective findings..."
              />
            </Card>

            {/* Assessment */}
            <Card className="p-6">
              <Label className="text-lg font-semibold">Assessment</Label>
              <Textarea
                value={soapData.assessment}
                onChange={(e) => setSOAPData({ ...soapData, assessment: e.target.value })}
                className="mt-2 min-h-[150px]"
                placeholder="Enter assessment..."
              />
            </Card>

            {/* Plan */}
            <Card className="p-6">
              <Label className="text-lg font-semibold">Plan</Label>
              <Textarea
                value={soapData.plan}
                onChange={(e) => setSOAPData({ ...soapData, plan: e.target.value })}
                className="mt-2 min-h-[150px]"
                placeholder="Enter plan..."
              />
            </Card>

            <Button onClick={handleSaveSOAP} disabled={loading} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save SOAP Note"}
            </Button>
          </div>
        </TabsContent>

        {/* Prescription Tab */}
        <TabsContent value="prescription" className="space-y-6">
          <Card className="p-6">
            <Label className="text-lg font-semibold">Prescription</Label>
            <Textarea
              value={prescriptionContent}
              onChange={(e) => setPrescriptionContent(e.target.value)}
              className="mt-2 min-h-[300px]"
              placeholder="Enter prescription details..."
            />
          </Card>

          <Button onClick={handleSavePrescription} disabled={loading} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Prescription"}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VisitDetail;
