import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface HPIBuilderProps {
  open: boolean;
  onClose: () => void;
  currentHPI: string;
  onUpdate: (newHPI: string) => void;
}

export default function HPIBuilder({ open, onClose, currentHPI, onUpdate }: HPIBuilderProps) {
  const [complaints, setComplaints] = useState<string[]>(currentHPI ? [currentHPI] : []);
  const [complaintData, setComplaintData] = useState({
    complaint: "",
    duration: "",
    onset: "",
    severity: "",
    pattern: "",
    location: "",
    aggravatingFactor: "",
    alleviatingFactor: "",
    associatedSymptoms: "",
    impactOnDailyLife: "",
    previousEpisode: "",
    knownCauses: "",
    patientPerspective: "",
    additionalInfo: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setComplaintData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddComplaint = () => {
    if (!complaintData.complaint) {
      toast({
        title: "Validation Error",
        description: "Please enter a complaint",
        variant: "destructive",
      });
      return;
    }

    // Build complaint summary
    const parts: string[] = [];
    if (complaintData.complaint) parts.push(complaintData.complaint);
    if (complaintData.duration) parts.push(`Duration: ${complaintData.duration}`);
    if (complaintData.onset) parts.push(`Onset: ${complaintData.onset}`);
    if (complaintData.severity) parts.push(`Severity: ${complaintData.severity}/10`);
    if (complaintData.pattern) parts.push(`Pattern: ${complaintData.pattern}`);
    if (complaintData.location) parts.push(`Location: ${complaintData.location}`);
    if (complaintData.aggravatingFactor) parts.push(`Aggravating factors: ${complaintData.aggravatingFactor}`);
    if (complaintData.alleviatingFactor) parts.push(`Alleviating factors: ${complaintData.alleviatingFactor}`);
    if (complaintData.associatedSymptoms) parts.push(`Associated symptoms: ${complaintData.associatedSymptoms}`);
    if (complaintData.impactOnDailyLife) parts.push(`Impact on daily life: ${complaintData.impactOnDailyLife}`);
    if (complaintData.previousEpisode) parts.push(`Previous episodes: ${complaintData.previousEpisode}`);
    if (complaintData.knownCauses) parts.push(`Known causes: ${complaintData.knownCauses}`);
    if (complaintData.patientPerspective) parts.push(`Patient perspective: ${complaintData.patientPerspective}`);
    if (complaintData.additionalInfo) parts.push(`Additional info: ${complaintData.additionalInfo}`);

    const complaintSummary = parts.join(". ") + ".";
    const newComplaints = [...complaints, complaintSummary];
    setComplaints(newComplaints);

    // Update parent form
    const updatedHPI = newComplaints.join("\n\n");
    onUpdate(updatedHPI);

    // Reset form
    setComplaintData({
      complaint: "",
      duration: "",
      onset: "",
      severity: "",
      pattern: "",
      location: "",
      aggravatingFactor: "",
      alleviatingFactor: "",
      associatedSymptoms: "",
      impactOnDailyLife: "",
      previousEpisode: "",
      knownCauses: "",
      patientPerspective: "",
      additionalInfo: "",
    });

    toast({
      title: "Success",
      description: "Complaint added to HPI",
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>HPI Builder - Add Complaint</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="complaint">Complaint *</Label>
              <Input
                id="complaint"
                value={complaintData.complaint}
                onChange={(e) => handleInputChange("complaint", e.target.value)}
                placeholder="e.g., Headache"
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={complaintData.duration}
                onChange={(e) => handleInputChange("duration", e.target.value)}
                placeholder="e.g., 3 days"
              />
            </div>
            <div>
              <Label htmlFor="onset">Onset</Label>
              <Select value={complaintData.onset} onValueChange={(value) => handleInputChange("onset", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select onset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sudden">Sudden</SelectItem>
                  <SelectItem value="gradual">Gradual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="severity">Severity (1-10)</Label>
              <Input
                id="severity"
                type="number"
                min="1"
                max="10"
                value={complaintData.severity}
                onChange={(e) => handleInputChange("severity", e.target.value)}
                placeholder="e.g., 7"
              />
            </div>
            <div>
              <Label htmlFor="pattern">Pattern</Label>
              <Select value={complaintData.pattern} onValueChange={(value) => handleInputChange("pattern", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pattern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="constant">Constant</SelectItem>
                  <SelectItem value="intermittent">Intermittent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={complaintData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="e.g., Frontal region"
              />
            </div>
            <div>
              <Label htmlFor="aggravatingFactor">Aggravating Factors</Label>
              <Input
                id="aggravatingFactor"
                value={complaintData.aggravatingFactor}
                onChange={(e) => handleInputChange("aggravatingFactor", e.target.value)}
                placeholder="e.g., Bright lights"
              />
            </div>
            <div>
              <Label htmlFor="alleviatingFactor">Alleviating Factors</Label>
              <Input
                id="alleviatingFactor"
                value={complaintData.alleviatingFactor}
                onChange={(e) => handleInputChange("alleviatingFactor", e.target.value)}
                placeholder="e.g., Rest"
              />
            </div>
            <div>
              <Label htmlFor="associatedSymptoms">Associated Symptoms</Label>
              <Input
                id="associatedSymptoms"
                value={complaintData.associatedSymptoms}
                onChange={(e) => handleInputChange("associatedSymptoms", e.target.value)}
                placeholder="e.g., Nausea, photophobia"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="impactOnDailyLife">Impact on Daily Life</Label>
              <Textarea
                id="impactOnDailyLife"
                value={complaintData.impactOnDailyLife}
                onChange={(e) => handleInputChange("impactOnDailyLife", e.target.value)}
                placeholder="Describe how this affects daily activities..."
              />
            </div>
            <div>
              <Label htmlFor="previousEpisode">Previous Episodes</Label>
              <Input
                id="previousEpisode"
                value={complaintData.previousEpisode}
                onChange={(e) => handleInputChange("previousEpisode", e.target.value)}
                placeholder="e.g., Similar episode last year"
              />
            </div>
            <div>
              <Label htmlFor="knownCauses">Known Causes</Label>
              <Input
                id="knownCauses"
                value={complaintData.knownCauses}
                onChange={(e) => handleInputChange("knownCauses", e.target.value)}
                placeholder="e.g., Stress, lack of sleep"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="patientPerspective">Patient Perspective</Label>
              <Textarea
                id="patientPerspective"
                value={complaintData.patientPerspective}
                onChange={(e) => handleInputChange("patientPerspective", e.target.value)}
                placeholder="Patient's thoughts or concerns about the complaint..."
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="additionalInfo">Additional Information</Label>
              <Textarea
                id="additionalInfo"
                value={complaintData.additionalInfo}
                onChange={(e) => handleInputChange("additionalInfo", e.target.value)}
                placeholder="Any other relevant information..."
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAddComplaint}>Add Complaint</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}