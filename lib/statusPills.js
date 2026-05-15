const STATUS_CLASSES = {
  submitted:                'pill pill-pending',
  under_review:             'pill pill-pending',
  estimate_sent:            'pill pill-active',
  approved:                 'pill pill-active',
  declined:                 'pill pill-inactive',
  inspection:               'pill pill-active',
  repairing:                'pill pill-active',
  awaiting_parts:           'pill pill-pending',
  awaiting_balance_payment: 'pill pill-pending',
  ready_to_ship:            'pill pill-complete',
  shipped:                  'pill pill-complete',
  delivered:                'pill pill-complete',
  cancelled:                'pill pill-inactive',
  returned_unrepaired:      'pill pill-inactive',
  beyond_economical_repair: 'pill pill-inactive',
  no_fault_found:           'pill pill-inactive',
  awaiting_mail_in:         'pill pill-pending',
  in_transit_to_shop:       'pill pill-pending',
  pending:                  'pill pill-pending',
  confirmed:                'pill pill-active',
  no_show:                  'pill pill-overdue',
  converted:                'pill pill-complete',
  active:                   'pill pill-complete',
  trialing:                 'pill pill-pending',
  past_due:                 'pill pill-overdue',
  suspended:                'pill pill-inactive',
}

const ENGLISH_LABELS = {
  submitted:                'Submitted',
  under_review:             'Under Review',
  estimate_sent:            'Estimate Sent',
  approved:                 'Approved',
  declined:                 'Declined',
  inspection:               'Inspecting',
  repairing:                'Repairing',
  awaiting_parts:           'Awaiting Parts',
  awaiting_balance_payment: 'Awaiting Payment',
  ready_to_ship:            'Ready to Ship',
  shipped:                  'Shipped',
  delivered:                'Delivered',
  cancelled:                'Cancelled',
  returned_unrepaired:      'Returned',
  beyond_economical_repair: 'Uneconomical',
  no_fault_found:           'No Fault Found',
  awaiting_mail_in:         'Awaiting Mail-In',
  in_transit_to_shop:       'In Transit',
  pending:                  'Pending',
  confirmed:                'Confirmed',
  no_show:                  'No Show',
  converted:                'Converted',
  active:                   'Active',
  trialing:                 'Trialing',
  past_due:                 'Past Due',
  suspended:                'Suspended',
}

export function statusPill(status, t) {
  const cls = STATUS_CLASSES[status] || 'pill pill-inactive'
  let label = ENGLISH_LABELS[status] ?? status ?? '—'
  if (typeof t === 'function' && status) {
    const translated = t(`status.${status}`)
    // Only use translation if the key resolved (otherwise t returns the key string)
    if (translated && translated !== `status.${status}`) label = translated
  }
  return { cls, label }
}

export function statusLabel(status, t) {
  return statusPill(status, t).label
}
