const STATUS_MAP = {
  // Quote statuses
  submitted:                { cls: 'pill pill-pending',  label: 'Submitted' },
  under_review:             { cls: 'pill pill-pending',  label: 'Under Review' },
  estimate_sent:            { cls: 'pill pill-active',   label: 'Estimate Sent' },
  approved:                 { cls: 'pill pill-active',   label: 'Approved' },
  declined:                 { cls: 'pill pill-inactive', label: 'Declined' },
  // Order statuses
  inspection:               { cls: 'pill pill-active',   label: 'Inspecting' },
  repairing:                { cls: 'pill pill-active',   label: 'Repairing' },
  awaiting_parts:           { cls: 'pill pill-pending',  label: 'Awaiting Parts' },
  awaiting_balance_payment: { cls: 'pill pill-pending',  label: 'Awaiting Payment' },
  ready_to_ship:            { cls: 'pill pill-complete', label: 'Ready to Ship' },
  shipped:                  { cls: 'pill pill-complete', label: 'Shipped' },
  delivered:                { cls: 'pill pill-complete', label: 'Delivered' },
  cancelled:                { cls: 'pill pill-inactive', label: 'Cancelled' },
  returned_unrepaired:      { cls: 'pill pill-inactive', label: 'Returned' },
  beyond_economical_repair: { cls: 'pill pill-inactive', label: 'Uneconomical' },
  no_fault_found:           { cls: 'pill pill-inactive', label: 'No Fault Found' },
  // Appointment statuses
  pending:   { cls: 'pill pill-pending',  label: 'Pending' },
  confirmed: { cls: 'pill pill-active',   label: 'Confirmed' },
  no_show:   { cls: 'pill pill-overdue',  label: 'No Show' },
  converted: { cls: 'pill pill-complete', label: 'Converted' },
}

export function statusPill(status) {
  return STATUS_MAP[status] ?? { cls: 'pill pill-inactive', label: status ?? '—' }
}
