-- Create table for SOAP PDF export settings
CREATE TABLE public.soap_export_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  -- Header settings
  header_title TEXT NOT NULL DEFAULT 'SOAP NOTE',
  header_background_color TEXT NOT NULL DEFAULT '#2980b9',
  header_text_color TEXT NOT NULL DEFAULT '#ffffff',
  -- Logo settings
  logo_path TEXT,
  logo_width INTEGER DEFAULT 50,
  logo_height INTEGER DEFAULT 30,
  logo_enabled BOOLEAN NOT NULL DEFAULT false,
  -- Section colors
  subjective_color TEXT NOT NULL DEFAULT '#3498db',
  objective_color TEXT NOT NULL DEFAULT '#2ecc71',
  assessment_color TEXT NOT NULL DEFAULT '#9b59b6',
  plan_color TEXT NOT NULL DEFAULT '#e67e22',
  -- Body settings
  body_font TEXT NOT NULL DEFAULT 'helvetica',
  body_font_size INTEGER NOT NULL DEFAULT 10,
  body_text_color TEXT NOT NULL DEFAULT '#3c3c3c',
  -- Footer settings
  footer_enabled BOOLEAN NOT NULL DEFAULT true,
  footer_text TEXT,
  footer_text_color TEXT NOT NULL DEFAULT '#969696',
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.soap_export_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own SOAP export settings" 
ON public.soap_export_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own SOAP export settings" 
ON public.soap_export_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own SOAP export settings" 
ON public.soap_export_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own SOAP export settings" 
ON public.soap_export_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_soap_export_settings_updated_at
BEFORE UPDATE ON public.soap_export_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();