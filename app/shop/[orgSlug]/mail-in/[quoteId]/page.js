import MailInInstructionsPage from '../../../../../components/MailInInstructionsPage'

export default async function ShopMailInRoute({ params }) {
  const resolvedParams = await params
  return (
    <MailInInstructionsPage
      quoteId={resolvedParams.quoteId}
      orgSlug={resolvedParams.orgSlug}
    />
  )
}
