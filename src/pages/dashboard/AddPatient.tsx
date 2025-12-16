import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, ChevronLeft, ChevronRight, FastForward } from "lucide-react";
import { WizardProgress } from "@/components/patient/wizard/WizardProgress";
import { DemographicsStep } from "@/components/patient/wizard/DemographicsStep";
import { MedicalHistoryStep } from "@/components/patient/wizard/MedicalHistoryStep";
import { MedicationsStep } from "@/components/patient/wizard/MedicationsStep";
import { AllergiesStep } from "@/components/patient/wizard/AllergiesStep";
import { SocialHistoryStep } from "@/components/patient/wizard/SocialHistoryStep";
import { ReviewStep } from "@/components/patient/wizard/ReviewStep";

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

const WIZARD_STEPS = [
  { id: 1, title: "Demographics", description: "Basic info" },
  { id: 2, title: "Medical History", description: "Health background" },
  { id: 3, title: "Medications", description: "Current meds" },
  { id: 4, title: "Allergies", description: "Known allergies" },
  { id: 5, title: "Social History", description: "Lifestyle" },
  { id: 6, title: "Review", description: "Confirm details" },
];

const AddPatient = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [noKnownAllergies, setNoKnownAllergies] = useState(false);
  
  const { register, handleSubmit, watch, setValue, formState: { errors }, trigger } = useForm<PatientFormData>({
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

  const calculateCompletionStatus = (data: PatientFormData): string => {
    let filledCount = 0;
    const totalFields = 34;

    if (data.first_name) filledCount++;
    if (data.last_name) filledCount++;
    if (data.date_of_birth) filledCount++;
    if (data.gender) filledCount++;
    if (data.contact_number) filledCount++;
    if (data.smoking_status) filledCount++;
    if (data.alcohol_consumption) filledCount++;
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

  const handleNext = async () => {
    let fieldsToValidate: (keyof PatientFormData)[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ["first_name", "last_name", "date_of_birth", "gender", "contact_number"];
    }
    
    const isValid = await trigger(fieldsToValidate);
    
    if (isValid && currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipToReview = async () => {
    // Validate required demographics first
    const fieldsToValidate: (keyof PatientFormData)[] = ["first_name", "last_name", "date_of_birth", "gender", "contact_number"];
    const isValid = await trigger(fieldsToValidate);
    
    if (isValid) {
      setCurrentStep(WIZARD_STEPS.length); // Jump to review step
    }
  };

  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <DemographicsStep register={register} watch={watch} setValue={setValue} errors={errors} />;
      case 2:
        return <MedicalHistoryStep register={register} watch={watch} setValue={setValue} />;
      case 3:
        return <MedicationsStep register={register} watch={watch} setValue={setValue} />;
      case 4:
        return (
          <AllergiesStep 
            register={register} 
            watch={watch} 
            setValue={setValue} 
            noKnownAllergies={noKnownAllergies}
            setNoKnownAllergies={setNoKnownAllergies}
          />
        );
      case 5:
        return <SocialHistoryStep register={register} watch={watch} setValue={setValue} />;
      case 6:
        return <ReviewStep watch={watch} />;
      default:
        return null;
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
                  Step {currentStep} of {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStep - 1].title}
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
              {currentStep === WIZARD_STEPS.length && (
                <Button 
                  type="submit" 
                  disabled={loading}
                  onClick={handleSubmit(onSubmit)}
                >
                  {loading ? "Saving..." : "Add Patient"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 mt-4">
        {/* Wizard Progress */}
        <div className="mb-8 bg-card rounded-lg p-6 border">
          <WizardProgress 
            steps={WIZARD_STEPS} 
            currentStep={currentStep} 
            onStepClick={handleStepClick}
          />
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {renderCurrentStep()}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex gap-3">
              {currentStep > 1 && currentStep < WIZARD_STEPS.length && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleSkipToReview}
                >
                  <FastForward className="h-4 w-4 mr-2" />
                  Skip to Review
                </Button>
              )}
              
              {currentStep < WIZARD_STEPS.length ? (
                <Button type="button" onClick={handleNext}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Add Patient"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatient;
