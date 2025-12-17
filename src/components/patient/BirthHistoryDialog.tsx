import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PresetDialogLayout } from "@/components/patient/preset/PresetDialogLayout";

interface BirthHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (text: string) => void;
  currentValue?: string;
}

const DELIVERY_TYPES = [
  "Normal Vaginal Delivery",
  "Cesarean Section (C-Section)",
  "Assisted Vaginal Delivery (Forceps)",
  "Assisted Vaginal Delivery (Vacuum)",
  "Water Birth",
];

const BIRTH_COMPLICATIONS = [
  "Premature Birth",
  "Low Birth Weight",
  "Birth Asphyxia",
  "Neonatal Jaundice",
  "Meconium Aspiration",
  "Cord Around Neck",
  "NICU Admission",
  "Respiratory Distress",
  "Birth Injury",
  "Congenital Anomaly",
  "Sepsis",
  "Feeding Difficulties",
];

const MATERNAL_COMPLICATIONS = [
  "Pre-eclampsia",
  "Gestational Diabetes",
  "Prolonged Labor",
  "Placenta Previa",
  "Placental Abruption",
  "PROM (Premature Rupture of Membranes)",
  "Oligohydramnios",
  "Polyhydramnios",
];

export function BirthHistoryDialog({
  open,
  onOpenChange,
  onInsert,
  currentValue = "",
}: BirthHistoryDialogProps) {
  const [deliveryType, setDeliveryType] = useState("");
  const [birthWeight, setBirthWeight] = useState("");
  const [gestationalAge, setGestationalAge] = useState("");
  const [birthComplications, setBirthComplications] = useState<string[]>([]);
  const [maternalComplications, setMaternalComplications] = useState<string[]>([]);
  const [customComplications, setCustomComplications] = useState<string[]>([]);
  const [newCustom, setNewCustom] = useState("");

  const handleAddCustom = () => {
    if (newCustom.trim()) {
      setCustomComplications((prev) => [...prev, newCustom.trim()]);
      setNewCustom("");
    }
  };

  const handleRemoveCustom = (index: number) => {
    setCustomComplications((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleBirthComplication = (complication: string) => {
    setBirthComplications((prev) =>
      prev.includes(complication)
        ? prev.filter((c) => c !== complication)
        : [...prev, complication]
    );
  };

  const toggleMaternalComplication = (complication: string) => {
    setMaternalComplications((prev) =>
      prev.includes(complication)
        ? prev.filter((c) => c !== complication)
        : [...prev, complication]
    );
  };

  const handleInsert = () => {
    const parts: string[] = [];

    if (deliveryType) parts.push(`Delivery: ${deliveryType}`);
    if (gestationalAge) parts.push(`Gestational Age: ${gestationalAge} weeks`);
    if (birthWeight) parts.push(`Birth Weight: ${birthWeight}`);
    
    const allComplications = [
      ...birthComplications,
      ...maternalComplications,
      ...customComplications,
    ];
    
    if (allComplications.length > 0) {
      parts.push(`Complications: ${allComplications.join(", ")}`);
    }

    if (parts.length === 0) {
      onOpenChange(false);
      return;
    }

    const newText = parts.join("; ");
    const finalText = currentValue ? `${currentValue}. ${newText}` : newText;

    onInsert(finalText);
    handleReset();
    onOpenChange(false);
  };

  const handleReset = () => {
    setDeliveryType("");
    setBirthWeight("");
    setGestationalAge("");
    setBirthComplications([]);
    setMaternalComplications([]);
    setCustomComplications([]);
    setNewCustom("");
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
        title="Insert Birth History"
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
          {/* Basic Info */}
          <div className="space-y-3 border-b pb-4">
            <Label className="text-sm font-medium">Delivery Details</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Type of Delivery</Label>
                <Select value={deliveryType} onValueChange={setDeliveryType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DELIVERY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Gestational Age (weeks)</Label>
                <Input
                  placeholder="e.g., 38"
                  value={gestationalAge}
                  onChange={(e) => setGestationalAge(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Birth Weight</Label>
                <Input
                  placeholder="e.g., 3.2 kg"
                  value={birthWeight}
                  onChange={(e) => setBirthWeight(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Other Complications */}
          <div className="space-y-2 border-b pb-4">
            <Label className="text-sm font-medium">Add Other Complication</Label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter other complication..."
                value={newCustom}
                onChange={(e) => setNewCustom(e.target.value)}
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
                disabled={!newCustom.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {customComplications.map((complication, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 rounded-md bg-muted/30"
              >
                <span className="flex-1 text-sm">{complication}</span>
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

          {/* Neonatal Complications */}
          <div className="space-y-2 border-b pb-4">
            <Label className="text-sm font-medium">Neonatal Complications</Label>
            <div className="grid grid-cols-1 gap-2">
              {BIRTH_COMPLICATIONS.map((complication) => (
                <div
                  key={complication}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                >
                  <Checkbox
                    id={`birth-${complication}`}
                    checked={birthComplications.includes(complication)}
                    onCheckedChange={() => toggleBirthComplication(complication)}
                  />
                  <Label
                    htmlFor={`birth-${complication}`}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {complication}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Maternal Complications */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Maternal Complications During Pregnancy</Label>
            <div className="grid grid-cols-1 gap-2">
              {MATERNAL_COMPLICATIONS.map((complication) => (
                <div
                  key={complication}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                >
                  <Checkbox
                    id={`maternal-${complication}`}
                    checked={maternalComplications.includes(complication)}
                    onCheckedChange={() => toggleMaternalComplication(complication)}
                  />
                  <Label
                    htmlFor={`maternal-${complication}`}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {complication}
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
