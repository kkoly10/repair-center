-- Sprint 14: Platform subscription billing
-- Adds stripe_customer_id to organizations and creates organization_subscriptions table

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

CREATE TABLE IF NOT EXISTS organization_subscriptions (
  organization_id   uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id        text,
  stripe_subscription_id    text,
  stripe_price_id           text,
  plan_key                  text NOT NULL DEFAULT 'beta',
  status                    text NOT NULL DEFAULT 'trialing',
  trial_ends_at             timestamptz,
  current_period_end        timestamptz,
  cancel_at_period_end      boolean NOT NULL DEFAULT false,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_subscriptions_staff_read ON organization_subscriptions;
CREATE POLICY org_subscriptions_staff_read ON organization_subscriptions
  FOR SELECT
  USING (is_org_member(organization_id));

-- Only service role writes (billing webhook uses service role)
