import { getSupabaseAdmin } from '../../../lib/supabase/admin'
import ReviewPage from '../../../components/CustomerReviewPage'

export default async function Page({ params, searchParams }) {
  const { quoteId } = await params
  const { rating: ratingParam } = await searchParams

  const supabase = getSupabaseAdmin()
  const { data: quote } = await supabase
    .from('quote_requests')
    .select('quote_id, first_name, brand_name, model_name')
    .eq('quote_id', quoteId)
    .maybeSingle()

  if (!quote) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Review not found</h1>
        <p style={{ color: '#888' }}>This review link is invalid or has expired.</p>
      </div>
    )
  }

  const initialRating = ratingParam ? Math.min(5, Math.max(1, parseInt(ratingParam, 10))) : null

  return (
    <ReviewPage
      quoteId={quoteId}
      firstName={quote.first_name || 'there'}
      device={[quote.brand_name, quote.model_name].filter(Boolean).join(' ') || 'your device'}
      initialRating={initialRating}
    />
  )
}
