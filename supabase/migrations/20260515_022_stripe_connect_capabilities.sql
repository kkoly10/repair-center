-- Sprint 36: Add Stripe Connect capability tracking columns to organization_payment_settings.
-- These columns are synced from Stripe via the account.updated Connect webhook
-- and the GET /admin/api/billing/connect/status polling endpoint.

ALTER TABLE public.organization_payment_settings
  ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_connect_payouts_enabled boolean NOT NULL DEFAULT false;
