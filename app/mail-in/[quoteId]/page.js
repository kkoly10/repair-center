import MailInInstructionsPage from '../../../components/MailInInstructionsPage'

export default async function MailInRoute({ params }) {
  const resolvedParams = await params
  return <MailInInstructionsPage quoteId={resolvedParams.quoteId} />
}
