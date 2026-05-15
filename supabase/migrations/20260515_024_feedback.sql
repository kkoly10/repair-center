-- Sprint 42: Feedback table for in-app and public feedback submissions
-- RLS: anyone can INSERT (open to customers and operators); SELECT restricted to service role

CREATE TABLE IF NOT EXISTS feedback (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type            text        NOT NULL CHECK (type IN ('bug', 'feature', 'general')),
  message         text        NOT NULL CHECK (char_length(message) BETWEEN 5 AND 1000),
  email           text,
  page_url        text,
  organization_id uuid        REFERENCES organizations(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Index for platform admin queries
CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_org_idx ON feedback (organization_id) WHERE organization_id IS NOT NULL;

-- RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can insert feedback
CREATE POLICY feedback_insert_open ON feedback
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only service role can read (platform admin uses service role client)
-- No SELECT policy = only service role bypass
