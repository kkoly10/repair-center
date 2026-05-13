import MailInInstructionsPage from '../../../components/MailInInstructionsPage'

export default async function MailInRoute({ params, searchParams }) {
  const resolvedParams = await params
  const resolvedSearch = await searchParams
  return (
    <MailInInstructionsPage
      quoteId={resolvedParams.quoteId}
      tok={resolvedSearch?.tok || ''}
    />
  )
}
