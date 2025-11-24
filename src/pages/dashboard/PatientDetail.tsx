import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  ChevronDown,
  Edit,
  Trash2,
  FileDown,
  AlertCircle,
  Eye,
  ExternalLink,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  contact_number: string;
  email: string | null;
  address: string | null;
  blood_group: string | null;
  health_card_number: string | null;
  medical_history_ongoing: string | null;
  medical_history_past: string | null;
  surgical_history: string | null;
  hospitalization_history: string | null;
  family_history: string | null;
  mental_health_history: string | null;
  ongoing_medications: any;
  supplements: any;
  vaccinations: any;
  allergic_history_drug: any;
  allergic_history_food: any;
  allergic_history_env: any;
  smoking_status: string;
  alcohol_consumption: string;
  recreational_drug_use: string | null;
  exercise_habits: string | null;
  diet: string | null;
  occupation: string | null;
  living_environment: string | null;
  birth_history: string | null;
  developmental_history: string | null;
  childhood_illnesses: string | null;
  accidents_injuries: string | null;
  menstrual_pregnancy_history: string | null;
  preventive_screening_history: string | null;
}

interface Visit {
  id: string;
  visit_date: string;
  visit_type: string;
  reason_for_visit: string;
  soap_assessment: string | null;
  status: string;
}

interface Document {
  id: string;
  document_date: string;
  description: string;
  upload_date: string;
  document_type: string;
  visit_id: string;
  file_name: string;
}

