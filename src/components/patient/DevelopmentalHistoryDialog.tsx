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

interface DevelopmentalHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (text: string) => void;
  currentValue?: string;
}

interface MilestoneEntry {
  name: string;
  age: string;
  checked: boolean;
}

const MOTOR_MILESTONES = [
  { name: "Head Control", typical: "3-4 months" },
  { name: "Rolling Over", typical: "4-6 months" },
  { name: "Sitting Without Support", typical: "6-8 months" },
  { name: "Crawling", typical: "7-10 months" },
  { name: "Standing With Support", typical: "9-12 months" },
  { name: "Walking Independently", typical: "12-15 months" },
  { name: "Running", typical: "18-24 months" },
];

const SPEECH_MILESTONES = [
  { name: "Babbling", typical: "4-6 months" },
  { name: "First Words", typical: "12 months" },
  { name: "Two-Word Phrases", typical: "18-24 months" },
  { name: "Sentences", typical: "2-3 years" },
];

const SOCIAL_MILESTONES = [
  { name: "Social Smile", typical: "2 months" },
  { name: "Stranger Anxiety", typical: "8-12 months" },
  { name: "Parallel Play", typical: "2 years" },
  { name: "Interactive Play", typical: "3-4 years" },
];

const DEVELOPMENTAL_CONCERNS = [
  "Delayed Motor Development",
  "Speech/Language Delay",
  "Cognitive Delay",
  "Social Development Delay",
  "Learning Disability",
  "Attention Deficit",
  "Autism Spectrum Features",
  "Hearing Impairment",
  "Vision Impairment",
  "Global Developmental Delay",
];

