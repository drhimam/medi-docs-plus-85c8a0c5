import { Route, Routes } from "react-router-dom";
import { ManualEntry } from "@/components/knowledge/ManualEntry";
import { AIGenerated } from "@/components/knowledge/AIGenerated";
import { AskAI } from "@/components/knowledge/AskAI";
import { ArticlesLanding } from "@/components/knowledge/ArticlesLanding";
import { ArticleView } from "@/components/knowledge/ArticleView";
import { EditArticle } from "@/components/knowledge/EditArticle";

const KnowledgeBase = () => {
  return (
    <div className="space-y-6">
      <Routes>
        <Route path="/" element={<ArticlesLanding />} />
        <Route path="/manual-entry" element={<ManualEntry />} />
        <Route path="/ai-generated" element={<AIGenerated />} />
        <Route path="/ask-ai" element={<AskAI />} />
        <Route path="/article/:articleId" element={<ArticleView />} />
        <Route path="/article/:articleId/edit" element={<EditArticle />} />
      </Routes>
    </div>
  );
};

export default KnowledgeBase;
