-- Create table for prescription snippets
CREATE TABLE public.prescription_snippets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prescription_snippets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own snippets" 
ON public.prescription_snippets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own snippets" 
ON public.prescription_snippets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own snippets" 
ON public.prescription_snippets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own snippets" 
ON public.prescription_snippets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_prescription_snippets_updated_at
BEFORE UPDATE ON public.prescription_snippets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();