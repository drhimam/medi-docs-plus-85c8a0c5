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
  PlusCircle
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
  onGenerate: (requisitionText: string, selectedTests: string[]) => void;
  patientName: string;
  patientAge?: string;
  patientGender?: string;
  clinicalInfo?: string;
};

export default function InvestigationRequisitionDialog({
  open,
  onOpenChange,
  onGenerate,
  patientName,
  patientAge,
  patientGender,
  clinicalInfo,
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
    onGenerate(requisitionText, selectedTests);
    onOpenChange(false);
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

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
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
          <div className="flex-1 overflow-hidden">
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
            ) : (
              // Category Tabs
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as InvestigationType)} className="h-full flex flex-col">
                <div className="overflow-x-auto w-full">
                  <TabsList className="inline-flex h-auto p-1 mb-4 min-w-max">
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

                <ScrollArea className="flex-1">
                  {Object.entries(INVESTIGATION_CATEGORIES).map(([category, config]) => (
                    <TabsContent key={category} value={category} className="mt-0">
                      {category === "custom" ? (
                        <div className="space-y-4">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-4">
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
              </Tabs>
            )}
          </div>

          {/* Clinical Notes */}
          <div>
            <Label htmlFor="clinicalNotes" className="text-sm font-medium">Clinical Notes (Optional)</Label>
            <Textarea
              id="clinicalNotes"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Add relevant clinical information, symptoms, or suspected diagnosis..."
              className="mt-1 h-20"
            />
          </div>
        </div>

        <Separator className="my-2" />

        <DialogFooter className="flex-shrink-0">
          <div className="flex items-center gap-2 w-full justify-between flex-wrap">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              disabled={getSelectedCount() === 0}
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? "Hide Preview" : "Preview"}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleGenerate} 
                disabled={getSelectedCount() === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Generate Requisition ({getSelectedCount()})
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
