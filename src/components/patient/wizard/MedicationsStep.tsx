import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ListPlus } from "lucide-react";
import { MedicationsDialog } from "@/components/patient/MedicationsDialog";
import { SupplementsDialog } from "@/components/patient/SupplementsDialog";
import { VaccinationHistoryDialog } from "@/components/patient/VaccinationHistoryDialog";

interface MedicationsStepProps {
  register: any;
  watch: any;
  setValue: any;
}

export const MedicationsStep = ({ register, watch, setValue }: MedicationsStepProps) => {
  const [showMedicationsDialog, setShowMedicationsDialog] = useState(false);
  const [showSupplementsDialog, setShowSupplementsDialog] = useState(false);
  const [showVaccinationDialog, setShowVaccinationDialog] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medications & Supplements</CardTitle>
        <CardDescription>Current medications, supplements, and vaccination history</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Label htmlFor="ongoing_medications">Ongoing Medications</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowMedicationsDialog(true)}
              title="Insert Medications"
            >
              <ListPlus className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            id="ongoing_medications"
            placeholder="Enter medications separated by commas (e.g., Aspirin 100mg daily, Metformin 500mg twice daily)"
            {...register("ongoing_medications")}
            rows={3}
          />
          <p className="text-sm text-muted-foreground mt-1">Separate multiple items with commas</p>
          <MedicationsDialog
            open={showMedicationsDialog}
            onOpenChange={setShowMedicationsDialog}
            onInsert={(text) => setValue("ongoing_medications", text)}
            currentValue={watch("ongoing_medications")}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Label htmlFor="supplements">Supplements</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowSupplementsDialog(true)}
              title="Insert Supplements"
            >
              <ListPlus className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            id="supplements"
            placeholder="Enter supplements separated by commas (e.g., Vitamin D, Omega-3)"
            {...register("supplements")}
            rows={3}
          />
          <p className="text-sm text-muted-foreground mt-1">Separate multiple items with commas</p>
          <SupplementsDialog
            open={showSupplementsDialog}
            onOpenChange={setShowSupplementsDialog}
            onInsert={(text) => setValue("supplements", text)}
            currentValue={watch("supplements")}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Label htmlFor="vaccinations">Vaccination History</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowVaccinationDialog(true)}
              title="Insert Vaccinations"
            >
              <ListPlus className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            id="vaccinations"
            placeholder="Enter vaccinations separated by commas (e.g., COVID-19 2023, Flu 2023)"
            {...register("vaccinations")}
            rows={3}
          />
          <p className="text-sm text-muted-foreground mt-1">Separate multiple items with commas</p>
          <VaccinationHistoryDialog
            open={showVaccinationDialog}
            onOpenChange={setShowVaccinationDialog}
            onInsert={(text) => setValue("vaccinations", text)}
            currentValue={watch("vaccinations")}
          />
        </div>
      </CardContent>
    </Card>
  );
};
