import { Suspense } from 'react'
import EstimateForm from '../../../../components/EstimateForm'

export default async function ShopEstimatePage({ params }) {
  const { orgSlug } = await params
  return (
    <Suspense fallback={<div className='page-hero'><div className='site-shell'><p>Loading estimate form…</p></div></div>}>
      <EstimateForm orgSlug={orgSlug} />
    </Suspense>
  )
}
