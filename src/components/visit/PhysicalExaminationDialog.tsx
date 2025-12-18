import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PresetDialog } from "@/components/patient/preset/PresetDialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PhysicalExaminationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (text: string) => void;
}

type Finding = {
  name: string;
  value: string; // "normal" | "abnormal" | specific finding
};

type SystemFindings = {
  [key: string]: Finding[];
};

const FINDING_OPTIONS = ["Normal", "Abnormal", "Not Examined"];

const RESPIRATORY_ITEMS = {
  "General Appearance": ["Dyspnoea", "Cyanosis", "Stridor", "Hoarseness"],
  "Hands": ["Clubbing", "Staining", "Wasting", "Tremor (Asterixis)"],
  "Face": ["Central Cyanosis", "Nasal Polyps", "Engorged Turbinates", "Deviated Septum"],
  "Trachea": ["Central", "Deviated Left", "Deviated Right", "Tracheal Tug"],
  "Chest Inspection": ["Normal Shape", "Barrel Chest", "Pigeon Chest", "Funnel Chest", "Kyphosis", "Scoliosis"],
  "Palpation": ["Expansion Symmetrical", "Expansion Reduced", "Vocal Fremitus Normal", "Vocal Fremitus Increased", "Vocal Fremitus Decreased"],
  "Percussion": ["Resonant", "Dull", "Hyper-resonant", "Stony Dull"],
  "Auscultation": ["Vesicular Breath Sounds", "Bronchial Breath Sounds", "Diminished Breath Sounds", "Wheeze", "Crackles", "Rhonchi", "Pleural Rub"],
};

const CARDIOVASCULAR_ITEMS = {
  "General Appearance": ["Comfortable", "Dyspnoeic", "Cachectic", "Marfan's Syndrome", "Down's Syndrome"],
  "Hands": ["Clubbing", "Splinter Haemorrhages", "Osler's Nodes", "Janeway Lesions", "Palmar Xanthomata"],
  "Pulse": ["Regular", "Irregular", "Bradycardia", "Tachycardia", "Bounding", "Weak", "Collapsing"],
  "Blood Pressure": ["Normal", "Hypertension", "Hypotension", "Wide Pulse Pressure", "Narrow Pulse Pressure"],
  "Face": ["Jaundice", "Xanthelasma", "Mitral Facies", "Central Cyanosis"],
  "Neck (JVP)": ["Normal", "Elevated", "Not Visible"],
  "Praecordium Inspection": ["Normal", "Visible Pulsation", "Scars Present", "Pacemaker Visible"],
  "Praecordium Palpation": ["Apex Beat Normal", "Apex Beat Displaced", "Heaves", "Thrills"],
  "Heart Sounds": ["S1 S2 Normal", "S3 Present", "S4 Present", "Murmur Present", "Split S2"],
  "Lower Limbs": ["No Oedema", "Pitting Oedema", "Non-Pitting Oedema", "Peripheral Pulses Normal", "Peripheral Pulses Reduced"],
};

const GASTROINTESTINAL_ITEMS = {
  "General Appearance": ["Well Nourished", "Jaundiced", "Wasted", "Dehydrated", "Encephalopathic"],
  "Hands": ["Leuconychia", "Clubbing", "Palmar Erythema", "Dupuytren's Contracture", "Hepatic Flap"],
  "Arms": ["Bruising", "Petechiae", "Spider Naevi", "Muscle Wasting", "Scratch Marks"],
  "Face": ["Jaundice", "Anaemia", "Kayser-Fleischer Rings", "Xanthelasma"],
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
  "General": ["Alert and Oriented", "Drowsy", "Confused", "Unresponsive", "Neck Stiffness", "Kernig's Sign Positive"],
  "Cranial Nerve I": ["Smell Normal", "Anosmia"],
  "Cranial Nerve II": ["Visual Acuity Normal", "Visual Acuity Reduced", "Visual Fields Normal", "Visual Field Defect", "Fundoscopy Normal", "Papilloedema"],
  "Cranial Nerves III, IV, VI": ["Eye Movements Normal", "Nystagmus", "Diplopia", "Ptosis", "Pupil Size Equal", "Pupil Reaction Normal"],
  "Cranial Nerve V": ["Sensation Normal", "Sensation Reduced", "Corneal Reflex Normal", "Corneal Reflex Absent", "Jaw Power Normal"],
  "Cranial Nerve VII": ["Facial Symmetry Normal", "Upper Motor Neuron Pattern", "Lower Motor Neuron Pattern"],
  "Cranial Nerve VIII": ["Hearing Normal", "Hearing Reduced", "Weber's Test Normal", "Rinne's Test Normal"],
  "Cranial Nerves IX, X": ["Gag Reflex Normal", "Palate Moves Symmetrically", "Uvula Central"],
  "Cranial Nerve XI": ["Trapezius Normal", "Sternomastoid Normal"],
  "Cranial Nerve XII": ["Tongue Central", "Tongue Deviated", "Fasciculations Present"],
  "Upper Limbs - Tone": ["Normal", "Increased (Spasticity)", "Increased (Rigidity)", "Decreased (Flaccid)"],
  "Upper Limbs - Power": ["5/5 Normal", "4/5 Reduced", "3/5 Against Gravity", "2/5 Not Against Gravity", "1/5 Flicker", "0/5 None"],
  "Upper Limbs - Reflexes": ["Normal", "Hyperreflexia", "Hyporeflexia", "Areflexia"],
  "Upper Limbs - Coordination": ["Normal", "Dysdiadochokinesia", "Intention Tremor", "Past Pointing"],
  "Upper Limbs - Sensation": ["Normal", "Reduced Light Touch", "Reduced Pinprick", "Reduced Proprioception", "Reduced Vibration"],
  "Lower Limbs - Tone": ["Normal", "Increased (Spasticity)", "Increased (Rigidity)", "Decreased (Flaccid)"],
  "Lower Limbs - Power": ["5/5 Normal", "4/5 Reduced", "3/5 Against Gravity", "2/5 Not Against Gravity", "1/5 Flicker", "0/5 None"],
  "Lower Limbs - Reflexes": ["Normal", "Hyperreflexia", "Hyporeflexia", "Areflexia", "Babinski Positive", "Babinski Negative"],
  "Lower Limbs - Coordination": ["Normal", "Heel-Shin Test Abnormal"],
  "Lower Limbs - Sensation": ["Normal", "Reduced Light Touch", "Reduced Pinprick", "Reduced Proprioception", "Reduced Vibration"],
  "Gait": ["Normal", "Ataxic", "Spastic", "Parkinsonian", "Foot Drop", "Antalgic"],
};

