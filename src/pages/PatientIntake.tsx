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
import { toast } from "sonner";
import { CheckCircle, AlertCircle, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EDoctorDeskLogo } from "@/components/EDoctorDeskLogo";

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

  useEffect(() => {
    checkIntakeStatus();
  }, [token]);

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

      setStatus("submitted");
      toast.success("Your intake form has been submitted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit intake form");
    } finally {
      setSubmitting(false);
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
                    <Label htmlFor="medical_history_ongoing">Current/Ongoing Conditions</Label>
                    <Textarea {...register("medical_history_ongoing")} placeholder="List any current medical conditions" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medical_history_past">Past Medical Conditions</Label>
                    <Textarea {...register("medical_history_past")} placeholder="List any past medical conditions" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="surgical_history">Surgical History</Label>
                    <Textarea {...register("surgical_history")} placeholder="List any surgeries you've had" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hospitalization_history">Hospitalization History</Label>
                    <Textarea {...register("hospitalization_history")} placeholder="List any hospitalizations" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="family_history">Family Medical History</Label>
                    <Textarea {...register("family_history")} placeholder="List any relevant family medical history" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mental_health_history">Mental Health History</Label>
                    <Textarea {...register("mental_health_history")} placeholder="Any mental health conditions or treatments" rows={3} />
                  </div>
                </div>
              )}

              {/* Step 3: Past History */}
              {currentStep === 3 && (
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birth_history">Birth History</Label>
                    <Textarea {...register("birth_history")} placeholder="Birth history details (if relevant)" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="developmental_history">Developmental History</Label>
                    <Textarea {...register("developmental_history")} placeholder="Developmental milestones (if relevant)" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="childhood_illnesses">Childhood Illnesses</Label>
                    <Textarea {...register("childhood_illnesses")} placeholder="Any significant childhood illnesses" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accidents_injuries">Accidents/Injuries</Label>
                    <Textarea {...register("accidents_injuries")} placeholder="Any significant accidents or injuries" rows={3} />
                  </div>
                  {formData.gender === "FEMALE" && (
                    <div className="space-y-2">
                      <Label htmlFor="menstrual_pregnancy_history">Menstrual/Pregnancy History</Label>
                      <Textarea {...register("menstrual_pregnancy_history")} placeholder="Menstrual and pregnancy history" rows={3} />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="preventive_screening_history">Preventive Screening History</Label>
                    <Textarea {...register("preventive_screening_history")} placeholder="Recent screenings (mammogram, colonoscopy, etc.)" rows={3} />
                  </div>
                </div>
              )}

              {/* Step 4: Medications */}
              {currentStep === 4 && (
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ongoing_medications">Current Medications</Label>
                    <Textarea {...register("ongoing_medications")} placeholder="List all current medications (name, dose, frequency)" rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplements">Supplements & Vitamins</Label>
                    <Textarea {...register("supplements")} placeholder="List any supplements or vitamins you take" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vaccinations">Vaccination History</Label>
                    <Textarea {...register("vaccinations")} placeholder="List recent vaccinations" rows={3} />
                  </div>
                </div>
              )}

              {/* Step 5: Allergies */}
              {currentStep === 5 && (
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="allergic_history_drug">Drug Allergies</Label>
                    <Textarea {...register("allergic_history_drug")} placeholder="List any drug allergies and reactions" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allergic_history_food">Food Allergies</Label>
                    <Textarea {...register("allergic_history_food")} placeholder="List any food allergies and reactions" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allergic_history_env">Environmental Allergies</Label>
                    <Textarea {...register("allergic_history_env")} placeholder="List any environmental allergies (pollen, dust, etc.)" rows={3} />
                  </div>
                </div>
              )}

              {/* Step 6: Lifestyle */}
              {currentStep === 6 && (
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
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="recreational_drug_use">Recreational Drug Use</Label>
                    <Textarea {...register("recreational_drug_use")} placeholder="Any recreational drug use (current or past)" rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exercise_habits">Exercise Habits</Label>
                    <Textarea {...register("exercise_habits")} placeholder="Describe your exercise routine" rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diet">Diet</Label>
                    <Textarea {...register("diet")} placeholder="Describe your typical diet" rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input {...register("occupation")} placeholder="Your occupation" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="living_environment">Living Environment</Label>
                    <Input {...register("living_environment")} placeholder="Describe your living situation" />
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                
                {currentStep < STEPS.length ? (
                  <Button type="button" onClick={handleNext}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={submitting}>
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
    </div>
  );
};

export default PatientIntake;
