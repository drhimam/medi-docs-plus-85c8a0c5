import { useState } from "react";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConditionEntry {
  name: string;
  year: string;
  checked: boolean;
}

interface CustomCondition {
  name: string;
  year: string;
}

const COMMON_PAST_CONDITIONS = [
  "Heart Attack",
  "Stroke",
  "Gallbladder Stone",
  "Kidney Stone",
  "Jaundice",
  "Prolonged Fever/PUO",
  "Syphilis",
  "Gonorrhea",
  "HIV/AIDS",
  "Non-pulmonary TB",
  "Pneumonia",
  "Pulmonary Tuberculosis",
  "Malaria",
  "Dengue",
  "Typhoid",
  "Chickenpox",
  "Measles",
  "Mumps",
  "Hepatitis A",
  "Hepatitis B",
  "Hepatitis C",
  "COVID-19",
  "Deep Vein Thrombosis",
  "Pulmonary Embolism",
  "Cancer (specify type)",
  "Blood Transfusion",
  "Major Trauma",
  "Coronary Bypass Surgery",
  "Angioplasty/Stent",
  "Pacemaker Insertion",
];

interface PastConditionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (text: string) => void;
  currentValue?: string;
}

export function PastConditionsDialog({
  open,
  onOpenChange,
  onInsert,
  currentValue = "",
}: PastConditionsDialogProps) {
  const [conditions, setConditions] = useState<ConditionEntry[]>(
    COMMON_PAST_CONDITIONS.map((name) => ({
      name,
      year: "",
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

  const handleYearChange = (index: number, year: string) => {
    setConditions((prev) =>
      prev.map((c, i) => (i === index ? { ...c, year } : c))
    );
  };

  const handleCustomYearChange = (index: number, year: string) => {
    setCustomConditions((prev) =>
      prev.map((c, i) => (i === index ? { ...c, year } : c))
    );
  };

  const handleAddCustom = () => {
    if (newCustomName.trim()) {
      setCustomConditions((prev) => [
        ...prev,
        { name: newCustomName.trim(), year: "" },
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
      .map((c) => (c.year ? `${c.name} (${c.year})` : c.name));

    const customEntries = customConditions
      .filter((c) => c.name.trim())
      .map((c) => (c.year ? `${c.name} (${c.year})` : c.name));

    const allConditions = [...selectedConditions, ...customEntries];

    if (allConditions.length === 0) {
      onOpenChange(false);
      return;
    }

    const newText = allConditions.join(", ");
    const finalText = currentValue
      ? `${currentValue}, ${newText}`
      : newText;

    onInsert(finalText);
    handleReset();
    onOpenChange(false);
  };

  const handleReset = () => {
    setConditions(
      COMMON_PAST_CONDITIONS.map((name) => ({
        name,
        year: "",
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Insert Past Medical Conditions</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
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
                    placeholder="Year (e.g., 2020)"
                    value={condition.year}
                    onChange={(e) =>
                      handleCustomYearChange(index, e.target.value)
                    }
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

            {/* Common Past Conditions */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Common Past Conditions</Label>
              <div className="grid grid-cols-1 gap-2">
                {conditions.map((condition, index) => (
                  <div
                    key={condition.name}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`past-condition-${index}`}
                      checked={condition.checked}
                      onCheckedChange={(checked) =>
                        handleConditionToggle(index, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`past-condition-${index}`}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      {condition.name}
                    </Label>
                    {condition.checked && (
                      <Input
                        placeholder="Year (e.g., 2020)"
                        value={condition.year}
                        onChange={(e) =>
                          handleYearChange(index, e.target.value)
                        }
                        className="w-40 h-8 text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleInsert}>
            Insert Selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
