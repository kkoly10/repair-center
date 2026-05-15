'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AdminAuthGate from './AdminAuthGate'
import QuoteStatusBadge from './QuoteStatusBadge'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT } from '../lib/i18n/TranslationProvider'
import { getSupabaseBrowser } from '../lib/supabase/browser'

const STATUS_KEYS = [
  { value: 'all', tKey: 'adminQuotes.statusOptionAll' },
  { value: 'submitted', tKey: 'adminQuotes.statusOptionSubmitted' },
  { value: 'under_review', tKey: 'adminQuotes.statusOptionUnderReview' },
  { value: 'estimate_sent', tKey: 'adminQuotes.statusOptionEstimateSent' },
  { value: 'awaiting_customer', tKey: 'adminQuotes.statusOptionAwaitingCustomer' },
  { value: 'approved_for_mail_in', tKey: 'adminQuotes.statusOptionApprovedForMailIn' },
  { value: 'declined', tKey: 'adminQuotes.statusOptionDeclined' },
  { value: 'archived', tKey: 'adminQuotes.statusOptionArchived' },
]

const PAGE_SIZE = 25

export default function AdminQuotesDashboard() {
  return (
    <AdminAuthGate>
      <AdminQuotesDashboardInner />
    </AdminAuthGate>
  )
}

