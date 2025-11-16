import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Save, Wand2, X } from "lucide-react";
import { RichTextEditor } from "./RichTextEditor";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const ManualEntry = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleEnhanceWithAI = async () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please write some content first",
        variant: "destructive",
      });
      return;
    }

    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-article', {
        body: { content }
      });

      if (error) throw error;

      setContent(data.enhancedContent);
      toast({
        title: "Success",
        description: "Content enhanced successfully",
      });
    } catch (error) {
      console.error('Error enhancing content:', error);
      toast({
        title: "Error",
        description: "Failed to enhance content",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Error",
        description: "Title and content are required",
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
        title: title.trim(),
        content: content.trim(),
        category: category.trim() || null,
        tags: tags,
        source: 'manual'
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
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Manual Entry</h1>
        <p className="text-muted-foreground mt-1">Create a medical knowledge article manually</p>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Article Details</CardTitle>
          <div className="space-y-2">
            <Label htmlFor="title">Article Title</Label>
            <Input
              id="title"
              placeholder="Enter article title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold"
            />
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g., Cardiology, Neurology"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button type="button" onClick={handleAddTag} size="sm">Add</Button>
              </div>
            </div>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <RichTextEditor 
            content={content} 
            onChange={setContent}
            placeholder="Start writing your medical article..."
          />
          
          <div className="flex gap-2 justify-end">
            <Button
              onClick={handleEnhanceWithAI}
              disabled={isEnhancing || !content.trim()}
              variant="outline"
              className="gap-2"
            >
              <Wand2 className="h-4 w-4" />
              {isEnhancing ? "Enhancing..." : "Enhance with AI"}
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !title.trim() || !content.trim()}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Article"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
