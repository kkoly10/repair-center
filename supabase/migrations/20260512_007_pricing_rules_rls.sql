-- Remove the blanket public SELECT policy that exposed pricing from ALL orgs to
-- unauthenticated users. Pricing access for public-facing pages is now provided
-- exclusively through the /api/pricing/[shopSlug] server route, which scopes
-- results to the requested organization using the service role.
drop policy if exists pricing_rules_public_select on public.pricing_rules;
