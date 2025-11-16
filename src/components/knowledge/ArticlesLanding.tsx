import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileEdit, 
  Sparkles, 
  MessageSquare, 
  Search, 
  Calendar,
  Tag,
  Eye,
  Trash2
} from "lucide-react";
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

export const ArticlesLanding = () => {
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterSource, setFilterSource] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [deleteArticle, setDeleteArticle] = useState<Article | null>(null);

  const fetchArticles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
      setFilteredArticles(data || []);
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
  }, []);

  useEffect(() => {
    let filtered = [...articles];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by source
    if (filterSource !== "all") {
      filtered = filtered.filter(article => article.source === filterSource);
    }

    // Sort articles
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    setFilteredArticles(filtered);
  }, [searchQuery, sortBy, filterSource, articles]);

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

  const getPreviewText = (htmlContent: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    return text.substring(0, 200) + (text.length > 200 ? '...' : '');
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Knowledge Base</h1>
            <p className="text-muted-foreground mt-1">Browse and manage your medical knowledge articles</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Link to="/dashboard/knowledge/manual-entry">
              <Button className="gap-2">
                <FileEdit className="h-4 w-4" />
                Manual Entry
              </Button>
            </Link>
            <Link to="/dashboard/knowledge/ai-generated">
              <Button variant="secondary" className="gap-2">
                <Sparkles className="h-4 w-4" />
                AI Generate
              </Button>
            </Link>
            <Link to="/dashboard/knowledge/ask-ai">
              <Button variant="outline" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Ask AI
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles by title, content, category, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={filterSource} onValueChange={setFilterSource}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="ai-generated">AI Generated</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="title">Title A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading articles...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterSource !== "all" 
                ? "No articles found matching your filters" 
                : "No articles yet. Create your first article!"}
            </p>
            {!searchQuery && filterSource === "all" && (
              <div className="flex justify-center gap-2">
                <Link to="/dashboard/knowledge/manual-entry">
                  <Button className="gap-2">
                    <FileEdit className="h-4 w-4" />
                    Create Manual Article
                  </Button>
                </Link>
                <Link to="/dashboard/knowledge/ai-generated">
                  <Button variant="secondary" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Generate with AI
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="space-y-2">
                    <CardTitle className="line-clamp-2 text-lg">{article.title}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      {article.category && (
                        <Badge variant="secondary" className="text-xs">
                          {article.category}
                        </Badge>
                      )}
                      <Badge 
                        variant={article.source === 'manual' ? 'default' : 'outline'} 
                        className="text-xs"
                      >
                        {article.source === 'manual' ? 'Manual' : 'AI Generated'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {getPreviewText(article.content)}
                  </p>
                  
                  {article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {article.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs gap-1">
                          <Tag className="h-3 w-3" />
                          {tag}
                        </Badge>
                      ))}
                      {article.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{article.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center text-xs text-muted-foreground gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(article.created_at), 'MMM dd, yyyy')}
                  </div>

                  <div className="flex gap-2 pt-2">
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* View Article Dialog */}
      <AlertDialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <AlertDialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>{selectedArticle?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedArticle?.category && (
                  <Badge variant="secondary">
                    {selectedArticle.category}
                  </Badge>
                )}
                <Badge variant={selectedArticle?.source === 'manual' ? 'default' : 'outline'}>
                  {selectedArticle?.source === 'manual' ? 'Manual Entry' : 'AI Generated'}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {selectedArticle && format(new Date(selectedArticle.created_at), 'MMMM dd, yyyy')}
                </span>
              </div>
              {selectedArticle && selectedArticle.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedArticle.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs gap-1">
                      <Tag className="h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
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
