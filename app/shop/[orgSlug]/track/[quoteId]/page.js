import CustomerTrackingPage from '../../../../../components/CustomerTrackingPage'

export default async function ShopTrackRoute({ params, searchParams }) {
  const resolvedParams = await params
  const resolvedSearch = await searchParams
  return (
    <CustomerTrackingPage
      quoteId={resolvedParams.quoteId}
      orgSlug={resolvedParams.orgSlug}
      tok={resolvedSearch?.tok || ''}
    />
  )
}
