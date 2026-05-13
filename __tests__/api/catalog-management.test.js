jest.mock('../../lib/supabase/admin')
jest.mock('../../lib/admin/getSessionOrgId')

const { getSupabaseAdmin } = require('../../lib/supabase/admin')
const { getSessionOrgId } = require('../../lib/admin/getSessionOrgId')
const { createSupabaseMock, getChain } = require('../helpers/supabaseMock')

const ORG_ID = 'org-111'
const BRAND_ID = 'brand-aaa'
const MODEL_ID = 'model-bbb'
const TYPE_ID = 'type-ccc'

function makeReq(body = {}, url = 'http://localhost/') {
  return { json: () => Promise.resolve(body), url }
}
function makeCtx(params) {
  return { params: Promise.resolve(params) }
}

// ─────────────────────────────────────────────
// GET /admin/api/catalog/brands
// ─────────────────────────────────────────────
describe('GET /admin/api/catalog/brands', () => {
  const { GET } = require('../../app/admin/api/catalog/brands/route')

  beforeEach(() => {
    getSessionOrgId.mockReset()
    getSupabaseAdmin.mockReset()
  })

  it('returns 401 when unauthenticated', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns global + org brands with is_org_owned flag', async () => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    const rows = [
      { id: BRAND_ID, brand_name: 'Apple', category: 'phone', slug: 'apple', active: true, organization_id: null },
      { id: 'brand-2', brand_name: 'Custom', category: 'phone', slug: 'custom-111', active: true, organization_id: ORG_ID },
    ]
    const supabase = createSupabaseMock({ repair_catalog_brands: { data: rows, error: null } })
    getSupabaseAdmin.mockReturnValue(supabase)
    const res = await GET()
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.brands).toHaveLength(2)
    expect(body.brands[0].is_org_owned).toBe(false)
    expect(body.brands[1].is_org_owned).toBe(true)
  })
})

// ─────────────────────────────────────────────
// POST /admin/api/catalog/brands
// ─────────────────────────────────────────────
describe('POST /admin/api/catalog/brands', () => {
  const { POST } = require('../../app/admin/api/catalog/brands/route')

  beforeEach(() => {
    getSessionOrgId.mockReset()
    getSupabaseAdmin.mockReset()
  })

  it('returns 401 when unauthenticated', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const res = await POST(makeReq({ brandName: 'Test', category: 'phone' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when brandName missing', async () => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    const res = await POST(makeReq({ category: 'phone' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when category invalid', async () => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    const res = await POST(makeReq({ brandName: 'X', category: 'wearable' }))
    expect(res.status).toBe(400)
  })

  it('inserts org-scoped brand and returns 201', async () => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    const newBrand = { id: BRAND_ID, brand_name: 'Nothing', category: 'phone', slug: 'nothing-org-111', active: true, organization_id: ORG_ID }
    const supabase = createSupabaseMock({ repair_catalog_brands: { data: newBrand, error: null } })
    getSupabaseAdmin.mockReturnValue(supabase)
    const res = await POST(makeReq({ brandName: 'Nothing', category: 'phone' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.brand.is_org_owned).toBe(true)
    const chain = getChain(supabase, 'repair_catalog_brands', 0)
    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ organization_id: ORG_ID }))
  })
})

