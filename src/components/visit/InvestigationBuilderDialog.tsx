import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Check, Eye, EyeOff, Search, X, Beaker, Heart, Droplet, Activity, Brain, Stethoscope, Microscope, Scan, Radio, Baby, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { PresetDialog } from "@/components/patient/preset/PresetDialog";

type AbnormalStatus = "normal" | "high" | "low" | "abnormal" | "unknown";

// Parse normal range string and check if value is within range
function checkValueAgainstRange(value: string, normalRange?: string): AbnormalStatus {
  if (!value || !normalRange) return "unknown";
  
  // Clean the value - extract numeric part
  const numericValue = parseFloat(value.replace(/[,\s]/g, ""));
  if (isNaN(numericValue)) return "unknown";
  
  // Skip non-numeric ranges like "See individual components", "Morphology assessment", etc.
  if (normalRange.toLowerCase().includes("see") || 
      normalRange.toLowerCase().includes("assessment") ||
      normalRange.toLowerCase().includes("negative") ||
      normalRange.toLowerCase().includes("none") ||
      normalRange.toLowerCase().includes("few") ||
      normalRange.toLowerCase().includes("clear")) {
    return "unknown";
  }
  
  // Handle simple range: "70-100"
  const simpleRangeMatch = normalRange.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/);
  if (simpleRangeMatch) {
    const min = parseFloat(simpleRangeMatch[1]);
    const max = parseFloat(simpleRangeMatch[2]);
    if (numericValue < min) return "low";
    if (numericValue > max) return "high";
    return "normal";
  }
  
  // Handle ranges with commas in numbers: "4,500-11,000" or "150,000-400,000"
  const commaRangeMatch = normalRange.match(/^([\d,]+(?:\.\d+)?)\s*-\s*([\d,]+(?:\.\d+)?)$/);
  if (commaRangeMatch) {
    const min = parseFloat(commaRangeMatch[1].replace(/,/g, ""));
    const max = parseFloat(commaRangeMatch[2].replace(/,/g, ""));
    if (numericValue < min) return "low";
    if (numericValue > max) return "high";
    return "normal";
  }
  
  // Handle "less than" patterns: "<200", "<140", "< 5.7"
  const lessThanMatch = normalRange.match(/^<\s*(\d+(?:\.\d+)?)/);
  if (lessThanMatch) {
    const max = parseFloat(lessThanMatch[1]);
    if (numericValue >= max) return "high";
    return "normal";
  }
  
  // Handle "greater than" patterns: ">40", ">90"
  const greaterThanMatch = normalRange.match(/^>\s*(\d+(?:\.\d+)?)/);
  if (greaterThanMatch) {
    const min = parseFloat(greaterThanMatch[1]);
    if (numericValue <= min) return "low";
    return "normal";
  }
  
  // Handle "less than or equal" patterns: "≤100", "<=100"
  const lessThanEqualMatch = normalRange.match(/^[≤<=]+\s*(\d+(?:\.\d+)?)/);
  if (lessThanEqualMatch) {
    const max = parseFloat(lessThanEqualMatch[1]);
    if (numericValue > max) return "high";
    return "normal";
  }
  
  // Handle "greater than or equal" patterns: "≥90", ">=90"
  const greaterThanEqualMatch = normalRange.match(/^[≥>=]+\s*(\d+(?:\.\d+)?)/);
  if (greaterThanEqualMatch) {
    const min = parseFloat(greaterThanEqualMatch[1]);
    if (numericValue < min) return "low";
    return "normal";
  }
  
  // Handle gender-specific ranges: "M: 13.5-17.5, F: 12.0-16.0"
  // For simplicity, we'll use the widest possible range (min of mins, max of maxes)
  const genderRangeMatches = normalRange.matchAll(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/g);
  const ranges = Array.from(genderRangeMatches);
  if (ranges.length > 0) {
    const mins = ranges.map(m => parseFloat(m[1]));
    const maxes = ranges.map(m => parseFloat(m[2]));
    const overallMin = Math.min(...mins);
    const overallMax = Math.max(...maxes);
    if (numericValue < overallMin) return "low";
    if (numericValue > overallMax) return "high";
    return "normal";
  }
  
  // Handle single threshold with text: "<200 desirable", "<100 optimal"
  const thresholdWithTextMatch = normalRange.match(/<\s*(\d+(?:\.\d+)?)\s+\w+/);
  if (thresholdWithTextMatch) {
    const max = parseFloat(thresholdWithTextMatch[1]);
    if (numericValue >= max) return "high";
    return "normal";
  }
  
  // Handle ">40 M, >50 F" patterns - use lowest threshold
  const multiGreaterMatch = normalRange.match(/>(\d+(?:\.\d+)?)/g);
  if (multiGreaterMatch && multiGreaterMatch.length > 0) {
    const thresholds = multiGreaterMatch.map(m => parseFloat(m.replace(">", "")));
    const minThreshold = Math.min(...thresholds);
    if (numericValue <= minThreshold) return "low";
    return "normal";
  }
  
  return "unknown";
}

