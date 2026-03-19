export default function StatusTracker({ steps = [], currentStep = 0 }) {
  return (
    <div className='status-tracker'>
      {steps.map((step, index) => {
        const state = index < currentStep ? 'done' : index === currentStep ? 'active' : 'upcoming'

        return (
          <div key={step} className={`status-step status-step-${state}`}>
            <div className='status-dot'>{index + 1}</div>
            <div>
              <div className='status-step-label'>{step}</div>
              <div className='status-step-meta'>
                {state === 'done' ? 'Completed' : state === 'active' ? 'Current step' : 'Upcoming'}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
