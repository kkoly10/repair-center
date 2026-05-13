import { Suspense } from 'react'
import AdminNav from '../../components/AdminNav'

export default function AdminLayout({ children }) {
  return (
    <>
      <AdminNav />
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
    </>
  )
}
