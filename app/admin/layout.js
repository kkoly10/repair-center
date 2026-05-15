import { Suspense } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import ThemeProvider from '../../components/ThemeProvider'
import AdminOnboardingBanner from '../../components/AdminOnboardingBanner'
import { getSessionOrgId } from '../../lib/admin/getSessionOrgId'
import { getSupabaseAdmin } from '../../lib/supabase/admin'

async function getOrgBranding() {
  try {
    const orgId = await getSessionOrgId()
    const { data } = await getSupabaseAdmin()
      .from('organization_branding')
      .select('primary_color, accent_color')
      .eq('organization_id', orgId)
      .maybeSingle()
    return { primaryColor: data?.primary_color || null, accentColor: data?.accent_color || null }
  } catch {
    return { primaryColor: null, accentColor: null }
  }
}

export default async function AdminLayout({ children }) {
  const { primaryColor, accentColor } = await getOrgBranding()

  return (
    <>
      <ThemeProvider primaryColor={primaryColor} accentColor={accentColor} />
      <div className='admin-layout'>
        <AdminSidebar />
        <div className='admin-main'>
          <AdminOnboardingBanner />
          <Suspense
            fallback={
              <main className='page-hero'>
                <div className='site-shell'>
                  <div className='policy-card center-card'>Loading admin workspace…</div>
                </div>
              </main>
            }
          >
            {children}
          </Suspense>
        </div>
      </div>
    </>
  )
}
