import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabase/admin'
import { getDefaultOrgId } from '../../../lib/admin/org'
import { checkRateLimit } from '../../../lib/rateLimiter'
import { ALLOWED_PHOTO_MIME, MAX_PHOTO_BYTES, MAX_PHOTO_COUNT, extensionForMime } from '../../../lib/photoMime'

export const runtime = 'nodejs'

export async function POST(request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const { allowed } = await checkRateLimit(ip, { maxRequests: 5, windowMs: 60 * 60 * 1000 })
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a while before submitting again.' },
      { status: 429 }
    )
  }

  const supabase = getSupabaseAdmin()

  let rawFormData
  try {
    rawFormData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 })
  }

  // Resolve org from slug if provided; fall back to default org for single-tenant setups
  let orgId
  const orgSlug = (rawFormData.get('orgSlug') || '').toString().trim()
  if (orgSlug) {
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', orgSlug)
      .eq('status', 'active')
      .maybeSingle()
    if (!orgError && org) {
      orgId = org.id
    }
  }
  if (!orgId) {
    orgId = await getDefaultOrgId()
  }

  try {
    const formData = rawFormData

    const firstName = (formData.get('firstName') || '').toString().trim()
    const lastName = (formData.get('lastName') || '').toString().trim()
    const email = (formData.get('email') || '').toString().trim().toLowerCase()
    const phone = (formData.get('phone') || '').toString().trim()
    const contactMethodRaw = (formData.get('contactMethod') || 'Either').toString().trim()
    const category = (formData.get('category') || '').toString().trim()
    const brand = (formData.get('brand') || '').toString().trim()
    const modelKey = (formData.get('modelKey') || '').toString().trim()
    const repairKey = (formData.get('repairKey') || '').toString().trim()
    const issueDescription = (formData.get('issueDescription') || '').toString().trim()
    const powerState = (formData.get('powerState') || '').toString().trim()
    const chargeState = (formData.get('chargeState') || '').toString().trim()
    const liquidState = (formData.get('liquidState') || '').toString().trim()
    const priorRepairState = (formData.get('priorRepairState') || '').toString().trim()
    const dataState = (formData.get('dataState') || '').toString().trim()
    const allPhotoFiles = formData.getAll('photos').filter((item) => item && typeof item === 'object' && 'arrayBuffer' in item)
    const photoFiles = allPhotoFiles.slice(0, MAX_PHOTO_COUNT)

    if (!firstName || !email || !category || !modelKey || !repairKey || !issueDescription) {
      return NextResponse.json(
        { error: 'Missing required estimate fields.' },
        { status: 400 }
      )
    }

    const preferredContactMethod = mapContactMethod(contactMethodRaw)

    const { data: existingCustomers, error: customerLookupError } = await supabase
      .from('customers')
      .select('id, email')
      .eq('organization_id', orgId)
      .ilike('email', email)
      .limit(5)

    if (customerLookupError) throw customerLookupError

    const existingCustomer = (existingCustomers || []).find(
      (item) => (item.email || '').toLowerCase() === email
    )

    let customerId = existingCustomer?.id ?? null

    if (customerId) {
      const { error: customerUpdateError } = await supabase
        .from('customers')
        .update({
          first_name: firstName,
          last_name: lastName || null,
          email,
          phone: phone || null,
          preferred_contact_method: preferredContactMethod,
        })
        .eq('id', customerId)
        .eq('organization_id', orgId)

      if (customerUpdateError) throw customerUpdateError
    } else {
      const { data: insertedCustomer, error: customerInsertError } = await supabase
        .from('customers')
        .insert({
          organization_id: orgId,
          first_name: firstName,
          last_name: lastName || null,
          email,
          phone: phone || null,
          preferred_contact_method: preferredContactMethod,
        })
        .select('id')
        .single()

      if (customerInsertError) throw customerInsertError
      customerId = insertedCustomer.id
    }

    const { data: model, error: modelError } = await supabase
      .from('repair_catalog_models')
      .select('id, model_name')
      .eq('model_key', modelKey)
      .single()

    if (modelError) throw modelError

    const { data: repairType, error: repairTypeError } = await supabase
      .from('repair_types')
      .select('id, repair_key, repair_name')
      .eq('repair_key', repairKey)
      .single()

    if (repairTypeError) throw repairTypeError

    const { data: pricingRule, error: pricingRuleError } = await supabase
      .from('pricing_rules')
      .select('id, public_price_fixed, public_price_min, public_price_max')
      .eq('organization_id', orgId)
      .eq('model_id', model.id)
      .eq('repair_type_id', repairType.id)
      .eq('active', true)
      .maybeSingle()

    if (pricingRuleError) throw pricingRuleError

    const { data: quoteRequest, error: quoteInsertError } = await supabase
      .from('quote_requests')
      .insert({
        organization_id: orgId,
        customer_id: customerId,
        guest_email: email,
        guest_phone: phone || null,
        first_name: firstName,
        last_name: lastName || null,
        preferred_contact_method: preferredContactMethod,
        device_category: category,
        brand_name: brand || null,
        model_name: model.model_name,
        model_key: modelKey,
        repair_type_key: repairKey,
        issue_description: issueDescription,
        powers_on: powerState || null,
        charges: chargeState || null,
        liquid_damage: liquidState || null,
        prior_repairs: priorRepairState || null,
        preserve_data: dataState || null,
        submission_source: 'web',
        status: pricingRule ? 'submitted' : 'under_review',
        selected_pricing_rule_id: pricingRule?.id ?? null,
        preliminary_price_fixed: pricingRule?.public_price_fixed ?? null,
        preliminary_price_min: pricingRule?.public_price_min ?? null,
        preliminary_price_max: pricingRule?.public_price_max ?? null,
        quote_summary: pricingRule
          ? `${repairType.repair_name} selected for ${model.model_name}`
          : `Manual review required for ${repairType.repair_name}`,
      })
      .select('id, quote_id')
      .single()

    if (quoteInsertError) throw quoteInsertError

    const photoWarnings = []

    for (let index = 0; index < photoFiles.length; index += 1) {
      const file = photoFiles[index]
      if (!file || !file.name || file.size === 0) continue

      if (!ALLOWED_PHOTO_MIME.has(file.type)) {
        photoWarnings.push(`${file.name}: unsupported file type`)
        continue
      }

      if (file.size > MAX_PHOTO_BYTES) {
        photoWarnings.push(`${file.name}: file exceeds 10 MB limit`)
        continue
      }

      try {
        const extension = extensionForMime(file.type)
        const fileName = `${Date.now()}-${index}.${extension}`
        const storagePath = `orgs/${orgId}/quotes/${quoteRequest.quote_id}/${fileName}`
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const { error: uploadError } = await supabase.storage
          .from('repair-uploads')
          .upload(storagePath, buffer, {
            contentType: file.type || 'application/octet-stream',
            upsert: false,
          })

        if (uploadError) {
          photoWarnings.push(`${file.name}: ${uploadError.message}`)
          continue
        }

        const { error: photoRowError } = await supabase
          .from('quote_request_photos')
          .insert({
            organization_id: orgId,
            quote_request_id: quoteRequest.id,
            storage_path: storagePath,
            photo_type: inferPhotoType(index),
            sort_order: index,
            uploaded_by_customer: true,
          })

        if (photoRowError) {
          photoWarnings.push(`${file.name}: ${photoRowError.message}`)
        }
      } catch (photoError) {
        photoWarnings.push(`${file.name}: ${photoError.message}`)
      }
    }

    return NextResponse.json({
      ok: true,
      quoteId: quoteRequest.quote_id,
      customerId,
      quoteRequestId: quoteRequest.id,
      pricingRuleId: pricingRule?.id ?? null,
      photoWarnings,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unexpected server error.',
      },
      { status: 500 }
    )
  }
}

function mapContactMethod(value) {
  if (value === 'Email') return 'email'
  if (value === 'Text') return 'text'
  return 'either'
}

function inferPhotoType(index) {
  const types = ['front', 'back', 'damage_closeup', 'screen_on', 'side_frame', 'port']
  return types[index] || 'other'
}
