import { useState } from "react";
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
import { Plus, Search } from "lucide-react";

interface DrugAllergyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (text: string) => void;
  currentValue?: string;
}

interface DrugAllergy {
  name: string;
  reaction: string;
  selected: boolean;
}

const COMMON_DRUG_ALLERGIES = [
  // Antibiotics
  "Penicillin",
  "Amoxicillin",
  "Ampicillin",
  "Cephalosporins",
  "Sulfonamides (Sulfa drugs)",
  "Erythromycin",
  "Ciprofloxacin",
  "Tetracycline",
  // Pain medications
  "Aspirin",
  "Ibuprofen",
  "Naproxen",
  "Codeine",
  "Morphine",
  "Tramadol",
  // Anesthetics
  "Lidocaine",
  "Novocaine",
  "General Anesthesia",
  // Cardiovascular
  "ACE Inhibitors",
  "Beta Blockers",
  "Statins",
  // Contrast agents
  "Iodine (Contrast dye)",
  "Gadolinium",
  // Others
  "Latex",
  "Insulin",
  "Heparin",
  "Warfarin",
  "Metformin",
];

const REACTION_OPTIONS = [
  "Rash",
  "Hives",
  "Swelling",
  "Difficulty breathing",
  "Anaphylaxis",
  "Nausea/Vomiting",
  "Itching",
];

export function DrugAllergyDialog({
  open,
  onOpenChange,
  onInsert,
  currentValue,
}: DrugAllergyDialogProps) {
  const [allergies, setAllergies] = useState<DrugAllergy[]>(
    COMMON_DRUG_ALLERGIES.map((name) => ({ name, reaction: "", selected: false }))
  );
  const [customDrug, setCustomDrug] = useState("");
  const [customReaction, setCustomReaction] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleAllergyToggle = (index: number) => {
    const updated = [...allergies];
    updated[index].selected = !updated[index].selected;
    setAllergies(updated);
  };

  const handleReactionChange = (index: number, reaction: string) => {
    const updated = [...allergies];
    updated[index].reaction = reaction;
    setAllergies(updated);
  };

  const addCustomDrug = () => {
    if (customDrug.trim()) {
      setAllergies([
        ...allergies,
        { name: customDrug.trim(), reaction: customReaction, selected: true },
      ]);
      setCustomDrug("");
      setCustomReaction("");
    }
  };

  const handleInsert = () => {
    const selectedAllergies = allergies
      .filter((a) => a.selected)
      .map((a) => (a.reaction ? `${a.name} (${a.reaction})` : a.name));

    const newText = selectedAllergies.join(", ");
    const finalText = currentValue
      ? `${currentValue}, ${newText}`
      : newText;

    onInsert(finalText);
    onOpenChange(false);

    // Reset state
    setAllergies(
      COMMON_DRUG_ALLERGIES.map((name) => ({ name, reaction: "", selected: false }))
    );
    setSearchQuery("");
  };

  const filteredAllergies = allergies.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCount = allergies.filter((a) => a.selected).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Drug Allergies</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search drugs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-3">
            {filteredAllergies.map((allergy, index) => {
              const originalIndex = allergies.findIndex(
                (a) => a.name === allergy.name
              );
              return (
                <div
                  key={allergy.name}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                >
                  <Checkbox
                    id={`drug-${originalIndex}`}
                    checked={allergy.selected}
                    onCheckedChange={() => handleAllergyToggle(originalIndex)}
                  />
                  <Label
                    htmlFor={`drug-${originalIndex}`}
                    className="flex-1 cursor-pointer"
                  >
                    {allergy.name}
                  </Label>
                  {allergy.selected && (
                    <Input
                      type="text"
                      placeholder="Reaction"
                      value={allergy.reaction}
                      onChange={(e) =>
                        handleReactionChange(originalIndex, e.target.value)
                      }
                      className="w-36"
                      list="reactions"
                    />
                  )}
                </div>
              );
            })}
          </div>
          <datalist id="reactions">
            {REACTION_OPTIONS.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </ScrollArea>

        <div className="border-t pt-4 mt-2">
          <Label className="text-sm font-medium mb-2 block">Add Custom Drug Allergy</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Drug name"
              value={customDrug}
              onChange={(e) => setCustomDrug(e.target.value)}
              className="flex-1"
            />
            <Input
              type="text"
              placeholder="Reaction"
              value={customReaction}
              onChange={(e) => setCustomReaction(e.target.value)}
              className="w-36"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={addCustomDrug}
              disabled={!customDrug.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={selectedCount === 0}>
            Insert ({selectedCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
