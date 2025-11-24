-- Add new medical history fields to patients table
ALTER TABLE public.patients
ADD COLUMN birth_history text,
ADD COLUMN developmental_history text,
ADD COLUMN childhood_illnesses text,
ADD COLUMN accidents_injuries text,
ADD COLUMN menstrual_pregnancy_history text,
ADD COLUMN preventive_screening_history text;