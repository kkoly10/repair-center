import AdminEstimateBuilderPage from '../../../../../components/AdminEstimateBuilderPage'

export default async function AdminEstimateBuilderRoute({ params }) {
  const resolvedParams = await params
  return <AdminEstimateBuilderPage quoteId={resolvedParams.quoteId} />
}
