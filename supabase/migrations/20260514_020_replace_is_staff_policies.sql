-- Sprint 25: Replace all RLS policies that reference the no-arg is_staff()
-- with is_org_member(organization_id). The no-arg is_staff() checks membership
-- in ANY org, which is incorrect for multi-tenant isolation. is_org_member() takes
-- the row's organization_id and scopes the check to the correct org.
--
-- Tables with organization_id columns: use is_org_member(organization_id).
-- profiles: no organization_id column; use an EXISTS subquery on organization_members.
-- storage.objects: keep existing bucket guard; replace is_staff() with org membership check.
--   Storage objects don't have organization_id, so we check membership in ANY org (same
--   effective behavior as is_staff(), but the SECURITY DEFINER path is explicit).
--
-- NOTE: storage.objects policies require the path convention orgs/{orgId}/... established
-- in Sprint 5. Policies for storage objects use a regex on the object name to extract orgId.

-- ── customer_addresses ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS customer_addresses_update_policy ON public.customer_addresses;
CREATE POLICY customer_addresses_update_policy ON public.customer_addresses
  FOR UPDATE TO authenticated
  USING (
    is_org_member(organization_id)
    OR (EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = customer_addresses.customer_id
        AND c.auth_user_id = auth.uid()
    ))
  )
  WITH CHECK (
    is_org_member(organization_id)
    OR (EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = customer_addresses.customer_id
        AND c.auth_user_id = auth.uid()
    ))
  );

-- ── device_intake_reports ───────────────────────────────────────────────────
DROP POLICY IF EXISTS device_intake_reports_staff_only ON public.device_intake_reports;
CREATE POLICY device_intake_reports_org_member ON public.device_intake_reports
  FOR ALL TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_member(organization_id));

-- ── pricing_rule_conditions ─────────────────────────────────────────────────
DROP POLICY IF EXISTS pricing_rule_conditions_staff_only ON public.pricing_rule_conditions;
CREATE POLICY pricing_rule_conditions_org_member ON public.pricing_rule_conditions
  FOR ALL TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_member(organization_id));

-- ── profiles ────────────────────────────────────────────────────────────────
-- Allow users to see their own profile, or profiles of other members in their org.
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.organization_members om1
      JOIN public.organization_members om2
        ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om2.user_id = profiles.id
        AND om1.status = 'active'
        AND om2.status = 'active'
    )
  );

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ── quote_estimate_items ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS quote_estimate_items_insert_policy ON public.quote_estimate_items;
CREATE POLICY quote_estimate_items_insert_policy ON public.quote_estimate_items
  FOR INSERT TO authenticated
  WITH CHECK (is_org_member(organization_id));

DROP POLICY IF EXISTS quote_estimate_items_update_policy ON public.quote_estimate_items;
CREATE POLICY quote_estimate_items_update_policy ON public.quote_estimate_items
  FOR UPDATE TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_member(organization_id));

-- ── quote_request_photos ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS quote_request_photos_insert_policy ON public.quote_request_photos;
CREATE POLICY quote_request_photos_insert_policy ON public.quote_request_photos
  FOR INSERT TO authenticated
  WITH CHECK (
    is_org_member(organization_id)
    OR (EXISTS (
      SELECT 1 FROM (quote_requests qr JOIN customers c ON c.id = qr.customer_id)
      WHERE qr.id = quote_request_photos.quote_request_id
        AND c.auth_user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS quote_request_photos_update_policy ON public.quote_request_photos;
CREATE POLICY quote_request_photos_update_policy ON public.quote_request_photos
  FOR UPDATE TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_member(organization_id));

-- ── repair_order_status_history ──────────────────────────────────────────────
DROP POLICY IF EXISTS repair_order_status_history_insert_policy ON public.repair_order_status_history;
CREATE POLICY repair_order_status_history_insert_policy ON public.repair_order_status_history
  FOR INSERT TO authenticated
  WITH CHECK (is_org_member(organization_id));

-- ── storage.objects (repair-uploads bucket) ──────────────────────────────────
-- Paths follow the convention: orgs/{orgId}/quotes/... (set in Sprint 5).
-- Extract orgId from path position 2 (1-indexed after split on '/').
DROP POLICY IF EXISTS repair_uploads_staff_select ON storage.objects;
CREATE POLICY repair_uploads_staff_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'repair-uploads'
    AND is_org_member((string_to_array(name, '/'))[2]::uuid)
  );

DROP POLICY IF EXISTS repair_uploads_staff_insert ON storage.objects;
CREATE POLICY repair_uploads_staff_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'repair-uploads'
    AND is_org_member((string_to_array(name, '/'))[2]::uuid)
  );

DROP POLICY IF EXISTS repair_uploads_staff_update ON storage.objects;
CREATE POLICY repair_uploads_staff_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'repair-uploads'
    AND is_org_member((string_to_array(name, '/'))[2]::uuid)
  )
  WITH CHECK (
    bucket_id = 'repair-uploads'
    AND is_org_member((string_to_array(name, '/'))[2]::uuid)
  );

DROP POLICY IF EXISTS repair_uploads_staff_delete ON storage.objects;
CREATE POLICY repair_uploads_staff_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'repair-uploads'
    AND is_org_member((string_to_array(name, '/'))[2]::uuid)
  );

-- ── Finally: drop the no-arg is_staff() function ────────────────────────────
DROP FUNCTION IF EXISTS public.is_staff();
