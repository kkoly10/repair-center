'use client'

import { useMemo, useState } from 'react'
import { getSupabaseBrowser } from '../lib/supabase/browser'
import { QUOTE_STATUS_OPTIONS } from '../lib/admin/quotes'

function toInputValue(value) {
  return value == null ? '' : String(value)
}

export default function QuoteReviewForm({ quote, onSaved }) {
  const [status, setStatus] = useState(quote.status || 'submitted')
  const [quoteSummary, setQuoteSummary] = useState(quote.quote_summary || '')
  const [internalNotes, setInternalNotes] = useState(quote.internal_notes || '')
  const [priceFixed, setPriceFixed] = useState(toInputValue(quote.preliminary_price_fixed))
  const [priceMin, setPriceMin] = useState(toInputValue(quote.preliminary_price_min))
  const [priceMax, setPriceMax] = useState(toInputValue(quote.preliminary_price_max))
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const saveDisabled = useMemo(() => loading, [loading])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const supabase = getSupabaseBrowser()
      const nowIso = new Date().toISOString()

      const payload = {
        status,
        quote_summary: quoteSummary || null,
        internal_notes: internalNotes || null,
        preliminary_price_fixed: priceFixed === '' ? null : Number(priceFixed),
        preliminary_price_min: priceMin === '' ? null : Number(priceMin),
        preliminary_price_max: priceMax === '' ? null : Number(priceMax),
        reviewed_at: nowIso,
      }

      const { data, error: updateError } = await supabase
        .from('quote_requests')
        .update(payload)
        .eq('id', quote.id)
        .select('*')
        .single()

      if (updateError) throw updateError

      setMessage('Quote review saved.')
      onSaved?.(data)
    } catch (saveError) {
      setError(saveError.message || 'Unable to save quote review.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className='policy-card' onSubmit={handleSubmit}>
      <div className='kicker'>Review actions</div>
      <h3>Update quote status and summary</h3>

      <div className='page-stack' style={{ marginTop: 18 }}>
        <div className='field'>
          <label htmlFor='quote-status'>Status</label>
          <select id='quote-status' value={status} onChange={(event) => setStatus(event.target.value)}>
            {QUOTE_STATUS_OPTIONS.filter((option) => option.value !== 'all').map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className='field'>
          <label htmlFor='quote-summary'>Customer-facing summary</label>
          <textarea
            id='quote-summary'
            value={quoteSummary}
            onChange={(event) => setQuoteSummary(event.target.value)}
            placeholder='What should the customer be told about this quote?'
          />
        </div>

        <div className='form-grid'>
          <div className='field'>
            <label htmlFor='price-fixed'>Fixed price</label>
            <input id='price-fixed' value={priceFixed} onChange={(event) => setPriceFixed(event.target.value)} placeholder='149' />
          </div>
          <div className='field'>
            <label htmlFor='price-min'>Price min</label>
            <input id='price-min' value={priceMin} onChange={(event) => setPriceMin(event.target.value)} placeholder='129' />
          </div>
          <div className='field'>
            <label htmlFor='price-max'>Price max</label>
            <input id='price-max' value={priceMax} onChange={(event) => setPriceMax(event.target.value)} placeholder='179' />
          </div>
        </div>

        <div className='field'>
          <label htmlFor='internal-notes'>Internal notes</label>
          <textarea
            id='internal-notes'
            value={internalNotes}
            onChange={(event) => setInternalNotes(event.target.value)}
            placeholder='Internal technician or admin notes'
          />
        </div>

        {error ? <div className='notice'>{error}</div> : null}
        {message ? <div className='notice'>{message}</div> : null}

        <div className='inline-actions'>
          <button type='submit' className='button button-primary' disabled={saveDisabled}>
            {loading ? 'Saving…' : 'Save review'}
          </button>
        </div>
      </div>
    </form>
  )
}
