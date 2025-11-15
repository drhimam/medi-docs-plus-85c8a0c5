import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  ChevronDown,
  Edit,
  Trash2,
  FileDown,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  contact_number: string;
  email: string | null;
  address: string | null;
  blood_group: string | null;
  health_card_number: string | null;
  medical_history_ongoing: string | null;
  medical_history_past: string | null;
  surgical_history: string | null;
  hospitalization_history: string | null;
  family_history: string | null;
  mental_health_history: string | null;
  ongoing_medications: any;
  supplements: any;
  vaccinations: any;
  allergic_history_drug: any;
  allergic_history_food: any;
  allergic_history_env: any;
  smoking_status: string;
  alcohol_consumption: string;
  recreational_drug_use: string | null;
  exercise_habits: string | null;
  diet: string | null;
  occupation: string | null;
  living_environment: string | null;
}

interface Visit {
  id: string;
  visit_date: string;
  visit_type: string;
  chief_complaint: string;
  status: string;
}

const PatientDetail = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatient();
    fetchVisits();
  }, [patientId]);

  const fetchPatient = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();

      if (error) throw error;
      setPatient(data);
    } catch (error: any) {
      toast.error("Failed to load patient");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVisits = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("visits")
        .select("*")
        .eq("patient_id", patientId)
        .order("visit_date", { ascending: false });

      if (error) throw error;
      setVisits(data || []);
    } catch (error: any) {
      console.error(error);
    }
  };

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

  const getAllergies = () => {
    const allergies = [];
    if (patient?.allergic_history_drug && Array.isArray(patient.allergic_history_drug) && patient.allergic_history_drug.length > 0) {
      allergies.push(...patient.allergic_history_drug.map((a: any) => `Drug: ${a}`));
    }
    if (patient?.allergic_history_food && Array.isArray(patient.allergic_history_food) && patient.allergic_history_food.length > 0) {
      allergies.push(...patient.allergic_history_food.map((a: any) => `Food: ${a}`));
    }
    if (patient?.allergic_history_env && Array.isArray(patient.allergic_history_env) && patient.allergic_history_env.length > 0) {
      allergies.push(...patient.allergic_history_env.map((a: any) => `Env: ${a}`));
    }
    return allergies.length > 0 ? allergies.join(", ") : "None";
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this patient?")) return;
    
    try {
      const { error } = await (supabase as any)
        .from("patients")
        .delete()
        .eq("id", patientId);

      if (error) throw error;
      toast.success("Patient deleted successfully");
      navigate("/dashboard/patients");
    } catch (error: any) {
      toast.error("Failed to delete patient");
      console.error(error);
    }
  };

  const handleExport = (format: string) => {
    toast.info(`Export to ${format.toUpperCase()} feature coming soon`);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-muted-foreground">Loading patient...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Patient not found</p>
        <Button onClick={() => navigate("/dashboard/patients")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Patients
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/dashboard/patients")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Patients
      </Button>

      {/* Header Section */}
      <Card className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              {patient.first_name} {patient.last_name}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>DOB: {patient.date_of_birth} ({calculateAge(patient.date_of_birth)} years)</span>
              <span>Health Card: {patient.health_card_number || "Not provided"}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm">Allergies: {getAllergies()}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/dashboard/patients/${patientId}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("md")}>
                <FileDown className="mr-2 h-4 w-4" />
                Export MD
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                <FileDown className="mr-2 h-4 w-4" />
                Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      {/* Section 1: Patient Information - Collapsible */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Patient Information</h2>

        {/* Demographics */}
        <Collapsible>
          <Card>
            <CollapsibleTrigger className="w-full p-4 flex justify-between items-center hover:bg-accent/50 transition-colors">
              <h3 className="text-lg font-medium">Demographics</h3>
              <ChevronDown className="h-5 w-5 transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 pt-0 space-y-3 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium">{patient.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Blood Group</p>
                    <p className="font-medium">{patient.blood_group || "Not recorded"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <p className="font-medium">{patient.contact_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{patient.email || "Not provided"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{patient.address || "Not provided"}</p>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Medical History */}
        <Collapsible>
          <Card>
            <CollapsibleTrigger className="w-full p-4 flex justify-between items-center hover:bg-accent/50 transition-colors">
              <h3 className="text-lg font-medium">Medical History</h3>
              <ChevronDown className="h-5 w-5 transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 pt-0 space-y-3 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Ongoing Conditions</p>
                  <p className="font-medium">{patient.medical_history_ongoing || "None recorded"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Past Medical History</p>
                  <p className="font-medium">{patient.medical_history_past || "None recorded"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Surgical History</p>
                  <p className="font-medium">{patient.surgical_history || "None recorded"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hospitalization History</p>
                  <p className="font-medium">{patient.hospitalization_history || "None recorded"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Family History</p>
                  <p className="font-medium">{patient.family_history || "None recorded"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mental Health History</p>
                  <p className="font-medium">{patient.mental_health_history || "None recorded"}</p>
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Medications & Supplements */}
        <Collapsible>
          <Card>
            <CollapsibleTrigger className="w-full p-4 flex justify-between items-center hover:bg-accent/50 transition-colors">
              <h3 className="text-lg font-medium">Medications & Supplements</h3>
              <ChevronDown className="h-5 w-5 transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 pt-0 space-y-3 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Ongoing Medications</p>
                  <p className="font-medium">
                    {patient.ongoing_medications && Array.isArray(patient.ongoing_medications) && patient.ongoing_medications.length > 0
                      ? patient.ongoing_medications.join(", ")
                      : "None"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Supplements</p>
                  <p className="font-medium">
                    {patient.supplements && Array.isArray(patient.supplements) && patient.supplements.length > 0
                      ? patient.supplements.join(", ")
                      : "None"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vaccinations</p>
                  <p className="font-medium">
                    {patient.vaccinations && Array.isArray(patient.vaccinations) && patient.vaccinations.length > 0
                      ? patient.vaccinations.join(", ")
                      : "None"}
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Social History */}
        <Collapsible>
          <Card>
            <CollapsibleTrigger className="w-full p-4 flex justify-between items-center hover:bg-accent/50 transition-colors">
              <h3 className="text-lg font-medium">Social History</h3>
              <ChevronDown className="h-5 w-5 transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 pt-0 space-y-3 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Smoking Status</p>
                    <p className="font-medium">{patient.smoking_status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Alcohol Consumption</p>
                    <p className="font-medium">{patient.alcohol_consumption}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Recreational Drug Use</p>
                    <p className="font-medium">{patient.recreational_drug_use || "Not recorded"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Exercise Habits</p>
                    <p className="font-medium">{patient.exercise_habits || "Not recorded"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Diet</p>
                    <p className="font-medium">{patient.diet || "Not recorded"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Occupation</p>
                    <p className="font-medium">{patient.occupation || "Not recorded"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Living Environment</p>
                    <p className="font-medium">{patient.living_environment || "Not recorded"}</p>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* Section 2: Visits Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Visit History</h2>
          <Button onClick={() => toast.info("Add visit feature coming soon")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Visit
          </Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Chief Complaint</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No visits recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                visits.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell>{visit.visit_date}</TableCell>
                    <TableCell>{visit.visit_type}</TableCell>
                    <TableCell>{visit.chief_complaint}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{visit.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/dashboard/patients/${patientId}/visits/${visit.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Section 3: Uploaded Documents */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Uploaded Documents</h2>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Associated Visit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No documents uploaded yet. Documents are uploaded during individual visits.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default PatientDetail;