function AdminQuotesDashboardInner() {
  const t = useT()
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeStatus = searchParams.get('status') || 'all'
  const [state, setState] = useState({ loading: true, error: '', items: [], stats: emptyStats(), totalCount: 0 })
  const [page, setPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const guestCustomer = t('adminQuotes.guestCustomer')
  const manualReview = t('adminQuotes.manualReview')

  const loadQuotes = useCallback(async (ignore = { current: false }) => {
    setState((current) => ({ ...current, loading: true, error: '' }))

    try {
      const supabase = getSupabaseBrowser()
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let queueQuery = supabase
        .from('quote_requests')
        .select('id, quote_id, first_name, last_name, guest_email, guest_phone, device_category, brand_name, model_name, repair_type_key, status, preliminary_price_fixed, preliminary_price_min, preliminary_price_max, quote_summary, created_at, reviewed_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (activeStatus !== 'all') {
        queueQuery = queueQuery.eq('status', activeStatus)
      }

      if (searchTerm) {
        queueQuery = queueQuery.or(`quote_id.ilike.%${searchTerm}%,guest_email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
      }

      const [{ data: items, error: itemsError, count }, { data: statuses, error: statusesError }] = await Promise.all([
        queueQuery,
        supabase.from('quote_requests').select('status').limit(5000),
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

      if (!ignore.current) {
        setState({
          loading: false,
          error: '',
          stats,
          totalCount: count || 0,
          items: (items || []).map((item) => ({
            ...item,
            customer_name: [item.first_name, item.last_name].filter(Boolean).join(' ') || guestCustomer,
            price_display: formatPrice(item, manualReview),
            photo_count: photoCountByRequestId[item.id] || 0,
          })),
        })
      }
    } catch (error) {
      if (!ignore.current) {
        setState({ loading: false, error: error.message || t('adminQuotes.errorGeneric'), items: [], stats: emptyStats(), totalCount: 0 })
      }
    }
  }, [activeStatus, page, searchTerm, guestCustomer, manualReview, t])

  useEffect(() => {
    const ignore = { current: false }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadQuotes(ignore)
    return () => { ignore.current = true }
  }, [loadQuotes])

  const activeLabel = useMemo(() => {
    const found = STATUS_KEYS.find((option) => option.value === activeStatus)
    return found ? t(found.tKey) : t('adminQuotes.statusOptionAll')
  }, [activeStatus, t])

  const totalPages = Math.max(1, Math.ceil(state.totalCount / PAGE_SIZE))

  const handleFilter = (status) => {
    setPage(0)
    router.replace(status === 'all' ? '/admin/quotes' : `/admin/quotes?status=${status}`)
  }

  const handleSearch = (event) => {
    event.preventDefault()
    setPage(0)
    setSearchTerm(searchInput.trim())
  }

  const clearSearch = () => {
    setSearchInput('')
    setSearchTerm('')
    setPage(0)
  }

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>{t('adminQuotes.kicker')}</div>
          <h1>{t('adminQuotes.heading')}</h1>
          <p>{t('adminQuotes.intro')}</p>
          <div style={{ marginTop: 8 }}>
            <LocalizedLink href='/admin/analytics' className='button button-secondary button-compact'>
              {t('adminQuotes.viewAnalytics')}
            </LocalizedLink>
          </div>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginTop: 14, marginBottom: 14 }}>
            <input
              type='text'
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t('adminQuotes.searchPlaceholder')}
              style={{ flex: 1 }}
            />
            <button type='submit' className='button button-primary button-compact'>{t('adminQuotes.searchAction')}</button>
            {searchTerm ? (
              <button type='button' className='button button-ghost button-compact' onClick={clearSearch}>{t('adminQuotes.clearAction')}</button>
            ) : null}
          </form>

          <div className='inline-actions'>
            {STATUS_KEYS.map((option) => (
              <button
                key={option.value}
                type='button'
                className={`button ${option.value === activeStatus ? 'button-primary' : 'button-secondary'} button-compact`}
                onClick={() => handleFilter(option.value)}
              >
                {t(option.tKey)}
              </button>
            ))}
          </div>
        </div>

        <div className='grid-4'>
          {STATUS_KEYS.map((option) => (
            <div key={option.value} className='feature-card'>
              <div className='kicker'>{t(option.tKey)}</div>
              <h3>{state.stats[option.value] || 0}</h3>
            </div>
          ))}
        </div>

        <div className='list-card'>
          <div className='section-head' style={{ marginBottom: 0 }}>
            <div>
              <div className='kicker'>{t('adminQuotes.queueKicker')}</div>
              <h3 style={{ marginBottom: 8 }}>
                {activeLabel}
                {searchTerm ? t('adminQuotes.queueSearchMatch', { search: searchTerm }) : ''}
              </h3>
              <p className='muted'>
                {t('adminQuotes.queueSubtitle', { shown: state.items.length, total: state.totalCount, page: page + 1, totalPages })}
              </p>
            </div>
          </div>
        </div>

        {state.error ? <div className='notice'>{state.error}</div> : null}
        {state.loading ? <div className='policy-card'>{t('adminQuotes.loading')}</div> : null}

        {!state.loading && !state.items.length ? (
          <div className='policy-card'>{searchTerm ? t('adminQuotes.noMatchWithSearch') : t('adminQuotes.noMatchNoSearch')}</div>
        ) : null}

        {!state.loading && state.items.length ? (
          <div className='page-stack'>
            {state.items.map((item) => (
              <LocalizedLink key={item.id} href={`/admin/quotes/${item.quote_id}`} className='quote-card'>
                <div className='quote-top'>
                  <div>
                    <div className='quote-id'>{item.quote_id}</div>
                    <h2 className='quote-title'>{item.customer_name}</h2>
                  </div>
                  <QuoteStatusBadge status={item.status} />
                </div>

                <div className='quote-summary'>
                  <div className='quote-summary-card'>
                    <strong>{t('adminQuotes.deviceHeader')}</strong>
                    <span>{[item.brand_name, item.model_name].filter(Boolean).join(' ') || t('adminQuotes.deviceUnknown')}</span>
                  </div>
                  <div className='quote-summary-card'>
                    <strong>{t('adminQuotes.repairHeader')}</strong>
                    <span>{item.repair_type_key || t('adminQuotes.repairNotSet')}</span>
                  </div>
                  <div className='quote-summary-card'>
                    <strong>{t('adminQuotes.estimateLabel')}</strong>
                    <span>{item.price_display}</span>
                  </div>
                </div>

                <div className='preview-meta'>
                  <div className='preview-meta-row'>
                    <span>{t('adminQuotes.submittedHeader')}</span>
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                  <div className='preview-meta-row'>
                    <span>{t('adminQuotes.photosAttached')}</span>
                    <span>{item.photo_count}</span>
                  </div>
                  <div className='preview-meta-row'>
                    <span>{t('adminQuotes.emailLabel')}</span>
                    <span>{item.guest_email || '—'}</span>
                  </div>
                </div>
              </LocalizedLink>
            ))}

            {totalPages > 1 ? (
              <div className='inline-actions' style={{ justifyContent: 'center' }}>
                <button
                  type='button'
                  className='button button-secondary button-compact'
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  {t('adminQuotes.previous')}
                </button>
                <span style={{ display: 'inline-flex', alignItems: 'center', fontWeight: 700, fontSize: '0.92rem' }}>
                  {t('adminQuotes.pageOf', { page: page + 1, totalPages })}
                </span>
                <button
                  type='button'
                  className='button button-secondary button-compact'
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('adminQuotes.next')}
                </button>
              </div>
            ) : null}
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

function formatPrice(item, manualReviewLabel) {
  if (item.preliminary_price_fixed != null) return `$${Number(item.preliminary_price_fixed).toFixed(2)}`
  if (item.preliminary_price_min != null && item.preliminary_price_max != null) {
    return `$${Number(item.preliminary_price_min).toFixed(2)}–$${Number(item.preliminary_price_max).toFixed(2)}`
  }
  return manualReviewLabel
}
