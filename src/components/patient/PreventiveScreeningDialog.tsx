import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PresetDialogLayout } from "@/components/patient/preset/PresetDialogLayout";

interface ScreeningEntry {
  name: string;
  date: string;
  result: string;
  checked: boolean;
}

interface CustomScreening {
  name: string;
  date: string;
  result: string;
}

const COMMON_SCREENINGS = [
  "Mammogram",
  "Pap Smear/Cervical Screening",
  "HPV Test",
  "Colonoscopy",
  "Fecal Occult Blood Test (FOBT)",
  "PSA Test (Prostate)",
  "Bone Density Scan (DEXA)",
  "Blood Pressure Screening",
  "Cholesterol/Lipid Panel",
  "Blood Glucose/HbA1c",
  "Eye Examination",
  "Hearing Test",
  "Dental Checkup",
  "Skin Cancer Screening",
  "Thyroid Function Test",
  "ECG/EKG",
  "Echocardiogram",
  "Chest X-Ray",
  "CT Scan (specify)",
  "MRI (specify)",
  "Ultrasound (specify)",
  "Genetic Testing",
  "Lung Cancer Screening (Low-dose CT)",
  "AAA Screening (Abdominal Aortic Aneurysm)",
  "STI Screening",
  "HIV Test",
  "Hepatitis B/C Screening",
  "TB Screening",
];

interface PreventiveScreeningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (text: string) => void;
  currentValue?: string;
}

export function PreventiveScreeningDialog({
  open,
  onOpenChange,
  onInsert,
  currentValue = "",
}: PreventiveScreeningDialogProps) {
  const [screenings, setScreenings] = useState<ScreeningEntry[]>(
    COMMON_SCREENINGS.map((name) => ({
      name,
      date: "",
      result: "",
      checked: false,
    }))
  );
  const [customScreenings, setCustomScreenings] = useState<CustomScreening[]>([]);
  const [newCustomName, setNewCustomName] = useState("");

  const handleScreeningToggle = (index: number, checked: boolean) => {
    setScreenings((prev) =>
      prev.map((c, i) => (i === index ? { ...c, checked } : c))
    );
  };

  const handleDateChange = (index: number, date: string) => {
    setScreenings((prev) =>
      prev.map((c, i) => (i === index ? { ...c, date } : c))
    );
  };

  const handleResultChange = (index: number, result: string) => {
    setScreenings((prev) =>
      prev.map((c, i) => (i === index ? { ...c, result } : c))
    );
  };

  const handleCustomDateChange = (index: number, date: string) => {
    setCustomScreenings((prev) =>
      prev.map((c, i) => (i === index ? { ...c, date } : c))
    );
  };

  const handleCustomResultChange = (index: number, result: string) => {
    setCustomScreenings((prev) =>
      prev.map((c, i) => (i === index ? { ...c, result } : c))
    );
  };

  const handleAddCustom = () => {
    if (newCustomName.trim()) {
      setCustomScreenings((prev) => [
        ...prev,
        { name: newCustomName.trim(), date: "", result: "" },
      ]);
      setNewCustomName("");
    }
  };

  const handleRemoveCustom = (index: number) => {
    setCustomScreenings((prev) => prev.filter((_, i) => i !== index));
  };

  const formatEntry = (name: string, date: string, result: string): string => {
    const parts = [name];
    if (date) parts.push(date);
    if (result) parts.push(`Result: ${result}`);
    return parts.join(" - ");
  };

  const handleInsert = () => {
    const selectedScreenings = screenings
      .filter((c) => c.checked)
      .map((c) => formatEntry(c.name, c.date, c.result));

    const customEntries = customScreenings
      .filter((c) => c.name.trim())
      .map((c) => formatEntry(c.name, c.date, c.result));

    const allScreenings = [...selectedScreenings, ...customEntries];

    if (allScreenings.length === 0) {
      onOpenChange(false);
      return;
    }

    const newText = allScreenings.join("; ");
    const finalText = currentValue ? `${currentValue}; ${newText}` : newText;

    onInsert(finalText);
    handleReset();
    onOpenChange(false);
  };

  const handleReset = () => {
    setScreenings(
      COMMON_SCREENINGS.map((name) => ({
        name,
        date: "",
        result: "",
        checked: false,
      }))
    );
    setCustomScreenings([]);
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
        title="Insert Preventive Screening History"
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
          {/* Other Screenings - At Top */}
          <div className="space-y-2 border-b pb-4">
            <Label className="text-sm font-medium">Add Other Screening</Label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter other screening..."
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

            {customScreenings.map((screening, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 rounded-md bg-muted/30"
              >
                <span className="flex-1 text-sm">{screening.name}</span>
                <Input
                  placeholder="Date/Year"
                  value={screening.date}
                  onChange={(e) => handleCustomDateChange(index, e.target.value)}
                  className="w-24 h-8 text-sm"
                />
                <Input
                  placeholder="Result"
                  value={screening.result}
                  onChange={(e) => handleCustomResultChange(index, e.target.value)}
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

          {/* Common Screenings */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Common Preventive Screenings</Label>
            <div className="grid grid-cols-1 gap-2">
              {screenings.map((screening, index) => (
                <div
                  key={screening.name}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                >
                  <Checkbox
                    id={`screening-${index}`}
                    checked={screening.checked}
                    onCheckedChange={(checked) =>
                      handleScreeningToggle(index, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`screening-${index}`}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {screening.name}
                  </Label>
                  {screening.checked && (
                    <>
                      <Input
                        placeholder="Date/Year"
                        value={screening.date}
                        onChange={(e) => handleDateChange(index, e.target.value)}
                        className="w-24 h-8 text-sm"
                      />
                      <Input
                        placeholder="Result"
                        value={screening.result}
                        onChange={(e) => handleResultChange(index, e.target.value)}
                        className="w-24 h-8 text-sm"
                      />
                    </>
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
