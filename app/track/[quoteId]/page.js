import CustomerTrackingPage from '../../../components/CustomerTrackingPage'

export default async function TrackQuoteRoute({ params, searchParams }) {
  const resolvedParams = await params
  const resolvedSearch = await searchParams
  return (
    <CustomerTrackingPage
      quoteId={resolvedParams.quoteId}
      tok={resolvedSearch?.tok || ''}
    />
  )
}
