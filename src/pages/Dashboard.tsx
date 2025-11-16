import { useEffect, useState, lazy, Suspense } from "react";
import { Navigate, Route, Routes, Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Users, 
  FileText, 
  BookOpen, 
  LogOut,
  LayoutDashboard,
  Sparkles,
  User,
  Settings,
  CreditCard,
  Menu,
  X
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

const Patients = lazy(() => import("./dashboard/Patients"));
const AddPatient = lazy(() => import("./dashboard/AddPatient"));
const EditPatient = lazy(() => import("./dashboard/EditPatient"));
const PatientDetail = lazy(() => import("./dashboard/PatientDetail"));
const AddVisit = lazy(() => import("./dashboard/AddVisit"));
const VisitDetail = lazy(() => import("./dashboard/VisitDetail"));
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
            <Route path="patients/:patientId/visits/:visitId" element={<VisitDetail />} />
            <Route path="clinical-documentation/:visitId" element={<ClinicalDocumentation />} />
            <Route path="ai-tools" element={<AITools />} />
            <Route path="knowledge" element={<KnowledgeBase />} />
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
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
      
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="p-6 bg-card border rounded-lg">
          <div className="flex items-center gap-4">
            <Users className="h-10 w-10 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Patients</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-card border rounded-lg">
          <div className="flex items-center gap-4">
            <Activity className="h-10 w-10 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Visits Today</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-card border rounded-lg">
          <div className="flex items-center gap-4">
            <FileText className="h-10 w-10 text-warning" />
            <div>
              <p className="text-sm text-muted-foreground">Pending SOAP Notes</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>
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
    </div>
  );
};

export default Dashboard;
