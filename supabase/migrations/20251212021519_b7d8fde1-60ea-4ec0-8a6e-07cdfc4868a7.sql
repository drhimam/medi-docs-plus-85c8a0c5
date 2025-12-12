-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI usage tracking table (monthly reset)
CREATE TABLE public.ai_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ai_text_count INTEGER NOT NULL DEFAULT 0,
  ai_speech_count INTEGER NOT NULL DEFAULT 0,
  period_start DATE NOT NULL DEFAULT date_trunc('month', CURRENT_DATE)::date,
  period_end DATE NOT NULL DEFAULT (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_start)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscriptions
CREATE POLICY "Users can view their own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
ON public.subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
ON public.subscriptions FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for ai_usage
CREATE POLICY "Users can view their own AI usage"
ON public.ai_usage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI usage"
ON public.ai_usage FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI usage"
ON public.ai_usage FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_usage_updated_at
BEFORE UPDATE ON public.ai_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get or create current month's AI usage record
CREATE OR REPLACE FUNCTION public.get_or_create_ai_usage(p_user_id UUID)
RETURNS public.ai_usage
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usage public.ai_usage;
  v_period_start DATE := date_trunc('month', CURRENT_DATE)::date;
  v_period_end DATE := (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date;
BEGIN
  SELECT * INTO v_usage FROM public.ai_usage
  WHERE user_id = p_user_id AND period_start = v_period_start;
  
  IF NOT FOUND THEN
    INSERT INTO public.ai_usage (user_id, period_start, period_end)
    VALUES (p_user_id, v_period_start, v_period_end)
    RETURNING * INTO v_usage;
  END IF;
  
  RETURN v_usage;
END;
$$;

-- Function to increment AI usage
CREATE OR REPLACE FUNCTION public.increment_ai_usage(p_user_id UUID, p_type TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usage public.ai_usage;
  v_subscription public.subscriptions;
  v_limit INTEGER;
  v_current INTEGER;
BEGIN
  -- Get or create usage record
  SELECT * INTO v_usage FROM public.get_or_create_ai_usage(p_user_id);
  
  -- Get subscription
  SELECT * INTO v_subscription FROM public.subscriptions WHERE user_id = p_user_id;
  
  -- Determine limits based on plan
  IF v_subscription.plan_type = 'pro' THEN
    IF p_type = 'text' THEN v_limit := 500; ELSE v_limit := 100; END IF;
  ELSE
    IF p_type = 'text' THEN v_limit := 50; ELSE v_limit := 0; END IF;
  END IF;
  
  -- Get current usage
  IF p_type = 'text' THEN v_current := v_usage.ai_text_count; ELSE v_current := v_usage.ai_speech_count; END IF;
  
  -- Check limit
  IF v_current >= v_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Increment
  IF p_type = 'text' THEN
    UPDATE public.ai_usage SET ai_text_count = ai_text_count + 1 WHERE id = v_usage.id;
  ELSE
    UPDATE public.ai_usage SET ai_speech_count = ai_speech_count + 1 WHERE id = v_usage.id;
  END IF;
  
  RETURN TRUE;
END;
$$;