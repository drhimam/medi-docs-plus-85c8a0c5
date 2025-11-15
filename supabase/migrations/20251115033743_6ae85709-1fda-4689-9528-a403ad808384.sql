-- Create storage bucket for visit documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('visit-documents', 'visit-documents', false);

-- Create storage policies for visit documents
CREATE POLICY "Users can view their own visit documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'visit-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own visit documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'visit-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own visit documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'visit-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own visit documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'visit-documents' AND auth.uid()::text = (storage.foldername(name))[1]);