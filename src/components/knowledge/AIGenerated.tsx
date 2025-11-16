import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const AIGenerated = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [category, setCategory] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

      navigate("/dashboard/knowledge");
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
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">AI Generated Articles</h1>
        <p className="text-muted-foreground mt-1">Generate medical knowledge articles using AI</p>
      </div>

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
              className="prose prose-base max-w-none 
              prose-headings:text-foreground
              prose-h1:text-4xl prose-h1:font-extrabold prose-h1:mt-0 prose-h1:mb-8 prose-h1:pb-4 prose-h1:border-b-2 prose-h1:border-primary
              prose-h2:text-3xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-3 prose-h2:border-b-2 prose-h2:border-border
              prose-h3:text-2xl prose-h3:font-bold prose-h3:mt-8 prose-h3:mb-4
              prose-p:mb-6 prose-p:leading-relaxed
              prose-ul:my-6 prose-ul:space-y-2
              prose-ol:my-6 prose-ol:space-y-2
              prose-li:mb-2
              prose-table:border-collapse prose-table:w-full prose-table:my-6
              prose-th:border prose-th:p-3 prose-th:bg-muted prose-th:font-semibold
              prose-td:border prose-td:p-3
              [&_ol]:list-decimal [&_ol]:pl-6
              [&_ul]:list-disc [&_ul]:pl-6"
              dangerouslySetInnerHTML={{ __html: generatedContent }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
