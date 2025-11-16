import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, X, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor } from "./RichTextEditor";

export const EditArticle = () => {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    fetchArticle();
  }, [articleId]);

  const fetchArticle = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('*')
        .eq('id', articleId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      setTitle(data.title);
      setContent(data.content);
      setCategory(data.category || "");
      setTags(data.tags || []);
    } catch (error) {
      console.error('Error fetching article:', error);
      toast({
        title: "Error",
        description: "Failed to fetch article",
        variant: "destructive",
      });
      navigate("/dashboard/knowledge");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
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
      const { error } = await supabase
        .from('knowledge_articles')
        .update({
          title: title.trim(),
          content: content.trim(),
          category: category.trim() || null,
          tags: tags,
          updated_at: new Date().toISOString(),
        })
        .eq('id', articleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Article updated successfully",
      });

      navigate(`/dashboard/knowledge/article/${articleId}`);
    } catch (error) {
      console.error('Error updating article:', error);
      toast({
        title: "Error",
        description: "Failed to update article",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading article...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to={`/dashboard/knowledge/article/${articleId}`}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Article
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Article</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter article title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category (Optional)</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Cardiology, Neurology"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag and press Enter"
              />
              <Button type="button" onClick={handleAddTag}>Add</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Write your article content here..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/dashboard/knowledge/article/${articleId}`)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
