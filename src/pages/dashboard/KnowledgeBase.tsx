import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { FileEdit, Sparkles, MessageSquare } from "lucide-react";
import { ManualEntry } from "@/components/knowledge/ManualEntry";
import { AIGenerated } from "@/components/knowledge/AIGenerated";
import { AskAI } from "@/components/knowledge/AskAI";

const KnowledgeBase = () => {
  const [activeTab, setActiveTab] = useState("manual");

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Knowledge Base</h1>
        <p className="text-muted-foreground mt-1">Create and manage medical knowledge articles</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="manual" className="gap-2">
            <FileEdit className="h-4 w-4" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger value="ai-generated" className="gap-2">
            <Sparkles className="h-4 w-4" />
            AI Generated
          </TabsTrigger>
          <TabsTrigger value="ask-ai" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Ask AI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-0">
          <ManualEntry />
        </TabsContent>

        <TabsContent value="ai-generated" className="mt-0">
          <AIGenerated />
        </TabsContent>

        <TabsContent value="ask-ai" className="mt-0">
          <AskAI />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KnowledgeBase;
