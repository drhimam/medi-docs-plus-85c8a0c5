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

interface FoodAllergyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (text: string) => void;
  currentValue?: string;
}

interface FoodAllergy {
  name: string;
  reaction: string;
  selected: boolean;
}

const COMMON_FOOD_ALLERGIES = [
  // Top 8 allergens
  "Peanuts",
  "Tree Nuts (Almonds, Cashews, Walnuts)",
  "Milk/Dairy",
  "Eggs",
  "Wheat/Gluten",
  "Soy",
  "Fish",
  "Shellfish (Shrimp, Crab, Lobster)",
  // Other common allergens
  "Sesame",
  "Mustard",
  "Celery",
  "Lupin",
  "Mollusks",
  "Corn",
  "Strawberries",
  "Citrus Fruits",
  "Tomatoes",
  "Kiwi",
  "Bananas",
  "Avocado",
  "Coconut",
  "Garlic",
  "Onion",
  "Chocolate",
  "Caffeine",
  "Alcohol",
  "Food Additives/Preservatives",
  "MSG (Monosodium Glutamate)",
  "Sulfites",
];

const REACTION_OPTIONS = [
  "Hives",
  "Swelling",
  "Itching",
  "Anaphylaxis",
  "Nausea/Vomiting",
  "Diarrhea",
  "Stomach cramps",
  "Difficulty breathing",
  "Tingling in mouth",
];

export function FoodAllergyDialog({
  open,
  onOpenChange,
  onInsert,
  currentValue,
}: FoodAllergyDialogProps) {
  const [allergies, setAllergies] = useState<FoodAllergy[]>(
    COMMON_FOOD_ALLERGIES.map((name) => ({ name, reaction: "", selected: false }))
  );
  const [customFood, setCustomFood] = useState("");
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

  const addCustomFood = () => {
    if (customFood.trim()) {
      setAllergies([
        ...allergies,
        { name: customFood.trim(), reaction: customReaction, selected: true },
      ]);
      setCustomFood("");
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
      COMMON_FOOD_ALLERGIES.map((name) => ({ name, reaction: "", selected: false }))
    );
    setSearchQuery("");
  };

  const filteredAllergies = allergies.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCount = allergies.filter((a) => a.selected).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Food Allergies</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search foods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="flex-1 pr-4">
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
                    id={`food-${originalIndex}`}
                    checked={allergy.selected}
                    onCheckedChange={() => handleAllergyToggle(originalIndex)}
                  />
                  <Label
                    htmlFor={`food-${originalIndex}`}
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
                      list="food-reactions"
                    />
                  )}
                </div>
              );
            })}
          </div>
          <datalist id="food-reactions">
            {REACTION_OPTIONS.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </ScrollArea>

        <div className="border-t pt-4 mt-2">
          <Label className="text-sm font-medium mb-2 block">Add Custom Food Allergy</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Food name"
              value={customFood}
              onChange={(e) => setCustomFood(e.target.value)}
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
              onClick={addCustomFood}
              disabled={!customFood.trim()}
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