// ─────────────────────────────────────────────
// PATCH /admin/api/catalog/brands/[brandId]
// ─────────────────────────────────────────────
describe('PATCH /admin/api/catalog/brands/[brandId]', () => {
  const { PATCH } = require('../../app/admin/api/catalog/brands/[brandId]/route')

  beforeEach(() => {
    getSessionOrgId.mockReset()
    getSupabaseAdmin.mockReset()
  })

  it('returns 404 for cross-org brand', async () => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    const supabase = createSupabaseMock({ repair_catalog_brands: { data: null, error: null } })
    getSupabaseAdmin.mockReturnValue(supabase)
    const res = await PATCH(makeReq({ brandName: 'Edited' }), makeCtx({ brandId: BRAND_ID }))
    expect(res.status).toBe(404)
  })

  it('updates org-owned brand', async () => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    const updated = { id: BRAND_ID, brand_name: 'Edited', category: 'phone', slug: 'edited', active: true, organization_id: ORG_ID }
    const supabase = createSupabaseMock({
      repair_catalog_brands: [
        { data: { id: BRAND_ID, organization_id: ORG_ID }, error: null }, // lookup
        { data: updated, error: null }, // update result
      ],
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    const res = await PATCH(makeReq({ brandName: 'Edited' }), makeCtx({ brandId: BRAND_ID }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.brand.brand_name).toBe('Edited')
    expect(body.brand.is_org_owned).toBe(true)
  })
})

// ─────────────────────────────────────────────
// DELETE /admin/api/catalog/brands/[brandId]
// ─────────────────────────────────────────────
describe('DELETE /admin/api/catalog/brands/[brandId]', () => {
  const { DELETE } = require('../../app/admin/api/catalog/brands/[brandId]/route')

  beforeEach(() => {
    getSessionOrgId.mockReset()
    getSupabaseAdmin.mockReset()
  })

  it('returns 404 for brand not owned by org', async () => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    const supabase = createSupabaseMock({ repair_catalog_brands: { data: null, error: null } })
    getSupabaseAdmin.mockReturnValue(supabase)
    const res = await DELETE(undefined, makeCtx({ brandId: BRAND_ID }))
    expect(res.status).toBe(404)
  })

  it('deletes org-owned brand', async () => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    const supabase = createSupabaseMock({
      repair_catalog_brands: [
        { data: { id: BRAND_ID }, error: null }, // lookup
        { data: null, error: null }, // delete
      ],
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    const res = await DELETE(undefined, makeCtx({ brandId: BRAND_ID }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })
})

// ─────────────────────────────────────────────
// GET /admin/api/catalog/models
// ─────────────────────────────────────────────
describe('GET /admin/api/catalog/models', () => {
  const { GET } = require('../../app/admin/api/catalog/models/route')

  beforeEach(() => {
    getSessionOrgId.mockReset()
    getSupabaseAdmin.mockReset()
  })

  it('returns 401 when unauthenticated', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns global + org models with is_org_owned flag', async () => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    const rows = [
      { id: MODEL_ID, model_name: 'iPhone 15', organization_id: null, repair_catalog_brands: { id: BRAND_ID, brand_name: 'Apple', category: 'phone' } },
      { id: 'model-2', model_name: 'Custom Phone', organization_id: ORG_ID, repair_catalog_brands: { id: BRAND_ID, brand_name: 'Apple', category: 'phone' } },
    ]
    const supabase = createSupabaseMock({ repair_catalog_models: { data: rows, error: null } })
    getSupabaseAdmin.mockReturnValue(supabase)
    const res = await GET()
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.models[0].is_org_owned).toBe(false)
    expect(body.models[1].is_org_owned).toBe(true)
  })
})

// ─────────────────────────────────────────────
// PATCH /admin/api/catalog/models/[modelId]
// ─────────────────────────────────────────────
describe('PATCH /admin/api/catalog/models/[modelId]', () => {
  const { PATCH } = require('../../app/admin/api/catalog/models/[modelId]/route')

  beforeEach(() => {
    getSessionOrgId.mockReset()
    getSupabaseAdmin.mockReset()
  })

  it('returns 404 for cross-org model', async () => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    const supabase = createSupabaseMock({ repair_catalog_models: { data: null, error: null } })
    getSupabaseAdmin.mockReturnValue(supabase)
    const res = await PATCH(makeReq({ modelName: 'Edited' }), makeCtx({ modelId: MODEL_ID }))
    expect(res.status).toBe(404)
  })

  it('updates org-owned model', async () => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    const updated = { id: MODEL_ID, model_key: 'apple-edited-org-111', model_name: 'Edited', family_name: null, category: 'phone', active: true, organization_id: ORG_ID, repair_catalog_brands: { id: BRAND_ID, brand_name: 'Apple', category: 'phone' } }
    const supabase = createSupabaseMock({
      repair_catalog_models: [
        { data: { id: MODEL_ID }, error: null }, // lookup
        { data: updated, error: null }, // update result
      ],
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    const res = await PATCH(makeReq({ modelName: 'Edited' }), makeCtx({ modelId: MODEL_ID }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.model.model_name).toBe('Edited')
    expect(body.model.is_org_owned).toBe(true)
  })
})

// ─────────────────────────────────────────────
// GET /admin/api/catalog/repair-types
// ─────────────────────────────────────────────
describe('GET /admin/api/catalog/repair-types', () => {
  const { GET } = require('../../app/admin/api/catalog/repair-types/route')

  beforeEach(() => {
    getSessionOrgId.mockReset()
    getSupabaseAdmin.mockReset()
  })

  it('returns 401 when unauthenticated', async () => {
    getSessionOrgId.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns global + org repair types with is_org_owned flag', async () => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    const rows = [
      { id: TYPE_ID, repair_name: 'Screen Replacement', organization_id: null },
      { id: 'type-2', repair_name: 'Mobo Repair', organization_id: ORG_ID },
    ]
    const supabase = createSupabaseMock({ repair_types: { data: rows, error: null } })
    getSupabaseAdmin.mockReturnValue(supabase)
    const res = await GET()
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.repairTypes[0].is_org_owned).toBe(false)
    expect(body.repairTypes[1].is_org_owned).toBe(true)
  })
})

