-- Sprint 24: Org-scoped catalog management
-- Adds nullable organization_id to catalog tables.
-- NULL = global platform item (read-only for orgs)
-- non-null = org-specific custom item (writable by that org)

ALTER TABLE public.repair_catalog_brands
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.repair_catalog_models
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.repair_types
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Partial unique indexes: replace global unique constraints with partial ones.
-- Global items: unique by slug/key alone; org items: unique per (slug/key, org).
ALTER TABLE public.repair_catalog_brands DROP CONSTRAINT IF EXISTS repair_catalog_brands_slug_key;
CREATE UNIQUE INDEX IF NOT EXISTS repair_catalog_brands_slug_global
  ON public.repair_catalog_brands(slug) WHERE organization_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS repair_catalog_brands_slug_org
  ON public.repair_catalog_brands(slug, organization_id) WHERE organization_id IS NOT NULL;

ALTER TABLE public.repair_catalog_models DROP CONSTRAINT IF EXISTS repair_catalog_models_model_key_key;
CREATE UNIQUE INDEX IF NOT EXISTS repair_catalog_models_key_global
  ON public.repair_catalog_models(model_key) WHERE organization_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS repair_catalog_models_key_org
  ON public.repair_catalog_models(model_key, organization_id) WHERE organization_id IS NOT NULL;

ALTER TABLE public.repair_types DROP CONSTRAINT IF EXISTS repair_types_repair_key_key;
CREATE UNIQUE INDEX IF NOT EXISTS repair_types_key_global
  ON public.repair_types(repair_key) WHERE organization_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS repair_types_key_org
  ON public.repair_types(repair_key, organization_id) WHERE organization_id IS NOT NULL;

-- Indexes for org-scoped reads
CREATE INDEX IF NOT EXISTS idx_repair_catalog_brands_org
  ON public.repair_catalog_brands(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_repair_catalog_models_org
  ON public.repair_catalog_models(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_repair_types_org
  ON public.repair_types(organization_id) WHERE organization_id IS NOT NULL;

-- RLS: Replace global public-select + staff-write with org-aware policies

-- repair_catalog_brands
DROP POLICY IF EXISTS repair_catalog_brands_public_select ON public.repair_catalog_brands;
DROP POLICY IF EXISTS repair_catalog_brands_staff_write ON public.repair_catalog_brands;
CREATE POLICY repair_catalog_brands_select ON public.repair_catalog_brands
  FOR SELECT TO anon, authenticated
  USING (organization_id IS NULL OR public.is_org_member(organization_id));
CREATE POLICY repair_catalog_brands_org_write ON public.repair_catalog_brands
  FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_member(organization_id))
  WITH CHECK (organization_id IS NOT NULL AND public.is_org_member(organization_id));

-- repair_catalog_models
DROP POLICY IF EXISTS repair_catalog_models_public_select ON public.repair_catalog_models;
DROP POLICY IF EXISTS repair_catalog_models_staff_write ON public.repair_catalog_models;
CREATE POLICY repair_catalog_models_select ON public.repair_catalog_models
  FOR SELECT TO anon, authenticated
  USING (organization_id IS NULL OR public.is_org_member(organization_id));
CREATE POLICY repair_catalog_models_org_write ON public.repair_catalog_models
  FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_member(organization_id))
  WITH CHECK (organization_id IS NOT NULL AND public.is_org_member(organization_id));

-- repair_types
DROP POLICY IF EXISTS repair_types_public_select ON public.repair_types;
DROP POLICY IF EXISTS repair_types_staff_write ON public.repair_types;
CREATE POLICY repair_types_select ON public.repair_types
  FOR SELECT TO anon, authenticated
  USING (organization_id IS NULL OR public.is_org_member(organization_id));
CREATE POLICY repair_types_org_write ON public.repair_types
  FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_member(organization_id))
  WITH CHECK (organization_id IS NOT NULL AND public.is_org_member(organization_id));
