import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
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
import { ScrollArea } from "@/components/ui/scroll-area";

interface Article {
  id: string;
  title: string;
  content: string;
  category: string | null;
  tags: string[];
  source: string;
  created_at: string;
}

interface ArticlesListProps {
  source?: string;
}

export const ArticlesList = ({ source }: ArticlesListProps) => {
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [deleteArticle, setDeleteArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchArticles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('knowledge_articles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (source) {
        query = query.eq('source', source);
      }

      const { data, error } = await query;

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch articles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [source]);

  const handleDelete = async (article: Article) => {
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

      fetchArticles();
      setDeleteArticle(null);
    } catch (error) {
      console.error('Error deleting article:', error);
      toast({
        title: "Error",
        description: "Failed to delete article",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {source === 'manual' ? 'Manual Articles' : source === 'ai-generated' ? 'AI Generated Articles' : 'All Articles'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : articles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No articles yet</p>
            ) : (
              <div className="space-y-3">
                {articles.map((article) => (
                  <Card key={article.id} className="p-3">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm line-clamp-2">{article.title}</h4>
                      {article.category && (
                        <Badge variant="outline" className="text-xs">
                          {article.category}
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(article.created_at), 'MMM dd, yyyy')}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedArticle(article)}
                          className="flex-1 gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteArticle(article)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* View Article Dialog */}
      <AlertDialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>{selectedArticle?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedArticle?.category && (
                <Badge variant="outline" className="mr-2">
                  {selectedArticle.category}
                </Badge>
              )}
              {selectedArticle && format(new Date(selectedArticle.created_at), 'MMMM dd, yyyy')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div 
            className="prose prose-sm max-w-none prose-headings:font-bold prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3 prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2 prose-p:mb-3 prose-ul:mb-3 prose-ol:mb-3 prose-li:mb-1 prose-table:border-collapse prose-table:w-full prose-th:border prose-th:p-2 prose-th:bg-muted prose-td:border prose-td:p-2"
            dangerouslySetInnerHTML={{ __html: selectedArticle?.content || '' }}
          />
          <AlertDialogFooter>
            <AlertDialogAction>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteArticle} onOpenChange={() => setDeleteArticle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteArticle?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteArticle && handleDelete(deleteArticle)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
