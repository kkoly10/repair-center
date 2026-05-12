import AdminCustomerProfilePage from '../../../../components/AdminCustomerProfilePage'

export default async function CustomerProfilePage({ params }) {
  const resolvedParams = await params
  return <AdminCustomerProfilePage customerId={resolvedParams.customerId} />
}
