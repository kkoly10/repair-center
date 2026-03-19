import AdminQuoteDetailPage from '../../../../components/AdminQuoteDetailPage'

export default async function AdminQuoteDetailRoute({ params }) {
  const resolvedParams = await params
  return <AdminQuoteDetailPage quoteId={resolvedParams.quoteId} />
}
