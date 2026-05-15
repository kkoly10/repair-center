'use client'

import { useEffect, useState } from 'react'
import { useT } from '../../lib/i18n/TranslationProvider'

export default function OrderPartsSection({ orderId }) {
  const t = useT()
  const [partsUsed, setPartsUsed] = useState([])
  const [partsTotalCost, setPartsTotalCost] = useState(0)
  const [partsLoading, setPartsLoading] = useState(true)
  const [partsError, setPartsError] = useState('')
  const [availableParts, setAvailableParts] = useState([])
  const [addPartId, setAddPartId] = useState('')
  const [addPartQty, setAddPartQty] = useState('1')
  const [addPartNotes, setAddPartNotes] = useState('')
  const [addPartSaving, setAddPartSaving] = useState(false)
  const [addPartError, setAddPartError] = useState('')

  useEffect(() => {
    if (!orderId) return
    let ignore = false

    Promise.all([
      fetch(`/admin/api/orders/${orderId}/parts`, { cache: 'no-store' }),
      fetch('/admin/api/parts', { cache: 'no-store' }),
    ])
      .then(async ([usageRes, catalogRes]) => {
        const usageJson = await usageRes.json()
        const catalogJson = await catalogRes.json()
        if (!ignore) {
          if (usageRes.ok) {
            setPartsUsed(usageJson.partsUsed || [])
            setPartsTotalCost(usageJson.totalPartsCost || 0)
          }
          if (catalogRes.ok) {
            setAvailableParts((catalogJson.parts || []).filter((p) => p.active))
          }
        }
      })
      .catch(() => {})
      .finally(() => { if (!ignore) setPartsLoading(false) })

    return () => { ignore = true }
  }, [orderId])

  const reloadUsage = async () => {
    const res = await fetch(`/admin/api/orders/${orderId}/parts`, { cache: 'no-store' })
    const json = await res.json()
    if (res.ok) {
      setPartsUsed(json.partsUsed || [])
      setPartsTotalCost(json.totalPartsCost || 0)
    }
  }

  const handleAddPart = async (e) => {
    e.preventDefault()
    if (!addPartId) return
    setAddPartSaving(true)
    setAddPartError('')
    try {
      const res = await fetch(`/admin/api/orders/${orderId}/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          part_id: addPartId,
          quantity_used: Number(addPartQty) || 1,
          notes: addPartNotes.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || t('adminRepairOrder.partsErrorAdd'))
      await reloadUsage()
      setAddPartId('')
      setAddPartQty('1')
      setAddPartNotes('')
    } catch (err) {
      setAddPartError(err.message || t('adminRepairOrder.partsErrorAdd'))
    } finally {
      setAddPartSaving(false)
    }
  }

  const handleRemovePart = async (usageId) => {
    setPartsError('')
    try {
      const res = await fetch(`/admin/api/orders/${orderId}/parts?usageId=${usageId}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setPartsError(json.error || t('adminRepairOrder.partsErrorRemove'))
        return
      }
      await reloadUsage()
    } catch (err) {
      setPartsError(err.message || t('adminRepairOrder.partsErrorRemove'))
    }
  }

  return (
    <div className='policy-card'>
      <div className='kicker'>{t('adminRepairOrder.partsKicker')}</div>
      <h3>{t('adminRepairOrder.partsHeading')}</h3>

      {partsLoading ? (
        <p className='muted' style={{ marginTop: 12 }}>{t('adminRepairOrder.partsLoading')}</p>
      ) : (
        <>
          {partsUsed.length > 0 ? (
            <div style={{ overflowX: 'auto', marginTop: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {[t('adminRepairOrder.partsColPart'), t('adminRepairOrder.partsColQty'), t('adminRepairOrder.partsColCostEach'), t('adminRepairOrder.partsColTotal'), ''].map((h, i) => (
                      <th key={i} style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {partsUsed.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                        <span style={{ fontWeight: 600 }}>{row.part_name}</span>
                        {row.part_sku && <span className='muted' style={{ fontSize: '0.78rem', marginLeft: 6 }}>{row.part_sku}</span>}
                        {row.notes && <div className='muted' style={{ fontSize: '0.78rem' }}>{row.notes}</div>}
                      </td>
                      <td style={{ padding: '8px', verticalAlign: 'middle' }}>{row.quantity_used}</td>
                      <td style={{ padding: '8px', verticalAlign: 'middle' }}>${Number(row.cost_at_use).toFixed(2)}</td>
                      <td style={{ padding: '8px', verticalAlign: 'middle', fontWeight: 600 }}>${Number(row.total_cost).toFixed(2)}</td>
                      <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                        <button
                          className='button button-secondary button-compact'
                          style={{ fontSize: '0.78rem' }}
                          onClick={() => handleRemovePart(row.id)}
                        >
                          {t('adminRepairOrder.partsRemove')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 10, textAlign: 'right', fontWeight: 700, fontSize: '0.9rem' }}>
                {t('adminRepairOrder.partsTotal', { amount: Number(partsTotalCost).toFixed(2) })}
              </div>
            </div>
          ) : (
            <p className='muted' style={{ marginTop: 12 }}>{t('adminRepairOrder.partsNoneRecorded')}</p>
          )}

          {partsError && <p className='notice' style={{ marginTop: 8 }}>{partsError}</p>}

          {availableParts.length > 0 && (
            <form onSubmit={handleAddPart} style={{ marginTop: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'end' }}>
                <div>
                  <label className='label' style={{ fontSize: '0.82rem' }}>{t('adminRepairOrder.partsAddPart')}</label>
                  <select className='input' value={addPartId} onChange={(e) => setAddPartId(e.target.value)} required>
                    <option value=''>{t('adminRepairOrder.partsSelectPart')}</option>
                    {availableParts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.sku ? ` (${p.sku})` : ''} — ${Number(p.cost_price).toFixed(2)} · {t('adminRepairOrder.partsInStock', { count: String(p.quantity_on_hand) })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className='label' style={{ fontSize: '0.82rem' }}>{t('adminRepairOrder.partsQtyLabel')}</label>
                  <input
                    className='input'
                    type='number'
                    min='1'
                    step='1'
                    style={{ width: 64 }}
                    value={addPartQty}
                    onChange={(e) => setAddPartQty(e.target.value)}
                  />
                </div>
                <button
                  className='button button-compact'
                  type='submit'
                  disabled={addPartSaving || !addPartId}
                  style={{ alignSelf: 'flex-end' }}
                >
                  {addPartSaving ? '…' : t('adminRepairOrder.partsAdd')}
                </button>
              </div>
              <div style={{ marginTop: 8 }}>
                <input
                  className='input'
                  placeholder={t('adminRepairOrder.partsNotesPlaceholder')}
                  value={addPartNotes}
                  onChange={(e) => setAddPartNotes(e.target.value)}
                />
              </div>
              {addPartError && <p className='notice' style={{ marginTop: 8, marginBottom: 0 }}>{addPartError}</p>}
            </form>
          )}
        </>
      )}
    </div>
  )
}
