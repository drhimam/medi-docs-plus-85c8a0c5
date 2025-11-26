
-- Add position column to todos for drag-and-drop ordering
ALTER TABLE public.todos ADD COLUMN position integer DEFAULT 0;

-- Create deadlines table
CREATE TABLE public.deadlines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  deadline_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for deadlines
ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for deadlines
CREATE POLICY "Users can view their own deadlines" ON public.deadlines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own deadlines" ON public.deadlines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own deadlines" ON public.deadlines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own deadlines" ON public.deadlines FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for deadlines updated_at
CREATE TRIGGER update_deadlines_updated_at BEFORE UPDATE ON public.deadlines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create sticky_notes table
CREATE TABLE public.sticky_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT 'yellow',
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for sticky_notes
ALTER TABLE public.sticky_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sticky_notes
CREATE POLICY "Users can view their own sticky notes" ON public.sticky_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sticky notes" ON public.sticky_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sticky notes" ON public.sticky_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sticky notes" ON public.sticky_notes FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for sticky_notes updated_at
CREATE TRIGGER update_sticky_notes_updated_at BEFORE UPDATE ON public.sticky_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
