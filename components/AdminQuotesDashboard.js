'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AdminAuthGate from './AdminAuthGate'
import QuoteStatusBadge from './QuoteStatusBadge'
import { getSupabaseBrowser } from '../lib/supabase/browser'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All requests' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'estimate_sent', label: 'Estimate sent' },
  { value: 'awaiting_customer', label: 'Awaiting customer' },
  { value: 'approved_for_mail_in', label: 'Approved for mail-in' },
  { value: 'declined', label: 'Declined' },
  { value: 'archived', label: 'Archived' },
]

export default function AdminQuotesDashboard() {
  return (
    <AdminAuthGate>
      <AdminQuotesDashboardInner />
    </AdminAuthGate>
  )
}

function AdminQuotesDashboardInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeStatus = searchParams.get('status') || 'all'
  const [state, setState] = useState({ loading: true, error: '', items: [], stats: emptyStats() })

  useEffect(() => {
    let ignore = false

    async function loadQuotes() {
      setState((current) => ({ ...current, loading: true, error: '' }))

      try {
        const supabase = getSupabaseBrowser()

        let queueQuery = supabase
          .from('quote_requests')
          .select('id, quote_id, first_name, last_name, guest_email, guest_phone, device_category, brand_name, model_name, repair_type_key, status, preliminary_price_fixed, preliminary_price_min, preliminary_price_max, quote_summary, created_at, reviewed_at')
          .order('created_at', { ascending: false })
          .limit(100)

        if (activeStatus !== 'all') {
          queueQuery = queueQuery.eq('status', activeStatus)
        }

        const [{ data: items, error: itemsError }, { data: statuses, error: statusesError }] = await Promise.all([
          queueQuery,
          supabase.from('quote_requests').select('id, status'),
        ])

        if (itemsError) throw itemsError
        if (statusesError) throw statusesError

        const requestIds = (items || []).map((item) => item.id)
        let photoRows = []

        if (requestIds.length) {
          const { data, error } = await supabase
            .from('quote_request_photos')
            .select('quote_request_id')
            .in('quote_request_id', requestIds)

          if (error) throw error
          photoRows = data || []
        }

        const photoCountByRequestId = photoRows.reduce((accumulator, row) => {
          accumulator[row.quote_request_id] = (accumulator[row.quote_request_id] || 0) + 1
          return accumulator
        }, {})

        const stats = buildStats(statuses || [])

        if (!ignore) {
          setState({
            loading: false,
            error: '',
            stats,
            items: (items || []).map((item) => ({
              ...item,
              customer_name: [item.first_name, item.last_name].filter(Boolean).join(' ') || 'Guest customer',
              price_display: formatPrice(item),
              photo_count: photoCountByRequestId[item.id] || 0,
            })),
          })
        }
      } catch (error) {
        if (!ignore) {
          setState({ loading: false, error: error.message || 'Unable to load quotes.', items: [], stats: emptyStats() })
        }
      }
    }

    loadQuotes()
    return () => {
      ignore = true
    }
  }, [activeStatus])

  const activeLabel = useMemo(() => STATUS_OPTIONS.find((option) => option.value === activeStatus)?.label || 'All requests', [activeStatus])

  const handleFilter = (status) => {
    router.replace(status === 'all' ? '/admin/quotes' : `/admin/quotes?status=${status}`)
  }

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>Admin workspace</div>
          <h1>Quote review dashboard</h1>
          <p>
            Review incoming estimate requests, open each quote record, and move the customer toward estimate sent,
            approval, or decline.
          </p>
          <div className='inline-actions'>
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type='button'
                className={`button ${option.value === activeStatus ? 'button-primary' : 'button-secondary'} button-compact`}
                onClick={() => handleFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className='grid-4'>
          {STATUS_OPTIONS.map((option) => (
            <div key={option.value} className='feature-card'>
              <div className='kicker'>{option.label}</div>
              <h3>{state.stats[option.value] || 0}</h3>
              <p>Requests currently in this stage.</p>
            </div>
          ))}
        </div>

        <div className='list-card'>
          <div className='section-head' style={{ marginBottom: 0 }}>
            <div>
              <div className='kicker'>Queue</div>
              <h3 style={{ marginBottom: 8 }}>{activeLabel}</h3>
              <p className='muted'>Newest quote requests first.</p>
            </div>
          </div>
        </div>

        {state.error ? <div className='notice'>{state.error}</div> : null}
        {state.loading ? <div className='policy-card'>Loading quote requests…</div> : null}

        {!state.loading && !state.items.length ? (
          <div className='policy-card'>No quote requests match this status yet.</div>
        ) : null}

        {!state.loading && state.items.length ? (
          <div className='page-stack'>
            {state.items.map((item) => (
              <Link key={item.id} href={`/admin/quotes/${item.quote_id}`} className='quote-card'>
                <div className='quote-top'>
                  <div>
                    <div className='quote-id'>{item.quote_id}</div>
                    <h2 className='quote-title'>{item.customer_name}</h2>
                  </div>
                  <QuoteStatusBadge status={item.status} />
                </div>

                <div className='quote-summary'>
                  <div className='quote-summary-card'>
                    <strong>Device</strong>
                    <span>{[item.brand_name, item.model_name].filter(Boolean).join(' ') || 'Unknown device'}</span>
                  </div>
                  <div className='quote-summary-card'>
                    <strong>Repair</strong>
                    <span>{item.repair_type_key || 'Not set'}</span>
                  </div>
                  <div className='quote-summary-card'>
                    <strong>Estimate</strong>
                    <span>{item.price_display}</span>
                  </div>
                </div>

                <div className='preview-meta'>
                  <div className='preview-meta-row'>
                    <span>Submitted</span>
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                  <div className='preview-meta-row'>
                    <span>Photos attached</span>
                    <span>{item.photo_count}</span>
                  </div>
                  <div className='preview-meta-row'>
                    <span>Email</span>
                    <span>{item.guest_email || '—'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  )
}

function emptyStats() {
  return {
    all: 0,
    submitted: 0,
    under_review: 0,
    estimate_sent: 0,
    awaiting_customer: 0,
    approved_for_mail_in: 0,
    declined: 0,
    archived: 0,
  }
}

function buildStats(rows) {
  const stats = emptyStats()
  stats.all = rows.length

  for (const row of rows) {
    if (row.status in stats) stats[row.status] += 1
  }

  return stats
}

function formatPrice(item) {
  if (item.preliminary_price_fixed != null) return `$${Number(item.preliminary_price_fixed).toFixed(2)}`
  if (item.preliminary_price_min != null && item.preliminary_price_max != null) {
    return `$${Number(item.preliminary_price_min).toFixed(2)}–$${Number(item.preliminary_price_max).toFixed(2)}`
  }
  return 'Manual review'
}
