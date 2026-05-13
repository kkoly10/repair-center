-- Fix Sprint 12 inventory RLS policies.
-- Migration 010 incorrectly used is_staff(organization_id) which resolves to
-- the legacy no-arg is_staff() — a single-tenant profiles.role check that ignores
-- the org argument. Replace with is_org_member(organization_id) which correctly
-- checks organization_members for the calling user's active membership.

-- ─── suppliers ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS suppliers_staff_all ON suppliers;
CREATE POLICY suppliers_staff_all ON suppliers
  FOR ALL
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_member(organization_id));

-- ─── parts ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS parts_staff_all ON parts;
CREATE POLICY parts_staff_all ON parts
  FOR ALL
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_member(organization_id));

-- ─── repair_order_parts ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS repair_order_parts_staff_all ON repair_order_parts;
CREATE POLICY repair_order_parts_staff_all ON repair_order_parts
  FOR ALL
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_member(organization_id));
