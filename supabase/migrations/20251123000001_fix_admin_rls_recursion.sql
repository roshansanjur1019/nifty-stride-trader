-- Migration: Fix infinite recursion in RLS policies
-- The previous migration caused infinite recursion because admin check queries profiles table
-- which triggers the same policy, creating a loop.

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their broker accounts" ON public.broker_accounts;
DROP POLICY IF EXISTS "Users can manage their strategy configs" ON public.strategy_configs;
DROP POLICY IF EXISTS "Users can view their trades" ON public.trades;
DROP POLICY IF EXISTS "Users can view their performance metrics" ON public.performance_metrics;

-- Recreate profiles policy WITHOUT admin check (to avoid recursion)
-- Users can only view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Recreate broker_accounts policy WITHOUT admin check
CREATE POLICY "Users can manage their broker accounts"
  ON public.broker_accounts FOR ALL
  USING (auth.uid() = user_id);

-- Recreate strategy_configs policy WITHOUT admin check
CREATE POLICY "Users can manage their strategy configs"
  ON public.strategy_configs FOR ALL
  USING (auth.uid() = user_id);

-- Recreate trades policy WITHOUT admin check
CREATE POLICY "Users can view their trades"
  ON public.trades FOR ALL
  USING (auth.uid() = user_id);

-- Recreate performance_metrics policy WITHOUT admin check
CREATE POLICY "Users can view their performance metrics"
  ON public.performance_metrics FOR ALL
  USING (auth.uid() = user_id);

-- Create a function to check if user is admin (uses service role, no RLS)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = is_admin.user_id
    AND profiles.is_admin = true
  );
END;
$$;

-- Admin access will be handled via Edge Functions with service role
-- This avoids RLS recursion issues

