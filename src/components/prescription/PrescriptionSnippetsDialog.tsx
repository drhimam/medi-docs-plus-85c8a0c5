import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BookmarkPlus, Trash2, Edit2, Plus, Check, X, Copy, Star } from "lucide-react";
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

interface Snippet {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface PrescriptionSnippetsDialogProps {
  onInsert: (content: string) => void;
  currentContent?: string;
}

export function PrescriptionSnippetsDialog({ onInsert, currentContent }: PrescriptionSnippetsDialogProps) {
  const [open, setOpen] = useState(false);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saveCurrentOpen, setSaveCurrentOpen] = useState(false);
  const [saveCurrentTitle, setSaveCurrentTitle] = useState("");

  useEffect(() => {
    if (open) {
      fetchSnippets();
    }
  }, [open]);

  const fetchSnippets = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("prescription_snippets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSnippets(data || []);
    } catch (error: any) {
      console.error("Error fetching snippets:", error);
      toast({
        title: "Error",
        description: "Failed to load snippets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNew = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter both title and content",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("prescription_snippets")
        .insert({
          user_id: user.id,
          title: newTitle.trim(),
          content: newContent.trim(),
        });

      if (error) throw error;

      toast({ title: "Success", description: "Snippet saved" });
      setNewTitle("");
      setNewContent("");
      setIsAddingNew(false);
      fetchSnippets();
    } catch (error: any) {
      console.error("Error saving snippet:", error);
      toast({
        title: "Error",
        description: "Failed to save snippet",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (id: string, title: string, content: string) => {
    try {
      const { error } = await supabase
        .from("prescription_snippets")
        .update({ title: title.trim(), content: content.trim() })
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Success", description: "Snippet updated" });
      setEditingId(null);
      fetchSnippets();
    } catch (error: any) {
      console.error("Error updating snippet:", error);
      toast({
        title: "Error",
        description: "Failed to update snippet",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("prescription_snippets")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast({ title: "Success", description: "Snippet deleted" });
      setDeleteId(null);
      fetchSnippets();
    } catch (error: any) {
      console.error("Error deleting snippet:", error);
      toast({
        title: "Error",
        description: "Failed to delete snippet",
        variant: "destructive",
      });
    }
  };

  const handleInsertSnippet = (content: string) => {
    onInsert(content);
    setOpen(false);
  };

  const handleSaveCurrent = async () => {
    if (!saveCurrentTitle.trim() || !currentContent?.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Strip HTML tags for storage
      const plainContent = currentContent.replace(/<[^>]*>/g, '').trim();

      const { error } = await supabase
        .from("prescription_snippets")
        .insert({
          user_id: user.id,
          title: saveCurrentTitle.trim(),
          content: plainContent,
        });

      if (error) throw error;

      toast({ title: "Success", description: "Current prescription saved as snippet" });
      setSaveCurrentTitle("");
      setSaveCurrentOpen(false);
      fetchSnippets();
    } catch (error: any) {
      console.error("Error saving current content:", error);
      toast({
        title: "Error",
        description: "Failed to save snippet",
        variant: "destructive",
      });
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "Copied", description: "Snippet copied to clipboard" });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Star className="h-4 w-4" />
            Snippets
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookmarkPlus className="h-5 w-5" />
              Prescription Snippets
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAddingNew(true)}
              disabled={isAddingNew}
            >
              <Plus className="h-4 w-4 mr-1" />
              New Snippet
            </Button>
            {currentContent && currentContent.replace(/<[^>]*>/g, '').trim() && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSaveCurrentOpen(true)}
              >
                <BookmarkPlus className="h-4 w-4 mr-1" />
                Save Current
              </Button>
            )}
          </div>

          {isAddingNew && (
            <div className="border rounded-lg p-4 mb-4 bg-muted/30">
              <div className="space-y-3">
                <div>
                  <Label>Title</Label>
                  <Input
                    placeholder="e.g., Common Cold Treatment"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Content</Label>
                  <Textarea
                    placeholder="Enter prescription text..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveNew}>
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => {
                      setIsAddingNew(false);
                      setNewTitle("");
                      setNewContent("");
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="text-center text-muted-foreground py-8">Loading snippets...</div>
            ) : snippets.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No snippets yet. Create your first snippet above.
              </div>
            ) : (
              <div className="space-y-3">
                {snippets.map((snippet) => (
                  <div key={snippet.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                    {editingId === snippet.id ? (
                      <EditSnippetForm
                        snippet={snippet}
                        onSave={(title, content) => handleUpdate(snippet.id, title, content)}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{snippet.title}</h4>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleCopy(snippet.content)}
                              title="Copy"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setEditingId(snippet.id)}
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => setDeleteId(snippet.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3 mb-3">
                          {snippet.content}
                        </p>
                        <Button 
                          size="sm" 
                          onClick={() => handleInsertSnippet(snippet.content)}
                        >
                          Insert
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Snippet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this snippet? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={saveCurrentOpen} onOpenChange={setSaveCurrentOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save as Snippet</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a name for this snippet to save it for future use.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label>Snippet Title</Label>
            <Input
              placeholder="e.g., Diabetes Follow-up"
              value={saveCurrentTitle}
              onChange={(e) => setSaveCurrentTitle(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSaveCurrentTitle("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveCurrent}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EditSnippetForm({ 
  snippet, 
  onSave, 
  onCancel 
}: { 
  snippet: Snippet; 
  onSave: (title: string, content: string) => void; 
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(snippet.title);
  const [content, setContent] = useState(snippet.content);

  return (
    <div className="space-y-3">
      <div>
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <Label>Content</Label>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(title, content)}>
          <Check className="h-4 w-4 mr-1" />
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
