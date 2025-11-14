-- Add completion_status column to patients table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'patients' 
    AND column_name = 'completion_status'
  ) THEN
    ALTER TABLE public.patients 
    ADD COLUMN completion_status TEXT NOT NULL DEFAULT 'incomplete' 
    CHECK (completion_status IN ('completed', 'incomplete'));
    
    CREATE INDEX idx_patients_completion_status ON public.patients(completion_status);
  END IF;
END $$;