function getStatusLabel(status: AbnormalStatus): string {
  switch (status) {
    case "high": return "HIGH";
    case "low": return "LOW";
    case "abnormal": return "ABNORMAL";
    default: return "";
  }
}

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
  | "obstetricGyn";

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
      { name: "Complete Blood Count (CBC)", normalRange: "See individual components" },
      { name: "Hemoglobin (Hb)", unit: "g/dL", normalRange: "M: 13.5-17.5, F: 12.0-16.0" },
      { name: "Hematocrit (Hct)", unit: "%", normalRange: "M: 38.3-48.6, F: 35.5-44.9" },
      { name: "RBC Count", unit: "million/µL", normalRange: "M: 4.35-5.65, F: 3.92-5.13" },
      { name: "WBC Count", unit: "/µL", normalRange: "4,500-11,000" },
      { name: "Platelet Count", unit: "/µL", normalRange: "150,000-400,000" },
      { name: "MCV", unit: "fL", normalRange: "80-100" },
      { name: "MCH", unit: "pg", normalRange: "27-31" },
      { name: "MCHC", unit: "g/dL", normalRange: "32-36" },
      { name: "RDW", unit: "%", normalRange: "11.5-14.5" },
      { name: "Reticulocyte Count", unit: "%", normalRange: "0.5-2.5" },
      { name: "Peripheral Blood Smear", normalRange: "Morphology assessment" },
      { name: "ESR", unit: "mm/hr", normalRange: "M: 0-15, F: 0-20" },
      { name: "Iron Studies", normalRange: "See components" },
      { name: "Serum Iron", unit: "µg/dL", normalRange: "60-170" },
      { name: "TIBC", unit: "µg/dL", normalRange: "250-400" },
      { name: "Ferritin", unit: "ng/mL", normalRange: "M: 12-300, F: 12-150" },
      { name: "Transferrin Saturation", unit: "%", normalRange: "20-50" },
      { name: "Vitamin B12", unit: "pg/mL", normalRange: "200-900" },
      { name: "Folate", unit: "ng/mL", normalRange: "2.7-17.0" },
    ],
  },
  biochemistry: {
    label: "Biochemistry",
    icon: Beaker,
    tests: [
      { name: "Blood Glucose (Fasting)", unit: "mg/dL", normalRange: "70-100" },
      { name: "Blood Glucose (Random)", unit: "mg/dL", normalRange: "<140" },
      { name: "Blood Glucose (2hr PP)", unit: "mg/dL", normalRange: "<140" },
      { name: "Electrolytes Panel", normalRange: "See individual components" },
      { name: "Sodium (Na+)", unit: "mEq/L", normalRange: "136-145" },
      { name: "Potassium (K+)", unit: "mEq/L", normalRange: "3.5-5.0" },
      { name: "Chloride (Cl-)", unit: "mEq/L", normalRange: "98-106" },
      { name: "Bicarbonate (HCO3-)", unit: "mEq/L", normalRange: "22-29" },
      { name: "Calcium (Total)", unit: "mg/dL", normalRange: "8.6-10.3" },
      { name: "Calcium (Ionized)", unit: "mg/dL", normalRange: "4.5-5.6" },
      { name: "Magnesium", unit: "mg/dL", normalRange: "1.7-2.2" },
      { name: "Phosphorus", unit: "mg/dL", normalRange: "2.5-4.5" },
      { name: "Uric Acid", unit: "mg/dL", normalRange: "M: 3.4-7.0, F: 2.4-6.0" },
      { name: "Total Protein", unit: "g/dL", normalRange: "6.0-8.3" },
      { name: "Albumin", unit: "g/dL", normalRange: "3.5-5.0" },
      { name: "Globulin", unit: "g/dL", normalRange: "2.0-3.5" },
      { name: "A/G Ratio", normalRange: "1.1-2.5" },
      { name: "Lactate", unit: "mmol/L", normalRange: "0.5-2.2" },
      { name: "Ammonia", unit: "µmol/L", normalRange: "11-32" },
    ],
  },
  lipidProfile: {
    label: "Lipid Profile",
    icon: Activity,
    tests: [
      { name: "Lipid Profile (Complete)", normalRange: "See individual components" },
      { name: "Total Cholesterol", unit: "mg/dL", normalRange: "<200 desirable" },
      { name: "LDL Cholesterol", unit: "mg/dL", normalRange: "<100 optimal" },
      { name: "HDL Cholesterol", unit: "mg/dL", normalRange: ">40 M, >50 F" },
      { name: "VLDL Cholesterol", unit: "mg/dL", normalRange: "5-40" },
      { name: "Triglycerides", unit: "mg/dL", normalRange: "<150" },
      { name: "Non-HDL Cholesterol", unit: "mg/dL", normalRange: "<130" },
      { name: "Total/HDL Ratio", normalRange: "<5.0" },
      { name: "LDL/HDL Ratio", normalRange: "<3.5" },
      { name: "Apolipoprotein A1", unit: "mg/dL", normalRange: "M: 94-176, F: 101-199" },
      { name: "Apolipoprotein B", unit: "mg/dL", normalRange: "52-109" },
      { name: "Lipoprotein(a)", unit: "mg/dL", normalRange: "<30" },
    ],
  },
  liverFunction: {
    label: "Liver Function",
    icon: Stethoscope,
    tests: [
      { name: "Liver Function Tests (LFT)", normalRange: "See individual components" },
      { name: "AST (SGOT)", unit: "U/L", normalRange: "10-40" },
      { name: "ALT (SGPT)", unit: "U/L", normalRange: "7-56" },
      { name: "ALP (Alkaline Phosphatase)", unit: "U/L", normalRange: "44-147" },
      { name: "GGT", unit: "U/L", normalRange: "M: 8-61, F: 5-36" },
      { name: "Total Bilirubin", unit: "mg/dL", normalRange: "0.1-1.2" },
      { name: "Direct Bilirubin", unit: "mg/dL", normalRange: "0.0-0.3" },
      { name: "Indirect Bilirubin", unit: "mg/dL", normalRange: "0.1-0.9" },
      { name: "LDH", unit: "U/L", normalRange: "140-280" },
      { name: "Prothrombin Time (PT)", unit: "seconds", normalRange: "11-13.5" },
      { name: "INR", normalRange: "0.8-1.1" },
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
      { name: "Renal Function Tests (RFT)", normalRange: "See individual components" },
      { name: "Blood Urea Nitrogen (BUN)", unit: "mg/dL", normalRange: "7-20" },
      { name: "Serum Creatinine", unit: "mg/dL", normalRange: "M: 0.7-1.3, F: 0.6-1.1" },
      { name: "BUN/Creatinine Ratio", normalRange: "10:1 to 20:1" },
      { name: "eGFR", unit: "mL/min/1.73m²", normalRange: ">90" },
      { name: "Cystatin C", unit: "mg/L", normalRange: "0.56-0.98" },
      { name: "24-Hour Urine Protein", unit: "mg/24hr", normalRange: "<150" },
      { name: "24-Hour Urine Creatinine", unit: "mg/24hr", normalRange: "M: 14-26 mg/kg, F: 11-20 mg/kg" },
      { name: "Creatinine Clearance", unit: "mL/min", normalRange: "M: 97-137, F: 88-128" },
      { name: "Urine Albumin/Creatinine Ratio (ACR)", unit: "mg/g", normalRange: "<30" },
      { name: "Microalbumin", unit: "mg/L", normalRange: "<20" },
    ],
  },
  thyroid: {
    label: "Thyroid",
    icon: Activity,
    tests: [
      { name: "Thyroid Function Tests (TFT)", normalRange: "See individual components" },
      { name: "TSH", unit: "mIU/L", normalRange: "0.4-4.0" },
      { name: "Free T4 (FT4)", unit: "ng/dL", normalRange: "0.8-1.8" },
      { name: "Free T3 (FT3)", unit: "pg/mL", normalRange: "2.3-4.2" },
      { name: "Total T4", unit: "µg/dL", normalRange: "4.5-12.5" },
      { name: "Total T3", unit: "ng/dL", normalRange: "80-200" },
      { name: "T3 Uptake", unit: "%", normalRange: "25-35" },
      { name: "Thyroglobulin", unit: "ng/mL", normalRange: "0.5-55" },
      { name: "Anti-TPO Antibodies", unit: "IU/mL", normalRange: "<35" },
      { name: "Anti-Thyroglobulin Antibodies", unit: "IU/mL", normalRange: "<40" },
      { name: "TSH Receptor Antibodies (TRAb)" },
    ],
  },
  diabetes: {
    label: "Diabetes",
    icon: Droplet,
    tests: [
      { name: "HbA1c", unit: "%", normalRange: "<5.7 normal, 5.7-6.4 prediabetes" },
      { name: "Fasting Blood Glucose", unit: "mg/dL", normalRange: "70-100" },
      { name: "Random Blood Glucose", unit: "mg/dL", normalRange: "<140" },
      { name: "2-Hour Postprandial Glucose", unit: "mg/dL", normalRange: "<140" },
      { name: "Oral Glucose Tolerance Test (OGTT)", normalRange: "See protocol" },
      { name: "Fasting Insulin", unit: "µIU/mL", normalRange: "2.6-24.9" },
      { name: "C-Peptide", unit: "ng/mL", normalRange: "0.8-3.1" },
      { name: "HOMA-IR", normalRange: "<2.5" },
      { name: "GAD Antibodies" },
      { name: "Islet Cell Antibodies (ICA)" },
      { name: "Insulin Antibodies" },
      { name: "Fructosamine", unit: "µmol/L", normalRange: "200-285" },
    ],
  },
  cardiac: {
    label: "Cardiac Markers",
    icon: Heart,
    tests: [
      { name: "Troponin I", unit: "ng/mL", normalRange: "<0.04" },
      { name: "Troponin T", unit: "ng/mL", normalRange: "<0.01" },
      { name: "High-Sensitivity Troponin", unit: "ng/L", normalRange: "M: <22, F: <14" },
      { name: "CK-MB", unit: "ng/mL", normalRange: "<5" },
      { name: "Total CK", unit: "U/L", normalRange: "M: 39-308, F: 26-192" },
      { name: "Myoglobin", unit: "ng/mL", normalRange: "25-72" },
      { name: "BNP", unit: "pg/mL", normalRange: "<100" },
      { name: "NT-proBNP", unit: "pg/mL", normalRange: "<125" },
      { name: "Homocysteine", unit: "µmol/L", normalRange: "5-15" },
      { name: "hs-CRP", unit: "mg/L", normalRange: "<1.0 low risk, 1-3 moderate" },
      { name: "Lipoprotein-Associated Phospholipase A2 (Lp-PLA2)" },
      { name: "D-Dimer", unit: "ng/mL", normalRange: "<500" },
    ],
  },
  urinalysis: {
    label: "Urinalysis",
    icon: Droplet,
    tests: [
      { name: "Routine Urinalysis", normalRange: "See individual components" },
      { name: "Urine Color", normalRange: "Yellow to amber" },
      { name: "Urine Appearance", normalRange: "Clear" },
      { name: "Urine Specific Gravity", normalRange: "1.005-1.030" },
      { name: "Urine pH", normalRange: "4.5-8.0" },
      { name: "Urine Protein", normalRange: "Negative" },
      { name: "Urine Glucose", normalRange: "Negative" },
      { name: "Urine Ketones", normalRange: "Negative" },
      { name: "Urine Blood", normalRange: "Negative" },
      { name: "Urine Bilirubin", normalRange: "Negative" },
      { name: "Urine Urobilinogen", normalRange: "0.1-1.0 EU/dL" },
      { name: "Urine Nitrite", normalRange: "Negative" },
      { name: "Urine Leukocyte Esterase", normalRange: "Negative" },
      { name: "Urine RBC", unit: "/HPF", normalRange: "0-2" },
      { name: "Urine WBC", unit: "/HPF", normalRange: "0-5" },
      { name: "Urine Epithelial Cells", normalRange: "Few" },
      { name: "Urine Casts", normalRange: "0-5 hyaline casts" },
      { name: "Urine Crystals", normalRange: "None to few" },
      { name: "Urine Bacteria", normalRange: "None" },
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
      { name: "HIV Viral Load" },
      { name: "CD4 Count" },
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
      { name: "Anti-HAV IgM" },
      { name: "Anti-HAV IgG" },
      { name: "CMV IgG/IgM" },
      { name: "EBV Panel" },
      { name: "Toxoplasma IgG/IgM" },
      { name: "Rubella IgG/IgM" },
      { name: "HSV 1 & 2 IgG/IgM" },
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
      { name: "Coagulation Profile", normalRange: "See individual components" },
      { name: "PT (Prothrombin Time)", unit: "seconds", normalRange: "11-13.5" },
      { name: "INR", normalRange: "0.8-1.1 (2-3 on warfarin)" },
      { name: "aPTT", unit: "seconds", normalRange: "25-35" },
      { name: "Thrombin Time", unit: "seconds", normalRange: "14-19" },
      { name: "Fibrinogen", unit: "mg/dL", normalRange: "200-400" },
      { name: "D-Dimer", unit: "ng/mL", normalRange: "<500" },
      { name: "Bleeding Time", unit: "minutes", normalRange: "2-9" },
      { name: "Clotting Time", unit: "minutes", normalRange: "4-10" },
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
      { name: "Cortisol (Morning)", unit: "µg/dL", normalRange: "6.2-19.4 (AM)" },
      { name: "Cortisol (Evening)", unit: "µg/dL", normalRange: "2.3-11.9 (PM)" },
      { name: "ACTH", unit: "pg/mL", normalRange: "10-60 (AM)" },
      { name: "24-Hour Urine Cortisol" },
      { name: "DHEA-S", unit: "µg/dL" },
      { name: "Aldosterone" },
      { name: "Renin Activity" },
      { name: "Prolactin", unit: "ng/mL", normalRange: "M: 4-15, F: 4-23" },
      { name: "Growth Hormone", unit: "ng/mL" },
      { name: "IGF-1" },
      { name: "FSH", unit: "mIU/mL" },
      { name: "LH", unit: "mIU/mL" },
      { name: "Estradiol (E2)", unit: "pg/mL" },
      { name: "Progesterone", unit: "ng/mL" },
      { name: "Testosterone (Total)", unit: "ng/dL", normalRange: "M: 270-1070" },
      { name: "Testosterone (Free)" },
      { name: "SHBG" },
      { name: "AMH (Anti-Müllerian Hormone)" },
      { name: "PTH (Parathyroid Hormone)", unit: "pg/mL", normalRange: "15-65" },
      { name: "Vitamin D (25-OH)", unit: "ng/mL", normalRange: "30-100" },
      { name: "Calcitonin" },
    ],
  },
  tumorMarkers: {
    label: "Tumor Markers",
    icon: Microscope,
    tests: [
      { name: "PSA (Total)", unit: "ng/mL", normalRange: "<4.0" },
      { name: "PSA (Free)", unit: "%" },
      { name: "CEA", unit: "ng/mL", normalRange: "<3.0 (non-smokers)" },
      { name: "AFP", unit: "ng/mL", normalRange: "<10" },
      { name: "CA 125", unit: "U/mL", normalRange: "<35" },
      { name: "CA 19-9", unit: "U/mL", normalRange: "<37" },
      { name: "CA 15-3", unit: "U/mL", normalRange: "<30" },
      { name: "CA 27.29", unit: "U/mL", normalRange: "<38" },
      { name: "HCG (Beta)", unit: "mIU/mL" },
      { name: "Thyroglobulin" },
      { name: "Calcitonin" },
      { name: "Chromogranin A" },
      { name: "NSE (Neuron-Specific Enolase)" },
      { name: "LDH", unit: "U/L", normalRange: "140-280" },
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
      { name: "Chest X-Ray (AP View)" },
      { name: "Abdominal X-Ray" },
      { name: "KUB X-Ray" },
      { name: "Spine X-Ray (Cervical)" },
      { name: "Spine X-Ray (Thoracic)" },
      { name: "Spine X-Ray (Lumbar)" },
      { name: "Pelvis X-Ray" },
      { name: "Extremity X-Ray" },
      { name: "Skull X-Ray" },
      { name: "Ultrasound Abdomen (Complete)" },
      { name: "Ultrasound Abdomen (Upper)" },
      { name: "Ultrasound Pelvis" },
      { name: "Ultrasound KUB" },
      { name: "Ultrasound Thyroid" },
      { name: "Ultrasound Breast" },
      { name: "Ultrasound Scrotum" },
      { name: "Doppler - Carotid" },
      { name: "Doppler - Lower Limb Venous" },
      { name: "Doppler - Lower Limb Arterial" },
      { name: "Doppler - Renal" },
      { name: "CT Head (Plain)" },
      { name: "CT Head (With Contrast)" },
      { name: "CT Chest (HRCT)" },
      { name: "CT Chest (With Contrast)" },
      { name: "CT Abdomen (Plain)" },
      { name: "CT Abdomen (With Contrast)" },
      { name: "CT Pelvis" },
      { name: "CT Angiography" },
      { name: "CT Spine" },
      { name: "MRI Brain (Plain)" },
      { name: "MRI Brain (With Contrast)" },
      { name: "MRI Spine (Cervical)" },
      { name: "MRI Spine (Lumbar)" },
      { name: "MRI Knee" },
      { name: "MRI Shoulder" },
      { name: "MRI Abdomen" },
      { name: "MRI Pelvis" },
      { name: "MRCP" },
      { name: "MRA" },
      { name: "Mammography" },
      { name: "DEXA Scan (Bone Density)" },
      { name: "Nuclear Medicine - Thyroid Scan" },
      { name: "Nuclear Medicine - Bone Scan" },
      { name: "PET-CT Scan" },
      { name: "Barium Swallow" },
      { name: "Barium Meal" },
      { name: "Barium Enema" },
      { name: "IVU/IVP" },
      { name: "HSG (Hysterosalpingography)" },
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
      { name: "Event Monitor" },
      { name: "Treadmill Test (TMT/ETT)" },
      { name: "Stress Thallium Scan" },
      { name: "Dobutamine Stress Test" },
      { name: "Cardiac CT (Calcium Score)" },
      { name: "CT Coronary Angiography" },
      { name: "Cardiac MRI" },
      { name: "Coronary Angiography (CAG)" },
      { name: "Electrophysiology Study (EPS)" },
      { name: "Tilt Table Test" },
      { name: "Ankle-Brachial Index (ABI)" },
      { name: "Central Venous Pressure (CVP)" },
      { name: "Pulmonary Function Test (PFT)" },
      { name: "Arterial Blood Gas (ABG)" },
    ],
  },
  obstetricGyn: {
    label: "OB-GYN",
    icon: Baby,
    tests: [
      { name: "Urine Pregnancy Test" },
      { name: "Serum Beta-hCG", unit: "mIU/mL" },
      { name: "Quantitative Beta-hCG" },
      { name: "Ultrasound - Early Pregnancy (Transvaginal)" },
      { name: "Ultrasound - Dating Scan" },
      { name: "Ultrasound - NT Scan (11-14 weeks)" },
      { name: "Ultrasound - Anomaly Scan (18-22 weeks)" },
      { name: "Ultrasound - Growth Scan" },
      { name: "Ultrasound - Fetal Wellbeing" },
      { name: "Ultrasound - Biophysical Profile (BPP)" },
      { name: "Doppler - Umbilical Artery" },
      { name: "Doppler - Middle Cerebral Artery" },
      { name: "Non-Stress Test (NST)" },
      { name: "Contraction Stress Test (CST)" },
      { name: "Amniocentesis" },
      { name: "Chorionic Villus Sampling (CVS)" },
      { name: "NIPT/Cell-Free DNA Testing" },
      { name: "Triple Screen Test" },
      { name: "Quad Screen Test" },
      { name: "Group B Strep (GBS) Culture" },
      { name: "TORCH Panel" },
      { name: "Pap Smear" },
      { name: "HPV Test" },
      { name: "Colposcopy" },
      { name: "Endometrial Biopsy" },
      { name: "Hysteroscopy" },
      { name: "Saline Infusion Sonography (SIS)" },
      { name: "Semen Analysis" },
      { name: "Anti-Müllerian Hormone (AMH)" },
      { name: "Day 3 FSH/LH/Estradiol" },
      { name: "Prolactin" },
      { name: "Progesterone (Day 21)" },
    ],
  },
};

