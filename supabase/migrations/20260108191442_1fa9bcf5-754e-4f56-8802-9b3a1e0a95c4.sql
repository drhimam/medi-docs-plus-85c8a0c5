-- Create patient intake submissions table for storing pending patient forms
CREATE TABLE public.patient_intake_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  intake_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  patient_email TEXT NOT NULL,
  patient_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.patient_intake_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users (medical professionals)
CREATE POLICY "Users can create intake submissions"
ON public.patient_intake_submissions
FOR INSERT
WITH CHECK (user_id = get_effective_user_id());

CREATE POLICY "Users can view their own intake submissions"
ON public.patient_intake_submissions
FOR SELECT
USING ((user_id = auth.uid()) OR is_sub_user_of(user_id));

CREATE POLICY "Users can update their own intake submissions"
ON public.patient_intake_submissions
FOR UPDATE
USING ((user_id = auth.uid()) OR is_sub_user_of(user_id));

CREATE POLICY "Users can delete their own intake submissions"
ON public.patient_intake_submissions
FOR DELETE
USING ((user_id = auth.uid()) OR is_sub_user_of(user_id));

-- Policy for public access via token (for patients filling out the form)
CREATE POLICY "Anyone can view submission by valid token"
ON public.patient_intake_submissions
FOR SELECT
USING (intake_token IS NOT NULL);

CREATE POLICY "Anyone can update submission by valid token"
ON public.patient_intake_submissions
FOR UPDATE
USING (intake_token IS NOT NULL AND status = 'pending' AND expires_at > now());

-- Create index for faster token lookups
CREATE INDEX idx_patient_intake_token ON public.patient_intake_submissions(intake_token);
CREATE INDEX idx_patient_intake_status ON public.patient_intake_submissions(status);
CREATE INDEX idx_patient_intake_user ON public.patient_intake_submissions(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_patient_intake_submissions_updated_at
  BEFORE UPDATE ON public.patient_intake_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();