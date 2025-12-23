import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PresetDialog } from "@/components/patient/preset/PresetDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCheck, Eye, EyeOff, Copy, Check, Heart, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  calculateWeightPercentile,
  calculateHeightPercentile,
  calculateBMIPercentile,
  isPediatricPatient,
  getPatientGender,
  type GrowthPercentileResult,
} from "@/lib/growthCharts";

import { differenceInYears, differenceInMonths } from "date-fns";

// Get age-appropriate vital ranges
const getVitalRanges = (dateOfBirth?: string) => {
  if (!dateOfBirth) {
    // Default adult ranges
    return {
      bp: { systolic: { min: 90, max: 139 }, diastolic: { min: 60, max: 89 } },
      pulse: { min: 60, max: 100 },
      temp: { min: 36.1, max: 37.5 },
      respiratoryRate: { min: 12, max: 20 },
      spo2: { min: 95, max: 100 },
      bmi: { min: 18.5, max: 24.9 },
    };
  }

  const ageInYears = differenceInYears(new Date(), new Date(dateOfBirth));
  const ageInMonths = differenceInMonths(new Date(), new Date(dateOfBirth));

  // Neonate (0-28 days / ~1 month)
  if (ageInMonths < 1) {
    return {
      bp: { systolic: { min: 60, max: 90 }, diastolic: { min: 20, max: 60 } },
      pulse: { min: 100, max: 160 },
      temp: { min: 36.5, max: 37.5 },
      respiratoryRate: { min: 30, max: 60 },
      spo2: { min: 95, max: 100 },
      bmi: { min: 10, max: 18 },
    };
  }
  // Infant (1-12 months)
  if (ageInMonths < 12) {
    return {
      bp: { systolic: { min: 70, max: 100 }, diastolic: { min: 30, max: 65 } },
      pulse: { min: 100, max: 150 },
      temp: { min: 36.5, max: 37.5 },
      respiratoryRate: { min: 25, max: 50 },
      spo2: { min: 95, max: 100 },
      bmi: { min: 14, max: 20 },
    };
  }
  // Toddler (1-3 years)
  if (ageInYears < 3) {
    return {
      bp: { systolic: { min: 80, max: 110 }, diastolic: { min: 40, max: 70 } },
      pulse: { min: 90, max: 140 },
      temp: { min: 36.5, max: 37.5 },
      respiratoryRate: { min: 20, max: 40 },
      spo2: { min: 95, max: 100 },
      bmi: { min: 14, max: 18 },
    };
  }
  // Preschool (3-5 years)
  if (ageInYears < 6) {
    return {
      bp: { systolic: { min: 85, max: 115 }, diastolic: { min: 45, max: 75 } },
      pulse: { min: 80, max: 120 },
      temp: { min: 36.1, max: 37.5 },
      respiratoryRate: { min: 20, max: 30 },
      spo2: { min: 95, max: 100 },
      bmi: { min: 13.5, max: 17 },
    };
  }
  // School-age (6-12 years)
  if (ageInYears < 12) {
    return {
      bp: { systolic: { min: 90, max: 120 }, diastolic: { min: 55, max: 80 } },
      pulse: { min: 70, max: 110 },
      temp: { min: 36.1, max: 37.5 },
      respiratoryRate: { min: 16, max: 24 },
      spo2: { min: 95, max: 100 },
      bmi: { min: 14, max: 21 },
    };
  }
  // Adolescent (12-18 years)
  if (ageInYears < 18) {
    return {
      bp: { systolic: { min: 90, max: 130 }, diastolic: { min: 60, max: 85 } },
      pulse: { min: 60, max: 100 },
      temp: { min: 36.1, max: 37.5 },
      respiratoryRate: { min: 12, max: 20 },
      spo2: { min: 95, max: 100 },
      bmi: { min: 17, max: 25 },
    };
  }
  // Adult (18+ years)
  return {
    bp: { systolic: { min: 90, max: 139 }, diastolic: { min: 60, max: 89 } },
    pulse: { min: 60, max: 100 },
    temp: { min: 36.1, max: 37.5 },
    respiratoryRate: { min: 12, max: 20 },
    spo2: { min: 95, max: 100 },
    bmi: { min: 18.5, max: 24.9 },
  };
};

// Get age group label for display
const getAgeGroupLabel = (dateOfBirth?: string): string => {
  if (!dateOfBirth) return "Adult";
  
  const ageInYears = differenceInYears(new Date(), new Date(dateOfBirth));
  const ageInMonths = differenceInMonths(new Date(), new Date(dateOfBirth));

  if (ageInMonths < 1) return "Neonate";
  if (ageInMonths < 12) return "Infant";
  if (ageInYears < 3) return "Toddler";
  if (ageInYears < 6) return "Preschool";
  if (ageInYears < 12) return "School-age";
  if (ageInYears < 18) return "Adolescent";
  return "Adult";
};

// Normal vital values (adult defaults)
const NORMAL_VITALS = {
  bp: "120/80",
  pulse: "72",
  temp: "37.0",
  respiratoryRate: "16",
  spo2: "98",
  weight: "",
  height: "",
  bmi: "",
  generalAppearance: "Alert, oriented, well-nourished, in no acute distress",
};

// Get pediatric-specific normal vitals
const getPediatricNormalVitals = (dateOfBirth?: string) => {
  if (!dateOfBirth) return NORMAL_VITALS;
  
  const ageInYears = differenceInYears(new Date(), new Date(dateOfBirth));
  const ageInMonths = differenceInMonths(new Date(), new Date(dateOfBirth));

  if (ageInMonths < 1) {
    return {
      ...NORMAL_VITALS,
      bp: "70/40",
      pulse: "130",
      respiratoryRate: "40",
      generalAppearance: "Alert, active, appropriate reflexes, pink and well-perfused",
    };
  }
  if (ageInMonths < 12) {
    return {
      ...NORMAL_VITALS,
      bp: "85/55",
      pulse: "120",
      respiratoryRate: "35",
      generalAppearance: "Alert, interactive, appropriate for age",
    };
  }
  if (ageInYears < 3) {
    return {
      ...NORMAL_VITALS,
      bp: "95/60",
      pulse: "110",
      respiratoryRate: "28",
      generalAppearance: "Active, playful, developmentally appropriate",
    };
  }
  if (ageInYears < 6) {
    return {
      ...NORMAL_VITALS,
      bp: "100/65",
      pulse: "100",
      respiratoryRate: "24",
      generalAppearance: "Active, cooperative, age-appropriate behavior",
    };
  }
  if (ageInYears < 12) {
    return {
      ...NORMAL_VITALS,
      bp: "105/70",
      pulse: "90",
      respiratoryRate: "20",
      generalAppearance: "Alert, cooperative, age-appropriate",
    };
  }
  if (ageInYears < 18) {
    return {
      ...NORMAL_VITALS,
      bp: "115/75",
      pulse: "80",
      respiratoryRate: "16",
      generalAppearance: "Alert, oriented, cooperative",
    };
  }
  return NORMAL_VITALS;
};

// Check if a vital sign is abnormal based on age-appropriate ranges
const isVitalAbnormal = (field: string, value: string, ranges: ReturnType<typeof getVitalRanges>): boolean => {
  if (!value || value.trim() === "") return false;
  
  if (field === "bp") {
    const parts = value.split("/");
    if (parts.length !== 2) return false;
    const systolic = parseFloat(parts[0]);
    const diastolic = parseFloat(parts[1]);
    if (isNaN(systolic) || isNaN(diastolic)) return false;
    return systolic < ranges.bp.systolic.min || systolic > ranges.bp.systolic.max ||
           diastolic < ranges.bp.diastolic.min || diastolic > ranges.bp.diastolic.max;
  }
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return false;
  
  const range = ranges[field as keyof typeof ranges];
  if (!range || typeof range !== 'object' || 'systolic' in range) return false;
  
  return numValue < range.min || numValue > range.max;
};

// Get abnormality description based on age-appropriate ranges
const getAbnormalityDescription = (field: string, value: string, ranges: ReturnType<typeof getVitalRanges>): string | null => {
  if (!value || value.trim() === "") return null;
  
  if (field === "bp") {
    const parts = value.split("/");
    if (parts.length !== 2) return null;
    const systolic = parseFloat(parts[0]);
    const diastolic = parseFloat(parts[1]);
    if (isNaN(systolic) || isNaN(diastolic)) return null;
    
    if (systolic >= ranges.bp.systolic.max + 40 || diastolic >= ranges.bp.diastolic.max + 30) return "Severely High";
    if (systolic > ranges.bp.systolic.max || diastolic > ranges.bp.diastolic.max) return "High";
    if (systolic < ranges.bp.systolic.min || diastolic < ranges.bp.diastolic.min) return "Low";
    return null;
  }
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return null;
  
  switch (field) {
    case "pulse":
      if (numValue > ranges.pulse.max) return "Tachycardia";
      if (numValue < ranges.pulse.min) return "Bradycardia";
      break;
    case "temp":
      if (numValue >= 38) return "Fever";
      if (numValue < 36) return "Hypothermia";
      break;
    case "respiratoryRate":
      if (numValue > ranges.respiratoryRate.max) return "Tachypnea";
      if (numValue < ranges.respiratoryRate.min) return "Bradypnea";
      break;
    case "spo2":
      if (numValue < 90) return "Severe Hypoxemia";
      if (numValue < ranges.spo2.min) return "Low";
      break;
    case "bmi":
      if (numValue >= 30) return "Obese";
      if (numValue > ranges.bmi.max) return "Overweight";
      if (numValue < ranges.bmi.min) return "Underweight";
      break;
  }
  return null;
};

interface VitalSigns {
  bp: string;
  pulse: string;
  temp: string;
  respiratoryRate: string;
  spo2: string;
  weight: string;
  height: string;
  bmi: string;
  generalAppearance: string;
}

interface PhysicalExaminationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (text: string) => void;
  vitalSigns?: VitalSigns;
  onVitalSignsChange?: (field: keyof VitalSigns, value: string) => void;
  patientDateOfBirth?: string;
  patientGender?: string;
}

type Finding = {
  name: string;
  value: string;
};

type SystemFindings = {
  [key: string]: Finding[];
};

