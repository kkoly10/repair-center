const STATUS_STYLES = {
  submitted: {
    background: 'rgba(22, 93, 255, 0.08)',
    color: '#165dff',
    borderColor: 'rgba(22, 93, 255, 0.18)',
  },
  under_review: {
    background: 'rgba(245, 158, 11, 0.12)',
    color: '#b45309',
    borderColor: 'rgba(245, 158, 11, 0.24)',
  },
  estimate_sent: {
    background: 'rgba(16, 185, 129, 0.1)',
    color: '#047857',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  awaiting_customer: {
    background: 'rgba(99, 102, 241, 0.08)',
    color: '#4338ca',
    borderColor: 'rgba(99, 102, 241, 0.18)',
  },
  approved_for_mail_in: {
    background: 'rgba(34, 197, 94, 0.1)',
    color: '#15803d',
    borderColor: 'rgba(34, 197, 94, 0.18)',
  },
  declined: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#b91c1c',
    borderColor: 'rgba(239, 68, 68, 0.18)',
  },
  archived: {
    background: 'rgba(100, 116, 139, 0.1)',
    color: '#475569',
    borderColor: 'rgba(100, 116, 139, 0.18)',
  },
}

export default function QuoteStatusBadge({ status }) {
  const style = STATUS_STYLES[status] || {
    background: '#f1f4f8',
    color: '#5b6472',
    borderColor: '#e5eaf1',
  }

  return (
    <span
      className='mini-chip'
      style={{
        background: style.background,
        color: style.color,
        borderColor: style.borderColor,
      }}
    >
      {status
        ?.split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')}
    </span>
  )
}
