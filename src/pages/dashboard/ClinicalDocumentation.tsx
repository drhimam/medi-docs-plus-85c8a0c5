import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, X, FileText, Download, Sparkles, Eye, Edit, Loader2, MoreVertical, ArrowUpDown, ExternalLink, Trash2, Settings } from "lucide-react";
import TranscribeButton from "@/components/TranscribeButton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import DocumentUploadDialog from "@/components/visit/DocumentUploadDialog";
import PrescriptionSettingsDialog from "@/components/prescription/PrescriptionSettingsDialog";
import { PrescriptionPreviewDialog } from "@/components/prescription/PrescriptionPreviewDialog";
import { RichTextEditor, RichTextEditorHandle } from "@/components/knowledge/RichTextEditor";
import { TranslateButton } from "@/components/TranslateButton";
import jsPDF from "jspdf";
import { exportPrescriptionToPDF as exportPrescriptionWithSettings } from "@/lib/prescriptionExport";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  blood_group: string;
  contact_number: string;
  address?: string;
  allergic_history_drug: any;
  allergic_history_food: any;
  allergic_history_env: any;
  medical_history_ongoing: string;
  medical_history_past: string;
  surgical_history: string;
  hospitalization_history: string;
  family_history: string;
  mental_health_history: string;
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
  soap_subjective: string;
  soap_objective: string;
  soap_assessment: string;
  soap_plan: string;
  prescription: string;
}