const RESPIRATORY_ITEMS = {
  "General Appearance": ["No Dyspnoea", "Dyspnoea", "Cyanosis", "Stridor", "Hoarseness"],
  "Hands": ["No Clubbing", "Clubbing", "Staining", "Wasting", "Tremor (Asterixis)"],
  "Face": ["No Central Cyanosis", "Central Cyanosis", "Nasal Polyps", "Engorged Turbinates", "Deviated Septum"],
  "Trachea": ["Central", "Deviated Left", "Deviated Right", "Tracheal Tug"],
  "Chest Inspection": ["Normal Shape", "Barrel Chest", "Pigeon Chest", "Funnel Chest", "Kyphosis", "Scoliosis"],
  "Palpation": ["Expansion Symmetrical", "Expansion Reduced", "Vocal Fremitus Normal", "Vocal Fremitus Increased", "Vocal Fremitus Decreased"],
  "Percussion": ["Resonant", "Dull", "Hyper-resonant", "Stony Dull"],
  "Auscultation": ["Vesicular Breath Sounds", "Bronchial Breath Sounds", "Diminished Breath Sounds", "Wheeze", "Crackles", "Rhonchi", "Pleural Rub"],
};

const CARDIOVASCULAR_ITEMS = {
  "General Appearance": ["Comfortable", "Dyspnoeic", "Cachectic", "Marfan's Syndrome", "Down's Syndrome"],
  "Hands": ["No Clubbing", "Clubbing", "Splinter Haemorrhages", "Osler's Nodes", "Janeway Lesions", "Palmar Xanthomata"],
  "Pulse": ["Regular", "Irregular", "Bradycardia", "Tachycardia", "Bounding", "Weak", "Collapsing"],
  "Blood Pressure": ["Normal", "Hypertension", "Hypotension", "Wide Pulse Pressure", "Narrow Pulse Pressure"],
  "Face": ["No Jaundice", "Jaundice", "Xanthelasma", "Mitral Facies", "Central Cyanosis"],
  "Neck (JVP)": ["Normal", "Elevated", "Not Visible"],
  "Praecordium Inspection": ["Normal", "Visible Pulsation", "Scars Present", "Pacemaker Visible"],
  "Praecordium Palpation": ["Apex Beat Normal", "Apex Beat Displaced", "No Heaves", "Heaves", "No Thrills", "Thrills"],
  "Heart Sounds": ["S1 S2 Normal", "S3 Present", "S4 Present", "No Murmur", "Murmur Present", "Split S2"],
  "Lower Limbs": ["No Oedema", "Pitting Oedema", "Non-Pitting Oedema", "Peripheral Pulses Normal", "Peripheral Pulses Reduced"],
};

const GASTROINTESTINAL_ITEMS = {
  "General Appearance": ["Well Nourished", "Jaundiced", "Wasted", "Dehydrated", "Encephalopathic"],
  "Hands": ["No Leuconychia", "Leuconychia", "No Clubbing", "Clubbing", "No Palmar Erythema", "Palmar Erythema", "Dupuytren's Contracture", "No Hepatic Flap", "Hepatic Flap"],
  "Arms": ["No Bruising", "Bruising", "No Petechiae", "Petechiae", "No Spider Naevi", "Spider Naevi", "No Muscle Wasting", "Muscle Wasting", "No Scratch Marks", "Scratch Marks"],
  "Face": ["No Jaundice", "Jaundice", "No Anaemia", "Anaemia", "No Kayser-Fleischer Rings", "Kayser-Fleischer Rings", "No Xanthelasma", "Xanthelasma"],
  "Mouth": ["Normal", "Glossitis", "Angular Stomatitis", "Ulcers", "Fetor Hepaticus"],
  "Abdomen Inspection": ["Normal", "Distended", "Scars Present", "Visible Peristalsis", "Striae", "Caput Medusae"],
  "Abdomen Palpation": ["Soft Non-Tender", "Tender", "Guarding", "Rigidity", "Rebound Tenderness", "Mass Palpable"],
  "Liver": ["Not Palpable", "Palpable - Smooth", "Palpable - Nodular", "Tender"],
  "Spleen": ["Not Palpable", "Palpable"],
  "Kidneys": ["Not Palpable", "Palpable - Ballotable"],
  "Percussion": ["Normal", "Ascites Present", "Shifting Dullness Positive"],
  "Auscultation": ["Bowel Sounds Normal", "Bowel Sounds Increased", "Bowel Sounds Decreased", "Absent", "Bruits Present"],
  "Hernias": ["None", "Inguinal", "Umbilical", "Incisional"],
};

const NERVOUS_ITEMS = {
  "General": ["Alert and Oriented", "Drowsy", "Confused", "Unresponsive", "No Neck Stiffness", "Neck Stiffness", "Kernig's Sign Negative", "Kernig's Sign Positive"],
  "Cranial Nerve I": ["Smell Normal", "Anosmia"],
  "Cranial Nerve II": ["Visual Acuity Normal", "Visual Acuity Reduced", "Visual Fields Normal", "Visual Field Defect", "Fundoscopy Normal", "Papilloedema"],
  "Cranial Nerves III, IV, VI": ["Eye Movements Normal", "Nystagmus", "Diplopia", "No Ptosis", "Ptosis", "Pupil Size Equal", "Pupil Reaction Normal"],
  "Cranial Nerve V": ["Sensation Normal", "Sensation Reduced", "Corneal Reflex Normal", "Corneal Reflex Absent", "Jaw Power Normal"],
  "Cranial Nerve VII": ["Facial Symmetry Normal", "Upper Motor Neuron Pattern", "Lower Motor Neuron Pattern"],
  "Cranial Nerve VIII": ["Hearing Normal", "Hearing Reduced", "Weber's Test Normal", "Rinne's Test Normal"],
  "Cranial Nerves IX, X": ["Gag Reflex Normal", "Palate Moves Symmetrically", "Uvula Central"],
  "Cranial Nerve XI": ["Trapezius Normal", "Sternomastoid Normal"],
  "Cranial Nerve XII": ["Tongue Central", "Tongue Deviated", "No Fasciculations", "Fasciculations Present"],
  "Upper Limbs - Tone": ["Normal", "Increased (Spasticity)", "Increased (Rigidity)", "Decreased (Flaccid)"],
  "Upper Limbs - Power": ["5/5 Normal", "4/5 Reduced", "3/5 Against Gravity", "2/5 Not Against Gravity", "1/5 Flicker", "0/5 None"],
  "Upper Limbs - Reflexes": ["Normal", "Hyperreflexia", "Hyporeflexia", "Areflexia"],
  "Upper Limbs - Coordination": ["Normal", "Dysdiadochokinesia", "Intention Tremor", "Past Pointing"],
  "Upper Limbs - Sensation": ["Normal", "Reduced Light Touch", "Reduced Pinprick", "Reduced Proprioception", "Reduced Vibration"],
  "Lower Limbs - Tone": ["Normal", "Increased (Spasticity)", "Increased (Rigidity)", "Decreased (Flaccid)"],
  "Lower Limbs - Power": ["5/5 Normal", "4/5 Reduced", "3/5 Against Gravity", "2/5 Not Against Gravity", "1/5 Flicker", "0/5 None"],
  "Lower Limbs - Reflexes": ["Normal", "Hyperreflexia", "Hyporeflexia", "Areflexia", "Babinski Negative", "Babinski Positive"],
  "Lower Limbs - Coordination": ["Normal", "Heel-Shin Test Abnormal"],
  "Lower Limbs - Sensation": ["Normal", "Reduced Light Touch", "Reduced Pinprick", "Reduced Proprioception", "Reduced Vibration"],
  "Gait": ["Normal", "Ataxic", "Spastic", "Parkinsonian", "Foot Drop", "Antalgic"],
};

const MUSCULOSKELETAL_ITEMS = {
  "Cervical Spine": ["Full Range of Motion", "Limited Flexion", "Limited Extension", "Limited Rotation", "No Tenderness", "Tenderness", "No Muscle Spasm", "Muscle Spasm"],
  "Shoulder": ["Full Range of Motion", "Limited Abduction", "Limited External Rotation", "Limited Internal Rotation", "No Painful Arc", "Painful Arc", "No Tenderness", "Tenderness"],
  "Elbow": ["Full Range of Motion", "Limited Flexion", "Limited Extension", "No Tenderness", "Tenderness", "No Swelling", "Swelling"],
  "Wrist/Hand": ["Full Range of Motion", "Limited Motion", "No Swelling", "Swelling", "No Deformity", "Deformity", "No Tenderness", "Tenderness", "Grip Strength Normal", "Grip Strength Reduced"],
  "Thoracic Spine": ["Normal Curvature", "Kyphosis", "Scoliosis", "No Tenderness", "Tenderness", "Full Range of Motion", "Limited Motion"],
  "Lumbar Spine": ["Normal Lordosis", "Reduced Lordosis", "Increased Lordosis", "No Tenderness", "Tenderness", "No Paravertebral Spasm", "Paravertebral Spasm", "Full Range of Motion", "Limited Flexion", "Limited Extension", "Straight Leg Raise Negative", "Straight Leg Raise Positive"],
  "Hip": ["Full Range of Motion", "Limited Flexion", "Limited Internal Rotation", "Limited External Rotation", "Trendelenburg Negative", "Trendelenburg Positive", "No Pain on Movement", "Pain on Movement"],
  "Knee": ["Full Range of Motion", "Limited Flexion", "Limited Extension", "No Effusion", "Effusion Present", "No Crepitus", "Crepitus", "Ligaments Stable", "Ligament Laxity", "McMurray's Negative", "McMurray's Positive", "No Tenderness", "Tenderness Joint Line"],
  "Ankle/Foot": ["Full Range of Motion", "Limited Dorsiflexion", "Limited Plantarflexion", "No Swelling", "Swelling", "No Tenderness", "Tenderness", "No Deformity", "Deformity"],
};

const SKIN_ITEMS = {
  "General": ["Normal", "Pale", "Jaundiced", "Cyanotic", "Flushed", "Dehydrated"],
  "Texture": ["Normal", "Dry", "Moist", "Oily", "Rough"],
  "Temperature": ["Normal", "Warm", "Cool", "Hot"],
  "Lesions": ["None", "Rash Present", "Ulcers Present", "Nodules Present", "Petechiae", "Purpura", "Ecchymosis"],
  "Turgor": ["Normal", "Reduced"],
  "Oedema": ["None", "Peripheral", "Sacral", "Generalized"],
  "Hair Distribution": ["Normal", "Alopecia", "Hirsutism"],
  "Nails": ["Normal", "Clubbing", "Koilonychia", "Onycholysis", "Pitting"],
};

