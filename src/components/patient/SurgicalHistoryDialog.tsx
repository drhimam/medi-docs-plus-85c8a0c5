import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PresetDialogLayout } from "@/components/patient/preset/PresetDialogLayout";
import { SelectedItemsAccordion } from "@/components/patient/preset/SelectedItemsAccordion";

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
      <PresetDialogLayout
        title="Insert Surgical History"
        contentClassName="max-w-2xl"
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
          {/* Selected + custom entries */}
          <SelectedItemsAccordion
            title="Selected / Other Surgeries"
            count={
              surgeries.filter((s) => s.checked).length +
              customSurgeries.filter((s) => s.name.trim()).length
            }
            defaultOpen
            maxHeightClassName="max-h-[28vh]"
          >
            {customSurgeries.map((surgery, index) => (
              <div
                key={`custom-${index}`}
                className="flex items-center gap-2 p-2 rounded-md bg-background"
              >
                <span className="flex-1 text-sm">{surgery.name}</span>
                <Input
                  placeholder="Year (e.g., 2020)"
                  value={surgery.year}
                  onChange={(e) => handleCustomYearChange(index, e.target.value)}
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

            {surgeries
              .filter((s) => s.checked)
              .map((surgery) => (
                <div
                  key={`selected-${surgery.name}`}
                  className="flex items-center gap-2 p-2 rounded-md bg-background"
                >
                  <span className="flex-1 text-sm">{surgery.name}</span>
                  <Input
                    placeholder="Year (e.g., 2020)"
                    value={surgery.year}
                    onChange={(e) =>
                      handleYearChange(
                        surgeries.findIndex((x) => x.name === surgery.name),
                        e.target.value
                      )
                    }
                    className="w-40 h-8 text-sm"
                  />
                </div>
              ))}
          </SelectedItemsAccordion>

          {/* Add Other Surgery */}
          <div className="space-y-2 border rounded-lg p-3">
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
          </div>

          {/* Common Surgeries */}
          <div className="space-y-2 border rounded-lg p-3">
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
                </div>
              ))}
            </div>
          </div>
        </div>
      </PresetDialogLayout>
    </Dialog>
  );
}