const MUSCULOSKELETAL_ITEMS = {
  "Cervical Spine": ["Full Range of Motion", "Limited Flexion", "Limited Extension", "Limited Rotation", "Tenderness", "Muscle Spasm"],
  "Shoulder": ["Full Range of Motion", "Limited Abduction", "Limited External Rotation", "Limited Internal Rotation", "Painful Arc", "Tenderness"],
  "Elbow": ["Full Range of Motion", "Limited Flexion", "Limited Extension", "Tenderness", "Swelling"],
  "Wrist/Hand": ["Full Range of Motion", "Limited Motion", "Swelling", "Deformity", "Tenderness", "Grip Strength Normal", "Grip Strength Reduced"],
  "Thoracic Spine": ["Normal Curvature", "Kyphosis", "Scoliosis", "Tenderness", "Limited Motion"],
  "Lumbar Spine": ["Normal Lordosis", "Reduced Lordosis", "Increased Lordosis", "Tenderness", "Paravertebral Spasm", "Limited Flexion", "Limited Extension", "Straight Leg Raise Positive"],
  "Hip": ["Full Range of Motion", "Limited Flexion", "Limited Internal Rotation", "Limited External Rotation", "Trendelenburg Positive", "Pain on Movement"],
  "Knee": ["Full Range of Motion", "Limited Flexion", "Limited Extension", "Effusion Present", "Crepitus", "Ligament Laxity", "McMurray's Positive", "Tenderness Joint Line"],
  "Ankle/Foot": ["Full Range of Motion", "Limited Dorsiflexion", "Limited Plantarflexion", "Swelling", "Tenderness", "Deformity"],
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
  "Thyroid": ["Not Palpable", "Diffusely Enlarged", "Nodular", "Tender", "Bruit Present"],
  "Hands": ["Normal Size", "Enlarged", "Sweaty", "Tremor Present", "Palmar Erythema"],
  "Face": ["Normal", "Moon Face", "Hirsutism", "Acne", "Coarse Features"],
  "Skin": ["Normal", "Hyperpigmentation", "Vitiligo", "Striae", "Acanthosis Nigricans"],
  "Eyes": ["Normal", "Exophthalmos", "Lid Lag", "Lid Retraction"],
};

const SYSTEMS = [
  { id: "respiratory", label: "Respiratory", items: RESPIRATORY_ITEMS },
  { id: "cardiovascular", label: "Cardiovascular", items: CARDIOVASCULAR_ITEMS },
  { id: "gastrointestinal", label: "GI", items: GASTROINTESTINAL_ITEMS },
  { id: "nervous", label: "Neuro", items: NERVOUS_ITEMS },
  { id: "musculoskeletal", label: "MSK", items: MUSCULOSKELETAL_ITEMS },
  { id: "skin", label: "Skin", items: SKIN_ITEMS },
  { id: "endocrine", label: "Endocrine", items: ENDOCRINE_ITEMS },
];

export default function PhysicalExaminationDialog({
  open,
  onOpenChange,
  onInsert,
}: PhysicalExaminationDialogProps) {
  const [selectedFindings, setSelectedFindings] = useState<SystemFindings>({});
  const [activeTab, setActiveTab] = useState("respiratory");

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

  const generateExamText = () => {
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
  };

  const handleInsert = () => {
    const text = generateExamText();
    if (text) {
      onInsert(text);
    }
    onOpenChange(false);
    resetState();
  };

  const resetState = () => {
    setSelectedFindings({});
    setActiveTab("respiratory");
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
      title="Physical Examination"
      description="Select findings from each body system"
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
