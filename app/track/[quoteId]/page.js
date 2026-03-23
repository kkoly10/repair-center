import CustomerTrackingPage from '../../../components/CustomerTrackingPage'

export default async function TrackQuoteRoute({ params }) {
  const resolvedParams = await params
  return <CustomerTrackingPage quoteId={resolvedParams.quoteId} />
}