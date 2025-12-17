import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";
import { PresetDialogLayout } from "@/components/patient/preset/PresetDialogLayout";

interface MenstrualPregnancyHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (text: string) => void;
  currentValue?: string;
}

interface MenstrualInfo {
  ageAtMenarche: string;
  lastMenstrualPeriod: string;
  cycleLength: string;
  periodDuration: string;
  menstrualFlow: string;
  menopausalStatus: string;
  ageAtMenopause: string;
}

interface PregnancyInfo {
  gravida: string;
  para: string;
  abortions: string;
  livingChildren: string;
  ectopic: string;
}

const MENSTRUAL_CONDITIONS = [
  "Regular cycles",
  "Irregular cycles",
  "Dysmenorrhea (painful periods)",
  "Menorrhagia (heavy bleeding)",
  "Oligomenorrhea (infrequent periods)",
  "Amenorrhea (absent periods)",
  "Premenstrual syndrome (PMS)",
  "Premenstrual dysphoric disorder (PMDD)",
  "Intermenstrual bleeding",
  "Postcoital bleeding",
  "Endometriosis",
  "Polycystic ovary syndrome (PCOS)",
  "Uterine fibroids",
  "Ovarian cysts",
];

const PREGNANCY_CONDITIONS = [
  "Gestational diabetes",
  "Preeclampsia",
  "Eclampsia",
  "Placenta previa",
  "Placental abruption",
  "Preterm labor",
  "Ectopic pregnancy",
  "Miscarriage",
  "Stillbirth",
  "Cesarean section",
  "Postpartum hemorrhage",
  "Postpartum depression",
  "Hyperemesis gravidarum",
  "HELLP syndrome",
];

const CONTRACEPTIVE_METHODS = [
  "Oral contraceptives (birth control pills)",
  "IUD (Intrauterine device)",
  "Hormonal implant",
  "Depo-Provera (injection)",
  "Patch",
  "Vaginal ring",
  "Condoms",
  "Diaphragm",
  "Natural family planning",
  "Tubal ligation",
  "Partner vasectomy",
  "None",
];

