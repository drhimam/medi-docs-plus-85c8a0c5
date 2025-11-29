-- Add signature fields to prescription_settings table
ALTER TABLE prescription_settings
ADD COLUMN signature_path text,
ADD COLUMN signature_position text DEFAULT 'bottom-right',
ADD COLUMN signature_width integer DEFAULT 80,
ADD COLUMN signature_height integer DEFAULT 40;

-- Create storage bucket for prescription signatures
INSERT INTO storage.buckets (id, name, public)
VALUES ('prescription-signatures', 'prescription-signatures', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for prescription signatures bucket
CREATE POLICY "Users can view their own prescription signatures"
ON storage.objects FOR SELECT
USING (bucket_id = 'prescription-signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own prescription signatures"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'prescription-signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own prescription signatures"
ON storage.objects FOR UPDATE
USING (bucket_id = 'prescription-signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own prescription signatures"
ON storage.objects FOR DELETE
USING (bucket_id = 'prescription-signatures' AND auth.uid()::text = (storage.foldername(name))[1]);