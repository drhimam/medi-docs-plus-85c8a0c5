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

interface InjuryEntry {
  name: string;
  year: string;
  details: string;
  checked: boolean;
}

interface CustomInjury {
  name: string;
  year: string;
  details: string;
}

const COMMON_INJURIES = [
  "Head Injury/Concussion",
  "Bone Fracture (Upper Limb)",
  "Bone Fracture (Lower Limb)",
  "Spinal Injury",
  "Motor Vehicle Accident",
  "Sports Injury",
  "Fall from Height",
  "Burns",
  "Drowning/Near-Drowning",
  "Electric Shock",
  "Animal Bite/Attack",
  "Laceration Requiring Stitches",
  "Dislocation",
  "Ligament Tear (ACL, MCL, etc.)",
  "Tendon Injury",
  "Internal Organ Injury",
  "Eye Injury",
  "Dental Trauma",
  "Workplace Injury",
  "Assault/Violence",
];

interface AccidentsInjuriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (text: string) => void;
  currentValue?: string;
}

export function AccidentsInjuriesDialog({
  open,
  onOpenChange,
  onInsert,
  currentValue = "",
}: AccidentsInjuriesDialogProps) {
  const [injuries, setInjuries] = useState<InjuryEntry[]>(
    COMMON_INJURIES.map((name) => ({
      name,
      year: "",
      details: "",
      checked: false,
    }))
  );
  const [customInjuries, setCustomInjuries] = useState<CustomInjury[]>([]);
  const [newCustomName, setNewCustomName] = useState("");

  const handleInjuryToggle = (index: number, checked: boolean) => {
    setInjuries((prev) =>
      prev.map((c, i) => (i === index ? { ...c, checked } : c))
    );
  };

  const handleYearChange = (index: number, year: string) => {
    setInjuries((prev) =>
      prev.map((c, i) => (i === index ? { ...c, year } : c))
    );
  };

  const handleDetailsChange = (index: number, details: string) => {
    setInjuries((prev) =>
      prev.map((c, i) => (i === index ? { ...c, details } : c))
    );
  };

  const handleCustomYearChange = (index: number, year: string) => {
    setCustomInjuries((prev) =>
      prev.map((c, i) => (i === index ? { ...c, year } : c))
    );
  };

  const handleCustomDetailsChange = (index: number, details: string) => {
    setCustomInjuries((prev) =>
      prev.map((c, i) => (i === index ? { ...c, details } : c))
    );
  };

  const handleAddCustom = () => {
    if (newCustomName.trim()) {
      setCustomInjuries((prev) => [
        ...prev,
        { name: newCustomName.trim(), year: "", details: "" },
      ]);
      setNewCustomName("");
    }
  };

  const handleRemoveCustom = (index: number) => {
    setCustomInjuries((prev) => prev.filter((_, i) => i !== index));
  };

  const formatEntry = (name: string, year: string, details: string): string => {
    const parts = [name];
    if (year) parts.push(year);
    if (details) parts.push(details);
    return parts.join(" - ");
  };

  const handleInsert = () => {
    const selectedInjuries = injuries
      .filter((c) => c.checked)
      .map((c) => formatEntry(c.name, c.year, c.details));

    const customEntries = customInjuries
      .filter((c) => c.name.trim())
      .map((c) => formatEntry(c.name, c.year, c.details));

    const allInjuries = [...selectedInjuries, ...customEntries];

    if (allInjuries.length === 0) {
      onOpenChange(false);
      return;
    }

    const newText = allInjuries.join("; ");
    const finalText = currentValue ? `${currentValue}; ${newText}` : newText;

    onInsert(finalText);
    handleReset();
    onOpenChange(false);
  };

  const handleReset = () => {
    setInjuries(
      COMMON_INJURIES.map((name) => ({
        name,
        year: "",
        details: "",
        checked: false,
      }))
    );
    setCustomInjuries([]);
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
          <DialogTitle>Insert Accidents or Injuries</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {/* Other Injuries - At Top */}
            <div className="space-y-2 border-b pb-4">
              <Label className="text-sm font-medium">Add Other Injury</Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Enter other injury..."
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

              {customInjuries.map((injury, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-md bg-muted/30"
                >
                  <span className="flex-1 text-sm">{injury.name}</span>
                  <Input
                    placeholder="Year"
                    value={injury.year}
                    onChange={(e) => handleCustomYearChange(index, e.target.value)}
                    className="w-20 h-8 text-sm"
                  />
                  <Input
                    placeholder="Details"
                    value={injury.details}
                    onChange={(e) => handleCustomDetailsChange(index, e.target.value)}
                    className="w-28 h-8 text-sm"
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

            {/* Common Injuries */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Common Accidents/Injuries</Label>
              <div className="grid grid-cols-1 gap-2">
                {injuries.map((injury, index) => (
                  <div
                    key={injury.name}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`injury-${index}`}
                      checked={injury.checked}
                      onCheckedChange={(checked) =>
                        handleInjuryToggle(index, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`injury-${index}`}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      {injury.name}
                    </Label>
                    {injury.checked && (
                      <>
                        <Input
                          placeholder="Year"
                          value={injury.year}
                          onChange={(e) => handleYearChange(index, e.target.value)}
                          className="w-20 h-8 text-sm"
                        />
                        <Input
                          placeholder="Details"
                          value={injury.details}
                          onChange={(e) => handleDetailsChange(index, e.target.value)}
                          className="w-28 h-8 text-sm"
                        />
                      </>
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
