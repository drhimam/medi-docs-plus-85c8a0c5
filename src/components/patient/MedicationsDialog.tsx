import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, X } from "lucide-react";

interface MedicationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (text: string) => void;
  currentValue?: string;
}

interface MedicationItem {
  name: string;
  dose: string;
  frequency: string;
  selected: boolean;
}

const commonMedications = [
  // Cardiovascular
  { category: "Cardiovascular", medications: [
    "Aspirin", "Clopidogrel", "Warfarin", "Rivaroxaban", "Apixaban",
    "Atenolol", "Metoprolol", "Carvedilol", "Bisoprolol",
    "Amlodipine", "Nifedipine", "Diltiazem", "Verapamil",
    "Lisinopril", "Enalapril", "Ramipril", "Losartan", "Valsartan", "Telmisartan",
    "Hydrochlorothiazide", "Furosemide", "Spironolactone",
    "Atorvastatin", "Rosuvastatin", "Simvastatin", "Pravastatin",
    "Digoxin", "Amiodarone"
  ]},
  // Diabetes
  { category: "Diabetes", medications: [
    "Metformin", "Glimepiride", "Gliclazide", "Glipizide",
    "Sitagliptin", "Linagliptin", "Vildagliptin",
    "Empagliflozin", "Dapagliflozin", "Canagliflozin",
    "Pioglitazone", "Acarbose",
    "Insulin Glargine", "Insulin Aspart", "Insulin Lispro", "Insulin Regular"
  ]},
  // Pain & Inflammation
  { category: "Pain & Inflammation", medications: [
    "Paracetamol", "Ibuprofen", "Naproxen", "Diclofenac", "Celecoxib", "Etoricoxib",
    "Tramadol", "Codeine", "Morphine", "Fentanyl",
    "Pregabalin", "Gabapentin", "Amitriptyline"
  ]},
  // Respiratory
  { category: "Respiratory", medications: [
    "Salbutamol", "Formoterol", "Salmeterol",
    "Budesonide", "Fluticasone", "Beclometasone",
    "Tiotropium", "Ipratropium",
    "Montelukast", "Theophylline",
    "Cetirizine", "Loratadine", "Fexofenadine"
  ]},
  // Gastrointestinal
  { category: "Gastrointestinal", medications: [
    "Omeprazole", "Pantoprazole", "Esomeprazole", "Rabeprazole", "Lansoprazole",
    "Ranitidine", "Famotidine",
    "Domperidone", "Metoclopramide", "Ondansetron",
    "Lactulose", "Bisacodyl", "Polyethylene glycol",
    "Loperamide", "Sucralfate"
  ]},
  // Psychiatric
  { category: "Psychiatric", medications: [
    "Sertraline", "Fluoxetine", "Paroxetine", "Escitalopram", "Citalopram",
    "Venlafaxine", "Duloxetine", "Mirtazapine",
    "Quetiapine", "Olanzapine", "Risperidone", "Aripiprazole",
    "Alprazolam", "Lorazepam", "Diazepam", "Clonazepam",
    "Lithium", "Valproate", "Carbamazepine", "Lamotrigine"
  ]},
  // Thyroid
  { category: "Thyroid", medications: [
    "Levothyroxine", "Liothyronine", "Carbimazole", "Propylthiouracil"
  ]},
  // Antibiotics
  { category: "Antibiotics", medications: [
    "Amoxicillin", "Amoxicillin-Clavulanate", "Azithromycin", "Clarithromycin",
    "Ciprofloxacin", "Levofloxacin", "Moxifloxacin",
    "Doxycycline", "Metronidazole", "Clindamycin",
    "Cephalexin", "Cefuroxime", "Ceftriaxone",
    "Nitrofurantoin", "Trimethoprim-Sulfamethoxazole"
  ]},
  // Other Common
  { category: "Other Common", medications: [
    "Allopurinol", "Colchicine", "Febuxostat",
    "Alendronate", "Risedronate", "Calcium + Vitamin D",
    "Finasteride", "Tamsulosin", "Sildenafil", "Tadalafil",
    "Prednisone", "Prednisolone", "Dexamethasone",
    "Hydroxychloroquine", "Methotrexate"
  ]}
];

const frequencyOptions = ["Once daily", "Twice daily", "Three times daily", "Four times daily", "As needed", "Weekly", "Monthly"];

