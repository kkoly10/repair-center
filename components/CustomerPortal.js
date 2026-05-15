'use client'

import { useState } from 'react'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT } from '../lib/i18n/TranslationProvider'
import QuoteStatusBadge from './QuoteStatusBadge'

export default function CustomerPortal() {
  const t = useT()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError('')
    setData(null)

    try {
      const response = await fetch('/api/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const result = await response.json()

      if (!result.ok) {
        setError(result.error || t('customerPortal.errorGeneric'))
        return
      }

      setData(result)
    } catch {
      setError(t('customerPortal.errorConnect'))
    } finally {
      setLoading(false)
    }
  }

  const ordersByQuote = {}
  if (data) {
    for (const order of data.repairOrders) {
      ordersByQuote[order.quote_request_id] = order
    }
  }

  const totalSpent =
    data?.payments
      ?.filter((p) => p.status === 'succeeded' || p.status === 'paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0) || 0

  const activeStatuses = new Set([
    'awaiting_mail_in',
    'in_transit_to_shop',
    'received',
    'inspection',
    'awaiting_final_approval',
    'approved',
    'waiting_parts',
    'repairing',
    'testing',
    'awaiting_balance_payment',
    'ready_to_ship',
  ])

  const activeRepairs = data
    ? data.repairOrders.filter((o) => activeStatuses.has(o.current_status)).length
    : 0

  function formatDate(dateStr) {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function formatPrice(quote) {
    if (quote.preliminary_price_fixed) {
      return `$${(quote.preliminary_price_fixed / 100).toFixed(2)}`
    }
    if (quote.preliminary_price_min && quote.preliminary_price_max) {
      return `$${(quote.preliminary_price_min / 100).toFixed(2)} - $${(quote.preliminary_price_max / 100).toFixed(2)}`
    }
    if (quote.preliminary_price_min) {
      return `${t('customerPortal.fromPrefix')} $${(quote.preliminary_price_min / 100).toFixed(2)}`
    }
    return null
  }

  return (
    <div className='site-shell'>
      <section className='page-hero'>
        <p className='kicker'>{t('customerPortal.kicker')}</p>
        <h1>{t('customerPortal.title')}</h1>
        <p className='muted'>{t('customerPortal.subtitle')}</p>
      </section>

      <div className='page-stack'>
        {!data && (
          <div className='info-card'>
            <form onSubmit={handleSubmit}>
              <label
                htmlFor='portal-email'
                style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
              >
                {t('customerPortal.emailLabel')}
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <input
                  id='portal-email'
                  type='email'
                  placeholder={t('customerPortal.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    flex: '1 1 260px',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    fontSize: '1rem',
                  }}
                />
                <button
                  type='submit'
                  className='button button-primary'
                  disabled={loading}
                >
                  {loading ? t('customerPortal.looking') : t('customerPortal.lookUp')}
                </button>
              </div>
            </form>

            {error && (
              <div className='notice' style={{ marginTop: '1rem' }}>
                {error}
              </div>
            )}
          </div>
        )}

        {data && (
          <>
            <div className='info-card'>
              <p style={{ margin: 0 }}>
                {t('customerPortal.welcomeBack')} <strong>{data.customer.name}</strong>
              </p>
              <p className='muted' style={{ margin: '0.25rem 0 0' }}>
                {data.customer.email}
                {data.customer.phone ? ` · ${data.customer.phone}` : ''}
              </p>
              <button
                className='button'
                style={{ marginTop: '0.75rem' }}
                onClick={() => {
                  setData(null)
                  setEmail('')
                  setError('')
                }}
              >
                {t('customerPortal.lookUpDifferent')}
              </button>
            </div>

            <div className='grid-4'>
              <div className='feature-card'>
                <p className='kicker'>{t('customerPortal.statTotalRepairs')}</p>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>
                  {data.quotes.length}
                </p>
              </div>
              <div className='feature-card'>
                <p className='kicker'>{t('customerPortal.statActiveRepairs')}</p>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>
                  {activeRepairs}
                </p>
              </div>
              <div className='feature-card'>
                <p className='kicker'>{t('customerPortal.statTotalSpent')}</p>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>
                  ${(totalSpent / 100).toFixed(2)}
                </p>
              </div>
            </div>

            <section>
              <h2>{t('customerPortal.historyTitle')}</h2>
              {data.quotes.length === 0 && (
                <p className='muted'>{t('customerPortal.historyEmpty')}</p>
              )}
              {data.quotes.map((quote) => {
                const order = ordersByQuote[quote.id]
                const price = formatPrice(quote)
                return (
                  <div className='quote-card' key={quote.id}>
                    <div className='quote-top'>
                      <span className='quote-id'>{quote.quote_id}</span>
                      <QuoteStatusBadge status={order?.current_status || quote.status} />
                    </div>
                    <div className='preview-meta'>
                      <div className='preview-meta-row'>
                        <span>
                          {quote.model_name} &mdash; {quote.repair_type_key?.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </span>
                      </div>
                      <div className='preview-meta-row'>
                        <span className='muted'>
                          {t('customerPortal.submittedLabel')} {formatDate(quote.created_at)}
                        </span>
                        {price && (
                          <span style={{ fontWeight: 600 }}>{price}</span>
                        )}
                      </div>
                    </div>
                    <div className='inline-actions'>
                      <LocalizedLink
                        href={`/track/${quote.quote_id}`}
                        className='button button-primary'
                      >
                        {t('customerPortal.trackRepair')}
                      </LocalizedLink>
                    </div>
                  </div>
                )
              })}
            </section>

            {data.payments.length > 0 && (
              <section>
                <h2>{t('customerPortal.paymentsTitle')}</h2>
                {data.payments.map((payment) => (
                  <div className='preview-card' key={payment.id}>
                    <div className='preview-meta'>
                      <div className='preview-meta-row'>
                        <span style={{ fontWeight: 600 }}>
                          ${(payment.amount / 100).toFixed(2)}
                        </span>
                        <QuoteStatusBadge status={payment.status} />
                      </div>
                      <div className='preview-meta-row'>
                        <span className='muted'>
                          {payment.payment_type
                            ?.split('_')
                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(' ')}
                        </span>
                        <span className='muted'>
                          {formatDate(payment.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
