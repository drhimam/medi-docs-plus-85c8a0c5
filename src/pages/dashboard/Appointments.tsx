import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Calendar, Plus, Clock, User, Phone, MoreVertical, Download, FileText, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AddAppointmentDialog } from "@/components/appointments/AddAppointmentDialog";
import { Link } from "react-router-dom";
import { exportAppointmentsToCsv } from "@/lib/exportToCsv";
import { exportAppointmentsToPdf } from "@/lib/exportToPdf";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status: string;
  patient_id: string;
  patients: {
    first_name: string;
    last_name: string;
    contact_number: string;
  };
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const fetchAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          patients (
            first_name,
            last_name,
            contact_number
          )
        `)
        .eq("user_id", user.id)
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appointmentId);

      if (error) throw error;
      
      toast.success("Appointment cancelled");
      fetchAppointments();
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error("Failed to cancel appointment");
    }
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", appointmentId);

      if (error) throw error;
      
      toast.success("Appointment marked as complete");
      fetchAppointments();
    } catch (error) {
      console.error("Error completing appointment:", error);
      toast.error("Failed to mark appointment as complete");
    }
  };

  const statistics = useMemo(() => {
    const total = appointments.length;
    const completed = appointments.filter(apt => apt.status === "completed").length;
    const upcoming = appointments.filter(apt => {
      const aptDate = new Date(apt.appointment_date);
      return aptDate >= new Date() && apt.status === "scheduled";
    }).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, upcoming, completionRate };
  }, [appointments]);

  const handleExportCsv = () => {
    exportAppointmentsToCsv(appointments);
    toast.success("Appointments exported to CSV");
  };

  const handleExportPdf = () => {
    exportAppointmentsToPdf(appointments);
    toast.success("Appointments exported to PDF");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      scheduled: "default",
      completed: "secondary",
      cancelled: "destructive",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading appointments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground mt-1">
            Manage your patient appointments
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="lg">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCsv}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPdf}>
                <FileText className="mr-2 h-4 w-4" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setIsAddDialogOpen(true)} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Add Appointment
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6 border-border">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Total Appointments</span>
            <span className="text-3xl font-bold text-foreground mt-2">{statistics.total}</span>
          </div>
        </Card>
        <Card className="p-6 border-border">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Completed</span>
            <span className="text-3xl font-bold text-foreground mt-2">{statistics.completed}</span>
          </div>
        </Card>
        <Card className="p-6 border-border">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Upcoming</span>
            <span className="text-3xl font-bold text-foreground mt-2">{statistics.upcoming}</span>
          </div>
        </Card>
        <Card className="p-6 border-border">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Completion Rate</span>
            <span className="text-3xl font-bold text-foreground mt-2">{statistics.completionRate}%</span>
          </div>
        </Card>
      </div>

      <Card className="border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No appointments scheduled. Click "Add Appointment" to create one.
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell className="font-medium">
                    <Link 
                      to={`/dashboard/patients/${appointment.patient_id}`}
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="underline">
                        {appointment.patients.first_name} {appointment.patients.last_name}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {appointment.patients.contact_number}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {format(new Date(appointment.appointment_date), "MMM dd, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {appointment.appointment_time}
                    </div>
                  </TableCell>
                  <TableCell>{appointment.reason}</TableCell>
                  <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCompleteAppointment(appointment.id)}>
                          Mark as Complete
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="text-destructive"
                        >
                          Cancel Appointment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <AddAppointmentDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchAppointments}
      />
    </div>
  );
}
