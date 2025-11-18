-- Fix search_path for cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_old_reset_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.password_reset_attempts
  WHERE created_at < now() - interval '1 hour';
END;
$$;