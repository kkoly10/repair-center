import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import PlatformNav from '../../components/PlatformNav'
import { getPlatformSession } from '../../lib/platform/getPlatformSession'

export const metadata = { title: 'Platform Console' }

export default async function PlatformLayout({ children }) {
  try {
    await getPlatformSession()
  } catch {
    redirect('/admin/quotes')
  }

  return (
    <>
      <PlatformNav />
      <div style={{ paddingTop: 52, minHeight: '100vh', background: 'var(--bg)' }}>
        <Suspense fallback={<div className='notice' style={{ margin: 32 }}>Loading…</div>}>
          {children}
        </Suspense>
      </div>
    </>
  )
}
