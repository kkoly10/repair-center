'use client'

import { useT } from '../../lib/i18n/TranslationProvider'

export default function OrderShipments({ shipments = [] }) {
  const t = useT()
  return (
    <div className='policy-card'>
      <div className='kicker'>{t('adminRepairOrder.shipmentsKicker')}</div>
      <h3>{t('adminRepairOrder.shipmentsHeading')}</h3>
      <div className='preview-meta' style={{ marginTop: 18 }}>
        {shipments.length ? (
          shipments.map((s) => (
            <div key={s.id} className='preview-meta-row'>
              <span>
                {s.shipment_type} · {s.carrier || t('adminRepairOrder.shipmentsCarrierPending')}
                {s.tracking_number ? ` · ${s.tracking_number}` : ''}
              </span>
              <span>{s.status || t('adminRepairOrder.shipmentsStatusPending')}</span>
            </div>
          ))
        ) : (
          <div className='preview-meta-row'>
            <span>{t('adminRepairOrder.shipmentsEmpty')}</span>
            <span>—</span>
          </div>
        )}
      </div>
    </div>
  )
}
