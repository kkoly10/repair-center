'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  CATEGORY_OPTIONS,
  REPAIR_STATUS_STEPS,
  formatPriceDisplay,
  getBrandsByCategory,
  getCatalogEntry,
  getModelsByBrandAndCategory,
  getPricingForSelection,
  getRepairsByModel,
} from '../lib/repairCatalog'
import StatusTracker from './StatusTracker'

const contactOptions = ['Email', 'Text', 'Either']
const yesNoMaybe = ['Yes', 'No', 'Not sure']

export default function EstimateForm({ orgSlug }) {
  const searchParams = useSearchParams()
  const resolvedOrgSlug = orgSlug || searchParams.get('shop') || ''
  const [category, setCategory] = useState(searchParams.get('category') || 'phone')
  const [brand, setBrand] = useState(searchParams.get('brand') || 'Apple')
  const [modelKey, setModelKey] = useState(searchParams.get('modelKey') || 'iphone-13')
  const [repairKey, setRepairKey] = useState(searchParams.get('repairKey') || 'screen')
  const [contactMethod, setContactMethod] = useState('Either')
  const [powerState, setPowerState] = useState('Yes')
  const [chargeState, setChargeState] = useState('Yes')
  const [liquidState, setLiquidState] = useState('No')
  const [priorRepairState, setPriorRepairState] = useState('No')
  const [dataState, setDataState] = useState('Yes')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState(null)
  const [submissionError, setSubmissionError] = useState(null)
  const [phoneError, setPhoneError] = useState('')
  const [dbPricingLookup, setDbPricingLookup] = useState({})

  useEffect(() => {
    if (!resolvedOrgSlug) return
    fetch(`/api/pricing/${resolvedOrgSlug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.rules) return
        const lookup = {}
        for (const rule of data.rules) {
          const mk = rule.repair_catalog_models?.model_key
          const rk = rule.repair_types?.repair_key
          if (mk && rk) lookup[`${mk}:${rk}`] = rule
        }
        setDbPricingLookup(lookup)
      })
      .catch(() => {})
  }, [resolvedOrgSlug])

  const brands = useMemo(() => getBrandsByCategory(category), [category])

  const models = useMemo(() => {
    if (!brands.includes(brand)) return []
    return getModelsByBrandAndCategory(category, brand)
  }, [category, brand, brands])

  const repairs = useMemo(() => getRepairsByModel(modelKey), [modelKey])
  const selectedRepair = useMemo(() => {
    const staticRepair = getPricingForSelection(modelKey, repairKey)
    const dbRule = dbPricingLookup[`${modelKey}:${repairKey}`]
    if (!dbRule) return staticRepair
    return {
      ...staticRepair,
      price: dbRule.public_price_fixed ?? staticRepair?.price ?? null,
      min: dbRule.public_price_min ?? staticRepair?.min ?? null,
      max: dbRule.public_price_max ?? staticRepair?.max ?? null,
      deposit: dbRule.deposit_amount ?? staticRepair?.deposit ?? null,
    }
  }, [modelKey, repairKey, dbPricingLookup])
  const entry = useMemo(() => getCatalogEntry(modelKey), [modelKey])

  const clearSubmissionState = () => {
    setSubmissionResult(null)
    setSubmissionError(null)
  }

  const onCategoryChange = (value) => {
    setCategory(value)
    const nextBrands = getBrandsByCategory(value)
    const nextBrand = nextBrands[0] ?? ''
    const nextModels = getModelsByBrandAndCategory(value, nextBrand)
    const nextModel = nextModels[0]?.modelKey ?? ''
    const nextRepairs = getRepairsByModel(nextModel)
    setBrand(nextBrand)
    setModelKey(nextModel)
    setRepairKey(nextRepairs[0]?.key ?? '')
    clearSubmissionState()
  }

  const onBrandChange = (value) => {
    setBrand(value)
    const nextModels = getModelsByBrandAndCategory(category, value)
    const nextModel = nextModels[0]?.modelKey ?? ''
    const nextRepairs = getRepairsByModel(nextModel)
    setModelKey(nextModel)
    setRepairKey(nextRepairs[0]?.key ?? '')
    clearSubmissionState()
  }

  const onModelChange = (value) => {
    setModelKey(value)
    const nextRepairs = getRepairsByModel(value)
    setRepairKey(nextRepairs[0]?.key ?? '')
    clearSubmissionState()
  }

  const validatePhone = (value) => {
    if (!value) return ''
    const digits = value.replace(/\D/g, '')
    if (digits.length < 10 || digits.length > 15) {
      return 'Enter a valid phone number with at least 10 digits.'
    }
    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget

    const phoneValue = form.phone?.value || ''
    const phoneValidation = validatePhone(phoneValue)
    if (phoneValidation) {
      setPhoneError(phoneValidation)
      return
    }
    setPhoneError('')

    clearSubmissionState()
    setIsSubmitting(true)

    const formData = new FormData(form)
    formData.set('contactMethod', contactMethod)
    formData.set('powerState', powerState)
    formData.set('chargeState', chargeState)
    formData.set('liquidState', liquidState)
    formData.set('priorRepairState', priorRepairState)
    formData.set('dataState', dataState)
    if (resolvedOrgSlug) formData.set('orgSlug', resolvedOrgSlug)

    try {
      const response = await fetch('/api/quote-requests', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Unable to save the estimate request right now.')
      }

      setSubmissionResult(result)
      form.reset()
      setSelectedFiles([])
    } catch (error) {
      setSubmissionError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='page-hero'>
      <div className='site-shell page-hero-grid'>
        <div className='page-stack'>
          <div className='hero-copy' style={{ padding: 32 }}>
            <div className='eyebrow'>Free estimate</div>
            <h1 style={{ maxWidth: '12ch', fontSize: 'clamp(2.3rem, 5vw, 3.7rem)' }}>
              Tell us about your device and we&apos;ll quote it.
            </h1>
            <p>
              Upload a few photos, select your device, and describe the problem. We&apos;ll review
              everything and send you a detailed estimate, usually within one business day.
            </p>

            <div className='trust-row'>
              <span className='badge'>No account required</span>
              <span className='badge'>Photos stored privately</span>
              <span className='badge'>90-day warranty</span>
            </div>
          </div>

          <div className='panel panel-dark'>
            <div className='kicker'>What happens next</div>
            <h3>We review it, you decide</h3>
            <p>
              After you submit, we review your request and send an estimate. You approve or decline
              before anything else happens.
            </p>
            <div style={{ marginTop: 18 }}>
              <StatusTracker steps={REPAIR_STATUS_STEPS} currentStep={0} />
            </div>
          </div>

          <div className='policy-card'>
            <div className='kicker'>Good to know</div>
            <h3>Photo estimates are preliminary</h3>
            <p>
              The preview below is based on the selected device and repair type. Final pricing is
              confirmed after we inspect the device in hand. If anything changes, you&apos;ll approve
              the updated estimate first.
            </p>
          </div>
        </div>

        <form className='form-shell form-shell-premium' onSubmit={handleSubmit}>
          <div className='kicker'>Start your estimate</div>
          <h2 style={{ marginTop: 0, marginBottom: 8 }}>Tell us about your device</h2>
          <p className='muted' style={{ marginTop: 0 }}>
            Fill in your details, choose the device, and describe the issue. We&apos;ll review the
            request and send the next step.
          </p>

          <div className='form-premium-note'>
            <strong>Tip</strong>
            <span>
              Clear photos help us give a more accurate estimate. Include shots of the damage and
              mention what happened before the problem started.
            </span>
          </div>

          <div className='form-section'>
            <h3>Your contact details</h3>
            <div className='form-grid'>
              <div className='field'>
                <label htmlFor='firstName'>First name</label>
                <input id='firstName' name='firstName' placeholder='First name' required />
              </div>
              <div className='field'>
                <label htmlFor='lastName'>Last name</label>
                <input id='lastName' name='lastName' placeholder='Last name' />
              </div>
              <div className='field'>
                <label htmlFor='email'>Email address</label>
                <input id='email' name='email' type='email' placeholder='name@example.com' required />
              </div>
              <div className='field'>
                <label htmlFor='phone'>Phone number</label>
                <input
                  id='phone'
                  name='phone'
                  type='tel'
                  placeholder='(555) 555-5555'
                  onChange={() => {
                    if (phoneError) setPhoneError('')
                  }}
                />
                {phoneError ? (
                  <span
                    style={{
                      color: '#dc2626',
                      fontSize: '0.84rem',
                      marginTop: 4,
                      display: 'block',
                    }}
                  >
                    {phoneError}
                  </span>
                ) : null}
              </div>
              <div className='field' style={{ gridColumn: '1 / -1' }}>
                <label>Preferred contact method</label>
                <div className='option-pills'>
                  {contactOptions.map((option) => (
                    <button
                      key={option}
                      type='button'
                      className={option === contactMethod ? 'active' : ''}
                      onClick={() => {
                        setContactMethod(option)
                        clearSubmissionState()
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className='form-section'>
            <h3>Your device</h3>
            <div className='form-grid'>
              <div className='field'>
                <label htmlFor='category'>Device category</label>
                <select
                  id='category'
                  name='category'
                  value={category}
                  onChange={(event) => onCategoryChange(event.target.value)}
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className='field'>
                <label htmlFor='brand'>Brand</label>
                <select
                  id='brand'
                  name='brand'
                  value={brand}
                  onChange={(event) => onBrandChange(event.target.value)}
                >
                  {brands.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className='field'>
                <label htmlFor='modelKey'>Model</label>
                <select
                  id='modelKey'
                  name='modelKey'
                  value={modelKey}
                  onChange={(event) => onModelChange(event.target.value)}
                >
                  {models.map((option) => (
                    <option key={option.modelKey} value={option.modelKey}>
                      {option.model}
                    </option>
                  ))}
                </select>
              </div>
              <div className='field'>
                <label htmlFor='repairKey'>Repair type</label>
                <select
                  id='repairKey'
                  name='repairKey'
                  value={repairKey}
                  onChange={(event) => {
                    setRepairKey(event.target.value)
                    clearSubmissionState()
                  }}
                >
                  {repairs.map((repair) => (
                    <option key={repair.key} value={repair.key}>
                      {repair.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className='form-section'>
            <h3>Tell us what&apos;s going on</h3>
            <div className='field'>
              <label htmlFor='issueDescription'>Describe the issue</label>
              <textarea
                id='issueDescription'
                name='issueDescription'
                placeholder='Tell us what happened, what is not working, and anything else we should know.'
                required
              />
            </div>

            <div className='form-grid' style={{ marginTop: 14 }}>
              <QuestionPills label='Does it power on?' value={powerState} setValue={setPowerState} />
              <QuestionPills label='Does it charge?' value={chargeState} setValue={setChargeState} />
              <QuestionPills label='Any liquid exposure?' value={liquidState} setValue={setLiquidState} />
              <QuestionPills
                label='Has it been repaired before?'
                value={priorRepairState}
                setValue={setPriorRepairState}
              />
              <QuestionPills label='Do you need data preserved?' value={dataState} setValue={setDataState} />
            </div>
          </div>

          <div className='form-section'>
            <h3>Upload photos</h3>
            <p className='field-note'>
              Up to 6 images. Suggested shots: front, back, damage close-up, screen on, side/frame,
              and charging port.
            </p>
            <div className='field' style={{ marginTop: 14 }}>
              <label htmlFor='photos'>Photo files</label>
              <input
                id='photos'
                name='photos'
                type='file'
                accept='image/*'
                multiple
                onChange={(event) => {
                  const files = Array.from(event.target.files || []).slice(0, 6)
                  setSelectedFiles(files)
                  clearSubmissionState()
                }}
              />
            </div>

            {selectedFiles.length ? (
              <div className='upload-grid' style={{ marginTop: 12 }}>
                {selectedFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className='upload-tile upload-tile-preview'>
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      style={{
                        width: '100%',
                        height: 120,
                        objectFit: 'cover',
                        borderRadius: 10,
                      }}
                    />
                    <span className='upload-tile-label'>{file.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className='upload-grid' style={{ marginTop: 12 }}>
                {['Front', 'Back', 'Damage close-up', 'Screen on', 'Side / frame', 'Charging port'].map(
                  (label) => (
                    <div key={label} className='upload-tile'>
                      {label}
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <div className='preview-card'>
            <div className='kicker'>Live pricing preview</div>
            <div className='preview-price'>{formatPriceDisplay(selectedRepair)}</div>
            <div className='preview-meta'>
              <div className='preview-meta-row'>
                <span>Selected device</span>
                <span>{entry ? `${entry.brand} ${entry.model}` : '—'}</span>
              </div>
              <div className='preview-meta-row'>
                <span>Repair type</span>
                <span>{selectedRepair?.label ?? '—'}</span>
              </div>
              <div className='preview-meta-row'>
                <span>Inspection deposit</span>
                <span>{selectedRepair?.deposit ? `$${selectedRepair.deposit}` : 'Quoted later'}</span>
              </div>
              <div className='preview-meta-row'>
                <span>Return shipping</span>
                <span>{selectedRepair?.shipping ? `$${selectedRepair.shipping}` : 'Quoted later'}</span>
              </div>
              <div className='preview-meta-row'>
                <span>Expected turnaround</span>
                <span>{selectedRepair?.turnaround ?? 'After review'}</span>
              </div>
            </div>

            <div className='inline-actions'>
              <button type='submit' className='button button-primary' disabled={isSubmitting}>
                {isSubmitting ? 'Saving estimate…' : 'Submit Free Estimate'}
              </button>
            </div>

            {submissionError ? (
              <div className='notice notice-warn' style={{ marginTop: 16 }}>
                <strong style={{ display: 'block', marginBottom: 8, color: 'var(--text)' }}>
                  Submission error
                </strong>
                {submissionError}
              </div>
            ) : null}

            {submissionResult ? (
              <div className='notice notice-success' style={{ marginTop: 16 }}>
                <strong style={{ display: 'block', marginBottom: 8, color: 'var(--text)' }}>
                  Estimate request received
                </strong>
                Your request has been saved. Quote ID <strong>{submissionResult.quoteId}</strong>.
                We&apos;ll review it and send the next step shortly.
                {submissionResult.photoWarnings?.length ? (
                  <span style={{ display: 'block', marginTop: 10 }}>
                    Photo upload warnings: {submissionResult.photoWarnings.join(' · ')}
                  </span>
                ) : null}
                <span style={{ display: 'block', marginTop: 12 }}>
                  <Link
                    href={resolvedOrgSlug ? `/shop/${resolvedOrgSlug}/track/${submissionResult.quoteId}` : `/track/${submissionResult.quoteId}`}
                    style={{ color: 'var(--blue)', fontWeight: 700 }}
                  >
                    Open tracking page
                  </Link>
                </span>
              </div>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  )
}

function QuestionPills({ label, value, setValue }) {
  return (
    <div className='field'>
      <label>{label}</label>
      <div className='option-pills'>
        {yesNoMaybe.map((option) => (
          <button
            key={option}
            type='button'
            className={option === value ? 'active' : ''}
            onClick={() => setValue(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}