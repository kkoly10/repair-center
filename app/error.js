'use client'

import { useEffect } from 'react'
import { useT } from '../lib/i18n/TranslationProvider'

export default function Error({ error, reset }) {
  const t = useT()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack' style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <div className='kicker'>Error</div>
        <h1>{t('errors.serverError')}</h1>
        <p style={{ color: 'var(--text-muted, #666)', maxWidth: 480, margin: '0 auto 2rem' }}>
          {t('errors.serverErrorText')}
        </p>
        <div className='inline-actions' style={{ justifyContent: 'center' }}>
          <button className='button button-primary' onClick={reset}>
            {t('errors.retry')}
          </button>
        </div>
      </div>
    </main>
  )
}
