import CustomerEstimateReviewPage from '../../../../../components/CustomerEstimateReviewPage'

export default async function ShopEstimateReviewRoute({ params, searchParams }) {
  const resolvedParams = await params
  const resolvedSearch = await searchParams
  return (
    <CustomerEstimateReviewPage
      quoteId={resolvedParams.quoteId}
      orgSlug={resolvedParams.orgSlug}
      tok={resolvedSearch?.tok || ''}
    />
  )
}
