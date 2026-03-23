'use client'

import { useState } from 'react'

export default function MailInInstructionsPage({ quoteId }) {
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to load mail-in instructions.')

      setRecord(result)
    } catch (verifyError) {
      setRecord(null)
      setError(verifyError.message || 'Unable to load mail-in instructions.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>
        <div className='info-card'>
          <div className='kicker'>Mail-in instructions</div>
          <h1>Prepare and ship your device</h1>
          <p>
            Once your estimate is approved, use this page to confirm your order,
            review packaging guidance, and ship the device safely.
          </p>
        </div>

        <div className='grid-2'>
          <form className='policy-card' onSubmit={handleVerify}>
            <div className='kicker'>Verify request</div>
            <h3>Enter your email</h3>
            <div className='field' style={{ marginTop: 18 }}>
              <label htmlFor='mail-in-email'>Email address</label>
              <input
                id='mail-in-email'
                type='email'
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder='name@example.com'
                required
              />
            </div>

            {error ? <div className='notice' style={{ marginTop: 18 }}>{error}</div> : null}

            <div className='inline-actions'>
              <button type='submit' className='button button-primary' disabled={loading}>
                {loading ? 'Verifying…' : 'View Instructions'}
              </button>
            </div>
          </form>

          <div className='policy-card'>
            <div className='kicker'>Before you ship</div>
            <h3>What to expect</h3>
            <p>
              After the device arrives, it will be checked into intake, inspected,
              and moved through the tracked repair workflow in your order record.
            </p>
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
                  <p className='muted'>{record.quote.repair_type_key || 'Repair type not set'}</p>
                </div>
                <span className='price-chip'>
                  {record.order.order_number || 'Awaiting intake'}
                </span>
              </div>

              <div className='quote-summary'>
                <div className='quote-summary-card'>
                  <strong>Order number</strong>
                  <span>{record.order.order_number || 'Will be assigned at intake'}</span>
                </div>
                <div className='quote-summary-card'>
                  <strong>Estimate total</strong>
                  <span>${Number(record.estimate.total_amount || 0).toFixed(2)}</span>
                </div>
                <div className='quote-summary-card'>
                  <strong>Inspection deposit</strong>
                  <span>${Number(record.order.inspection_deposit_required || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className='grid-2'>
              <div className='page-stack'>
                <div className='policy-card'>
                  <div className='kicker'>Ship to</div>
                  <h3>{record.instructions.businessName}</h3>
                  <p>
                    {record.instructions.receivingAddress.line1}
                    <br />
                    {record.instructions.receivingAddress.line2}
                    <br />
                    {record.instructions.receivingAddress.city},{' '}
                    {record.instructions.receivingAddress.state}{' '}
                    {record.instructions.receivingAddress.postalCode}
                  </p>
                </div>

                <div className='policy-card'>
                  <div className='kicker'>Packing checklist</div>
                  <h3>Before sealing the box</h3>
                  <ul>
                    {record.instructions.packingChecklist.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className='page-stack'>
                <div className='policy-card'>
                  <div className='kicker'>Shipping notes</div>
                  <h3>Recommended shipping practices</h3>
                  <ul>
                    {record.instructions.shippingNotes.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className='policy-card'>
                  <div className='kicker'>Support</div>
                  <h3>Need help before shipping?</h3>
                  <div className='preview-meta' style={{ marginTop: 18 }}>
                    <div className='preview-meta-row'>
                      <span>Email</span>
                      <span>{record.instructions.supportEmail}</span>
                    </div>
                    <div className='preview-meta-row'>
                      <span>Phone</span>
                      <span>{record.instructions.supportPhone}</span>
                    </div>
                    <div className='preview-meta-row'>
                      <span>Turnaround</span>
                      <span>{record.estimate.turnaround_note || 'After intake review'}</span>
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
