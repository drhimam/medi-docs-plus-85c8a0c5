import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Pill, BookOpen, Users, Shield, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { EDoctorDeskLogo } from "@/components/EDoctorDeskLogo";

const Index = () => {
  const features = [
    {
      icon: Users,
      title: "Patient Management",
      description: "Comprehensive patient records with complete medical history, medications, and social history"
    },
    {
      icon: Stethoscope,
      title: "Visit Tracking",
      description: "Document patient visits with detailed HPI, vital signs, and physical examinations"
    },
    {
      icon: FileText,
      title: "SOAP Notes",
      description: "AI-powered SOAP note generation with RAG for clinically accurate assessments"
    },
    {
      icon: Pill,
      title: "Prescriptions",
      description: "Generate context-aware prescriptions based on patient history and current visit"
    },
    {
      icon: BookOpen,
      title: "Knowledge Base",
      description: "Evidence-based medical articles with proper citations and evidence levels"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your patient data is encrypted and protected with industry-standard security"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      {/* Hero Section */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <EDoctorDeskLogo className="h-8 w-8" />
              <h1 className="text-2xl font-bold text-primary">eDoctorDesk</h1>
            </div>
            <div className="flex gap-4">
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Content */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-5xl font-bold leading-tight text-foreground">
            Intelligent Medical Documentation
            <span className="block text-primary">Powered by AI</span>
          </h2>
          <p className="mb-8 text-xl text-muted-foreground">
            Transform your medical practice with AI-assisted SOAP notes, intelligent prescriptions, 
            and evidence-based knowledge - all in one comprehensive platform.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="text-lg">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-20">
        <div className="mb-12 text-center">
          <h3 className="mb-4 text-3xl font-bold text-foreground">
            Everything You Need for Modern Medical Practice
          </h3>
          <p className="text-lg text-muted-foreground">
            Comprehensive tools designed by healthcare professionals, for healthcare professionals
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 p-6 transition-all hover:shadow-lg hover:border-primary/50">
              <feature.icon className="mb-4 h-12 w-12 text-primary" />
              <h4 className="mb-2 text-xl font-semibold text-foreground">{feature.title}</h4>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-primary/5 py-20">
        <div className="container mx-auto px-6 text-center">
          <h3 className="mb-6 text-4xl font-bold text-foreground">
            Ready to Transform Your Practice?
          </h3>
          <p className="mb-8 text-xl text-muted-foreground">
            Join healthcare professionals who trust eDoctorDesk for their daily documentation needs
          </p>
          <Link to="/register">
            <Button size="lg" className="text-lg">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>© 2025 eDoctorDesk. All rights reserved.</p>
          <p className="mt-2">Professional medical documentation platform</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