const PatientDetail = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatient();
    fetchVisits();
    fetchDocuments();
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
        .select("id, visit_date, visit_type, reason_for_visit, soap_assessment, status")
        .eq("patient_id", patientId)
        .order("visit_date", { ascending: false });

      if (error) throw error;
      setVisits(data || []);
    } catch (error: any) {
      console.error(error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("documents")
        .select("id, document_date, description, upload_date, document_type, visit_id, file_name")
        .eq("patient_id", patientId)
        .order("document_date", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error(error);
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

  const getAllergies = () => {
    const allergies = [];
    if (patient?.allergic_history_drug && Array.isArray(patient.allergic_history_drug) && patient.allergic_history_drug.length > 0) {
      allergies.push(...patient.allergic_history_drug.map((a: any) => `Drug: ${a}`));
    }
    if (patient?.allergic_history_food && Array.isArray(patient.allergic_history_food) && patient.allergic_history_food.length > 0) {
      allergies.push(...patient.allergic_history_food.map((a: any) => `Food: ${a}`));
    }
    if (patient?.allergic_history_env && Array.isArray(patient.allergic_history_env) && patient.allergic_history_env.length > 0) {
      allergies.push(...patient.allergic_history_env.map((a: any) => `Env: ${a}`));
    }
    return allergies.length > 0 ? allergies.join(", ") : "None";
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this patient?")) return;
    
    try {
      const { error } = await (supabase as any)
        .from("patients")
        .delete()
        .eq("id", patientId);

      if (error) throw error;
      toast.success("Patient deleted successfully");
      navigate("/dashboard/patients");
    } catch (error: any) {
      toast.error("Failed to delete patient");
      console.error(error);
    }
  };

  const handleExport = (format: string) => {
    if (!patient) return;

    if (format === "md") {
      exportToMarkdown();
    } else if (format === "pdf") {
      exportToPDF();
    }
  };

  const exportToMarkdown = () => {
    if (!patient) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const age = calculateAge(patient.date_of_birth);
    const allergies = getAllergies();

    const markdownContent = `# Patient Record: ${patient.first_name} ${patient.last_name}

## Basic Information
- **Name:** ${patient.first_name} ${patient.last_name}
- **Date of Birth:** ${new Date(patient.date_of_birth).toLocaleDateString()}
- **Age:** ${age} years
- **Gender:** ${patient.gender}
- **Health Card Number:** ${patient.health_card_number || "N/A"}
- **Contact Number:** ${patient.contact_number}
- **Email:** ${patient.email || "N/A"}
- **Address:** ${patient.address || "N/A"}

## Medical History
### Ongoing Medical Conditions
${patient.medical_history_ongoing || "None reported"}

### Past Medical History
${patient.medical_history_past || "None reported"}

### Family History
${patient.family_history || "None reported"}

### Mental Health History
${patient.mental_health_history || "None reported"}

### Surgical History
${patient.surgical_history || "None reported"}

### Hospitalization History
${patient.hospitalization_history || "None reported"}

## Additional Medical History

### Birth History
${patient.birth_history || "None reported"}

### Developmental History
${patient.developmental_history || "None reported"}

### Childhood Illnesses
${patient.childhood_illnesses || "None reported"}

### Accidents or Injuries
${patient.accidents_injuries || "None reported"}
${patient.gender === "FEMALE" && patient.menstrual_pregnancy_history ? `
### Menstrual and Pregnancy History
${patient.menstrual_pregnancy_history}
` : ""}
### Preventive Screening History
${patient.preventive_screening_history || "None reported"}

## Allergies
${allergies}

## Medications & Supplements
### Ongoing Medications
${
  Array.isArray(patient.ongoing_medications) && patient.ongoing_medications.length > 0
    ? patient.ongoing_medications.map((med: any) => `- ${med}`).join("\n")
    : "None reported"
}

### Supplements
${
  Array.isArray(patient.supplements) && patient.supplements.length > 0
    ? patient.supplements.map((sup: any) => `- ${sup}`).join("\n")
    : "None reported"
}

## Lifestyle Factors
- **Blood Group:** ${patient.blood_group || "Unknown"}
- **Smoking Status:** ${patient.smoking_status}
- **Alcohol Consumption:** ${patient.alcohol_consumption}
- **Recreational Drug Use:** ${patient.recreational_drug_use || "None reported"}
- **Diet:** ${patient.diet || "Not specified"}
- **Exercise Habits:** ${patient.exercise_habits || "Not specified"}
- **Living Environment:** ${patient.living_environment || "Not specified"}
- **Occupation:** ${patient.occupation || "Not specified"}

## Vaccinations
${
  Array.isArray(patient.vaccinations) && patient.vaccinations.length > 0
    ? patient.vaccinations.map((vac: any) => `- ${vac}`).join("\n")
    : "None reported"
}

## Visits History
${
  visits.length > 0
    ? visits
        .map(
          (visit) =>
            `### ${new Date(visit.visit_date).toLocaleDateString()} - ${visit.visit_type}
**Reason:** ${visit.reason_for_visit}
**Status:** ${visit.status}
`
        )
        .join("\n")
    : "No visits recorded"
}

---
*Generated on ${new Date().toLocaleString()}*
`;

    const blob = new Blob([markdownContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Patient_${patient.last_name}_${patient.first_name}_${timestamp}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Markdown file exported successfully");
  };

  const exportToPDF = () => {
    if (!patient) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const doc = new jsPDF();
    const age = calculateAge(patient.date_of_birth);
    const allergies = getAllergies();
    let yPos = 20;

    // Header with logo/title
    doc.setFontSize(24);
    doc.setTextColor(33, 37, 41);
    doc.text("PATIENT MEDICAL RECORD", 105, yPos, { align: "center" });
    
    yPos += 15;
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;

    // Patient Header Information
    doc.setFontSize(18);
    doc.setTextColor(33, 37, 41);
    doc.text(`${patient.first_name} ${patient.last_name}`, 20, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`DOB: ${patient.date_of_birth} (${age} years) | Gender: ${patient.gender}`, 20, yPos);
    
    yPos += 5;
    doc.text(`Contact: ${patient.contact_number} | Blood Group: ${patient.blood_group || "Not recorded"}`, 20, yPos);
    
    yPos += 5;
    doc.text(`Health Card: ${patient.health_card_number || "Not provided"}`, 20, yPos);
    
    yPos += 8;
    doc.setFontSize(9);
    doc.setTextColor(220, 53, 69);
    doc.text(`⚠ ALLERGIES: ${allergies}`, 20, yPos);
    
    yPos += 10;
    doc.setLineWidth(0.3);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;

    // Demographics Table
    doc.setFontSize(14);
    doc.setTextColor(33, 37, 41);
    doc.text("Demographics", 20, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [["Field", "Value"]],
      body: [
        ["Gender", patient.gender],
        ["Blood Group", patient.blood_group || "Not recorded"],
        ["Contact Number", patient.contact_number],
        ["Email", patient.email || "Not provided"],
        ["Address", patient.address || "Not provided"],
      ],
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 20, right: 20 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Medical History Section
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(33, 37, 41);
    doc.text("Medical History", 20, yPos);
    yPos += 5;

    const medicalHistoryData = [];
    if (patient.medical_history_ongoing) {
      medicalHistoryData.push(["Ongoing Conditions", patient.medical_history_ongoing]);
    }
    if (patient.medical_history_past) {
      medicalHistoryData.push(["Past Medical History", patient.medical_history_past]);
    }
    if (patient.surgical_history) {
      medicalHistoryData.push(["Surgical History", patient.surgical_history]);
    }
    if (patient.hospitalization_history) {
      medicalHistoryData.push(["Hospitalization History", patient.hospitalization_history]);
    }
    if (patient.family_history) {
      medicalHistoryData.push(["Family History", patient.family_history]);
    }
    if (patient.mental_health_history) {
      medicalHistoryData.push(["Mental Health", patient.mental_health_history]);
    }
    if (patient.birth_history) {
      medicalHistoryData.push(["Birth History", patient.birth_history]);
    }
    if (patient.developmental_history) {
      medicalHistoryData.push(["Developmental History", patient.developmental_history]);
    }
    if (patient.childhood_illnesses) {
      medicalHistoryData.push(["Childhood Illnesses", patient.childhood_illnesses]);
    }
    if (patient.accidents_injuries) {
      medicalHistoryData.push(["Accidents/Injuries", patient.accidents_injuries]);
    }
    if (patient.gender === "FEMALE" && patient.menstrual_pregnancy_history) {
      medicalHistoryData.push(["Menstrual/Pregnancy History", patient.menstrual_pregnancy_history]);
    }
    if (patient.preventive_screening_history) {
      medicalHistoryData.push(["Preventive Screening", patient.preventive_screening_history]);
    }

    if (medicalHistoryData.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [["Category", "Details"]],
        body: medicalHistoryData,
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 120 },
        },
        margin: { left: 20, right: 20 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Medications & Supplements
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text("Medications & Supplements", 20, yPos);
    yPos += 5;

    const medicationData = [];
    if (patient.ongoing_medications && Array.isArray(patient.ongoing_medications)) {
      patient.ongoing_medications.forEach((med: string) => {
        medicationData.push(["Medication", med]);
      });
    }
    if (patient.supplements && Array.isArray(patient.supplements)) {
      patient.supplements.forEach((sup: string) => {
        medicationData.push(["Supplement", sup]);
      });
    }
    if (patient.vaccinations && Array.isArray(patient.vaccinations)) {
      patient.vaccinations.forEach((vac: string) => {
        medicationData.push(["Vaccination", vac]);
      });
    }

    if (medicationData.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [["Type", "Details"]],
        body: medicationData,
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 20, right: 20 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Allergies Section
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(220, 53, 69);
    doc.text("⚠ Allergies", 20, yPos);
    yPos += 5;

    const allergyData = [];
    if (patient.allergic_history_drug && Array.isArray(patient.allergic_history_drug)) {
      patient.allergic_history_drug.forEach((allergy: string) => {
        allergyData.push(["Drug", allergy]);
      });
    }
    if (patient.allergic_history_food && Array.isArray(patient.allergic_history_food)) {
      patient.allergic_history_food.forEach((allergy: string) => {
        allergyData.push(["Food", allergy]);
      });
    }
    if (patient.allergic_history_env && Array.isArray(patient.allergic_history_env)) {
      patient.allergic_history_env.forEach((allergy: string) => {
        allergyData.push(["Environmental", allergy]);
      });
    }

    if (allergyData.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [["Type", "Allergen"]],
        body: allergyData,
        theme: "grid",
        headStyles: { fillColor: [220, 53, 69], textColor: 255, fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 20, right: 20 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("No known allergies", 20, yPos);
      yPos += 10;
    }

    // Social History
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(33, 37, 41);
    doc.text("Social History", 20, yPos);
    yPos += 5;

    const socialHistoryData = [
      ["Smoking Status", patient.smoking_status],
      ["Alcohol Consumption", patient.alcohol_consumption],
    ];

    if (patient.recreational_drug_use) {
      socialHistoryData.push(["Recreational Drug Use", patient.recreational_drug_use]);
    }
    if (patient.exercise_habits) {
      socialHistoryData.push(["Exercise Habits", patient.exercise_habits]);
    }
    if (patient.diet) {
      socialHistoryData.push(["Diet", patient.diet]);
    }
    if (patient.occupation) {
      socialHistoryData.push(["Occupation", patient.occupation]);
    }
    if (patient.living_environment) {
      socialHistoryData.push(["Living Environment", patient.living_environment]);
    }

    autoTable(doc, {
      startY: yPos,
      head: [["Category", "Details"]],
      body: socialHistoryData,
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 20, right: 20 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
        105,
        285,
        { align: "center" }
      );
      doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: "right" });
    }

    // Save the PDF
    doc.save(`Patient_${patient.first_name}_${patient.last_name}_${timestamp}.pdf`);
    toast.success("PDF exported successfully");
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-muted-foreground">Loading patient...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Patient not found</p>
        <Button onClick={() => navigate("/dashboard/patients")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Patients
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <Card className="p-6 border-b rounded-none shadow-sm">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/dashboard/patients")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Patients
        </Button>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              {patient.first_name} {patient.last_name}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>DOB: {patient.date_of_birth} ({calculateAge(patient.date_of_birth)} years)</span>
              <span>Health Card: {patient.health_card_number || "Not provided"}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm">Allergies: {getAllergies()}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/dashboard/patients/${patientId}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("md")}>
                <FileDown className="mr-2 h-4 w-4" />
                Export MD
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                <FileDown className="mr-2 h-4 w-4" />
                Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      {/* Tabs Layout */}
      <div className="p-8">
        <Tabs defaultValue="information" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="information">Patient Information</TabsTrigger>
            <TabsTrigger value="visits">Visit History</TabsTrigger>
            <TabsTrigger value="documents">Patient Documents</TabsTrigger>
          </TabsList>

          {/* Tab 1: Patient Information */}
          <TabsContent value="information" className="space-y-4 mt-6">
            <div className="space-y-4">

        {/* Demographics */}
        <Collapsible>
          <Card>
            <CollapsibleTrigger className="w-full p-4 flex justify-between items-center hover:bg-accent/50 transition-colors">
              <h3 className="text-lg font-medium">Demographics</h3>
              <ChevronDown className="h-5 w-5 transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 pt-0 space-y-3 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium">{patient.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Blood Group</p>
                    <p className="font-medium">{patient.blood_group || "Not recorded"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <p className="font-medium">{patient.contact_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{patient.email || "Not provided"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{patient.address || "Not provided"}</p>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Medical History */}
        <Collapsible>
          <Card>
            <CollapsibleTrigger className="w-full p-4 flex justify-between items-center hover:bg-accent/50 transition-colors">
              <h3 className="text-lg font-medium">Medical History</h3>
              <ChevronDown className="h-5 w-5 transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 pt-0 space-y-3 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Ongoing Conditions</p>
                  <p className="font-medium">{patient.medical_history_ongoing || "None recorded"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Past Medical History</p>
                  <p className="font-medium">{patient.medical_history_past || "None recorded"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Surgical History</p>
                  <p className="font-medium">{patient.surgical_history || "None recorded"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hospitalization History</p>
                  <p className="font-medium">{patient.hospitalization_history || "None recorded"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Family History</p>
                  <p className="font-medium">{patient.family_history || "None recorded"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mental Health History</p>
                  <p className="font-medium">{patient.mental_health_history || "None recorded"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Birth History</p>
                  <p className="font-medium">{patient.birth_history || "None recorded"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Developmental History</p>
                  <p className="font-medium">{patient.developmental_history || "None recorded"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Childhood Illnesses</p>
                  <p className="font-medium">{patient.childhood_illnesses || "None recorded"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Accidents or Injuries</p>
                  <p className="font-medium">{patient.accidents_injuries || "None recorded"}</p>
                </div>
                {patient.gender === "FEMALE" && (
                  <div>
                    <p className="text-sm text-muted-foreground">Menstrual and Pregnancy History</p>
                    <p className="font-medium">{patient.menstrual_pregnancy_history || "None recorded"}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Preventive Screening History</p>
                  <p className="font-medium">{patient.preventive_screening_history || "None recorded"}</p>
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Medications & Supplements */}
        <Collapsible>
          <Card>
            <CollapsibleTrigger className="w-full p-4 flex justify-between items-center hover:bg-accent/50 transition-colors">
              <h3 className="text-lg font-medium">Medications & Supplements</h3>
              <ChevronDown className="h-5 w-5 transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 pt-0 space-y-3 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Ongoing Medications</p>
                  <p className="font-medium">
                    {patient.ongoing_medications && Array.isArray(patient.ongoing_medications) && patient.ongoing_medications.length > 0
                      ? patient.ongoing_medications.join(", ")
                      : "None"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Supplements</p>
                  <p className="font-medium">
                    {patient.supplements && Array.isArray(patient.supplements) && patient.supplements.length > 0
                      ? patient.supplements.join(", ")
                      : "None"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vaccinations</p>
                  <p className="font-medium">
                    {patient.vaccinations && Array.isArray(patient.vaccinations) && patient.vaccinations.length > 0
                      ? patient.vaccinations.join(", ")
                      : "None"}
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Social History */}
        <Collapsible>
          <Card>
            <CollapsibleTrigger className="w-full p-4 flex justify-between items-center hover:bg-accent/50 transition-colors">
              <h3 className="text-lg font-medium">Social History</h3>
              <ChevronDown className="h-5 w-5 transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 pt-0 space-y-3 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Smoking Status</p>
                    <p className="font-medium">{patient.smoking_status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Alcohol Consumption</p>
                    <p className="font-medium">{patient.alcohol_consumption}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Recreational Drug Use</p>
                    <p className="font-medium">{patient.recreational_drug_use || "Not recorded"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Exercise Habits</p>
                    <p className="font-medium">{patient.exercise_habits || "Not recorded"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Diet</p>
                    <p className="font-medium">{patient.diet || "Not recorded"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Occupation</p>
                    <p className="font-medium">{patient.occupation || "Not recorded"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Living Environment</p>
                    <p className="font-medium">{patient.living_environment || "Not recorded"}</p>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
            </div>
          </TabsContent>

          {/* Tab 2: Visit History */}
          <TabsContent value="visits" className="space-y-4 mt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">Visit History</h2>
                <p className="text-sm text-muted-foreground">Patient's previous visits</p>
              </div>
              <Button onClick={() => navigate(`/dashboard/patients/${patientId}/add-visit`)}>
                <Plus className="mr-2 h-4 w-4" />
                New Visit
              </Button>
            </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="flex items-center gap-1">
                  Date <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Assessment</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No visits recorded yet
                </TableCell>
              </TableRow>
            ) : (
              visits.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell>
                    {new Date(visit.visit_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{visit.visit_type}</Badge>
                  </TableCell>
                  <TableCell>{visit.reason_for_visit}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {visit.soap_assessment || "Not completed"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/dashboard/clinical-documentation/${visit.id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
          </TabsContent>

          {/* Tab 3: Patient Documents */}
          <TabsContent value="documents" className="space-y-4 mt-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Patient Documents</h2>
              <p className="text-sm text-muted-foreground">All documents uploaded for this patient across all visits</p>
            </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="flex items-center gap-1">
                  Doc Date <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Description <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Upload Date <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Status <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Visit</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No documents uploaded yet
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    {new Date(doc.document_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell>{doc.description}</TableCell>
                  <TableCell>
                    {new Date(doc.upload_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Need Review
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto"
                      onClick={() => navigate(`/dashboard/clinical-documentation/${doc.visit_id}`)}
                    >
                      <ExternalLink className="mr-1 h-3 w-3" />
                      View Visit
                    </Button>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Document
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileDown className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
            </TableBody>
          </Table>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PatientDetail;
