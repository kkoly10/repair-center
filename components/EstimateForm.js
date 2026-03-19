'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
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

export default function EstimateForm() {
  const [category, setCategory] = useState('phone')
  const [brand, setBrand] = useState('Apple')
  const [modelKey, setModelKey] = useState('iphone-13')
  const [repairKey, setRepairKey] = useState('screen')
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

  const brands = useMemo(() => getBrandsByCategory(category), [category])

  const models = useMemo(() => {
    if (!brands.includes(brand)) return []
    return getModelsByBrandAndCategory(category, brand)
  }, [category, brand, brands])

  const repairs = useMemo(() => getRepairsByModel(modelKey), [modelKey])
  const selectedRepair = useMemo(() => getPricingForSelection(modelKey, repairKey), [modelKey, repairKey])
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

  const handleSubmit = async (event) => {
    event.preventDefault()
    clearSubmissionState()
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    formData.set('contactMethod', contactMethod)
    formData.set('powerState', powerState)
    formData.set('chargeState', chargeState)
    formData.set('liquidState', liquidState)
    formData.set('priorRepairState', priorRepairState)
    formData.set('dataState', dataState)

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
      event.currentTarget.reset()
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
          <div className='info-card'>
            <div className='kicker'>Free estimate</div>
            <h1>Get a free repair estimate</h1>
            <p>
              Upload photos and device details, save the request to Supabase, and preview the pricing rule
              that best matches the selected model and repair.
            </p>
            <div className='inline-badges' style={{ marginTop: 18 }}>
              <span className='badge'>No account required</span>
              <span className='badge'>Photos saved privately</span>
              <span className='badge'>Human-reviewed quotes</span>
            </div>
          </div>

          <div className='list-card'>
            <div className='kicker'>Workflow</div>
            <h3>What happens after submit</h3>
            <StatusTracker steps={REPAIR_STATUS_STEPS} currentStep={0} />
          </div>

          <div className='policy-card'>
            <h3>Important to know</h3>
            <p>
              The estimate preview is still preliminary. The backend now stores the customer, quote request,
              selected pricing rule, and uploaded photos so staff can review it properly later.
            </p>
          </div>
        </div>

        <form className='form-shell' onSubmit={handleSubmit}>
          <div className='kicker'>Start your estimate</div>
          <p className='muted' style={{ marginTop: 0 }}>
            This page now saves into the long-term backend structure instead of only simulating the flow.
          </p>

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
                <input id='phone' name='phone' placeholder='(555) 555-5555' />
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
                <select id='category' name='category' value={category} onChange={(event) => onCategoryChange(event.target.value)}>
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className='field'>
                <label htmlFor='brand'>Brand</label>
                <select id='brand' name='brand' value={brand} onChange={(event) => onBrandChange(event.target.value)}>
                  {brands.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className='field'>
                <label htmlFor='modelKey'>Model</label>
                <select id='modelKey' name='modelKey' value={modelKey} onChange={(event) => onModelChange(event.target.value)}>
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
            <h3>Tell us what’s going on</h3>
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
              <QuestionPills label='Has it been repaired before?' value={priorRepairState} setValue={setPriorRepairState} />
              <QuestionPills label='Do you need data preserved?' value={dataState} setValue={setDataState} />
            </div>
          </div>

          <div className='form-section'>
            <h3>Upload photos</h3>
            <p className='field-note'>Up to 6 images. These uploads are saved into the private repair-uploads bucket for staff review.</p>
            <div className='upload-grid'>
              {['Front', 'Back', 'Damage close-up', 'Screen on', 'Side / frame', 'Charging port'].map((label) => (
                <div key={label} className='upload-tile'>{label}</div>
              ))}
            </div>
            <div className='field' style={{ marginTop: 14 }}>
              <label htmlFor='photos'>Photo files</label>
              <input
                id='photos'
                name='photos'
                type='file'
                accept='image/*'
                multiple
                onChange={(event) => {
                  setSelectedFiles(Array.from(event.target.files || []))
                  clearSubmissionState()
                }}
              />
            </div>
            {selectedFiles.length ? (
              <div className='notice' style={{ marginTop: 12 }}>
                <strong style={{ display: 'block', marginBottom: 8, color: 'var(--text)' }}>Selected files</strong>
                {selectedFiles.map((file) => file.name).join(', ')}
              </div>
            ) : null}
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
              <div className='notice' style={{ marginTop: 16, borderColor: 'rgba(245, 158, 11, 0.35)' }}>
                <strong style={{ display: 'block', marginBottom: 8, color: 'var(--text)' }}>Submission error</strong>
                {submissionError}
              </div>
            ) : null}

            {submissionResult ? (
              <div className='notice' style={{ marginTop: 16 }}>
                <strong style={{ display: 'block', marginBottom: 8, color: 'var(--text)' }}>Estimate request saved</strong>
                Quote ID <strong>{submissionResult.quoteId}</strong> has been created and the request is now in your backend review queue.
                {submissionResult.photoWarnings?.length ? (
                  <span style={{ display: 'block', marginTop: 10 }}>
                    Photo upload warnings: {submissionResult.photoWarnings.join(' · ')}
                  </span>
                ) : null}
                <span style={{ display: 'block', marginTop: 12 }}>
                  <Link href='/track' style={{ color: 'var(--blue)', fontWeight: 700 }}>
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
