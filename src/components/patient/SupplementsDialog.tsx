import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, X } from "lucide-react";

interface SupplementsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (text: string) => void;
  currentValue?: string;
}

interface SupplementItem {
  name: string;
  dose: string;
  selected: boolean;
}

const commonSupplements = [
  { category: "Vitamins", supplements: [
    "Vitamin A", "Vitamin B1 (Thiamine)", "Vitamin B2 (Riboflavin)", "Vitamin B3 (Niacin)",
    "Vitamin B5 (Pantothenic Acid)", "Vitamin B6", "Vitamin B7 (Biotin)", "Vitamin B9 (Folic Acid)",
    "Vitamin B12", "Vitamin B Complex", "Vitamin C", "Vitamin D", "Vitamin D3",
    "Vitamin E", "Vitamin K", "Vitamin K2", "Multivitamin"
  ]},
  { category: "Minerals", supplements: [
    "Calcium", "Calcium + Vitamin D", "Magnesium", "Magnesium Glycinate", "Magnesium Citrate",
    "Iron", "Ferrous Sulfate", "Ferrous Gluconate",
    "Zinc", "Selenium", "Chromium", "Potassium", "Iodine", "Copper", "Manganese"
  ]},
  { category: "Omega Fatty Acids", supplements: [
    "Omega-3", "Omega-3 Fish Oil", "Omega-3-6-9", "EPA/DHA", "Cod Liver Oil",
    "Flaxseed Oil", "Krill Oil", "Algae Oil"
  ]},
  { category: "Probiotics & Digestive", supplements: [
    "Probiotics", "Lactobacillus", "Bifidobacterium", "Saccharomyces Boulardii",
    "Digestive Enzymes", "Psyllium Husk", "Fiber Supplement", "Prebiotics"
  ]},
  { category: "Amino Acids & Proteins", supplements: [
    "L-Carnitine", "L-Arginine", "L-Glutamine", "L-Theanine", "L-Tyrosine",
    "BCAA", "Creatine", "Collagen", "Whey Protein", "Casein Protein"
  ]},
  { category: "Herbal & Plant-Based", supplements: [
    "Ashwagandha", "Turmeric/Curcumin", "Ginger", "Garlic", "Ginkgo Biloba",
    "Ginseng", "Echinacea", "Elderberry", "Milk Thistle", "Saw Palmetto",
    "St. John's Wort", "Valerian Root", "Chamomile", "Green Tea Extract",
    "Spirulina", "Chlorella", "Moringa"
  ]},
  { category: "Bone & Joint Health", supplements: [
    "Glucosamine", "Chondroitin", "Glucosamine + Chondroitin", "MSM",
    "Hyaluronic Acid", "Boswellia", "SAMe"
  ]},
  { category: "Antioxidants", supplements: [
    "CoQ10 (Coenzyme Q10)", "Alpha Lipoic Acid", "Resveratrol", "Astaxanthin",
    "Lutein", "Zeaxanthin", "Beta-Carotene", "Lycopene", "Quercetin"
  ]},
  { category: "Other Popular", supplements: [
    "Melatonin", "5-HTP", "SAMe", "DHEA", "Lecithin",
    "Apple Cider Vinegar", "MCT Oil", "Evening Primrose Oil",
    "Black Seed Oil", "Neem", "Triphala"
  ]}
];

export function SupplementsDialog({ open, onOpenChange, onInsert, currentValue }: SupplementsDialogProps) {
  const [supplements, setSupplements] = useState<SupplementItem[]>([]);
  const [customSupplement, setCustomSupplement] = useState("");
  const [customDose, setCustomDose] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const handleSupplementToggle = (suppName: string) => {
    const existing = supplements.find(s => s.name === suppName);
    if (existing) {
      setSupplements(supplements.filter(s => s.name !== suppName));
    } else {
      setSupplements([...supplements, { name: suppName, dose: "", selected: true }]);
    }
  };

  const updateSupplementDose = (name: string, dose: string) => {
    setSupplements(supplements.map(s => 
      s.name === name ? { ...s, dose } : s
    ));
  };

  const addCustomSupplement = () => {
    if (customSupplement.trim()) {
      setSupplements([...supplements, { 
        name: customSupplement.trim(), 
        dose: customDose.trim(), 
        selected: true 
      }]);
      setCustomSupplement("");
      setCustomDose("");
    }
  };

  const removeSupplement = (name: string) => {
    setSupplements(supplements.filter(s => s.name !== name));
  };

  const handleInsert = () => {
    const selectedSupps = supplements.filter(s => s.selected);
    if (selectedSupps.length === 0) return;

    const formattedSupps = selectedSupps.map(s => {
      let entry = s.name;
      if (s.dose) entry += ` ${s.dose}`;
      return entry;
    });

    const newText = formattedSupps.join(", ");
    const finalText = currentValue ? `${currentValue}, ${newText}` : newText;
    
    onInsert(finalText);
    setSupplements([]);
    setSearchTerm("");
    onOpenChange(false);
  };

  const filteredCategories = commonSupplements.map(cat => ({
    ...cat,
    supplements: cat.supplements.filter(supp => 
      supp.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.supplements.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Select Supplements</DialogTitle>
          <DialogDescription>
            Choose from common supplements and vitamins
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-4">
          <Input
            placeholder="Search supplements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Selected Supplements */}
          {supplements.length > 0 && (
            <div className="border rounded-lg p-3 bg-muted/30 overflow-hidden">
              <Label className="text-sm font-medium mb-2 block">Selected Supplements</Label>
              <ScrollArea className="max-h-[22vh] pr-2">
                <div className="space-y-2">
                  {supplements.map((supp) => (
                    <div key={supp.name} className="flex items-center gap-2 flex-wrap bg-background p-2 rounded">
                      <span className="font-medium min-w-[150px]">{supp.name}</span>
                      <Input
                        placeholder="Dose (e.g., 1000mg)"
                        value={supp.dose}
                        onChange={(e) => updateSupplementDose(supp.name, e.target.value)}
                        className="w-40 h-8"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeSupplement(supp.name)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Add Custom Supplement */}
          <div className="border rounded-lg p-3">
            <Label className="text-sm font-medium mb-2 block">Add Custom Supplement</Label>
            <div className="flex items-center gap-2 flex-wrap">
              <Input
                placeholder="Supplement name"
                value={customSupplement}
                onChange={(e) => setCustomSupplement(e.target.value)}
                className="flex-1 min-w-[150px]"
              />
              <Input
                placeholder="Dose (optional)"
                value={customDose}
                onChange={(e) => setCustomDose(e.target.value)}
                className="w-36"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addCustomSupplement}
                disabled={!customSupplement.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Common Supplements List */}
          <ScrollArea className="flex-1 min-h-0 border rounded-lg p-3 pb-6">
            {filteredCategories.map((category) => (
              <div key={category.category} className="mb-4">
                <Label className="text-sm font-semibold text-primary mb-2 block">{category.category}</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {category.supplements.map((supp) => (
                    <div key={supp} className="flex items-center space-x-2">
                      <Checkbox
                        id={`supp-${supp}`}
                        checked={supplements.some(s => s.name === supp)}
                        onCheckedChange={() => handleSupplementToggle(supp)}
                      />
                      <label
                        htmlFor={`supp-${supp}`}
                        className="text-sm cursor-pointer"
                      >
                        {supp}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>

        <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t -mx-6 px-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={supplements.length === 0}>
            Insert Supplements
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
