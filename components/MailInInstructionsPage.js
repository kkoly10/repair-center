'use client'

import { useState } from 'react'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT } from '../lib/i18n/TranslationProvider'

export default function MailInInstructionsPage({ quoteId, orgSlug, tok }) {
  const t = useT()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [record, setRecord] = useState(null)

  const handleVerify = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/mail-in/${quoteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...(orgSlug ? { orgSlug } : {}), ...(tok ? { tok } : {}) }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || t('mailIn.unableToLoad'))
      setRecord(result)
    } catch (verifyError) {
      setRecord(null)
      setError(verifyError.message || t('mailIn.unableToLoad'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>{t('mailIn.mailInKicker')}</div>
          <h1>{t('mailIn.mailInTitleAlt')}</h1>
          <p>{t('mailIn.mailInIntro')}</p>
        </div>

        <div className='grid-2'>
          <form className='policy-card' onSubmit={handleVerify}>
            <div className='kicker'>{t('mailIn.verifyKicker')}</div>
            <h3>{t('mailIn.verifyTitle')}</h3>
            <div className='field' style={{ marginTop: 18 }}>
              <label htmlFor='mail-in-email'>{t('mailIn.emailLabel')}</label>
              <input
                id='mail-in-email'
                type='email'
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t('mailIn.emailPlaceholder')}
                required
              />
            </div>

            {error ? <div className='notice' style={{ marginTop: 18 }}>{error}</div> : null}

            <div className='inline-actions'>
              <button type='submit' className='button button-primary' disabled={loading}>
                {loading ? t('mailIn.verifyingBtn') : t('mailIn.viewInstructionsBtn')}
              </button>
            </div>
          </form>

          <div className='policy-card'>
            <div className='kicker'>{t('mailIn.beforeYouShipKicker')}</div>
            <h3>{t('mailIn.beforeYouShipTitle')}</h3>
            <p>{t('mailIn.beforeYouShipText')}</p>
          </div>
        </div>

        {record ? (
          <div className='page-stack'>
            <div className='quote-card'>
              <div className='quote-top'>
                <div>
                  <div className='quote-id'>{record.quote.quote_id}</div>
                  <h2 className='quote-title'>
                    {[record.quote.brand_name, record.quote.model_name].filter(Boolean).join(' ')}
                  </h2>
                  <p className='muted'>{record.quote.repair_type_key || t('mailIn.noRepairType')}</p>
                </div>
                <span className='price-chip'>
                  {record.order.order_number || t('mailIn.awaitingIntake')}
                </span>
              </div>

              <div className='quote-summary'>
                <div className='quote-summary-card'>
                  <strong>{t('mailIn.orderNumberLabel')}</strong>
                  <span>{record.order.order_number || t('mailIn.willBeAssigned')}</span>
                </div>
                <div className='quote-summary-card'>
                  <strong>{t('mailIn.estimateTotalLabel')}</strong>
                  <span>${Number(record.estimate.total_amount || 0).toFixed(2)}</span>
                </div>
                <div className='quote-summary-card'>
                  <strong>{t('mailIn.inspectionDepositLabel')}</strong>
                  <span>${Number(record.order.inspection_deposit_required || 0).toFixed(2)}</span>
                </div>
              </div>

              {Number(record.order.inspection_deposit_required || 0) > 0 && !record.order.inspection_deposit_paid_at ? (
                <div className='notice notice-warn' style={{ marginTop: 14 }}>
                  <strong style={{ display: 'block', marginBottom: 8, color: 'var(--text)' }}>
                    {t('mailIn.depositRequiredTitle')}
                  </strong>
                  {record.paymentMode === 'manual' ? (
                    <>
                      <span style={{ display: 'block', marginBottom: 8 }}>
                        {t('mailIn.inspectionDepositAmount', { amount: Number(record.order.inspection_deposit_required).toFixed(2) })}
                      </span>
                      {record.manualPaymentInstructions ? (
                        <span style={{ display: 'block', whiteSpace: 'pre-line' }}>
                          {record.manualPaymentInstructions}
                        </span>
                      ) : (
                        <span>{t('mailIn.contactShopText')}</span>
                      )}
                    </>
                  ) : (
                    <>
                      {t('mailIn.payBeforeShipping')}
                      <div className='inline-actions' style={{ marginBottom: 0 }}>
                        <LocalizedLink href={`/pay/${record.quote.quote_id}`} className='button button-primary'>
                          {t('mailIn.payInspectionDepositBtn')}
                        </LocalizedLink>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>

            <div className='grid-2'>
              <div className='page-stack'>
                <div className='policy-card'>
                  <div className='kicker'>{t('mailIn.shipToKicker')}</div>
                  <h3>{record.instructions.businessName}</h3>
                  <p>
                    {record.instructions.receivingAddress.line1}
                    {record.instructions.receivingAddress.line2 ? (
                      <><br />{record.instructions.receivingAddress.line2}</>
                    ) : null}
                    <br />
                    {record.instructions.receivingAddress.city},{' '}
                    {record.instructions.receivingAddress.state}{' '}
                    {record.instructions.receivingAddress.postalCode}
                  </p>
                </div>

                <div className='policy-card'>
                  <div className='kicker'>{t('mailIn.packingChecklistKicker')}</div>
                  <h3>{t('mailIn.packingChecklistTitle')}</h3>
                  <ul>
                    {record.instructions.packingChecklist.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className='page-stack'>
                <div className='policy-card'>
                  <div className='kicker'>{t('mailIn.shippingNotesKicker')}</div>
                  <h3>{t('mailIn.shippingNotesTitle')}</h3>
                  <ul>
                    {record.instructions.shippingNotes.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className='policy-card'>
                  <div className='kicker'>{t('mailIn.supportKicker')}</div>
                  <h3>{t('mailIn.supportTitle')}</h3>
                  <div className='preview-meta' style={{ marginTop: 18 }}>
                    <div className='preview-meta-row'>
                      <span>{t('mailIn.emailLabel')}</span>
                      <span>{record.instructions.supportEmail}</span>
                    </div>
                    <div className='preview-meta-row'>
                      <span>{t('mailIn.phoneLabel')}</span>
                      <span>{record.instructions.supportPhone}</span>
                    </div>
                    <div className='preview-meta-row'>
                      <span>{t('mailIn.turnaroundLabel')}</span>
                      <span>{record.estimate.turnaround_note || t('mailIn.turnaroundAfterIntake')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  )
}
