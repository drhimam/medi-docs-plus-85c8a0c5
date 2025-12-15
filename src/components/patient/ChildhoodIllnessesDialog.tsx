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

interface IllnessEntry {
  name: string;
  age: string;
  checked: boolean;
}

interface CustomIllness {
  name: string;
  age: string;
}

const COMMON_CHILDHOOD_ILLNESSES = [
  "Chickenpox (Varicella)",
  "Measles",
  "Mumps",
  "Rubella (German Measles)",
  "Whooping Cough (Pertussis)",
  "Scarlet Fever",
  "Hand, Foot, and Mouth Disease",
  "Fifth Disease (Erythema Infectiosum)",
  "Roseola",
  "Impetigo",
  "Croup",
  "Bronchiolitis",
  "Pneumonia",
  "Recurrent Ear Infections (Otitis Media)",
  "Strep Throat",
  "Tonsillitis",
  "Appendicitis",
  "Kawasaki Disease",
  "Rheumatic Fever",
  "Meningitis",
  "Encephalitis",
  "Febrile Seizures",
  "Asthma",
  "Eczema",
  "Food Allergies",
  "Anemia",
  "Jaundice (Neonatal)",
];

interface ChildhoodIllnessesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (text: string) => void;
  currentValue?: string;
}

export function ChildhoodIllnessesDialog({
  open,
  onOpenChange,
  onInsert,
  currentValue = "",
}: ChildhoodIllnessesDialogProps) {
  const [illnesses, setIllnesses] = useState<IllnessEntry[]>(
    COMMON_CHILDHOOD_ILLNESSES.map((name) => ({
      name,
      age: "",
      checked: false,
    }))
  );
  const [customIllnesses, setCustomIllnesses] = useState<CustomIllness[]>([]);
  const [newCustomName, setNewCustomName] = useState("");

  const handleIllnessToggle = (index: number, checked: boolean) => {
    setIllnesses((prev) =>
      prev.map((c, i) => (i === index ? { ...c, checked } : c))
    );
  };

  const handleAgeChange = (index: number, age: string) => {
    setIllnesses((prev) =>
      prev.map((c, i) => (i === index ? { ...c, age } : c))
    );
  };

  const handleCustomAgeChange = (index: number, age: string) => {
    setCustomIllnesses((prev) =>
      prev.map((c, i) => (i === index ? { ...c, age } : c))
    );
  };

  const handleAddCustom = () => {
    if (newCustomName.trim()) {
      setCustomIllnesses((prev) => [
        ...prev,
        { name: newCustomName.trim(), age: "" },
      ]);
      setNewCustomName("");
    }
  };

  const handleRemoveCustom = (index: number) => {
    setCustomIllnesses((prev) => prev.filter((_, i) => i !== index));
  };

  const handleInsert = () => {
    const selectedIllnesses = illnesses
      .filter((c) => c.checked)
      .map((c) => (c.age ? `${c.name} (age ${c.age})` : c.name));

    const customEntries = customIllnesses
      .filter((c) => c.name.trim())
      .map((c) => (c.age ? `${c.name} (age ${c.age})` : c.name));

    const allIllnesses = [...selectedIllnesses, ...customEntries];

    if (allIllnesses.length === 0) {
      onOpenChange(false);
      return;
    }

    const newText = allIllnesses.join(", ");
    const finalText = currentValue ? `${currentValue}, ${newText}` : newText;

    onInsert(finalText);
    handleReset();
    onOpenChange(false);
  };

  const handleReset = () => {
    setIllnesses(
      COMMON_CHILDHOOD_ILLNESSES.map((name) => ({
        name,
        age: "",
        checked: false,
      }))
    );
    setCustomIllnesses([]);
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
          <DialogTitle>Insert Childhood Illnesses</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {/* Other Illnesses - At Top */}
            <div className="space-y-2 border-b pb-4">
              <Label className="text-sm font-medium">Add Other Illness</Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Enter other illness..."
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

              {customIllnesses.map((illness, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-md bg-muted/30"
                >
                  <span className="flex-1 text-sm">{illness.name}</span>
                  <Input
                    placeholder="Age"
                    value={illness.age}
                    onChange={(e) => handleCustomAgeChange(index, e.target.value)}
                    className="w-24 h-8 text-sm"
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

            {/* Common Childhood Illnesses */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Common Childhood Illnesses</Label>
              <div className="grid grid-cols-1 gap-2">
                {illnesses.map((illness, index) => (
                  <div
                    key={illness.name}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`illness-${index}`}
                      checked={illness.checked}
                      onCheckedChange={(checked) =>
                        handleIllnessToggle(index, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`illness-${index}`}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      {illness.name}
                    </Label>
                    {illness.checked && (
                      <Input
                        placeholder="Age (e.g., 5 years)"
                        value={illness.age}
                        onChange={(e) => handleAgeChange(index, e.target.value)}
                        className="w-32 h-8 text-sm"
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
