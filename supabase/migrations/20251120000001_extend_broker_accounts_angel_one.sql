-- Migration: Extend broker_accounts table for Angel One multi-tenant support
-- Adds fields to store all Angel One credentials per user

ALTER TABLE public.broker_accounts
  ADD COLUMN IF NOT EXISTS client_id_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS mpin_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS totp_secret_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS public_ip TEXT,
  ADD COLUMN IF NOT EXISTS local_ip TEXT,
  ADD COLUMN IF NOT EXISTS mac_address TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.broker_accounts.client_id_encrypted IS 'Encrypted Angel One Client ID';
COMMENT ON COLUMN public.broker_accounts.mpin_encrypted IS 'Encrypted Angel One MPIN';
COMMENT ON COLUMN public.broker_accounts.totp_secret_encrypted IS 'Encrypted Angel One TOTP Secret (Base32)';
COMMENT ON COLUMN public.broker_accounts.public_ip IS 'Public IP for reference (all users use same server IP)';
COMMENT ON COLUMN public.broker_accounts.local_ip IS 'Local IP for reference';
COMMENT ON COLUMN public.broker_accounts.mac_address IS 'MAC Address for reference';

