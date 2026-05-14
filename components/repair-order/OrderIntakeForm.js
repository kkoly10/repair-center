'use client'

import { useEffect, useState } from 'react'

export default function OrderIntakeForm({ quoteId, orderId }) {
  const [intake,              setIntake]              = useState(null)
  const [saving,              setSaving]              = useState(false)
  const [error,               setError]               = useState('')
  const [successMsg,          setSuccessMsg]          = useState('')
  const [packageCondition,    setPackageCondition]    = useState('')
  const [deviceCondition,     setDeviceCondition]     = useState('')
  const [includedItems,       setIncludedItems]       = useState('')
  const [imeiOrSerial,        setImeiOrSerial]        = useState('')
  const [powerTestResult,     setPowerTestResult]     = useState('')
  const [intakePhotosComplete,setIntakePhotosComplete]= useState(false)
  const [hiddenDamageFound,   setHiddenDamageFound]   = useState(false)
  const [liquidDamageFound,   setLiquidDamageFound]   = useState(false)
  const [boardDamageFound,    setBoardDamageFound]    = useState(false)
  const [intakeNotes,         setIntakeNotes]         = useState('')

  useEffect(() => {
    if (!orderId) return
    let cancelled = false
    fetch(`/admin/api/quotes/${quoteId}/intake`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((result) => {
        if (cancelled || !result.ok || !result.intake) return
        const r = result.intake
        setIntake(r)
        setPackageCondition(r.package_condition     || '')
        setDeviceCondition(r.device_condition       || '')
        setIncludedItems(r.included_items           || '')
        setImeiOrSerial(r.imei_or_serial            || '')
        setPowerTestResult(r.power_test_result      || '')
        setIntakePhotosComplete(r.intake_photos_complete || false)
        setHiddenDamageFound(r.hidden_damage_found  || false)
        setLiquidDamageFound(r.liquid_damage_found  || false)
        setBoardDamageFound(r.board_damage_found    || false)
        setIntakeNotes(r.notes                      || '')
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [quoteId, orderId])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true); setError(''); setSuccessMsg('')
    try {
      const res = await fetch(`/admin/api/quotes/${quoteId}/intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageCondition,
          deviceCondition,
          includedItems,
          imeiOrSerial,
          powerTestResult,
          intakePhotosComplete,
          hiddenDamageFound,
          liquidDamageFound,
          boardDamageFound,
          notes: intakeNotes,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Unable to save intake report.')
      setIntake(result.intake)
      setSuccessMsg('Intake report saved.')
    } catch (err) {
      setError(err.message || 'Unable to save intake report.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className='policy-card' onSubmit={handleSave}>
      <div className='kicker'>Device intake</div>
      <h3>Condition on arrival</h3>
      <p style={{ marginBottom: 18 }}>
        Record the device state when it arrives. This protects against disputes about pre-existing damage.
      </p>

      <div className='form-grid'>
        <div className='field'>
          <label htmlFor='pkg-condition'>Package condition</label>
          <input id='pkg-condition' value={packageCondition} onChange={(e) => setPackageCondition(e.target.value)} placeholder='Good, Damaged, etc.' />
        </div>
        <div className='field'>
          <label htmlFor='dev-condition'>Device condition</label>
          <input id='dev-condition' value={deviceCondition} onChange={(e) => setDeviceCondition(e.target.value)} placeholder='Good, Cracked screen, etc.' />
        </div>
        <div className='field'>
          <label htmlFor='imei-serial'>IMEI / Serial</label>
          <input id='imei-serial' value={imeiOrSerial} onChange={(e) => setImeiOrSerial(e.target.value)} placeholder='IMEI or serial number' />
        </div>
        <div className='field'>
          <label htmlFor='power-test'>Power test result</label>
          <input id='power-test' value={powerTestResult} onChange={(e) => setPowerTestResult(e.target.value)} placeholder='Powers on, No power, etc.' />
        </div>
      </div>

      <div className='field' style={{ marginTop: 18 }}>
        <label htmlFor='included-items'>Included items</label>
        <input id='included-items' value={includedItems} onChange={(e) => setIncludedItems(e.target.value)} placeholder='Device only, charger included, etc.' />
      </div>

      <div className='form-grid' style={{ marginTop: 18 }}>
        {[
          { id: 'photos-done',    label: 'Photos complete',      checked: intakePhotosComplete, set: setIntakePhotosComplete },
          { id: 'hidden-dmg',     label: 'Hidden damage found',  checked: hiddenDamageFound,    set: setHiddenDamageFound },
          { id: 'liquid-dmg',     label: 'Liquid damage found',  checked: liquidDamageFound,    set: setLiquidDamageFound },
          { id: 'board-dmg',      label: 'Board damage found',   checked: boardDamageFound,     set: setBoardDamageFound },
        ].map(({ id, label, checked, set }) => (
          <label key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type='checkbox' id={id} checked={checked} onChange={(e) => set(e.target.checked)} />
            {label}
          </label>
        ))}
      </div>

      <div className='field' style={{ marginTop: 18 }}>
        <label htmlFor='intake-notes'>Intake notes</label>
        <textarea id='intake-notes' value={intakeNotes} onChange={(e) => setIntakeNotes(e.target.value)} placeholder='Any additional observations about the device on arrival.' />
      </div>

      {error      && <div className='notice'>{error}</div>}
      {successMsg && <div className='notice'>{successMsg}</div>}

      <div className='inline-actions' style={{ marginTop: 18 }}>
        <button type='submit' className='button button-primary' disabled={saving}>
          {saving ? 'Saving…' : intake ? 'Update Intake Report' : 'Save Intake Report'}
        </button>
      </div>
    </form>
  )
}
