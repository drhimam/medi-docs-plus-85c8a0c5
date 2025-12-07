-- Add category column to prescription_snippets table
ALTER TABLE public.prescription_snippets 
ADD COLUMN category text DEFAULT 'General';