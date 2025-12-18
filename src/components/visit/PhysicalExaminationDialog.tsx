import * as React from "react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PresetDialog } from "@/components/patient/preset/PresetDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCheck, Eye, EyeOff, Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PhysicalExaminationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (text: string) => void;
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

const SYSTEMS = [
  { id: "respiratory", label: "Respiratory", items: RESPIRATORY_ITEMS },
  { id: "cardiovascular", label: "Cardiovascular", items: CARDIOVASCULAR_ITEMS },
  { id: "gastrointestinal", label: "GI", items: GASTROINTESTINAL_ITEMS },
  { id: "nervous", label: "Neuro", items: NERVOUS_ITEMS },
  { id: "musculoskeletal", label: "MSK", items: MUSCULOSKELETAL_ITEMS },
  { id: "skin", label: "Skin", items: SKIN_ITEMS },
  { id: "endocrine", label: "Endocrine", items: ENDOCRINE_ITEMS },
  { id: "pediatrics_neonate", label: "Neonate", items: PEDIATRICS_NEONATE_ITEMS },
  { id: "pediatrics_ent", label: "Peds ENT", items: PEDIATRICS_ENT_ITEMS },
  { id: "pediatrics_chest", label: "Peds Chest", items: PEDIATRICS_CHEST_ITEMS },
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
};

export default function PhysicalExaminationDialog({
  open,
  onOpenChange,
  onInsert,
}: PhysicalExaminationDialogProps) {
  const [selectedFindings, setSelectedFindings] = useState<SystemFindings>({});
  const [activeTab, setActiveTab] = useState("respiratory");
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

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
    const normalFindings: SystemFindings = {};
    
    Object.entries(NORMAL_FINDINGS).forEach(([systemId, categories]) => {
      const findings: Finding[] = [];
      Object.entries(categories).forEach(([category, items]) => {
        items.forEach((finding) => {
          findings.push({ name: `${category}:${finding}`, value: finding });
        });
      });
      normalFindings[systemId] = findings;
    });
    
    setSelectedFindings(normalFindings);
  };

  const generateExamText = useMemo(() => {
    const lines: string[] = [];
    
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
  }, [selectedFindings]);

  const handleInsert = () => {
    if (generateExamText) {
      onInsert(generateExamText);
    }
    onOpenChange(false);
    resetState();
  };

  const resetState = () => {
    setSelectedFindings({});
    setActiveTab("respiratory");
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
            {getTotalSelectedCount()} finding(s) selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleInsert} disabled={getTotalSelectedCount() === 0}>
              Insert Findings
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex items-center gap-2 mb-4">
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
        {getTotalSelectedCount() > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedFindings({})}
            className="text-destructive hover:text-destructive"
          >
            Clear All
          </Button>
        )}
      </div>

      {showPreview && getTotalSelectedCount() > 0 && (
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

      {showPreview && getTotalSelectedCount() === 0 && (
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

        {SYSTEMS.map((system) => (
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
