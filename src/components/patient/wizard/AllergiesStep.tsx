import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ListPlus } from "lucide-react";
import { DrugAllergyDialog } from "@/components/patient/DrugAllergyDialog";
import { FoodAllergyDialog } from "@/components/patient/FoodAllergyDialog";
import { EnvironmentalAllergyDialog } from "@/components/patient/EnvironmentalAllergyDialog";

interface AllergiesStepProps {
  register: any;
  watch: any;
  setValue: any;
  noKnownAllergies: boolean;
  setNoKnownAllergies: (value: boolean) => void;
}

export const AllergiesStep = ({ 
  register, 
  watch,
  setValue, 
  noKnownAllergies, 
  setNoKnownAllergies 
}: AllergiesStepProps) => {
  const [showDrugAllergyDialog, setShowDrugAllergyDialog] = useState(false);
  const [showFoodAllergyDialog, setShowFoodAllergyDialog] = useState(false);
  const [showEnvAllergyDialog, setShowEnvAllergyDialog] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Allergies</CardTitle>
        <CardDescription>Document all known allergies for patient safety</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-md">
          <Checkbox
            id="nkda"
            checked={noKnownAllergies}
            onCheckedChange={(checked) => {
              setNoKnownAllergies(checked === true);
              if (checked) {
                setValue("allergic_history_drug", "NKDA (No Known Drug Allergies)");
                setValue("allergic_history_food", "NKFA (No Known Food Allergies)");
                setValue("allergic_history_env", "NKEA (No Known Environmental Allergies)");
              } else {
                setValue("allergic_history_drug", "");
                setValue("allergic_history_food", "");
                setValue("allergic_history_env", "");
              }
            }}
          />
          <Label htmlFor="nkda" className="font-medium cursor-pointer">
            No Known Allergies (NKDA)
          </Label>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Label htmlFor="allergic_history_drug">Drug Allergies</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowDrugAllergyDialog(true)}
              title="Insert Drug Allergies"
            >
              <ListPlus className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            id="allergic_history_drug"
            placeholder="Enter drug allergies separated by commas (e.g., Penicillin, Aspirin)"
            {...register("allergic_history_drug")}
            rows={3}
          />
          <p className="text-sm text-muted-foreground mt-1">Separate multiple items with commas</p>
          <DrugAllergyDialog
            open={showDrugAllergyDialog}
            onOpenChange={setShowDrugAllergyDialog}
            onInsert={(text) => setValue("allergic_history_drug", text)}
            currentValue={watch("allergic_history_drug")}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Label htmlFor="allergic_history_food">Food Allergies</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowFoodAllergyDialog(true)}
              title="Insert Food Allergies"
            >
              <ListPlus className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            id="allergic_history_food"
            placeholder="Enter food allergies separated by commas (e.g., Peanuts, Shellfish)"
            {...register("allergic_history_food")}
            rows={3}
          />
          <p className="text-sm text-muted-foreground mt-1">Separate multiple items with commas</p>
          <FoodAllergyDialog
            open={showFoodAllergyDialog}
            onOpenChange={setShowFoodAllergyDialog}
            onInsert={(text) => setValue("allergic_history_food", text)}
            currentValue={watch("allergic_history_food")}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Label htmlFor="allergic_history_env">Environmental Allergies</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowEnvAllergyDialog(true)}
              title="Insert Environmental Allergies"
            >
              <ListPlus className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            id="allergic_history_env"
            placeholder="Enter environmental allergies separated by commas (e.g., Pollen, Dust)"
            {...register("allergic_history_env")}
            rows={3}
          />
          <p className="text-sm text-muted-foreground mt-1">Separate multiple items with commas</p>
          <EnvironmentalAllergyDialog
            open={showEnvAllergyDialog}
            onOpenChange={setShowEnvAllergyDialog}
            onInsert={(text) => setValue("allergic_history_env", text)}
            currentValue={watch("allergic_history_env")}
          />
        </div>
      </CardContent>
    </Card>
  );
};