// ─────────────────────────────────────────────
// PATCH /admin/api/catalog/repair-types/[typeId]
// ─────────────────────────────────────────────
describe('PATCH /admin/api/catalog/repair-types/[typeId]', () => {
  const { PATCH } = require('../../app/admin/api/catalog/repair-types/[typeId]/route')

  beforeEach(() => {
    getSessionOrgId.mockReset()
    getSupabaseAdmin.mockReset()
  })

  it('returns 404 for cross-org repair type', async () => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    const supabase = createSupabaseMock({ repair_types: { data: null, error: null } })
    getSupabaseAdmin.mockReturnValue(supabase)
    const res = await PATCH(makeReq({ repairName: 'Edited' }), makeCtx({ typeId: TYPE_ID }))
    expect(res.status).toBe(404)
  })

  it('updates org-owned repair type', async () => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    const updated = { id: TYPE_ID, repair_key: 'edited_org-111', repair_name: 'Edited', category: null, price_mode_default: 'manual', warranty_days_default: null, active: true, organization_id: ORG_ID }
    const supabase = createSupabaseMock({
      repair_types: [
        { data: { id: TYPE_ID }, error: null }, // lookup
        { data: updated, error: null }, // update result
      ],
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    const res = await PATCH(makeReq({ repairName: 'Edited' }), makeCtx({ typeId: TYPE_ID }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.repairType.repair_name).toBe('Edited')
    expect(body.repairType.is_org_owned).toBe(true)
  })
})

// ─────────────────────────────────────────────
// POST /admin/api/catalog/models
// ─────────────────────────────────────────────
describe('POST /admin/api/catalog/models', () => {
  const { POST } = require('../../app/admin/api/catalog/models/route')

  beforeEach(() => {
    getSessionOrgId.mockReset()
    getSupabaseAdmin.mockReset()
  })

  it('returns 400 when brandId missing', async () => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    const res = await POST(makeReq({ modelName: 'X', category: 'phone' }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when brand not accessible', async () => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    const supabase = createSupabaseMock({ repair_catalog_brands: { data: null, error: null } })
    getSupabaseAdmin.mockReturnValue(supabase)
    const res = await POST(makeReq({ modelName: 'X', brandId: BRAND_ID, category: 'phone' }))
    expect(res.status).toBe(404)
  })

  it('inserts org-scoped model with generated key', async () => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    const brand = { id: BRAND_ID, slug: 'apple' }
    const newModel = { id: MODEL_ID, model_key: 'apple-x-org-111', model_name: 'X', family_name: null, category: 'phone', active: true, organization_id: ORG_ID, repair_catalog_brands: { id: BRAND_ID, brand_name: 'Apple', category: 'phone' } }
    const supabase = createSupabaseMock({
      repair_catalog_brands: { data: brand, error: null }, // brand lookup
      repair_catalog_models: { data: newModel, error: null }, // model insert
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    const res = await POST(makeReq({ modelName: 'X', brandId: BRAND_ID, category: 'phone' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.model.is_org_owned).toBe(true)
    const modelChain = getChain(supabase, 'repair_catalog_models', 0)
    expect(modelChain.insert).toHaveBeenCalledWith(expect.objectContaining({ organization_id: ORG_ID }))
  })
})

// ─────────────────────────────────────────────
// POST /admin/api/catalog/repair-types
// ─────────────────────────────────────────────
describe('POST /admin/api/catalog/repair-types', () => {
  const { POST } = require('../../app/admin/api/catalog/repair-types/route')

  beforeEach(() => {
    getSessionOrgId.mockReset()
    getSupabaseAdmin.mockReset()
  })

  it('returns 400 when repairName missing', async () => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    const res = await POST(makeReq({ priceModeDefault: 'manual' }))
    expect(res.status).toBe(400)
  })

  it('inserts org-scoped repair type', async () => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    const newType = { id: TYPE_ID, repair_key: 'mobo_repair_org-111', repair_name: 'Mobo Repair', category: null, price_mode_default: 'manual', warranty_days_default: 90, active: true, organization_id: ORG_ID }
    const supabase = createSupabaseMock({ repair_types: { data: newType, error: null } })
    getSupabaseAdmin.mockReturnValue(supabase)
    const res = await POST(makeReq({ repairName: 'Mobo Repair', priceModeDefault: 'manual', warrantyDaysDefault: 90 }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.repairType.is_org_owned).toBe(true)
    const chain = getChain(supabase, 'repair_types', 0)
    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ organization_id: ORG_ID }))
  })
})

// ─────────────────────────────────────────────
// DELETE /admin/api/catalog/repair-types/[typeId]
// ─────────────────────────────────────────────
describe('DELETE /admin/api/catalog/repair-types/[typeId]', () => {
  const { DELETE } = require('../../app/admin/api/catalog/repair-types/[typeId]/route')

  beforeEach(() => {
    getSessionOrgId.mockReset()
    getSupabaseAdmin.mockReset()
  })

  it('returns 404 for type not owned by org', async () => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    const supabase = createSupabaseMock({ repair_types: { data: null, error: null } })
    getSupabaseAdmin.mockReturnValue(supabase)
    const res = await DELETE(undefined, makeCtx({ typeId: TYPE_ID }))
    expect(res.status).toBe(404)
  })

  it('deletes org-owned repair type', async () => {
    getSessionOrgId.mockResolvedValue(ORG_ID)
    const supabase = createSupabaseMock({
      repair_types: [
        { data: { id: TYPE_ID }, error: null }, // lookup
        { data: null, error: null }, // delete
      ],
    })
    getSupabaseAdmin.mockReturnValue(supabase)
    const res = await DELETE(undefined, makeCtx({ typeId: TYPE_ID }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })
})
