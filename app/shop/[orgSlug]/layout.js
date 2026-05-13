import ThemeProvider from '../../../components/ThemeProvider'
import { getSupabaseAdmin } from '../../../lib/supabase/admin'

async function getShopBranding(orgSlug) {
  try {
    const supabase = getSupabaseAdmin()
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', orgSlug)
      .eq('status', 'active')
      .maybeSingle()
    if (!org) return { primaryColor: null, accentColor: null }

    const { data } = await supabase
      .from('organization_branding')
      .select('primary_color, accent_color')
      .eq('organization_id', org.id)
      .maybeSingle()
    return { primaryColor: data?.primary_color || null, accentColor: data?.accent_color || null }
  } catch {
    return { primaryColor: null, accentColor: null }
  }
}

export default async function ShopLayout({ children, params }) {
  const { orgSlug } = await params
  const { primaryColor, accentColor } = await getShopBranding(orgSlug)

  return (
    <>
      <ThemeProvider primaryColor={primaryColor} accentColor={accentColor} />
      {children}
    </>
  )
}
