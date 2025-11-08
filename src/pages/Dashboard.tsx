import { useEffect, useState } from "react";
import { Navigate, Route, Routes, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Users, 
  FileText, 
  Pill, 
  BookOpen, 
  LogOut,
  LayoutDashboard,
  Menu
} from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Dashboard = () => {
  const navigate = useNavigate();
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

  const NavLinks = () => (
    <>
      <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground">
        <LayoutDashboard className="h-5 w-5" />
        <span>Dashboard</span>
      </Link>
      <Link to="/dashboard/patients" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground">
        <Users className="h-5 w-5" />
        <span>Patients</span>
      </Link>
      <Link to="/dashboard/soap-notes" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground">
        <FileText className="h-5 w-5" />
        <span>SOAP Notes</span>
      </Link>
      <Link to="/dashboard/prescriptions" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground">
        <Pill className="h-5 w-5" />
        <span>Prescriptions</span>
      </Link>
      <Link to="/dashboard/knowledge" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground">
        <BookOpen className="h-5 w-5" />
        <span>Knowledge Base</span>
      </Link>
    </>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar border-r border-sidebar-border">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-sidebar-foreground" />
            <h1 className="text-xl font-bold text-sidebar-foreground">AiMediPedia</h1>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavLinks />
        </nav>
        
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold">AiMediPedia</h1>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar">
              <nav className="flex flex-col gap-2 mt-8">
                <NavLinks />
                <Button
                  variant="ghost"
                  className="justify-start text-sidebar-foreground hover:bg-sidebar-accent mt-4"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Logout
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="patients" element={<div>Patients page coming soon...</div>} />
            <Route path="soap-notes" element={<div>SOAP Notes page coming soon...</div>} />
            <Route path="prescriptions" element={<div>Prescriptions page coming soon...</div>} />
            <Route path="knowledge" element={<div>Knowledge Base page coming soon...</div>} />
          </Routes>
        </main>
      </div>
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
          <Link to="/dashboard/soap-notes">
            <Button className="w-full justify-start" size="lg" variant="outline">
              <FileText className="h-5 w-5 mr-2" />
              Create SOAP Note
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
