import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BookmarkPlus, Trash2, Edit2, Plus, Check, X, Copy, Star, FileText, Search, FolderOpen } from "lucide-react";
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
  category: string;
  created_at: string;
}

interface PrescriptionTemplate {
  id: string;
  condition: string;
  category: string;
  content: string;
}

const PRESCRIPTION_TEMPLATES: PrescriptionTemplate[] = [
  {
    id: "hypertension-1",
    condition: "Hypertension - Initial Treatment",
    category: "Cardiovascular",
    content: `Rx:
1. Tab. Amlodipine 5mg
   - Take one tablet once daily in the morning
   - Duration: 30 days

2. Tab. Telmisartan 40mg
   - Take one tablet once daily in the morning
   - Duration: 30 days

Advice:
- Low salt diet (<5g/day)
- Regular exercise (30 min walk daily)
- Avoid smoking and alcohol
- Monitor BP daily and maintain a log
- Follow up after 2 weeks`
  },
  {
    id: "hypertension-2",
    condition: "Hypertension - Follow-up (Controlled)",
    category: "Cardiovascular",
    content: `Rx:
1. Tab. Amlodipine 5mg
   - Continue one tablet once daily in the morning
   - Duration: 30 days

Advice:
- Continue low salt diet
- Maintain regular exercise routine
- Continue BP monitoring
- Follow up after 1 month`
  },
  {
    id: "diabetes-1",
    condition: "Type 2 Diabetes - Initial Treatment",
    category: "Endocrine",
    content: `Rx:
1. Tab. Metformin 500mg
   - Take one tablet twice daily after meals
   - Duration: 30 days

2. Tab. Glimepiride 1mg
   - Take one tablet once daily before breakfast
   - Duration: 30 days

Advice:
- Diabetic diet (avoid sugar, white rice, potatoes)
- Regular exercise (30 min walk daily)
- Monitor fasting blood sugar weekly
- Carry sugar/candy for hypoglycemia
- Follow up after 2 weeks with FBS report`
  },
  {
    id: "diabetes-2",
    condition: "Type 2 Diabetes - Follow-up (Controlled)",
    category: "Endocrine",
    content: `Rx:
1. Tab. Metformin 500mg
   - Continue one tablet twice daily after meals
   - Duration: 30 days

Advice:
- Continue diabetic diet
- Maintain exercise routine
- HbA1c test every 3 months
- Annual eye and kidney function tests
- Follow up after 1 month`
  },
  {
    id: "common-cold",
    condition: "Common Cold / URTI",
    category: "Respiratory",
    content: `Rx:
1. Tab. Paracetamol 650mg
   - Take one tablet every 6-8 hours if fever/body ache
   - Duration: 3 days

2. Tab. Cetirizine 10mg
   - Take one tablet at bedtime
   - Duration: 5 days

3. Syp. Dextromethorphan + Phenylephrine
   - Take 10ml three times daily
   - Duration: 5 days

4. Steam inhalation
   - Three times daily for 10 minutes

Advice:
- Plenty of warm fluids
- Rest adequately
- Gargle with warm salt water
- Avoid cold beverages
- Follow up if symptoms persist beyond 5 days`
  },
  {
    id: "gastritis",
    condition: "Gastritis / Acid Peptic Disease",
    category: "Gastrointestinal",
    content: `Rx:
1. Cap. Pantoprazole 40mg
   - Take one capsule before breakfast
   - Duration: 14 days

2. Tab. Domperidone 10mg
   - Take one tablet three times daily before meals
   - Duration: 7 days

3. Syp. Sucralfate 10ml
   - Take 10ml three times daily before meals
   - Duration: 14 days

Advice:
- Avoid spicy, oily, and fried foods
- Eat small frequent meals
- Avoid smoking and alcohol
- Don't lie down immediately after eating
- Reduce stress
- Follow up after 2 weeks`
  },
  {
    id: "uti",
    condition: "Urinary Tract Infection",
    category: "Urology",
    content: `Rx:
1. Tab. Nitrofurantoin 100mg
   - Take one tablet twice daily after meals
   - Duration: 7 days

2. Tab. Paracetamol 650mg
   - Take one tablet every 6-8 hours if fever
   - Duration: As needed

Advice:
- Drink plenty of water (3-4 liters/day)
- Complete the full course of antibiotics
- Urinate frequently, don't hold
- Maintain personal hygiene
- Follow up if symptoms persist
- Repeat urine culture after completing antibiotics`
  },
  {
    id: "allergic-rhinitis",
    condition: "Allergic Rhinitis",
    category: "ENT",
    content: `Rx:
1. Tab. Levocetirizine 5mg
   - Take one tablet at bedtime
   - Duration: 14 days

2. Nasal spray Fluticasone
   - 2 sprays in each nostril once daily
   - Duration: 14 days

3. Tab. Montelukast 10mg
   - Take one tablet at bedtime
   - Duration: 14 days

Advice:
- Avoid known allergens (dust, pollen)
- Use air purifier if possible
- Keep windows closed during high pollen days
- Wash nasal passages with saline
- Follow up after 2 weeks`
  },
  {
    id: "migraine",
    condition: "Migraine",
    category: "Neurology",
    content: `Rx:
For acute attack:
1. Tab. Sumatriptan 50mg
   - Take one tablet at onset of headache
   - May repeat after 2 hours if needed (max 2/day)

For prevention:
2. Tab. Propranolol 20mg
   - Take one tablet twice daily
   - Duration: 30 days

3. Tab. Amitriptyline 10mg
   - Take one tablet at bedtime
   - Duration: 30 days

Advice:
- Maintain regular sleep schedule
- Avoid known triggers
- Stay hydrated
- Reduce screen time
- Practice relaxation techniques
- Maintain headache diary
- Follow up after 1 month`
  },
  {
    id: "lower-back-pain",
    condition: "Lower Back Pain (Muscular)",
    category: "Orthopedics",
    content: `Rx:
1. Tab. Aceclofenac 100mg + Paracetamol 325mg
   - Take one tablet twice daily after meals
   - Duration: 5 days

2. Tab. Thiocolchicoside 4mg
   - Take one tablet twice daily
   - Duration: 5 days

3. Cap. Vitamin D3 60000 IU
   - Take one capsule once weekly
   - Duration: 8 weeks

Advice:
- Hot fomentation locally
- Avoid prolonged sitting/standing
- Use firm mattress
- Maintain proper posture
- Gentle stretching exercises
- Avoid heavy lifting
- Follow up if pain persists`
  }
];

