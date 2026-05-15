import { getServerMessages } from '../lib/i18n/server'
import { getTranslator } from '../lib/i18n/messages'
import { DEFAULT_LOCALE } from '../lib/i18n/config'

export default async function LegalDisclaimerBanner() {
  const { locale } = await getServerMessages()
  if (locale === DEFAULT_LOCALE) return null
  const t = getTranslator(locale)
  return (
    <div
      role='note'
      style={{
        background: '#fef3c7',
        border: '1px solid #fcd34d',
        color: '#78350f',
        padding: '12px 16px',
        borderRadius: 8,
        marginBottom: 24,
        fontSize: 14,
        lineHeight: 1.5,
      }}
    >
      <strong style={{ display: 'block', marginBottom: 4 }}>⚠</strong>
      {t('legal.translationDisclaimer')}
    </div>
  )
}
