import AdminRevisedEstimatePage from '../../../../../components/AdminRevisedEstimatePage'

export default async function AdminRevisedEstimateRoute({ params }) {
  const resolvedParams = await params
  return <AdminRevisedEstimatePage quoteId={resolvedParams.quoteId} />
}