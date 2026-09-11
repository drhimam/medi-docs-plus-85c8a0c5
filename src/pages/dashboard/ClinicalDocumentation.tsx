import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, X, FileText, Download, Sparkles, Eye, Edit, Loader2, MoreVertical, ArrowUpDown, ExternalLink, Trash2, Settings, CheckCircle, AlertCircle, FileDown, FileSearch, Stethoscope, FlaskConical, Palette, Copy, Mail, Cloud, CloudOff, History, Share2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import TranscribeButton from "@/components/TranscribeButton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import DocumentUploadDialog from "@/components/visit/DocumentUploadDialog";
import PrescriptionSettingsDialog from "@/components/prescription/PrescriptionSettingsDialog";
import { PrescriptionPreviewDialog } from "@/components/prescription/PrescriptionPreviewDialog";
import { PrescriptionLivePreviewDialog } from "@/components/prescription/PrescriptionLivePreviewDialog";
import { RichTextEditor, RichTextEditorHandle } from "@/components/knowledge/RichTextEditor";
import { TranslateButton } from "@/components/TranslateButton";
import { TranscribeOutputDialog } from "@/components/transcribe/TranscribeOutputDialog";
import { TranslateOutputDialog } from "@/components/translate/TranslateOutputDialog";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { PrescriptionSnippetsDialog } from "@/components/prescription/PrescriptionSnippetsDialog";
import PhysicalExaminationDialog from "@/components/visit/PhysicalExaminationDialog";
import InvestigationBuilderDialog from "@/components/visit/InvestigationBuilderDialog";
import InvestigationRequisitionDialog from "@/components/visit/InvestigationRequisitionDialog";
import { exportRequisitionToPDF } from "@/lib/requisitionExport";
import HPIBuilder from "@/components/visit/HPIBuilder";
import ROSBuilder from "@/components/visit/ROSBuilder";
import { SOAPExportSettingsDialog } from "@/components/soap/SOAPExportSettingsDialog";
import { SOAPLivePreviewDialog } from "@/components/soap/SOAPLivePreviewDialog";
import { SOAPEmailDialog } from "@/components/soap/SOAPEmailDialog";
import { PrescriptionEmailDialog } from "@/components/prescription/PrescriptionEmailDialog";
import { VersionHistoryDialog } from "@/components/visit/VersionHistoryDialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import jsPDF from "jspdf";
import { format, differenceInYears } from "date-fns";
import DOMPurify from "dompurify";
import { exportPrescriptionToPDF as exportPrescriptionWithSettings } from "@/lib/prescriptionExport";
import { useSubUser } from "@/hooks/useSubUser";
import { useActivityLog } from "@/hooks/useActivityLog";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  blood_group: string;
  contact_number: string;
  email?: string;
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
  const { isSubUser, getOwnerIdForLogging } = useSubUser();
  const { logActivity } = useActivityLog();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<'document_date' | 'upload_date' | 'description'>('document_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSoapViewMode, setIsSoapViewMode] = useState(false);
  const [isPrescriptionViewMode, setIsPrescriptionViewMode] = useState(false);
  const [isGeneratingPrescription, setIsGeneratingPrescription] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showPrescriptionPreview, setShowPrescriptionPreview] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [generatedPrescription, setGeneratedPrescription] = useState("");
  const [showTranscribeOutput, setShowTranscribeOutput] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [showTranslateOutput, setShowTranslateOutput] = useState(false);
  const [translatedText, setTranslatedText] = useState("");
  const [translatedLanguage, setTranslatedLanguage] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [showPhysicalExamDialog, setShowPhysicalExamDialog] = useState(false);
  const [showInvestigationDialog, setShowInvestigationDialog] = useState(false);
  const [showHPIDialog, setShowHPIDialog] = useState(false);
  const [showROSDialog, setShowROSDialog] = useState(false);
  const [showSOAPExportSettings, setShowSOAPExportSettings] = useState(false);
  const [showSOAPPreview, setShowSOAPPreview] = useState(false);
  const [showSOAPEmail, setShowSOAPEmail] = useState(false);
  const [showPrescriptionEmail, setShowPrescriptionEmail] = useState(false);
  const [showRequisitionDialog, setShowRequisitionDialog] = useState(false);
  const [editingRequisitionDoc, setEditingRequisitionDoc] = useState<any | null>(null);
  const [renameDoc, setRenameDoc] = useState<any | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const assessmentRef = useRef<HTMLTextAreaElement>(null);
  const planRef = useRef<HTMLTextAreaElement>(null);
  const prescriptionEditorRef = useRef<RichTextEditorHandle>(null);
  const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [subjective, setSubjective] = useState("");
  const [objective, setObjective] = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");
  const [prescription, setPrescription] = useState("");
  
  // Autosave state
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [autosaveEnabled, setAutosaveEnabled] = useState(true);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  
  // Track initial values to detect changes
  const [initialValues, setInitialValues] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
    prescription: "",
  });
  
  // Track if initial load is complete to prevent autosave on first render
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  
  // Vital signs state for Physical Exam Builder
  const [vitalSigns, setVitalSigns] = useState({
    bp: "",
    pulse: "",
    temp: "",
    respiratoryRate: "",
    spo2: "",
    weight: "",
    height: "",
    bmi: "",
    generalAppearance: "",
  });

  // Calculate BMI when weight or height changes
  useEffect(() => {
    const weight = parseFloat(vitalSigns.weight);
    const height = parseFloat(vitalSigns.height);
    if (weight > 0 && height > 0) {
      const heightInMeters = height / 100;
      const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
      setVitalSigns(prev => ({ ...prev, bmi }));
    }
  }, [vitalSigns.weight, vitalSigns.height]);

  // Handler for vital signs changes
  const handleVitalSignsChange = (field: keyof typeof vitalSigns, value: string) => {
    setVitalSigns(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (visitId) {
      fetchVisit();
      fetchDocuments();
      fetchUserSettings();
    }
  }, [visitId]);

  const fetchUserSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("user_settings")
        .select("autosave_enabled")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setAutosaveEnabled(data.autosave_enabled ?? true);
      }
    } catch (error) {
      console.error("Error fetching user settings:", error);
    }
  };

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
      let subjectiveVal = "";
      let objectiveVal = "";
      
      if (visitData.soap_subjective) {
        subjectiveVal = visitData.soap_subjective;
        setSubjective(subjectiveVal);
      } else {
        // We need to get the populated value after setting it
        populateSubjective(visitData, patientData);
      }
      
      if (visitData.soap_objective) {
        objectiveVal = visitData.soap_objective;
        setObjective(objectiveVal);
      } else {
        populateObjective(visitData);
      }
      
      const assessmentVal = visitData.soap_assessment || "";
      const planVal = visitData.soap_plan || "";
      const prescriptionVal = visitData.prescription || "";
      
      setAssessment(assessmentVal);
      setPlan(planVal);
      setPrescription(prescriptionVal);
      
      // Store initial values for change detection (use timeout to get populated values)
      setTimeout(() => {
        setInitialValues({
          subjective: visitData.soap_subjective || "",
          objective: visitData.soap_objective || "",
          assessment: assessmentVal,
          plan: planVal,
          prescription: prescriptionVal,
        });
        setIsInitialLoadComplete(true);
      }, 100);
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

    // Patient demographics: name, age, gender, blood group
    const fullName = `${patientData.first_name ?? ""} ${patientData.last_name ?? ""}`.trim();
    const age = patientData.date_of_birth
      ? differenceInYears(new Date(), new Date(patientData.date_of_birth))
      : null;
    const demoParts: string[] = [];
    if (fullName) demoParts.push(`Name: ${fullName}`);
    if (age !== null && !isNaN(age)) demoParts.push(`Age: ${age} y`);
    if (patientData.gender) demoParts.push(`Gender: ${patientData.gender}`);
    if (patientData.blood_group) demoParts.push(`Blood Group: ${patientData.blood_group}`);
    if (demoParts.length > 0) {
      text += "PATIENT DEMOGRAPHICS:\n" + demoParts.join(" | ") + "\n\n";
    }

    if (visitData.reason_for_visit) {
      text += "CHIEF COMPLAINT:\n" + visitData.reason_for_visit + "\n\n";
    }

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

  const openRenameDocument = (doc: any) => {
    setRenameDoc(doc);
    setRenameValue(doc.description || "");
  };

  const handleRenameDocument = async () => {
    if (!renameDoc || !renameValue.trim()) return;
    setIsRenaming(true);
    try {
      const { error } = await supabase
        .from("documents")
        .update({ description: renameValue.trim() })
        .eq("id", renameDoc.id);
      if (error) throw error;
      setRenameDoc(null);
      fetchDocuments();
      toast({ title: "Renamed", description: "Document name updated" });
    } catch (error: any) {
      console.error("Error renaming document:", error);
      toast({ title: "Error", description: "Failed to rename document", variant: "destructive" });
    } finally {
      setIsRenaming(false);
    }
  };

  const openEditRequisition = (doc: any) => {
    setEditingRequisitionDoc(doc);
    setShowRequisitionDialog(true);
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
    } finally {
      setShowDeleteDialog(false);
      setDocumentToDelete(null);
    }
  };

  const confirmDeleteDocument = (docId: string) => {
    setDocumentToDelete(docId);
    setShowDeleteDialog(true);
  };

  const handleDownloadDocument = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('visit-documents')
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
        .from('visit-documents')
        .createSignedUrl(doc.file_path, 3600);

      if (error) throw error;

      if (data?.signedUrl) {
        // Open document in a new window/tab
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
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

  const handleUpdateReviewStatus = async (docId: string, status: 'reviewed' | 'needs_review' | 'pending') => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ review_status: status })
        .eq('id', docId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Document marked as ${status === 'reviewed' ? 'reviewed' : status === 'needs_review' ? 'needs review' : 'pending'}`,
      });
      fetchDocuments();
    } catch (error: any) {
      console.error("Error updating review status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update document status",
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

  const handleTranscribeComplete = (text: string) => {
    setTranscribedText(text);
    setShowTranscribeOutput(true);
  };

  const handleInsertTranscription = (location: "cursor" | "end") => {
    const editor = prescriptionEditorRef.current?.getEditor();
    if (!editor || !transcribedText) return;

    const formattedContent = transcribedText.replace(/\n/g, '<br />');
    
    if (location === "cursor") {
      editor.chain().focus().insertContent(formattedContent).run();
    } else {
      editor.chain().focus().insertContent('<br /><br />' + formattedContent).run();
    }
    
    setShowTranscribeOutput(false);
  };

  const handleTranslateComplete = (text: string, language: string) => {
    setTranslatedText(text);
    setTranslatedLanguage(language);
    setShowTranslateOutput(true);
  };

  const handleInsertTranslation = (location: "cursor" | "end") => {
    const editor = prescriptionEditorRef.current?.getEditor();
    if (!editor || !translatedText) return;

    const formattedContent = translatedText.replace(/\n/g, '<br />');
    
    if (location === "cursor") {
      editor.chain().focus().insertContent(formattedContent).run();
    } else {
      editor.chain().focus().insertContent('<br /><br />' + formattedContent).run();
    }
    
    setShowTranslateOutput(false);
  };

  const handleContextMenuTranscribe = () => {
    const button = document.querySelector('[data-transcribe-button]') as HTMLButtonElement;
    if (button) button.click();
  };

  const handleContextMenuTranslate = () => {
    const button = document.querySelector('[data-translate-button]') as HTMLButtonElement;
    if (button) button.click();
  };


  const copySOAPNote = async () => {
    const soapText = `SUBJECTIVE:\n${subjective}\n\nOBJECTIVE:\n${objective}\n\nASSESSMENT:\n${assessment}\n\nPLAN:\n${plan}`;
    try {
      await navigator.clipboard.writeText(soapText);
      toast({
        title: "Copied",
        description: "SOAP note copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const saveVersion = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !visitId) return;

      // Get the next version number
      const { data: versions } = await supabase
        .from("visit_versions")
        .select("version_number")
        .eq("visit_id", visitId)
        .order("version_number", { ascending: false })
        .limit(1);

      const nextVersion = versions && versions.length > 0 ? versions[0].version_number + 1 : 1;

      // Save current state as a version
      await supabase.from("visit_versions").insert({
        visit_id: visitId,
        user_id: user.id,
        soap_subjective: initialValues.subjective,
        soap_objective: initialValues.objective,
        soap_assessment: initialValues.assessment,
        soap_plan: initialValues.plan,
        prescription: initialValues.prescription,
        version_number: nextVersion,
      });
    } catch (error) {
      console.error("Error saving version:", error);
    }
  };

  const handleSave = async () => {
    try {
      setAutosaveStatus('saving');
      
      // Save current state as a version before updating
      await saveVersion();
      
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

      // Update initial values after successful save
      setInitialValues({
        subjective,
        objective,
        assessment,
        plan,
        prescription,
      });
      
      setAutosaveStatus('saved');
      setLastSavedAt(new Date());

      toast({
        title: "Success",
        description: "Clinical documentation saved",
      });
      
      // Reset status after 2 seconds
      setTimeout(() => setAutosaveStatus('idle'), 2000);
    } catch (error: any) {
      console.error("Error saving documentation:", error);
      setAutosaveStatus('error');
      toast({
        title: "Error",
        description: "Failed to save clinical documentation",
        variant: "destructive",
      });
    }
  };

  const handleRestoreVersion = (version: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    prescription: string;
  }) => {
    // Save current state first, then restore
    saveVersion().then(() => {
      setSubjective(version.subjective);
      setObjective(version.objective);
      setAssessment(version.assessment);
      setPlan(version.plan);
      setPrescription(version.prescription);
    });
  };

  // Autosave function with debounce
  const performAutosave = useCallback(async () => {
    if (!visitId || !isInitialLoadComplete) return;
    
    try {
      setAutosaveStatus('saving');
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

      setInitialValues({
        subjective,
        objective,
        assessment,
        plan,
        prescription,
      });
      
      setAutosaveStatus('saved');
      setLastSavedAt(new Date());
      
      // Reset status after 2 seconds
      setTimeout(() => setAutosaveStatus('idle'), 2000);
    } catch (error: any) {
      console.error("Autosave error:", error);
      setAutosaveStatus('error');
    }
  }, [visitId, subjective, objective, assessment, plan, prescription, isInitialLoadComplete]);

  // Autosave effect - triggers 2 seconds after last change (only if autosave is enabled)
  useEffect(() => {
    if (!isInitialLoadComplete || !autosaveEnabled) return;
    
    // Check if there are actual changes
    const hasChanges = 
      subjective !== initialValues.subjective ||
      objective !== initialValues.objective ||
      assessment !== initialValues.assessment ||
      plan !== initialValues.plan ||
      prescription !== initialValues.prescription;
    
    if (!hasChanges) return;
    
    // Clear previous timeout
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
    
    // Set new timeout for autosave
    autosaveTimeoutRef.current = setTimeout(() => {
      performAutosave();
    }, 2000);
    
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [subjective, objective, assessment, plan, prescription, isInitialLoadComplete, initialValues, performAutosave, autosaveEnabled]);

  // Check if there are unsaved changes in SOAP notes or prescription
  const hasSoapChanges = () => {
    return (
      subjective !== initialValues.subjective ||
      objective !== initialValues.objective ||
      assessment !== initialValues.assessment ||
      plan !== initialValues.plan
    );
  };

  const hasPrescriptionChanges = () => {
    return prescription !== initialValues.prescription;
  };

  const hasUnsavedChanges = () => {
    return hasSoapChanges() || hasPrescriptionChanges();
  };

  const handleClose = () => {
    if (hasUnsavedChanges()) {
      setShowCloseDialog(true);
    } else {
      // No changes, navigate directly
      if (patient?.id) {
        navigate(`/dashboard/patients/${patient.id}`);
      } else {
        navigate(-1);
      }
    }
  };

  const confirmClose = () => {
    setShowCloseDialog(false);
    if (patient?.id) {
      navigate(`/dashboard/patients/${patient.id}`);
    } else {
      navigate(-1);
    }
  };

  const exportSOAPToMarkdown = async () => {
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

    // Log activity for sub-users
    if (isSubUser) {
      const ownerId = await getOwnerIdForLogging();
      if (ownerId) {
        logActivity(ownerId, "export", "visit", visitId, `${patient?.first_name} ${patient?.last_name}`, "Exported SOAP note as Markdown");
      }
    }
  };

  const exportSOAPToPDF = async () => {
    if (!patient) return;
    
    // Fetch user settings
    let settings = {
      header_title: "SOAP NOTE",
      header_background_color: "#2980b9",
      header_text_color: "#ffffff",
      logo_path: null as string | null,
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
      footer_text: null as string | null,
      footer_text_color: "#969696",
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("soap_export_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data) {
          settings = { ...settings, ...data };
        }
      }
    } catch (e) {
      console.error("Error fetching SOAP settings:", e);
    }

    const hexToRgb = (hex: string): [number, number, number] => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ] : [0, 0, 0];
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;
    const fontSize = settings.body_font_size;
    const lineHeight = fontSize * 0.5;

    const checkPageBreak = (neededHeight: number = 10) => {
      if (yPosition + neededHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    const cleanText = (text: string) => {
      return text
        .replace(/\n*---\s*[A-Z\s\/()0-9:-]+\s*---\n*/gi, '\n\n')
        .trim();
    };

    const renderFormattedText = (text: string, xOffset: number = 0) => {
      let cleanLine = text
        .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/__(.+?)__/g, '$1')
        .replace(/_(.+?)_/g, '$1')
        .replace(/`(.+?)`/g, '$1')
        .trim();

      const wrappedLines = doc.splitTextToSize(cleanLine, contentWidth - xOffset - 4);
      wrappedLines.forEach((line: string) => {
        checkPageBreak(lineHeight);
        doc.text(line, margin + xOffset + 4, yPosition);
        yPosition += lineHeight;
      });
    };

    const renderContent = (content: string) => {
      const cleanedContent = cleanText(content || "N/A");
      const lines = cleanedContent.split('\n');
      
      lines.forEach((line) => {
        if (!line.trim()) {
          yPosition += 2;
          return;
        }
        
        const isSubHeader = /^[A-Z][A-Z\s\/()-]+:/.test(line.trim()) || 
                           /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*:/.test(line.trim());
        
        const bulletMatch = line.match(/^(\s*)[-•*]\s+(.+)/);
        const numberedMatch = line.match(/^(\s*)(\d+)[.)]\s+(.+)/);
        
        if (isSubHeader) {
          checkPageBreak(10);
          doc.setFont(settings.body_font, "bold");
          doc.setFontSize(fontSize);
          doc.setTextColor(50, 50, 50);
          const headerText = line.replace(/\*\*/g, '').trim();
          const wrappedLines = doc.splitTextToSize(headerText, contentWidth - 4);
          wrappedLines.forEach((wrappedLine: string) => {
            checkPageBreak(lineHeight);
            doc.text(wrappedLine, margin + 4, yPosition);
            yPosition += lineHeight;
          });
          doc.setFont(settings.body_font, "normal");
          doc.setTextColor(...hexToRgb(settings.body_text_color));
        } else if (bulletMatch) {
          const indent = Math.min(bulletMatch[1].length / 2, 3) * 4;
          checkPageBreak(lineHeight);
          doc.setFont(settings.body_font, "normal");
          doc.setFontSize(fontSize);
          doc.text("•", margin + 4 + indent, yPosition);
          renderFormattedText(bulletMatch[2], indent + 4);
        } else if (numberedMatch) {
          const indent = Math.min(numberedMatch[1].length / 2, 3) * 4;
          checkPageBreak(lineHeight);
          doc.setFont(settings.body_font, "normal");
          doc.setFontSize(fontSize);
          doc.text(`${numberedMatch[2]}.`, margin + 4 + indent, yPosition);
          renderFormattedText(numberedMatch[3], indent + 6);
        } else {
          doc.setFont(settings.body_font, "normal");
          doc.setFontSize(fontSize);
          doc.setTextColor(...hexToRgb(settings.body_text_color));
          renderFormattedText(line, 0);
        }
      });
    };

    // Calculate patient age
    const patientAge = differenceInYears(new Date(), new Date(patient.date_of_birth));

    // Add header with logo support
    const headerRgb = hexToRgb(settings.header_background_color);
    const headerTextRgb = hexToRgb(settings.header_text_color);
    doc.setFillColor(...headerRgb);
    doc.rect(0, 0, pageWidth, 32, 'F');
    
    let headerXOffset = margin;
    
    // Load logo if enabled
    if (settings.logo_enabled && settings.logo_path) {
      try {
        const { data: logoData } = await supabase.storage
          .from("prescription-logos")
          .createSignedUrl(settings.logo_path, 60);
        
        if (logoData?.signedUrl) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise<void>((resolve) => {
            img.onload = () => {
              doc.addImage(img, "PNG", margin, 4, settings.logo_width / 3, settings.logo_height / 3);
              resolve();
            };
            img.onerror = () => resolve();
            img.src = logoData.signedUrl;
          });
          headerXOffset = margin + (settings.logo_width / 3) + 5;
        }
      } catch (e) {
        console.error("Logo load error:", e);
      }
    }
    
    doc.setTextColor(...headerTextRgb);
    doc.setFontSize(16);
    doc.setFont(settings.body_font, "bold");
    doc.text(settings.header_title, headerXOffset, 12);
    
    doc.setFontSize(9);
    doc.setFont(settings.body_font, "normal");
    doc.text(`Patient: ${patient.first_name} ${patient.last_name} | Age: ${patientAge} yrs | ${patient.gender}`, headerXOffset, 20);
    doc.text(`Contact: ${patient.contact_number} | Date: ${format(new Date(), "MMMM dd, yyyy")}`, headerXOffset, 26);

    yPosition = 42;
    doc.setTextColor(0, 0, 0);

    const addSection = (title: string, content: string, colorHex: string) => {
      const color = hexToRgb(colorHex);
      checkPageBreak(20);
      
      doc.setFillColor(...color);
      doc.rect(margin, yPosition - 4, 3, 14, 'F');
      
      doc.setFontSize(12);
      doc.setFont(settings.body_font, "bold");
      doc.setTextColor(...color);
      doc.text(title, margin + 6, yPosition + 4);
      yPosition += 14;
      
      doc.setFont(settings.body_font, "normal");
      doc.setTextColor(...hexToRgb(settings.body_text_color));
      doc.setFontSize(fontSize);
      
      renderContent(content);
      
      yPosition += 6;
    };

    addSection("SUBJECTIVE", subjective, settings.subjective_color);
    addSection("OBJECTIVE", objective, settings.objective_color);
    addSection("ASSESSMENT", assessment, settings.assessment_color);
    addSection("PLAN", plan, settings.plan_color);

    // Footer
    if (settings.footer_enabled) {
      const footerRgb = hexToRgb(settings.footer_text_color);
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...footerRgb);
        doc.setFont(settings.body_font, "normal");
        const footerText = settings.footer_text || `Page ${i} of ${pageCount} | Generated: ${format(new Date(), "yyyy-MM-dd HH:mm")}`;
        doc.text(
          footerText,
          pageWidth / 2,
          pageHeight - 8,
          { align: "center" }
        );
      }
    }

    doc.save(`SOAP_${patient.last_name}_${visitId}_${timestamp}.pdf`);
    
    toast({
      title: "Success",
      description: "SOAP note exported as PDF",
    });

    // Log activity for sub-users
    if (isSubUser) {
      const ownerId = await getOwnerIdForLogging();
      if (ownerId) {
        logActivity(ownerId, "export", "visit", visitId, `${patient?.first_name} ${patient?.last_name}`, "Exported SOAP note as PDF");
      }
    }
  };

  const exportSOAPToPlainText = async () => {
    if (!patient) return;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    
    // Clean text - remove date headers for cleaner output
    const cleanText = (text: string) => {
      return text
        .replace(/\n*---\s*[A-Z\s\/()0-9:-]+\s*---\n*/gi, '\n')
        .trim();
    };

    const separator = "═".repeat(60);
    const subSeparator = "─".repeat(40);
    
    const content = `${separator}
                         SOAP NOTE
${separator}

Patient: ${patient.first_name} ${patient.last_name}
Date: ${format(new Date(), "MMMM dd, yyyy")}
Visit ID: ${visitId}

${subSeparator}
SUBJECTIVE
${subSeparator}
${cleanText(subjective) || "N/A"}

${subSeparator}
OBJECTIVE
${subSeparator}
${cleanText(objective) || "N/A"}

${subSeparator}
ASSESSMENT
${subSeparator}
${cleanText(assessment) || "N/A"}

${subSeparator}
PLAN
${subSeparator}
${cleanText(plan) || "N/A"}

${separator}
Generated: ${format(new Date(), "yyyy-MM-dd HH:mm")}
${separator}
`;
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SOAP_${patient.last_name}_${visitId}_${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: "SOAP note exported as plain text",
    });

    // Log activity for sub-users
    if (isSubUser) {
      const ownerId = await getOwnerIdForLogging();
      if (ownerId) {
        logActivity(ownerId, "export", "visit", visitId, `${patient?.first_name} ${patient?.last_name}`, "Exported SOAP note as TXT");
      }
    }
  };

  const exportPrescriptionToMarkdown = async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    
    // Remove page break elements, convert HTML breaks to newlines, then strip remaining HTML tags
    const cleanPrescription = prescription
      .replace(/<div[^>]*data-page-break="true"[^>]*>.*?<\/div>/gi, '\n\n\n')
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
    
    // Log activity if sub-user
    if (isSubUser && patient) {
      const ownerId = await getOwnerIdForLogging();
      if (ownerId) {
        await logActivity(
          ownerId,
          "export",
          "prescription",
          visitId,
          `${patient.first_name} ${patient.last_name}`,
          "Exported prescription as Markdown"
        );
      }
    }
    
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
      
      // Remove page break elements, convert HTML breaks to newlines, then strip remaining HTML tags
      const cleanPrescription = prescription
        .replace(/<div[^>]*data-page-break="true"[^>]*>.*?<\/div>/gi, '\n\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ');
      
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
      
      // Get logo data URL if exists
      let logoDataUrl;
      if (settings?.logo_path) {
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('prescription-logos')
          .createSignedUrl(settings.logo_path, 3600);
        
        if (!signedUrlError && signedUrlData?.signedUrl) {
          try {
            const response = await fetch(signedUrlData.signedUrl);
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
      }

      // Get signature data URL if exists
      let signatureDataUrl;
      if (settings?.signature_path) {
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('prescription-signatures')
          .createSignedUrl(settings.signature_path, 3600);
        
        if (!signedUrlError && signedUrlData?.signedUrl) {
          try {
            const response = await fetch(signedUrlData.signedUrl);
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
      
      // Log activity if sub-user
      if (isSubUser && patient) {
        const ownerId = await getOwnerIdForLogging();
        if (ownerId) {
          await logActivity(
            ownerId,
            "export",
            "prescription",
            visitId,
            `${patient.first_name} ${patient.last_name}`,
            "Exported prescription as PDF"
          );
        }
      }
      
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
              <Button variant="ghost" size="icon" onClick={handleClose}>
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
            <div className="flex items-center gap-3">
              {/* Autosave Status Indicator */}
              <div className="flex items-center gap-2 text-sm">
                {!autosaveEnabled && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <CloudOff className="w-3.5 h-3.5" />
                    Autosave off
                  </span>
                )}
                {autosaveEnabled && autosaveStatus === 'saving' && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </span>
                )}
                {autosaveEnabled && autosaveStatus === 'saved' && (
                  <span className="flex items-center gap-1.5 text-green-600">
                    <Cloud className="w-3.5 h-3.5" />
                    Saved
                  </span>
                )}
                {autosaveEnabled && autosaveStatus === 'error' && (
                  <span className="flex items-center gap-1.5 text-destructive">
                    <CloudOff className="w-3.5 h-3.5" />
                    Save failed
                  </span>
                )}
                {autosaveEnabled && autosaveStatus === 'idle' && lastSavedAt && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Cloud className="w-3.5 h-3.5" />
                    Last saved {format(lastSavedAt, 'h:mm a')}
                  </span>
                )}
              </div>
              <TooltipProvider>
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Options</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={exportSOAPToMarkdown}>
                      <FileDown className="w-4 h-4 mr-2" />
                      Export SOAP Note (MD)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportSOAPToPDF}>
                      <FileDown className="w-4 h-4 mr-2" />
                      Export SOAP Note (PDF)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportSOAPToPlainText}>
                      <FileText className="w-4 h-4 mr-2" />
                      Export SOAP Note (TXT)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportPrescriptionToMarkdown}>
                      <FileDown className="w-4 h-4 mr-2" />
                      Export Prescription (MD)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportPrescriptionToPDF}>
                      <FileDown className="w-4 h-4 mr-2" />
                      Export Prescription (PDF)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowVersionHistory(true)}>
                      <History className="w-4 h-4 mr-2" />
                      Version History
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowSOAPExportSettings(true)}>
                      <Palette className="w-4 h-4 mr-2" />
                      SOAP PDF Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                      <Settings className="w-4 h-4 mr-2" />
                      Prescription Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSave}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleClose}>
                      <X className="w-4 h-4 mr-2" />
                      Close
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* SOAP Note and Prescription */}
        <div className="p-4 sm:p-8 space-y-6">
          <div className="bg-card border rounded-lg p-4 sm:p-6 shadow-sm">
            <Tabs defaultValue="soap">
              <TabsList className="grid w-full grid-cols-3 h-auto">
                <TabsTrigger value="soap" className="text-xs sm:text-sm py-2 relative">
                  SOAP Note
                  {hasSoapChanges() && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="prescription" className="text-xs sm:text-sm py-2 relative">
                  Prescription
                  {hasPrescriptionChanges() && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="documents" className="text-xs sm:text-sm py-2">Documents</TabsTrigger>
              </TabsList>
              
              <TabsContent value="soap" className="space-y-6 mt-6">
                {/* SOAP Note Action Toolbar */}
                <div className="flex items-center gap-2 border-b pb-4">
                  {/* Desktop: Show individual icon buttons */}
                  <div className="hidden sm:flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon">
                                <FileDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={exportSOAPToMarkdown}>Export as Markdown</DropdownMenuItem>
                              <DropdownMenuItem onClick={exportSOAPToPDF}>Export as PDF</DropdownMenuItem>
                              <DropdownMenuItem onClick={exportSOAPToPlainText}>Export as Plain Text</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TooltipTrigger>
                        <TooltipContent>Export SOAP Note</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => setShowSOAPPreview(true)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Preview PDF</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={copySOAPNote}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy SOAP Note</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => setShowSOAPEmail(true)}>
                            <Mail className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Email SOAP Note</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => setShowSOAPExportSettings(true)}>
                            <Palette className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>PDF Settings</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={handleSave}>
                            <Save className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Save</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Mobile: Show dropdown menu for actions */}
                  <div className="sm:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={exportSOAPToMarkdown}>
                          <FileDown className="h-4 w-4 mr-2" />
                          Export as Markdown
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={exportSOAPToPDF}>
                          <FileDown className="h-4 w-4 mr-2" />
                          Export as PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={exportSOAPToPlainText}>
                          <FileText className="h-4 w-4 mr-2" />
                          Export as Plain Text
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setShowSOAPPreview(true)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={copySOAPNote}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy SOAP Note
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowSOAPEmail(true)}>
                          <Mail className="h-4 w-4 mr-2" />
                          Email SOAP Note
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowSOAPExportSettings(true)}>
                          <Palette className="h-4 w-4 mr-2" />
                          PDF Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSave}>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {isSoapViewMode ? (
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
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Subjective</Label>
                        {/* Desktop buttons */}
                        <div className="hidden sm:flex gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowHPIDialog(true)}
                                  disabled={isSoapViewMode}
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  Add Complaint
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Add Complaint / HPI</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowROSDialog(true)}
                                  disabled={isSoapViewMode}
                                >
                                  <Stethoscope className="w-4 h-4 mr-2" />
                                  ROS
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Review of Systems</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        {/* Mobile dropdown */}
                        <div className="sm:hidden">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon" disabled={isSoapViewMode}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setShowHPIDialog(true)}>
                                <FileText className="w-4 h-4 mr-2" />
                                Add Complaint
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setShowROSDialog(true)}>
                                <Stethoscope className="w-4 h-4 mr-2" />
                                ROS
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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
                        {/* Desktop buttons */}
                        <div className="hidden sm:flex gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowPhysicalExamDialog(true)}
                                  disabled={isSoapViewMode}
                                >
                                  <Stethoscope className="w-4 h-4 mr-2" />
                                  Physical Exam
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Add Physical Examination Findings</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowInvestigationDialog(true)}
                                  disabled={isSoapViewMode}
                                >
                                  <FlaskConical className="w-4 h-4 mr-2" />
                                  Investigations
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Add Investigation Results</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        {/* Mobile dropdown */}
                        <div className="sm:hidden">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon" disabled={isSoapViewMode}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setShowPhysicalExamDialog(true)}>
                                <Stethoscope className="w-4 h-4 mr-2" />
                                Physical Exam
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setShowInvestigationDialog(true)}>
                                <FlaskConical className="w-4 h-4 mr-2" />
                                Investigations
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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
                        {/* Desktop buttons */}
                        <div className="hidden sm:flex gap-2">
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
                            disabled={isSoapViewMode}
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
                        {/* Mobile dropdown */}
                        <div className="sm:hidden">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon" disabled={isSoapViewMode}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
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
                                  disabled={isSoapViewMode}
                                />
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={handleGenerateAssessment} disabled={isGenerating}>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate with AI
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                        {/* Desktop buttons */}
                        <div className="hidden sm:flex gap-2">
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
                            disabled={isSoapViewMode}
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
                        {/* Mobile dropdown */}
                        <div className="sm:hidden">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon" disabled={isSoapViewMode}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
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
                                  disabled={isSoapViewMode}
                                />
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={handleGeneratePlan} disabled={isGenerating}>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate with AI
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                  </>
                )}
              </TabsContent>

              <TabsContent value="prescription" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-4 flex-wrap">
                    <Button
                      onClick={handleGeneratePrescription}
                      disabled={isGeneratingPrescription || isPrescriptionViewMode}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      {isGeneratingPrescription ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="hidden sm:inline">Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span className="hidden sm:inline">Generate Prescription</span>
                        </>
                      )}
                    </Button>
                    <PrescriptionSnippetsDialog
                      onInsert={(content) => {
                        const editor = prescriptionEditorRef.current?.getEditor();
                        if (editor) {
                          const formattedContent = content.replace(/\n/g, '<br />');
                          editor.chain().focus().insertContent(formattedContent).run();
                        }
                      }}
                      currentContent={prescription}
                    />

                    <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

                    {/* Desktop: Show individual icon buttons */}
                    <div className="hidden sm:flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                  <FileDown className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={exportPrescriptionToMarkdown}>Export as Markdown</DropdownMenuItem>
                                <DropdownMenuItem onClick={exportPrescriptionToPDF}>Export as PDF</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TooltipTrigger>
                          <TooltipContent>Export Prescription</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => setIsPrescriptionViewMode(!isPrescriptionViewMode)}
                            >
                              {isPrescriptionViewMode ? <Edit className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{isPrescriptionViewMode ? "Edit Mode" : "View Mode"}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={handleSave}>
                              <Save className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Save</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => setShowLivePreview(true)}>
                              <FileSearch className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Preview Prescription</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => setShowPrescriptionEmail(true)}>
                              <Mail className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Email Prescription</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)}>
                              <Settings className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Prescription Settings</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {/* Mobile: Show dropdown menu for actions */}
                    <div className="sm:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={exportPrescriptionToMarkdown}>
                            <FileDown className="h-4 w-4 mr-2" />
                            Export as Markdown
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={exportPrescriptionToPDF}>
                            <FileDown className="h-4 w-4 mr-2" />
                            Export as PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setIsPrescriptionViewMode(!isPrescriptionViewMode)}>
                            {isPrescriptionViewMode ? <Edit className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                            {isPrescriptionViewMode ? "Edit Mode" : "View Mode"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleSave}>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setShowLivePreview(true)}>
                            <FileSearch className="h-4 w-4 mr-2" />
                            Preview Prescription
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setShowPrescriptionEmail(true)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Email Prescription
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Prescription Settings
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Prescription Details</Label>
                    </div>
                    
                    {/* Hidden buttons for context menu triggers */}
                    <div className="hidden">
                      <div data-transcribe-button>
                        <TranscribeButton
                          onTranscription={handleTranscribeComplete}
                          disabled={isPrescriptionViewMode}
                        />
                      </div>
                      <div data-translate-button>
                        <TranslateButton
                          textToTranslate={prescription.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')}
                          onTranslation={(translatedText, languageName) => handleTranslateComplete(translatedText, languageName)}
                          disabled={isPrescriptionViewMode}
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      {isPrescriptionViewMode ? (
                        <div 
                          className="prose prose-sm max-w-none border rounded-md p-4 min-h-[400px]"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(prescription) }}
                        />
                      ) : (
                        <ContextMenu>
                          <ContextMenuTrigger>
                            <RichTextEditor
                              ref={prescriptionEditorRef}
                              content={prescription}
                              onChange={setPrescription}
                              placeholder="Enter prescription details using the formatting toolbar above..."
                              onTranscribe={handleContextMenuTranscribe}
                              onTranslate={handleContextMenuTranslate}
                              showTranscribeTranslate={true}
                            />
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuItem onClick={handleContextMenuTranscribe}>
                              <span>Transcribe Audio</span>
                            </ContextMenuItem>
                            <ContextMenuItem onClick={handleContextMenuTranslate}>
                              <span>Translate Text</span>
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
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
                      {/* Desktop buttons */}
                      <div className="hidden sm:flex gap-2">
                        <Button variant="outline" onClick={() => setShowRequisitionDialog(true)}>
                          <FlaskConical className="w-4 h-4 mr-2" />
                          Generate Requisition
                        </Button>
                        <Button onClick={() => setIsUploadDialogOpen(true)}>
                          <FileText className="w-4 h-4 mr-2" />
                          Upload Document
                        </Button>
                      </div>
                      {/* Mobile dropdown */}
                      <div className="sm:hidden">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setShowRequisitionDialog(true)}>
                              <FlaskConical className="w-4 h-4 mr-2" />
                              Generate Requisition
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsUploadDialogOpen(true)}>
                              <FileText className="w-4 h-4 mr-2" />
                              Upload Document
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
                                {doc.review_status === 'reviewed' ? (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                                    Reviewed
                                  </Badge>
                                ) : doc.review_status === 'needs_review' ? (
                                  <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-200">
                                    Needs Review
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                                    Pending
                                  </Badge>
                                )}
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
                                    <DropdownMenuItem onClick={() => openRenameDocument(doc)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Rename
                                    </DropdownMenuItem>
                                    {doc.document_type === "Requisition" && doc.metadata?.selectionKeys && (
                                      <DropdownMenuItem onClick={() => openEditRequisition(doc)}>
                                        <FlaskConical className="h-4 w-4 mr-2" />
                                        Edit Requisition
                                      </DropdownMenuItem>
                                    )}
                                    {doc.review_status !== 'reviewed' && (
                                      <DropdownMenuItem onClick={() => handleUpdateReviewStatus(doc.id, 'reviewed')}>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Mark as Reviewed
                                      </DropdownMenuItem>
                                    )}
                                    {doc.review_status !== 'needs_review' && (
                                      <DropdownMenuItem onClick={() => handleUpdateReviewStatus(doc.id, 'needs_review')}>
                                        <AlertCircle className="h-4 w-4 mr-2" />
                                        Mark as Needs Review
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem 
                                      onClick={() => confirmDeleteDocument(doc.id)}
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
        </div>
        </div>
      </div>

      <DocumentUploadDialog
        open={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        visitId={visitId!}
        patientId={patient.id}
        patientName={`${patient.first_name} ${patient.last_name}`}
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => documentToDelete && handleDeleteDocument(documentToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PrescriptionPreviewDialog
        open={showPrescriptionPreview}
        onOpenChange={setShowPrescriptionPreview}
        generatedContent={generatedPrescription}
        onInsert={handleInsertPrescription}
      />

      <TranscribeOutputDialog
        open={showTranscribeOutput}
        onOpenChange={setShowTranscribeOutput}
        transcribedText={transcribedText}
        onInsertAtCursor={() => handleInsertTranscription("cursor")}
        onInsertAtEnd={() => handleInsertTranscription("end")}
      />

      <TranslateOutputDialog
        open={showTranslateOutput}
        onOpenChange={setShowTranslateOutput}
        translatedText={translatedText}
        targetLanguage={translatedLanguage}
        onInsertAtCursor={() => handleInsertTranslation("cursor")}
        onInsertAtEnd={() => handleInsertTranslation("end")}
      />

      <PrescriptionLivePreviewDialog
        open={showLivePreview}
        onOpenChange={setShowLivePreview}
        prescription={prescription}
        patientName={`${patient.first_name} ${patient.last_name}`}
        patientAge={patient.date_of_birth ? `${new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()}` : undefined}
        patientContact={patient.contact_number}
        patientAddress={patient.address}
        patientId={patient.id}
      />

      <PhysicalExaminationDialog
        open={showPhysicalExamDialog}
        onOpenChange={setShowPhysicalExamDialog}
        onInsert={(text) => {
          const dateHeader = `\n\n--- PHYSICAL EXAMINATION (${format(new Date(), "yyyy-MM-dd HH:mm")}) ---\n`;
          setObjective((prev) => {
            const trimmedPrev = prev.trim();
            return trimmedPrev ? trimmedPrev + dateHeader + text : text;
          });
        }}
        vitalSigns={vitalSigns}
        onVitalSignsChange={handleVitalSignsChange}
        patientDateOfBirth={patient?.date_of_birth}
        patientGender={patient?.gender}
      />

      <InvestigationBuilderDialog
        open={showInvestigationDialog}
        onOpenChange={setShowInvestigationDialog}
        onInsert={(text) => {
          const dateHeader = `\n\n--- INVESTIGATIONS (${format(new Date(), "yyyy-MM-dd HH:mm")}) ---\n`;
          setObjective((prev) => {
            const trimmedPrev = prev.trim();
            return trimmedPrev ? trimmedPrev + dateHeader + text : text;
          });
        }}
      />

      <HPIBuilder
        open={showHPIDialog}
        onClose={() => setShowHPIDialog(false)}
        currentHPI=""
        onUpdate={(text) => {
          const dateHeader = `\n\n--- COMPLAINT / HPI (${format(new Date(), "yyyy-MM-dd HH:mm")}) ---\n`;
          setSubjective((prev) => {
            const trimmedPrev = prev.trim();
            return trimmedPrev ? trimmedPrev + dateHeader + text : text;
          });
          setShowHPIDialog(false);
        }}
      />

      <ROSBuilder
        open={showROSDialog}
        onClose={() => setShowROSDialog(false)}
        currentROS=""
        onUpdate={(text) => {
          const dateHeader = `\n\n--- REVIEW OF SYSTEMS (${format(new Date(), "yyyy-MM-dd HH:mm")}) ---\n`;
          setSubjective((prev) => {
            const trimmedPrev = prev.trim();
            return trimmedPrev ? trimmedPrev + dateHeader + text : text;
          });
          setShowROSDialog(false);
        }}
      />

      <SOAPExportSettingsDialog
        open={showSOAPExportSettings}
        onOpenChange={setShowSOAPExportSettings}
      />

      <SOAPLivePreviewDialog
        open={showSOAPPreview}
        onOpenChange={setShowSOAPPreview}
        patient={patient}
        subjective={subjective}
        objective={objective}
        assessment={assessment}
        plan={plan}
      />

      <SOAPEmailDialog
        open={showSOAPEmail}
        onOpenChange={setShowSOAPEmail}
        patientName={patient ? `${patient.first_name} ${patient.last_name}` : ""}
        patientEmail={patient?.email}
        patientAge={patient?.date_of_birth ? differenceInYears(new Date(), new Date(patient.date_of_birth)) : undefined}
        patientGender={patient?.gender}
        patientContact={patient?.contact_number}
        soapNote={{ subjective, objective, assessment, plan }}
      />

      <PrescriptionEmailDialog
        open={showPrescriptionEmail}
        onOpenChange={setShowPrescriptionEmail}
        patientName={patient ? `${patient.first_name} ${patient.last_name}` : ""}
        patientEmail={patient?.email || undefined}
        patientId={patient?.id || ""}
        patientAge={patient?.date_of_birth ? `${differenceInYears(new Date(), new Date(patient.date_of_birth))}` : undefined}
        patientContact={patient?.contact_number}
        patientAddress={patient?.address || undefined}
        prescription={prescription}
      />

      <InvestigationRequisitionDialog
        open={showRequisitionDialog}
        onOpenChange={(open) => {
          setShowRequisitionDialog(open);
          if (!open) setEditingRequisitionDoc(null);
        }}
        editMode={!!editingRequisitionDoc}
        initialSelection={
          editingRequisitionDoc?.metadata
            ? {
                keys: editingRequisitionDoc.metadata.selectionKeys || [],
                priority: editingRequisitionDoc.metadata.priority,
                fasting: editingRequisitionDoc.metadata.fasting,
                clinicalNotes: editingRequisitionDoc.metadata.clinicalNotes,
              }
            : null
        }
        patientName={patient ? `${patient.first_name} ${patient.last_name}` : ""}
        patientAge={patient ? `${differenceInYears(new Date(), new Date(patient.date_of_birth))} years` : undefined}
        patientGender={patient?.gender}
        clinicalInfo={assessment || visit?.reason_for_visit}
        visitId={visitId}
        patientId={patient?.id}
        onGenerate={async (_requisitionText, selectedTests, priority, fasting, clinicalNotes, saveAsDocument, digitalSignature, useLetterhead, selectionKeys) => {
          const editingDoc = editingRequisitionDoc;
          setEditingRequisitionDoc(null);
          try {
            const { data: settings } = await supabase
              .from("prescription_settings")
              .select("*")
              .single();

            // Group selected tests by their original categories
            const selectedGroups: { category: string; tests: string[] }[] = [];
            selectedTests.forEach((test) => {
              const existing = selectedGroups.find((g) => g.category === "Selected");
              if (existing) {
                existing.tests.push(test);
              } else {
                selectedGroups.push({ category: "Selected", tests: [test] });
              }
            });

            // Get logo and signature data URLs if configured and letterhead is enabled
            let logoDataUrl: string | undefined;
            let signatureDataUrl: string | undefined;

            if (useLetterhead && settings?.logo_path) {
              try {
                const { data } = await supabase.storage
                  .from("prescription-assets")
                  .download(settings.logo_path);
                if (data) {
                  logoDataUrl = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(data);
                  });
                }
              } catch (e) {
                console.error("Error loading logo:", e);
              }
            }

            if (settings?.signature_path) {
              try {
                const { data } = await supabase.storage
                  .from("prescription-assets")
                  .download(settings.signature_path);
                if (data) {
                  signatureDataUrl = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(data);
                  });
                }
              } catch (e) {
                console.error("Error loading signature:", e);
              }
            }

            // Apply letterhead settings or use minimal settings
            const pdfSettings = useLetterhead ? settings : {
              ...settings,
              use_own_letterhead: true, // This disables the header rendering in PDF
            };

            const patientName = patient ? `${patient.first_name} ${patient.last_name}` : "";
            const patientAge = patient
              ? `${differenceInYears(new Date(), new Date(patient.date_of_birth))} years`
              : undefined;

            // If saving to documents, generate a blob so we can upload it.
            if (saveAsDocument && visitId && patient?.id) {
              const { data: userRes } = await supabase.auth.getUser();
              const user = userRes.user;
              if (!user) throw new Error("User not authenticated");

              const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
              const fileName = editingDoc?.file_name
                || `Investigation_Requisition_${patient.first_name}_${patient.last_name}_${timestamp}.pdf`;
              const storagePath = editingDoc?.file_path
                || `${user.id}/${visitId}/requisitions/${Date.now()}.pdf`;

              const pdfResult = (await exportRequisitionToPDF(
                selectedGroups,
                patient.id,
                patientName,
                patientAge,
                patient.gender,
                patient.contact_number,
                patient.address,
                clinicalNotes || assessment || visit?.reason_for_visit,
                priority,
                fasting,
                pdfSettings as any,
                useLetterhead ? logoDataUrl : undefined,
                signatureDataUrl,
                { output: "blob", fileName },
                digitalSignature
              )) as { blob: Blob; fileName: string };

              const { error: uploadError } = await supabase.storage
                .from("visit-documents")
                .upload(storagePath, pdfResult.blob, {
                  contentType: "application/pdf",
                  upsert: true,
                });
              if (uploadError) throw uploadError;

              const requisitionMeta = {
                selectionKeys: selectionKeys || [],
                priority,
                fasting,
                clinicalNotes,
                useLetterhead,
              };

              if (editingDoc) {
                const { error: updateError } = await supabase
                  .from("documents")
                  .update({
                    description: `Investigation requisition (${selectedTests.length} tests) - ${priority?.toUpperCase() || "ROUTINE"}`,
                    file_size: pdfResult.blob.size,
                    upload_date: new Date().toISOString(),
                    metadata: requisitionMeta,
                  })
                  .eq("id", editingDoc.id);
                if (updateError) throw updateError;

                fetchDocuments();
                toast({
                  title: "Success",
                  description: "Requisition updated",
                });
                return;
              }

              const { error: dbError } = await supabase.from("documents").insert({
                visit_id: visitId,
                patient_id: patient.id,
                user_id: user.id,
                document_date: new Date().toISOString().split("T")[0],
                document_type: "Requisition",
                description: `Investigation requisition (${selectedTests.length} tests) - ${priority?.toUpperCase() || "ROUTINE"}`,
                file_path: storagePath,
                file_name: pdfResult.fileName,
                file_type: "application/pdf",
                file_size: pdfResult.blob.size,
                upload_date: new Date().toISOString(),
                review_status: "reviewed",
                metadata: requisitionMeta,
              });
              if (dbError) throw dbError;

              fetchDocuments();

              toast({
                title: "Success",
                description: "Investigation requisition generated and saved to documents",
              });
              return;
            }

            // Default behavior: just download
            await exportRequisitionToPDF(
              selectedGroups,
              patient?.id || "",
              patientName,
              patientAge,
              patient?.gender,
              patient?.contact_number,
              patient?.address,
              clinicalNotes || assessment || visit?.reason_for_visit,
              priority,
              fasting,
              pdfSettings as any,
              useLetterhead ? logoDataUrl : undefined,
              signatureDataUrl,
              undefined,
              digitalSignature
            );

            toast({
              title: "Success",
              description: "Investigation requisition generated and downloaded",
            });
          } catch (error) {
            console.error("Error generating requisition:", error);
            toast({
              title: "Error",
              description: "Failed to generate requisition PDF",
              variant: "destructive",
            });
          }
        }}
      />

      <VersionHistoryDialog
        open={showVersionHistory}
        onOpenChange={setShowVersionHistory}
        visitId={visitId || ""}
        onRestore={handleRestoreVersion}
      />

      <Dialog open={!!renameDoc} onOpenChange={(open) => !open && setRenameDoc(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
            <DialogDescription>Update the name shown in the documents list.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename-document">Document name</Label>
            <Input
              id="rename-document"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleRenameDocument(); }}
              placeholder="Enter a document name"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDoc(null)}>Cancel</Button>
            <Button onClick={handleRenameDocument} disabled={isRenaming || !renameValue.trim()}>
              {isRenaming ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
