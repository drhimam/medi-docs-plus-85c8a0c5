import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PresetDialogLayout } from "@/components/patient/preset/PresetDialogLayout";

interface ConditionEntry {
  name: string;
  details: string;
  checked: boolean;
}

interface CustomCondition {
  name: string;
  details: string;
}

const MENTAL_HEALTH_CONDITIONS = [
  "Depression",
  "Anxiety Disorder",
  "Generalized Anxiety Disorder (GAD)",
  "Panic Disorder",
  "Social Anxiety Disorder",
  "Obsessive-Compulsive Disorder (OCD)",
  "Post-Traumatic Stress Disorder (PTSD)",
  "Bipolar Disorder",
  "Schizophrenia",
  "Attention Deficit Hyperactivity Disorder (ADHD)",
  "Eating Disorder (Anorexia)",
  "Eating Disorder (Bulimia)",
  "Substance Use Disorder",
  "Personality Disorder",
  "Autism Spectrum Disorder",
  "Insomnia",
  "Sleep Disorder",
  "Adjustment Disorder",
  "Phobia",
  "Seasonal Affective Disorder",
];

interface MentalHealthHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (text: string) => void;
  currentValue?: string;
}

export function MentalHealthHistoryDialog({
  open,
  onOpenChange,
  onInsert,
  currentValue = "",
}: MentalHealthHistoryDialogProps) {
  const [conditions, setConditions] = useState<ConditionEntry[]>(
    MENTAL_HEALTH_CONDITIONS.map((name) => ({
      name,
      details: "",
      checked: false,
    }))
  );
  const [customConditions, setCustomConditions] = useState<CustomCondition[]>([]);
  const [newCustomName, setNewCustomName] = useState("");

  const handleConditionToggle = (index: number, checked: boolean) => {
    setConditions((prev) =>
      prev.map((c, i) => (i === index ? { ...c, checked } : c))
    );
  };

  const handleDetailsChange = (index: number, details: string) => {
    setConditions((prev) =>
      prev.map((c, i) => (i === index ? { ...c, details } : c))
    );
  };

  const handleCustomDetailsChange = (index: number, details: string) => {
    setCustomConditions((prev) =>
      prev.map((c, i) => (i === index ? { ...c, details } : c))
    );
  };

  const handleAddCustom = () => {
    if (newCustomName.trim()) {
      setCustomConditions((prev) => [
        ...prev,
        { name: newCustomName.trim(), details: "" },
      ]);
      setNewCustomName("");
    }
  };

  const handleRemoveCustom = (index: number) => {
    setCustomConditions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleInsert = () => {
    const selectedConditions = conditions
      .filter((c) => c.checked)
      .map((c) => (c.details ? `${c.name} (${c.details})` : c.name));

    const customEntries = customConditions
      .filter((c) => c.name.trim())
      .map((c) => (c.details ? `${c.name} (${c.details})` : c.name));

    const allConditions = [...selectedConditions, ...customEntries];

    if (allConditions.length === 0) {
      onOpenChange(false);
      return;
    }

    const newText = allConditions.join(", ");
    const finalText = currentValue ? `${currentValue}, ${newText}` : newText;

    onInsert(finalText);
    handleReset();
    onOpenChange(false);
  };

  const handleReset = () => {
    setConditions(
      MENTAL_HEALTH_CONDITIONS.map((name) => ({
        name,
        details: "",
        checked: false,
      }))
    );
    setCustomConditions([]);
    setNewCustomName("");
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
      }}
    >
      <PresetDialogLayout
        title="Insert Mental Health History"
        footer={
          <>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleInsert}>
              Insert Selected
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Other Conditions - At Top */}
          <div className="space-y-2 border-b pb-4">
            <Label className="text-sm font-medium">Add Other Condition</Label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter other condition..."
                value={newCustomName}
                onChange={(e) => setNewCustomName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustom();
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddCustom}
                disabled={!newCustomName.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {customConditions.map((condition, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 rounded-md bg-muted/30"
              >
                <span className="flex-1 text-sm">{condition.name}</span>
                <Input
                  placeholder="Treatment/Duration"
                  value={condition.details}
                  onChange={(e) => handleCustomDetailsChange(index, e.target.value)}
                  className="w-40 h-8 text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRemoveCustom(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Common Conditions */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Common Mental Health Conditions</Label>
            <div className="grid grid-cols-1 gap-2">
              {conditions.map((condition, index) => (
                <div
                  key={condition.name}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                >
                  <Checkbox
                    id={`mh-condition-${index}`}
                    checked={condition.checked}
                    onCheckedChange={(checked) =>
                      handleConditionToggle(index, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`mh-condition-${index}`}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {condition.name}
                  </Label>
                  {condition.checked && (
                    <Input
                      placeholder="Treatment/Duration"
                      value={condition.details}
                      onChange={(e) => handleDetailsChange(index, e.target.value)}
                      className="w-40 h-8 text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </PresetDialogLayout>
    </Dialog>
  );
}
