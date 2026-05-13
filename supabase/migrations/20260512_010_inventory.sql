-- Sprint 12: Inventory & Parts (Phase 4)
-- Tables: suppliers, parts, repair_order_parts
-- All tables are org-scoped with RLS

-- ─── Suppliers ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS suppliers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             text NOT NULL,
  contact_email    text,
  contact_phone    text,
  website          text,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS suppliers_org_idx ON suppliers(organization_id);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS suppliers_staff_all ON suppliers;
CREATE POLICY suppliers_staff_all ON suppliers
  FOR ALL
  USING (is_staff(organization_id))
  WITH CHECK (is_staff(organization_id));

-- ─── Parts catalog ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS parts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name                 text NOT NULL,
  sku                  text,
  description          text,
  cost_price           numeric(10,2) NOT NULL DEFAULT 0,
  quantity_on_hand     integer NOT NULL DEFAULT 0,
  low_stock_threshold  integer NOT NULL DEFAULT 0,
  supplier_id          uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  active               boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS parts_org_idx ON parts(organization_id);
CREATE INDEX IF NOT EXISTS parts_org_active_idx ON parts(organization_id, active);

ALTER TABLE parts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS parts_staff_all ON parts;
CREATE POLICY parts_staff_all ON parts
  FOR ALL
  USING (is_staff(organization_id))
  WITH CHECK (is_staff(organization_id));

-- ─── Parts used per repair order ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS repair_order_parts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  repair_order_id  uuid NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
  part_id          uuid NOT NULL REFERENCES parts(id) ON DELETE RESTRICT,
  quantity_used    integer NOT NULL DEFAULT 1 CHECK (quantity_used > 0),
  cost_at_use      numeric(10,2) NOT NULL DEFAULT 0,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS repair_order_parts_order_idx ON repair_order_parts(repair_order_id);
CREATE INDEX IF NOT EXISTS repair_order_parts_part_idx  ON repair_order_parts(part_id);
CREATE INDEX IF NOT EXISTS repair_order_parts_org_idx   ON repair_order_parts(organization_id);

ALTER TABLE repair_order_parts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS repair_order_parts_staff_all ON repair_order_parts;
CREATE POLICY repair_order_parts_staff_all ON repair_order_parts
  FOR ALL
  USING (is_staff(organization_id))
  WITH CHECK (is_staff(organization_id));