export function MenstrualPregnancyHistoryDialog({
  open,
  onOpenChange,
  onInsert,
  currentValue,
}: MenstrualPregnancyHistoryDialogProps) {
  const [menstrualInfo, setMenstrualInfo] = useState<MenstrualInfo>({
    ageAtMenarche: "",
    lastMenstrualPeriod: "",
    cycleLength: "",
    periodDuration: "",
    menstrualFlow: "",
    menopausalStatus: "",
    ageAtMenopause: "",
  });

  const [pregnancyInfo, setPregnancyInfo] = useState<PregnancyInfo>({
    gravida: "",
    para: "",
    abortions: "",
    livingChildren: "",
    ectopic: "",
  });

  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedPregnancyConditions, setSelectedPregnancyConditions] = useState<string[]>([]);
  const [selectedContraceptive, setSelectedContraceptive] = useState<string>("");
  const [customCondition, setCustomCondition] = useState("");

  const toggleCondition = (condition: string) => {
    setSelectedConditions((prev) =>
      prev.includes(condition) ? prev.filter((c) => c !== condition) : [...prev, condition]
    );
  };

  const togglePregnancyCondition = (condition: string) => {
    setSelectedPregnancyConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition]
    );
  };

  const addCustomCondition = () => {
    if (customCondition.trim() && !selectedConditions.includes(customCondition.trim())) {
      setSelectedConditions([...selectedConditions, customCondition.trim()]);
      setCustomCondition("");
    }
  };

  const handleInsert = () => {
    const parts: string[] = [];

    // Menstrual history
    if (menstrualInfo.ageAtMenarche) {
      parts.push(`Menarche at age ${menstrualInfo.ageAtMenarche}`);
    }
    if (menstrualInfo.lastMenstrualPeriod) {
      parts.push(`LMP: ${menstrualInfo.lastMenstrualPeriod}`);
    }
    if (menstrualInfo.cycleLength) {
      parts.push(`Cycle length: ${menstrualInfo.cycleLength} days`);
    }
    if (menstrualInfo.periodDuration) {
      parts.push(`Period duration: ${menstrualInfo.periodDuration} days`);
    }
    if (menstrualInfo.menstrualFlow) {
      parts.push(`Flow: ${menstrualInfo.menstrualFlow}`);
    }
    if (menstrualInfo.menopausalStatus) {
      parts.push(`Menopausal status: ${menstrualInfo.menopausalStatus}`);
    }
    if (menstrualInfo.ageAtMenopause) {
      parts.push(`Menopause at age ${menstrualInfo.ageAtMenopause}`);
    }

    // Pregnancy history (GTPAL)
    if (pregnancyInfo.gravida || pregnancyInfo.para) {
      const gtpal = [];
      if (pregnancyInfo.gravida) gtpal.push(`G${pregnancyInfo.gravida}`);
      if (pregnancyInfo.para) gtpal.push(`P${pregnancyInfo.para}`);
      if (pregnancyInfo.abortions) gtpal.push(`A${pregnancyInfo.abortions}`);
      if (pregnancyInfo.livingChildren) gtpal.push(`L${pregnancyInfo.livingChildren}`);
      if (pregnancyInfo.ectopic) gtpal.push(`E${pregnancyInfo.ectopic}`);
      parts.push(`Obstetric history: ${gtpal.join("")}`);
    }

    // Menstrual conditions
    if (selectedConditions.length > 0) {
      parts.push(`Menstrual conditions: ${selectedConditions.join(", ")}`);
    }

    // Pregnancy complications
    if (selectedPregnancyConditions.length > 0) {
      parts.push(`Pregnancy complications: ${selectedPregnancyConditions.join(", ")}`);
    }

    // Contraception
    if (selectedContraceptive) {
      parts.push(`Contraception: ${selectedContraceptive}`);
    }

    const newText = parts.join(". ");
    const finalText = currentValue ? `${currentValue}. ${newText}` : newText;

    onInsert(finalText);
    onOpenChange(false);

    // Reset state
    setMenstrualInfo({
      ageAtMenarche: "",
      lastMenstrualPeriod: "",
      cycleLength: "",
      periodDuration: "",
      menstrualFlow: "",
      menopausalStatus: "",
      ageAtMenopause: "",
    });
    setPregnancyInfo({
      gravida: "",
      para: "",
      abortions: "",
      livingChildren: "",
      ectopic: "",
    });
    setSelectedConditions([]);
    setSelectedPregnancyConditions([]);
    setSelectedContraceptive("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <PresetDialogLayout
        title="Menstrual and Pregnancy History"
        contentClassName="max-w-2xl"
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
          {/* Menstrual Information */}
          <div>
            <h3 className="font-medium mb-3">Menstrual Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Age at Menarche</Label>
                <Input
                  placeholder="e.g., 12"
                  value={menstrualInfo.ageAtMenarche}
                  onChange={(e) =>
                    setMenstrualInfo({ ...menstrualInfo, ageAtMenarche: e.target.value })
                  }
                />
              </div>
              <div>
                <Label className="text-sm">Last Menstrual Period</Label>
                <Input
                  type="date"
                  value={menstrualInfo.lastMenstrualPeriod}
                  onChange={(e) =>
                    setMenstrualInfo({ ...menstrualInfo, lastMenstrualPeriod: e.target.value })
                  }
                />
              </div>
              <div>
                <Label className="text-sm">Cycle Length (days)</Label>
                <Input
                  placeholder="e.g., 28"
                  value={menstrualInfo.cycleLength}
                  onChange={(e) =>
                    setMenstrualInfo({ ...menstrualInfo, cycleLength: e.target.value })
                  }
                />
              </div>
              <div>
                <Label className="text-sm">Period Duration (days)</Label>
                <Input
                  placeholder="e.g., 5"
                  value={menstrualInfo.periodDuration}
                  onChange={(e) =>
                    setMenstrualInfo({ ...menstrualInfo, periodDuration: e.target.value })
                  }
                />
              </div>
              <div>
                <Label className="text-sm">Menstrual Flow</Label>
                <Input
                  placeholder="Light/Moderate/Heavy"
                  value={menstrualInfo.menstrualFlow}
                  onChange={(e) =>
                    setMenstrualInfo({ ...menstrualInfo, menstrualFlow: e.target.value })
                  }
                  list="flow-options"
                />
                <datalist id="flow-options">
                  <option value="Light" />
                  <option value="Moderate" />
                  <option value="Heavy" />
                </datalist>
              </div>
              <div>
                <Label className="text-sm">Menopausal Status</Label>
                <Input
                  placeholder="Pre/Peri/Post-menopausal"
                  value={menstrualInfo.menopausalStatus}
                  onChange={(e) =>
                    setMenstrualInfo({ ...menstrualInfo, menopausalStatus: e.target.value })
                  }
                  list="menopause-options"
                />
                <datalist id="menopause-options">
                  <option value="Premenopausal" />
                  <option value="Perimenopausal" />
                  <option value="Postmenopausal" />
                </datalist>
              </div>
              {menstrualInfo.menopausalStatus?.toLowerCase().includes("post") && (
                <div>
                  <Label className="text-sm">Age at Menopause</Label>
                  <Input
                    placeholder="e.g., 52"
                    value={menstrualInfo.ageAtMenopause}
                    onChange={(e) =>
                      setMenstrualInfo({ ...menstrualInfo, ageAtMenopause: e.target.value })
                    }
                  />
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Obstetric History (GTPAL) */}
          <div>
            <h3 className="font-medium mb-3">Obstetric History (GTPAL)</h3>
            <div className="grid grid-cols-5 gap-2">
              <div>
                <Label className="text-sm">Gravida (G)</Label>
                <Input
                  placeholder="0"
                  value={pregnancyInfo.gravida}
                  onChange={(e) =>
                    setPregnancyInfo({ ...pregnancyInfo, gravida: e.target.value })
                  }
                />
              </div>
              <div>
                <Label className="text-sm">Para (P)</Label>
                <Input
                  placeholder="0"
                  value={pregnancyInfo.para}
                  onChange={(e) =>
                    setPregnancyInfo({ ...pregnancyInfo, para: e.target.value })
                  }
                />
              </div>
              <div>
                <Label className="text-sm">Abortions (A)</Label>
                <Input
                  placeholder="0"
                  value={pregnancyInfo.abortions}
                  onChange={(e) =>
                    setPregnancyInfo({ ...pregnancyInfo, abortions: e.target.value })
                  }
                />
              </div>
              <div>
                <Label className="text-sm">Living (L)</Label>
                <Input
                  placeholder="0"
                  value={pregnancyInfo.livingChildren}
                  onChange={(e) =>
                    setPregnancyInfo({ ...pregnancyInfo, livingChildren: e.target.value })
                  }
                />
              </div>
              <div>
                <Label className="text-sm">Ectopic (E)</Label>
                <Input
                  placeholder="0"
                  value={pregnancyInfo.ectopic}
                  onChange={(e) =>
                    setPregnancyInfo({ ...pregnancyInfo, ectopic: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Menstrual Conditions */}
          <div>
            <h3 className="font-medium mb-3">Menstrual Conditions</h3>
            <div className="grid grid-cols-2 gap-2">
              {MENSTRUAL_CONDITIONS.map((condition) => (
                <div key={condition} className="flex items-center gap-2">
                  <Checkbox
                    id={`menstrual-${condition}`}
                    checked={selectedConditions.includes(condition)}
                    onCheckedChange={() => toggleCondition(condition)}
                  />
                  <Label htmlFor={`menstrual-${condition}`} className="text-sm cursor-pointer">
                    {condition}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Pregnancy Complications */}
          <div>
            <h3 className="font-medium mb-3">Pregnancy Complications</h3>
            <div className="grid grid-cols-2 gap-2">
              {PREGNANCY_CONDITIONS.map((condition) => (
                <div key={condition} className="flex items-center gap-2">
                  <Checkbox
                    id={`pregnancy-${condition}`}
                    checked={selectedPregnancyConditions.includes(condition)}
                    onCheckedChange={() => togglePregnancyCondition(condition)}
                  />
                  <Label htmlFor={`pregnancy-${condition}`} className="text-sm cursor-pointer">
                    {condition}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Contraception */}
          <div>
            <h3 className="font-medium mb-3">Current Contraception</h3>
            <div className="grid grid-cols-2 gap-2">
              {CONTRACEPTIVE_METHODS.map((method) => (
                <div key={method} className="flex items-center gap-2">
                  <Checkbox
                    id={`contraception-${method}`}
                    checked={selectedContraceptive === method}
                    onCheckedChange={(checked) => setSelectedContraceptive(checked ? method : "")}
                  />
                  <Label htmlFor={`contraception-${method}`} className="text-sm cursor-pointer">
                    {method}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Custom Condition */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Add Custom Condition</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter custom condition"
                value={customCondition}
                onChange={(e) => setCustomCondition(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addCustomCondition}
                disabled={!customCondition.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </PresetDialogLayout>
    </Dialog>
  );
}
