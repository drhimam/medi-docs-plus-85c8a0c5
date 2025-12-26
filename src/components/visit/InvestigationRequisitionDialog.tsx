import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  X, 
  Beaker, 
  Heart, 
  Droplet, 
  Activity, 
  Brain, 
  Stethoscope, 
  Microscope, 
  Scan, 
  Radio, 
  Baby, 
  FileText,
  Download,
  Eye,
  Plus,
  Trash2,
  PlusCircle,
  Save,
  FolderOpen,
  Loader2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type InvestigationType = 
  | "hematology"
  | "biochemistry"
  | "lipidProfile"
  | "liverFunction"
  | "renalFunction"
  | "thyroid"
  | "diabetes"
  | "cardiac"
  | "urinalysis"
  | "microbiology"
  | "serology"
  | "coagulation"
  | "hormones"
  | "tumorMarkers"
  | "imaging"
  | "cardiology"
  | "obstetricGyn"
  | "custom";

type InvestigationTest = {
  name: string;
  unit?: string;
  normalRange?: string;
};

interface RequisitionTemplate {
  id: string;
  name: string;
  description: string | null;
  investigations: { category: string; tests: string[] }[];
  isPredefined?: boolean;
}

// Predefined investigation templates for common clinical scenarios
const PREDEFINED_TEMPLATES: Omit<RequisitionTemplate, "id">[] = [
  {
    name: "Annual Physical",
    description: "Comprehensive annual health screening",
    isPredefined: true,
    investigations: [
      { category: "Hematology", tests: ["Complete Blood Count (CBC)", "ESR"] },
      { category: "Biochemistry", tests: ["Blood Glucose (Fasting)", "Electrolytes Panel", "CRP (C-Reactive Protein)"] },
      { category: "Lipid Profile", tests: ["Lipid Profile (Complete)"] },
      { category: "Liver Function", tests: ["Liver Function Tests (LFT)"] },
      { category: "Renal Function", tests: ["Renal Function Tests (RFT)", "Urine Albumin/Creatinine Ratio (ACR)"] },
      { category: "Thyroid", tests: ["TSH"] },
      { category: "Urinalysis", tests: ["Routine Urinalysis"] },
    ],
  },
  {
    name: "Diabetes Workup",
    description: "Comprehensive diabetes evaluation and monitoring",
    isPredefined: true,
    investigations: [
      { category: "Diabetes", tests: ["HbA1c", "Fasting Blood Glucose", "Fasting Insulin", "C-Peptide"] },
      { category: "Lipid Profile", tests: ["Lipid Profile (Complete)"] },
      { category: "Renal Function", tests: ["Renal Function Tests (RFT)", "Urine Albumin/Creatinine Ratio (ACR)", "Microalbumin"] },
      { category: "Liver Function", tests: ["Liver Function Tests (LFT)"] },
      { category: "Hematology", tests: ["Complete Blood Count (CBC)"] },
      { category: "Urinalysis", tests: ["Routine Urinalysis"] },
    ],
  },
  {
    name: "Cardiac Evaluation",
    description: "Cardiovascular risk assessment and cardiac workup",
    isPredefined: true,
    investigations: [
      { category: "Cardiac Markers", tests: ["Troponin I", "BNP", "hs-CRP", "Homocysteine"] },
      { category: "Lipid Profile", tests: ["Lipid Profile (Complete)", "Apolipoprotein A1", "Apolipoprotein B", "Lipoprotein(a)"] },
      { category: "Coagulation", tests: ["D-Dimer", "PT (Prothrombin Time)", "INR"] },
      { category: "Biochemistry", tests: ["Electrolytes Panel", "Blood Glucose (Fasting)"] },
      { category: "Hematology", tests: ["Complete Blood Count (CBC)"] },
      { category: "Cardiology", tests: ["ECG (12-Lead)", "Echocardiogram (2D Echo)"] },
    ],
  },
  {
    name: "Thyroid Workup",
    description: "Complete thyroid function evaluation",
    isPredefined: true,
    investigations: [
      { category: "Thyroid", tests: ["Thyroid Function Tests (TFT)", "TSH", "Free T4 (FT4)", "Free T3 (FT3)", "Anti-TPO Antibodies", "Anti-Thyroglobulin Antibodies"] },
      { category: "Hematology", tests: ["Complete Blood Count (CBC)"] },
      { category: "Biochemistry", tests: ["Calcium (Total)", "25-Hydroxy Vitamin D"] },
      { category: "Imaging", tests: ["Ultrasound Thyroid"] },
    ],
  },
  {
    name: "Anemia Workup",
    description: "Comprehensive evaluation for anemia",
    isPredefined: true,
    investigations: [
      { category: "Hematology", tests: ["Complete Blood Count (CBC)", "Peripheral Blood Smear", "Reticulocyte Count", "Iron Studies", "Serum Iron", "TIBC", "Ferritin", "Vitamin B12", "Folate"] },
      { category: "Biochemistry", tests: ["Total Protein", "Albumin", "LDH"] },
    ],
  },
  {
    name: "Prenatal Panel",
    description: "First trimester prenatal screening",
    isPredefined: true,
    investigations: [
      { category: "Hematology", tests: ["Complete Blood Count (CBC)", "Hemoglobin (Hb)"] },
      { category: "Biochemistry", tests: ["Blood Glucose (Fasting)"] },
      { category: "Serology", tests: ["HIV 1 & 2 Antibody", "VDRL/RPR", "HBsAg", "Anti-HCV", "Rubella IgG/IgM"] },
      { category: "Urinalysis", tests: ["Routine Urinalysis", "Urine Culture & Sensitivity"] },
      { category: "OB-GYN", tests: ["Serum Beta-hCG", "TORCH Panel"] },
      { category: "Thyroid", tests: ["TSH"] },
    ],
  },
  {
    name: "Liver Function Panel",
    description: "Comprehensive liver assessment",
    isPredefined: true,
    investigations: [
      { category: "Liver Function", tests: ["Liver Function Tests (LFT)", "AST (SGOT)", "ALT (SGPT)", "ALP (Alkaline Phosphatase)", "GGT", "Total Bilirubin", "Direct Bilirubin", "Hepatitis B Surface Antigen (HBsAg)", "Hepatitis C Antibody (Anti-HCV)"] },
      { category: "Coagulation", tests: ["PT (Prothrombin Time)", "INR"] },
      { category: "Biochemistry", tests: ["Total Protein", "Albumin"] },
      { category: "Imaging", tests: ["Ultrasound Abdomen (Complete)"] },
    ],
  },
  {
    name: "Renal Function Panel",
    description: "Kidney function evaluation",
    isPredefined: true,
    investigations: [
      { category: "Renal Function", tests: ["Renal Function Tests (RFT)", "Blood Urea Nitrogen (BUN)", "Serum Creatinine", "eGFR", "24-Hour Urine Protein", "Urine Albumin/Creatinine Ratio (ACR)"] },
      { category: "Biochemistry", tests: ["Electrolytes Panel", "Calcium (Total)", "Phosphorus", "Uric Acid"] },
      { category: "Urinalysis", tests: ["Routine Urinalysis"] },
      { category: "Imaging", tests: ["Ultrasound KUB"] },
    ],
  },
];

