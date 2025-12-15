import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, ListPlus } from "lucide-react";
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
import { MedicationsDialog } from "@/components/patient/MedicationsDialog";
import { SupplementsDialog } from "@/components/patient/SupplementsDialog";

const patientSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100, "First name must be less than 100 characters"),
  last_name: z.string().min(1, "Last name is required").max(100, "Last name must be less than 100 characters"),
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
  
  birth_history: z.string().max(1000).optional(),
  developmental_history: z.string().max(1000).optional(),
  childhood_illnesses: z.string().max(1000).optional(),
  accidents_injuries: z.string().max(1000).optional(),
  menstrual_pregnancy_history: z.string().max(1000).optional(),
  preventive_screening_history: z.string().max(1000).optional(),
  
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

const AddPatient = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
  const [showMedicationsDialog, setShowMedicationsDialog] = useState(false);
  const [showSupplementsDialog, setShowSupplementsDialog] = useState(false);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PatientFormData>({
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

  const gender = watch("gender");
  const smokingStatus = watch("smoking_status");
  const alcoholConsumption = watch("alcohol_consumption");
  const bloodGroup = watch("blood_group");

  const calculateCompletionStatus = (data: PatientFormData): string => {
    // Count all filled fields (34 total fields)
    let filledCount = 0;
    const totalFields = 34;

    // Count required fields (always filled due to validation)
    if (data.first_name) filledCount++;
    if (data.last_name) filledCount++;
    if (data.date_of_birth) filledCount++;
    if (data.gender) filledCount++;
    if (data.contact_number) filledCount++;
    if (data.smoking_status) filledCount++;
    if (data.alcohol_consumption) filledCount++;

    // Count optional fields
    if (data.email) filledCount++;
    if (data.address) filledCount++;
    if (data.blood_group) filledCount++;
    if (data.health_card_number) filledCount++;
    if (data.medical_history_ongoing) filledCount++;
    if (data.medical_history_past) filledCount++;
    if (data.surgical_history) filledCount++;
    if (data.hospitalization_history) filledCount++;
    if (data.family_history) filledCount++;
    if (data.mental_health_history) filledCount++;
    if (data.ongoing_medications) filledCount++;
    if (data.supplements) filledCount++;
    if (data.vaccinations) filledCount++;
    if (data.allergic_history_food) filledCount++;
    if (data.allergic_history_drug) filledCount++;
    if (data.allergic_history_env) filledCount++;
    if (data.recreational_drug_use) filledCount++;
    if (data.exercise_habits) filledCount++;
    if (data.diet) filledCount++;
    if (data.occupation) filledCount++;
    if (data.living_environment) filledCount++;
    if (data.birth_history) filledCount++;
    if (data.developmental_history) filledCount++;
    if (data.childhood_illnesses) filledCount++;
    if (data.accidents_injuries) filledCount++;
    if (data.menstrual_pregnancy_history) filledCount++;
    if (data.preventive_screening_history) filledCount++;

    const completionPercentage = (filledCount / totalFields) * 100;
    return completionPercentage >= 85 ? "completed" : "incomplete";
  };

  const onSubmit = async (data: PatientFormData) => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const completionStatus = calculateCompletionStatus(data);

      const patientData = {
        user_id: user.id,
        ...data,
        ongoing_medications: data.ongoing_medications 
          ? data.ongoing_medications.split(",").map(m => m.trim()).filter(Boolean) 
          : [],
        supplements: data.supplements 
          ? data.supplements.split(",").map(s => s.trim()).filter(Boolean) 
          : [],
        vaccinations: data.vaccinations 
          ? data.vaccinations.split(",").map(v => v.trim()).filter(Boolean) 
          : [],
        allergic_history_food: data.allergic_history_food 
          ? data.allergic_history_food.split(",").map(a => a.trim()).filter(Boolean) 
          : [],
        allergic_history_drug: data.allergic_history_drug 
          ? data.allergic_history_drug.split(",").map(a => a.trim()).filter(Boolean) 
          : [],
        allergic_history_env: data.allergic_history_env 
          ? data.allergic_history_env.split(",").map(a => a.trim()).filter(Boolean) 
          : [],
        completion_status: completionStatus,
      };

      const { error } = await (supabase as any)
        .from("patients")
        .insert([patientData]);

      if (error) throw error;

      toast.success("Patient added successfully!");
      navigate("/dashboard/patients");
    } catch (error: any) {
      toast.error(error.message || "Failed to add patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-[72px]">
      {/* Sticky Header */}
      <div className="fixed top-[72px] left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95 border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard/patients")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Add New Patient</h1>
                <p className="text-sm text-muted-foreground">
                  Complete patient registration form with comprehensive medical information
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard/patients")}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                onClick={handleSubmit(onSubmit)}
              >
                {loading ? "Saving..." : "Add Patient"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Demographics Section */}
          <Card>
            <CardHeader>
              <CardTitle>Demographics</CardTitle>
              <CardDescription>Basic patient information and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    {...register("first_name")}
                  />
                  {errors.first_name && (
                    <p className="text-sm text-destructive mt-1">{errors.first_name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    {...register("last_name")}
                  />
                  {errors.last_name && (
                    <p className="text-sm text-destructive mt-1">{errors.last_name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="date_of_birth">Date of Birth *</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    {...register("date_of_birth")}
                  />
                  {errors.date_of_birth && (
                    <p className="text-sm text-destructive mt-1">{errors.date_of_birth.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select
                    value={gender}
                    onValueChange={(value) => setValue("gender", value as "MALE" | "FEMALE" | "OTHER")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="contact_number">Contact Number * (digits only)</Label>
                  <Input
                    id="contact_number"
                    placeholder="1234567890"
                    {...register("contact_number")}
                  />
                  {errors.contact_number && (
                    <p className="text-sm text-destructive mt-1">{errors.contact_number.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="health_card_number">Health Card / Insurance No.</Label>
                  <Input
                    id="health_card_number"
                    placeholder="Enter health card or insurance number"
                    {...register("health_card_number")}
                  />
                </div>
                <div>
                  <Label htmlFor="blood_group">Blood Group</Label>
                  <Select
                    value={bloodGroup}
                    onValueChange={(value) => setValue("blood_group", value)}
                  >
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
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  {...register("address")}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Medical History Section */}
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
                  <Label htmlFor="menstrual_pregnancy_history">Menstrual and Pregnancy History</Label>
                  <Textarea
                    id="menstrual_pregnancy_history"
                    placeholder="Detail menstrual and pregnancy history..."
                    {...register("menstrual_pregnancy_history")}
                    rows={2}
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

          {/* Medications & Supplements Section */}
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
                <Label htmlFor="vaccinations">Vaccination History</Label>
                <Textarea
                  id="vaccinations"
                  placeholder="Enter vaccinations separated by commas (e.g., COVID-19 2023, Flu 2023)"
                  {...register("vaccinations")}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground mt-1">Separate multiple items with commas</p>
              </div>
            </CardContent>
          </Card>

          {/* Allergies Section */}
          <Card>
            <CardHeader>
              <CardTitle>Allergies</CardTitle>
              <CardDescription>Document all known allergies for patient safety</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="allergic_history_drug">Drug Allergies</Label>
                <Textarea
                  id="allergic_history_drug"
                  placeholder="Enter drug allergies separated by commas (e.g., Penicillin, Aspirin)"
                  {...register("allergic_history_drug")}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground mt-1">Separate multiple items with commas</p>
              </div>
              <div>
                <Label htmlFor="allergic_history_food">Food Allergies</Label>
                <Textarea
                  id="allergic_history_food"
                  placeholder="Enter food allergies separated by commas (e.g., Peanuts, Shellfish)"
                  {...register("allergic_history_food")}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground mt-1">Separate multiple items with commas</p>
              </div>
              <div>
                <Label htmlFor="allergic_history_env">Environmental Allergies</Label>
                <Textarea
                  id="allergic_history_env"
                  placeholder="Enter environmental allergies separated by commas (e.g., Pollen, Dust)"
                  {...register("allergic_history_env")}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground mt-1">Separate multiple items with commas</p>
              </div>
            </CardContent>
          </Card>

          {/* Social History Section */}
          <Card>
            <CardHeader>
              <CardTitle>Social History</CardTitle>
              <CardDescription>Lifestyle factors and occupational information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
        </form>
      </div>
    </div>
  );
};

export default AddPatient;