const ENDOCRINE_ITEMS = {
  "General": ["Normal Habitus", "Obese", "Wasted", "Cushing's Features", "Acromegalic Features", "Thyroid Eye Disease"],
  "Thyroid": ["Not Palpable", "Diffusely Enlarged", "Nodular", "Tender", "No Bruit", "Bruit Present"],
  "Hands": ["Normal Size", "Enlarged", "No Sweating", "Sweaty", "No Tremor", "Tremor Present", "No Palmar Erythema", "Palmar Erythema"],
  "Face": ["Normal", "Moon Face", "No Hirsutism", "Hirsutism", "No Acne", "Acne", "Coarse Features"],
  "Skin": ["Normal", "Hyperpigmentation", "Vitiligo", "No Striae", "Striae", "No Acanthosis Nigricans", "Acanthosis Nigricans"],
  "Eyes": ["Normal", "Exophthalmos", "No Lid Lag", "Lid Lag", "No Lid Retraction", "Lid Retraction"],
};

const PEDIATRICS_NEONATE_ITEMS = {
  "General Appearance": ["Well Appearing", "Unwell Appearing", "Normal Skin Color", "Jaundiced", "Cyanotic", "Pale", "Alert", "Lethargic", "No Anomalies", "Anomalies Present"],
  "Growth Status": ["Head Circumference Normal", "Head Circumference Large", "Head Circumference Small", "Weight Appropriate", "Weight Low", "Weight High", "Length Normal"],
  "Head/Face": ["Normal Shape", "Caput Succedaneum", "Cephalhaematoma", "Fontanelle Flat", "Fontanelle Bulging", "Fontanelle Sunken", "Sutures Normal", "Sutures Overriding", "Eyes Normal", "Red Reflex Present", "Ears Normal Position", "Nose Patent", "Mouth Normal", "Palate Intact", "Cleft Palate", "Tongue Normal", "Jaw Normal"],
  "Neck": ["Normal", "Torticollis", "Mass Present", "No Clavicle Fracture", "Clavicle Fracture"],
  "Arms/Hands": ["Symmetrical", "Normal Length", "Normal Proportion", "Digits Normal", "Polydactyly", "Syndactyly", "Normal Grip Reflex"],
  "Chest/Cardiorespiratory": ["Normal Chest Shape", "Normal Chest Size", "Nipples Normal", "Heart Sounds Normal", "Heart Murmur Present", "Heart Rate Normal", "Tachycardia", "Bradycardia", "Pulses Normal", "Femoral Pulses Present", "Breath Sounds Normal", "Grunting", "Stridor", "Respiratory Rate Normal", "Tachypnea", "Retractions"],
  "Abdomen": ["Normal Size", "Distended", "Soft", "Firm", "No Organomegaly", "Hepatomegaly", "Splenomegaly", "Umbilicus Normal", "Umbilical Hernia", "Umbilicus Dry", "Umbilicus Red/Inflamed"],
  "Genitourinary - Male": ["Penis Normal", "Foreskin Normal", "Phimosis", "Hypospadias", "Epispadias", "Testes Descended Bilateral", "Undescended Testis", "Hydrocele", "Anus Normal Position", "Anus Patent"],
  "Genitourinary - Female": ["Labia Normal", "Clitoris Normal", "Hymen Normal", "Anus Normal Position", "Anus Patent"],
  "Back/Spine": ["Spine Straight", "Scoliosis", "Sacral Dimple", "Hair Tuft", "Skin Normal", "Spina Bifida", "Scapulae Symmetrical", "Buttocks Symmetrical"],
  "Hips/Legs/Feet": ["Ortolani Negative", "Ortolani Positive", "Barlow Negative", "Barlow Positive", "Leg Length Equal", "Legs Symmetrical", "Digits Normal", "Clubfoot", "Talipes Equinovarus", "Metatarsus Adductus"],
  "Neurological": ["Normal Posture", "Normal Behaviour", "Movements Normal", "Movements Abnormal", "Tone Normal", "Hypotonia", "Hypertonia", "Cry Normal", "Weak Cry", "High-pitched Cry", "Moro Reflex Present", "Rooting Reflex Present", "Suck Reflex Present", "Grasp Reflex Present", "Stepping Reflex Present"],
};

const PEDIATRICS_ENT_ITEMS = {
  "Ears": ["Pinnae Normal Shape", "Pinnae Normal Size", "Pinnae Normal Position", "Low-Set Ears", "Preauricular Tags", "Preauricular Pits", "External Canal Clear", "External Canal Debris", "Tympanic Membrane Normal", "Tympanic Membrane Bulging", "Tympanic Membrane Retracted", "Tympanic Membrane Red", "Effusion Present"],
  "Nose": ["Normal Shape", "Normal Size", "Normal Position", "Deviated Septum", "Turbinates Normal", "Turbinates Swollen", "Discharge Clear", "Discharge Purulent", "Nasal Patency Confirmed"],
  "Mouth/Throat": ["Lips Normal", "Gingiva Normal", "Teeth Normal", "Mucosa Normal", "Mucosa Dry", "Tongue Normal", "Geographic Tongue", "Palate Intact", "Pharynx Normal", "Pharynx Red", "Tonsils Normal", "Tonsils Enlarged", "Tonsils Exudate", "Uvula Central"],
  "Neck": ["Normal Shape", "Normal Height", "Neck Vessels Normal", "No Masses", "Mass Present", "No Lymphadenopathy", "Cervical Lymphadenopathy", "Thyroid Normal"],
};

const PEDIATRICS_CHEST_ITEMS = {
  "General Appearance": ["Chest Wall Normal", "Symmetrical", "Asymmetrical", "Normal Shape", "Pectus Excavatum", "Pectus Carinatum", "Nipples Aligned", "Breathing Pattern Normal", "Intercostal Retractions", "Subcostal Retractions"],
  "Heart": ["Peripheral Pulses Normal", "Peripheral Pulses Weak", "Palpation Normal", "Precordial Impulse Normal", "Heart Sounds Normal", "Murmur Present", "S1 S2 Normal", "Split S2"],
  "Lungs": ["Auscultation Clear", "Wheeze", "Crackles", "Rhonchi", "Stridor", "Diminished Breath Sounds", "Breath Sounds Equal Bilateral"],
};

const PEDIATRICS_NEURO_ITEMS = {
  "Mental Status": ["Alert", "Responsive to Voice", "Responsive to Pain", "Unresponsive", "Age-Appropriate Behavior", "Irritable", "Inconsolable", "Lethargic"],
  "Fontanelle (Infant)": ["Anterior Fontanelle Flat", "Anterior Fontanelle Bulging", "Anterior Fontanelle Sunken", "Anterior Fontanelle Closed", "Posterior Fontanelle Flat", "Posterior Fontanelle Closed"],
  "Head Control": ["Age-Appropriate Head Control", "Head Lag Present", "Steady Head Control"],
  "Cranial Nerves": ["Pupils Equal Round Reactive", "Pupil Asymmetry", "Eye Movements Normal", "Facial Symmetry Normal", "Facial Asymmetry", "Gag Reflex Present", "Suck Reflex Present", "Rooting Reflex Present"],
  "Tone": ["Normal Tone", "Hypotonia", "Hypertonia", "Spasticity", "Flaccid", "Opisthotonus"],
  "Primitive Reflexes (Infant)": ["Moro Reflex Present", "Moro Reflex Absent", "Grasp Reflex Present", "Grasp Reflex Absent", "Stepping Reflex Present", "ATNR Present", "Parachute Reflex Present"],
  "Deep Tendon Reflexes": ["Reflexes Normal", "Hyperreflexia", "Hyporeflexia", "Areflexia", "Clonus Absent", "Clonus Present", "Babinski Downgoing", "Babinski Upgoing"],
  "Motor Function": ["Spontaneous Movements Normal", "Asymmetric Movements", "Tremor", "Seizure Activity", "Posturing", "Strength Normal", "Weakness Present"],
  "Coordination": ["Age-Appropriate Coordination", "Ataxia", "Dysmetria", "Poor Fine Motor"],
  "Gait (Ambulatory Child)": ["Normal Gait", "Ataxic Gait", "Toe Walking", "Wide-Based Gait", "Limping", "Refuses to Walk"],
  "Meningeal Signs": ["Neck Supple", "Nuchal Rigidity", "Kernig Sign Negative", "Kernig Sign Positive", "Brudzinski Sign Negative", "Brudzinski Sign Positive"],
};

const PEDIATRICS_ABDOMEN_ITEMS = {
  "Inspection": ["Abdomen Flat", "Abdomen Rounded", "Abdomen Scaphoid", "Distended", "Umbilicus Normal", "Umbilical Hernia", "Visible Peristalsis", "No Visible Masses"],
  "Auscultation": ["Bowel Sounds Normal", "Bowel Sounds Hyperactive", "Bowel Sounds Hypoactive", "Bowel Sounds Absent", "No Bruits"],
  "Percussion": ["Tympanic", "Dull", "Shifting Dullness Absent", "Shifting Dullness Present"],
  "Palpation": ["Soft", "Non-Tender", "Tender", "Guarding", "Rebound Tenderness", "No Masses", "Mass Palpable", "No Rigidity", "Rigidity"],
  "Liver": ["Liver Not Palpable", "Liver Palpable Below Costal Margin", "Hepatomegaly"],
  "Spleen": ["Spleen Not Palpable", "Splenomegaly"],
  "Kidneys": ["Kidneys Not Palpable", "Kidney Palpable"],
  "Inguinal Region": ["No Hernia", "Inguinal Hernia Present", "Lymph Nodes Not Palpable", "Inguinal Lymphadenopathy"],
  "Genitalia - Male": ["Penis Normal", "Circumcised", "Uncircumcised", "Foreskin Retractable", "Phimosis", "Hypospadias", "Testes Descended", "Undescended Testis", "Hydrocele", "Scrotal Swelling"],
  "Genitalia - Female": ["External Genitalia Normal", "Labial Adhesions", "Vaginal Discharge", "No Vaginal Discharge"],
  "Anus/Rectum": ["Anus Normal Position", "Anus Patent", "Perianal Erythema", "Fissure", "Skin Tags"],
};

