-- Sprint 37: Track when an org permanently dismisses the onboarding checklist.
-- NULL = never dismissed; timestamptz records the moment of dismissal.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS onboarding_dismissed_at timestamptz;
