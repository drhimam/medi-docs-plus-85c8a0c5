
DROP POLICY IF EXISTS "Anyone can view submission by valid token" ON public.patient_intake_submissions;
DROP POLICY IF EXISTS "Anyone can update submission by valid token" ON public.patient_intake_submissions;

CREATE OR REPLACE FUNCTION public.get_patient_intake_by_token(p_token uuid)
RETURNS SETOF public.patient_intake_submissions
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.patient_intake_submissions
  WHERE intake_token = p_token
    AND status = 'pending'
    AND expires_at > now()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_patient_intake_by_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_patient_intake_by_token(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "Owners can view sub_user permissions" ON public.sub_user_permissions;
CREATE POLICY "Owners can view sub_user permissions"
ON public.sub_user_permissions
FOR SELECT
USING (
  is_sub_user_owner(sub_user_id)
  OR EXISTS (
    SELECT 1 FROM public.sub_users s
    WHERE s.id = public.sub_user_permissions.sub_user_id
      AND s.sub_user_id = auth.uid()
      AND s.status = 'active'
  )
);

CREATE OR REPLACE FUNCTION public.get_or_create_ai_usage(p_user_id uuid)
RETURNS public.ai_usage
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_usage public.ai_usage;
  v_period_start DATE := date_trunc('month', CURRENT_DATE)::date;
  v_period_end DATE := (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot access another user''s AI usage';
  END IF;

  SELECT * INTO v_usage FROM public.ai_usage
  WHERE user_id = p_user_id AND period_start = v_period_start;

  IF NOT FOUND THEN
    INSERT INTO public.ai_usage (user_id, period_start, period_end)
    VALUES (p_user_id, v_period_start, v_period_end)
    RETURNING * INTO v_usage;
  END IF;

  RETURN v_usage;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_ai_usage(p_user_id uuid, p_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_usage public.ai_usage;
  v_subscription public.subscriptions;
  v_limit INTEGER;
  v_current INTEGER;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify another user''s AI usage';
  END IF;

  SELECT * INTO v_usage FROM public.get_or_create_ai_usage(p_user_id);
  SELECT * INTO v_subscription FROM public.subscriptions WHERE user_id = p_user_id;

  IF v_subscription.plan_type = 'pro' THEN
    IF p_type = 'text' THEN v_limit := 500; ELSE v_limit := 100; END IF;
  ELSE
    IF p_type = 'text' THEN v_limit := 50; ELSE v_limit := 0; END IF;
  END IF;

  IF p_type = 'text' THEN v_current := v_usage.ai_text_count; ELSE v_current := v_usage.ai_speech_count; END IF;

  IF v_current >= v_limit THEN
    RETURN FALSE;
  END IF;

  IF p_type = 'text' THEN
    UPDATE public.ai_usage SET ai_text_count = ai_text_count + 1 WHERE id = v_usage.id;
  ELSE
    UPDATE public.ai_usage SET ai_speech_count = ai_speech_count + 1 WHERE id = v_usage.id;
  END IF;

  RETURN TRUE;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_effective_user_id() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_owner_id_for_sub_user(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_sub_user_of(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_sub_user_owner(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_old_reset_attempts() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_or_create_ai_usage(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_ai_usage(uuid, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_effective_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_ai_usage(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_ai_usage(uuid, text) TO authenticated;
