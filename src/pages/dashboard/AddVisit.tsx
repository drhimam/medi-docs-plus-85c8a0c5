import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubUser } from "@/hooks/useSubUser";
import { useActivityLog } from "@/hooks/useActivityLog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import HPIBuilder from "@/components/visit/HPIBuilder";
import ROSBuilder from "@/components/visit/ROSBuilder";
import PhysicalExaminationDialog from "@/components/visit/PhysicalExaminationDialog";
import InvestigationBuilderDialog from "@/components/visit/InvestigationBuilderDialog";
import DocumentUploadDialog from "@/components/visit/DocumentUploadDialog";

export default function AddVisit() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { isSubUser, getOwnerIdForLogging } = useSubUser();
  const { logActivity } = useActivityLog();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [visitId, setVisitId] = useState<string | null>(null);
  const [showHPIBuilder, setShowHPIBuilder] = useState(false);
  const [showROSBuilder, setShowROSBuilder] = useState(false);
  const [showPhysicalExamDialog, setShowPhysicalExamDialog] = useState(false);
  const [showInvestigationDialog, setShowInvestigationDialog] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    reasonForVisit: "",
    visitType: "consultation",
    hpi: "",
    ros: "",
    vitalSignsBP: "",
    vitalSignsPulse: "",
    vitalSignsTemp: "",
    vitalSignsRespiratoryRate: "",
    vitalSignsSpO2: "",
    vitalSignsWeight: "",
    vitalSignsHeight: "",
    vitalSignsBMI: "",
    vitalSignsGeneralAppearance: "",
    physicalExamination: "",
    investigation: "",
  });

  useEffect(() => {
    fetchPatient();
  }, [patientId]);

  useEffect(() => {
    if (visitId) {
      fetchDocuments();
    }
  }, [visitId]);

  // Vital signs change handler for Physical Exam Builder
  const handleVitalSignsChange = (field: string, value: string) => {
    const fieldMap: { [key: string]: string } = {
      bp: "vitalSignsBP",
      pulse: "vitalSignsPulse",
      temp: "vitalSignsTemp",
      respiratoryRate: "vitalSignsRespiratoryRate",
      spo2: "vitalSignsSpO2",
      weight: "vitalSignsWeight",
      height: "vitalSignsHeight",
      bmi: "vitalSignsBMI",
      generalAppearance: "vitalSignsGeneralAppearance",
    };
    const formField = fieldMap[field];
    if (formField) {
      handleInputChange(formField, value);
    }
  };

  // Auto-calculate BMI when weight or height changes
  useEffect(() => {
    const weight = parseFloat(formData.vitalSignsWeight);
    const height = parseFloat(formData.vitalSignsHeight);
    if (weight && height && height > 0) {
      const heightInMeters = height / 100;
      const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);
      setFormData((prev) => ({ ...prev, vitalSignsBMI: bmi }));
    }
  }, [formData.vitalSignsWeight, formData.vitalSignsHeight]);

  const fetchPatient = async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();

      if (error) throw error;
      setPatient(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/dashboard/patients");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const fetchDocuments = async () => {
    if (!visitId) return;
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("visit_id", visitId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
    }
  };

  const handleCreateVisit = async () => {
    if (!formData.reasonForVisit || !formData.visitType) {
      toast({
        title: "Validation Error",
        description: "Please fill in reason for visit and visit type",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("visits")
        .insert({
          patient_id: patientId,
          user_id: user.id,
          reason_for_visit: formData.reasonForVisit,
          visit_type: formData.visitType,
          hpi: formData.hpi,
          ros: formData.ros,
          vital_signs_bp: formData.vitalSignsBP,
          vital_signs_pulse: formData.vitalSignsPulse,
          vital_signs_temp: formData.vitalSignsTemp,
          vital_signs_respiratory_rate: formData.vitalSignsRespiratoryRate,
          vital_signs_spo2: formData.vitalSignsSpO2,
          vital_signs_weight: formData.vitalSignsWeight,
          vital_signs_height: formData.vitalSignsHeight,
          vital_signs_bmi: formData.vitalSignsBMI,
          vital_signs_general_appearance: formData.vitalSignsGeneralAppearance,
          physical_examination: formData.physicalExamination,
          investigation: formData.investigation,
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;

      setVisitId(data.id);
      
      // Log activity if sub-user
      if (isSubUser && patient) {
        const ownerId = await getOwnerIdForLogging();
        if (ownerId) {
          await logActivity(
            ownerId,
            "create",
            "visit",
            data.id,
            `Visit for ${patient.first_name} ${patient.last_name}`,
            `Created ${formData.visitType} visit: ${formData.reasonForVisit}`
          );
        }
      }
      
      toast({
        title: "Success",
        description: "Visit created successfully",
      });
    } catch (error: any) {
      console.error("Error creating visit:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create visit",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleProceedToDocumentation = () => {
    if (visitId) {
      navigate(`/dashboard/clinical-documentation/${visitId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Patient not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const allergicInfo = [
    ...(Array.isArray(patient.allergic_history_food) ? patient.allergic_history_food : []),
    ...(Array.isArray(patient.allergic_history_drug) ? patient.allergic_history_drug : []),
    ...(Array.isArray(patient.allergic_history_env) ? patient.allergic_history_env : []),
  ].join(", ") || "None";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">New Visit</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/dashboard/patients/${patientId}`)}
              >
                Cancel
              </Button>
              {!visitId ? (
                <Button onClick={handleCreateVisit} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Visit
                </Button>
              ) : (
                <Button onClick={handleProceedToDocumentation}>
                  Proceed to Documentation
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Patient: </span>
              <span className="font-medium">{patient.first_name} {patient.last_name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">ID: </span>
              <span className="font-medium">{patient.id.slice(0, 8)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">DOB: </span>
              <span className="font-medium">{new Date(patient.date_of_birth).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Blood Group: </span>
              <span className="font-medium">{patient.blood_group || "N/A"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Contact: </span>
              <span className="font-medium">{patient.contact_number}</span>
            </div>
            <div className="col-span-2 md:col-span-3">
              <span className="text-muted-foreground">Allergies: </span>
              <span className="font-medium">{allergicInfo}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Section 1: Visit Details */}
        <Card>
          <CardHeader>
            <CardTitle>Visit Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="reasonForVisit">Reason for Visit *</Label>
              <Input
                id="reasonForVisit"
                value={formData.reasonForVisit}
                onChange={(e) => handleInputChange("reasonForVisit", e.target.value)}
                placeholder="Enter reason for visit"
              />
            </div>
            <div>
              <Label htmlFor="visitType">Visit Type *</Label>
              <Select value={formData.visitType} onValueChange={(value) => handleInputChange("visitType", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="follow-up">Follow Up</SelectItem>
                  <SelectItem value="vaccination">Vaccination</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Subjective */}
        <Card>
          <CardHeader>
            <CardTitle>Subjective</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="hpi">History of Present Illness (HPI)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHPIBuilder(true)}
                >
                  Add Complaint
                </Button>
              </div>
              <Textarea
                id="hpi"
                value={formData.hpi}
                onChange={(e) => handleInputChange("hpi", e.target.value)}
                placeholder="Enter history of present illness..."
                className="min-h-[120px]"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="ros">Review of Systems (ROS)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowROSBuilder(true)}
                >
                  ROS Builder
                </Button>
              </div>
              <Textarea
                id="ros"
                value={formData.ros}
                onChange={(e) => handleInputChange("ros", e.target.value)}
                placeholder="Enter review of systems..."
                className="min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Objective */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Objective</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPhysicalExamDialog(true)}
              >
                Physical Exam Builder
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="physicalExamination">Physical Examination</Label>
              <Textarea
                id="physicalExamination"
                value={formData.physicalExamination}
                onChange={(e) => handleInputChange("physicalExamination", e.target.value)}
                placeholder="Enter physical examination findings..."
                className="min-h-[120px]"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="investigation">Investigation</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInvestigationDialog(true)}
                >
                  Investigation Builder
                </Button>
              </div>
              <Textarea
                id="investigation"
                value={formData.investigation}
                onChange={(e) => handleInputChange("investigation", e.target.value)}
                placeholder="Enter investigation details..."
                className="min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Upload Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              disabled={!visitId} 
              variant="outline"
              onClick={() => setIsUploadDialogOpen(true)}
            >
              {visitId ? "Upload Document" : "Create visit first to enable document upload"}
            </Button>
            {!visitId && (
              <p className="text-sm text-muted-foreground mt-2">
                Documents can be uploaded after creating the visit
              </p>
            )}
            {documents.length > 0 && (
              <div className="mt-4 space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 border rounded text-sm">
                    <span>{doc.file_name}</span>
                    <span className="text-muted-foreground">{doc.document_type}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <HPIBuilder
        open={showHPIBuilder}
        onClose={() => setShowHPIBuilder(false)}
        currentHPI={formData.hpi}
        onUpdate={(newHPI) => handleInputChange("hpi", newHPI)}
      />
      <ROSBuilder
        open={showROSBuilder}
        onClose={() => setShowROSBuilder(false)}
        currentROS={formData.ros}
        onUpdate={(newROS) => handleInputChange("ros", newROS)}
      />
      <PhysicalExaminationDialog
        open={showPhysicalExamDialog}
        onOpenChange={setShowPhysicalExamDialog}
        onInsert={(text) => {
          const newValue = formData.physicalExamination
            ? `${formData.physicalExamination}\n\n${text}`
            : text;
          handleInputChange("physicalExamination", newValue);
        }}
        vitalSigns={{
          bp: formData.vitalSignsBP,
          pulse: formData.vitalSignsPulse,
          temp: formData.vitalSignsTemp,
          respiratoryRate: formData.vitalSignsRespiratoryRate,
          spo2: formData.vitalSignsSpO2,
          weight: formData.vitalSignsWeight,
          height: formData.vitalSignsHeight,
          bmi: formData.vitalSignsBMI,
          generalAppearance: formData.vitalSignsGeneralAppearance,
        }}
        onVitalSignsChange={handleVitalSignsChange}
        patientDateOfBirth={patient?.date_of_birth}
        patientGender={patient?.gender}
      />
      <InvestigationBuilderDialog
        open={showInvestigationDialog}
        onOpenChange={setShowInvestigationDialog}
        onInsert={(text) => {
          const newValue = formData.investigation
            ? `${formData.investigation}\n\n${text}`
            : text;
          handleInputChange("investigation", newValue);
        }}
        existingInvestigation={formData.investigation}
      />
      {visitId && patient && (
        <DocumentUploadDialog
          open={isUploadDialogOpen}
          onClose={() => setIsUploadDialogOpen(false)}
          visitId={visitId}
          patientId={patient.id}
          onUploadSuccess={fetchDocuments}
        />
      )}
    </div>
  );
}