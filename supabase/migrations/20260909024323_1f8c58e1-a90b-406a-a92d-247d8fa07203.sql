
-- Roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.user_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.user_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.user_role) TO authenticated;

-- Public (token-scoped) invite lookup
CREATE OR REPLACE FUNCTION public.get_invite_by_token(p_token uuid)
RETURNS TABLE (id uuid, email text, owner_id uuid, invite_expires_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.id, s.email, s.owner_id, s.invite_expires_at
  FROM public.sub_users s
  WHERE s.invite_token = p_token
    AND s.status = 'pending'
    AND s.invite_expires_at > now()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_invite_by_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invite_by_token(uuid) TO anon, authenticated;

-- Accept the invite as the currently signed-in user
CREATE OR REPLACE FUNCTION public.accept_sub_user_invite(p_token uuid)
RETURNS uuid
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_invite public.sub_users;
  v_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  SELECT * INTO v_invite FROM public.sub_users
  WHERE invite_token = p_token AND status = 'pending' AND invite_expires_at > now()
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation is invalid or has expired';
  END IF;

  IF lower(v_invite.email) IS DISTINCT FROM lower(v_email) THEN
    RAISE EXCEPTION 'This invitation was sent to a different email address';
  END IF;

  UPDATE public.sub_users
  SET sub_user_id = auth.uid(),
      status = 'active',
      invite_token = NULL,
      invite_expires_at = NULL,
      updated_at = now()
  WHERE id = v_invite.id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'sub_user')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_invite.owner_id, 'owner')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN v_invite.owner_id;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_sub_user_invite(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_sub_user_invite(uuid) TO authenticated;

-- Backfill roles for existing accounts
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT owner_id, 'owner'::public.user_role FROM public.sub_users
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT sub_user_id, 'sub_user'::public.user_role FROM public.sub_users
WHERE sub_user_id IS NOT NULL AND status = 'active'
ON CONFLICT DO NOTHING;
