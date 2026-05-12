import CustomerTrackingPage from '../../../../../components/CustomerTrackingPage'

export default async function ShopTrackRoute({ params }) {
  const resolvedParams = await params
  return (
    <CustomerTrackingPage
      quoteId={resolvedParams.quoteId}
      orgSlug={resolvedParams.orgSlug}
    />
  )
}