export function MedicationsDialog({ open, onOpenChange, onInsert, currentValue }: MedicationsDialogProps) {
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [customMedication, setCustomMedication] = useState("");
  const [customDose, setCustomDose] = useState("");
  const [customFrequency, setCustomFrequency] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const handleMedicationToggle = (medName: string) => {
    const existing = medications.find(m => m.name === medName);
    if (existing) {
      setMedications(medications.filter(m => m.name !== medName));
    } else {
      setMedications([...medications, { name: medName, dose: "", frequency: "", selected: true }]);
    }
  };

  const updateMedication = (name: string, field: "dose" | "frequency", value: string) => {
    setMedications(medications.map(m => 
      m.name === name ? { ...m, [field]: value } : m
    ));
  };

  const addCustomMedication = () => {
    if (customMedication.trim()) {
      setMedications([...medications, { 
        name: customMedication.trim(), 
        dose: customDose.trim(), 
        frequency: customFrequency.trim(), 
        selected: true 
      }]);
      setCustomMedication("");
      setCustomDose("");
      setCustomFrequency("");
    }
  };

  const removeMedication = (name: string) => {
    setMedications(medications.filter(m => m.name !== name));
  };

  const handleInsert = () => {
    const selectedMeds = medications.filter(m => m.selected);
    if (selectedMeds.length === 0) return;

    const formattedMeds = selectedMeds.map(m => {
      let entry = m.name;
      if (m.dose) entry += ` ${m.dose}`;
      if (m.frequency) entry += ` ${m.frequency}`;
      return entry;
    });

    const newText = formattedMeds.join(", ");
    const finalText = currentValue ? `${currentValue}, ${newText}` : newText;
    
    onInsert(finalText);
    setMedications([]);
    setSearchTerm("");
    onOpenChange(false);
  };

  const filteredCategories = commonMedications.map(cat => ({
    ...cat,
    medications: cat.medications.filter(med => 
      med.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.medications.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Medications</DialogTitle>
          <DialogDescription>
            Choose from common medications and add dose/frequency details
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          <Input
            placeholder="Search medications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Selected Medications */}
          {medications.length > 0 && (
            <div className="border rounded-lg p-3 bg-muted/30 overflow-hidden">
              <Label className="text-sm font-medium mb-2 block">Selected Medications</Label>
              <ScrollArea className="max-h-[22vh] pr-2">
                <div className="space-y-2">
                  {medications.map((med) => (
                    <div key={med.name} className="flex items-center gap-2 flex-wrap bg-background p-2 rounded">
                      <span className="font-medium min-w-[150px]">{med.name}</span>
                      <Input
                        placeholder="Dose (e.g., 100mg)"
                        value={med.dose}
                        onChange={(e) => updateMedication(med.name, "dose", e.target.value)}
                        className="w-32 h-8"
                      />
                      <Input
                        placeholder="Frequency"
                        value={med.frequency}
                        onChange={(e) => updateMedication(med.name, "frequency", e.target.value)}
                        className="w-36 h-8"
                        list="frequency-options"
                      />
                      <datalist id="frequency-options">
                        {frequencyOptions.map((f) => (
                          <option key={f} value={f} />
                        ))}
                      </datalist>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeMedication(med.name)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Add Custom Medication */}
          <div className="border rounded-lg p-3">
            <Label className="text-sm font-medium mb-2 block">Add Custom Medication</Label>
            <div className="flex items-center gap-2 flex-wrap">
              <Input
                placeholder="Medication name"
                value={customMedication}
                onChange={(e) => setCustomMedication(e.target.value)}
                className="flex-1 min-w-[150px]"
              />
              <Input
                placeholder="Dose"
                value={customDose}
                onChange={(e) => setCustomDose(e.target.value)}
                className="w-28"
              />
              <Input
                placeholder="Frequency"
                value={customFrequency}
                onChange={(e) => setCustomFrequency(e.target.value)}
                className="w-36"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addCustomMedication}
                disabled={!customMedication.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Common Medications List */}
          <ScrollArea className="flex-1 border rounded-lg p-3">
            {filteredCategories.map((category) => (
              <div key={category.category} className="mb-4">
                <Label className="text-sm font-semibold text-primary mb-2 block">{category.category}</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {category.medications.map((med) => (
                    <div key={med} className="flex items-center space-x-2">
                      <Checkbox
                        id={`med-${med}`}
                        checked={medications.some(m => m.name === med)}
                        onCheckedChange={() => handleMedicationToggle(med)}
                      />
                      <label
                        htmlFor={`med-${med}`}
                        className="text-sm cursor-pointer"
                      >
                        {med}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={medications.length === 0}>
            Insert Medications
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
