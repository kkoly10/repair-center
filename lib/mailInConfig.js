import { getSupabaseAdmin } from './supabase/admin'

const _fallback = {
  businessName: 'Repair Center',
  supportEmail: '',
  supportPhone: '',
  receivingAddress: { line1: '', line2: '', city: '', state: '', postalCode: '' },
  packingChecklist: [],
  shippingNotes: [],
}

export async function getMailInConfig(orgId) {
  const supabase = getSupabaseAdmin()

  const [{ data: settings }, { data: org }] = await Promise.all([
    supabase
      .from('organization_settings')
      .select('receiving_line1, receiving_line2, receiving_city, receiving_state, receiving_postal_code, packing_checklist, shipping_notes')
      .eq('organization_id', orgId)
      .single(),
    supabase
      .from('organizations')
      .select('name, public_name, support_email, support_phone')
      .eq('id', orgId)
      .single(),
  ])

  if (!settings) return _fallback

  return {
    businessName: org?.public_name || org?.name || _fallback.businessName,
    supportEmail: org?.support_email || _fallback.supportEmail,
    supportPhone: org?.support_phone || _fallback.supportPhone,
    receivingAddress: {
      line1: settings.receiving_line1 || '',
      line2: settings.receiving_line2 || '',
      city: settings.receiving_city || '',
      state: settings.receiving_state || '',
      postalCode: settings.receiving_postal_code || '',
    },
    packingChecklist: settings.packing_checklist || [],
    shippingNotes: settings.shipping_notes || [],
  }
}
