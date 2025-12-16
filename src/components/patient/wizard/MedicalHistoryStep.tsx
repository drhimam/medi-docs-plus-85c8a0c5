import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ListPlus } from "lucide-react";
import { OngoingConditionsDialog } from "@/components/patient/OngoingConditionsDialog";
import { PastConditionsDialog } from "@/components/patient/PastConditionsDialog";
import { SurgicalHistoryDialog } from "@/components/patient/SurgicalHistoryDialog";
import { HospitalizationHistoryDialog } from "@/components/patient/HospitalizationHistoryDialog";
import FamilyHistoryDialog from "@/components/patient/FamilyHistoryDialog";
import { MentalHealthHistoryDialog } from "@/components/patient/MentalHealthHistoryDialog";
import { BirthHistoryDialog } from "@/components/patient/BirthHistoryDialog";
import { DevelopmentalHistoryDialog } from "@/components/patient/DevelopmentalHistoryDialog";
import { ChildhoodIllnessesDialog } from "@/components/patient/ChildhoodIllnessesDialog";
import { AccidentsInjuriesDialog } from "@/components/patient/AccidentsInjuriesDialog";
import { PreventiveScreeningDialog } from "@/components/patient/PreventiveScreeningDialog";
import { MenstrualPregnancyHistoryDialog } from "@/components/patient/MenstrualPregnancyHistoryDialog";

interface MedicalHistoryStepProps {
  register: any;
  watch: any;
  setValue: any;
}