const PEDIATRICS_GROWTH_ITEMS = {
  "Growth Parameters": ["Weight Normal for Age", "Weight Below 5th Percentile", "Weight Above 95th Percentile", "Height Normal for Age", "Height Below 5th Percentile", "Height Above 95th Percentile", "Head Circumference Normal", "Microcephaly", "Macrocephaly", "BMI Normal", "Underweight", "Overweight", "Obese"],
  "Nutrition Status": ["Well-Nourished", "Malnourished", "Failure to Thrive", "Adequate Subcutaneous Fat", "Reduced Subcutaneous Fat", "No Muscle Wasting", "Muscle Wasting"],
  "Gross Motor (Infant)": ["Lifts Head Prone", "Rolls Over", "Sits Unsupported", "Crawls", "Pulls to Stand", "Cruises", "Walks Independently", "Delayed Gross Motor"],
  "Gross Motor (Toddler/Child)": ["Runs", "Climbs Stairs", "Jumps", "Hops", "Balances on One Foot", "Age-Appropriate Gross Motor", "Delayed Gross Motor"],
  "Fine Motor": ["Reaches for Objects", "Transfers Objects", "Pincer Grasp Present", "Scribbles", "Draws Circle", "Copies Shapes", "Age-Appropriate Fine Motor", "Delayed Fine Motor"],
  "Language (Infant)": ["Coos", "Babbles", "Says Mama/Dada", "First Words Present", "Delayed Language"],
  "Language (Toddler/Child)": ["Two-Word Phrases", "Sentences", "Speech Intelligible", "Speech Unclear", "Vocabulary Appropriate", "Age-Appropriate Language", "Delayed Language"],
  "Social/Emotional": ["Social Smile Present", "Stranger Anxiety Present", "Parallel Play", "Cooperative Play", "Age-Appropriate Social Skills", "Delayed Social Development", "Attachment Normal"],
  "Cognitive": ["Follows Objects", "Recognizes Caregiver", "Object Permanence", "Follows Commands", "Age-Appropriate Cognitive", "Cognitive Delay"],
};

const PEDIATRICS_EYES_ITEMS = {
  "External Eye": ["Eyes Symmetrical", "Eyes Asymmetrical", "No Ptosis", "Ptosis Present", "Eyelids Normal", "Blepharitis", "Periorbital Swelling", "Periorbital Erythema"],
  "Conjunctiva": ["Conjunctiva Clear", "Conjunctival Injection", "Conjunctival Discharge", "Purulent Discharge", "Subconjunctival Hemorrhage"],
  "Sclera": ["Sclera White", "Scleral Icterus", "Blue Sclera"],
  "Cornea": ["Cornea Clear", "Corneal Opacity", "Corneal Abrasion"],
  "Pupils": ["Pupils Equal Round Reactive", "Anisocoria", "Pupils Dilated", "Pupils Constricted", "Sluggish Pupil Response", "No Red Reflex", "Red Reflex Present Bilateral"],
  "Eye Movement": ["Full Extraocular Movements", "Restricted Eye Movements", "Nystagmus", "Strabismus", "Esotropia", "Exotropia", "Sunset Sign"],
  "Vision Assessment": ["Fixes and Follows", "Blink to Threat Present", "Vision Appears Normal", "Possible Visual Impairment"],
  "Fundoscopy": ["Fundoscopy Normal", "Papilledema", "Retinal Hemorrhage", "Unable to Visualize"],
};

const PEDIATRICS_SKIN_ITEMS = {
  "Color": ["Normal Skin Color", "Pallor", "Jaundice", "Cyanosis", "Mottled", "Flushed", "Erythema"],
  "Hydration": ["Well Hydrated", "Dry Skin", "Decreased Turgor", "Severely Dehydrated Skin"],
  "Rashes": ["No Rash", "Macular Rash", "Papular Rash", "Maculopapular Rash", "Vesicular Rash", "Pustular Rash", "Petechial Rash", "Purpuric Rash", "Urticarial Rash", "Eczematous Rash"],
  "Birthmarks": ["No Birthmarks", "Mongolian Spot", "Café-au-lait Spots", "Hemangioma", "Port Wine Stain", "Salmon Patch"],
  "Lesions": ["No Lesions", "Impetigo", "Cellulitis", "Abscess", "Insect Bites", "Bruising", "Burn", "Laceration"],
  "Hair": ["Hair Normal", "Alopecia", "Cradle Cap", "Lice", "Nits Present"],
  "Nails": ["Nails Normal", "Nail Clubbing", "Nail Pitting", "Paronychia", "Koilonychia"],
};

const PEDIATRICS_LYMPH_ITEMS = {
  "Cervical": ["Cervical Nodes Not Palpable", "Anterior Cervical Lymphadenopathy", "Posterior Cervical Lymphadenopathy", "Nodes Mobile", "Nodes Fixed", "Nodes Non-Tender", "Nodes Tender"],
  "Submandibular/Submental": ["Submandibular Nodes Not Palpable", "Submandibular Lymphadenopathy", "Submental Nodes Not Palpable", "Submental Lymphadenopathy"],
  "Preauricular/Postauricular": ["Preauricular Nodes Not Palpable", "Preauricular Lymphadenopathy", "Postauricular Nodes Not Palpable", "Postauricular Lymphadenopathy"],
  "Supraclavicular": ["Supraclavicular Nodes Not Palpable", "Supraclavicular Lymphadenopathy"],
  "Axillary": ["Axillary Nodes Not Palpable", "Axillary Lymphadenopathy"],
  "Epitrochlear": ["Epitrochlear Nodes Not Palpable", "Epitrochlear Lymphadenopathy"],
  "Inguinal": ["Inguinal Nodes Not Palpable", "Inguinal Lymphadenopathy"],
  "Node Characteristics": ["Nodes < 1cm", "Nodes 1-2cm", "Nodes > 2cm", "Nodes Soft", "Nodes Firm", "Nodes Rubbery", "Nodes Matted", "Overlying Skin Normal", "Overlying Skin Erythematous"],
};

const PEDIATRICS_MSK_ITEMS = {
  "General": ["Normal Posture", "Abnormal Posture", "No Deformities", "Deformity Present", "No Asymmetry", "Asymmetry Present"],
  "Spine": ["Spine Straight", "Scoliosis", "Kyphosis", "Lordosis", "Sacral Dimple", "No Tenderness", "Spinal Tenderness"],
  "Upper Limbs": ["Full Range of Motion Arms", "Limited ROM Arms", "No Swelling Arms", "Swelling Present Arms", "Normal Strength Arms", "Weakness Arms", "No Tenderness Arms", "Tenderness Present Arms"],
  "Lower Limbs": ["Full Range of Motion Legs", "Limited ROM Legs", "No Swelling Legs", "Swelling Present Legs", "Normal Strength Legs", "Weakness Legs", "No Tenderness Legs", "Tenderness Present Legs"],
  "Hips": ["Ortolani Negative", "Ortolani Positive", "Barlow Negative", "Barlow Positive", "Galeazzi Sign Negative", "Galeazzi Sign Positive", "Full Hip ROM", "Limited Hip ROM", "No Hip Click", "Hip Click Present"],
  "Knees": ["Knees Normal Alignment", "Genu Varum", "Genu Valgum", "Full Knee ROM", "Limited Knee ROM", "No Knee Effusion", "Knee Effusion"],
  "Feet/Ankles": ["Feet Normal", "Flat Feet", "High Arches", "Clubfoot", "Metatarsus Adductus", "Talipes Equinovarus", "Full Ankle ROM", "Limited Ankle ROM"],
  "Joints": ["No Joint Swelling", "Joint Swelling", "No Joint Warmth", "Joint Warmth", "No Joint Erythema", "Joint Erythema", "No Crepitus", "Crepitus Present"],
  "Gait": ["Normal Gait for Age", "Antalgic Gait", "Trendelenburg Gait", "Toe Walking", "In-Toeing", "Out-Toeing", "Waddling Gait"],
};

const GYNECOLOGY_ITEMS = {
  "General Appearance": ["Well Appearing", "Uncomfortable", "Acute Distress", "No Pallor", "Pallor Present"],
  "Breast Examination": ["Breasts Symmetrical", "Breasts Asymmetrical", "No Masses", "Mass Palpable", "No Tenderness", "Tenderness Present", "No Nipple Discharge", "Nipple Discharge Present", "No Skin Changes", "Skin Dimpling", "Peau d'Orange", "Nipples Normal", "Nipple Retraction", "No Axillary Lymphadenopathy", "Axillary Lymphadenopathy"],
  "Abdominal Inspection": ["Abdomen Flat", "Abdomen Distended", "No Scars", "Surgical Scars Present", "No Visible Masses", "Visible Mass"],
  "Abdominal Palpation": ["Soft Non-Tender", "Tender Suprapubic", "Tender Adnexal", "No Masses", "Pelvic Mass Palpable", "No Guarding", "Guarding Present", "No Rebound", "Rebound Tenderness"],
  "External Genitalia": ["Normal Vulva", "Vulvar Erythema", "Vulvar Edema", "Vulvar Lesions", "Vulvar Ulcers", "Vulvar Atrophy", "Bartholin Gland Normal", "Bartholin Cyst", "Bartholin Abscess", "No Prolapse", "Cystocele", "Rectocele", "Uterine Prolapse"],
  "Speculum Examination": ["Cervix Normal", "Cervix Nulliparous", "Cervix Parous", "Cervix Erythematous", "Cervical Erosion", "Nabothian Cysts", "Cervical Polyp", "Cervical Lesion", "Os Closed", "Os Open", "No Discharge", "Clear Discharge", "White Discharge", "Yellow Discharge", "Purulent Discharge", "Blood at Os", "Vaginal Walls Normal", "Vaginal Atrophy", "Vaginal Lesions"],
  "Bimanual Examination": ["Uterus Anteverted", "Uterus Retroverted", "Uterus Normal Size", "Uterus Enlarged", "Uterus Non-Tender", "Uterus Tender", "Uterus Mobile", "Uterus Fixed", "Adnexa Non-Tender", "Adnexa Tender Right", "Adnexa Tender Left", "Adnexa Fullness Right", "Adnexa Fullness Left", "Adnexal Mass Right", "Adnexal Mass Left", "No Cervical Motion Tenderness", "Cervical Motion Tenderness"],
  "Rectovaginal Examination": ["Rectovaginal Septum Normal", "Rectovaginal Nodularity", "Uterosacral Ligaments Normal", "Uterosacral Nodularity", "Pouch of Douglas Normal", "Pouch of Douglas Fullness", "Rectal Tone Normal", "No Rectal Masses", "Stool Guaiac Negative", "Stool Guaiac Positive"],
};

