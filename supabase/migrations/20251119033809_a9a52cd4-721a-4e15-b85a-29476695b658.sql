-- Create appointment_settings table for time slot configuration
CREATE TABLE public.appointment_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  start_time text NOT NULL DEFAULT '09:00',
  end_time text NOT NULL DEFAULT '17:00',
  slot_duration integer NOT NULL DEFAULT 30,
  working_days jsonb NOT NULL DEFAULT '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]'::jsonb,
  break_start_time text,
  break_end_time text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  appointment_date date NOT NULL,
  appointment_time text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.appointment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS policies for appointment_settings
CREATE POLICY "Users can view their own settings"
  ON public.appointment_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings"
  ON public.appointment_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.appointment_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
  ON public.appointment_settings FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for appointments
CREATE POLICY "Users can view their own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments"
  ON public.appointments FOR DELETE
  USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_appointment_settings_updated_at
  BEFORE UPDATE ON public.appointment_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster appointment lookups
CREATE INDEX idx_appointments_date_time ON public.appointments(user_id, appointment_date, appointment_time);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);