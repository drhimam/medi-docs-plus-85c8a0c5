import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, X, Palette } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StickyNote {
  id: string;
  title: string;
  content: string;
  color: string;
  position_x: number;
  position_y: number;
  created_at: string;
}

const COLORS = [
  { name: "yellow", bg: "bg-yellow-200", border: "border-yellow-400", text: "text-yellow-900" },
  { name: "pink", bg: "bg-pink-200", border: "border-pink-400", text: "text-pink-900" },
  { name: "blue", bg: "bg-blue-200", border: "border-blue-400", text: "text-blue-900" },
  { name: "green", bg: "bg-green-200", border: "border-green-400", text: "text-green-900" },
  { name: "purple", bg: "bg-purple-200", border: "border-purple-400", text: "text-purple-900" },
  { name: "orange", bg: "bg-orange-200", border: "border-orange-400", text: "text-orange-900" },
];

const getColorClasses = (colorName: string) => {
  return COLORS.find(c => c.name === colorName) || COLORS[0];
};

export const StickyNotes = () => {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; noteX: number; noteY: number } | null>(null);

  const fetchNotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("sticky_notes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const addNote = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Random position within bounds
      const x = Math.floor(Math.random() * 300);
      const y = Math.floor(Math.random() * 200);
      const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)].name;

      const { data, error } = await supabase.from("sticky_notes").insert({
        user_id: user.id,
        title: "New Note",
        content: "",
        color: randomColor,
        position_x: x,
        position_y: y,
      }).select().single();

      if (error) throw error;
      if (data) {
        setNotes([data, ...notes]);
        setEditingNote(data.id);
      }
    } catch (error) {
      toast.error("Failed to add note");
    }
  };

  const updateNote = async (id: string, updates: Partial<StickyNote>) => {
    try {
      const { error } = await supabase
        .from("sticky_notes")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      setNotes(notes.map(n => n.id === id ? { ...n, ...updates } : n));
    } catch (error) {
      toast.error("Failed to update note");
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase.from("sticky_notes").delete().eq("id", id);
      if (error) throw error;
      setNotes(notes.filter(n => n.id !== id));
      toast.success("Note deleted");
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const handleMouseDown = (e: React.MouseEvent, note: StickyNote) => {
    if ((e.target as HTMLElement).closest('input, textarea, button, [role="button"]')) return;
    
    e.preventDefault();
    dragRef.current = {
      id: note.id,
      startX: e.clientX,
      startY: e.clientY,
      noteX: note.position_x,
      noteY: note.position_y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    const newX = Math.max(0, dragRef.current.noteX + dx);
    const newY = Math.max(0, dragRef.current.noteY + dy);

    setNotes(notes.map(n => 
      n.id === dragRef.current?.id 
        ? { ...n, position_x: newX, position_y: newY } 
        : n
    ));
  };

  const handleMouseUp = async () => {
    if (!dragRef.current) return;
    
    const note = notes.find(n => n.id === dragRef.current?.id);
    if (note) {
      await updateNote(note.id, { position_x: note.position_x, position_y: note.position_y });
    }
    dragRef.current = null;
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">Loading notes...</div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{notes.length} notes</span>
        </div>
        <Button onClick={addNote}>
          <Plus className="mr-2 h-4 w-4" />
          Add Note
        </Button>
      </div>

      {/* Notes Container */}
      <div 
        ref={containerRef}
        className="relative min-h-[500px] bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20 p-4 overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {notes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            Click "Add Note" to create your first sticky note
          </div>
        ) : (
          notes.map((note) => {
            const colorClasses = getColorClasses(note.color);
            const isEditing = editingNote === note.id;

            return (
              <div
                key={note.id}
                className={cn(
                  "absolute w-52 shadow-lg rounded-sm transition-shadow hover:shadow-xl cursor-move select-none",
                  colorClasses.bg,
                  colorClasses.border,
                  "border-b-4",
                  isEditing && "z-10"
                )}
                style={{
                  left: note.position_x,
                  top: note.position_y,
                }}
                onMouseDown={(e) => handleMouseDown(e, note)}
              >
                {/* Note Header */}
                <div className={cn("flex items-center justify-between px-2 py-1 border-b", colorClasses.border)}>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Palette className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" align="start">
                      <div className="flex gap-1">
                        {COLORS.map((color) => (
                          <button
                            key={color.name}
                            className={cn(
                              "w-6 h-6 rounded-full border-2",
                              color.bg,
                              color.border,
                              note.color === color.name && "ring-2 ring-offset-1 ring-primary"
                            )}
                            onClick={() => updateNote(note.id, { color: color.name })}
                          />
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 hover:bg-destructive/20"
                    onClick={() => deleteNote(note.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {/* Note Content */}
                <div className="p-2 space-y-2" onClick={() => setEditingNote(note.id)}>
                  {isEditing ? (
                    <>
                      <Input
                        value={note.title}
                        onChange={(e) => setNotes(notes.map(n => n.id === note.id ? { ...n, title: e.target.value } : n))}
                        onBlur={() => updateNote(note.id, { title: note.title })}
                        className={cn("h-7 text-sm font-semibold bg-transparent border-none focus-visible:ring-1", colorClasses.text)}
                        placeholder="Title"
                      />
                      <Textarea
                        value={note.content}
                        onChange={(e) => setNotes(notes.map(n => n.id === note.id ? { ...n, content: e.target.value } : n))}
                        onBlur={() => {
                          updateNote(note.id, { content: note.content });
                          setEditingNote(null);
                        }}
                        className={cn("text-sm bg-transparent border-none resize-none focus-visible:ring-1 min-h-[80px]", colorClasses.text)}
                        placeholder="Write your note..."
                        autoFocus
                      />
                    </>
                  ) : (
                    <>
                      <h4 className={cn("font-semibold text-sm truncate", colorClasses.text)}>
                        {note.title || "Untitled"}
                      </h4>
                      <p className={cn("text-sm whitespace-pre-wrap line-clamp-4", colorClasses.text)}>
                        {note.content || "Click to edit..."}
                      </p>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