const OBSTETRIC_ITEMS = {
  "General Appearance": ["Well Appearing", "Uncomfortable", "Acute Distress", "No Pallor", "Pallor Present", "No Edema", "Facial Edema", "Pedal Edema", "Generalized Edema"],
  "Vital Signs": ["BP Normal", "Hypertension", "Hypotension", "Pulse Normal", "Tachycardia", "Bradycardia", "Temperature Normal", "Fever"],
  "Breast Examination": ["Breasts Symmetrical", "Breast Engorgement", "Nipples Normal", "Nipples Flat", "Nipples Inverted", "Colostrum Present", "No Masses", "No Tenderness"],
  "Abdominal Inspection": ["Gravid Uterus", "Linea Nigra Present", "Striae Gravidarum", "No Scars", "Previous C-Section Scar", "Umbilicus Everted", "Fetal Movements Visible"],
  "Fundal Height": ["Fundal Height Appropriate for Dates", "Fundal Height Small for Dates", "Fundal Height Large for Dates", "Symphysis-Fundal Height Measured"],
  "Leopold Maneuvers": ["Cephalic Presentation", "Breech Presentation", "Transverse Lie", "Oblique Lie", "Back on Left", "Back on Right", "Engaged", "Not Engaged", "Floating"],
  "Fetal Heart": ["FHR Normal (110-160 bpm)", "FHR Bradycardia", "FHR Tachycardia", "FHR Regular", "FHR Irregular", "Fetal Heart Tones Heard", "Fetal Heart Tones Not Heard"],
  "Uterine Activity": ["No Contractions", "Irregular Contractions", "Regular Contractions", "Uterus Soft", "Uterus Firm", "Uterus Irritable", "Uterine Tenderness"],
  "Cervical Examination": ["Cervix Closed", "Cervix 1cm Dilated", "Cervix 2cm Dilated", "Cervix 3cm Dilated", "Cervix 4cm Dilated", "Cervix 5cm Dilated", "Cervix 6-10cm Dilated", "Cervix Fully Dilated", "Cervix Long", "Cervix 50% Effaced", "Cervix 80% Effaced", "Cervix Fully Effaced", "Cervix Posterior", "Cervix Mid", "Cervix Anterior", "Cervix Firm", "Cervix Soft", "Membranes Intact", "Membranes Ruptured", "Station -3", "Station -2", "Station -1", "Station 0", "Station +1", "Station +2", "Station +3"],
  "Amniotic Fluid": ["Membranes Intact", "Spontaneous Rupture of Membranes", "Artificial Rupture of Membranes", "Liquor Clear", "Liquor Meconium Stained", "Liquor Blood Stained", "Polyhydramnios", "Oligohydramnios", "Normal Amniotic Fluid Volume"],
  "Lower Limbs": ["No Edema", "Bilateral Pedal Edema", "Unilateral Edema", "No Varicosities", "Varicose Veins", "No Calf Tenderness", "Calf Tenderness", "Reflexes Normal", "Hyperreflexia", "Clonus Absent", "Clonus Present"],
  "Pelvis Assessment": ["Adequate Pelvis", "Borderline Pelvis", "Contracted Pelvis", "Diagonal Conjugate Adequate", "Ischial Spines Not Prominent", "Ischial Spines Prominent", "Sacral Curve Normal", "Subpubic Angle Adequate"],
};

const POSTNATAL_ITEMS = {
  "General Appearance": ["Well Appearing", "Pale", "Fatigued", "Alert", "Drowsy"],
  "Vital Signs": ["BP Normal", "Hypertension", "Hypotension", "Pulse Normal", "Tachycardia", "Temperature Normal", "Fever"],
  "Breasts": ["Breasts Soft", "Breast Engorgement", "No Breast Tenderness", "Breast Tenderness", "No Erythema", "Breast Erythema", "Nipples Intact", "Nipple Cracking", "Nipple Bleeding", "Milk Letdown Normal", "Colostrum Present", "Mature Milk Present"],
  "Uterus": ["Uterus Well Contracted", "Uterus Boggy", "Fundus at Umbilicus", "Fundus Below Umbilicus", "Fundus Involuting Normally", "Uterus Non-Tender", "Uterus Tender"],
  "Lochia": ["Lochia Rubra", "Lochia Serosa", "Lochia Alba", "Lochia Normal Amount", "Lochia Heavy", "Lochia Foul Smelling", "No Clots", "Clots Present"],
  "Perineum": ["Perineum Intact", "Episiotomy Healing Well", "Episiotomy Infected", "Laceration Healing Well", "Perineal Edema", "Perineal Hematoma", "Sutures Intact", "No Wound Dehiscence", "Wound Dehiscence"],
  "C-Section Wound": ["Incision Clean Dry", "Incision Healing Well", "Wound Erythema", "Wound Discharge", "Wound Dehiscence", "No Hematoma", "Wound Hematoma", "Sutures/Staples Intact"],
  "Lower Limbs": ["No Edema", "Pedal Edema Resolving", "Pedal Edema Persistent", "No Calf Tenderness", "Calf Tenderness", "Homans Sign Negative", "Homans Sign Positive"],
  "Bladder/Bowels": ["Voiding Normally", "Urinary Retention", "Dysuria", "Bowels Opened", "Constipation", "No Hemorrhoids", "Hemorrhoids Present"],
  "Emotional Status": ["Mood Appropriate", "Tearful", "Anxious", "Bonding Well", "Difficulty Bonding", "No Suicidal Ideation"],
};

const SYSTEMS = [
  { id: "vitals", label: "Vitals", items: {} },
  { id: "respiratory", label: "Respiratory", items: RESPIRATORY_ITEMS },
  { id: "cardiovascular", label: "Cardiovascular", items: CARDIOVASCULAR_ITEMS },
  { id: "gastrointestinal", label: "GI", items: GASTROINTESTINAL_ITEMS },
  { id: "nervous", label: "Neuro", items: NERVOUS_ITEMS },
  { id: "musculoskeletal", label: "MSK", items: MUSCULOSKELETAL_ITEMS },
  { id: "skin", label: "Skin", items: SKIN_ITEMS },
  { id: "endocrine", label: "Endocrine", items: ENDOCRINE_ITEMS },
  { id: "gynecology", label: "Gynecology", items: GYNECOLOGY_ITEMS },
  { id: "obstetric", label: "Obstetric", items: OBSTETRIC_ITEMS },
  { id: "postnatal", label: "Postnatal", items: POSTNATAL_ITEMS },
  { id: "pediatrics_neonate", label: "Neonate", items: PEDIATRICS_NEONATE_ITEMS },
  { id: "pediatrics_ent", label: "Peds ENT", items: PEDIATRICS_ENT_ITEMS },
  { id: "pediatrics_chest", label: "Peds Chest", items: PEDIATRICS_CHEST_ITEMS },
  { id: "pediatrics_neuro", label: "Peds Neuro", items: PEDIATRICS_NEURO_ITEMS },
  { id: "pediatrics_abdomen", label: "Peds Abdomen", items: PEDIATRICS_ABDOMEN_ITEMS },
  { id: "pediatrics_growth", label: "Peds Growth", items: PEDIATRICS_GROWTH_ITEMS },
  { id: "pediatrics_eyes", label: "Peds Eyes", items: PEDIATRICS_EYES_ITEMS },
  { id: "pediatrics_skin", label: "Peds Skin", items: PEDIATRICS_SKIN_ITEMS },
  { id: "pediatrics_lymph", label: "Peds Lymph", items: PEDIATRICS_LYMPH_ITEMS },
  { id: "pediatrics_msk", label: "Peds MSK", items: PEDIATRICS_MSK_ITEMS },
];

