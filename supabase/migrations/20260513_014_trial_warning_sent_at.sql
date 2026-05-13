-- Sprint 15: track when trial warning email was last sent
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS trial_warning_sent_at timestamptz;