const SNIPPET_CATEGORIES = [
  "General",
  "Cardiovascular",
  "Endocrine",
  "Respiratory",
  "Gastrointestinal",
  "Urology",
  "ENT",
  "Neurology",
  "Orthopedics",
  "Dermatology",
  "Pediatrics",
  "Other"
];

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
  const [newCategory, setNewCategory] = useState("General");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saveCurrentOpen, setSaveCurrentOpen] = useState(false);
  const [saveCurrentTitle, setSaveCurrentTitle] = useState("");
  const [saveCurrentCategory, setSaveCurrentCategory] = useState("General");
  const [templateFilter, setTemplateFilter] = useState<string>("all");
  const [snippetCategoryFilter, setSnippetCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editedTemplateTitle, setEditedTemplateTitle] = useState("");
  const [editedTemplateContent, setEditedTemplateContent] = useState("");
  const [editedTemplateCategory, setEditedTemplateCategory] = useState("");

  const templateCategories = ["all", ...Array.from(new Set(PRESCRIPTION_TEMPLATES.map(t => t.category)))];
  const snippetCategories = ["all", ...Array.from(new Set(snippets.map(s => s.category || "General")))];

  const filteredTemplates = PRESCRIPTION_TEMPLATES.filter(template => {
    const matchesCategory = templateFilter === "all" || template.category === templateFilter;
    const matchesSearch = searchQuery === "" || 
      template.condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredSnippets = snippets.filter(snippet => {
    const matchesCategory = snippetCategoryFilter === "all" || (snippet.category || "General") === snippetCategoryFilter;
    const matchesSearch = searchQuery === "" ||
      snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (snippet.category || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group snippets by category for display
  const groupedSnippets = filteredSnippets.reduce((acc, snippet) => {
    const category = snippet.category || "General";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(snippet);
    return acc;
  }, {} as Record<string, Snippet[]>);

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
        .order("category", { ascending: true })
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
          category: newCategory,
        });

      if (error) throw error;

      toast({ title: "Success", description: "Snippet saved" });
      setNewTitle("");
      setNewContent("");
      setNewCategory("General");
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

  const handleUpdate = async (id: string, title: string, content: string, category: string) => {
    try {
      const { error } = await supabase
        .from("prescription_snippets")
        .update({ title: title.trim(), content: content.trim(), category })
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

      const plainContent = currentContent.replace(/<[^>]*>/g, '').trim();

      const { error } = await supabase
        .from("prescription_snippets")
        .insert({
          user_id: user.id,
          title: saveCurrentTitle.trim(),
          content: plainContent,
          category: saveCurrentCategory,
        });

      if (error) throw error;

      toast({ title: "Success", description: "Current prescription saved as snippet" });
      setSaveCurrentTitle("");
      setSaveCurrentCategory("General");
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
    toast({ title: "Copied", description: "Content copied to clipboard" });
  };

  const handleEditTemplate = (template: PrescriptionTemplate) => {
    setEditingTemplateId(template.id);
    setEditedTemplateTitle(template.condition);
    setEditedTemplateContent(template.content);
    setEditedTemplateCategory(template.category);
  };

  const handleSaveEditedTemplate = async () => {
    if (!editedTemplateTitle.trim() || !editedTemplateContent.trim()) {
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
          title: editedTemplateTitle.trim(),
          content: editedTemplateContent.trim(),
          category: editedTemplateCategory,
        });

      if (error) throw error;

      toast({ title: "Success", description: "Template saved to My Snippets" });
      setEditingTemplateId(null);
      setEditedTemplateTitle("");
      setEditedTemplateContent("");
      setEditedTemplateCategory("");
      fetchSnippets();
    } catch (error: any) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    }
  };

  const handleCancelEditTemplate = () => {
    setEditingTemplateId(null);
    setEditedTemplateTitle("");
    setEditedTemplateContent("");
    setEditedTemplateCategory("");
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
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookmarkPlus className="h-5 w-5" />
              Prescription Snippets & Templates
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="templates" className="gap-2">
                <FileText className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="snippets" className="gap-2">
                <Star className="h-4 w-4" />
                My Snippets
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="mt-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates by condition, medication, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {templateCategories.map((cat) => (
                  <Button
                    key={cat}
                    variant={templateFilter === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTemplateFilter(cat)}
                    className="capitalize"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-3">
                  {filteredTemplates.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No templates found matching "{searchQuery}"
                    </div>
                  ) : (
                    filteredTemplates.map((template) => (
                      <div key={template.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                        {editingTemplateId === template.id ? (
                          <div className="space-y-3">
                            <div>
                              <Label>Title</Label>
                              <Input
                                value={editedTemplateTitle}
                                onChange={(e) => setEditedTemplateTitle(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Category</Label>
                              <Select value={editedTemplateCategory} onValueChange={setEditedTemplateCategory}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {SNIPPET_CATEGORIES.map((cat) => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Content</Label>
                              <Textarea
                                value={editedTemplateContent}
                                onChange={(e) => setEditedTemplateContent(e.target.value)}
                                rows={8}
                                className="font-mono text-sm"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSaveEditedTemplate}>
                                <Check className="h-4 w-4 mr-1" />
                                Save to My Snippets
                              </Button>
                              <Button size="sm" variant="ghost" onClick={handleCancelEditTemplate}>
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-medium">{template.condition}</h4>
                                <span className="text-xs text-muted-foreground">{template.category}</span>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleEditTemplate(template)}
                                  title="Edit & Save as Snippet"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleCopy(template.content)}
                                  title="Copy"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4 mb-3">
                              {template.content}
                            </p>
                            <Button 
                              size="sm" 
                              onClick={() => handleInsertSnippet(template.content)}
                            >
                              Insert Template
                            </Button>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="snippets" className="mt-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search snippets by title, content, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex gap-2 flex-wrap flex-1">
                  {snippetCategories.map((cat) => (
                    <Button
                      key={cat}
                      variant={snippetCategoryFilter === cat ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSnippetCategoryFilter(cat)}
                      className="capitalize gap-1"
                    >
                      {cat !== "all" && <FolderOpen className="h-3 w-3" />}
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>
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
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Title</Label>
                        <Input
                          placeholder="e.g., Common Cold Treatment"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select value={newCategory} onValueChange={setNewCategory}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SNIPPET_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
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
                          setNewCategory("General");
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <ScrollArea className="h-[350px] pr-4">
                {isLoading ? (
                  <div className="text-center text-muted-foreground py-8">Loading snippets...</div>
                ) : filteredSnippets.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    {searchQuery ? `No snippets found matching "${searchQuery}"` : "No snippets yet. Create your first snippet above."}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedSnippets).map(([category, categorySnippets]) => (
                      <div key={category}>
                        <div className="flex items-center gap-2 mb-2 sticky top-0 bg-background py-1">
                          <FolderOpen className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-medium text-sm text-muted-foreground">{category}</h3>
                          <span className="text-xs text-muted-foreground">({categorySnippets.length})</span>
                        </div>
                        <div className="space-y-3 ml-2">
                          {categorySnippets.map((snippet) => (
                            <div key={snippet.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                              {editingId === snippet.id ? (
                                <EditSnippetForm
                                  snippet={snippet}
                                  onSave={(title, content, category) => handleUpdate(snippet.id, title, content, category)}
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
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
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
              Enter a name and category for this snippet to save it for future use.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>Snippet Title</Label>
              <Input
                placeholder="e.g., Diabetes Follow-up"
                value={saveCurrentTitle}
                onChange={(e) => setSaveCurrentTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={saveCurrentCategory} onValueChange={setSaveCurrentCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SNIPPET_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setSaveCurrentTitle("");
              setSaveCurrentCategory("General");
            }}>Cancel</AlertDialogCancel>
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
  onSave: (title: string, content: string, category: string) => void; 
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(snippet.title);
  const [content, setContent] = useState(snippet.content);
  const [category, setCategory] = useState(snippet.category || "General");

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SNIPPET_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Content</Label>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(title, content, category)}>
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