const INVESTIGATION_CATEGORIES: Record<InvestigationType, { label: string; icon: any; tests: InvestigationTest[] }> = {
  hematology: {
    label: "Hematology",
    icon: Droplet,
    tests: [
      { name: "Complete Blood Count (CBC)" },
      { name: "Hemoglobin (Hb)" },
      { name: "Hematocrit (Hct)" },
      { name: "RBC Count" },
      { name: "WBC Count" },
      { name: "Platelet Count" },
      { name: "MCV" },
      { name: "MCH" },
      { name: "MCHC" },
      { name: "RDW" },
      { name: "Reticulocyte Count" },
      { name: "Peripheral Blood Smear" },
      { name: "ESR" },
      { name: "Iron Studies" },
      { name: "Serum Iron" },
      { name: "TIBC" },
      { name: "Ferritin" },
      { name: "Transferrin Saturation" },
      { name: "Vitamin B12" },
      { name: "Folate" },
    ],
  },
  biochemistry: {
    label: "Biochemistry",
    icon: Beaker,
    tests: [
      { name: "Blood Glucose (Fasting)" },
      { name: "Blood Glucose (Random)" },
      { name: "Blood Glucose (2hr PP)" },
      { name: "Electrolytes Panel" },
      { name: "Sodium (Na+)" },
      { name: "Potassium (K+)" },
      { name: "Chloride (Cl-)" },
      { name: "Bicarbonate (HCO3-)" },
      { name: "Calcium (Total)" },
      { name: "Calcium (Ionized)" },
      { name: "Magnesium" },
      { name: "Phosphorus" },
      { name: "Uric Acid" },
      { name: "Total Protein" },
      { name: "Albumin" },
      { name: "Globulin" },
      { name: "A/G Ratio" },
      { name: "Lactate" },
      { name: "Ammonia" },
      { name: "CRP (C-Reactive Protein)" },
      { name: "25-Hydroxy Vitamin D" },
    ],
  },
  lipidProfile: {
    label: "Lipid Profile",
    icon: Activity,
    tests: [
      { name: "Lipid Profile (Complete)" },
      { name: "Total Cholesterol" },
      { name: "LDL Cholesterol" },
      { name: "HDL Cholesterol" },
      { name: "VLDL Cholesterol" },
      { name: "Triglycerides" },
      { name: "Non-HDL Cholesterol" },
      { name: "Total/HDL Ratio" },
      { name: "LDL/HDL Ratio" },
      { name: "Apolipoprotein A1" },
      { name: "Apolipoprotein B" },
      { name: "Lipoprotein(a)" },
    ],
  },
  liverFunction: {
    label: "Liver Function",
    icon: Stethoscope,
    tests: [
      { name: "Liver Function Tests (LFT)" },
      { name: "AST (SGOT)" },
      { name: "ALT (SGPT)" },
      { name: "ALP (Alkaline Phosphatase)" },
      { name: "GGT" },
      { name: "Total Bilirubin" },
      { name: "Direct Bilirubin" },
      { name: "Indirect Bilirubin" },
      { name: "LDH" },
      { name: "Prothrombin Time (PT)" },
      { name: "INR" },
      { name: "Hepatitis B Surface Antigen (HBsAg)" },
      { name: "Hepatitis C Antibody (Anti-HCV)" },
      { name: "Hepatitis A IgM" },
      { name: "Hepatitis B Core Antibody (Anti-HBc)" },
    ],
  },
  renalFunction: {
    label: "Renal Function",
    icon: Droplet,
    tests: [
      { name: "Renal Function Tests (RFT)" },
      { name: "Blood Urea Nitrogen (BUN)" },
      { name: "Serum Creatinine" },
      { name: "BUN/Creatinine Ratio" },
      { name: "eGFR" },
      { name: "Cystatin C" },
      { name: "24-Hour Urine Protein" },
      { name: "24-Hour Urine Creatinine" },
      { name: "Creatinine Clearance" },
      { name: "Urine Albumin/Creatinine Ratio (ACR)" },
      { name: "Microalbumin" },
    ],
  },
  thyroid: {
    label: "Thyroid",
    icon: Activity,
    tests: [
      { name: "Thyroid Function Tests (TFT)" },
      { name: "TSH" },
      { name: "Free T4 (FT4)" },
      { name: "Free T3 (FT3)" },
      { name: "Total T4" },
      { name: "Total T3" },
      { name: "T3 Uptake" },
      { name: "Thyroglobulin" },
      { name: "Anti-TPO Antibodies" },
      { name: "Anti-Thyroglobulin Antibodies" },
      { name: "TSH Receptor Antibodies (TRAb)" },
    ],
  },
  diabetes: {
    label: "Diabetes",
    icon: Droplet,
    tests: [
      { name: "HbA1c" },
      { name: "Fasting Blood Glucose" },
      { name: "Random Blood Glucose" },
      { name: "2-Hour Postprandial Glucose" },
      { name: "Oral Glucose Tolerance Test (OGTT)" },
      { name: "Fasting Insulin" },
      { name: "C-Peptide" },
      { name: "HOMA-IR" },
      { name: "GAD Antibodies" },
      { name: "Islet Cell Antibodies (ICA)" },
      { name: "Insulin Antibodies" },
      { name: "Fructosamine" },
    ],
  },
  cardiac: {
    label: "Cardiac Markers",
    icon: Heart,
    tests: [
      { name: "Troponin I" },
      { name: "Troponin T" },
      { name: "High-Sensitivity Troponin" },
      { name: "CK-MB" },
      { name: "Total CK" },
      { name: "Myoglobin" },
      { name: "BNP" },
      { name: "NT-proBNP" },
      { name: "Homocysteine" },
      { name: "hs-CRP" },
      { name: "Lipoprotein-Associated Phospholipase A2 (Lp-PLA2)" },
      { name: "D-Dimer" },
    ],
  },
  urinalysis: {
    label: "Urinalysis",
    icon: Droplet,
    tests: [
      { name: "Routine Urinalysis" },
      { name: "Urine Color" },
      { name: "Urine Appearance" },
      { name: "Urine Specific Gravity" },
      { name: "Urine pH" },
      { name: "Urine Protein" },
      { name: "Urine Glucose" },
      { name: "Urine Ketones" },
      { name: "Urine Blood" },
      { name: "Urine Bilirubin" },
      { name: "Urine Urobilinogen" },
      { name: "Urine Nitrite" },
      { name: "Urine Leukocyte Esterase" },
      { name: "Urine RBC" },
      { name: "Urine WBC" },
      { name: "Urine Epithelial Cells" },
      { name: "Urine Casts" },
      { name: "Urine Crystals" },
      { name: "Urine Bacteria" },
    ],
  },
  microbiology: {
    label: "Microbiology",
    icon: Microscope,
    tests: [
      { name: "Blood Culture" },
      { name: "Urine Culture & Sensitivity" },
      { name: "Sputum Culture & Sensitivity" },
      { name: "Stool Culture" },
      { name: "Throat Swab Culture" },
      { name: "Wound Swab Culture" },
      { name: "CSF Culture" },
      { name: "Gram Stain" },
      { name: "AFB Smear & Culture" },
      { name: "Fungal Culture" },
      { name: "Stool Routine & Microscopy" },
      { name: "Stool Occult Blood" },
      { name: "Stool for Ova & Parasites" },
      { name: "H. pylori Antigen (Stool)" },
      { name: "C. difficile Toxin" },
      { name: "Nasal Swab for MRSA" },
    ],
  },
  serology: {
    label: "Serology",
    icon: Beaker,
    tests: [
      { name: "HIV 1 & 2 Antibody" },
      { name: "HIV p24 Antigen" },
      { name: "VDRL/RPR" },
      { name: "TPHA/FTA-ABS" },
      { name: "Hepatitis B Panel" },
      { name: "HBsAg" },
      { name: "Anti-HBs" },
      { name: "Anti-HBc (Total)" },
      { name: "Anti-HBc IgM" },
      { name: "HBeAg" },
      { name: "Anti-HBe" },
      { name: "HBV DNA" },
      { name: "Anti-HCV" },
      { name: "HCV RNA" },
      { name: "CMV IgG/IgM" },
      { name: "EBV Panel" },
      { name: "Toxoplasma IgG/IgM" },
      { name: "Rubella IgG/IgM" },
      { name: "Dengue NS1 Antigen" },
      { name: "Dengue IgM/IgG" },
      { name: "Malaria Antigen (RDT)" },
      { name: "Widal Test" },
      { name: "ASO Titer" },
      { name: "RA Factor" },
      { name: "Anti-CCP" },
      { name: "ANA" },
      { name: "Anti-dsDNA" },
      { name: "C3/C4 Complement" },
    ],
  },
  coagulation: {
    label: "Coagulation",
    icon: Droplet,
    tests: [
      { name: "Coagulation Profile" },
      { name: "PT (Prothrombin Time)" },
      { name: "INR" },
      { name: "aPTT" },
      { name: "Thrombin Time" },
      { name: "Fibrinogen" },
      { name: "D-Dimer" },
      { name: "Bleeding Time" },
      { name: "Clotting Time" },
      { name: "Factor VIII Activity" },
      { name: "Factor IX Activity" },
      { name: "Von Willebrand Factor" },
      { name: "Protein C" },
      { name: "Protein S" },
      { name: "Antithrombin III" },
      { name: "Lupus Anticoagulant" },
      { name: "Anticardiolipin Antibodies" },
    ],
  },
  hormones: {
    label: "Hormones",
    icon: Activity,
    tests: [
      { name: "Cortisol (Morning)" },
      { name: "Cortisol (Evening)" },
      { name: "ACTH" },
      { name: "24-Hour Urine Cortisol" },
      { name: "DHEA-S" },
      { name: "Aldosterone" },
      { name: "Renin Activity" },
      { name: "Prolactin" },
      { name: "Growth Hormone" },
      { name: "IGF-1" },
      { name: "FSH" },
      { name: "LH" },
      { name: "Estradiol (E2)" },
      { name: "Progesterone" },
      { name: "Testosterone (Total)" },
      { name: "Testosterone (Free)" },
      { name: "SHBG" },
      { name: "AMH (Anti-Müllerian Hormone)" },
      { name: "PTH (Parathyroid Hormone)" },
      { name: "Vitamin D (25-OH)" },
      { name: "Calcitonin" },
    ],
  },
  tumorMarkers: {
    label: "Tumor Markers",
    icon: Microscope,
    tests: [
      { name: "PSA (Total)" },
      { name: "PSA (Free)" },
      { name: "CEA" },
      { name: "AFP" },
      { name: "CA 125" },
      { name: "CA 19-9" },
      { name: "CA 15-3" },
      { name: "CA 27.29" },
      { name: "HCG (Beta)" },
      { name: "Thyroglobulin" },
      { name: "Calcitonin" },
      { name: "Chromogranin A" },
      { name: "NSE (Neuron-Specific Enolase)" },
      { name: "LDH" },
      { name: "Beta-2 Microglobulin" },
      { name: "Serum Protein Electrophoresis" },
      { name: "Urine Protein Electrophoresis" },
    ],
  },
  imaging: {
    label: "Imaging",
    icon: Scan,
    tests: [
      { name: "Chest X-Ray (PA View)" },
      { name: "Chest X-Ray (Lateral View)" },
      { name: "Abdominal X-Ray" },
      { name: "KUB X-Ray" },
      { name: "Spine X-Ray (Cervical)" },
      { name: "Spine X-Ray (Lumbar)" },
      { name: "Pelvis X-Ray" },
      { name: "Extremity X-Ray" },
      { name: "Ultrasound Abdomen (Complete)" },
      { name: "Ultrasound Pelvis" },
      { name: "Ultrasound KUB" },
      { name: "Ultrasound Thyroid" },
      { name: "Ultrasound Breast" },
      { name: "Doppler - Carotid" },
      { name: "Doppler - Lower Limb Venous" },
      { name: "Doppler - Lower Limb Arterial" },
      { name: "CT Head (Plain)" },
      { name: "CT Head (With Contrast)" },
      { name: "CT Chest (HRCT)" },
      { name: "CT Abdomen (With Contrast)" },
      { name: "MRI Brain (Plain)" },
      { name: "MRI Brain (With Contrast)" },
      { name: "MRI Spine (Lumbar)" },
      { name: "MRI Knee" },
      { name: "Mammography" },
      { name: "DEXA Scan (Bone Density)" },
      { name: "PET-CT Scan" },
    ],
  },
  cardiology: {
    label: "Cardiology",
    icon: Heart,
    tests: [
      { name: "ECG (12-Lead)" },
      { name: "Echocardiogram (2D Echo)" },
      { name: "Echocardiogram (with Doppler)" },
      { name: "Stress Echocardiogram" },
      { name: "Holter Monitor (24-Hour)" },
      { name: "Holter Monitor (48-Hour)" },
      { name: "Treadmill Test (TMT/ETT)" },
      { name: "Stress Thallium Scan" },
      { name: "CT Coronary Angiography" },
      { name: "Cardiac MRI" },
      { name: "Coronary Angiography (CAG)" },
      { name: "Pulmonary Function Test (PFT)" },
      { name: "Arterial Blood Gas (ABG)" },
    ],
  },
  obstetricGyn: {
    label: "OB-GYN",
    icon: Baby,
    tests: [
      { name: "Urine Pregnancy Test" },
      { name: "Serum Beta-hCG" },
      { name: "Ultrasound - Early Pregnancy (Transvaginal)" },
      { name: "Ultrasound - Dating Scan" },
      { name: "Ultrasound - NT Scan (11-14 weeks)" },
      { name: "Ultrasound - Anomaly Scan (18-22 weeks)" },
      { name: "Ultrasound - Growth Scan" },
      { name: "Non-Stress Test (NST)" },
      { name: "NIPT/Cell-Free DNA Testing" },
      { name: "Triple Screen Test" },
      { name: "Quad Screen Test" },
      { name: "Group B Strep (GBS) Culture" },
      { name: "TORCH Panel" },
      { name: "Pap Smear" },
      { name: "HPV Test" },
      { name: "Colposcopy" },
      { name: "Semen Analysis" },
    ],
  },
  custom: {
    label: "Custom",
    icon: PlusCircle,
    tests: [],
  },
};

