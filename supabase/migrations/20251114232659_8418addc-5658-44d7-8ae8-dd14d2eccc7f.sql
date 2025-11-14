-- Create patients table
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Demographics
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
  contact_number TEXT NOT NULL,
  email TEXT,
  address TEXT,
  blood_group TEXT,
  health_card_number TEXT,
  
  -- Medical History
  medical_history_ongoing TEXT,
  medical_history_past TEXT,
  surgical_history TEXT,
  hospitalization_history TEXT,
  family_history TEXT,
  mental_health_history TEXT,
  
  -- Medications & Supplements (stored as JSON arrays)
  ongoing_medications JSONB DEFAULT '[]'::jsonb,
  supplements JSONB DEFAULT '[]'::jsonb,
  vaccinations JSONB DEFAULT '[]'::jsonb,
  
  -- Allergies (stored as JSON arrays)
  allergic_history_food JSONB DEFAULT '[]'::jsonb,
  allergic_history_drug JSONB DEFAULT '[]'::jsonb,
  allergic_history_env JSONB DEFAULT '[]'::jsonb,
  
  -- Social History
  smoking_status TEXT NOT NULL CHECK (smoking_status IN ('NEVER', 'FORMER', 'CURRENT')),
  alcohol_consumption TEXT NOT NULL CHECK (alcohol_consumption IN ('NEVER', 'OCCASIONAL', 'MODERATE', 'HEAVY')),
  recreational_drug_use TEXT,
  exercise_habits TEXT,
  diet TEXT,
  occupation TEXT,
  living_environment TEXT,
  
  -- Completion Status
  completion_status TEXT NOT NULL DEFAULT 'incomplete' CHECK (completion_status IN ('completed', 'incomplete')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own patients" 
ON public.patients 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own patients" 
ON public.patients 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patients" 
ON public.patients 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patients" 
ON public.patients 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for user_id for better performance
CREATE INDEX idx_patients_user_id ON public.patients(user_id);
CREATE INDEX idx_patients_completion_status ON public.patients(completion_status);