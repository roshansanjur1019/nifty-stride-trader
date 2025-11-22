-- Migration: Add admin role support and admin management features

-- Add admin role to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create admin settings table for platform-wide configuration
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin audit log for tracking admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL, -- 'user_update', 'subscription_change', 'settings_update', etc.
  target_user_id UUID REFERENCES auth.users(id),
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user ON public.admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);

-- RLS Policies for admin_settings (only admins can read/write)
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all settings"
  ON public.admin_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can manage all settings"
  ON public.admin_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for admin_audit_log (only admins can read)
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "System can insert audit logs"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (true); -- Allow service role to insert

-- Update RLS policies to allow admins to view all user data
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Allow admins to update any profile
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Allow admins to view all broker accounts
DROP POLICY IF EXISTS "Users can manage their broker accounts" ON public.broker_accounts;
CREATE POLICY "Users can manage their broker accounts"
  ON public.broker_accounts FOR ALL
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Allow admins to view all strategy configs
DROP POLICY IF EXISTS "Users can manage their strategy configs" ON public.strategy_configs;
CREATE POLICY "Users can manage their strategy configs"
  ON public.strategy_configs FOR ALL
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Allow admins to view all trades
DROP POLICY IF EXISTS "Users can view their trades" ON public.trades;
CREATE POLICY "Users can view their trades"
  ON public.trades FOR ALL
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Allow admins to view all performance metrics
DROP POLICY IF EXISTS "Users can view their performance metrics" ON public.performance_metrics;
CREATE POLICY "Users can view their performance metrics"
  ON public.performance_metrics FOR ALL
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Insert default admin settings
INSERT INTO public.admin_settings (setting_key, setting_value, description)
VALUES 
  ('trial_duration_days', '7', 'Default trial period in days'),
  ('max_trial_users', '100', 'Maximum number of trial users'),
  ('platform_enabled', 'true', 'Platform-wide enable/disable switch'),
  ('maintenance_mode', 'false', 'Maintenance mode flag'),
  ('max_strategies_per_user', '5', 'Maximum strategies a user can create'),
  ('auto_execute_enabled', 'true', 'Enable/disable auto-execute feature globally')
ON CONFLICT (setting_key) DO NOTHING;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action_type TEXT,
  p_target_user_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action_type,
    target_user_id,
    details,
    ip_address,
    user_agent
  )
  VALUES (
    auth.uid(),
    p_action_type,
    p_target_user_id,
    p_details,
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'user-agent'
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

