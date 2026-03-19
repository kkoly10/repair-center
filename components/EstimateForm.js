'use client'

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
  const [submitted, setSubmitted] = useState(false)

  const brands = useMemo(() => getBrandsByCategory(category), [category])

  const models = useMemo(() => {
    if (!brands.includes(brand)) return []
    return getModelsByBrandAndCategory(category, brand)
  }, [category, brand, brands])

  const repairs = useMemo(() => getRepairsByModel(modelKey), [modelKey])
  const selectedRepair = useMemo(() => getPricingForSelection(modelKey, repairKey), [modelKey, repairKey])
  const entry = useMemo(() => getCatalogEntry(modelKey), [modelKey])

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
    setSubmitted(false)
  }

  const onBrandChange = (value) => {
    setBrand(value)
    const nextModels = getModelsByBrandAndCategory(category, value)
    const nextModel = nextModels[0]?.modelKey ?? ''
    const nextRepairs = getRepairsByModel(nextModel)
    setModelKey(nextModel)
    setRepairKey(nextRepairs[0]?.key ?? '')
    setSubmitted(false)
  }

  const onModelChange = (value) => {
    setModelKey(value)
    const nextRepairs = getRepairsByModel(value)
    setRepairKey(nextRepairs[0]?.key ?? '')
    setSubmitted(false)
  }

  return (
    <div className='page-hero'>
      <div className='site-shell page-hero-grid'>
        <div className='page-stack'>
          <div className='info-card'>
            <div className='kicker'>Free estimate</div>
            <h1>Get a free repair estimate</h1>
            <p>
              Upload a few photos and basic device details. This starter build previews the pricing flow
              and the premium intake experience you want for the real business.
            </p>
            <div className='inline-badges' style={{ marginTop: 18 }}>
              <span className='badge'>No account required</span>
              <span className='badge'>Human-reviewed quotes</span>
              <span className='badge'>No repair without approval</span>
            </div>
          </div>

          <div className='list-card'>
            <div className='kicker'>How this works</div>
            <h3>What customers see next</h3>
            <StatusTracker steps={REPAIR_STATUS_STEPS} currentStep={0} />
          </div>

          <div className='policy-card'>
            <h3>Important to know</h3>
            <p>
              A free photo estimate is a preliminary quote, not a final diagnosis. Final pricing is
              confirmed after in-hand inspection, hidden damage review, and approval.
            </p>
          </div>
        </div>

        <div className='form-shell'>
          <div className='kicker'>Start your estimate</div>
          <p className='muted' style={{ marginTop: 0 }}>
            This page is already structured for a future backend, but right now it works as a polished front-end MVP.
          </p>

          <div className='form-section'>
            <h3>Your contact details</h3>
            <div className='form-grid'>
              <div className='field'>
                <label>First name</label>
                <input placeholder='First name' />
              </div>
              <div className='field'>
                <label>Email address</label>
                <input placeholder='name@example.com' />
              </div>
              <div className='field'>
                <label>Phone number</label>
                <input placeholder='(555) 555-5555' />
              </div>
              <div className='field'>
                <label>Preferred contact method</label>
                <div className='option-pills'>
                  {contactOptions.map((option) => (
                    <button
                      key={option}
                      type='button'
                      className={option === contactMethod ? 'active' : ''}
                      onClick={() => setContactMethod(option)}
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
                <label>Device category</label>
                <select value={category} onChange={(event) => onCategoryChange(event.target.value)}>
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className='field'>
                <label>Brand</label>
                <select value={brand} onChange={(event) => onBrandChange(event.target.value)}>
                  {brands.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className='field'>
                <label>Model</label>
                <select value={modelKey} onChange={(event) => onModelChange(event.target.value)}>
                  {models.map((option) => (
                    <option key={option.modelKey} value={option.modelKey}>
                      {option.model}
                    </option>
                  ))}
                </select>
              </div>
              <div className='field'>
                <label>Repair type</label>
                <select value={repairKey} onChange={(event) => { setRepairKey(event.target.value); setSubmitted(false) }}>
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
              <label>Describe the issue</label>
              <textarea placeholder='Tell us what happened, what is not working, and anything else we should know.' />
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
            <p className='field-note'>The clearer the photos, the better the estimate. This MVP is set up for camera uploads later.</p>
            <div className='upload-grid'>
              {['Front', 'Back', 'Damage close-up', 'Screen on', 'Side / frame', 'Charging port'].map((label) => (
                <div key={label} className='upload-tile'>{label}</div>
              ))}
            </div>
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
                <span>{selectedRepair?.deposit ? `$${selectedRepair.deposit}` : 'Included later'}</span>
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
              <button type='button' className='button button-primary' onClick={() => setSubmitted(true)}>
                Submit Free Estimate
              </button>
            </div>

            {submitted ? (
              <div className='notice' style={{ marginTop: 16 }}>
                <strong style={{ display: 'block', marginBottom: 8, color: 'var(--text)' }}>Estimate preview captured</strong>
                In the next phase, this will create a quote ID, email the customer, and move the request into your admin review queue.
                For now, the front end is ready and the pricing preview is working locally.
              </div>
            ) : null}
          </div>
        </div>
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
