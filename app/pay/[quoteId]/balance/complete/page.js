import FinalBalanceCompletePage from '../../../../../components/FinalBalanceCompletePage'

export default async function Page({ params }) {
  const resolvedParams = await params
  return <FinalBalanceCompletePage quoteId={resolvedParams.quoteId} />
}
