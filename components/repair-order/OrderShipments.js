export default function OrderShipments({ shipments = [] }) {
  return (
    <div className='policy-card'>
      <div className='kicker'>Shipment records</div>
      <h3>Return shipping</h3>
      <div className='preview-meta' style={{ marginTop: 18 }}>
        {shipments.length ? (
          shipments.map((s) => (
            <div key={s.id} className='preview-meta-row'>
              <span>
                {s.shipment_type} · {s.carrier || 'Carrier pending'}
                {s.tracking_number ? ` · ${s.tracking_number}` : ''}
              </span>
              <span>{s.status || 'Pending'}</span>
            </div>
          ))
        ) : (
          <div className='preview-meta-row'>
            <span>No shipments recorded yet.</span>
            <span>—</span>
          </div>
        )}
      </div>
    </div>
  )
}
