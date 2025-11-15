import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, X, FileText, Download, Sparkles } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DocumentUploadDialog from "@/components/visit/DocumentUploadDialog";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  blood_group: string;
  contact_number: string;
  allergic_history_drug: any;
  allergic_history_food: any;
  allergic_history_env: any;
  medical_history_ongoing: string;
  medical_history_past: string;
  ongoing_medications: any;
  supplements: any;
  smoking_status: string;
  alcohol_consumption: string;
  occupation: string;
  living_environment: string;
}

interface Visit {
  id: string;
  patient_id: string;
  reason_for_visit: string;
  hpi: string;
  ros: string;
  vital_signs_bp: string;
  vital_signs_pulse: string;
  vital_signs_temp: string;
  vital_signs_respiratory_rate: string;
  vital_signs_spo2: string;
  vital_signs_weight: string;
  vital_signs_height: string;
  vital_signs_bmi: string;
  vital_signs_general_appearance: string;
  physical_examination: string;
  investigation: string;
}

export default function ClinicalDocumentation() {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [subjective, setSubjective] = useState("");
  const [objective, setObjective] = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");
  const [prescription, setPrescription] = useState("");

  useEffect(() => {
    if (visitId) {
      fetchVisit();
      fetchDocuments();
    }
  }, [visitId]);

  const fetchVisit = async () => {
    try {
      const { data: visitData, error: visitError } = await supabase
        .from("visits")
        .select("*")
        .eq("id", visitId)
        .single();

      if (visitError) throw visitError;
      setVisit(visitData);

      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", visitData.patient_id)
        .single();

      if (patientError) throw patientError;
      setPatient(patientData);

      // Auto-populate subjective and objective
      populateSubjective(visitData, patientData);
      populateObjective(visitData);
    } catch (error: any) {
      console.error("Error fetching visit:", error);
      toast({
        title: "Error",
        description: "Failed to load visit data",
        variant: "destructive",
      });
    }
  };

  const populateSubjective = (visitData: Visit, patientData: Patient) => {
    let text = "";
    
    if (visitData.hpi) {
      text += "HISTORY OF PRESENT ILLNESS (HPI):\n" + visitData.hpi + "\n\n";
    }
    
    if (visitData.ros) {
      text += "REVIEW OF SYSTEM (ROS):\n" + visitData.ros + "\n\n";
    }

    if (patientData.medical_history_ongoing || patientData.medical_history_past) {
      text += "MEDICAL HISTORY:\n";
      if (patientData.medical_history_ongoing) {
        text += "Ongoing: " + patientData.medical_history_ongoing + "\n";
      }
      if (patientData.medical_history_past) {
        text += "Past: " + patientData.medical_history_past + "\n";
      }
      text += "\n";
    }

    if (patientData.ongoing_medications || patientData.supplements) {
      text += "MEDICATION & SUPPLEMENTS:\n";
      if (patientData.ongoing_medications) {
        const meds = Array.isArray(patientData.ongoing_medications) 
          ? patientData.ongoing_medications 
          : [];
        if (meds.length > 0) {
          text += "Medications: " + meds.join(", ") + "\n";
        }
      }
      if (patientData.supplements) {
        const supps = Array.isArray(patientData.supplements) 
          ? patientData.supplements 
          : [];
        if (supps.length > 0) {
          text += "Supplements: " + supps.join(", ") + "\n";
        }
      }
      text += "\n";
    }

    if (patientData.allergic_history_drug || patientData.allergic_history_food || patientData.allergic_history_env) {
      text += "ALLERGIC HISTORY:\n";
      const drugAllergies = Array.isArray(patientData.allergic_history_drug) 
        ? patientData.allergic_history_drug 
        : [];
      const foodAllergies = Array.isArray(patientData.allergic_history_food) 
        ? patientData.allergic_history_food 
        : [];
      const envAllergies = Array.isArray(patientData.allergic_history_env) 
        ? patientData.allergic_history_env 
        : [];
      
      if (drugAllergies.length > 0) text += "Drug: " + drugAllergies.join(", ") + "\n";
      if (foodAllergies.length > 0) text += "Food: " + foodAllergies.join(", ") + "\n";
      if (envAllergies.length > 0) text += "Environmental: " + envAllergies.join(", ") + "\n";
      text += "\n";
    }

    text += "SOCIAL HISTORY:\n";
    text += `Smoking: ${patientData.smoking_status}\n`;
    text += `Alcohol: ${patientData.alcohol_consumption}\n`;
    if (patientData.occupation) text += `Occupation: ${patientData.occupation}\n`;
    if (patientData.living_environment) text += `Living Environment: ${patientData.living_environment}\n`;

    setSubjective(text);
  };

  const populateObjective = (visitData: Visit) => {
    let text = "VITALS:\n";
    if (visitData.vital_signs_bp) text += `BP: ${visitData.vital_signs_bp}\n`;
    if (visitData.vital_signs_pulse) text += `Pulse: ${visitData.vital_signs_pulse}\n`;
    if (visitData.vital_signs_temp) text += `Temperature: ${visitData.vital_signs_temp}\n`;
    if (visitData.vital_signs_respiratory_rate) text += `Respiratory Rate: ${visitData.vital_signs_respiratory_rate}\n`;
    if (visitData.vital_signs_spo2) text += `SpO2: ${visitData.vital_signs_spo2}\n`;
    if (visitData.vital_signs_weight) text += `Weight: ${visitData.vital_signs_weight}\n`;
    if (visitData.vital_signs_height) text += `Height: ${visitData.vital_signs_height}\n`;
    if (visitData.vital_signs_bmi) text += `BMI: ${visitData.vital_signs_bmi}\n`;
    if (visitData.vital_signs_general_appearance) text += `General Appearance: ${visitData.vital_signs_general_appearance}\n`;
    
    text += "\n";
    
    if (visitData.physical_examination) {
      text += "PHYSICAL EXAM:\n" + visitData.physical_examination + "\n\n";
    }
    
    if (visitData.investigation) {
      text += "INVESTIGATION:\n" + visitData.investigation;
    }

    setObjective(text);
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("visit_id", visitId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
    }
  };

  const handleGenerateAssessment = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-assessment", {
        body: { subjective, objective }
      });

      if (error) throw error;
      setAssessment(data.assessment);
      toast({
        title: "Success",
        description: "Assessment generated successfully",
      });
    } catch (error: any) {
      console.error("Error generating assessment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate assessment",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-plan", {
        body: { subjective, objective, assessment }
      });

      if (error) throw error;
      setPlan(data.plan);
      toast({
        title: "Success",
        description: "Plan generated successfully",
      });
    } catch (error: any) {
      console.error("Error generating plan:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate plan",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    toast({
      title: "Success",
      description: "Clinical documentation saved",
    });
  };

  const handleClose = () => {
    setShowCloseDialog(true);
  };

  const confirmClose = () => {
    navigate(-1);
  };

  if (!patient || !visit) {
    return <div className="p-8">Loading...</div>;
  }

  const formatAllergies = () => {
    const allergies = [];
    if (patient.allergic_history_drug && Array.isArray(patient.allergic_history_drug) && patient.allergic_history_drug.length > 0) {
      allergies.push(`Drug: ${patient.allergic_history_drug.join(", ")}`);
    }
    if (patient.allergic_history_food && Array.isArray(patient.allergic_history_food) && patient.allergic_history_food.length > 0) {
      allergies.push(`Food: ${patient.allergic_history_food.join(", ")}`);
    }
    if (patient.allergic_history_env && Array.isArray(patient.allergic_history_env) && patient.allergic_history_env.length > 0) {
      allergies.push(`Env: ${patient.allergic_history_env.join(", ")}`);
    }
    return allergies.length > 0 ? allergies.join("; ") : "None";
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Clinical Documentation</h1>
                <div className="text-sm text-muted-foreground mt-1 space-y-1">
                  <p>
                    <span className="font-medium">Visit ID:</span> {visit.id.slice(0, 8)} | 
                    <span className="font-medium ml-2">Patient:</span> {patient.first_name} {patient.last_name} | 
                    <span className="font-medium ml-2">ID:</span> {patient.id.slice(0, 8)}
                  </p>
                  <p>
                    <span className="font-medium">DOB:</span> {new Date(patient.date_of_birth).toLocaleDateString()} | 
                    <span className="font-medium ml-2">Blood Group:</span> {patient.blood_group || "N/A"} | 
                    <span className="font-medium ml-2">Contact:</span> {patient.contact_number}
                  </p>
                  <p>
                    <span className="font-medium">Allergies:</span> {formatAllergies()}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Download className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Export SOAP Note (MD)</DropdownMenuItem>
                  <DropdownMenuItem>Export SOAP Note (PDF)</DropdownMenuItem>
                  <DropdownMenuItem>Export Prescription (MD)</DropdownMenuItem>
                  <DropdownMenuItem>Export Prescription (PDF)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="icon" onClick={handleSave}>
                <Save className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* SOAP Note and Prescription Tabs */}
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <Tabs defaultValue="soap">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="soap">SOAP Note</TabsTrigger>
              <TabsTrigger value="prescription">Prescription</TabsTrigger>
            </TabsList>
            
            <TabsContent value="soap" className="space-y-6 mt-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Subjective</Label>
                </div>
                <Textarea
                  value={subjective}
                  onChange={(e) => setSubjective(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Objective</Label>
                </div>
                <Textarea
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Assessment</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateAssessment}
                    disabled={isGenerating}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with AI
                  </Button>
                </div>
                <Textarea
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                  placeholder="Assessment will appear here..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Plan</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGeneratePlan}
                    disabled={isGenerating}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with AI
                  </Button>
                </div>
                <Textarea
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                  placeholder="Plan will appear here..."
                />
              </div>
            </TabsContent>

            <TabsContent value="prescription" className="mt-6">
              <div>
                <Label>Prescription</Label>
                <Textarea
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  className="min-h-[400px] font-mono text-sm mt-2"
                  placeholder="Enter prescription details..."
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Documents Section */}
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Uploaded Documents</h2>
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <FileText className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>
          
          {documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{doc.file_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.document_type} - {doc.description} - {new Date(doc.document_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No documents uploaded yet</p>
          )}
        </div>
      </div>

      <DocumentUploadDialog
        open={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        visitId={visitId!}
        patientId={patient.id}
        onUploadSuccess={fetchDocuments}
      />

      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to close? Any unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClose}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
