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
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

const Patients = lazy(() => import("./dashboard/Patients"));
const PatientDetail = lazy(() => import("./dashboard/PatientDetail"));
const VisitDetail = lazy(() => import("./dashboard/VisitDetail"));

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-bold text-foreground">aiMedipedia</h1>
          </div>

          {/* Navigation Links */}
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

          {/* Logout Button */}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t px-4 py-2 flex gap-2 overflow-x-auto">
          <Link to="/dashboard">
            <Button 
              size="sm"
              variant={isActive("/dashboard") && location.pathname === "/dashboard" ? "default" : "ghost"}
              className="gap-1.5 whitespace-nowrap"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link to="/dashboard/patients">
            <Button 
              size="sm"
              variant={isActive("/dashboard/patients") ? "default" : "ghost"}
              className="gap-1.5 whitespace-nowrap"
            >
              <Users className="h-4 w-4" />
              Patients
            </Button>
          </Link>
          <Link to="/dashboard/ai-tools">
            <Button 
              size="sm"
              variant={isActive("/dashboard/ai-tools") ? "default" : "ghost"}
              className="gap-1.5 whitespace-nowrap"
            >
              <Sparkles className="h-4 w-4" />
              AI Tools
            </Button>
          </Link>
          <Link to="/dashboard/knowledge">
            <Button 
              size="sm"
              variant={isActive("/dashboard/knowledge") ? "default" : "ghost"}
              className="gap-1.5 whitespace-nowrap"
            >
              <BookOpen className="h-4 w-4" />
              Knowledge
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-6">
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <Activity className="h-8 w-8 animate-pulse text-primary" />
          </div>
        }>
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="patients" element={<Patients />} />
            <Route path="patients/:patientId" element={<PatientDetail />} />
            <Route path="patients/:patientId/visits/:visitId" element={<VisitDetail />} />
            <Route path="ai-tools" element={<AITools />} />
            <Route path="knowledge" element={<div>Knowledge Base page coming soon...</div>} />
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

const AITools = () => {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">AI Tools</h2>
      <div className="bg-card border rounded-lg p-8 text-center">
        <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">AI-Powered Medical Tools</h3>
        <p className="text-muted-foreground">
          Advanced AI tools for medical documentation and analysis coming soon...
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
