import CustomerSignOutButton from './CustomerSignOutButton'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { statusPill } from '../lib/statusPills'
import { getT } from '../lib/i18n/server'

function fmtDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default async function CustomerAccountPage({ customer, quotes, appointments = [], orgSlug }) {
  const t = await getT()
  const name = [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.email

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>

        <div className='info-card'>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className='kicker'>{t('customerAccount.accountKicker')}</div>
              <h1>{name}</h1>
              {customer.email ? (
                <p style={{ margin: 0, color: 'var(--muted)' }}>{customer.email}</p>
              ) : null}
            </div>
            <div style={{ alignSelf: 'flex-start', paddingTop: 4 }}>
              <CustomerSignOutButton orgSlug={orgSlug} />
            </div>
          </div>
        </div>

        <div className='policy-card'>
          <div className='kicker'>{t('customerAccount.repairHistoryKicker')}</div>
          <h3>{t('customerAccount.yourRepairs')}</h3>

          {quotes.length === 0 ? (
            <div style={{ marginTop: 16 }}>
              <p style={{ color: 'var(--muted)' }}>{t('customerAccount.noRepairsBody')}</p>
              <div className='inline-actions' style={{ marginTop: 16 }}>
                <LocalizedLink href={`/shop/${orgSlug}/estimate`} className='button button-primary'>
                  {t('customerAccount.startFreeEstimate')}
                </LocalizedLink>
              </div>
            </div>
          ) : (
            <div className='preview-meta' style={{ marginTop: 18 }}>
              {quotes.map((q) => {
                const device = [q.brand_name, q.model_name].filter(Boolean).join(' ') || t('customerAccount.defaultDevice')
                const rawStatus = q.order_status || q.quote_status
                const { cls, label } = statusPill(rawStatus)

                return (
                  <div key={q.quote_id} className='preview-meta-row'>
                    <span>
                      <LocalizedLink
                        href={`/shop/${orgSlug}/track/${q.quote_id}`}
                        style={{ fontWeight: 600 }}
                        className='id-mono'
                      >
                        {q.quote_id}
                      </LocalizedLink>
                      {' — '}
                      {device}
                      {q.repair_type_key ? ` · ${q.repair_type_key}` : ''}
                      {' '}
                      <span className={cls}>{label}</span>
                    </span>
                    <span style={{ whiteSpace: 'nowrap', color: 'var(--muted)', fontSize: '0.875rem' }}>
                      {new Date(q.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {appointments.length > 0 && (
          <div className='policy-card'>
            <div className='kicker'>{t('customerAccount.appointmentsKicker')}</div>
            <h3>{t('customerAccount.appointmentsHeading')}</h3>
            <div className='preview-meta' style={{ marginTop: 18 }}>
              {appointments.map((a) => {
                const device = [a.brand_name, a.model_name].filter(Boolean).join(' ') || null
                const { cls, label } = statusPill(a.status)
                return (
                  <div key={a.id} className='preview-meta-row'>
                    <span>
                      <span className={cls}>{label}</span>
                      {' '}
                      {device && <span>{device}</span>}
                      {a.repair_description && (
                        <span style={{ color: 'var(--muted)', fontSize: '0.85rem', marginLeft: 6 }}>
                          — {a.repair_description.slice(0, 60)}{a.repair_description.length > 60 ? '…' : ''}
                        </span>
                      )}
                    </span>
                    <span style={{ whiteSpace: 'nowrap', color: 'var(--muted)', fontSize: '0.875rem' }}>
                      {fmtDateTime(a.preferred_at)}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className='inline-actions' style={{ marginTop: 16 }}>
              <LocalizedLink href={`/shop/${orgSlug}/book`} className='button button-secondary'>
                {t('customerAccount.bookAnother')}
              </LocalizedLink>
            </div>
          </div>
        )}

        <div className='policy-card'>
          <div className='kicker'>{t('customerAccount.trackKicker')}</div>
          <h3>{t('customerAccount.trackHeading')}</h3>
          <p>{t('customerAccount.trackBody')}</p>
          <div className='inline-actions' style={{ marginTop: 16 }}>
            <LocalizedLink href={`/shop/${orgSlug}/track`} className='button button-secondary'>
              {t('customerAccount.trackButton')}
            </LocalizedLink>
          </div>
        </div>

      </div>
    </main>
  )
}
