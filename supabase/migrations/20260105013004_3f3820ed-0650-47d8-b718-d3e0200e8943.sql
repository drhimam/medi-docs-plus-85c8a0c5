-- Update RLS policies on patients table to allow sub-users access
DROP POLICY IF EXISTS "Users can view their own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can create their own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can update their own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can delete their own patients" ON public.patients;

CREATE POLICY "Users can view their own patients"
ON public.patients
FOR SELECT
USING (user_id = auth.uid() OR public.is_sub_user_of(user_id));

CREATE POLICY "Users can create their own patients"
ON public.patients
FOR INSERT
WITH CHECK (user_id = public.get_effective_user_id());

CREATE POLICY "Users can update their own patients"
ON public.patients
FOR UPDATE
USING (user_id = auth.uid() OR public.is_sub_user_of(user_id));

CREATE POLICY "Users can delete their own patients"
ON public.patients
FOR DELETE
USING (user_id = auth.uid() OR public.is_sub_user_of(user_id));

-- Update RLS policies on visits table
DROP POLICY IF EXISTS "Users can view their own visits" ON public.visits;
DROP POLICY IF EXISTS "Users can create their own visits" ON public.visits;
DROP POLICY IF EXISTS "Users can update their own visits" ON public.visits;
DROP POLICY IF EXISTS "Users can delete their own visits" ON public.visits;

CREATE POLICY "Users can view their own visits"
ON public.visits
FOR SELECT
USING (user_id = auth.uid() OR public.is_sub_user_of(user_id));

CREATE POLICY "Users can create their own visits"
ON public.visits
FOR INSERT
WITH CHECK (user_id = public.get_effective_user_id());

CREATE POLICY "Users can update their own visits"
ON public.visits
FOR UPDATE
USING (user_id = auth.uid() OR public.is_sub_user_of(user_id));

CREATE POLICY "Users can delete their own visits"
ON public.visits
FOR DELETE
USING (user_id = auth.uid() OR public.is_sub_user_of(user_id));

-- Update RLS policies on appointments table
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can create their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete their own appointments" ON public.appointments;

CREATE POLICY "Users can view their own appointments"
ON public.appointments
FOR SELECT
USING (user_id = auth.uid() OR public.is_sub_user_of(user_id));

CREATE POLICY "Users can create their own appointments"
ON public.appointments
FOR INSERT
WITH CHECK (user_id = public.get_effective_user_id());

CREATE POLICY "Users can update their own appointments"
ON public.appointments
FOR UPDATE
USING (user_id = auth.uid() OR public.is_sub_user_of(user_id));

CREATE POLICY "Users can delete their own appointments"
ON public.appointments
FOR DELETE
USING (user_id = auth.uid() OR public.is_sub_user_of(user_id));

-- Update RLS policies on documents table
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can create their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;

CREATE POLICY "Users can view their own documents"
ON public.documents
FOR SELECT
USING (user_id = auth.uid() OR public.is_sub_user_of(user_id));

CREATE POLICY "Users can create their own documents"
ON public.documents
FOR INSERT
WITH CHECK (user_id = public.get_effective_user_id());

CREATE POLICY "Users can update their own documents"
ON public.documents
FOR UPDATE
USING (user_id = auth.uid() OR public.is_sub_user_of(user_id));

CREATE POLICY "Users can delete their own documents"
ON public.documents
FOR DELETE
USING (user_id = auth.uid() OR public.is_sub_user_of(user_id));