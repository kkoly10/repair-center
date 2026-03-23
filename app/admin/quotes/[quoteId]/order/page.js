import AdminRepairOrderPage from '../../../../../components/AdminRepairOrderPage'

export default async function AdminRepairOrderRoute({ params }) {
  const resolvedParams = await params
  return <AdminRepairOrderPage quoteId={resolvedParams.quoteId} />
}