export function DevelopmentalHistoryDialog({
  open,
  onOpenChange,
  onInsert,
  currentValue = "",
}: DevelopmentalHistoryDialogProps) {
  const [overallDevelopment, setOverallDevelopment] = useState("");
  const [motorMilestones, setMotorMilestones] = useState<MilestoneEntry[]>(
    MOTOR_MILESTONES.map((m) => ({ name: m.name, age: "", checked: false }))
  );
  const [speechMilestones, setSpeechMilestones] = useState<MilestoneEntry[]>(
    SPEECH_MILESTONES.map((m) => ({ name: m.name, age: "", checked: false }))
  );
  const [socialMilestones, setSocialMilestones] = useState<MilestoneEntry[]>(
    SOCIAL_MILESTONES.map((m) => ({ name: m.name, age: "", checked: false }))
  );
  const [concerns, setConcerns] = useState<string[]>([]);
  const [customConcerns, setCustomConcerns] = useState<string[]>([]);
  const [newCustom, setNewCustom] = useState("");

  const handleAddCustom = () => {
    if (newCustom.trim()) {
      setCustomConcerns((prev) => [...prev, newCustom.trim()]);
      setNewCustom("");
    }
  };

  const handleRemoveCustom = (index: number) => {
    setCustomConcerns((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleConcern = (concern: string) => {
    setConcerns((prev) =>
      prev.includes(concern)
        ? prev.filter((c) => c !== concern)
        : [...prev, concern]
    );
  };

  const updateMilestone = (
    setFn: React.Dispatch<React.SetStateAction<MilestoneEntry[]>>,
    index: number,
    updates: Partial<MilestoneEntry>
  ) => {
    setFn((prev) =>
      prev.map((m, i) => (i === index ? { ...m, ...updates } : m))
    );
  };

  const handleInsert = () => {
    const parts: string[] = [];

    if (overallDevelopment) {
      parts.push(`Overall: ${overallDevelopment}`);
    }

    const selectedMotor = motorMilestones
      .filter((m) => m.checked)
      .map((m) => (m.age ? `${m.name} at ${m.age}` : m.name));
    if (selectedMotor.length > 0) {
      parts.push(`Motor: ${selectedMotor.join(", ")}`);
    }

    const selectedSpeech = speechMilestones
      .filter((m) => m.checked)
      .map((m) => (m.age ? `${m.name} at ${m.age}` : m.name));
    if (selectedSpeech.length > 0) {
      parts.push(`Speech: ${selectedSpeech.join(", ")}`);
    }

    const selectedSocial = socialMilestones
      .filter((m) => m.checked)
      .map((m) => (m.age ? `${m.name} at ${m.age}` : m.name));
    if (selectedSocial.length > 0) {
      parts.push(`Social: ${selectedSocial.join(", ")}`);
    }

    const allConcerns = [...concerns, ...customConcerns];
    if (allConcerns.length > 0) {
      parts.push(`Concerns: ${allConcerns.join(", ")}`);
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
    setOverallDevelopment("");
    setMotorMilestones(
      MOTOR_MILESTONES.map((m) => ({ name: m.name, age: "", checked: false }))
    );
    setSpeechMilestones(
      SPEECH_MILESTONES.map((m) => ({ name: m.name, age: "", checked: false }))
    );
    setSocialMilestones(
      SOCIAL_MILESTONES.map((m) => ({ name: m.name, age: "", checked: false }))
    );
    setConcerns([]);
    setCustomConcerns([]);
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
        title="Insert Developmental History"
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
          {/* Overall Development */}
          <div className="space-y-2 border-b pb-4">
            <Label className="text-sm font-medium">Overall Development</Label>
            <Select value={overallDevelopment} onValueChange={setOverallDevelopment}>
              <SelectTrigger>
                <SelectValue placeholder="Select overall development status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Normal for age">Normal for age</SelectItem>
                <SelectItem value="Mildly delayed">Mildly delayed</SelectItem>
                <SelectItem value="Moderately delayed">Moderately delayed</SelectItem>
                <SelectItem value="Severely delayed">Severely delayed</SelectItem>
                <SelectItem value="Advanced for age">Advanced for age</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Other Concerns */}
          <div className="space-y-2 border-b pb-4">
            <Label className="text-sm font-medium">Add Other Concern</Label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter other concern..."
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

            {customConcerns.map((concern, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 rounded-md bg-muted/30"
              >
                <span className="flex-1 text-sm">{concern}</span>
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

          {/* Motor Milestones */}
          <div className="space-y-2 border-b pb-4">
            <Label className="text-sm font-medium">Motor Milestones</Label>
            <div className="grid grid-cols-1 gap-2">
              {motorMilestones.map((milestone, index) => (
                <div
                  key={milestone.name}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                >
                  <Checkbox
                    id={`motor-${index}`}
                    checked={milestone.checked}
                    onCheckedChange={(checked) =>
                      updateMilestone(setMotorMilestones, index, {
                        checked: checked as boolean,
                      })
                    }
                  />
                  <Label
                    htmlFor={`motor-${index}`}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {milestone.name}
                    <span className="text-xs text-muted-foreground ml-2">
                      (typical: {MOTOR_MILESTONES[index].typical})
                    </span>
                  </Label>
                  {milestone.checked && (
                    <Input
                      placeholder="Age achieved"
                      value={milestone.age}
                      onChange={(e) =>
                        updateMilestone(setMotorMilestones, index, {
                          age: e.target.value,
                        })
                      }
                      className="w-32 h-8 text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Speech Milestones */}
          <div className="space-y-2 border-b pb-4">
            <Label className="text-sm font-medium">Speech/Language Milestones</Label>
            <div className="grid grid-cols-1 gap-2">
              {speechMilestones.map((milestone, index) => (
                <div
                  key={milestone.name}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                >
                  <Checkbox
                    id={`speech-${index}`}
                    checked={milestone.checked}
                    onCheckedChange={(checked) =>
                      updateMilestone(setSpeechMilestones, index, {
                        checked: checked as boolean,
                      })
                    }
                  />
                  <Label
                    htmlFor={`speech-${index}`}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {milestone.name}
                    <span className="text-xs text-muted-foreground ml-2">
                      (typical: {SPEECH_MILESTONES[index].typical})
                    </span>
                  </Label>
                  {milestone.checked && (
                    <Input
                      placeholder="Age achieved"
                      value={milestone.age}
                      onChange={(e) =>
                        updateMilestone(setSpeechMilestones, index, {
                          age: e.target.value,
                        })
                      }
                      className="w-32 h-8 text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Social Milestones */}
          <div className="space-y-2 border-b pb-4">
            <Label className="text-sm font-medium">Social Milestones</Label>
            <div className="grid grid-cols-1 gap-2">
              {socialMilestones.map((milestone, index) => (
                <div
                  key={milestone.name}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                >
                  <Checkbox
                    id={`social-${index}`}
                    checked={milestone.checked}
                    onCheckedChange={(checked) =>
                      updateMilestone(setSocialMilestones, index, {
                        checked: checked as boolean,
                      })
                    }
                  />
                  <Label
                    htmlFor={`social-${index}`}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {milestone.name}
                    <span className="text-xs text-muted-foreground ml-2">
                      (typical: {SOCIAL_MILESTONES[index].typical})
                    </span>
                  </Label>
                  {milestone.checked && (
                    <Input
                      placeholder="Age achieved"
                      value={milestone.age}
                      onChange={(e) =>
                        updateMilestone(setSocialMilestones, index, {
                          age: e.target.value,
                        })
                      }
                      className="w-32 h-8 text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Developmental Concerns */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Developmental Concerns</Label>
            <div className="grid grid-cols-1 gap-2">
              {DEVELOPMENTAL_CONCERNS.map((concern) => (
                <div
                  key={concern}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                >
                  <Checkbox
                    id={`concern-${concern}`}
                    checked={concerns.includes(concern)}
                    onCheckedChange={() => toggleConcern(concern)}
                  />
                  <Label
                    htmlFor={`concern-${concern}`}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {concern}
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
