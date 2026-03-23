import PaymentCheckoutPage from '../../../components/PaymentCheckoutPage'

export default async function PayDepositRoute({ params }) {
  const resolvedParams = await params
  return <PaymentCheckoutPage quoteId={resolvedParams.quoteId} />
}
