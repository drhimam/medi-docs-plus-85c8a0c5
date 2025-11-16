import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArticlesList } from "./ArticlesList";

export const AIGenerated = () => {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [category, setCategory] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: "Error",
        description: "Please enter a topic",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-article', {
        body: { topic: topic.trim(), context: context.trim(), category: category.trim() }
      });

      if (error) throw error;

      setGeneratedTitle(data.title);
      setGeneratedContent(data.content);
      toast({
        title: "Success",
        description: "Article generated successfully",
      });
    } catch (error) {
      console.error('Error generating article:', error);
      toast({
        title: "Error",
        description: "Failed to generate article",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedTitle.trim() || !generatedContent.trim()) {
      toast({
        title: "Error",
        description: "No generated content to save",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from('knowledge_articles').insert({
        user_id: user.id,
        title: generatedTitle.trim(),
        content: generatedContent.trim(),
        category: category.trim() || null,
        tags: [topic.trim()],
        source: 'ai-generated'
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Article saved successfully",
      });

      // Reset form
      setTopic("");
      setContext("");
      setCategory("");
      setGeneratedTitle("");
      setGeneratedContent("");
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error saving article:', error);
      toast({
        title: "Error",
        description: "Failed to save article",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Generate Medical Article with AI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic *</Label>
              <Input
                id="topic"
                placeholder="e.g., Hypertension management, Diabetes complications"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="context">Additional Context</Label>
              <Textarea
                id="context"
                placeholder="Provide any specific details, guidelines, or focus areas..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-category">Category</Label>
              <Input
                id="ai-category"
                placeholder="e.g., Cardiology, Endocrinology"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="w-full gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate Article"}
            </Button>
          </CardContent>
        </Card>

        {generatedContent && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{generatedTitle}</CardTitle>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </CardHeader>
            <CardContent>
              <div 
                className="prose prose-sm max-w-none prose-headings:font-bold prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3 prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2 prose-p:mb-3 prose-ul:mb-3 prose-ol:mb-3 prose-li:mb-1 prose-table:border-collapse prose-table:w-full prose-th:border prose-th:p-2 prose-th:bg-muted prose-td:border prose-td:p-2"
                dangerouslySetInnerHTML={{ __html: generatedContent }}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <div className="lg:col-span-1">
        <ArticlesList key={refreshKey} source="ai-generated" />
      </div>
    </div>
  );
};
