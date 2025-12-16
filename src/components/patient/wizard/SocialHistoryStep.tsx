import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ListPlus } from "lucide-react";
import { SocialHistoryDialog, SocialHistoryData } from "@/components/patient/SocialHistoryDialog";

interface SocialHistoryStepProps {
  register: any;
  watch: any;
  setValue: any;
}

export const SocialHistoryStep = ({ register, watch, setValue }: SocialHistoryStepProps) => {
  const [showSocialHistoryDialog, setShowSocialHistoryDialog] = useState(false);

  const smokingStatus = watch("smoking_status");
  const alcoholConsumption = watch("alcohol_consumption");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Social History</CardTitle>
            <CardDescription>Lifestyle factors and occupational information</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowSocialHistoryDialog(true)}
          >
            <ListPlus className="h-4 w-4 mr-2" />
            Use Preset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <SocialHistoryDialog
          open={showSocialHistoryDialog}
          onOpenChange={setShowSocialHistoryDialog}
          onInsert={(data: SocialHistoryData) => {
            if (data.smokingStatus) {
              setValue("smoking_status", data.smokingStatus as "NEVER" | "FORMER" | "CURRENT");
            }
            if (data.alcoholConsumption) {
              setValue("alcohol_consumption", data.alcoholConsumption as "NEVER" | "OCCASIONAL" | "MODERATE" | "HEAVY");
            }
            if (data.recreationalDrugUse) {
              setValue("recreational_drug_use", data.recreationalDrugUse);
            }
            if (data.exerciseHabits) {
              setValue("exercise_habits", data.exerciseHabits);
            }
            if (data.diet) {
              setValue("diet", data.diet);
            }
            if (data.livingEnvironment) {
              setValue("living_environment", data.livingEnvironment);
            }
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="smoking_status">Smoking Status</Label>
            <Select
              value={smokingStatus}
              onValueChange={(value) => setValue("smoking_status", value as "NEVER" | "FORMER" | "CURRENT")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEVER">Never</SelectItem>
                <SelectItem value="FORMER">Former Smoker</SelectItem>
                <SelectItem value="CURRENT">Current Smoker</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="alcohol_consumption">Alcohol Consumption</Label>
            <Select
              value={alcoholConsumption}
              onValueChange={(value) => setValue("alcohol_consumption", value as "NEVER" | "OCCASIONAL" | "MODERATE" | "HEAVY")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEVER">Never</SelectItem>
                <SelectItem value="OCCASIONAL">Occasional</SelectItem>
                <SelectItem value="MODERATE">Moderate</SelectItem>
                <SelectItem value="HEAVY">Heavy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="recreational_drug_use">Recreational Drug Use</Label>
          <Textarea
            id="recreational_drug_use"
            placeholder="Document any recreational drug use..."
            {...register("recreational_drug_use")}
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="exercise_habits">Exercise Habits</Label>
          <Textarea
            id="exercise_habits"
            placeholder="Describe exercise routine and frequency..."
            {...register("exercise_habits")}
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="diet">Diet</Label>
          <Textarea
            id="diet"
            placeholder="Describe dietary habits and restrictions..."
            {...register("diet")}
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="occupation">Occupation</Label>
          <Input
            id="occupation"
            placeholder="Enter occupation"
            {...register("occupation")}
          />
        </div>

        <div>
          <Label htmlFor="living_environment">Living Environment</Label>
          <Textarea
            id="living_environment"
            placeholder="Describe living conditions, housing type, etc..."
            {...register("living_environment")}
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
};
