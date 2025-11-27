-- Create prescription settings table
CREATE TABLE public.prescription_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Paper and font settings
  paper_size TEXT NOT NULL DEFAULT 'letter',
  body_font TEXT NOT NULL DEFAULT 'Courier New',
  body_font_size INTEGER NOT NULL DEFAULT 12,
  footer_font_size INTEGER NOT NULL DEFAULT 10,
  header_font TEXT NOT NULL DEFAULT 'Arial',
  body_text_color TEXT NOT NULL DEFAULT '#333333',
  footer_text_color TEXT NOT NULL DEFAULT '#666666',
  
  -- Header settings
  use_own_letterhead BOOLEAN NOT NULL DEFAULT false,
  header_left_lines JSONB NOT NULL DEFAULT '["", "", "", "", ""]',
  header_right_lines JSONB NOT NULL DEFAULT '["", "", "", "", ""]',
  header_background_color TEXT NOT NULL DEFAULT '#ffffff',
  header_line_spacing INTEGER NOT NULL DEFAULT 6,
  
  -- Barcode settings
  barcode_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prescription_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own prescription settings"
  ON public.prescription_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prescription settings"
  ON public.prescription_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prescription settings"
  ON public.prescription_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prescription settings"
  ON public.prescription_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_prescription_settings_updated_at
  BEFORE UPDATE ON public.prescription_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();