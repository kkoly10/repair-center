import AdminInvoicePage from '../../../../../components/AdminInvoicePage'

export default async function InvoicePage({ params }) {
  const resolvedParams = await params
  return <AdminInvoicePage quoteId={resolvedParams.quoteId} />
}