export default function ClinicalDocumentation() {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<'document_date' | 'upload_date' | 'description'>('document_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isGeneratingPrescription, setIsGeneratingPrescription] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showPrescriptionPreview, setShowPrescriptionPreview] = useState(false);
  const [generatedPrescription, setGeneratedPrescription] = useState("");
  const assessmentRef = useRef<HTMLTextAreaElement>(null);
  const planRef = useRef<HTMLTextAreaElement>(null);
  const prescriptionEditorRef = useRef<RichTextEditorHandle>(null);

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

      // Load saved SOAP notes and prescription, or auto-populate if empty
      if (visitData.soap_subjective) {
        setSubjective(visitData.soap_subjective);
      } else {
        populateSubjective(visitData, patientData);
      }
      
      if (visitData.soap_objective) {
        setObjective(visitData.soap_objective);
      } else {
        populateObjective(visitData);
      }
      
      setAssessment(visitData.soap_assessment || "");
      setPlan(visitData.soap_plan || "");
      setPrescription(visitData.prescription || "");
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

    if (patientData.medical_history_ongoing || patientData.medical_history_past || 
        patientData.surgical_history || patientData.hospitalization_history || 
        patientData.family_history || patientData.mental_health_history) {
      text += "MEDICAL HISTORY:\n";
      if (patientData.medical_history_ongoing) {
        text += "Ongoing: " + patientData.medical_history_ongoing + "\n";
      }
      if (patientData.medical_history_past) {
        text += "Past: " + patientData.medical_history_past + "\n";
      }
      if (patientData.surgical_history) {
        text += "Surgical: " + patientData.surgical_history + "\n";
      }
      if (patientData.hospitalization_history) {
        text += "Hospitalization: " + patientData.hospitalization_history + "\n";
      }
      if (patientData.family_history) {
        text += "Family: " + patientData.family_history + "\n";
      }
      if (patientData.mental_health_history) {
        text += "Mental Health: " + patientData.mental_health_history + "\n";
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

  const handleSort = (field: 'document_date' | 'upload_date' | 'description') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedDocuments = [...documents].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (sortField === 'document_date' || sortField === 'upload_date') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }
    
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const handleDeleteDocument = async (docId: string) => {
    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", docId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      fetchDocuments();
    } catch (error: any) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const handleDownloadDocument = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Document downloaded successfully",
      });
    } catch (error: any) {
      console.error("Error downloading document:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const handleViewDocument = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.file_path, 3600);

      if (error) throw error;

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error: any) {
      console.error("Error viewing document:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to view document",
        variant: "destructive",
      });
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

  const handleGeneratePrescription = async () => {
    if (!visit || !patient) return;
    
    setIsGeneratingPrescription(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-prescription', {
        body: {
          subjective: visit.soap_subjective || subjective,
          objective: visit.soap_objective || objective,
          assessment: visit.soap_assessment || assessment,
          patientInfo: {
            age: new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear(),
            gender: patient.gender,
            medicalHistory: patient.medical_history_ongoing
          }
        }
      });

      if (error) throw error;

      setGeneratedPrescription(data.prescription);
      setShowPrescriptionPreview(true);

      toast({
        title: "Success",
        description: "Prescription generated successfully",
      });
    } catch (error) {
      console.error("Error generating prescription:", error);
      toast({
        title: "Error",
        description: "Failed to generate prescription",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPrescription(false);
    }
  };

  const handleInsertPrescription = (location: "cursor" | "end") => {
    const editor = prescriptionEditorRef.current?.getEditor();
    if (!editor || !generatedPrescription) return;

    // Convert line breaks to HTML for proper formatting
    const formattedContent = generatedPrescription.replace(/\n/g, '<br />');
    
    if (location === "cursor") {
      // Insert at current cursor position
      editor.chain().focus().insertContent(formattedContent).run();
    } else {
      // Append to end
      editor.chain().focus().insertContent('<br /><br />' + formattedContent).run();
    }
    
    setShowPrescriptionPreview(false);
    setGeneratedPrescription("");
  };


  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("visits")
        .update({
          soap_subjective: subjective,
          soap_objective: objective,
          soap_assessment: assessment,
          soap_plan: plan,
          prescription: prescription,
        })
        .eq("id", visitId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Clinical documentation saved",
      });
    } catch (error: any) {
      console.error("Error saving documentation:", error);
      toast({
        title: "Error",
        description: "Failed to save clinical documentation",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setShowCloseDialog(true);
  };

  const confirmClose = () => {
    navigate(-1);
  };

  const exportSOAPToMarkdown = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const content = `# SOAP Note
**Visit ID:** ${visitId}
**Patient:** ${patient.first_name} ${patient.last_name}
**Date:** ${new Date().toLocaleDateString()}

## Subjective
${subjective}

## Objective
${objective}

## Assessment
${assessment}

## Plan
${plan}
`;
    
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SOAP_${patient.last_name}_${visitId}_${timestamp}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: "SOAP note exported as Markdown",
    });
  };

  const exportSOAPToPDF = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = 20;

    const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      if (isBold) doc.setFont("helvetica", "bold");
      else doc.setFont("helvetica", "normal");
      
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin, yPosition);
        yPosition += fontSize / 2 + 2;
      });
      yPosition += 5;
    };

    addText("SOAP Note", 18, true);
    yPosition += 5;
    
    addText("Subjective:", 14, true);
    addText(subjective || "N/A");
    
    addText("Objective:", 14, true);
    addText(objective || "N/A");
    
    addText("Assessment:", 14, true);
    addText(assessment || "N/A");
    
    addText("Plan:", 14, true);
    addText(plan || "N/A");

    doc.save(`SOAP_${patient.last_name}_${visitId}_${timestamp}.pdf`);
    
    toast({
      title: "Success",
      description: "SOAP note exported as PDF",
    });
  };

  const exportPrescriptionToMarkdown = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    
    // Convert HTML breaks to newlines, then strip remaining HTML tags
    const cleanPrescription = prescription
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ');
    
    const content = `# Prescription
**Visit ID:** ${visitId}
**Patient:** ${patient.first_name} ${patient.last_name}
**Date:** ${new Date().toLocaleDateString()}

${cleanPrescription}
`;
    
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Prescription_${patient.last_name}_${visitId}_${timestamp}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: "Prescription exported as Markdown",
    });
  };

  const exportPrescriptionToPDF = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: settings } = await supabase
        .from("prescription_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      const patientName = `${patient.first_name} ${patient.last_name}`;
      
      // Calculate patient age
      const calculateAge = (dob: string) => {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age.toString();
      };
      
      const patientAge = patient.date_of_birth ? calculateAge(patient.date_of_birth) : undefined;
      
      // Convert settings to proper format if exists
      const formattedSettings = settings ? {
        paper_size: settings.paper_size,
        body_font: settings.body_font,
        body_font_size: settings.body_font_size,
        footer_font_size: settings.footer_font_size,
        header_font: settings.header_font,
        body_text_color: settings.body_text_color,
        footer_text_color: settings.footer_text_color,
        use_own_letterhead: settings.use_own_letterhead,
        header_left_lines: (settings.header_left_lines as any) || [],
        header_right_lines: (settings.header_right_lines as any) || [],
        header_background_color: settings.header_background_color,
        header_line_spacing: settings.header_line_spacing,
        barcode_enabled: settings.barcode_enabled,
        footer_line_enabled: settings.footer_line_enabled ?? true,
        logo_path: settings.logo_path,
        logo_position: settings.logo_position,
        logo_width: settings.logo_width,
        logo_height: settings.logo_height,
        signature_path: settings.signature_path,
        signature_position: settings.signature_position,
        signature_width: settings.signature_width,
        signature_height: settings.signature_height,
      } : undefined;
      
      // Convert HTML breaks to newlines, then strip remaining HTML tags
      const cleanPrescription = prescription
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ');
      
      // Get logo data URL if exists
      let logoDataUrl;
      if (settings?.logo_path) {
        const { data: { publicUrl } } = supabase.storage
          .from('prescription-logos')
          .getPublicUrl(settings.logo_path);
        
        try {
          const response = await fetch(publicUrl);
          const blob = await response.blob();
          logoDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error("Error loading logo:", error);
        }
      }

      // Get signature data URL if exists
      let signatureDataUrl;
      if (settings?.signature_path) {
        const { data: { publicUrl } } = supabase.storage
          .from('prescription-signatures')
          .getPublicUrl(settings.signature_path);
        
        try {
          const response = await fetch(publicUrl);
          const blob = await response.blob();
          signatureDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error("Error loading signature:", error);
        }
      }
      
      await exportPrescriptionWithSettings(
        cleanPrescription, 
        patient.id, 
        patientName,
        patientAge,
        patient.contact_number,
        patient.address || undefined,
        formattedSettings,
        logoDataUrl,
        signatureDataUrl
      );
      
      toast({
        title: "Success",
        description: "Prescription exported as PDF",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-card border-b p-6 shadow-sm">
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
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setIsViewMode(!isViewMode)}
                title={isViewMode ? "Switch to Edit Mode" : "Switch to View Mode"}
              >
                {isViewMode ? <Edit className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Download className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={exportSOAPToMarkdown}>Export SOAP Note (MD)</DropdownMenuItem>
                  <DropdownMenuItem onClick={exportSOAPToPDF}>Export SOAP Note (PDF)</DropdownMenuItem>
                  <DropdownMenuItem onClick={exportPrescriptionToMarkdown}>Export Prescription (MD)</DropdownMenuItem>
                  <DropdownMenuItem onClick={exportPrescriptionToPDF}>Export Prescription (PDF)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Prescription Settings
                  </DropdownMenuItem>
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

        {/* SOAP Note and Prescription */}
        <div className="p-8 space-y-6">
          <div className="bg-card border rounded-lg p-6 shadow-sm">
          {isViewMode ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary">Subjective</h3>
                <div className="whitespace-pre-wrap bg-muted/50 p-4 rounded-md border">
                  {subjective || "No subjective data"}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary">Objective</h3>
                <div className="whitespace-pre-wrap bg-muted/50 p-4 rounded-md border">
                  {objective || "No objective data"}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary">Assessment</h3>
                <div className="whitespace-pre-wrap bg-muted/50 p-4 rounded-md border">
                  {assessment || "No assessment data"}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary">Plan</h3>
                <div className="whitespace-pre-wrap bg-muted/50 p-4 rounded-md border">
                  {plan || "No plan data"}
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-3 text-primary">Prescription</h3>
                <div className="whitespace-pre-wrap bg-muted/50 p-4 rounded-md border">
                  {prescription || "No prescription"}
                </div>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="soap">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="soap">SOAP Note</TabsTrigger>
                <TabsTrigger value="prescription">Prescription</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
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
                    <div className="flex gap-2">
                      <TranscribeButton 
                        onTranscription={(text) => {
                          const textarea = assessmentRef.current;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const newValue = assessment.substring(0, start) + text + assessment.substring(end);
                            setAssessment(newValue);
                            setTimeout(() => {
                              textarea.focus();
                              textarea.selectionStart = textarea.selectionEnd = start + text.length;
                            }, 0);
                          }
                        }}
                        disabled={isViewMode}
                      />
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
                  </div>
                  <Textarea
                    ref={assessmentRef}
                    value={assessment}
                    onChange={(e) => setAssessment(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                    placeholder="AI will generate a clinical assessment based on subjective and objective data"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Plan</Label>
                    <div className="flex gap-2">
                      <TranscribeButton 
                        onTranscription={(text) => {
                          const textarea = planRef.current;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const newValue = plan.substring(0, start) + text + plan.substring(end);
                            setPlan(newValue);
                            setTimeout(() => {
                              textarea.focus();
                              textarea.selectionStart = textarea.selectionEnd = start + text.length;
                            }, 0);
                          }
                        }}
                        disabled={isViewMode}
                      />
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
                  </div>
                  <Textarea
                    ref={planRef}
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                    placeholder="AI will generate a comprehensive treatment plan based on S, O, and A"
                  />
                </div>
              </TabsContent>

              <TabsContent value="prescription" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-4">
                    <Button
                      onClick={handleGeneratePrescription}
                      disabled={isGeneratingPrescription || isViewMode}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      {isGeneratingPrescription ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Generate Prescription
                        </>
                      )}
                    </Button>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Prescription Details</Label>
                      {!isViewMode && (
                        <div className="flex gap-2">
                          <TranscribeButton
                            onTranscription={(text) => {
                              const editor = prescriptionEditorRef.current?.getEditor();
                              if (editor) {
                                const formattedText = text.replace(/\n/g, '<br />');
                                editor.chain().focus().insertContent(formattedText).run();
                              }
                            }}
                            disabled={isViewMode}
                          />
                          <TranslateButton
                            textToTranslate={prescription.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')}
                            onTranslation={(translatedText) => {
                              const formattedText = translatedText.replace(/\n/g, '<br />');
                              setPrescription(formattedText);
                            }}
                            disabled={isViewMode}
                          />
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      {isViewMode ? (
                        <div 
                          className="prose prose-sm max-w-none border rounded-md p-4 min-h-[400px]"
                          dangerouslySetInnerHTML={{ __html: prescription }}
                        />
                      ) : (
                        <RichTextEditor
                          ref={prescriptionEditorRef}
                          content={prescription}
                          onChange={setPrescription}
                          placeholder="Enter prescription details using the formatting toolbar above..."
                        />
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold">Patient Documents</h2>
                      <p className="text-sm text-muted-foreground">Uploaded documents for this visit</p>
                    </div>
                    <Button onClick={() => setIsUploadDialogOpen(true)}>
                      <FileText className="w-4 h-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>

                  {documents.length > 0 ? (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('document_date')}>
                              <div className="flex items-center gap-2">
                                Doc Date
                                <ArrowUpDown className="h-4 w-4" />
                              </div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('description')}>
                              <div className="flex items-center gap-2">
                                Description
                                <ArrowUpDown className="h-4 w-4" />
                              </div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('upload_date')}>
                              <div className="flex items-center gap-2">
                                Upload Date
                                <ArrowUpDown className="h-4 w-4" />
                              </div>
                            </TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedDocuments.map((doc) => (
                            <TableRow key={doc.id}>
                              <TableCell>{new Date(doc.document_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                              <TableCell>{doc.description}</TableCell>
                              <TableCell>{new Date(doc.upload_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                                  Need Review
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewDocument(doc)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Document
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownloadDocument(doc)}>
                                      <Download className="h-4 w-4 mr-2" />
                                      Download
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteDocument(doc.id)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No documents uploaded yet</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
        </div>
      </div>

      <DocumentUploadDialog
        open={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        visitId={visitId!}
        patientId={patient.id}
        onUploadSuccess={fetchDocuments}
      />

      <PrescriptionSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
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

      <PrescriptionPreviewDialog
        open={showPrescriptionPreview}
        onOpenChange={setShowPrescriptionPreview}
        generatedContent={generatedPrescription}
        onInsert={handleInsertPrescription}
      />
    </div>
  );
}