type SelectedInvestigations = Record<string, Record<string, { selected: boolean; result?: string }>>;

type InvestigationBuilderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (text: string) => void;
  existingInvestigation?: string;
};

export default function InvestigationBuilderDialog({
  open,
  onOpenChange,
  onInsert,
  existingInvestigation = "",
}: InvestigationBuilderDialogProps) {
  const [activeTab, setActiveTab] = useState<InvestigationType>("hematology");
  const [selectedInvestigations, setSelectedInvestigations] = useState<SelectedInvestigations>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // Parse existing investigation text when dialog opens
  useEffect(() => {
    if (open && existingInvestigation) {
      // Try to parse existing text - this is a simple approach
      // In a real app, you might want more sophisticated parsing
      setSelectedInvestigations({});
    }
  }, [open, existingInvestigation]);

  const handleToggleTest = (category: InvestigationType, testName: string) => {
    setSelectedInvestigations((prev) => {
      const categoryData = prev[category] || {};
      const currentTest = categoryData[testName];
      
      if (currentTest?.selected) {
        const { [testName]: removed, ...rest } = categoryData;
        return { ...prev, [category]: rest };
      }
      
      return {
        ...prev,
        [category]: {
          ...categoryData,
          [testName]: { selected: true, result: "" },
        },
      };
    });
  };

  const handleResultChange = (category: InvestigationType, testName: string, result: string) => {
    setSelectedInvestigations((prev) => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [testName]: { selected: true, result },
      },
    }));
  };

  const isTestSelected = (category: InvestigationType, testName: string) => {
    return selectedInvestigations[category]?.[testName]?.selected || false;
  };

  const getTestResult = (category: InvestigationType, testName: string) => {
    return selectedInvestigations[category]?.[testName]?.result || "";
  };

  const getTestAbnormalStatus = (category: InvestigationType, testName: string): AbnormalStatus => {
    const result = getTestResult(category, testName);
    if (!result) return "unknown";
    const testConfig = INVESTIGATION_CATEGORIES[category]?.tests.find((t) => t.name === testName);
    return checkValueAgainstRange(result, testConfig?.normalRange);
  };

  const getCategorySelectedCount = (category: InvestigationType) => {
    const categoryData = selectedInvestigations[category];
    if (!categoryData) return 0;
    return Object.values(categoryData).filter((t) => t.selected).length;
  };

  const getCategoryAbnormalCount = (category: InvestigationType) => {
    const categoryData = selectedInvestigations[category];
    if (!categoryData) return 0;
    let count = 0;
    Object.entries(categoryData).forEach(([testName, data]) => {
      if (data.selected && data.result) {
        const status = getTestAbnormalStatus(category, testName);
        if (status === "high" || status === "low" || status === "abnormal") {
          count++;
        }
      }
    });
    return count;
  };

  const getTotalSelectedCount = () => {
    let count = 0;
    Object.values(selectedInvestigations).forEach((category) => {
      count += Object.values(category).filter((t) => t.selected).length;
    });
    return count;
  };

  const getTotalAbnormalCount = () => {
    let count = 0;
    Object.entries(selectedInvestigations).forEach(([category, tests]) => {
      Object.entries(tests).forEach(([testName, data]) => {
        if (data.selected && data.result) {
          const status = getTestAbnormalStatus(category as InvestigationType, testName);
          if (status === "high" || status === "low" || status === "abnormal") {
            count++;
          }
        }
      });
    });
    return count;
  };

  const clearTabSelections = () => {
    setSelectedInvestigations((prev) => {
      const newSelections = { ...prev };
      delete newSelections[activeTab];
      return newSelections;
    });
  };

  const generateInvestigationText = () => {
    const lines: string[] = [];
    
    Object.entries(selectedInvestigations).forEach(([category, tests]) => {
      const categoryConfig = INVESTIGATION_CATEGORIES[category as InvestigationType];
      const selectedTests = Object.entries(tests).filter(([_, data]) => data.selected);
      
      if (selectedTests.length > 0) {
        lines.push(`**${categoryConfig.label}:**`);
        selectedTests.forEach(([testName, data]) => {
          const testConfig = categoryConfig.tests.find((t) => t.name === testName);
          if (data.result) {
            const status = checkValueAgainstRange(data.result, testConfig?.normalRange);
            let resultLine = `- ${testName}: ${data.result}`;
            if (testConfig?.unit) {
              resultLine += ` ${testConfig.unit}`;
            }
            // Add abnormal flag
            if (status === "high") {
              resultLine += ` ⬆️ **HIGH**`;
            } else if (status === "low") {
              resultLine += ` ⬇️ **LOW**`;
            }
            if (testConfig?.normalRange) {
              resultLine += ` (Normal: ${testConfig.normalRange})`;
            }
            lines.push(resultLine);
          } else {
            let testLine = `- ${testName}`;
            if (testConfig?.normalRange) {
              testLine += ` (Normal: ${testConfig.normalRange})`;
            }
            lines.push(testLine);
          }
        });
        lines.push("");
      }
    });
    
    return lines.join("\n").trim();
  };

  const handleInsert = () => {
    const text = generateInvestigationText();
    onInsert(text);
    onOpenChange(false);
    setSelectedInvestigations({});
    setSearchQuery("");
  };

  const filterTests = (tests: InvestigationTest[]) => {
    if (!searchQuery) return tests;
    return tests.filter((test) =>
      test.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const categories = Object.entries(INVESTIGATION_CATEGORIES) as [InvestigationType, typeof INVESTIGATION_CATEGORIES[InvestigationType]][];

  return (
    <PresetDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Investigation Builder"
      description="Select investigations and optionally add results"
      contentClassName="max-w-5xl"
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {getTotalSelectedCount()} investigation(s) selected
            </span>
            {getTotalAbnormalCount() > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {getTotalAbnormalCount()} abnormal
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleInsert} disabled={getTotalSelectedCount() === 0}>
              <Check className="h-4 w-4 mr-2" />
              Insert
            </Button>
          </div>
        </div>
      }
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search investigations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showPreview ? "Hide Preview" : "Show Preview"}
        </Button>
        {getCategorySelectedCount(activeTab) > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearTabSelections}
            className="text-destructive hover:text-destructive"
          >
            Clear Tab
          </Button>
        )}
      </div>

      {showPreview && getTotalSelectedCount() > 0 && (
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Preview:</h4>
          <pre className="text-sm whitespace-pre-wrap font-mono">
            {generateInvestigationText()}
          </pre>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as InvestigationType)}>
        <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
          {categories.map(([key, config]) => {
            const Icon = config.icon;
            const count = getCategorySelectedCount(key);
            const abnormalCount = getCategoryAbnormalCount(key);
            return (
              <TabsTrigger
                key={key}
                value={key}
                className="flex items-center gap-1.5 text-xs px-2 py-1.5"
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{config.label}</span>
                {count > 0 && (
                  <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                    abnormalCount > 0 
                      ? "bg-destructive text-destructive-foreground" 
                      : "bg-primary text-primary-foreground"
                  }`}>
                    {count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map(([key, config]) => (
          <TabsContent key={key} value={key} className="mt-0">
            <div className="grid gap-2">
              {filterTests(config.tests).map((test) => {
                const isSelected = isTestSelected(key, test.name);
                const result = getTestResult(key, test.name);
                const abnormalStatus = getTestAbnormalStatus(key, test.name);
                
                return (
                  <div
                    key={test.name}
                    className={`p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? abnormalStatus === "high" || abnormalStatus === "low"
                          ? "bg-destructive/10 border-destructive/50"
                          : "bg-primary/5 border-primary/30"
                        : "bg-card hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`${key}-${test.name}`}
                        checked={isSelected}
                        onCheckedChange={() => handleToggleTest(key, test.name)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <Label
                            htmlFor={`${key}-${test.name}`}
                            className="font-medium cursor-pointer"
                          >
                            {test.name}
                          </Label>
                          {test.normalRange && (
                            <span className="text-xs text-muted-foreground">
                              Normal: {test.normalRange}
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <Input
                              placeholder={`Enter result${test.unit ? ` (${test.unit})` : ""}`}
                              value={result}
                              onChange={(e) => handleResultChange(key, test.name, e.target.value)}
                              className={`max-w-xs ${
                                abnormalStatus === "high" || abnormalStatus === "low"
                                  ? "border-destructive focus-visible:ring-destructive"
                                  : ""
                              }`}
                            />
                            {test.unit && (
                              <span className="text-sm text-muted-foreground">{test.unit}</span>
                            )}
                            {abnormalStatus === "high" && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                HIGH
                              </Badge>
                            )}
                            {abnormalStatus === "low" && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <TrendingDown className="h-3 w-3" />
                                LOW
                              </Badge>
                            )}
                            {abnormalStatus === "normal" && result && (
                              <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <Check className="h-3 w-3" />
                                Normal
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {filterTests(config.tests).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No investigations found matching "{searchQuery}"
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </PresetDialog>
  );
}
