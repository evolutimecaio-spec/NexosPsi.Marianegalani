// Server Component — dados buscados no servidor antes de enviar o HTML
import { serverGetDashboard } from '@/lib/server-db'
import DashboardView from '@/components/views/Dashboard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  const initial = await serverGetDashboard()
  return <DashboardView initial={initial} />
}
