'use client'

import { useT, useLocale } from '../../lib/i18n/TranslationProvider'
import { statusPill } from '../../lib/statusPills'

export default function OrderActivityLog({ history = [], auditLog = [] }) {
  const t = useT()
  const locale = useLocale()

  const statusEvents = history.map((item) => ({
    id:         `s-${item.id}`,
    created_at: item.created_at,
    label:      statusPill(item.new_status, t).label,
    detail:     item.note || null,
    internal:   !item.customer_visible,
  }))

  const auditEvents = auditLog.map((item) => {
    let label = item.event_type
    if (item.event_type === 'technician_assigned') {
      label = item.new_value ? t('adminRepairOrder.activityTechAssigned') : t('adminRepairOrder.activityTechUnassigned')
    } else if (item.event_type === 'priority_changed') {
      label = t('adminRepairOrder.activityPriorityChanged', { value: item.new_value || '—' })
    } else if (item.event_type === 'due_date_changed') {
      label = item.new_value
        ? t('adminRepairOrder.activityDueDateSet', { date: new Date(item.new_value).toLocaleDateString(locale || 'en-US') })
        : t('adminRepairOrder.activityDueDateCleared')
    }
    return { id: `a-${item.id}`, created_at: item.created_at, label, detail: null, internal: true }
  })

  const timeline = [...statusEvents, ...auditEvents].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  )

  return (
    <div className='policy-card'>
      <div className='kicker'>{t('adminRepairOrder.activityKicker')}</div>
      <h3>{t('adminRepairOrder.activityHeading')}</h3>
      <div className='preview-meta' style={{ marginTop: 18 }}>
        {timeline.length === 0 ? (
          <div className='preview-meta-row'>
            <span>{t('adminRepairOrder.activityEmpty')}</span>
            <span>—</span>
          </div>
        ) : (
          timeline.map((item) => (
            <div key={item.id} className='preview-meta-row'>
              <span>
                {item.internal && (
                  <span className='mini-chip' style={{ marginRight: 6, fontSize: 10 }}>{t('adminRepairOrder.activityInternalBadge')}</span>
                )}
                {item.label}
                {item.detail ? ` · ${item.detail}` : ''}
              </span>
              <span style={{ whiteSpace: 'nowrap' }}>{new Date(item.created_at).toLocaleString(locale || 'en-US')}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