// Normal findings for each system
const NORMAL_FINDINGS: { [systemId: string]: { [category: string]: string[] } } = {
  respiratory: {
    "General Appearance": ["No Dyspnoea"],
    "Hands": ["No Clubbing"],
    "Face": ["No Central Cyanosis"],
    "Trachea": ["Central"],
    "Chest Inspection": ["Normal Shape"],
    "Palpation": ["Expansion Symmetrical", "Vocal Fremitus Normal"],
    "Percussion": ["Resonant"],
    "Auscultation": ["Vesicular Breath Sounds"],
  },
  cardiovascular: {
    "General Appearance": ["Comfortable"],
    "Hands": ["No Clubbing"],
    "Pulse": ["Regular"],
    "Blood Pressure": ["Normal"],
    "Face": ["No Jaundice"],
    "Neck (JVP)": ["Normal"],
    "Praecordium Inspection": ["Normal"],
    "Praecordium Palpation": ["Apex Beat Normal", "No Heaves", "No Thrills"],
    "Heart Sounds": ["S1 S2 Normal", "No Murmur"],
    "Lower Limbs": ["No Oedema", "Peripheral Pulses Normal"],
  },
  gastrointestinal: {
    "General Appearance": ["Well Nourished"],
    "Hands": ["No Leuconychia", "No Clubbing", "No Palmar Erythema", "No Hepatic Flap"],
    "Arms": ["No Bruising", "No Spider Naevi"],
    "Face": ["No Jaundice", "No Anaemia"],
    "Mouth": ["Normal"],
    "Abdomen Inspection": ["Normal"],
    "Abdomen Palpation": ["Soft Non-Tender"],
    "Liver": ["Not Palpable"],
    "Spleen": ["Not Palpable"],
    "Kidneys": ["Not Palpable"],
    "Percussion": ["Normal"],
    "Auscultation": ["Bowel Sounds Normal"],
    "Hernias": ["None"],
  },
  nervous: {
    "General": ["Alert and Oriented", "No Neck Stiffness", "Kernig's Sign Negative"],
    "Cranial Nerve I": ["Smell Normal"],
    "Cranial Nerve II": ["Visual Acuity Normal", "Visual Fields Normal", "Fundoscopy Normal"],
    "Cranial Nerves III, IV, VI": ["Eye Movements Normal", "No Ptosis", "Pupil Size Equal", "Pupil Reaction Normal"],
    "Cranial Nerve V": ["Sensation Normal", "Corneal Reflex Normal", "Jaw Power Normal"],
    "Cranial Nerve VII": ["Facial Symmetry Normal"],
    "Cranial Nerve VIII": ["Hearing Normal", "Weber's Test Normal", "Rinne's Test Normal"],
    "Cranial Nerves IX, X": ["Gag Reflex Normal", "Palate Moves Symmetrically", "Uvula Central"],
    "Cranial Nerve XI": ["Trapezius Normal", "Sternomastoid Normal"],
    "Cranial Nerve XII": ["Tongue Central", "No Fasciculations"],
    "Upper Limbs - Tone": ["Normal"],
    "Upper Limbs - Power": ["5/5 Normal"],
    "Upper Limbs - Reflexes": ["Normal"],
    "Upper Limbs - Coordination": ["Normal"],
    "Upper Limbs - Sensation": ["Normal"],
    "Lower Limbs - Tone": ["Normal"],
    "Lower Limbs - Power": ["5/5 Normal"],
    "Lower Limbs - Reflexes": ["Normal", "Babinski Negative"],
    "Lower Limbs - Coordination": ["Normal"],
    "Lower Limbs - Sensation": ["Normal"],
    "Gait": ["Normal"],
  },
  musculoskeletal: {
    "Cervical Spine": ["Full Range of Motion", "No Tenderness", "No Muscle Spasm"],
    "Shoulder": ["Full Range of Motion", "No Painful Arc", "No Tenderness"],
    "Elbow": ["Full Range of Motion", "No Tenderness", "No Swelling"],
    "Wrist/Hand": ["Full Range of Motion", "No Swelling", "No Deformity", "No Tenderness", "Grip Strength Normal"],
    "Thoracic Spine": ["Normal Curvature", "No Tenderness", "Full Range of Motion"],
    "Lumbar Spine": ["Normal Lordosis", "No Tenderness", "No Paravertebral Spasm", "Full Range of Motion", "Straight Leg Raise Negative"],
    "Hip": ["Full Range of Motion", "Trendelenburg Negative", "No Pain on Movement"],
    "Knee": ["Full Range of Motion", "No Effusion", "No Crepitus", "Ligaments Stable", "McMurray's Negative", "No Tenderness"],
    "Ankle/Foot": ["Full Range of Motion", "No Swelling", "No Tenderness", "No Deformity"],
  },
  skin: {
    "General": ["Normal"],
    "Texture": ["Normal"],
    "Temperature": ["Normal"],
    "Lesions": ["None"],
    "Turgor": ["Normal"],
    "Oedema": ["None"],
    "Hair Distribution": ["Normal"],
    "Nails": ["Normal"],
  },
  endocrine: {
    "General": ["Normal Habitus"],
    "Thyroid": ["Not Palpable", "No Bruit"],
    "Hands": ["Normal Size", "No Sweating", "No Tremor", "No Palmar Erythema"],
    "Face": ["Normal", "No Hirsutism", "No Acne"],
    "Skin": ["Normal", "No Striae", "No Acanthosis Nigricans"],
    "Eyes": ["Normal", "No Lid Lag", "No Lid Retraction"],
  },
  pediatrics_neonate: {
    "General Appearance": ["Well Appearing", "Normal Skin Color", "Alert", "No Anomalies"],
    "Growth Status": ["Head Circumference Normal", "Weight Appropriate", "Length Normal"],
    "Head/Face": ["Normal Shape", "Fontanelle Flat", "Sutures Normal", "Eyes Normal", "Red Reflex Present", "Ears Normal Position", "Nose Patent", "Mouth Normal", "Palate Intact", "Tongue Normal", "Jaw Normal"],
    "Neck": ["Normal", "No Clavicle Fracture"],
    "Arms/Hands": ["Symmetrical", "Normal Length", "Digits Normal", "Normal Grip Reflex"],
    "Chest/Cardiorespiratory": ["Normal Chest Shape", "Heart Sounds Normal", "Heart Rate Normal", "Pulses Normal", "Femoral Pulses Present", "Breath Sounds Normal", "Respiratory Rate Normal"],
    "Abdomen": ["Normal Size", "Soft", "No Organomegaly", "Umbilicus Normal", "Umbilicus Dry"],
    "Genitourinary - Male": ["Penis Normal", "Testes Descended Bilateral", "Anus Normal Position", "Anus Patent"],
    "Genitourinary - Female": ["Labia Normal", "Clitoris Normal", "Anus Normal Position", "Anus Patent"],
    "Back/Spine": ["Spine Straight", "Skin Normal", "Scapulae Symmetrical", "Buttocks Symmetrical"],
    "Hips/Legs/Feet": ["Ortolani Negative", "Barlow Negative", "Leg Length Equal", "Legs Symmetrical", "Digits Normal"],
    "Neurological": ["Normal Posture", "Normal Behaviour", "Movements Normal", "Tone Normal", "Cry Normal", "Moro Reflex Present", "Rooting Reflex Present", "Suck Reflex Present", "Grasp Reflex Present"],
  },
  pediatrics_ent: {
    "Ears": ["Pinnae Normal Shape", "Pinnae Normal Position", "External Canal Clear", "Tympanic Membrane Normal"],
    "Nose": ["Normal Shape", "Normal Size", "Turbinates Normal", "Nasal Patency Confirmed"],
    "Mouth/Throat": ["Lips Normal", "Gingiva Normal", "Teeth Normal", "Mucosa Normal", "Tongue Normal", "Palate Intact", "Pharynx Normal", "Tonsils Normal", "Uvula Central"],
    "Neck": ["Normal Shape", "No Masses", "No Lymphadenopathy", "Thyroid Normal"],
  },
  pediatrics_chest: {
    "General Appearance": ["Chest Wall Normal", "Symmetrical", "Normal Shape", "Nipples Aligned", "Breathing Pattern Normal"],
    "Heart": ["Peripheral Pulses Normal", "Palpation Normal", "Heart Sounds Normal", "S1 S2 Normal"],
    "Lungs": ["Auscultation Clear", "Breath Sounds Equal Bilateral"],
  },
  pediatrics_neuro: {
    "Mental Status": ["Alert", "Age-Appropriate Behavior"],
    "Fontanelle (Infant)": ["Anterior Fontanelle Flat"],
    "Head Control": ["Age-Appropriate Head Control"],
    "Cranial Nerves": ["Pupils Equal Round Reactive", "Eye Movements Normal", "Facial Symmetry Normal", "Gag Reflex Present"],
    "Tone": ["Normal Tone"],
    "Primitive Reflexes (Infant)": ["Moro Reflex Present", "Grasp Reflex Present"],
    "Deep Tendon Reflexes": ["Reflexes Normal", "Clonus Absent", "Babinski Downgoing"],
    "Motor Function": ["Spontaneous Movements Normal", "Strength Normal"],
    "Coordination": ["Age-Appropriate Coordination"],
    "Gait (Ambulatory Child)": ["Normal Gait"],
    "Meningeal Signs": ["Neck Supple", "Kernig Sign Negative", "Brudzinski Sign Negative"],
  },
  pediatrics_abdomen: {
    "Inspection": ["Abdomen Flat", "Umbilicus Normal", "No Visible Masses"],
    "Auscultation": ["Bowel Sounds Normal", "No Bruits"],
    "Percussion": ["Tympanic", "Shifting Dullness Absent"],
    "Palpation": ["Soft", "Non-Tender", "No Masses", "No Rigidity"],
    "Liver": ["Liver Not Palpable"],
    "Spleen": ["Spleen Not Palpable"],
    "Kidneys": ["Kidneys Not Palpable"],
    "Inguinal Region": ["No Hernia", "Lymph Nodes Not Palpable"],
    "Genitalia - Male": ["Penis Normal", "Testes Descended"],
    "Genitalia - Female": ["External Genitalia Normal", "No Vaginal Discharge"],
    "Anus/Rectum": ["Anus Normal Position", "Anus Patent"],
  },
  pediatrics_growth: {
    "Growth Parameters": ["Weight Normal for Age", "Height Normal for Age", "Head Circumference Normal", "BMI Normal"],
    "Nutrition Status": ["Well-Nourished", "Adequate Subcutaneous Fat", "No Muscle Wasting"],
    "Gross Motor (Infant)": ["Age-Appropriate Gross Motor"],
    "Gross Motor (Toddler/Child)": ["Age-Appropriate Gross Motor"],
    "Fine Motor": ["Age-Appropriate Fine Motor"],
    "Language (Infant)": ["Coos", "Babbles"],
    "Language (Toddler/Child)": ["Age-Appropriate Language"],
    "Social/Emotional": ["Age-Appropriate Social Skills", "Attachment Normal"],
    "Cognitive": ["Age-Appropriate Cognitive"],
  },
  pediatrics_eyes: {
    "External Eye": ["Eyes Symmetrical", "No Ptosis", "Eyelids Normal"],
    "Conjunctiva": ["Conjunctiva Clear"],
    "Sclera": ["Sclera White"],
    "Cornea": ["Cornea Clear"],
    "Pupils": ["Pupils Equal Round Reactive", "Red Reflex Present Bilateral"],
    "Eye Movement": ["Full Extraocular Movements"],
    "Vision Assessment": ["Fixes and Follows", "Vision Appears Normal"],
    "Fundoscopy": ["Fundoscopy Normal"],
  },
  pediatrics_skin: {
    "Color": ["Normal Skin Color"],
    "Hydration": ["Well Hydrated"],
    "Rashes": ["No Rash"],
    "Birthmarks": ["No Birthmarks"],
    "Lesions": ["No Lesions"],
    "Hair": ["Hair Normal"],
    "Nails": ["Nails Normal"],
  },
  pediatrics_lymph: {
    "Cervical": ["Cervical Nodes Not Palpable"],
    "Submandibular/Submental": ["Submandibular Nodes Not Palpable", "Submental Nodes Not Palpable"],
    "Preauricular/Postauricular": ["Preauricular Nodes Not Palpable", "Postauricular Nodes Not Palpable"],
    "Supraclavicular": ["Supraclavicular Nodes Not Palpable"],
    "Axillary": ["Axillary Nodes Not Palpable"],
    "Epitrochlear": ["Epitrochlear Nodes Not Palpable"],
    "Inguinal": ["Inguinal Nodes Not Palpable"],
  },
  pediatrics_msk: {
    "General": ["Normal Posture", "No Deformities", "No Asymmetry"],
    "Spine": ["Spine Straight", "No Tenderness"],
    "Upper Limbs": ["Full Range of Motion Arms", "No Swelling Arms", "Normal Strength Arms", "No Tenderness Arms"],
    "Lower Limbs": ["Full Range of Motion Legs", "No Swelling Legs", "Normal Strength Legs", "No Tenderness Legs"],
    "Hips": ["Ortolani Negative", "Barlow Negative", "Full Hip ROM", "No Hip Click"],
    "Knees": ["Knees Normal Alignment", "Full Knee ROM", "No Knee Effusion"],
    "Feet/Ankles": ["Feet Normal", "Full Ankle ROM"],
    "Joints": ["No Joint Swelling", "No Joint Warmth", "No Joint Erythema", "No Crepitus"],
    "Gait": ["Normal Gait for Age"],
  },
  gynecology: {
    "General Appearance": ["Well Appearing", "No Pallor"],
    "Breast Examination": ["Breasts Symmetrical", "No Masses", "No Tenderness", "No Nipple Discharge", "No Skin Changes", "Nipples Normal", "No Axillary Lymphadenopathy"],
    "Abdominal Inspection": ["Abdomen Flat", "No Scars", "No Visible Masses"],
    "Abdominal Palpation": ["Soft Non-Tender", "No Masses", "No Guarding", "No Rebound"],
    "External Genitalia": ["Normal Vulva", "Bartholin Gland Normal", "No Prolapse"],
    "Speculum Examination": ["Cervix Normal", "Os Closed", "No Discharge", "Vaginal Walls Normal"],
    "Bimanual Examination": ["Uterus Anteverted", "Uterus Normal Size", "Uterus Non-Tender", "Uterus Mobile", "Adnexa Non-Tender", "No Cervical Motion Tenderness"],
    "Rectovaginal Examination": ["Rectovaginal Septum Normal", "Uterosacral Ligaments Normal", "Pouch of Douglas Normal", "Rectal Tone Normal", "No Rectal Masses"],
  },
  obstetric: {
    "General Appearance": ["Well Appearing", "No Pallor", "No Edema"],
    "Vital Signs": ["BP Normal", "Pulse Normal", "Temperature Normal"],
    "Breast Examination": ["Breasts Symmetrical", "Nipples Normal", "No Masses", "No Tenderness"],
    "Abdominal Inspection": ["Gravid Uterus", "No Scars"],
    "Fundal Height": ["Fundal Height Appropriate for Dates"],
    "Leopold Maneuvers": ["Cephalic Presentation", "Back on Left"],
    "Fetal Heart": ["FHR Normal (110-160 bpm)", "FHR Regular", "Fetal Heart Tones Heard"],
    "Uterine Activity": ["No Contractions", "Uterus Soft"],
    "Cervical Examination": ["Cervix Closed", "Membranes Intact"],
    "Amniotic Fluid": ["Membranes Intact", "Normal Amniotic Fluid Volume"],
    "Lower Limbs": ["No Edema", "No Varicosities", "No Calf Tenderness", "Reflexes Normal", "Clonus Absent"],
    "Pelvis Assessment": ["Adequate Pelvis"],
  },
  postnatal: {
    "General Appearance": ["Well Appearing", "Alert"],
    "Vital Signs": ["BP Normal", "Pulse Normal", "Temperature Normal"],
    "Breasts": ["Breasts Soft", "No Breast Tenderness", "No Erythema", "Nipples Intact", "Milk Letdown Normal"],
    "Uterus": ["Uterus Well Contracted", "Fundus Below Umbilicus", "Fundus Involuting Normally", "Uterus Non-Tender"],
    "Lochia": ["Lochia Normal Amount", "No Clots"],
    "Perineum": ["Perineum Intact"],
    "C-Section Wound": ["Incision Clean Dry", "Incision Healing Well", "No Hematoma", "Sutures/Staples Intact"],
    "Lower Limbs": ["No Edema", "No Calf Tenderness", "Homans Sign Negative"],
    "Bladder/Bowels": ["Voiding Normally", "Bowels Opened", "No Hemorrhoids"],
    "Emotional Status": ["Mood Appropriate", "Bonding Well", "No Suicidal Ideation"],
  },
};