export const MedicalHistoryStep = ({ register, watch, setValue }: MedicalHistoryStepProps) => {
  const [showOngoingConditionsDialog, setShowOngoingConditionsDialog] = useState(false);
  const [showPastConditionsDialog, setShowPastConditionsDialog] = useState(false);
  const [showSurgicalHistoryDialog, setShowSurgicalHistoryDialog] = useState(false);
  const [showHospitalizationDialog, setShowHospitalizationDialog] = useState(false);
  const [showFamilyHistoryDialog, setShowFamilyHistoryDialog] = useState(false);
  const [showMentalHealthDialog, setShowMentalHealthDialog] = useState(false);
  const [showBirthHistoryDialog, setShowBirthHistoryDialog] = useState(false);
  const [showDevelopmentalHistoryDialog, setShowDevelopmentalHistoryDialog] = useState(false);
  const [showChildhoodIllnessesDialog, setShowChildhoodIllnessesDialog] = useState(false);
  const [showAccidentsInjuriesDialog, setShowAccidentsInjuriesDialog] = useState(false);
  const [showPreventiveScreeningDialog, setShowPreventiveScreeningDialog] = useState(false);
  const [showMenstrualPregnancyDialog, setShowMenstrualPregnancyDialog] = useState(false);

  const gender = watch("gender");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medical History</CardTitle>
        <CardDescription>Patient's medical background and family history</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Label htmlFor="medical_history_ongoing">Ongoing Medical Conditions</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowOngoingConditionsDialog(true)}
            >
              <ListPlus className="h-3.5 w-3.5 mr-1" />
              Insert
            </Button>
          </div>
          <Textarea
            id="medical_history_ongoing"
            placeholder="List current medical conditions..."
            {...register("medical_history_ongoing")}
            rows={3}
          />
          <OngoingConditionsDialog
            open={showOngoingConditionsDialog}
            onOpenChange={setShowOngoingConditionsDialog}
            onInsert={(text) => setValue("medical_history_ongoing", text)}
            currentValue={watch("medical_history_ongoing")}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Label htmlFor="medical_history_past">Past Medical History</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowPastConditionsDialog(true)}
              title="Insert Past Conditions"
            >
              <ListPlus className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            id="medical_history_past"
            placeholder="List past medical conditions..."
            {...register("medical_history_past")}
            rows={3}
          />
          <PastConditionsDialog
            open={showPastConditionsDialog}
            onOpenChange={setShowPastConditionsDialog}
            onInsert={(text) => setValue("medical_history_past", text)}
            currentValue={watch("medical_history_past")}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Label htmlFor="surgical_history">Surgical History</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowSurgicalHistoryDialog(true)}
              title="Insert Surgical History"
            >
              <ListPlus className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            id="surgical_history"
            placeholder="List past surgeries and procedures..."
            {...register("surgical_history")}
            rows={3}
          />
          <SurgicalHistoryDialog
            open={showSurgicalHistoryDialog}
            onOpenChange={setShowSurgicalHistoryDialog}
            onInsert={(text) => setValue("surgical_history", text)}
            currentValue={watch("surgical_history")}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Label htmlFor="hospitalization_history">Hospitalization History</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowHospitalizationDialog(true)}
              title="Insert Hospitalization History"
            >
              <ListPlus className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            id="hospitalization_history"
            placeholder="List past hospitalizations..."
            {...register("hospitalization_history")}
            rows={3}
          />
          <HospitalizationHistoryDialog
            open={showHospitalizationDialog}
            onOpenChange={setShowHospitalizationDialog}
            onInsert={(text) => setValue("hospitalization_history", text)}
            currentValue={watch("hospitalization_history")}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Label htmlFor="family_history">Family History</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowFamilyHistoryDialog(true)}
            >
              <ListPlus className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            id="family_history"
            placeholder="List family medical history (e.g., diabetes, heart disease)..."
            {...register("family_history")}
            rows={3}
          />
          <FamilyHistoryDialog
            open={showFamilyHistoryDialog}
            onOpenChange={setShowFamilyHistoryDialog}
            onInsert={(text) => setValue("family_history", text)}
            currentValue={watch("family_history") || ""}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Label htmlFor="mental_health_history">Mental Health History</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowMentalHealthDialog(true)}
              title="Insert Mental Health History"
            >
              <ListPlus className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            id="mental_health_history"
            placeholder="List mental health conditions and treatments..."
            {...register("mental_health_history")}
            rows={3}
          />
          <MentalHealthHistoryDialog
            open={showMentalHealthDialog}
            onOpenChange={setShowMentalHealthDialog}
            onInsert={(text) => setValue("mental_health_history", text)}
            currentValue={watch("mental_health_history")}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Label htmlFor="birth_history">Birth History</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowBirthHistoryDialog(true)}
              title="Insert Birth History"
            >
              <ListPlus className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            id="birth_history"
            placeholder="Describe birth history..."
            {...register("birth_history")}
            rows={2}
          />
          <BirthHistoryDialog
            open={showBirthHistoryDialog}
            onOpenChange={setShowBirthHistoryDialog}
            onInsert={(text) => setValue("birth_history", text)}
            currentValue={watch("birth_history")}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Label htmlFor="developmental_history">Developmental History</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowDevelopmentalHistoryDialog(true)}
              title="Insert Developmental History"
            >
              <ListPlus className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            id="developmental_history"
            placeholder="Describe developmental milestones..."
            {...register("developmental_history")}
            rows={2}
          />
          <DevelopmentalHistoryDialog
            open={showDevelopmentalHistoryDialog}
            onOpenChange={setShowDevelopmentalHistoryDialog}
            onInsert={(text) => setValue("developmental_history", text)}
            currentValue={watch("developmental_history")}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Label htmlFor="childhood_illnesses">Childhood Illnesses</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowChildhoodIllnessesDialog(true)}
              title="Insert Childhood Illnesses"
            >
              <ListPlus className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            id="childhood_illnesses"
            placeholder="List significant childhood illnesses..."
            {...register("childhood_illnesses")}
            rows={2}
          />
          <ChildhoodIllnessesDialog
            open={showChildhoodIllnessesDialog}
            onOpenChange={setShowChildhoodIllnessesDialog}
            onInsert={(text) => setValue("childhood_illnesses", text)}
            currentValue={watch("childhood_illnesses")}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Label htmlFor="accidents_injuries">Accidents or Injuries</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowAccidentsInjuriesDialog(true)}
              title="Insert Accidents/Injuries"
            >
              <ListPlus className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            id="accidents_injuries"
            placeholder="Describe major accidents or injuries..."
            {...register("accidents_injuries")}
            rows={2}
          />
          <AccidentsInjuriesDialog
            open={showAccidentsInjuriesDialog}
            onOpenChange={setShowAccidentsInjuriesDialog}
            onInsert={(text) => setValue("accidents_injuries", text)}
            currentValue={watch("accidents_injuries")}
          />
        </div>

        {gender === "FEMALE" && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Label htmlFor="menstrual_pregnancy_history">Menstrual and Pregnancy History</Label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowMenstrualPregnancyDialog(true)}
                title="Insert Menstrual/Pregnancy History"
              >
                <ListPlus className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              id="menstrual_pregnancy_history"
              placeholder="Detail menstrual and pregnancy history..."
              {...register("menstrual_pregnancy_history")}
              rows={2}
            />
            <MenstrualPregnancyHistoryDialog
              open={showMenstrualPregnancyDialog}
              onOpenChange={setShowMenstrualPregnancyDialog}
              onInsert={(text) => setValue("menstrual_pregnancy_history", text)}
              currentValue={watch("menstrual_pregnancy_history")}
            />
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Label htmlFor="preventive_screening_history">Preventive Screening History</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowPreventiveScreeningDialog(true)}
              title="Insert Preventive Screening History"
            >
              <ListPlus className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            id="preventive_screening_history"
            placeholder="e.g., mammograms, colonoscopies..."
            {...register("preventive_screening_history")}
            rows={2}
          />
          <PreventiveScreeningDialog
            open={showPreventiveScreeningDialog}
            onOpenChange={setShowPreventiveScreeningDialog}
            onInsert={(text) => setValue("preventive_screening_history", text)}
            currentValue={watch("preventive_screening_history")}
          />
        </div>
      </CardContent>
    </Card>
  );
};