type SelectedInvestigations = Record<string, boolean>;

type InvestigationRequisitionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (
    requisitionText: string, 
    selectedTests: string[], 
    priority: string, 
    fasting: boolean, 
    clinicalNotes: string, 
    saveAsDocument?: boolean,
    digitalSignature?: { enabled: boolean; physicianName?: string }
  ) => void;
  patientName: string;
  patientAge?: string;
  patientGender?: string;
  clinicalInfo?: string;
  visitId?: string;
  patientId?: string;
};

export default function InvestigationRequisitionDialog({
  open,
  onOpenChange,
  onGenerate,
  patientName,
  patientAge,
  patientGender,
  clinicalInfo,
  visitId,
  patientId,
}: InvestigationRequisitionDialogProps) {
  const [activeTab, setActiveTab] = useState<InvestigationType>("hematology");
  const [selectedInvestigations, setSelectedInvestigations] = useState<SelectedInvestigations>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [customTests, setCustomTests] = useState<string[]>([]);
  const [newCustomTest, setNewCustomTest] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState(clinicalInfo || "");
  const [priority, setPriority] = useState<"routine" | "urgent" | "stat">("routine");
  const [fasting, setFasting] = useState(false);
  const [saveAsDocument, setSaveAsDocument] = useState(true);
  const [digitalSignatureEnabled, setDigitalSignatureEnabled] = useState(true);
  const [physicianName, setPhysicianName] = useState("");
  
  // Templates state
  const [templates, setTemplates] = useState<RequisitionTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [showSaveTemplateForm, setShowSaveTemplateForm] = useState(false);

  // Fetch profile data for physician name
  useEffect(() => {
    const fetchPhysicianName = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("user_id", user.id)
          .single();
        
        if (profile) {
          const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
          setPhysicianName(fullName || "");
        }
      } catch (error) {
        console.error("Error fetching physician name:", error);
      }
    };
    
    if (open) {
      fetchPhysicianName();
    }
  }, [open]);

  // Fetch templates when dialog opens
  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Just show predefined templates if not logged in
        const predefinedWithIds = PREDEFINED_TEMPLATES.map((t, i) => ({
          ...t,
          id: `predefined-${i}`,
        }));
        setTemplates(predefinedWithIds);
        return;
      }

      const { data, error } = await supabase
        .from("investigation_templates")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      
      // Parse the investigations from Json to the correct type
      const userTemplates: RequisitionTemplate[] = (data || []).map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        investigations: (t.investigations as any[] || []).map(inv => ({
          category: inv.category || "",
          tests: inv.tests || []
        })),
        isPredefined: false,
      }));
      
      // Add predefined templates with unique IDs
      const predefinedWithIds: RequisitionTemplate[] = PREDEFINED_TEMPLATES.map((t, i) => ({
        ...t,
        id: `predefined-${i}`,
      }));
      
      // Combine: user templates first, then predefined
      setTemplates([...userTemplates, ...predefinedWithIds]);
    } catch (error) {
      console.error("Error fetching templates:", error);
      // Fallback to predefined templates on error
      const predefinedWithIds = PREDEFINED_TEMPLATES.map((t, i) => ({
        ...t,
        id: `predefined-${i}`,
      }));
      setTemplates(predefinedWithIds);
    }
  };

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedInvestigations({});
      setSearchQuery("");
      setShowPreview(false);
      setCustomTests([]);
      setNewCustomTest("");
      setClinicalNotes(clinicalInfo || "");
      setPriority("routine");
      setFasting(false);
      setShowTemplates(false);
      setShowSaveTemplateForm(false);
      setTemplateName("");
      setTemplateDescription("");
    }
  }, [open, clinicalInfo]);

  const toggleInvestigation = (category: string, testName: string) => {
    const key = `${category}:${testName}`;
    setSelectedInvestigations(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const addCustomTest = () => {
    if (newCustomTest.trim() && !customTests.includes(newCustomTest.trim())) {
      const testName = newCustomTest.trim();
      setCustomTests(prev => [...prev, testName]);
      setSelectedInvestigations(prev => ({
        ...prev,
        [`custom:${testName}`]: true
      }));
      setNewCustomTest("");
    }
  };

  const removeCustomTest = (testName: string) => {
    setCustomTests(prev => prev.filter(t => t !== testName));
    setSelectedInvestigations(prev => {
      const updated = { ...prev };
      delete updated[`custom:${testName}`];
      return updated;
    });
  };

  const getSelectedTests = (): { category: string; tests: string[] }[] => {
    const grouped: Record<string, string[]> = {};
    
    Object.entries(selectedInvestigations)
      .filter(([_, selected]) => selected)
      .forEach(([key]) => {
        const [category, testName] = key.split(":");
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(testName);
      });
    
    return Object.entries(grouped).map(([category, tests]) => ({
      category: INVESTIGATION_CATEGORIES[category as InvestigationType]?.label || category,
      tests
    }));
  };

  const getSelectedCount = () => {
    return Object.values(selectedInvestigations).filter(Boolean).length;
  };

  const getGlobalSearchResults = () => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    const results: { category: InvestigationType; test: InvestigationTest }[] = [];
    
    Object.entries(INVESTIGATION_CATEGORIES).forEach(([category, config]) => {
      if (category === "custom") {
        // Include custom tests in search
        customTests
          .filter(test => test.toLowerCase().includes(query))
          .forEach(test => {
            results.push({ category: "custom", test: { name: test } });
          });
      } else {
        config.tests
          .filter(test => test.name.toLowerCase().includes(query))
          .forEach(test => {
            results.push({ category: category as InvestigationType, test });
          });
      }
    });
    
    return results;
  };

  const generateRequisitionText = (): string => {
    const selectedGroups = getSelectedTests();
    if (selectedGroups.length === 0) return "";
    
    let text = "═══════════════════════════════════════\n";
    text += "      INVESTIGATION REQUISITION\n";
    text += "═══════════════════════════════════════\n\n";
    
    text += `Patient: ${patientName}\n`;
    if (patientAge) text += `Age: ${patientAge}`;
    if (patientGender) text += `  |  Gender: ${patientGender}`;
    text += "\n";
    text += `Date: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}\n`;
    text += `Priority: ${priority.toUpperCase()}\n`;
    if (fasting) text += "⚠ FASTING REQUIRED\n";
    text += "\n───────────────────────────────────────\n\n";
    
    // Group tests by category
    selectedGroups.forEach((group, index) => {
      text += `▸ ${group.category.toUpperCase()}\n`;
      group.tests.forEach(test => {
        text += `   ☐ ${test}\n`;
      });
      if (index < selectedGroups.length - 1) {
        text += "\n";
      }
    });
    
    if (clinicalNotes.trim()) {
      text += "\n───────────────────────────────────────\n";
      text += "Clinical Notes:\n";
      text += clinicalNotes.trim() + "\n";
    }
    
    text += "\n═══════════════════════════════════════\n";
    text += "         Authorized by Physician\n";
    text += "═══════════════════════════════════════\n";
    
    return text;
  };

  const handleGenerate = () => {
    const selectedTests = Object.entries(selectedInvestigations)
      .filter(([_, selected]) => selected)
      .map(([key]) => key.split(":")[1]);
    
    const requisitionText = generateRequisitionText();
    const digitalSignature = {
      enabled: digitalSignatureEnabled,
      physicianName: digitalSignatureEnabled ? physicianName : undefined
    };
    onGenerate(requisitionText, selectedTests, priority, fasting, clinicalNotes, saveAsDocument, digitalSignature);
    onOpenChange(false);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a template name",
        variant: "destructive",
      });
      return;
    }

    setIsSavingTemplate(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const selectedGroups = getSelectedTests();
      
      const { error } = await supabase
        .from("investigation_templates")
        .insert({
          user_id: user.id,
          name: templateName.trim(),
          description: templateDescription.trim() || null,
          investigations: selectedGroups,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template saved successfully",
      });
      
      setShowSaveTemplateForm(false);
      setTemplateName("");
      setTemplateDescription("");
      fetchTemplates();
    } catch (error: any) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleLoadTemplate = (template: RequisitionTemplate) => {
    const newSelections: SelectedInvestigations = {};
    
    template.investigations.forEach(group => {
      const categoryKey = Object.entries(INVESTIGATION_CATEGORIES).find(
        ([_, config]) => config.label === group.category
      )?.[0] || "custom";
      
      group.tests.forEach(test => {
        newSelections[`${categoryKey}:${test}`] = true;
        
        // Add to custom tests if it's a custom category
        if (categoryKey === "custom" && !customTests.includes(test)) {
          setCustomTests(prev => [...prev, test]);
        }
      });
    });
    
    setSelectedInvestigations(prev => ({ ...prev, ...newSelections }));
    setShowTemplates(false);
    
    toast({
      title: "Template Loaded",
      description: `"${template.name}" investigations have been added`,
    });
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from("investigation_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
      
      fetchTemplates();
    } catch (error: any) {
      console.error("Error deleting template:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const filteredTests = searchQuery 
    ? getGlobalSearchResults() 
    : (activeTab === "custom" 
        ? customTests.map(name => ({ name })) 
        : INVESTIGATION_CATEGORIES[activeTab].tests);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Investigation Requisition Generator
          </DialogTitle>
          <DialogDescription>
            Select investigations to generate a requisition form for {patientName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 min-h-0">
          {/* Search and Controls */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search all investigations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Label className="text-sm">Priority:</Label>
              <select 
                value={priority} 
                onChange={(e) => setPriority(e.target.value as any)}
                className="border rounded-md px-2 py-1 text-sm bg-background"
              >
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="stat">STAT</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox 
                id="fasting" 
                checked={fasting} 
                onCheckedChange={(c) => setFasting(c === true)} 
              />
              <Label htmlFor="fasting" className="text-sm cursor-pointer">Fasting Required</Label>
            </div>

            {getSelectedCount() > 0 && (
              <Badge variant="secondary" className="gap-1">
                {getSelectedCount()} selected
              </Badge>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden min-h-0">
            {showPreview ? (
              <div className="h-full flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Requisition Preview</h3>
                  <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Close Preview
                  </Button>
                </div>
                <ScrollArea className="flex-1 border rounded-md">
                  <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                    {generateRequisitionText() || "No investigations selected"}
                  </pre>
                </ScrollArea>
              </div>
            ) : searchQuery ? (
              // Global Search Results
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">
                    Search Results ({getGlobalSearchResults().length})
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")}>
                    Clear search
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-4">
                    {getGlobalSearchResults().map(({ category, test }) => {
                      const key = `${category}:${test.name}`;
                      const isSelected = selectedInvestigations[key];
                      const categoryLabel = INVESTIGATION_CATEGORIES[category]?.label || "Custom";
                      
                      return (
                        <div
                          key={key}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                          }`}
                          onClick={() => toggleInvestigation(category, test.name)}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox checked={isSelected} />
                            <div>
                              <span className="text-sm">{test.name}</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {categoryLabel}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {getGlobalSearchResults().length === 0 && (
                      <div className="col-span-2 text-center text-muted-foreground py-8">
                        No investigations found matching "{searchQuery}"
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            ) : showTemplates ? (
              // Templates View
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-sm">Investigation Templates</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowTemplates(false)}>
                    <X className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  <div className="space-y-3 pr-4">
                    {templates.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No templates saved yet</p>
                        <p className="text-xs mt-1">Select investigations and save as a template for quick reuse</p>
                      </div>
                    ) : (
                      <>
                        {/* User templates section */}
                        {templates.filter(t => !t.isPredefined).length > 0 && (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">My Templates</span>
                              <div className="flex-1 h-px bg-border"></div>
                            </div>
                            {templates.filter(t => !t.isPredefined).map(template => (
                              <div key={template.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium">{template.name}</h4>
                                    {template.description && (
                                      <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {template.investigations.slice(0, 3).map((group, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs">
                                          {group.category}: {group.tests.length} tests
                                        </Badge>
                                      ))}
                                      {template.investigations.length > 3 && (
                                        <Badge variant="outline" className="text-xs">
                                          +{template.investigations.length - 3} more
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2 ml-4">
                                    <Button size="sm" variant="outline" onClick={() => handleLoadTemplate(template)}>
                                      <Plus className="h-3 w-3 mr-1" />
                                      Use
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleDeleteTemplate(template.id)}>
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                        
                        {/* Predefined templates section */}
                        {templates.filter(t => t.isPredefined).length > 0 && (
                          <>
                            <div className="flex items-center gap-2 mb-2 mt-4">
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quick Start Templates</span>
                              <div className="flex-1 h-px bg-border"></div>
                            </div>
                            {templates.filter(t => t.isPredefined).map(template => (
                              <div key={template.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors bg-primary/5">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium">{template.name}</h4>
                                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                                        Built-in
                                      </Badge>
                                    </div>
                                    {template.description && (
                                      <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {template.investigations.slice(0, 3).map((group, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs">
                                          {group.category}: {group.tests.length} tests
                                        </Badge>
                                      ))}
                                      {template.investigations.length > 3 && (
                                        <Badge variant="outline" className="text-xs">
                                          +{template.investigations.length - 3} more
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2 ml-4">
                                    <Button size="sm" variant="outline" onClick={() => handleLoadTemplate(template)}>
                                      <Plus className="h-3 w-3 mr-1" />
                                      Use
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </ScrollArea>
              </div>
            ) : showSaveTemplateForm ? (
              // Save Template Form
              <div className="h-full flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">Save as Template</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowSaveTemplateForm(false)}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="templateName">Template Name *</Label>
                    <Input
                      id="templateName"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="e.g., Annual Physical, Diabetes Workup"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="templateDesc">Description (Optional)</Label>
                    <Textarea
                      id="templateDesc"
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      placeholder="Brief description of when to use this template..."
                      className="mt-1 h-20"
                    />
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm font-medium mb-2">Selected Investigations ({getSelectedCount()})</p>
                    <div className="flex flex-wrap gap-1">
                      {getSelectedTests().map((group, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {group.category}: {group.tests.length}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button 
                    onClick={handleSaveTemplate} 
                    disabled={isSavingTemplate || !templateName.trim()}
                    className="w-full"
                  >
                    {isSavingTemplate ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="h-4 w-4 mr-2" /> Save Template</>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              // Category Tabs
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as InvestigationType)}
                className="h-full min-h-0 flex flex-col"
              >
                <div className="overflow-x-auto w-full flex-shrink-0">
                  <TabsList className="inline-flex h-auto p-1 mb-2 min-w-max">
                    {Object.entries(INVESTIGATION_CATEGORIES).map(([key, { label, icon: Icon }]) => (
                      <TabsTrigger
                        key={key}
                        value={key}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs whitespace-nowrap"
                      >
                        <Icon className="h-3 w-3" />
                        {label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                <div className="flex-1 overflow-hidden min-h-0">
                  <ScrollArea className="h-full"> 
                    {Object.entries(INVESTIGATION_CATEGORIES).map(([category, config]) => (
                      <TabsContent key={category} value={category} className="mt-0 h-full">
                        {category === "custom" ? (
                          <div className="space-y-4 pr-4">
                            <div className="flex gap-2">
                              <Input
                                placeholder="Enter custom investigation name..."
                                value={newCustomTest}
                                onChange={(e) => setNewCustomTest(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addCustomTest()}
                              />
                              <Button onClick={addCustomTest} size="sm">
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {customTests.map((test) => {
                                const key = `custom:${test}`;
                                const isSelected = selectedInvestigations[key];
                                return (
                                  <div
                                    key={key}
                                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                                      isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                                    }`}
                                    onClick={() => toggleInvestigation("custom", test)}
                                  >
                                    <div className="flex items-center gap-3">
                                      <Checkbox checked={isSelected} />
                                      <span className="text-sm">{test}</span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeCustomTest(test);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </div>
                                );
                              })}
                              {customTests.length === 0 && (
                                <div className="col-span-2 text-center text-muted-foreground py-8">
                                  Add custom investigations using the input above
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-4 pb-4">
                            {config.tests.map((test) => {
                              const key = `${category}:${test.name}`;
                              const isSelected = selectedInvestigations[key];
                              return (
                                <div
                                  key={key}
                                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                                    isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                                  }`}
                                  onClick={() => toggleInvestigation(category, test.name)}
                                >
                                  <div className="flex items-center gap-3">
                                    <Checkbox checked={isSelected} />
                                    <span className="text-sm">{test.name}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </TabsContent>
                    ))}
                  </ScrollArea>
                </div>
              </Tabs>
            )}
          </div>

          {/* Clinical Notes */}
          <div className="flex-shrink-0">
            <Label htmlFor="clinicalNotes" className="text-sm font-medium">Clinical Notes (Optional)</Label>
            <Textarea
              id="clinicalNotes"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Add relevant clinical information, symptoms, or suspected diagnosis..."
              className="mt-1 h-16"
            />
          </div>

          {/* Digital Signature checkbox */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Checkbox 
              id="digitalSign" 
              checked={digitalSignatureEnabled} 
              onCheckedChange={(c) => setDigitalSignatureEnabled(c === true)} 
            />
            <Label htmlFor="digitalSign" className="text-sm cursor-pointer">
              Add digital signature
            </Label>
            {digitalSignatureEnabled && physicianName && (
              <span className="text-sm text-muted-foreground italic ml-2">
                ({physicianName})
              </span>
            )}
          </div>

          {/* Save as document checkbox */}
          {visitId && patientId && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Checkbox 
                id="saveAsDoc" 
                checked={saveAsDocument} 
                onCheckedChange={(c) => setSaveAsDocument(c === true)} 
              />
              <Label htmlFor="saveAsDoc" className="text-sm cursor-pointer">
                Save requisition to documents list
              </Label>
            </div>
          )}
        </div>

        <Separator className="my-2" />

        <DialogFooter className="flex-shrink-0">
          <div className="flex items-center gap-2 w-full justify-between flex-wrap">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplates(true)}
                disabled={showPreview || showSaveTemplateForm}
              >
                <FolderOpen className="h-4 w-4 mr-1" />
                Templates
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveTemplateForm(true)}
                disabled={getSelectedCount() === 0 || showPreview || showTemplates}
              >
                <Save className="h-4 w-4 mr-1" />
                Save Template
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                disabled={getSelectedCount() === 0}
              >
                <Eye className="h-4 w-4 mr-1" />
                {showPreview ? "Hide" : "Preview"}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleGenerate} 
                disabled={getSelectedCount() === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Generate ({getSelectedCount()})
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
