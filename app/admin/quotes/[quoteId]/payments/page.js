import AdminPaymentsPage from '../../../../../components/AdminPaymentsPage'

export default async function Page({ params }) {
  const resolvedParams = await params
  return <AdminPaymentsPage quoteId={resolvedParams.quoteId} />
}
