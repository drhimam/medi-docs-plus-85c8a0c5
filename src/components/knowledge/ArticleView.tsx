import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Tag, Trash2, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Article {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  category: string | null;
  tags: string[];
  source: string;
  created_at: string;
}

export const ArticleView = () => {
  const { articleId } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      setArticle(data);
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

  const handleDelete = async () => {
    if (!article) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('knowledge_articles')
        .delete()
        .eq('id', article.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Article deleted successfully",
      });

      navigate("/dashboard/knowledge");
    } catch (error) {
      console.error('Error deleting article:', error);
      toast({
        title: "Error",
        description: "Failed to delete article",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading article...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Article not found</p>
        <Link to="/dashboard/knowledge">
          <Button className="mt-4">Back to Articles</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/dashboard/knowledge">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Articles
            </Button>
          </Link>
          
          <div className="flex gap-2">
            {article.source !== 'ai-generated' && (
              <Link to={`/dashboard/knowledge/article/${articleId}/edit`}>
                <Button variant="outline" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
            )}
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-4">
            <div>
              <CardTitle className="text-3xl mb-4">{article.title}</CardTitle>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {article.category && (
                  <Badge variant="secondary" className="text-sm">
                    {article.category}
                  </Badge>
                )}
                <Badge 
                  variant={article.source === 'manual' ? 'default' : 'outline'}
                  className="text-sm"
                >
                  {article.source === 'manual' ? 'Manual Entry' : 'AI Generated'}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(article.created_at), 'MMMM dd, yyyy')}
                </span>
              </div>

              {article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {article.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="gap-1">
                      <Tag className="h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <div 
              className="prose prose-base lg:prose-lg max-w-none 
              prose-headings:text-foreground
              prose-h1:text-4xl prose-h1:font-extrabold prose-h1:mt-0 prose-h1:mb-8 prose-h1:pb-4 prose-h1:border-b-2 prose-h1:border-primary
              prose-h2:text-3xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-3 prose-h2:border-b-2 prose-h2:border-border
              prose-h3:text-2xl prose-h3:font-bold prose-h3:mt-8 prose-h3:mb-4
              prose-h4:text-xl prose-h4:font-semibold prose-h4:mt-6 prose-h4:mb-3
              prose-p:mb-6 prose-p:leading-relaxed prose-p:text-foreground
              prose-ul:my-6 prose-ul:space-y-2
              prose-ol:my-6 prose-ol:space-y-2
              prose-li:mb-2 prose-li:leading-relaxed
              prose-table:border-collapse prose-table:w-full prose-table:my-6
              prose-th:border prose-th:border-border prose-th:p-3 prose-th:bg-muted prose-th:font-semibold prose-th:text-left
              prose-td:border prose-td:border-border prose-td:p-3
              prose-strong:text-foreground prose-strong:font-semibold
              prose-em:italic
              [&_ol]:list-decimal [&_ol]:pl-6
              [&_ul]:list-disc [&_ul]:pl-6"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{article.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
