import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

interface ROSBuilderProps {
  open: boolean;
  onClose: () => void;
  currentROS: string;
  onUpdate: (newROS: string) => void;
}

interface SymptomEntry {
  symptom: string;
  description: string;
}

const rosCategories = {
  constitutional: {
    title: "Constitutional Symptoms",
    symptoms: ["Fatigue", "Weight loss", "Weight gain", "Fever", "Chills", "Night sweats"],
  },
  eyes: {
    title: "Eyes",
    symptoms: ["Vision changes", "Eye pain", "Redness", "Discharge", "Dryness", "Itching"],
  },
  ent: {
    title: "Ears, Nose, Mouth, and Throat",
    symptoms: ["Hearing loss", "Ear pain", "Tinnitus", "Nasal congestion", "Rhinorrhea", "Sore throat", "Hoarseness"],
  },
  cardiovascular: {
    title: "Cardiovascular",
    symptoms: ["Chest pain", "Palpitations", "Syncope", "Dyspnea on exertion", "Orthopnea", "Edema"],
  },
  respiratory: {
    title: "Respiratory",
    symptoms: ["Cough", "Dyspnea", "Wheezing", "Hemoptysis", "Sputum production"],
  },
  gastrointestinal: {
    title: "Gastrointestinal",
    symptoms: ["Nausea", "Vomiting", "Diarrhea", "Constipation", "Abdominal pain", "Heartburn", "Bloating", "Blood in stool"],
  },
  genitourinary: {
    title: "Genitourinary",
    symptoms: ["Dysuria", "Frequency", "Urgency", "Hematuria", "Incontinence", "Discharge"],
  },
  musculoskeletal: {
    title: "Musculoskeletal",
    symptoms: ["Joint pain", "Muscle pain", "Stiffness", "Swelling", "Limited range of motion", "Back pain"],
  },
  skin: {
    title: "Integumentary (Skin and/or Breast)",
    symptoms: ["Rash", "Itching", "Lesions", "Changes in moles", "Breast lumps", "Nipple discharge"],
  },
  neurological: {
    title: "Neurological",
    symptoms: ["Headache", "Dizziness", "Seizures", "Numbness", "Tingling", "Weakness", "Tremor"],
  },
  psychiatric: {
    title: "Psychiatric",
    symptoms: ["Anxiety", "Depression", "Mood changes", "Sleep disturbances", "Memory problems"],
  },
  endocrine: {
    title: "Endocrine",
    symptoms: ["Heat/cold intolerance", "Excessive thirst", "Excessive urination", "Changes in appetite"],
  },
  hematologic: {
    title: "Hematologic/Lymphatic",
    symptoms: ["Easy bruising", "Bleeding", "Swollen lymph nodes", "Anemia symptoms"],
  },
  allergic: {
    title: "Allergic/Immunologic",
    symptoms: ["Seasonal allergies", "Food allergies", "Drug allergies", "Frequent infections"],
  },
};

export default function ROSBuilder({ open, onClose, currentROS, onUpdate }: ROSBuilderProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, SymptomEntry[]>>({});

  useEffect(() => {
    // Reset when dialog opens
    if (open) {
      setSelectedSymptoms({});
    }
  }, [open]);

  const isSymptomSelected = (category: string, symptom: string) => {
    return (selectedSymptoms[category] || []).some((entry) => entry.symptom === symptom);
  };

  const getSymptomDescription = (category: string, symptom: string) => {
    const entry = (selectedSymptoms[category] || []).find((e) => e.symptom === symptom);
    return entry?.description || "";
  };

  const handleSymptomToggle = (category: string, symptom: string) => {
    setSelectedSymptoms((prev) => {
      const categorySymptoms = prev[category] || [];
      const isSelected = categorySymptoms.some((entry) => entry.symptom === symptom);

      if (isSelected) {
        return {
          ...prev,
          [category]: categorySymptoms.filter((entry) => entry.symptom !== symptom),
        };
      } else {
        return {
          ...prev,
          [category]: [...categorySymptoms, { symptom, description: "" }],
        };
      }
    });
  };

  const handleDescriptionChange = (category: string, symptom: string, description: string) => {
    setSelectedSymptoms((prev) => {
      const categorySymptoms = prev[category] || [];
      return {
        ...prev,
        [category]: categorySymptoms.map((entry) =>
          entry.symptom === symptom ? { ...entry, description } : entry
        ),
      };
    });
  };

  const generateROSText = () => {
    const rosParts: string[] = [];

    Object.entries(rosCategories).forEach(([categoryKey, category]) => {
      const symptoms = selectedSymptoms[categoryKey] || [];
      if (symptoms.length > 0) {
        const symptomDescriptions = symptoms
          .map((entry) => {
            if (entry.description.trim()) {
              return `${entry.symptom.toLowerCase()} (${entry.description.trim()})`;
            }
            return entry.symptom.toLowerCase();
          })
          .join(", ");
        rosParts.push(`- ${category.title}: Patient reports ${symptomDescriptions}.`);
      } else {
        rosParts.push(`- ${category.title}: No symptoms reported.`);
      }
    });

    return rosParts.join("\n\n");
  };

  const handleSave = () => {
    const rosText = generateROSText();
    onUpdate(rosText);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Review of Systems (ROS) Builder</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {Object.entries(rosCategories).map(([categoryKey, category], index) => (
              <div key={categoryKey}>
                {index > 0 && <Separator className="my-4" />}
                <h4 className="font-semibold mb-3">{category.title}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {category.symptoms.map((symptom) => {
                    const isSelected = isSymptomSelected(categoryKey, symptom);
                    return (
                      <div key={symptom} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`${categoryKey}-${symptom}`}
                            checked={isSelected}
                            onCheckedChange={() => handleSymptomToggle(categoryKey, symptom)}
                          />
                          <Label
                            htmlFor={`${categoryKey}-${symptom}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {symptom}
                          </Label>
                        </div>
                        {isSelected && (
                          <Input
                            placeholder="Add description (e.g., duration, severity)"
                            value={getSymptomDescription(categoryKey, symptom)}
                            onChange={(e) =>
                              handleDescriptionChange(categoryKey, symptom, e.target.value)
                            }
                            className="ml-6 text-sm"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Apply to ROS</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}