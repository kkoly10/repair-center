'use client'

import { useState } from 'react'

export default function OrderStaffNotes({ orderId, initialNotes }) {
  const [notes, setNotes] = useState(initialNotes || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch(`/admin/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save notes.')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message || 'Failed to save notes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className='policy-card' onSubmit={handleSave}>
      <div className='kicker'>Internal</div>
      <h3>Staff notes</h3>
      <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: 4, marginBottom: 12 }}>
        Private notes visible only to staff — not shared with the customer.
      </p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        placeholder='Add internal notes about this repair…'
        style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', marginBottom: 10 }}
      />
      {error && <p className='notice notice-error' style={{ marginBottom: 8 }}>{error}</p>}
      {success && <p className='notice notice-success' style={{ marginBottom: 8 }}>Notes saved.</p>}
      <button type='submit' className='button' disabled={saving}>
        {saving ? 'Saving…' : 'Save notes'}
      </button>
    </form>
  )
}
