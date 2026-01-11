import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CheckCircle, AlertCircle, Clock, ChevronLeft, ChevronRight, ListPlus, Save, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EDoctorDeskLogo } from "@/components/EDoctorDeskLogo";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Import dialogs
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
import { MedicationsDialog } from "@/components/patient/MedicationsDialog";
import { SupplementsDialog } from "@/components/patient/SupplementsDialog";
import { VaccinationHistoryDialog } from "@/components/patient/VaccinationHistoryDialog";
import { DrugAllergyDialog } from "@/components/patient/DrugAllergyDialog";
import { FoodAllergyDialog } from "@/components/patient/FoodAllergyDialog";
import { EnvironmentalAllergyDialog } from "@/components/patient/EnvironmentalAllergyDialog";
import { SocialHistoryDialog, SocialHistoryData } from "@/components/patient/SocialHistoryDialog";

const patientSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  contact_number: z.string().regex(/^\d+$/, "Phone number must contain only digits").min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().optional(),
  blood_group: z.string().optional(),
  health_card_number: z.string().optional(),
  medical_history_ongoing: z.string().optional(),
  medical_history_past: z.string().optional(),
  surgical_history: z.string().optional(),
  hospitalization_history: z.string().optional(),
  family_history: z.string().optional(),
  mental_health_history: z.string().optional(),
  birth_history: z.string().optional(),
  developmental_history: z.string().optional(),
  childhood_illnesses: z.string().optional(),
  accidents_injuries: z.string().optional(),
  menstrual_pregnancy_history: z.string().optional(),
  preventive_screening_history: z.string().optional(),
  ongoing_medications: z.string().optional(),
  supplements: z.string().optional(),
  vaccinations: z.string().optional(),
  allergic_history_food: z.string().optional(),
  allergic_history_drug: z.string().optional(),
  allergic_history_env: z.string().optional(),
  smoking_status: z.enum(["NEVER", "FORMER", "CURRENT"]),
  alcohol_consumption: z.enum(["NEVER", "OCCASIONAL", "MODERATE", "HEAVY"]),
  recreational_drug_use: z.string().optional(),
  exercise_habits: z.string().optional(),
  diet: z.string().optional(),
  occupation: z.string().optional(),
  living_environment: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

const STEPS = [
  { id: 1, title: "Personal Info", fields: ["first_name", "last_name", "date_of_birth", "gender", "contact_number", "email", "address", "blood_group", "health_card_number"] },
  { id: 2, title: "Medical History", fields: ["medical_history_ongoing", "medical_history_past", "surgical_history", "hospitalization_history", "family_history", "mental_health_history"] },
  { id: 3, title: "Past History", fields: ["birth_history", "developmental_history", "childhood_illnesses", "accidents_injuries", "menstrual_pregnancy_history", "preventive_screening_history"] },
  { id: 4, title: "Medications", fields: ["ongoing_medications", "supplements", "vaccinations"] },
  { id: 5, title: "Allergies", fields: ["allergic_history_food", "allergic_history_drug", "allergic_history_env"] },
  { id: 6, title: "Lifestyle", fields: ["smoking_status", "alcohol_consumption", "recreational_drug_use", "exercise_habits", "diet", "occupation", "living_environment"] },
];

