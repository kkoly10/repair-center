import CustomerEstimateReviewPage from '../../../../../components/CustomerEstimateReviewPage'

export default async function ShopEstimateReviewRoute({ params }) {
  const resolvedParams = await params
  return (
    <CustomerEstimateReviewPage
      quoteId={resolvedParams.quoteId}
      orgSlug={resolvedParams.orgSlug}
    />
  )
}
