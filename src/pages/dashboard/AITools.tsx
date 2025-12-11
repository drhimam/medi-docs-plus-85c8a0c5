import { FileText, Zap, Image, Activity, Heart, Clock, Sparkles, Target, FileSignature, BookOpen, MessageCircleQuestion } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface AITool {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  status: "active" | "coming-soon";
  route?: string;
}

interface Benefit {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const aiTools: AITool[] = [
  {
    id: "soap-notes",
    title: "Evidence-Based SOAP Note Generation",
    description: "AI-powered SOAP note generation with evidence-based recommendations. Automatically structure patient information into Subjective, Objective, Assessment, and Plan sections.",
    icon: FileText,
    status: "active",
    route: "/dashboard/clinical-documentation"
  },
  {
    id: "prescription",
    title: "Prescription Assistance",
    description: "AI-assisted prescription writing with drug interaction checking, dosage recommendations, and multilingual support for better patient communication.",
    icon: Zap,
    status: "active",
    route: "/dashboard/clinical-documentation"
  },
  {
    id: "generate-article",
    title: "Generate AI Article",
    description: "Generate comprehensive medical knowledge articles using AI. Input a topic and get a well-structured, evidence-based article for your knowledge base.",
    icon: BookOpen,
    status: "active",
    route: "/dashboard/knowledge?tab=ai-generated"
  },
  {
    id: "ask-ai",
    title: "Ask AI",
    description: "Chat with an AI assistant powered by your personal knowledge base. Get instant answers to medical questions based on your saved articles.",
    icon: MessageCircleQuestion,
    status: "active",
    route: "/dashboard/knowledge?tab=ask-ai"
  },
  {
    id: "skin-lesion",
    title: "Skin Lesion Diagnosis",
    description: "Advanced AI model for analyzing and diagnosing skin lesions. Upload images for instant analysis and recommendations.",
    icon: Image,
    status: "coming-soon"
  },
  {
    id: "xray",
    title: "X-Ray Analysis",
    description: "Intelligent X-ray image analysis with AI-powered insights. Helps identify abnormalities and provides diagnostic suggestions.",
    icon: Activity,
    status: "coming-soon"
  },
  {
    id: "ecg",
    title: "ECG Analysis",
    description: "Automated ECG interpretation with AI-powered analysis. Detects arrhythmias and provides clinical insights.",
    icon: Heart,
    status: "coming-soon"
  },
  {
    id: "document-gen",
    title: "Automated Document Generation",
    description: "Generate medical documents automatically from patient data. Create referral letters, discharge summaries, and more with one click.",
    icon: Clock,
    status: "coming-soon"
  }
];

const benefits: Benefit[] = [
  {
    title: "Increased Efficiency",
    description: "Automate routine tasks and focus on patient care instead of documentation.",
    icon: Zap,
    color: "bg-blue-500"
  },
  {
    title: "Evidence-Based Insights",
    description: "Get AI-powered recommendations based on latest medical evidence and guidelines.",
    icon: Target,
    color: "bg-green-500"
  },
  {
    title: "Better Patient Outcomes",
    description: "Improve diagnostic accuracy and treatment planning with AI assistance.",
    icon: Activity,
    color: "bg-purple-500"
  },
  {
    title: "Comprehensive Documentation",
    description: "Generate detailed, accurate medical records with minimal effort.",
    icon: FileSignature,
    color: "bg-orange-500"
  }
];

const AITools = () => {
  const navigate = useNavigate();

  const handleGetStarted = (tool: AITool) => {
    if (tool.route) {
      navigate(tool.route);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">AI Tools</h1>
        <p className="text-muted-foreground">
          Explore our suite of AI-powered tools designed to enhance your clinical practice
        </p>
      </div>

      {/* AI Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aiTools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <Card 
              key={tool.id} 
              className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              {tool.status === "coming-soon" && (
                <Badge 
                  variant="secondary" 
                  className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                >
                  Coming Soon
                </Badge>
              )}
              
              <CardHeader>
                <div className="mb-4">
                  <IconComponent className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2">{tool.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {tool.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {tool.status === "active" ? (
                  <Button 
                    onClick={() => handleGetStarted(tool)}
                    className="w-full"
                    variant="default"
                  >
                    Get Started →
                  </Button>
                ) : (
                  <Button 
                    disabled 
                    className="w-full"
                    variant="outline"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Coming Soon
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Why Use Section */}
      <Card className="mt-12">
        <CardHeader>
          <CardTitle className="text-2xl mb-2">Why Use Our AI Tools?</CardTitle>
          <CardDescription className="text-base">
            Benefits of integrating AI into your clinical workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit) => {
              const IconComponent = benefit.icon;
              return (
                <div key={benefit.title} className="flex gap-4">
                  <div className={`${benefit.color} rounded-lg p-3 h-fit`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AITools;
