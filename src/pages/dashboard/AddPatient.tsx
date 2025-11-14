import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const AddPatient = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "MALE",
    contact_number: "",
    email: "",
    address: "",
    blood_group: "",
    
    // Medical History
    medical_history_ongoing: "",
    medical_history_past: "",
    surgical_history: "",
    hospitalization_history: "",
    family_history: "",
    mental_health_history: "",
    
    // Medications & Supplements
    ongoing_medications: "",
    supplements: "",
    vaccinations: "",
    
    // Allergies
    allergic_history_food: "",
    allergic_history_drug: "",
    allergic_history_env: "",
    
    // Social History
    smoking_status: "NEVER",
    alcohol_consumption: "NEVER",
    recreational_drug_use: "",
    exercise_habits: "",
    diet: "",
    occupation: "",
    living_environment: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const patientData = {
        user_id: user.id,
        ...formData,
        ongoing_medications: formData.ongoing_medications 
          ? formData.ongoing_medications.split(",").map(m => m.trim()).filter(Boolean) 
          : [],
        supplements: formData.supplements 
          ? formData.supplements.split(",").map(s => s.trim()).filter(Boolean) 
          : [],
        vaccinations: formData.vaccinations 
          ? formData.vaccinations.split(",").map(v => v.trim()).filter(Boolean) 
          : [],
        allergic_history_food: formData.allergic_history_food 
          ? formData.allergic_history_food.split(",").map(a => a.trim()).filter(Boolean) 
          : [],
        allergic_history_drug: formData.allergic_history_drug 
          ? formData.allergic_history_drug.split(",").map(a => a.trim()).filter(Boolean) 
          : [],
        allergic_history_env: formData.allergic_history_env 
          ? formData.allergic_history_env.split(",").map(a => a.trim()).filter(Boolean) 
          : [],
      };

      const { error } = await (supabase as any)
        .from("patients")
        .insert([patientData]);

      if (error) throw error;

      toast.success("Patient added successfully!");
      navigate("/dashboard/patients");
    } catch (error: any) {
      toast.error(error.message || "Failed to add patient");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard/patients")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Patients
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Add New Patient</h1>
          <p className="text-muted-foreground mt-2">
            Complete patient registration form with comprehensive medical information
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="date_of_birth">Date of Birth *</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    required
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
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
                  <Label htmlFor="contact_number">Contact Number *</Label>
                  <Input
                    id="contact_number"
                    type="tel"
                    required
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="blood_group">Blood Group</Label>
                  <Select
                    value={formData.blood_group}
                    onValueChange={(value) => setFormData({ ...formData, blood_group: value })}
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
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                  value={formData.medical_history_ongoing}
                  onChange={(e) => setFormData({ ...formData, medical_history_ongoing: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="medical_history_past">Past Medical History</Label>
                <Textarea
                  id="medical_history_past"
                  placeholder="List past medical conditions..."
                  value={formData.medical_history_past}
                  onChange={(e) => setFormData({ ...formData, medical_history_past: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="surgical_history">Surgical History</Label>
                <Textarea
                  id="surgical_history"
                  placeholder="List past surgeries and procedures..."
                  value={formData.surgical_history}
                  onChange={(e) => setFormData({ ...formData, surgical_history: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="hospitalization_history">Hospitalization History</Label>
                <Textarea
                  id="hospitalization_history"
                  placeholder="List past hospitalizations..."
                  value={formData.hospitalization_history}
                  onChange={(e) => setFormData({ ...formData, hospitalization_history: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="family_history">Family History</Label>
                <Textarea
                  id="family_history"
                  placeholder="List family medical history (e.g., diabetes, heart disease)..."
                  value={formData.family_history}
                  onChange={(e) => setFormData({ ...formData, family_history: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="mental_health_history">Mental Health History</Label>
                <Textarea
                  id="mental_health_history"
                  placeholder="List mental health conditions and treatments..."
                  value={formData.mental_health_history}
                  onChange={(e) => setFormData({ ...formData, mental_health_history: e.target.value })}
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
                  value={formData.ongoing_medications}
                  onChange={(e) => setFormData({ ...formData, ongoing_medications: e.target.value })}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground mt-1">Separate multiple items with commas</p>
              </div>
              <div>
                <Label htmlFor="supplements">Supplements</Label>
                <Textarea
                  id="supplements"
                  placeholder="Enter supplements separated by commas (e.g., Vitamin D, Omega-3)"
                  value={formData.supplements}
                  onChange={(e) => setFormData({ ...formData, supplements: e.target.value })}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground mt-1">Separate multiple items with commas</p>
              </div>
              <div>
                <Label htmlFor="vaccinations">Vaccination History</Label>
                <Textarea
                  id="vaccinations"
                  placeholder="Enter vaccinations separated by commas (e.g., COVID-19 2023, Flu 2023)"
                  value={formData.vaccinations}
                  onChange={(e) => setFormData({ ...formData, vaccinations: e.target.value })}
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
                  value={formData.allergic_history_drug}
                  onChange={(e) => setFormData({ ...formData, allergic_history_drug: e.target.value })}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground mt-1">Separate multiple items with commas</p>
              </div>
              <div>
                <Label htmlFor="allergic_history_food">Food Allergies</Label>
                <Textarea
                  id="allergic_history_food"
                  placeholder="Enter food allergies separated by commas (e.g., Peanuts, Shellfish)"
                  value={formData.allergic_history_food}
                  onChange={(e) => setFormData({ ...formData, allergic_history_food: e.target.value })}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground mt-1">Separate multiple items with commas</p>
              </div>
              <div>
                <Label htmlFor="allergic_history_env">Environmental Allergies</Label>
                <Textarea
                  id="allergic_history_env"
                  placeholder="Enter environmental allergies separated by commas (e.g., Pollen, Dust)"
                  value={formData.allergic_history_env}
                  onChange={(e) => setFormData({ ...formData, allergic_history_env: e.target.value })}
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
                    value={formData.smoking_status}
                    onValueChange={(value) => setFormData({ ...formData, smoking_status: value })}
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
                    value={formData.alcohol_consumption}
                    onValueChange={(value) => setFormData({ ...formData, alcohol_consumption: value })}
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
                  value={formData.recreational_drug_use}
                  onChange={(e) => setFormData({ ...formData, recreational_drug_use: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="exercise_habits">Exercise Habits</Label>
                <Textarea
                  id="exercise_habits"
                  placeholder="Describe exercise routine and frequency..."
                  value={formData.exercise_habits}
                  onChange={(e) => setFormData({ ...formData, exercise_habits: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="diet">Diet</Label>
                <Textarea
                  id="diet"
                  placeholder="Describe dietary habits and restrictions..."
                  value={formData.diet}
                  onChange={(e) => setFormData({ ...formData, diet: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  placeholder="Enter occupation"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="living_environment">Living Environment</Label>
                <Textarea
                  id="living_environment"
                  placeholder="Describe living conditions, housing type, etc..."
                  value={formData.living_environment}
                  onChange={(e) => setFormData({ ...formData, living_environment: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/patients")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Add Patient"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatient;
