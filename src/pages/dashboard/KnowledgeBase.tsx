import { Route, Routes, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ManualEntry } from "@/components/knowledge/ManualEntry";
import { AIGenerated } from "@/components/knowledge/AIGenerated";
import { AskAI } from "@/components/knowledge/AskAI";
import { ArticlesLanding } from "@/components/knowledge/ArticlesLanding";
import { ArticleView } from "@/components/knowledge/ArticleView";

const KnowledgeBase = () => {
  const location = useLocation();
  const isSubRoute = location.pathname !== "/dashboard/knowledge";

  return (
    <div className="space-y-6">
      {isSubRoute && (
        <Link to="/dashboard/knowledge">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Articles
          </Button>
        </Link>
      )}

      <Routes>
        <Route path="/" element={<ArticlesLanding />} />
        <Route path="/manual-entry" element={<ManualEntry />} />
        <Route path="/ai-generated" element={<AIGenerated />} />
        <Route path="/ask-ai" element={<AskAI />} />
        <Route path="/article/:articleId" element={<ArticleView />} />
      </Routes>
    </div>
  );
};

export default KnowledgeBase;
