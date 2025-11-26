import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Trash2, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  MoreVertical,
  Edit2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format, differenceInDays, differenceInHours, differenceInMinutes, isPast } from "date-fns";
import { cn } from "@/lib/utils";

interface Deadline {
  id: string;
  title: string;
  description: string | null;
  deadline_date: string;
  completed: boolean;
  created_at: string;
}

export const DeadlineTracker = () => {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDeadline, setNewDeadline] = useState({
    title: "",
    description: "",
    deadline_date: "",
    deadline_time: "12:00",
  });
  const [, setTick] = useState(0);

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchDeadlines = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("deadlines")
        .select("*")
        .eq("user_id", user.id)
        .order("deadline_date", { ascending: true });

      if (error) throw error;
      setDeadlines(data || []);
    } catch (error) {
      console.error("Error fetching deadlines:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeadlines();
  }, []);

  const handleAddDeadline = async () => {
    if (!newDeadline.title.trim() || !newDeadline.deadline_date) {
      toast.error("Please enter a title and deadline date");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const deadlineDateTime = `${newDeadline.deadline_date}T${newDeadline.deadline_time}:00`;

      const { error } = await supabase.from("deadlines").insert({
        user_id: user.id,
        title: newDeadline.title,
        description: newDeadline.description || null,
        deadline_date: deadlineDateTime,
      });

      if (error) throw error;

      toast.success("Deadline added successfully");
      setNewDeadline({ title: "", description: "", deadline_date: "", deadline_time: "12:00" });
      setIsAddDialogOpen(false);
      fetchDeadlines();
    } catch (error) {
      toast.error("Failed to add deadline");
    }
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from("deadlines")
        .update({ completed: !completed })
        .eq("id", id);

      if (error) throw error;
      setDeadlines(deadlines.map(d => d.id === id ? { ...d, completed: !completed } : d));
      toast.success(completed ? "Deadline reopened" : "Deadline completed!");
    } catch (error) {
      toast.error("Failed to update deadline");
    }
  };

  const deleteDeadline = async (id: string) => {
    try {
      const { error } = await supabase.from("deadlines").delete().eq("id", id);
      if (error) throw error;
      setDeadlines(deadlines.filter(d => d.id !== id));
      toast.success("Deadline deleted");
    } catch (error) {
      toast.error("Failed to delete deadline");
    }
  };

  const getCountdown = (deadlineDate: string) => {
    const deadline = new Date(deadlineDate);
    const now = new Date();

    if (isPast(deadline)) {
      return { text: "Overdue", urgent: true, passed: true };
    }

    const days = differenceInDays(deadline, now);
    const hours = differenceInHours(deadline, now) % 24;
    const minutes = differenceInMinutes(deadline, now) % 60;

    if (days > 0) {
      return { 
        text: `${days}d ${hours}h remaining`, 
        urgent: days <= 1,
        passed: false 
      };
    } else if (hours > 0) {
      return { 
        text: `${hours}h ${minutes}m remaining`, 
        urgent: true,
        passed: false 
      };
    } else {
      return { 
        text: `${minutes}m remaining`, 
        urgent: true,
        passed: false 
      };
    }
  };

  const getUrgencyColor = (deadlineDate: string, completed: boolean) => {
    if (completed) return "bg-emerald-500/10 border-emerald-500/20 text-emerald-600";
    
    const deadline = new Date(deadlineDate);
    const now = new Date();
    const days = differenceInDays(deadline, now);

    if (isPast(deadline)) return "bg-destructive/10 border-destructive/20 text-destructive";
    if (days <= 1) return "bg-amber-500/10 border-amber-500/20 text-amber-600";
    if (days <= 3) return "bg-yellow-500/10 border-yellow-500/20 text-yellow-600";
    return "bg-emerald-500/10 border-emerald-500/20 text-emerald-600";
  };

  const stats = {
    total: deadlines.length,
    completed: deadlines.filter(d => d.completed).length,
    overdue: deadlines.filter(d => !d.completed && isPast(new Date(d.deadline_date))).length,
    upcoming: deadlines.filter(d => !d.completed && !isPast(new Date(d.deadline_date))).length,
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">Loading deadlines...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Total</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Upcoming</div>
          <div className="text-2xl font-bold text-primary">{stats.upcoming}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Overdue</div>
          <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Completed</div>
          <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Deadlines</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Deadline
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Deadline</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter deadline title..."
                  value={newDeadline.title}
                  onChange={(e) => setNewDeadline({ ...newDeadline, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Enter description..."
                  value={newDeadline.description}
                  onChange={(e) => setNewDeadline({ ...newDeadline, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deadline_date">Date</Label>
                  <Input
                    id="deadline_date"
                    type="date"
                    value={newDeadline.deadline_date}
                    onChange={(e) => setNewDeadline({ ...newDeadline, deadline_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline_time">Time</Label>
                  <Input
                    id="deadline_time"
                    type="time"
                    value={newDeadline.deadline_time}
                    onChange={(e) => setNewDeadline({ ...newDeadline, deadline_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddDeadline}>Add Deadline</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Deadline List */}
      <div className="space-y-3">
        {deadlines.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              No deadlines yet. Click 'Add Deadline' to create one.
            </div>
          </Card>
        ) : (
          deadlines.map((deadline) => {
            const countdown = getCountdown(deadline.deadline_date);
            return (
              <Card
                key={deadline.id}
                className={cn(
                  "p-4 transition-all hover:shadow-md border-l-4",
                  deadline.completed 
                    ? "border-l-emerald-500 opacity-60" 
                    : countdown.passed 
                    ? "border-l-destructive" 
                    : countdown.urgent 
                    ? "border-l-amber-500" 
                    : "border-l-primary"
                )}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={deadline.completed}
                    onCheckedChange={() => toggleComplete(deadline.id, deadline.completed)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "font-medium",
                        deadline.completed && "line-through text-muted-foreground"
                      )}>
                        {deadline.title}
                      </p>
                      {!deadline.completed && countdown.passed && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                      {deadline.completed && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      )}
                    </div>
                    {deadline.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {deadline.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="outline" className="text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(new Date(deadline.deadline_date), "MMM dd, yyyy 'at' h:mm a")}
                      </Badge>
                      {!deadline.completed && (
                        <Badge variant="outline" className={getUrgencyColor(deadline.deadline_date, deadline.completed)}>
                          {countdown.text}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => deleteDeadline(deadline.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
