-- Create table to track password reset attempts
CREATE TABLE IF NOT EXISTS public.password_reset_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_email_created 
  ON public.password_reset_attempts(email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_ip_created 
  ON public.password_reset_attempts(ip_address, created_at DESC);

-- Enable RLS
ALTER TABLE public.password_reset_attempts ENABLE ROW LEVEL SECURITY;

-- No public access - only edge functions with service role can access
CREATE POLICY "Service role only access" 
  ON public.password_reset_attempts 
  FOR ALL 
  USING (false);

-- Create function to clean up old attempts (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_reset_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.password_reset_attempts
  WHERE created_at < now() - interval '1 hour';
END;
$$;