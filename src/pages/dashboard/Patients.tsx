import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, User, Phone, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  contact_number: string;
  email: string | null;
  blood_group: string | null;
  created_at: string;
}

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "MALE",
    contact_number: "",
    email: "",
    address: "",
    blood_group: "",
    medical_history_ongoing: "",
    medical_history_past: "",
    surgical_history: "",
    hospitalization_history: "",
    family_history: "",
    ongoing_medications: "",
    supplements: "",
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
    mental_health_history: "",
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error: any) {
      toast.error("Failed to load patients");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const patientData = {
        user_id: user.id,
        ...formData,
        ongoing_medications: formData.ongoing_medications ? formData.ongoing_medications.split(",").map(m => m.trim()) : [],
        supplements: formData.supplements ? formData.supplements.split(",").map(s => s.trim()) : [],
        allergic_history_food: formData.allergic_history_food ? formData.allergic_history_food.split(",").map(a => a.trim()) : [],
        allergic_history_drug: formData.allergic_history_drug ? formData.allergic_history_drug.split(",").map(a => a.trim()) : [],
        allergic_history_env: formData.allergic_history_env ? formData.allergic_history_env.split(",").map(a => a.trim()) : [],
      };

      const { error } = await (supabase as any)
        .from("patients")
        .insert([patientData]);

      if (error) throw error;

      toast.success("Patient added successfully!");
      setDialogOpen(false);
      fetchPatients();
      
      // Reset form
      setFormData({
        first_name: "",
        last_name: "",
        date_of_birth: "",
        gender: "MALE",
        contact_number: "",
        email: "",
        address: "",
        blood_group: "",
        medical_history_ongoing: "",
        medical_history_past: "",
        surgical_history: "",
        hospitalization_history: "",
        family_history: "",
        ongoing_medications: "",
        supplements: "",
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
        mental_health_history: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to add patient");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.contact_number.includes(searchQuery)
  );

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold">Patients</h2>
          <p className="text-muted-foreground">Manage your patient records</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth *</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
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
                  <div className="space-y-2">
                    <Label htmlFor="contact_number">Contact Number *</Label>
                    <Input
                      id="contact_number"
                      value={formData.contact_number}
                      onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="blood_group">Blood Group</Label>
                    <Input
                      id="blood_group"
                      value={formData.blood_group}
                      onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Medical History */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Medical History</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="medical_history_ongoing">Ongoing Medical Conditions</Label>
                    <Textarea
                      id="medical_history_ongoing"
                      value={formData.medical_history_ongoing}
                      onChange={(e) => setFormData({ ...formData, medical_history_ongoing: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medical_history_past">Past Medical History</Label>
                    <Textarea
                      id="medical_history_past"
                      value={formData.medical_history_past}
                      onChange={(e) => setFormData({ ...formData, medical_history_past: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ongoing_medications">Ongoing Medications (comma-separated)</Label>
                    <Input
                      id="ongoing_medications"
                      value={formData.ongoing_medications}
                      onChange={(e) => setFormData({ ...formData, ongoing_medications: e.target.value })}
                      placeholder="e.g., Aspirin 100mg, Metformin 500mg"
                    />
                  </div>
                </div>
              </div>

              {/* Allergies */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Allergies</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="allergic_history_drug">Drug Allergies (comma-separated)</Label>
                    <Input
                      id="allergic_history_drug"
                      value={formData.allergic_history_drug}
                      onChange={(e) => setFormData({ ...formData, allergic_history_drug: e.target.value })}
                      placeholder="e.g., Penicillin, Sulfa drugs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allergic_history_food">Food Allergies (comma-separated)</Label>
                    <Input
                      id="allergic_history_food"
                      value={formData.allergic_history_food}
                      onChange={(e) => setFormData({ ...formData, allergic_history_food: e.target.value })}
                      placeholder="e.g., Peanuts, Shellfish"
                    />
                  </div>
                </div>
              </div>

              {/* Social History */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Social History</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smoking_status">Smoking Status</Label>
                    <Select value={formData.smoking_status} onValueChange={(value) => setFormData({ ...formData, smoking_status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEVER">Never</SelectItem>
                        <SelectItem value="FORMER">Former</SelectItem>
                        <SelectItem value="CURRENT_LIGHT">Current (Light)</SelectItem>
                        <SelectItem value="CURRENT_MODERATE">Current (Moderate)</SelectItem>
                        <SelectItem value="CURRENT_HEAVY">Current (Heavy)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alcohol_consumption">Alcohol Consumption</Label>
                    <Select value={formData.alcohol_consumption} onValueChange={(value) => setFormData({ ...formData, alcohol_consumption: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEVER">Never</SelectItem>
                        <SelectItem value="OCCASIONAL">Occasional</SelectItem>
                        <SelectItem value="MODERATE">Moderate</SelectItem>
                        <SelectItem value="HEAVY">Heavy</SelectItem>
                        <SelectItem value="FORMER">Former</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      value={formData.occupation}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exercise_habits">Exercise Habits</Label>
                    <Input
                      id="exercise_habits"
                      value={formData.exercise_habits}
                      onChange={(e) => setFormData({ ...formData, exercise_habits: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Patient"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or contact number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Patients List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading patients...</p>
        </div>
      ) : filteredPatients.length === 0 ? (
        <Card className="p-12 text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No patients found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "Try a different search term" : "Add your first patient to get started"}
          </p>
          {!searchQuery && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.map((patient) => (
            <Card
              key={patient.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50"
              onClick={() => navigate(`/dashboard/patients/${patient.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {patient.first_name} {patient.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {calculateAge(patient.date_of_birth)} years • {patient.gender}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.contact_number}</span>
                </div>
                {patient.blood_group && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-4 w-4 rounded-full bg-destructive/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-destructive">B</span>
                    </div>
                    <span>Blood Group: {patient.blood_group}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Added {new Date(patient.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Patients;
