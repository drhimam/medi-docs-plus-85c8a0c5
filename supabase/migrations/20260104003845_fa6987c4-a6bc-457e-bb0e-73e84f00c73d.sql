-- Add autosave_enabled column to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS autosave_enabled boolean DEFAULT true;

-- Create visit_versions table for SOAP notes and prescription version history
CREATE TABLE public.visit_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  soap_subjective TEXT,
  soap_objective TEXT,
  soap_assessment TEXT,
  soap_plan TEXT,
  prescription TEXT,
  version_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_visit_versions_visit_id ON public.visit_versions(visit_id);
CREATE INDEX idx_visit_versions_created_at ON public.visit_versions(created_at DESC);

-- Enable RLS
ALTER TABLE public.visit_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for visit_versions
CREATE POLICY "Users can view their own visit versions" 
ON public.visit_versions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own visit versions" 
ON public.visit_versions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own visit versions" 
ON public.visit_versions 
FOR DELETE 
USING (auth.uid() = user_id);