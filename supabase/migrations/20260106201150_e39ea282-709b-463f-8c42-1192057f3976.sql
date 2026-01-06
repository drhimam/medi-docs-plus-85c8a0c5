-- Create activity log table
CREATE TABLE public.sub_user_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  sub_user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_name TEXT,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sub_user_activity_log ENABLE ROW LEVEL SECURITY;

-- Only owners can view activity logs for their sub-users
CREATE POLICY "Owners can view their sub-user activity logs"
ON public.sub_user_activity_log
FOR SELECT
USING (owner_id = auth.uid());

-- Sub-users can insert their own activity logs
CREATE POLICY "Sub-users can insert their activity logs"
ON public.sub_user_activity_log
FOR INSERT
WITH CHECK (sub_user_id = auth.uid());

-- Create index for faster queries
CREATE INDEX idx_activity_log_owner ON public.sub_user_activity_log(owner_id);
CREATE INDEX idx_activity_log_created ON public.sub_user_activity_log(created_at DESC);