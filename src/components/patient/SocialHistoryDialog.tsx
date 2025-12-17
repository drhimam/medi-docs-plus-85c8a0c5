import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PresetDialogLayout } from "@/components/patient/preset/PresetDialogLayout";

interface SocialHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (data: SocialHistoryData) => void;
}

export interface SocialHistoryData {
  smokingStatus: string;
  smokingDetails: string;
  alcoholConsumption: string;
  alcoholDetails: string;
  recreationalDrugUse: string;
  exerciseHabits: string;
  diet: string;
  livingEnvironment: string;
}

const SMOKING_OPTIONS = [
  { value: "NEVER", label: "Never smoked" },
  { value: "FORMER", label: "Former smoker" },
  { value: "CURRENT", label: "Current smoker" },
];

const ALCOHOL_OPTIONS = [
  { value: "NEVER", label: "Never drinks" },
  { value: "OCCASIONAL", label: "Occasional (1-2 drinks/week)" },
  { value: "MODERATE", label: "Moderate (3-7 drinks/week)" },
  { value: "HEAVY", label: "Heavy (>7 drinks/week)" },
];

const RECREATIONAL_DRUGS = [
  "None",
  "Cannabis/Marijuana",
  "Cocaine",
  "Amphetamines",
  "Opioids",
  "Hallucinogens",
  "Sedatives",
  "Inhalants",
  "Other",
];

const EXERCISE_OPTIONS = [
  "Sedentary (little to no exercise)",
  "Light (1-2 days/week, light activity)",
  "Moderate (3-4 days/week, moderate activity)",
  "Active (5+ days/week, regular exercise)",
  "Very Active (daily intense exercise)",
  "Walking daily",
  "Swimming",
  "Gym/Weight training",
  "Yoga/Stretching",
  "Running/Jogging",
  "Cycling",
  "Sports (specify)",
];

const DIET_OPTIONS = [
  "Regular/Balanced diet",
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Low-carb/Keto",
  "Mediterranean",
  "Gluten-free",
  "Lactose-free",
  "Diabetic diet",
  "Low-sodium diet",
  "Heart-healthy diet",
  "Weight loss diet",
  "High-protein diet",
  "Intermittent fasting",
  "No specific diet",
];

const LIVING_ENVIRONMENT_OPTIONS = [
  "Lives alone",
  "Lives with spouse/partner",
  "Lives with family",
  "Lives with roommates",
  "Assisted living facility",
  "Nursing home",
  "House",
  "Apartment",
  "Urban area",
  "Suburban area",
  "Rural area",
  "Homeless/Unstable housing",
  "Has pets",
  "Stairs in home",
  "Accessible/Single floor",
];

