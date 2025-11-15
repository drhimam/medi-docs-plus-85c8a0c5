import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ROSBuilderProps {
  open: boolean;
  onClose: () => void;
  currentROS: string;
  onUpdate: (newROS: string) => void;
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
  const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, string[]>>({});

  useEffect(() => {
    // Reset when dialog opens
    if (open) {
      setSelectedSymptoms({});
    }
  }, [open]);

  const handleSymptomToggle = (category: string, symptom: string) => {
    setSelectedSymptoms((prev) => {
      const categorySymptoms = prev[category] || [];
      const isSelected = categorySymptoms.includes(symptom);
      
      if (isSelected) {
        return {
          ...prev,
          [category]: categorySymptoms.filter((s) => s !== symptom),
        };
      } else {
        return {
          ...prev,
          [category]: [...categorySymptoms, symptom],
        };
      }
    });
  };

  const generateROSText = () => {
    const rosParts: string[] = [];

    Object.entries(rosCategories).forEach(([categoryKey, category]) => {
      const symptoms = selectedSymptoms[categoryKey] || [];
      if (symptoms.length > 0) {
        rosParts.push(`- ${category.title}: Patient reports ${symptoms.join(", ").toLowerCase()}.`);
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
                  {category.symptoms.map((symptom) => (
                    <div key={symptom} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${categoryKey}-${symptom}`}
                        checked={(selectedSymptoms[categoryKey] || []).includes(symptom)}
                        onCheckedChange={() => handleSymptomToggle(categoryKey, symptom)}
                      />
                      <Label
                        htmlFor={`${categoryKey}-${symptom}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {symptom}
                      </Label>
                    </div>
                  ))}
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