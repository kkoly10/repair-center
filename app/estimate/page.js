import { Suspense } from 'react'
import EstimateForm from '../../components/EstimateForm'

export default function EstimatePage() {
  return (
    <Suspense fallback={<div className='page-hero'><div className='site-shell'><p>Loading estimate form…</p></div></div>}>
      <EstimateForm />
    </Suspense>
  )
}
