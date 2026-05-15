'use client'

import { useEffect, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'
import LocalizedLink from '../lib/i18n/LocalizedLink'
import { useT } from '../lib/i18n/TranslationProvider'
import { statusPill } from '../lib/statusPills'

export default function AdminInvoicePage({ quoteId }) {
  return (
    <AdminAuthGate>
      <AdminInvoiceInner quoteId={quoteId} />
    </AdminAuthGate>
  )
}

function fmt(amount) {
  return `$${Number(amount || 0).toFixed(2)}`
}

function AdminInvoiceInner({ quoteId }) {
  const t = useT()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch(`/admin/api/quotes/${quoteId}/invoice`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          if (data.ok) setInvoice(data.invoice)
          else setError(data.error || t('adminInvoice.failed'))
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) { setError(err.message); setLoading(false) }
      })
    return () => { cancelled = true }
  }, [quoteId, t])

  if (loading) return <div className='policy-card center-card' style={{ marginTop: 40 }}>{t('adminInvoice.loading')}</div>
  if (error) return <div className='notice notice-error' style={{ margin: 40 }}>{error}</div>
  if (!invoice) return null

  const { org, quote, customer, order, estimate, line_items, payments } = invoice
  const device = [quote.brand_name, quote.model_name].filter(Boolean).join(' ') || 'Device'
  const repairType = quote.repair_type_key
    ? quote.repair_type_key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : ''
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0)
  const balance = Math.max(Number(estimate?.total_amount || 0) - totalPaid, 0)

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .invoice-shell { box-shadow: none !important; border: none !important; max-width: 100% !important; }
        }
      `}</style>

      <div className='no-print' style={{ background: '#f5f5f5', padding: '16px 24px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <LocalizedLink href={`/admin/quotes/${quoteId}`} className='button button-secondary' style={{ fontSize: 13 }}>{t('adminInvoice.backToOrder')}</LocalizedLink>
        <button className='button' style={{ fontSize: 13 }} onClick={() => window.print()}>{t('adminInvoice.printOrSave')}</button>
      </div>

      <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '32px 24px' }}>
        <div className='invoice-shell' style={{ maxWidth: 700, margin: '0 auto', background: '#fff', borderRadius: 10, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ background: '#111', color: '#fff', padding: '28px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{org.name}</div>
              <div style={{ fontSize: 13, color: '#aaa', marginTop: 4 }}>{t('adminInvoice.receiptInvoice')}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {order?.order_number && <div style={{ fontSize: 18, fontWeight: 700 }}>#{order.order_number}</div>}
              <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{quote.quote_id}</div>
              {order?.created_at && (
                <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>
                  {new Date(order.created_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: '28px 36px' }}>

            {/* Billed to + Device */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', marginBottom: 6 }}>{t('adminInvoice.billedTo')}</div>
                {customer.name && <div style={{ fontWeight: 600, fontSize: 15 }}>{customer.name}</div>}
                {customer.email && <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>{customer.email}</div>}
                {customer.phone && <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>{customer.phone}</div>}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', marginBottom: 6 }}>{t('adminInvoice.deviceLabel')}</div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{device}</div>
                {repairType && <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>{repairType}</div>}
                {order?.current_status && (
                  <div style={{ fontSize: 12, color: '#777', marginTop: 4 }}>{t('adminInvoice.statusLabel', { label: statusPill(order.current_status, t).label })}</div>
                )}
              </div>
            </div>

            {/* Line items */}
            {line_items.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #111' }}>
                    <th style={{ textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', paddingBottom: 8 }}>{t('adminInvoice.descriptionCol')}</th>
                    <th style={{ textAlign: 'right', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', paddingBottom: 8 }}>{t('adminInvoice.qtyCol')}</th>
                    <th style={{ textAlign: 'right', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', paddingBottom: 8 }}>{t('adminInvoice.unitCol')}</th>
                    <th style={{ textAlign: 'right', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', paddingBottom: 8 }}>{t('adminInvoice.totalCol')}</th>
                  </tr>
                </thead>
                <tbody>
                  {line_items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '11px 0', fontSize: 14, color: '#111' }}>{item.description}</td>
                      <td style={{ padding: '11px 0', fontSize: 14, color: '#555', textAlign: 'right' }}>{item.quantity || 1}</td>
                      <td style={{ padding: '11px 0', fontSize: 14, color: '#555', textAlign: 'right' }}>{fmt(item.unit_price)}</td>
                      <td style={{ padding: '11px 0', fontSize: 14, fontWeight: 600, color: '#111', textAlign: 'right' }}>{fmt(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}

            {/* Totals */}
            {estimate && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, borderTop: '2px solid #111', paddingTop: 14, marginBottom: 28 }}>
                <div style={{ display: 'flex', gap: 48, fontSize: 14 }}>
                  <span style={{ color: '#555' }}>{t('adminInvoice.subtotal')}</span>
                  <span style={{ fontWeight: 600 }}>{fmt(estimate.total_amount)}</span>
                </div>
                {payments.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 48, fontSize: 14 }}>
                    <span style={{ color: '#555' }}>
                      {p.kind?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || t('adminInvoice.payment')}
                    </span>
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>−{fmt(p.amount)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 48, fontSize: 16, borderTop: '1px solid #e0e0e0', paddingTop: 10, marginTop: 4 }}>
                  <span style={{ fontWeight: 700 }}>{t('adminInvoice.balanceDue')}</span>
                  <span style={{ fontWeight: 700 }}>{fmt(balance)}</span>
                </div>
              </div>
            )}

            {/* Payments received */}
            {payments.length > 0 && (
              <div style={{ background: '#f8f8f8', borderRadius: 6, padding: '16px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', marginBottom: 10 }}>{t('adminInvoice.paymentsReceived')}</div>
                {payments.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#555', paddingBottom: 6 }}>
                    <span>
                      {p.kind?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || t('adminInvoice.payment')}
                      {p.provider && p.provider !== 'stripe' ? ` · ${p.provider}` : ''}
                    </span>
                    <span style={{ fontWeight: 600, color: '#111' }}>{fmt(p.amount)}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid #e0e0e0', marginTop: 6, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700 }}>
                  <span>{t('adminInvoice.totalPaid')}</span>
                  <span>{fmt(totalPaid)}</span>
                </div>
              </div>
            )}

            <div style={{ marginTop: 32, fontSize: 12, color: '#aaa', textAlign: 'center' }}>
              {t('adminInvoice.thankYou', { orgName: org.name })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
