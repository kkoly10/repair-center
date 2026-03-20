import CustomerEstimateReviewPage from '../../../components/CustomerEstimateReviewPage'

export default async function EstimateReviewRoute({ params }) {
  const resolvedParams = await params
  return <CustomerEstimateReviewPage quoteId={resolvedParams.quoteId} />
}
