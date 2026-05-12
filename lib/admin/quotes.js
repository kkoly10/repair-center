import { getSupabaseAdmin } from '../supabase/admin'
import { getDefaultOrgId } from './org'

export const QUOTE_STATUS_OPTIONS = [
  { value: 'all', label: 'All requests' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'estimate_sent', label: 'Estimate sent' },
  { value: 'awaiting_customer', label: 'Awaiting customer' },
  { value: 'approved_for_mail_in', label: 'Approved for mail-in' },
  { value: 'declined', label: 'Declined' },
  { value: 'archived', label: 'Archived' },
]

export function formatQuotePrice(record) {
  if (!record) return '—'
  if (record.preliminary_price_fixed != null) return `$${Number(record.preliminary_price_fixed).toFixed(2)}`
  if (record.preliminary_price_min != null && record.preliminary_price_max != null) {
    return `$${Number(record.preliminary_price_min).toFixed(2)}–$${Number(record.preliminary_price_max).toFixed(2)}`
  }
  return 'Manual review'
}

export function formatStatusLabel(status) {
  return status
    ?.split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export async function listQuoteRequests({ status = 'all', limit = 100 } = {}) {
  const supabase = getSupabaseAdmin()
  const orgId = await getDefaultOrgId()

  let queueQuery = supabase
    .from('quote_requests')
    .select('id, quote_id, first_name, last_name, guest_email, guest_phone, device_category, brand_name, model_name, repair_type_key, status, preliminary_price_fixed, preliminary_price_min, preliminary_price_max, quote_summary, created_at, reviewed_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status !== 'all') {
    queueQuery = queueQuery.eq('status', status)
  }

  const [{ data: items, error: itemsError }, { data: statuses, error: statusesError }] = await Promise.all([
    queueQuery,
    supabase.from('quote_requests').select('id, status').eq('organization_id', orgId),
  ])

  if (itemsError) throw itemsError
  if (statusesError) throw statusesError

  const requestIds = (items || []).map((item) => item.id)
  let photos = []

  if (requestIds.length) {
    const { data: photoRows, error: photoError } = await supabase
      .from('quote_request_photos')
      .select('quote_request_id')
      .in('quote_request_id', requestIds)

    if (photoError) throw photoError
    photos = photoRows || []
  }

  const photoCountByRequestId = photos.reduce((accumulator, row) => {
    accumulator[row.quote_request_id] = (accumulator[row.quote_request_id] || 0) + 1
    return accumulator
  }, {})

  const stats = buildStatusCounts(statuses || [])

  return {
    stats,
    items: (items || []).map((item) => ({
      ...item,
      customer_name: [item.first_name, item.last_name].filter(Boolean).join(' ') || 'Guest customer',
      price_display: formatQuotePrice(item),
      photo_count: photoCountByRequestId[item.id] || 0,
    })),
  }
}

export async function getQuoteRequestDetail(quoteId) {
  const supabase = getSupabaseAdmin()

  const { data: quote, error: quoteError } = await supabase
    .from('quote_requests')
    .select('*')
    .eq('quote_id', quoteId)
    .maybeSingle()

  if (quoteError) throw quoteError
  if (!quote) return null

  const [photosResult, pricingResult, customerResult] = await Promise.all([
    supabase.from('quote_request_photos').select('id, storage_path, photo_type, sort_order, created_at').eq('quote_request_id', quote.id).order('sort_order', { ascending: true }),
    quote.selected_pricing_rule_id
      ? supabase.from('pricing_rules').select('*').eq('id', quote.selected_pricing_rule_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    quote.customer_id
      ? supabase.from('customers').select('id, first_name, last_name, email, phone, preferred_contact_method').eq('id', quote.customer_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  if (photosResult.error) throw photosResult.error
  if (pricingResult.error) throw pricingResult.error
  if (customerResult.error) throw customerResult.error

  const photoRows = photosResult.data || []
  const photos = await Promise.all(
    photoRows.map(async (photo) => {
      const { data, error } = await supabase.storage.from('repair-uploads').createSignedUrl(photo.storage_path, 3600)

      return {
        ...photo,
        signed_url: error ? null : data?.signedUrl || null,
        error_message: error ? error.message : null,
      }
    })
  )

  return {
    quote: {
      ...quote,
      customer_name: customerResult.data
        ? [customerResult.data.first_name, customerResult.data.last_name].filter(Boolean).join(' ')
        : [quote.first_name, quote.last_name].filter(Boolean).join(' '),
      customer_email: customerResult.data?.email || quote.guest_email,
      customer_phone: customerResult.data?.phone || quote.guest_phone,
      price_display: formatQuotePrice(quote),
      status_label: formatStatusLabel(quote.status),
    },
    pricingRule: pricingResult.data,
    customer: customerResult.data,
    photos,
  }
}

function buildStatusCounts(rows) {
  const base = {
    all: rows.length,
    submitted: 0,
    under_review: 0,
    estimate_sent: 0,
    awaiting_customer: 0,
    approved_for_mail_in: 0,
    declined: 0,
    archived: 0,
  }

  for (const row of rows) {
    if (row.status in base) {
      base[row.status] += 1
    }
  }

  return base
}
