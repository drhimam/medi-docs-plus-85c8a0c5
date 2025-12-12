-- Make storage buckets private to protect signatures and logos
UPDATE storage.buckets SET public = false WHERE id = 'prescription-signatures';
UPDATE storage.buckets SET public = false WHERE id = 'prescription-logos';