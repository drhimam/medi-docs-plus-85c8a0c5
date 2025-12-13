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

interface SurgeryEntry {
  name: string;
  year: string;
  checked: boolean;
}

interface CustomSurgery {
  name: string;
  year: string;
}

const COMMON_SURGERIES = [
  "Appendectomy",
  "Cholecystectomy",
  "Tonsillectomy",
  "Hernia Repair",
  "C-Section",
  "Hysterectomy",
  "Joint Replacement",
  "Fracture Fixation",
  "Cataract Surgery",
  "LASIK",
  "Thyroidectomy",
  "Mastectomy",
  "Prostatectomy",
  "Colectomy",
  "Gastrectomy",
  "Nephrectomy",
  "Splenectomy",
  "Coronary Bypass Surgery",
  "Angioplasty/Stent",
  "Pacemaker Insertion",
  "Valve Replacement",
  "Laminectomy/Discectomy",
  "Spinal Fusion",
  "Hemorrhoidectomy",
  "Vasectomy",
  "Tubal Ligation",
];

interface SurgicalHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (text: string) => void;
  currentValue?: string;
}

export function SurgicalHistoryDialog({
  open,
  onOpenChange,
  onInsert,
  currentValue = "",
}: SurgicalHistoryDialogProps) {
  const [surgeries, setSurgeries] = useState<SurgeryEntry[]>(
    COMMON_SURGERIES.map((name) => ({
      name,
      year: "",
      checked: false,
    }))
  );
  const [customSurgeries, setCustomSurgeries] = useState<CustomSurgery[]>([]);
  const [newCustomName, setNewCustomName] = useState("");

  const handleSurgeryToggle = (index: number, checked: boolean) => {
    setSurgeries((prev) =>
      prev.map((s, i) => (i === index ? { ...s, checked } : s))
    );
  };

  const handleYearChange = (index: number, year: string) => {
    setSurgeries((prev) =>
      prev.map((s, i) => (i === index ? { ...s, year } : s))
    );
  };

  const handleCustomYearChange = (index: number, year: string) => {
    setCustomSurgeries((prev) =>
      prev.map((s, i) => (i === index ? { ...s, year } : s))
    );
  };

  const handleAddCustom = () => {
    if (newCustomName.trim()) {
      setCustomSurgeries((prev) => [
        ...prev,
        { name: newCustomName.trim(), year: "" },
      ]);
      setNewCustomName("");
    }
  };

  const handleRemoveCustom = (index: number) => {
    setCustomSurgeries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleInsert = () => {
    const selectedSurgeries = surgeries
      .filter((s) => s.checked)
      .map((s) => (s.year ? `${s.name} (${s.year})` : s.name));

    const customEntries = customSurgeries
      .filter((s) => s.name.trim())
      .map((s) => (s.year ? `${s.name} (${s.year})` : s.name));

    const allSurgeries = [...selectedSurgeries, ...customEntries];

    if (allSurgeries.length === 0) {
      onOpenChange(false);
      return;
    }

    const newText = allSurgeries.join(", ");
    const finalText = currentValue
      ? `${currentValue}, ${newText}`
      : newText;

    onInsert(finalText);
    handleReset();
    onOpenChange(false);
  };

  const handleReset = () => {
    setSurgeries(
      COMMON_SURGERIES.map((name) => ({
        name,
        year: "",
        checked: false,
      }))
    );
    setCustomSurgeries([]);
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
          <DialogTitle>Insert Surgical History</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {/* Other Surgeries - At Top */}
            <div className="space-y-2 border-b pb-4">
              <Label className="text-sm font-medium">Add Other Surgery</Label>
              
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Enter other surgery..."
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

              {customSurgeries.map((surgery, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-md bg-muted/30"
                >
                  <span className="flex-1 text-sm">{surgery.name}</span>
                  <Input
                    placeholder="Year (e.g., 2020)"
                    value={surgery.year}
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

            {/* Common Surgeries */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Common Surgeries</Label>
              <div className="grid grid-cols-1 gap-2">
                {surgeries.map((surgery, index) => (
                  <div
                    key={surgery.name}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`surgery-${index}`}
                      checked={surgery.checked}
                      onCheckedChange={(checked) =>
                        handleSurgeryToggle(index, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`surgery-${index}`}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      {surgery.name}
                    </Label>
                    {surgery.checked && (
                      <Input
                        placeholder="Year (e.g., 2020)"
                        value={surgery.year}
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
