import FinalBalanceCheckoutPage from '../../../../components/FinalBalanceCheckoutPage'

export default async function FinalBalancePaymentRoute({ params }) {
  const resolvedParams = await params
  return <FinalBalanceCheckoutPage quoteId={resolvedParams.quoteId} />
}
