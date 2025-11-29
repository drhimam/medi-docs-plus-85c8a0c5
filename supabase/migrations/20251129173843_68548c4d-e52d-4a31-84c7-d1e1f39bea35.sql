-- Add logo fields to prescription_settings table
ALTER TABLE prescription_settings
ADD COLUMN logo_path text,
ADD COLUMN logo_position text DEFAULT 'top-left',
ADD COLUMN logo_width integer DEFAULT 60,
ADD COLUMN logo_height integer DEFAULT 40;

-- Create storage bucket for prescription logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('prescription-logos', 'prescription-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for prescription logos bucket
CREATE POLICY "Users can view their own prescription logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'prescription-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own prescription logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'prescription-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own prescription logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'prescription-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own prescription logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'prescription-logos' AND auth.uid()::text = (storage.foldername(name))[1]);