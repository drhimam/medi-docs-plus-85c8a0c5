import { useState } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PresetDialog } from "@/components/patient/preset/PresetDialog";

interface HospitalizationEntry {
  name: string;
  year: string;
  duration: string;
  checked: boolean;
}

interface CustomHospitalization {
  name: string;
  year: string;
  duration: string;
}

const COMMON_HOSPITALIZATIONS = [
  "Chest Pain / Cardiac Evaluation",
  "Heart Attack (MI)",
  "Heart Failure",
  "Pneumonia",
  "Asthma Exacerbation",
  "COPD Exacerbation",
  "COVID-19",
  "Dengue Fever",
  "Typhoid Fever",
  "Malaria",
  "Acute Gastroenteritis",
  "Appendicitis",
  "Cholecystitis",
  "Pancreatitis",
  "Kidney Stone",
  "Urinary Tract Infection",
  "Pyelonephritis",
  "Diabetic Ketoacidosis",
  "Hypoglycemia",
  "Stroke",
  "Seizure/Epilepsy",
  "Meningitis/Encephalitis",
  "Fracture",
  "Road Traffic Accident",
  "Fall Injury",
  "Childbirth/Delivery",
  "Pregnancy Complications",
  "Blood Transfusion",
  "Sepsis/Severe Infection",
  "Tuberculosis Treatment",
  "Cancer Treatment",
  "Psychiatric Admission",
];

interface HospitalizationHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (text: string) => void;
  currentValue?: string;
}

export function HospitalizationHistoryDialog({
  open,
  onOpenChange,
  onInsert,
  currentValue = "",
}: HospitalizationHistoryDialogProps) {
  const [hospitalizations, setHospitalizations] = useState<HospitalizationEntry[]>(
    COMMON_HOSPITALIZATIONS.map((name) => ({
      name,
      year: "",
      duration: "",
      checked: false,
    }))
  );
  const [customHospitalizations, setCustomHospitalizations] = useState<CustomHospitalization[]>([]);
  const [newCustomName, setNewCustomName] = useState("");

  const handleToggle = (index: number, checked: boolean) => {
    setHospitalizations((prev) => prev.map((h, i) => (i === index ? { ...h, checked } : h)));
  };

  const handleYearChange = (index: number, year: string) => {
    setHospitalizations((prev) => prev.map((h, i) => (i === index ? { ...h, year } : h)));
  };

  const handleDurationChange = (index: number, duration: string) => {
    setHospitalizations((prev) => prev.map((h, i) => (i === index ? { ...h, duration } : h)));
  };

  const handleCustomYearChange = (index: number, year: string) => {
    setCustomHospitalizations((prev) => prev.map((h, i) => (i === index ? { ...h, year } : h)));
  };

  const handleCustomDurationChange = (index: number, duration: string) => {
    setCustomHospitalizations((prev) =>
      prev.map((h, i) => (i === index ? { ...h, duration } : h))
    );
  };

  const handleAddCustom = () => {
    if (newCustomName.trim()) {
      setCustomHospitalizations((prev) => [
        ...prev,
        { name: newCustomName.trim(), year: "", duration: "" },
      ]);
      setNewCustomName("");
    }
  };

  const handleRemoveCustom = (index: number) => {
    setCustomHospitalizations((prev) => prev.filter((_, i) => i !== index));
  };

  const formatEntry = (name: string, year: string, duration: string): string => {
    const details = [];
    if (year) details.push(year);
    if (duration) details.push(duration);
    return details.length > 0 ? `${name} (${details.join(", ")})` : name;
  };

  const handleInsert = () => {
    const selectedEntries = hospitalizations
      .filter((h) => h.checked)
      .map((h) => formatEntry(h.name, h.year, h.duration));

    const customEntries = customHospitalizations
      .filter((h) => h.name.trim())
      .map((h) => formatEntry(h.name, h.year, h.duration));

    const allEntries = [...selectedEntries, ...customEntries];

    if (allEntries.length === 0) {
      onOpenChange(false);
      return;
    }

    const newText = allEntries.join("; ");
    const finalText = currentValue ? `${currentValue}; ${newText}` : newText;

    onInsert(finalText);
    handleReset();
    onOpenChange(false);
  };

  const handleReset = () => {
    setHospitalizations(
      COMMON_HOSPITALIZATIONS.map((name) => ({
        name,
        year: "",
        duration: "",
        checked: false,
      }))
    );
    setCustomHospitalizations([]);
    setNewCustomName("");
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <PresetDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
        else onOpenChange(true);
      }}
      title="Insert Hospitalization History"
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
        {/* Custom Entry - At Top */}
        <div className="space-y-2 border-b pb-4">
          <Label className="text-sm font-medium">Add Other Hospitalization</Label>

          <div className="flex items-center gap-2">
            <Input
              placeholder="Enter reason for hospitalization..."
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

          {customHospitalizations.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
              <span className="flex-1 text-sm">{entry.name}</span>
              <Input
                placeholder="Year"
                value={entry.year}
                onChange={(e) => handleCustomYearChange(index, e.target.value)}
                className="w-24 h-8 text-sm"
              />
              <Input
                placeholder="Duration (e.g., 5 days)"
                value={entry.duration}
                onChange={(e) => handleCustomDurationChange(index, e.target.value)}
                className="w-32 h-8 text-sm"
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

        {/* Common Hospitalizations */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Common Reasons for Hospitalization</Label>
          <div className="grid grid-cols-1 gap-2">
            {hospitalizations.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                <Checkbox
                  id={`hospitalization-${index}`}
                  checked={entry.checked}
                  onCheckedChange={(checked) => handleToggle(index, checked as boolean)}
                />
                <Label htmlFor={`hospitalization-${index}`} className="flex-1 cursor-pointer text-sm">
                  {entry.name}
                </Label>
                {entry.checked && (
                  <>
                    <Input
                      placeholder="Year"
                      value={entry.year}
                      onChange={(e) => handleYearChange(index, e.target.value)}
                      className="w-24 h-8 text-sm"
                    />
                    <Input
                      placeholder="Duration"
                      value={entry.duration}
                      onChange={(e) => handleDurationChange(index, e.target.value)}
                      className="w-28 h-8 text-sm"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PresetDialog>
  );
}

