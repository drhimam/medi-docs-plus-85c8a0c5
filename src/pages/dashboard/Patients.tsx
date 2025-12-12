import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreVertical, Calendar } from "lucide-react";
import { toast } from "sonner";
import { AddAppointmentDialog } from "@/components/appointments/AddAppointmentDialog";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  contact_number: string;
  health_card_number: string | null;
  completion_status: string;
  created_at: string;
}

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [selectedPatientForAppointment, setSelectedPatientForAppointment] = useState<string | null>(null);

  const handleSetAppointment = (patientId: string) => {
    setSelectedPatientForAppointment(patientId);
    setAppointmentDialogOpen(true);
  };

  const handleAppointmentSuccess = () => {
    toast.success("Appointment scheduled successfully");
    setSelectedPatientForAppointment(null);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("patients")
        .select("id, first_name, last_name, date_of_birth, contact_number, health_card_number, completion_status, created_at")
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

  const filteredPatients = patients.filter(
    (patient) =>
      patient.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.contact_number.includes(searchQuery) ||
      patient.health_card_number?.includes(searchQuery)
  );

  const getLastVisitDate = () => {
    // Placeholder - would fetch from visits table
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">All Patients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Total: {filteredPatients.length} patients
          </p>
        </div>
        <Button onClick={() => navigate("/dashboard/patients/add")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Patient
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search by name, contact, or health card..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading patients...</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Health Card No.</TableHead>
                <TableHead>
                  Full Name ↑
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contact Number</TableHead>
                <TableHead>Date of Birth</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    {searchQuery ? "No patients found matching your search" : "No patients yet. Add your first patient to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="text-muted-foreground italic">
                      {patient.health_card_number || "Not provided"}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => navigate(`/dashboard/patients/${patient.id}`)}
                        className="text-primary hover:underline font-medium"
                      >
                        {patient.first_name} {patient.last_name}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={patient.completion_status === "completed" ? "default" : "secondary"}
                        className={
                          patient.completion_status === "completed"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                        }
                      >
                        {patient.completion_status === "completed" ? "COMPLETE" : "INCOMPLETE"}
                      </Badge>
                    </TableCell>
                    <TableCell>{patient.contact_number}</TableCell>
                    <TableCell>{patient.date_of_birth}</TableCell>
                    <TableCell>{getLastVisitDate()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleSetAppointment(patient.id)}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            Set an appointment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AddAppointmentDialog
        open={appointmentDialogOpen}
        onOpenChange={(open) => {
          setAppointmentDialogOpen(open);
          if (!open) setSelectedPatientForAppointment(null);
        }}
        onSuccess={handleAppointmentSuccess}
        preselectedPatientId={selectedPatientForAppointment}
      />
    </div>
  );
};

export default Patients;
