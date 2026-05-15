import InstantEstimator from '../../components/InstantEstimator'
import { getT } from '../../lib/i18n/server'

export async function generateMetadata() {
  const t = await getT()
  return {
    title: t('instantEstimate.metaTitle'),
    description: t('instantEstimate.metaDescription'),
  }
}

export default function InstantEstimatePage() {
  return <InstantEstimator />
}
