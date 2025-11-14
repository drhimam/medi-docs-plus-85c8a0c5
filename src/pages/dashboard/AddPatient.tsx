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
import { ArrowLeft } from "lucide-react";

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
    // Count all filled fields (28 total fields)
    let filledCount = 0;
    const totalFields = 28;

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
      <div className="fixed top-[72px] left-0 right-0 z-10 bg-background border-b">
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
                <Label htmlFor="medical_history_ongoing">Ongoing Medical Conditions</Label>
                <Textarea
                  id="medical_history_ongoing"
                  placeholder="List current medical conditions..."
                  {...register("medical_history_ongoing")}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="medical_history_past">Past Medical History</Label>
                <Textarea
                  id="medical_history_past"
                  placeholder="List past medical conditions..."
                  {...register("medical_history_past")}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="surgical_history">Surgical History</Label>
                <Textarea
                  id="surgical_history"
                  placeholder="List past surgeries and procedures..."
                  {...register("surgical_history")}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="hospitalization_history">Hospitalization History</Label>
                <Textarea
                  id="hospitalization_history"
                  placeholder="List past hospitalizations..."
                  {...register("hospitalization_history")}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="family_history">Family History</Label>
                <Textarea
                  id="family_history"
                  placeholder="List family medical history (e.g., diabetes, heart disease)..."
                  {...register("family_history")}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="mental_health_history">Mental Health History</Label>
                <Textarea
                  id="mental_health_history"
                  placeholder="List mental health conditions and treatments..."
                  {...register("mental_health_history")}
                  rows={3}
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
                <Label htmlFor="ongoing_medications">Ongoing Medications</Label>
                <Textarea
                  id="ongoing_medications"
                  placeholder="Enter medications separated by commas (e.g., Aspirin 100mg daily, Metformin 500mg twice daily)"
                  {...register("ongoing_medications")}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground mt-1">Separate multiple items with commas</p>
              </div>
              <div>
                <Label htmlFor="supplements">Supplements</Label>
                <Textarea
                  id="supplements"
                  placeholder="Enter supplements separated by commas (e.g., Vitamin D, Omega-3)"
                  {...register("supplements")}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground mt-1">Separate multiple items with commas</p>
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