const PatientIntake = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [status, setStatus] = useState<"valid" | "expired" | "submitted" | "not_found">("valid");
  const [submission, setSubmission] = useState<any>(null);
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);
  const [noKnownAllergies, setNoKnownAllergies] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);

  // Dialog states for Medical History (Step 2)
  const [showOngoingConditionsDialog, setShowOngoingConditionsDialog] = useState(false);
  const [showPastConditionsDialog, setShowPastConditionsDialog] = useState(false);
  const [showSurgicalHistoryDialog, setShowSurgicalHistoryDialog] = useState(false);
  const [showHospitalizationDialog, setShowHospitalizationDialog] = useState(false);
  const [showFamilyHistoryDialog, setShowFamilyHistoryDialog] = useState(false);
  const [showMentalHealthDialog, setShowMentalHealthDialog] = useState(false);

  // Dialog states for Past History (Step 3)
  const [showBirthHistoryDialog, setShowBirthHistoryDialog] = useState(false);
  const [showDevelopmentalHistoryDialog, setShowDevelopmentalHistoryDialog] = useState(false);
  const [showChildhoodIllnessesDialog, setShowChildhoodIllnessesDialog] = useState(false);
  const [showAccidentsInjuriesDialog, setShowAccidentsInjuriesDialog] = useState(false);
  const [showPreventiveScreeningDialog, setShowPreventiveScreeningDialog] = useState(false);
  const [showMenstrualPregnancyDialog, setShowMenstrualPregnancyDialog] = useState(false);

  // Dialog states for Medications (Step 4)
  const [showMedicationsDialog, setShowMedicationsDialog] = useState(false);
  const [showSupplementsDialog, setShowSupplementsDialog] = useState(false);
  const [showVaccinationDialog, setShowVaccinationDialog] = useState(false);

  // Dialog states for Allergies (Step 5)
  const [showDrugAllergyDialog, setShowDrugAllergyDialog] = useState(false);
  const [showFoodAllergyDialog, setShowFoodAllergyDialog] = useState(false);
  const [showEnvAllergyDialog, setShowEnvAllergyDialog] = useState(false);

  // Dialog state for Social History (Step 6)
  const [showSocialHistoryDialog, setShowSocialHistoryDialog] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors }, trigger, reset } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      date_of_birth: "",
      gender: "MALE",
      contact_number: "",
      email: "",
      address: "",
      blood_group: "",
      health_card_number: "",
      medical_history_ongoing: "",
      medical_history_past: "",
      surgical_history: "",
      hospitalization_history: "",
      family_history: "",
      mental_health_history: "",
      birth_history: "",
      developmental_history: "",
      childhood_illnesses: "",
      accidents_injuries: "",
      menstrual_pregnancy_history: "",
      preventive_screening_history: "",
      ongoing_medications: "",
      supplements: "",
      vaccinations: "",
      allergic_history_food: "",
      allergic_history_drug: "",
      allergic_history_env: "",
      smoking_status: "NEVER",
      alcohol_consumption: "NEVER",
      recreational_drug_use: "",
      exercise_habits: "",
      diet: "",
      occupation: "",
      living_environment: "",
    },
  });

  useEffect(() => {
    checkIntakeStatus();
  }, [token]);

  // Load saved draft from localStorage
  useEffect(() => {
    if (token && status === "valid") {
      const savedDraft = localStorage.getItem(`patient_intake_draft_${token}`);
      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft);
          reset(draftData.formData);
          setCurrentStep(draftData.currentStep || 1);
          setHasSavedDraft(true);
          toast.info("Previous progress restored! Continue where you left off.");
        } catch (error) {
          console.error("Error loading saved draft:", error);
        }
      }
    }
  }, [token, status, reset]);

  const checkIntakeStatus = async () => {
    if (!token) {
      setStatus("not_found");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("patient_intake_submissions")
        .select("*")
        .eq("intake_token", token)
        .single();

      if (error || !data) {
        setStatus("not_found");
      } else if (data.status === "submitted" || data.status === "approved") {
        setStatus("submitted");
      } else if (new Date(data.expires_at) < new Date()) {
        setStatus("expired");
      } else {
        setStatus("valid");
        setSubmission(data);
        // Pre-fill email if available
        if (data.patient_email) {
          setValue("email", data.patient_email);
        }
      }
    } catch (error) {
      console.error("Error checking intake status:", error);
      setStatus("not_found");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    const currentFields = STEPS[currentStep - 1].fields as (keyof PatientFormData)[];
    const requiredFields = currentStep === 1 
      ? ["first_name", "last_name", "date_of_birth", "gender", "contact_number"] 
      : [];
    
    const isValid = await trigger(requiredFields as (keyof PatientFormData)[]);
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveForLater = () => {
    const data = formData;
    localStorage.setItem(`patient_intake_draft_${token}`, JSON.stringify({
      formData: data,
      currentStep,
      savedAt: new Date().toISOString()
    }));
    setHasSavedDraft(true);
    toast.success("Progress saved! You can come back and continue later.");
  };

  const handleSubmitClick = async () => {
    const isValid = await trigger();
    if (isValid) {
      setShowSubmitWarning(true);
    }
  };

  const onSubmit = async (data: PatientFormData) => {
    setSubmitting(true);
    try {
      const response = await supabase.functions.invoke("submit-patient-intake", {
        body: { intakeToken: token, formData: data },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to submit form");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      // Clear saved draft on successful submission
      localStorage.removeItem(`patient_intake_draft_${token}`);
      
      setStatus("submitted");
      toast.success("Your intake form has been submitted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit intake form");
    } finally {
      setSubmitting(false);
      setShowSubmitWarning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <EDoctorDeskLogo className="h-12 w-12 mx-auto mb-4" animate />
          <p className="text-muted-foreground">Loading intake form...</p>
        </div>
      </div>
    );
  }

  if (status === "not_found") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Link</h2>
            <p className="text-muted-foreground">
              This intake form link is invalid. Please contact your healthcare provider for a new link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-yellow-100 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Clock className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Link Expired</h2>
            <p className="text-muted-foreground">
              This intake form link has expired. Please contact your healthcare provider for a new link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "submitted") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Form Submitted</h2>
            <p className="text-muted-foreground">
              Thank you! Your intake form has been submitted and is awaiting review by your healthcare provider.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formData = watch();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <EDoctorDeskLogo className="h-8 w-8" />
            <h1 className="text-2xl font-bold text-foreground">eDoctorDesk</h1>
          </div>
          <h2 className="text-xl text-muted-foreground">Patient Intake Form</h2>
          {hasSavedDraft && (
            <Badge variant="secondary" className="mt-2">
              <Save className="h-3 w-3 mr-1" />
              Progress saved
            </Badge>
          )}
        </div>

        {/* Progress */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : currentStep > step.id
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {currentStep > step.id ? "✓" : step.id}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-8 h-1 ${currentStep > step.id ? "bg-green-500" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>
              Step {currentStep} of {STEPS.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Step 1: Personal Info */}
              {currentStep === 1 && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input {...register("first_name")} placeholder="Enter first name" />
                    {errors.first_name && <p className="text-sm text-destructive">{errors.first_name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input {...register("last_name")} placeholder="Enter last name" />
                    {errors.last_name && <p className="text-sm text-destructive">{errors.last_name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth *</Label>
                    <Input type="date" {...register("date_of_birth")} />
                    {errors.date_of_birth && <p className="text-sm text-destructive">{errors.date_of_birth.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(value) => setValue("gender", value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_number">Contact Number *</Label>
                    <Input {...register("contact_number")} placeholder="Enter phone number" />
                    {errors.contact_number && <p className="text-sm text-destructive">{errors.contact_number.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input type="email" {...register("email")} placeholder="Enter email" />
                    {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea {...register("address")} placeholder="Enter address" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="blood_group">Blood Group</Label>
                    <Select value={formData.blood_group || ""} onValueChange={(value) => setValue("blood_group", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="health_card_number">Health Card Number</Label>
                    <Input {...register("health_card_number")} placeholder="Enter health card number" />
                  </div>
                </div>
              )}

              {/* Step 2: Medical History */}
              {currentStep === 2 && (
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="medical_history_ongoing">Current/Ongoing Conditions</Label>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowOngoingConditionsDialog(true)}>
                        <ListPlus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea {...register("medical_history_ongoing")} placeholder="List any current medical conditions" rows={3} />
                    <OngoingConditionsDialog
                      open={showOngoingConditionsDialog}
                      onOpenChange={setShowOngoingConditionsDialog}
                      onInsert={(text) => setValue("medical_history_ongoing", text)}
                      currentValue={formData.medical_history_ongoing}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="medical_history_past">Past Medical Conditions</Label>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPastConditionsDialog(true)}>
                        <ListPlus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea {...register("medical_history_past")} placeholder="List any past medical conditions" rows={3} />
                    <PastConditionsDialog
                      open={showPastConditionsDialog}
                      onOpenChange={setShowPastConditionsDialog}
                      onInsert={(text) => setValue("medical_history_past", text)}
                      currentValue={formData.medical_history_past}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="surgical_history">Surgical History</Label>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowSurgicalHistoryDialog(true)}>
                        <ListPlus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea {...register("surgical_history")} placeholder="List any surgeries you've had" rows={3} />
                    <SurgicalHistoryDialog
                      open={showSurgicalHistoryDialog}
                      onOpenChange={setShowSurgicalHistoryDialog}
                      onInsert={(text) => setValue("surgical_history", text)}
                      currentValue={formData.surgical_history}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="hospitalization_history">Hospitalization History</Label>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowHospitalizationDialog(true)}>
                        <ListPlus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea {...register("hospitalization_history")} placeholder="List any hospitalizations" rows={3} />
                    <HospitalizationHistoryDialog
                      open={showHospitalizationDialog}
                      onOpenChange={setShowHospitalizationDialog}
                      onInsert={(text) => setValue("hospitalization_history", text)}
                      currentValue={formData.hospitalization_history}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="family_history">Family Medical History</Label>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowFamilyHistoryDialog(true)}>
                        <ListPlus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea {...register("family_history")} placeholder="List any relevant family medical history" rows={3} />
                    <FamilyHistoryDialog
                      open={showFamilyHistoryDialog}
                      onOpenChange={setShowFamilyHistoryDialog}
                      onInsert={(text) => setValue("family_history", text)}
                      currentValue={formData.family_history || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="mental_health_history">Mental Health History</Label>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowMentalHealthDialog(true)}>
                        <ListPlus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea {...register("mental_health_history")} placeholder="Any mental health conditions or treatments" rows={3} />
                    <MentalHealthHistoryDialog
                      open={showMentalHealthDialog}
                      onOpenChange={setShowMentalHealthDialog}
                      onInsert={(text) => setValue("mental_health_history", text)}
                      currentValue={formData.mental_health_history}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Past History */}
              {currentStep === 3 && (
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="birth_history">Birth History</Label>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowBirthHistoryDialog(true)}>
                        <ListPlus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea {...register("birth_history")} placeholder="Birth history details (if relevant)" rows={3} />
                    <BirthHistoryDialog
                      open={showBirthHistoryDialog}
                      onOpenChange={setShowBirthHistoryDialog}
                      onInsert={(text) => setValue("birth_history", text)}
                      currentValue={formData.birth_history}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="developmental_history">Developmental History</Label>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowDevelopmentalHistoryDialog(true)}>
                        <ListPlus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea {...register("developmental_history")} placeholder="Developmental milestones (if relevant)" rows={3} />
                    <DevelopmentalHistoryDialog
                      open={showDevelopmentalHistoryDialog}
                      onOpenChange={setShowDevelopmentalHistoryDialog}
                      onInsert={(text) => setValue("developmental_history", text)}
                      currentValue={formData.developmental_history}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="childhood_illnesses">Childhood Illnesses</Label>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowChildhoodIllnessesDialog(true)}>
                        <ListPlus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea {...register("childhood_illnesses")} placeholder="Any significant childhood illnesses" rows={3} />
                    <ChildhoodIllnessesDialog
                      open={showChildhoodIllnessesDialog}
                      onOpenChange={setShowChildhoodIllnessesDialog}
                      onInsert={(text) => setValue("childhood_illnesses", text)}
                      currentValue={formData.childhood_illnesses}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="accidents_injuries">Accidents/Injuries</Label>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAccidentsInjuriesDialog(true)}>
                        <ListPlus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea {...register("accidents_injuries")} placeholder="Any significant accidents or injuries" rows={3} />
                    <AccidentsInjuriesDialog
                      open={showAccidentsInjuriesDialog}
                      onOpenChange={setShowAccidentsInjuriesDialog}
                      onInsert={(text) => setValue("accidents_injuries", text)}
                      currentValue={formData.accidents_injuries}
                    />
                  </div>
                  {formData.gender === "FEMALE" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="menstrual_pregnancy_history">Menstrual/Pregnancy History</Label>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowMenstrualPregnancyDialog(true)}>
                          <ListPlus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Textarea {...register("menstrual_pregnancy_history")} placeholder="Menstrual and pregnancy history" rows={3} />
                      <MenstrualPregnancyHistoryDialog
                        open={showMenstrualPregnancyDialog}
                        onOpenChange={setShowMenstrualPregnancyDialog}
                        onInsert={(text) => setValue("menstrual_pregnancy_history", text)}
                        currentValue={formData.menstrual_pregnancy_history}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="preventive_screening_history">Preventive Screening History</Label>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPreventiveScreeningDialog(true)}>
                        <ListPlus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea {...register("preventive_screening_history")} placeholder="Recent screenings (mammogram, colonoscopy, etc.)" rows={3} />
                    <PreventiveScreeningDialog
                      open={showPreventiveScreeningDialog}
                      onOpenChange={setShowPreventiveScreeningDialog}
                      onInsert={(text) => setValue("preventive_screening_history", text)}
                      currentValue={formData.preventive_screening_history}
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Medications */}
              {currentStep === 4 && (
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="ongoing_medications">Current Medications</Label>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowMedicationsDialog(true)}>
                        <ListPlus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea {...register("ongoing_medications")} placeholder="List all current medications (name, dose, frequency)" rows={4} />
                    <p className="text-sm text-muted-foreground">Separate multiple items with commas</p>
                    <MedicationsDialog
                      open={showMedicationsDialog}
                      onOpenChange={setShowMedicationsDialog}
                      onInsert={(text) => setValue("ongoing_medications", text)}
                      currentValue={formData.ongoing_medications}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="supplements">Supplements & Vitamins</Label>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowSupplementsDialog(true)}>
                        <ListPlus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea {...register("supplements")} placeholder="List any supplements or vitamins you take" rows={3} />
                    <p className="text-sm text-muted-foreground">Separate multiple items with commas</p>
                    <SupplementsDialog
                      open={showSupplementsDialog}
                      onOpenChange={setShowSupplementsDialog}
                      onInsert={(text) => setValue("supplements", text)}
                      currentValue={formData.supplements}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="vaccinations">Vaccination History</Label>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowVaccinationDialog(true)}>
                        <ListPlus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea {...register("vaccinations")} placeholder="List recent vaccinations" rows={3} />
                    <p className="text-sm text-muted-foreground">Separate multiple items with commas</p>
                    <VaccinationHistoryDialog
                      open={showVaccinationDialog}
                      onOpenChange={setShowVaccinationDialog}
                      onInsert={(text) => setValue("vaccinations", text)}
                      currentValue={formData.vaccinations}
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Allergies */}
              {currentStep === 5 && (
                <div className="grid gap-4">
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
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="allergic_history_drug">Drug Allergies</Label>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowDrugAllergyDialog(true)}>
                        <ListPlus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea {...register("allergic_history_drug")} placeholder="List any drug allergies and reactions" rows={3} />
                    <p className="text-sm text-muted-foreground">Separate multiple items with commas</p>
                    <DrugAllergyDialog
                      open={showDrugAllergyDialog}
                      onOpenChange={setShowDrugAllergyDialog}
                      onInsert={(text) => setValue("allergic_history_drug", text)}
                      currentValue={formData.allergic_history_drug}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="allergic_history_food">Food Allergies</Label>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowFoodAllergyDialog(true)}>
                        <ListPlus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea {...register("allergic_history_food")} placeholder="List any food allergies and reactions" rows={3} />
                    <p className="text-sm text-muted-foreground">Separate multiple items with commas</p>
                    <FoodAllergyDialog
                      open={showFoodAllergyDialog}
                      onOpenChange={setShowFoodAllergyDialog}
                      onInsert={(text) => setValue("allergic_history_food", text)}
                      currentValue={formData.allergic_history_food}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="allergic_history_env">Environmental Allergies</Label>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowEnvAllergyDialog(true)}>
                        <ListPlus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea {...register("allergic_history_env")} placeholder="List any environmental allergies (pollen, dust, etc.)" rows={3} />
                    <p className="text-sm text-muted-foreground">Separate multiple items with commas</p>
                    <EnvironmentalAllergyDialog
                      open={showEnvAllergyDialog}
                      onOpenChange={setShowEnvAllergyDialog}
                      onInsert={(text) => setValue("allergic_history_env", text)}
                      currentValue={formData.allergic_history_env}
                    />
                  </div>
                </div>
              )}

              {/* Step 6: Lifestyle */}
              {currentStep === 6 && (
                <div className="grid gap-4">
                  <div className="flex justify-end">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowSocialHistoryDialog(true)}>
                      <ListPlus className="h-4 w-4 mr-2" />
                      Use Preset
                    </Button>
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
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="smoking_status">Smoking Status *</Label>
                      <Select value={formData.smoking_status} onValueChange={(value) => setValue("smoking_status", value as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NEVER">Never Smoked</SelectItem>
                          <SelectItem value="FORMER">Former Smoker</SelectItem>
                          <SelectItem value="CURRENT">Current Smoker</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alcohol_consumption">Alcohol Consumption *</Label>
                      <Select value={formData.alcohol_consumption} onValueChange={(value) => setValue("alcohol_consumption", value as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select consumption" />
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
                  <div className="space-y-2">
                    <Label htmlFor="recreational_drug_use">Recreational Drug Use</Label>
                    <Textarea {...register("recreational_drug_use")} placeholder="Any recreational drug use (current or past)" rows={2} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="exercise_habits">Exercise Habits</Label>
                      <Textarea {...register("exercise_habits")} placeholder="Describe your exercise routine" rows={2} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="diet">Diet</Label>
                      <Textarea {...register("diet")} placeholder="Describe your typical diet" rows={2} />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="occupation">Occupation</Label>
                      <Input {...register("occupation")} placeholder="Your occupation" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="living_environment">Living Environment</Label>
                      <Input {...register("living_environment")} placeholder="Describe your living situation" />
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSaveForLater}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save for Later
                  </Button>
                </div>
                
                {currentStep < STEPS.length ? (
                  <Button type="button" onClick={handleNext}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="button" onClick={handleSubmitClick} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Form"}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Your information is secure and will only be shared with your healthcare provider.
        </p>
      </div>

      {/* Submission Warning Dialog */}
      <AlertDialog open={showSubmitWarning} onOpenChange={setShowSubmitWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Submission
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to submit your patient intake form. Please ensure that:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>All information provided is accurate and complete</li>
                <li>You have reviewed all sections of the form</li>
                <li>Any allergies or current medications are correctly listed</li>
              </ul>
              <p className="font-medium text-foreground">
                Once submitted, you will not be able to make changes. Your healthcare provider will review this information.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back & Review</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit(onSubmit)} disabled={submitting}>
              {submitting ? "Submitting..." : "Yes, Submit Form"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PatientIntake;
