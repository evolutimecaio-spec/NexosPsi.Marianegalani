import { serverGetInadimplentes } from '@/lib/server-db'
import AlertasView from '@/components/views/Alertas'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export default async function Page() {
  const inad = await serverGetInadimplentes()
  return <AlertasView initialInad={inad} />
}
