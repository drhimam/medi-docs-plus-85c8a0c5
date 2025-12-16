-- Add photo_url column to patients table
ALTER TABLE public.patients ADD COLUMN photo_url TEXT;

-- Create storage bucket for patient photos
INSERT INTO storage.buckets (id, name, public) VALUES ('patient-photos', 'patient-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for patient photos
CREATE POLICY "Users can upload their own patient photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'patient-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own patient photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'patient-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own patient photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'patient-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own patient photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'patient-photos' AND auth.uid()::text = (storage.foldername(name))[1]);