export const QUOTE_STATUS_OPTIONS = [
  { value: 'all', label: 'All requests' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'estimate_sent', label: 'Estimate sent' },
  { value: 'awaiting_customer', label: 'Awaiting customer' },
  { value: 'approved_for_mail_in', label: 'Approved for mail-in' },
  { value: 'declined', label: 'Declined' },
  { value: 'archived', label: 'Archived' },
]

export function formatQuotePrice(record) {
  if (!record) return '—'
  if (record.preliminary_price_fixed != null) return `$${Number(record.preliminary_price_fixed).toFixed(2)}`
  if (record.preliminary_price_min != null && record.preliminary_price_max != null) {
    return `$${Number(record.preliminary_price_min).toFixed(2)}–$${Number(record.preliminary_price_max).toFixed(2)}`
  }
  return 'Manual review'
}

export function formatStatusLabel(status) {
  return status
    ?.split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
