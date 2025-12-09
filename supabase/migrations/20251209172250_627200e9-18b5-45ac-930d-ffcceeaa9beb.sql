-- Add review_status column to documents table
ALTER TABLE public.documents 
ADD COLUMN review_status text NOT NULL DEFAULT 'pending';

-- Add comment for clarity
COMMENT ON COLUMN public.documents.review_status IS 'Status of document review: pending, reviewed, needs_review';