function formatStatusLabel(status) {
  return status?.split('_').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
}

export default function OrderActivityLog({ history = [], auditLog = [] }) {
  const statusEvents = history.map((item) => ({
    id:         `s-${item.id}`,
    created_at: item.created_at,
    label:      formatStatusLabel(item.new_status),
    detail:     item.note || null,
    internal:   !item.customer_visible,
  }))

  const auditEvents = auditLog.map((item) => {
    let label = item.event_type
    if (item.event_type === 'technician_assigned') {
      label = item.new_value ? 'Tech assigned' : 'Tech unassigned'
    } else if (item.event_type === 'priority_changed') {
      label = `Priority → ${item.new_value || '—'}`
    } else if (item.event_type === 'due_date_changed') {
      label = item.new_value
        ? `Due date set: ${new Date(item.new_value).toLocaleDateString()}`
        : 'Due date cleared'
    }
    return { id: `a-${item.id}`, created_at: item.created_at, label, detail: null, internal: true }
  })

  const timeline = [...statusEvents, ...auditEvents].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  )

  return (
    <div className='policy-card'>
      <div className='kicker'>Activity log</div>
      <h3>Order timeline</h3>
      <div className='preview-meta' style={{ marginTop: 18 }}>
        {timeline.length === 0 ? (
          <div className='preview-meta-row'>
            <span>No timeline entries yet.</span>
            <span>—</span>
          </div>
        ) : (
          timeline.map((item) => (
            <div key={item.id} className='preview-meta-row'>
              <span>
                {item.internal && (
                  <span className='mini-chip' style={{ marginRight: 6, fontSize: 10 }}>internal</span>
                )}
                {item.label}
                {item.detail ? ` · ${item.detail}` : ''}
              </span>
              <span style={{ whiteSpace: 'nowrap' }}>{new Date(item.created_at).toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
