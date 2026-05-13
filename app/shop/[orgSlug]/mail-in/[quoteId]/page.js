import MailInInstructionsPage from '../../../../../components/MailInInstructionsPage'

export default async function ShopMailInRoute({ params, searchParams }) {
  const resolvedParams = await params
  const resolvedSearch = await searchParams
  return (
    <MailInInstructionsPage
      quoteId={resolvedParams.quoteId}
      orgSlug={resolvedParams.orgSlug}
      tok={resolvedSearch?.tok || ''}
    />
  )
}
