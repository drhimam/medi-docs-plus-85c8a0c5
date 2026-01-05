-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('owner', 'sub_user');

-- Create sub_users table to track sub-user relationships and permissions
CREATE TABLE public.sub_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sub_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  invite_token UUID DEFAULT gen_random_uuid(),
  invite_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(owner_id, email)
);

-- Create sub_user_permissions table for granular access control
CREATE TABLE public.sub_user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sub_user_id UUID NOT NULL REFERENCES public.sub_users(id) ON DELETE CASCADE,
  -- Page access permissions (true = allowed)
  can_access_patients BOOLEAN NOT NULL DEFAULT true,
  can_access_appointments BOOLEAN NOT NULL DEFAULT true,
  can_access_clinical_docs BOOLEAN NOT NULL DEFAULT false,
  can_access_knowledge_base BOOLEAN NOT NULL DEFAULT false,
  can_access_ai_tools BOOLEAN NOT NULL DEFAULT false,
  can_access_settings BOOLEAN NOT NULL DEFAULT false,
  -- Action permissions
  can_create_patients BOOLEAN NOT NULL DEFAULT false,
  can_edit_patients BOOLEAN NOT NULL DEFAULT false,
  can_delete_patients BOOLEAN NOT NULL DEFAULT false,
  can_create_visits BOOLEAN NOT NULL DEFAULT false,
  can_edit_visits BOOLEAN NOT NULL DEFAULT false,
  can_delete_visits BOOLEAN NOT NULL DEFAULT false,
  can_create_appointments BOOLEAN NOT NULL DEFAULT true,
  can_edit_appointments BOOLEAN NOT NULL DEFAULT true,
  can_delete_appointments BOOLEAN NOT NULL DEFAULT false,
  can_export BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sub_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_user_permissions ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user is owner of a sub_user record
CREATE OR REPLACE FUNCTION public.is_sub_user_owner(p_sub_user_record_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sub_users
    WHERE id = p_sub_user_record_id
    AND owner_id = auth.uid()
  );
$$;

-- Security definer function to get the owner_id for a sub_user
CREATE OR REPLACE FUNCTION public.get_owner_id_for_sub_user(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT owner_id FROM public.sub_users
  WHERE sub_user_id = p_user_id
  AND status = 'active'
  LIMIT 1;
$$;

-- Security definer function to check if current user is a sub_user of an owner
CREATE OR REPLACE FUNCTION public.is_sub_user_of(p_owner_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sub_users
    WHERE owner_id = p_owner_id
    AND sub_user_id = auth.uid()
    AND status = 'active'
  );
$$;

-- Security definer function to get effective user_id (owner_id if sub_user, else own id)
CREATE OR REPLACE FUNCTION public.get_effective_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT owner_id FROM public.sub_users 
     WHERE sub_user_id = auth.uid() AND status = 'active' LIMIT 1),
    auth.uid()
  );
$$;

-- RLS Policies for sub_users table
-- Owners can view their own sub_users
CREATE POLICY "Owners can view their sub_users"
ON public.sub_users
FOR SELECT
USING (owner_id = auth.uid() OR sub_user_id = auth.uid());

-- Owners can create sub_users (max 4 enforced in application)
CREATE POLICY "Owners can create sub_users"
ON public.sub_users
FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- Owners can update their sub_users
CREATE POLICY "Owners can update their sub_users"
ON public.sub_users
FOR UPDATE
USING (owner_id = auth.uid());

-- Owners can delete their sub_users
CREATE POLICY "Owners can delete their sub_users"
ON public.sub_users
FOR DELETE
USING (owner_id = auth.uid());

-- RLS Policies for sub_user_permissions table
-- Owners can view permissions for their sub_users
CREATE POLICY "Owners can view sub_user permissions"
ON public.sub_user_permissions
FOR SELECT
USING (public.is_sub_user_owner(sub_user_id) OR EXISTS (
  SELECT 1 FROM public.sub_users 
  WHERE id = sub_user_id AND sub_user_id = auth.uid()
));

-- Owners can create permissions for their sub_users
CREATE POLICY "Owners can create sub_user permissions"
ON public.sub_user_permissions
FOR INSERT
WITH CHECK (public.is_sub_user_owner(sub_user_id));

-- Owners can update permissions for their sub_users
CREATE POLICY "Owners can update sub_user permissions"
ON public.sub_user_permissions
FOR UPDATE
USING (public.is_sub_user_owner(sub_user_id));

-- Owners can delete permissions for their sub_users
CREATE POLICY "Owners can delete sub_user permissions"
ON public.sub_user_permissions
FOR DELETE
USING (public.is_sub_user_owner(sub_user_id));

-- Add triggers for updated_at
CREATE TRIGGER update_sub_users_updated_at
BEFORE UPDATE ON public.sub_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sub_user_permissions_updated_at
BEFORE UPDATE ON public.sub_user_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();