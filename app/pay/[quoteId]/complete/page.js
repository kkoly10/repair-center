import { Suspense } from 'react'
import PaymentCompletePage from '../../../../components/PaymentCompletePage'

export default async function PayCompleteRoute({ params }) {
  const resolvedParams = await params
  return (
    <Suspense fallback={null}>
      <PaymentCompletePage quoteId={resolvedParams.quoteId} />
    </Suspense>
  )
}