export function SocialHistoryDialog({ open, onOpenChange, onInsert }: SocialHistoryDialogProps) {
  const [smokingStatus, setSmokingStatus] = useState("");
  const [smokingDetails, setSmokingDetails] = useState("");
  const [alcoholConsumption, setAlcoholConsumption] = useState("");
  const [alcoholDetails, setAlcoholDetails] = useState("");
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
  const [drugDetails, setDrugDetails] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<string[]>([]);
  const [exerciseDetails, setExerciseDetails] = useState("");
  const [selectedDiet, setSelectedDiet] = useState<string[]>([]);
  const [dietDetails, setDietDetails] = useState("");
  const [selectedLiving, setSelectedLiving] = useState<string[]>([]);
  const [livingDetails, setLivingDetails] = useState("");

  const toggleSelection = (
    item: string,
    selected: string[],
    setSelected: (items: string[]) => void
  ) => {
    if (selected.includes(item)) {
      setSelected(selected.filter((i) => i !== item));
    } else {
      setSelected([...selected, item]);
    }
  };

  const handleInsert = () => {
    // Build recreational drug use string
    let recreationalDrugUse = "";
    if (selectedDrugs.length > 0) {
      recreationalDrugUse = selectedDrugs.join(", ");
      if (drugDetails) recreationalDrugUse += ` - ${drugDetails}`;
    }

    // Build exercise habits string
    let exerciseHabits = "";
    if (selectedExercise.length > 0) {
      exerciseHabits = selectedExercise.join(", ");
      if (exerciseDetails) exerciseHabits += ` - ${exerciseDetails}`;
    }

    // Build diet string
    let diet = "";
    if (selectedDiet.length > 0) {
      diet = selectedDiet.join(", ");
      if (dietDetails) diet += ` - ${dietDetails}`;
    }

    // Build living environment string
    let livingEnvironment = "";
    if (selectedLiving.length > 0) {
      livingEnvironment = selectedLiving.join(", ");
      if (livingDetails) livingEnvironment += ` - ${livingDetails}`;
    }

    // Build smoking details
    let fullSmokingDetails = smokingDetails;
    if (smokingStatus === "FORMER" && smokingDetails) {
      fullSmokingDetails = `Quit: ${smokingDetails}`;
    } else if (smokingStatus === "CURRENT" && smokingDetails) {
      fullSmokingDetails = `${smokingDetails} pack-years`;
    }

    onInsert({
      smokingStatus,
      smokingDetails: fullSmokingDetails,
      alcoholConsumption,
      alcoholDetails,
      recreationalDrugUse,
      exerciseHabits,
      diet,
      livingEnvironment,
    });

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setSmokingStatus("");
    setSmokingDetails("");
    setAlcoholConsumption("");
    setAlcoholDetails("");
    setSelectedDrugs([]);
    setDrugDetails("");
    setSelectedExercise([]);
    setExerciseDetails("");
    setSelectedDiet([]);
    setDietDetails("");
    setSelectedLiving([]);
    setLivingDetails("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <PresetDialogLayout
        title="Social History"
        footer={
          <>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleInsert}>Insert</Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Smoking Status */}
          <div>
            <h3 className="font-medium mb-3">Smoking Status</h3>
            <RadioGroup value={smokingStatus} onValueChange={setSmokingStatus}>
              <div className="grid grid-cols-3 gap-3">
                {SMOKING_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`smoking-${option.value}`} />
                    <Label htmlFor={`smoking-${option.value}`} className="cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
            {smokingStatus === "FORMER" && (
              <div className="mt-3">
                <Label className="text-sm">When did you quit?</Label>
                <Input
                  placeholder="e.g., 2020, 5 years ago"
                  value={smokingDetails}
                  onChange={(e) => setSmokingDetails(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
            {smokingStatus === "CURRENT" && (
              <div className="mt-3">
                <Label className="text-sm">Pack-years (packs/day × years)</Label>
                <Input
                  placeholder="e.g., 10"
                  value={smokingDetails}
                  onChange={(e) => setSmokingDetails(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Alcohol Consumption */}
          <div>
            <h3 className="font-medium mb-3">Alcohol Consumption</h3>
            <RadioGroup value={alcoholConsumption} onValueChange={setAlcoholConsumption}>
              <div className="grid grid-cols-2 gap-3">
                {ALCOHOL_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`alcohol-${option.value}`} />
                    <Label htmlFor={`alcohol-${option.value}`} className="cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
            {alcoholConsumption && alcoholConsumption !== "NEVER" && (
              <div className="mt-3">
                <Label className="text-sm">Additional details (type of drinks, frequency)</Label>
                <Input
                  placeholder="e.g., Beer on weekends, wine with dinner"
                  value={alcoholDetails}
                  onChange={(e) => setAlcoholDetails(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Recreational Drug Use */}
          <div>
            <h3 className="font-medium mb-3">Recreational Drug Use</h3>
            <div className="grid grid-cols-3 gap-2">
              {RECREATIONAL_DRUGS.map((drug) => (
                <div key={drug} className="flex items-center gap-2">
                  <Checkbox
                    id={`drug-${drug}`}
                    checked={selectedDrugs.includes(drug)}
                    onCheckedChange={() => toggleSelection(drug, selectedDrugs, setSelectedDrugs)}
                  />
                  <Label htmlFor={`drug-${drug}`} className="text-sm cursor-pointer">
                    {drug}
                  </Label>
                </div>
              ))}
            </div>
            {selectedDrugs.length > 0 && !selectedDrugs.includes("None") && (
              <div className="mt-3">
                <Label className="text-sm">Additional details (frequency, duration)</Label>
                <Input
                  placeholder="e.g., Occasional cannabis use, stopped 2 years ago"
                  value={drugDetails}
                  onChange={(e) => setDrugDetails(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Exercise Habits */}
          <div>
            <h3 className="font-medium mb-3">Exercise Habits</h3>
            <div className="grid grid-cols-2 gap-2">
              {EXERCISE_OPTIONS.map((exercise) => (
                <div key={exercise} className="flex items-center gap-2">
                  <Checkbox
                    id={`exercise-${exercise}`}
                    checked={selectedExercise.includes(exercise)}
                    onCheckedChange={() =>
                      toggleSelection(exercise, selectedExercise, setSelectedExercise)
                    }
                  />
                  <Label htmlFor={`exercise-${exercise}`} className="text-sm cursor-pointer">
                    {exercise}
                  </Label>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <Label className="text-sm">Additional details</Label>
              <Input
                placeholder="e.g., 30 min walks daily, gym 3x/week"
                value={exerciseDetails}
                onChange={(e) => setExerciseDetails(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <Separator />

          {/* Diet */}
          <div>
            <h3 className="font-medium mb-3">Diet</h3>
            <div className="grid grid-cols-2 gap-2">
              {DIET_OPTIONS.map((diet) => (
                <div key={diet} className="flex items-center gap-2">
                  <Checkbox
                    id={`diet-${diet}`}
                    checked={selectedDiet.includes(diet)}
                    onCheckedChange={() => toggleSelection(diet, selectedDiet, setSelectedDiet)}
                  />
                  <Label htmlFor={`diet-${diet}`} className="text-sm cursor-pointer">
                    {diet}
                  </Label>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <Label className="text-sm">Additional details</Label>
              <Input
                placeholder="e.g., Avoids red meat, high fiber intake"
                value={dietDetails}
                onChange={(e) => setDietDetails(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <Separator />

          {/* Living Environment */}
          <div>
            <h3 className="font-medium mb-3">Living Environment</h3>
            <div className="grid grid-cols-2 gap-2">
              {LIVING_ENVIRONMENT_OPTIONS.map((env) => (
                <div key={env} className="flex items-center gap-2">
                  <Checkbox
                    id={`living-${env}`}
                    checked={selectedLiving.includes(env)}
                    onCheckedChange={() => toggleSelection(env, selectedLiving, setSelectedLiving)}
                  />
                  <Label htmlFor={`living-${env}`} className="text-sm cursor-pointer">
                    {env}
                  </Label>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <Label className="text-sm">Additional details</Label>
              <Input
                placeholder="e.g., Two-story house with dog, supportive family"
                value={livingDetails}
                onChange={(e) => setLivingDetails(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </PresetDialogLayout>
    </Dialog>
  );
}
