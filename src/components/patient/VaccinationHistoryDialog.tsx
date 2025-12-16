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

interface VaccinationHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (text: string) => void;
  currentValue?: string;
}

interface Vaccination {
  name: string;
  date: string;
  selected: boolean;
}

const COMMON_VACCINES = [
  // Childhood vaccines
  "BCG",
  "Hepatitis B",
  "DTP/DTaP",
  "Polio (IPV/OPV)",
  "Hib (Haemophilus influenzae type b)",
  "Pneumococcal (PCV)",
  "Rotavirus",
  "MMR (Measles, Mumps, Rubella)",
  "Varicella (Chickenpox)",
  "Hepatitis A",
  // Adult vaccines
  "Influenza (Flu)",
  "COVID-19",
  "Tdap (Tetanus, Diphtheria, Pertussis)",
  "Td (Tetanus, Diphtheria)",
  "Shingles (Zoster)",
  "Pneumococcal (PPSV23)",
  "HPV (Human Papillomavirus)",
  "Meningococcal",
  // Travel vaccines
  "Yellow Fever",
  "Typhoid",
  "Japanese Encephalitis",
  "Rabies",
  "Cholera",
];

export function VaccinationHistoryDialog({
  open,
  onOpenChange,
  onInsert,
  currentValue,
}: VaccinationHistoryDialogProps) {
  const [vaccinations, setVaccinations] = useState<Vaccination[]>(
    COMMON_VACCINES.map((name) => ({ name, date: "", selected: false }))
  );
  const [customVaccine, setCustomVaccine] = useState("");
  const [customDate, setCustomDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleVaccineToggle = (index: number) => {
    const updated = [...vaccinations];
    updated[index].selected = !updated[index].selected;
    setVaccinations(updated);
  };

  const handleDateChange = (index: number, date: string) => {
    const updated = [...vaccinations];
    updated[index].date = date;
    setVaccinations(updated);
  };

  const addCustomVaccine = () => {
    if (customVaccine.trim()) {
      setVaccinations([
        ...vaccinations,
        { name: customVaccine.trim(), date: customDate, selected: true },
      ]);
      setCustomVaccine("");
      setCustomDate("");
    }
  };

  const handleInsert = () => {
    const selectedVaccinations = vaccinations
      .filter((v) => v.selected)
      .map((v) => (v.date ? `${v.name} (${v.date})` : v.name));

    const newText = selectedVaccinations.join(", ");
    const finalText = currentValue
      ? `${currentValue}, ${newText}`
      : newText;

    onInsert(finalText);
    onOpenChange(false);

    // Reset state
    setVaccinations(
      COMMON_VACCINES.map((name) => ({ name, date: "", selected: false }))
    );
    setSearchQuery("");
  };

  const filteredVaccinations = vaccinations.filter((v) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCount = vaccinations.filter((v) => v.selected).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add Vaccination History</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vaccines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="flex-1 min-h-0 pr-4 pb-6">
          <div className="space-y-3">
            {filteredVaccinations.map((vaccine, index) => {
              const originalIndex = vaccinations.findIndex(
                (v) => v.name === vaccine.name
              );
              return (
                <div
                  key={vaccine.name}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                >
                  <Checkbox
                    id={`vaccine-${originalIndex}`}
                    checked={vaccine.selected}
                    onCheckedChange={() => handleVaccineToggle(originalIndex)}
                  />
                  <Label
                    htmlFor={`vaccine-${originalIndex}`}
                    className="flex-1 cursor-pointer"
                  >
                    {vaccine.name}
                  </Label>
                  {vaccine.selected && (
                    <Input
                      type="text"
                      placeholder="Year/Date"
                      value={vaccine.date}
                      onChange={(e) =>
                        handleDateChange(originalIndex, e.target.value)
                      }
                      className="w-28"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="border-t pt-4 mt-2">
          <Label className="text-sm font-medium mb-2 block">Add Custom Vaccine</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Vaccine name"
              value={customVaccine}
              onChange={(e) => setCustomVaccine(e.target.value)}
              className="flex-1"
            />
            <Input
              type="text"
              placeholder="Year/Date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="w-28"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={addCustomVaccine}
              disabled={!customVaccine.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t -mx-6 px-6">
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
