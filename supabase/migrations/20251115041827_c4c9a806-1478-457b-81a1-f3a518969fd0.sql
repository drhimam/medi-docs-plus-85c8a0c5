-- Add SOAP note and prescription fields to visits table
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS soap_subjective text,
ADD COLUMN IF NOT EXISTS soap_objective text,
ADD COLUMN IF NOT EXISTS soap_assessment text,
ADD COLUMN IF NOT EXISTS soap_plan text,
ADD COLUMN IF NOT EXISTS prescription text;

-- Add comment for documentation
COMMENT ON COLUMN public.visits.soap_subjective IS 'Subjective section of SOAP note - auto-populated from HPI, ROS, medical history, medications, allergies, social history';
COMMENT ON COLUMN public.visits.soap_objective IS 'Objective section of SOAP note - auto-populated from vitals, physical exam, investigation';
COMMENT ON COLUMN public.visits.soap_assessment IS 'Assessment section of SOAP note - manually entered or AI-generated';
COMMENT ON COLUMN public.visits.soap_plan IS 'Plan section of SOAP note - manually entered or AI-generated';
COMMENT ON COLUMN public.visits.prescription IS 'Prescription details for the visit';