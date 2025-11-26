import { useEffect, useState, lazy, Suspense } from "react";
import { Navigate, Route, Routes, Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Users, 
  BookOpen, 
  LogOut,
  LayoutDashboard,
  Sparkles,
  User,
  Settings,
  CreditCard,
  Menu,
  Calendar,
  Plus,
  Clock,
  Phone,
  MoreVertical,
  Download,
  FileText,
  FileSpreadsheet,
  CheckSquare,
  StickyNote,
  CalendarClock
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { AddAppointmentDialog } from "@/components/appointments/AddAppointmentDialog";
import { format } from "date-fns";
import { exportAppointmentsToCsv } from "@/lib/exportToCsv";
import { exportAppointmentsToPdf } from "@/lib/exportToPdf";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TodoList } from "@/components/dashboard/TodoList";
import React from "react";

const Patients = lazy(() => import("./dashboard/Patients"));
const AddPatient = lazy(() => import("./dashboard/AddPatient"));
const EditPatient = lazy(() => import("./dashboard/EditPatient"));
const PatientDetail = lazy(() => import("./dashboard/PatientDetail"));
const AddVisit = lazy(() => import("./dashboard/AddVisit"));
const ClinicalDocumentation = lazy(() => import("./dashboard/ClinicalDocumentation"));
const AITools = lazy(() => import("./dashboard/AITools"));
const KnowledgeBase = lazy(() => import("./dashboard/KnowledgeBase"));

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      }
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error: any) {
      toast.error("Error logging out");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isActive = (path: string) => {
    if (path === "/dashboard" && location.pathname === "/dashboard") return true;
    if (path !== "/dashboard" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 md:h-7 md:w-7 text-primary" />
            <h1 className="text-lg md:text-xl font-bold text-foreground">aiMedipedia</h1>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/dashboard">
              <Button 
                variant={isActive("/dashboard") && location.pathname === "/dashboard" ? "default" : "ghost"}
                className="gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link to="/dashboard/patients">
              <Button 
                variant={isActive("/dashboard/patients") ? "default" : "ghost"}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                Patients
              </Button>
            </Link>
            <Link to="/dashboard/ai-tools">
              <Button 
                variant={isActive("/dashboard/ai-tools") ? "default" : "ghost"}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                AI Tools
              </Button>
            </Link>
            <Link to="/dashboard/knowledge">
              <Button 
                variant={isActive("/dashboard/knowledge") ? "default" : "ghost"}
                className="gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Knowledge Base
              </Button>
            </Link>
          </nav>

          {/* Mobile Navigation - Hamburger Menu */}
          <div className="flex md:hidden items-center gap-2">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[320px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Activity className="h-6 w-6 text-primary" />
                    <span>aiMedipedia</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-6">
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant={isActive("/dashboard") && location.pathname === "/dashboard" ? "default" : "ghost"}
                      className="w-full justify-start gap-2"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link to="/dashboard/patients" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant={isActive("/dashboard/patients") ? "default" : "ghost"}
                      className="w-full justify-start gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Patients
                    </Button>
                  </Link>
                  <Link to="/dashboard/ai-tools" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant={isActive("/dashboard/ai-tools") ? "default" : "ghost"}
                      className="w-full justify-start gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      AI Tools
                    </Button>
                  </Link>
                  <Link to="/dashboard/knowledge" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant={isActive("/dashboard/knowledge") ? "default" : "ghost"}
                      className="w-full justify-start gap-2"
                    >
                      <BookOpen className="h-4 w-4" />
                      Knowledge Base
                    </Button>
                  </Link>
                  
                  <div className="border-t my-4"></div>
                  
                  <div className="px-2 py-2 space-y-1">
                    <p className="text-sm font-medium">
                      {user?.user_metadata?.first_name && user?.user_metadata?.last_name
                        ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                        : user?.email?.split('@')[0] || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email || ""}
                    </p>
                  </div>
                  
                  <Link to="/dashboard/profile" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </Button>
                  </Link>
                  <Link to="/dashboard/settings" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Button>
                  </Link>
                  <Link to="/dashboard/billing" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <CreditCard className="h-4 w-4" />
                      Subscription & Billing
                    </Button>
                  </Link>
                  
                  <div className="border-t my-2"></div>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={user?.email || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user?.user_metadata?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                      {user?.user_metadata?.last_name?.[0]?.toUpperCase() || ""}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.user_metadata?.first_name && user?.user_metadata?.last_name
                        ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                        : user?.email?.split('@')[0] || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || ""}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/dashboard/billing")}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Subscription & Billing</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="hidden md:flex relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" alt={user?.email || ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.user_metadata?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                    {user?.user_metadata?.last_name?.[0]?.toUpperCase() || ""}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.user_metadata?.first_name && user?.user_metadata?.last_name
                      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                      : user?.email?.split('@')[0] || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || ""}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/dashboard/profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/dashboard/billing")}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Subscription & Billing</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <Activity className="h-8 w-8 animate-pulse text-primary" />
          </div>
        }>
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="patients" element={<Patients />} />
            <Route path="patients/add" element={<AddPatient />} />
            <Route path="patients/:patientId/edit" element={<EditPatient />} />
            <Route path="patients/:patientId" element={<PatientDetail />} />
            <Route path="patients/:patientId/add-visit" element={<AddVisit />} />
            <Route path="clinical-documentation/:visitId" element={<ClinicalDocumentation />} />
            <Route path="ai-tools" element={<AITools />} />
            <Route path="knowledge/*" element={<KnowledgeBase />} />
            <Route path="profile" element={<div className="p-6"><h2 className="text-2xl font-bold mb-4">User Profile</h2><p className="text-muted-foreground">Profile page coming soon...</p></div>} />
            <Route path="settings" element={<div className="p-6"><h2 className="text-2xl font-bold mb-4">Settings</h2><p className="text-muted-foreground">Settings page coming soon...</p></div>} />
            <Route path="billing" element={<div className="p-6"><h2 className="text-2xl font-bold mb-4">Subscription & Billing</h2><p className="text-muted-foreground">Billing page coming soon...</p></div>} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

const DashboardHome = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const statistics = React.useMemo(() => {
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">Dashboard</h2>
      </div>
      
      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="appointments" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Appointments</span>
          </TabsTrigger>
          <TabsTrigger value="todo" className="gap-2">
            <CheckSquare className="h-4 w-4" />
            <span className="hidden sm:inline">TODO List</span>
          </TabsTrigger>
          <TabsTrigger value="deadlines" className="gap-2">
            <CalendarClock className="h-4 w-4" />
            <span className="hidden sm:inline">Deadline Tracker</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2">
            <StickyNote className="h-4 w-4" />
            <span className="hidden sm:inline">Sticky Notes</span>
          </TabsTrigger>
        </TabsList>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-6">
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Appointments
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
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="p-6">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">Total Appointments</span>
                <span className="text-3xl font-bold text-foreground mt-2">{statistics.total}</span>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">Completed</span>
                <span className="text-3xl font-bold text-foreground mt-2">{statistics.completed}</span>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">Upcoming</span>
                <span className="text-3xl font-bold text-foreground mt-2">{statistics.upcoming}</span>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">Completion Rate</span>
                <span className="text-3xl font-bold text-foreground mt-2">{statistics.completionRate}%</span>
              </div>
            </Card>
          </div>

          {/* Appointments Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-semibold">Appointments</h3>
              <Button onClick={() => setIsAddDialogOpen(true)} size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Add Appointment
              </Button>
            </div>
            
            {loading ? (
              <Card className="border-border p-8">
                <div className="text-center text-muted-foreground">Loading appointments...</div>
              </Card>
            ) : (
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
                      appointments.map((appointment: any) => (
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
                          <TableCell>
                            <Badge variant={
                              appointment.status === "scheduled" ? "default" :
                              appointment.status === "completed" ? "secondary" :
                              "destructive"
                            }>
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={async () => {
                                  try {
                                    const { error } = await supabase
                                      .from("appointments")
                                      .delete()
                                      .eq("id", appointment.id);
                                    if (error) throw error;
                                    toast.success("Appointment marked as complete");
                                    fetchAppointments();
                                  } catch (error) {
                                    toast.error("Failed to mark appointment as complete");
                                  }
                                }}>
                                  Mark as Complete
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={async () => {
                                    try {
                                      const { error } = await supabase
                                        .from("appointments")
                                        .delete()
                                        .eq("id", appointment.id);
                                      if (error) throw error;
                                      toast.success("Appointment cancelled");
                                      fetchAppointments();
                                    } catch (error) {
                                      toast.error("Failed to cancel appointment");
                                    }
                                  }}
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
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Link to="/dashboard/patients">
                <Button className="w-full justify-start" size="lg">
                  <Users className="h-5 w-5 mr-2" />
                  Add New Patient
                </Button>
              </Link>
              <Link to="/dashboard/ai-tools">
                <Button className="w-full justify-start" size="lg" variant="outline">
                  <Sparkles className="h-5 w-5 mr-2" />
                  AI Tools
                </Button>
              </Link>
            </div>
          </div>
        </TabsContent>

        {/* TODO List Tab */}
        <TabsContent value="todo" className="space-y-6">
          <TodoList />
        </TabsContent>

        {/* Deadline Tracker Tab */}
        <TabsContent value="deadlines" className="space-y-6">
          <Card className="p-8">
            <div className="text-center">
              <CalendarClock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Deadline Tracker</h3>
              <p className="text-muted-foreground">Track important deadlines and due dates</p>
            </div>
          </Card>
        </TabsContent>

        {/* Sticky Notes Tab */}
        <TabsContent value="notes" className="space-y-6">
          <Card className="p-8">
            <div className="text-center">
              <StickyNote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Sticky Notes</h3>
              <p className="text-muted-foreground">Create quick notes and reminders</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <AddAppointmentDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchAppointments}
      />
    </div>
  );
};

export default Dashboard;
