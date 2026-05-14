import PlatformOrgDetailPage from '../../../../components/PlatformOrgDetailPage'

export default async function OrgDetailPage({ params }) {
  const { orgId } = await params
  return <PlatformOrgDetailPage orgId={orgId} />
}
