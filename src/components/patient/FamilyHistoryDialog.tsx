import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2 } from "lucide-react";
import { PresetDialogLayout } from "@/components/patient/preset/PresetDialogLayout";

interface FamilyHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentValue: string;
  onInsert: (value: string) => void;
}

interface FamilyMember {
  id: string;
  relation: string;
  gender?: "male" | "female";
  status: "alive" | "deceased";
  ageAtDeath?: string;
  causeOfDeath?: string[];
  otherCauseOfDeath?: string;
  chronicConditions?: string[];
  cancerType?: string;
  otherChronicCondition?: string;
}

const DEATH_CAUSES = [
  "Heart Disease",
  "Cancer",
  "Stroke",
  "Diabetes Complications",
  "Old Age",
  "Accident",
  "Kidney Disease",
  "Liver Disease",
  "Respiratory Disease",
  "Infection/Sepsis",
];

const CHRONIC_CONDITIONS = [
  "Heart Attack",
  "Stroke",
  "Hypertension",
  "Diabetes",
  "Cancer",
  "Thyroid Disease",
  "Kidney Disease",
  "Liver Disease",
  "Asthma/COPD",
  "Arthritis",
  "Mental Health Disorder",
  "Alzheimer's/Dementia",
];

const FamilyHistoryDialog = ({
  open,
  onOpenChange,
  currentValue,
  onInsert,
}: FamilyHistoryDialogProps) => {
  const [members, setMembers] = useState<FamilyMember[]>([
    { id: "father", relation: "Father", status: "alive", chronicConditions: [], causeOfDeath: [] },
    { id: "mother", relation: "Mother", status: "alive", chronicConditions: [], causeOfDeath: [] },
  ]);
  const [siblingCount, setSiblingCount] = useState(0);
  const [childCount, setChildCount] = useState(0);
  const [hasSpouse, setHasSpouse] = useState(false);

  const addSpouse = () => {
    if (hasSpouse) return;
    setMembers([
      ...members,
      {
        id: "spouse",
        relation: "Spouse",
        status: "alive",
        chronicConditions: [],
        causeOfDeath: [],
      },
    ]);
    setHasSpouse(true);
  };

  const addSibling = (gender: "male" | "female") => {
    const newId = `sibling-${siblingCount + 1}`;
    const genderLabel = gender === "male" ? "Brother" : "Sister";
    setMembers([
      ...members,
      {
        id: newId,
        relation: `${genderLabel} ${siblingCount + 1}`,
        gender,
        status: "alive",
        chronicConditions: [],
        causeOfDeath: [],
      },
    ]);
    setSiblingCount(siblingCount + 1);
  };

  const addChild = (gender: "male" | "female") => {
    const newId = `child-${childCount + 1}`;
    const genderLabel = gender === "male" ? "Son" : "Daughter";
    setMembers([
      ...members,
      {
        id: newId,
        relation: `${genderLabel} ${childCount + 1}`,
        gender,
        status: "alive",
        chronicConditions: [],
        causeOfDeath: [],
      },
    ]);
    setChildCount(childCount + 1);
  };

  const removeMember = (id: string) => {
    if (id === "spouse") {
      setHasSpouse(false);
    }
    setMembers(members.filter((m) => m.id !== id));
  };

  const updateMember = (id: string, updates: Partial<FamilyMember>) => {
    setMembers(members.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  const toggleCondition = (
    id: string,
    condition: string,
    type: "chronic" | "death"
  ) => {
    const member = members.find((m) => m.id === id);
    if (!member) return;

    if (type === "chronic") {
      const conditions = member.chronicConditions || [];
      const newConditions = conditions.includes(condition)
        ? conditions.filter((c) => c !== condition)
        : [...conditions, condition];
      updateMember(id, { chronicConditions: newConditions });
    } else {
      const causes = member.causeOfDeath || [];
      const newCauses = causes.includes(condition)
        ? causes.filter((c) => c !== condition)
        : [...causes, condition];
      updateMember(id, { causeOfDeath: newCauses });
    }
  };

  const handleInsert = () => {
    const entries: string[] = [];

    members.forEach((member) => {
      let entry = `${member.relation}: `;

      if (member.status === "deceased") {
        entry += "Deceased";
        if (member.ageAtDeath) {
          entry += ` at age ${member.ageAtDeath}`;
        }
        const causes = [...(member.causeOfDeath || [])];
        if (member.otherCauseOfDeath) {
          causes.push(member.otherCauseOfDeath);
        }
        if (causes.length > 0) {
          entry += ` - ${causes.join(", ")}`;
        }
      } else {
        entry += "Alive";
        const conditions = [...(member.chronicConditions || [])];
        if (member.cancerType && conditions.includes("Cancer")) {
          const idx = conditions.indexOf("Cancer");
          conditions[idx] = `Cancer (${member.cancerType})`;
        }
        if (member.otherChronicCondition) {
          conditions.push(member.otherChronicCondition);
        }
        if (conditions.length > 0) {
          entry += ` - History of: ${conditions.join(", ")}`;
        }
      }

      entries.push(entry);
    });

    const newValue = entries.join("\n");
    const finalValue = currentValue ? `${currentValue}\n${newValue}` : newValue;

    onInsert(finalValue);
    onOpenChange(false);

    // Reset state
    setMembers([
      { id: "father", relation: "Father", status: "alive", chronicConditions: [], causeOfDeath: [] },
      { id: "mother", relation: "Mother", status: "alive", chronicConditions: [], causeOfDeath: [] },
    ]);
    setSiblingCount(0);
    setChildCount(0);
    setHasSpouse(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <PresetDialogLayout
        title="Family History"
        maxHeightClassName="h-[85vh]"
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
          {members.map((member) => (
            <div key={member.id} className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">{member.relation}</Label>
                {(member.id.startsWith("sibling") || member.id.startsWith("child") || member.id === "spouse") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMember(member.id)}
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <RadioGroup
                value={member.status}
                onValueChange={(value: "alive" | "deceased") =>
                  updateMember(member.id, { status: value })
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="alive" id={`${member.id}-alive`} />
                  <Label htmlFor={`${member.id}-alive`}>Alive</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="deceased" id={`${member.id}-deceased`} />
                  <Label htmlFor={`${member.id}-deceased`}>Deceased</Label>
                </div>
              </RadioGroup>

              {member.status === "deceased" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="w-24 text-sm">Age at death:</Label>
                    <Input
                      type="number"
                      placeholder="Age"
                      className="w-24"
                      value={member.ageAtDeath || ""}
                      onChange={(e) =>
                        updateMember(member.id, { ageAtDeath: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Cause of death:</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {DEATH_CAUSES.map((cause) => (
                        <div key={cause} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${member.id}-death-${cause}`}
                            checked={(member.causeOfDeath || []).includes(cause)}
                            onCheckedChange={() =>
                              toggleCondition(member.id, cause, "death")
                            }
                          />
                          <Label
                            htmlFor={`${member.id}-death-${cause}`}
                            className="text-sm font-normal"
                          >
                            {cause}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2">
                      <Input
                        placeholder="Other cause..."
                        value={member.otherCauseOfDeath || ""}
                        onChange={(e) =>
                          updateMember(member.id, {
                            otherCauseOfDeath: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Label className="text-sm">History of chronic conditions:</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {CHRONIC_CONDITIONS.map((condition) => (
                      <div key={condition} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${member.id}-chronic-${condition}`}
                          checked={(member.chronicConditions || []).includes(condition)}
                          onCheckedChange={() =>
                            toggleCondition(member.id, condition, "chronic")
                          }
                        />
                        <Label
                          htmlFor={`${member.id}-chronic-${condition}`}
                          className="text-sm font-normal"
                        >
                          {condition}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {(member.chronicConditions || []).includes("Cancer") && (
                    <div className="flex items-center gap-2 mt-2">
                      <Label className="text-sm whitespace-nowrap">Cancer type:</Label>
                      <Input
                        placeholder="e.g., Lung, Breast, Colon..."
                        value={member.cancerType || ""}
                        onChange={(e) =>
                          updateMember(member.id, { cancerType: e.target.value })
                        }
                      />
                    </div>
                  )}
                  <div className="mt-2">
                    <Input
                      placeholder="Other condition..."
                      value={member.otherChronicCondition || ""}
                      onChange={(e) =>
                        updateMember(member.id, {
                          otherChronicCondition: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={addSpouse}
                className="flex-1"
                disabled={hasSpouse}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Spouse
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => addSibling("male")}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Brother
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => addSibling("female")}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Sister
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => addChild("male")}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Son
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => addChild("female")}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Daughter
              </Button>
            </div>
          </div>
        </div>
      </PresetDialogLayout>
    </Dialog>
  );
};

export default FamilyHistoryDialog;
