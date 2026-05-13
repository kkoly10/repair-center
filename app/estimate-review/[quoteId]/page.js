import CustomerEstimateReviewPage from '../../../components/CustomerEstimateReviewPage'

export default async function EstimateReviewRoute({ params, searchParams }) {
  const resolvedParams = await params
  const resolvedSearch = await searchParams
  return (
    <CustomerEstimateReviewPage
      quoteId={resolvedParams.quoteId}
      tok={resolvedSearch?.tok || ''}
    />
  )
}