// Percentile display card component
function PercentileCard({ label, result }: { label: string; result: GrowthPercentileResult }) {
  const getPercentileColor = () => {
    if (result.category === "low") return "text-amber-600 dark:text-amber-400";
    if (result.category === "high") return "text-amber-600 dark:text-amber-400";
    return "text-green-600 dark:text-green-400";
  };
  
  const getBorderColor = () => {
    if (result.category === "low") return "border-amber-200 dark:border-amber-800";
    if (result.category === "high") return "border-amber-200 dark:border-amber-800";
    return "border-green-200 dark:border-green-800";
  };
  
  return (
    <div className={cn("p-3 rounded-md border bg-background", getBorderColor())}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {result.category === "low" && <TrendingDown className="h-4 w-4 text-amber-500" />}
        {result.category === "high" && <TrendingUp className="h-4 w-4 text-amber-500" />}
        {result.category === "normal" && <Minus className="h-4 w-4 text-green-500" />}
      </div>
      <div className={cn("text-lg font-bold", getPercentileColor())}>{result.percentile}%</div>
      <div className="text-xs text-muted-foreground mt-1">z-score: {result.zScore}</div>
      <div className="text-xs text-muted-foreground mt-1">{result.interpretation}</div>
    </div>
  );
}

export default function PhysicalExaminationDialog({
  open,
  onOpenChange,
  onInsert,
  vitalSigns,
  onVitalSignsChange,
  patientDateOfBirth,
  patientGender,
}: PhysicalExaminationDialogProps) {
  const [selectedFindings, setSelectedFindings] = useState<SystemFindings>({});
  const [activeTab, setActiveTab] = useState("vitals");
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Get age-appropriate vital ranges
  const vitalRanges = useMemo(() => getVitalRanges(patientDateOfBirth), [patientDateOfBirth]);
  const ageGroupLabel = useMemo(() => getAgeGroupLabel(patientDateOfBirth), [patientDateOfBirth]);
  
  // Calculate growth chart percentiles for pediatric patients
  const growthPercentiles = useMemo(() => {
    if (!patientDateOfBirth || !patientGender || !isPediatricPatient(patientDateOfBirth)) {
      return null;
    }
    
    const gender = getPatientGender(patientGender);
    if (!gender) return null;
    
    const weight = parseFloat(vitalSigns?.weight || "");
    const height = parseFloat(vitalSigns?.height || "");
    const bmi = parseFloat(vitalSigns?.bmi || "");
    
    return {
      weight: !isNaN(weight) && weight > 0 
        ? calculateWeightPercentile(weight, patientDateOfBirth, gender)
        : null,
      height: !isNaN(height) && height > 0
        ? calculateHeightPercentile(height, patientDateOfBirth, gender)
        : null,
      bmi: !isNaN(bmi) && bmi > 0
        ? calculateBMIPercentile(bmi, patientDateOfBirth, gender)
        : null,
    };
  }, [patientDateOfBirth, patientGender, vitalSigns?.weight, vitalSigns?.height, vitalSigns?.bmi]);

  // Auto-calculate BMI when weight or height changes
  useEffect(() => {
    if (vitalSigns && onVitalSignsChange) {
      const weight = parseFloat(vitalSigns.weight);
      const height = parseFloat(vitalSigns.height);
      if (weight && height && height > 0) {
        const heightInMeters = height / 100;
        const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);
        if (bmi !== vitalSigns.bmi) {
          onVitalSignsChange("bmi", bmi);
        }
      }
    }
  }, [vitalSigns?.weight, vitalSigns?.height]);

  const handleFindingToggle = (system: string, category: string, finding: string, checked: boolean) => {
    setSelectedFindings((prev) => {
      const systemFindings = prev[system] || [];
      const key = `${category}:${finding}`;
      
      if (checked) {
        return {
          ...prev,
          [system]: [...systemFindings, { name: key, value: finding }],
        };
      } else {
        return {
          ...prev,
          [system]: systemFindings.filter((f) => f.name !== key),
        };
      }
    });
  };

  const isFindingSelected = (system: string, category: string, finding: string) => {
    const key = `${category}:${finding}`;
    return selectedFindings[system]?.some((f) => f.name === key) || false;
  };

  const selectNormalExam = () => {
    // Only select normal findings for the currently active tab
    const currentSystemNormal = NORMAL_FINDINGS[activeTab];
    if (!currentSystemNormal) return;
    
    const findings: Finding[] = [];
    Object.entries(currentSystemNormal).forEach(([category, items]) => {
      items.forEach((finding) => {
        findings.push({ name: `${category}:${finding}`, value: finding });
      });
    });
    
    setSelectedFindings(prev => ({
      ...prev,
      [activeTab]: findings,
    }));
  };

  // Fill normal vitals (age-appropriate)
  const fillNormalVitals = () => {
    if (onVitalSignsChange) {
      const normalVitals = getPediatricNormalVitals(patientDateOfBirth);
      Object.entries(normalVitals).forEach(([key, value]) => {
        if (key !== 'bmi') { // BMI is auto-calculated
          onVitalSignsChange(key as keyof VitalSigns, value);
        }
      });
      toast({
        title: `${ageGroupLabel} Normal Vitals Applied`,
        description: `Age-appropriate normal vital values have been filled in for ${ageGroupLabel.toLowerCase()} patients.`,
      });
    }
  };

  // Generate vitals summary text
  const generateVitalsSummary = useMemo(() => {
    if (!vitalSigns) return "";
    const parts: string[] = [];
    
    if (vitalSigns.bp) parts.push(`BP: ${vitalSigns.bp} mmHg`);
    if (vitalSigns.pulse) parts.push(`Pulse: ${vitalSigns.pulse} bpm`);
    if (vitalSigns.temp) parts.push(`Temp: ${vitalSigns.temp}°C`);
    if (vitalSigns.respiratoryRate) parts.push(`RR: ${vitalSigns.respiratoryRate}/min`);
    if (vitalSigns.spo2) parts.push(`SpO2: ${vitalSigns.spo2}%`);
    if (vitalSigns.weight) parts.push(`Weight: ${vitalSigns.weight} kg`);
    if (vitalSigns.height) parts.push(`Height: ${vitalSigns.height} cm`);
    if (vitalSigns.bmi) parts.push(`BMI: ${vitalSigns.bmi}`);
    if (vitalSigns.generalAppearance) parts.push(`General: ${vitalSigns.generalAppearance}`);
    
    return parts.length > 0 ? `**Vital Signs:**\n${parts.join(", ")}` : "";
  }, [vitalSigns]);

  // Check if any vitals are entered
  const hasVitalsEntered = useMemo(() => {
    if (!vitalSigns) return false;
    return Object.entries(vitalSigns).some(([key, value]) => key !== 'bmi' && value && value.trim() !== '');
  }, [vitalSigns]);

  const generateExamText = useMemo(() => {
    const lines: string[] = [];
    
    // Include vitals summary if entered
    if (hasVitalsEntered && generateVitalsSummary) {
      lines.push(generateVitalsSummary);
      lines.push("");
    }
    
    SYSTEMS.forEach((system) => {
      const findings = selectedFindings[system.id];
      if (findings && findings.length > 0) {
        lines.push(`**${system.label} Examination:**`);
        
        // Group by category
        const grouped: { [category: string]: string[] } = {};
        findings.forEach((f) => {
          const [category, finding] = f.name.split(":");
          if (!grouped[category]) grouped[category] = [];
          grouped[category].push(finding);
        });
        
        Object.entries(grouped).forEach(([category, items]) => {
          lines.push(`- ${category}: ${items.join(", ")}`);
        });
        
        lines.push("");
      }
    });
    
    return lines.join("\n").trim();
  }, [selectedFindings, hasVitalsEntered, generateVitalsSummary]);

  const handleInsert = () => {
    if (generateExamText) {
      onInsert(generateExamText);
    }
    onOpenChange(false);
    resetState();
  };

  const resetState = () => {
    setSelectedFindings({});
    setActiveTab("vitals");
    setShowPreview(false);
    setCopied(false);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateExamText);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Physical examination text copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetState();
    }
    onOpenChange(isOpen);
  };

  const getTotalSelectedCount = () => {
    return Object.values(selectedFindings).reduce((acc, findings) => acc + findings.length, 0);
  };

  const getSystemSelectedCount = (systemId: string) => {
    return selectedFindings[systemId]?.length || 0;
  };

  return (
    <PresetDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Physical Exam Builder"
      description="Select findings from each body system (Adults & Pediatrics)"
      contentClassName="max-w-4xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-sm text-muted-foreground">
            {getTotalSelectedCount()} finding(s) selected{hasVitalsEntered && " + Vitals"}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleInsert} disabled={getTotalSelectedCount() === 0 && !hasVitalsEntered}>
              Insert Findings
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {activeTab === "vitals" && (
          <Button
            variant="outline"
            size="sm"
            onClick={fillNormalVitals}
            className="gap-2"
          >
            <Heart className="h-4 w-4" />
            Normal Vitals
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={selectNormalExam}
          className="gap-2"
        >
          <CheckCheck className="h-4 w-4" />
          Normal Exam
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="gap-2"
        >
          {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showPreview ? "Hide Preview" : "Show Preview"}
        </Button>
        {activeTab === "vitals" && hasVitalsEntered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (onVitalSignsChange) {
                Object.keys(vitalSigns || {}).forEach((key) => {
                  onVitalSignsChange(key as keyof VitalSigns, "");
                });
                toast({
                  title: "Vitals Cleared",
                  description: "All vital signs have been cleared.",
                });
              }
            }}
            className="text-destructive hover:text-destructive"
          >
            Clear Tab
          </Button>
        )}
        {activeTab !== "vitals" && getSystemSelectedCount(activeTab) > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedFindings(prev => {
              const newFindings = { ...prev };
              delete newFindings[activeTab];
              return newFindings;
            })}
            className="text-destructive hover:text-destructive"
          >
            Clear Tab
          </Button>
        )}
      </div>

      {showPreview && (getTotalSelectedCount() > 0 || hasVitalsEntered) && (
        <div className="mb-4 p-4 bg-muted rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Preview</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyToClipboard}
              className="gap-1 h-7 px-2"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <ScrollArea className="h-[200px]">
            <pre className="text-sm whitespace-pre-wrap font-sans text-foreground">
              {generateExamText}
            </pre>
          </ScrollArea>
        </div>
      )}

      {showPreview && getTotalSelectedCount() === 0 && !hasVitalsEntered && (
        <div className="mb-4 p-4 bg-muted rounded-lg border">
          <p className="text-sm text-muted-foreground text-center">
            Select findings to see preview
          </p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-transparent p-0 mb-4">
          {SYSTEMS.map((system) => (
            <TabsTrigger
              key={system.id}
              value={system.id}
              className="flex-1 min-w-fit data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {system.label}
              {getSystemSelectedCount(system.id) > 0 && (
                <span className="ml-1 text-xs bg-primary-foreground/20 rounded-full px-1.5">
                  {getSystemSelectedCount(system.id)}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Vitals Tab */}
        <TabsContent value="vitals" className="mt-0">
          <div className="space-y-4">
            {patientDateOfBirth && (
              <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md inline-block">
                Vital ranges adjusted for: <span className="font-medium text-foreground">{ageGroupLabel}</span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="vital-bp">BP (mmHg)</Label>
                  {isVitalAbnormal("bp", vitalSigns?.bp || "", vitalRanges) && (
                    <span className="text-xs font-medium text-destructive">
                      {getAbnormalityDescription("bp", vitalSigns?.bp || "", vitalRanges)}
                    </span>
                  )}
                </div>
                <Input
                  id="vital-bp"
                  value={vitalSigns?.bp || ""}
                  onChange={(e) => onVitalSignsChange?.("bp", e.target.value)}
                  placeholder="e.g., 120/80"
                  className={cn(
                    isVitalAbnormal("bp", vitalSigns?.bp || "", vitalRanges) && "border-destructive bg-destructive/5 focus-visible:ring-destructive"
                  )}
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="vital-pulse">Pulse (bpm)</Label>
                  {isVitalAbnormal("pulse", vitalSigns?.pulse || "", vitalRanges) && (
                    <span className="text-xs font-medium text-destructive">
                      {getAbnormalityDescription("pulse", vitalSigns?.pulse || "", vitalRanges)}
                    </span>
                  )}
                </div>
                <Input
                  id="vital-pulse"
                  value={vitalSigns?.pulse || ""}
                  onChange={(e) => onVitalSignsChange?.("pulse", e.target.value)}
                  placeholder="e.g., 72"
                  className={cn(
                    isVitalAbnormal("pulse", vitalSigns?.pulse || "", vitalRanges) && "border-destructive bg-destructive/5 focus-visible:ring-destructive"
                  )}
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="vital-temp">Temperature (°C)</Label>
                  {isVitalAbnormal("temp", vitalSigns?.temp || "", vitalRanges) && (
                    <span className="text-xs font-medium text-destructive">
                      {getAbnormalityDescription("temp", vitalSigns?.temp || "", vitalRanges)}
                    </span>
                  )}
                </div>
                <Input
                  id="vital-temp"
                  value={vitalSigns?.temp || ""}
                  onChange={(e) => onVitalSignsChange?.("temp", e.target.value)}
                  placeholder="e.g., 37.0"
                  className={cn(
                    isVitalAbnormal("temp", vitalSigns?.temp || "", vitalRanges) && "border-destructive bg-destructive/5 focus-visible:ring-destructive"
                  )}
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="vital-rr">Respiratory Rate (breaths/min)</Label>
                  {isVitalAbnormal("respiratoryRate", vitalSigns?.respiratoryRate || "", vitalRanges) && (
                    <span className="text-xs font-medium text-destructive">
                      {getAbnormalityDescription("respiratoryRate", vitalSigns?.respiratoryRate || "", vitalRanges)}
                    </span>
                  )}
                </div>
                <Input
                  id="vital-rr"
                  value={vitalSigns?.respiratoryRate || ""}
                  onChange={(e) => onVitalSignsChange?.("respiratoryRate", e.target.value)}
                  placeholder="e.g., 16"
                  className={cn(
                    isVitalAbnormal("respiratoryRate", vitalSigns?.respiratoryRate || "", vitalRanges) && "border-destructive bg-destructive/5 focus-visible:ring-destructive"
                  )}
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="vital-spo2">SpO2 (%)</Label>
                  {isVitalAbnormal("spo2", vitalSigns?.spo2 || "", vitalRanges) && (
                    <span className="text-xs font-medium text-destructive">
                      {getAbnormalityDescription("spo2", vitalSigns?.spo2 || "", vitalRanges)}
                    </span>
                  )}
                </div>
                <Input
                  id="vital-spo2"
                  value={vitalSigns?.spo2 || ""}
                  onChange={(e) => onVitalSignsChange?.("spo2", e.target.value)}
                  placeholder="e.g., 98"
                  className={cn(
                    isVitalAbnormal("spo2", vitalSigns?.spo2 || "", vitalRanges) && "border-destructive bg-destructive/5 focus-visible:ring-destructive"
                  )}
                />
              </div>
              <div>
                <Label htmlFor="vital-weight">Weight (kg)</Label>
                <Input
                  id="vital-weight"
                  type="number"
                  value={vitalSigns?.weight || ""}
                  onChange={(e) => onVitalSignsChange?.("weight", e.target.value)}
                  placeholder="e.g., 70"
                />
              </div>
              <div>
                <Label htmlFor="vital-height">Height (cm)</Label>
                <Input
                  id="vital-height"
                  type="number"
                  value={vitalSigns?.height || ""}
                  onChange={(e) => onVitalSignsChange?.("height", e.target.value)}
                  placeholder="e.g., 175"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="vital-bmi">BMI (Auto-calculated)</Label>
                  {isVitalAbnormal("bmi", vitalSigns?.bmi || "", vitalRanges) && (
                    <span className="text-xs font-medium text-destructive">
                      {getAbnormalityDescription("bmi", vitalSigns?.bmi || "", vitalRanges)}
                    </span>
                  )}
                </div>
                <Input
                  id="vital-bmi"
                  value={vitalSigns?.bmi || ""}
                  readOnly
                  placeholder="Auto-calculated"
                  className={cn(
                    "bg-muted",
                    isVitalAbnormal("bmi", vitalSigns?.bmi || "", vitalRanges) && "border-destructive bg-destructive/5"
                  )}
                />
              </div>
              <div>
                <Label htmlFor="vital-appearance">General Appearance</Label>
                <Input
                  id="vital-appearance"
                  value={vitalSigns?.generalAppearance || ""}
                  onChange={(e) => onVitalSignsChange?.("generalAppearance", e.target.value)}
                  placeholder="e.g., Well-nourished"
                />
              </div>
            </div>
            
            {/* Growth Chart Percentiles for Pediatric Patients */}
            {growthPercentiles && (growthPercentiles.weight || growthPercentiles.height || growthPercentiles.bmi) && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Growth Chart Percentiles (WHO/CDC Standards)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {growthPercentiles.weight && growthPercentiles.weight.category !== "unknown" && (
                    <PercentileCard
                      label="Weight-for-age"
                      result={growthPercentiles.weight}
                    />
                  )}
                  {growthPercentiles.height && growthPercentiles.height.category !== "unknown" && (
                    <PercentileCard
                      label="Height-for-age"
                      result={growthPercentiles.height}
                    />
                  )}
                  {growthPercentiles.bmi && growthPercentiles.bmi.category !== "unknown" && (
                    <PercentileCard
                      label="BMI-for-age"
                      result={growthPercentiles.bmi}
                    />
                  )}
                </div>
                {(!growthPercentiles.weight || growthPercentiles.weight.category === "unknown") &&
                 (!growthPercentiles.height || growthPercentiles.height.category === "unknown") &&
                 (!growthPercentiles.bmi || growthPercentiles.bmi.category === "unknown") && (
                  <p className="text-xs text-muted-foreground">
                    Enter weight, height, or BMI to see growth percentiles.
                  </p>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Other System Tabs */}
        {SYSTEMS.filter(s => s.id !== "vitals").map((system) => (
          <TabsContent key={system.id} value={system.id} className="mt-0">
            <div className="space-y-6">
              {Object.entries(system.items).map(([category, findings]) => (
                <div key={category} className="space-y-2">
                  <h4 className="font-medium text-sm text-foreground border-b pb-1">
                    {category}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {findings.map((finding) => (
                      <div key={finding} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${system.id}-${category}-${finding}`}
                          checked={isFindingSelected(system.id, category, finding)}
                          onCheckedChange={(checked) =>
                            handleFindingToggle(system.id, category, finding, !!checked)
                          }
                        />
                        <Label
                          htmlFor={`${system.id}-${category}-${finding}`}
                          className="text-sm cursor-pointer"
                        >
                          {finding}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </PresetDialog>
  );
}
