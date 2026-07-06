import { serverGetInadimplentes } from '@/lib/server-db'
import FinanceiroView from '@/components/views/Financeiro'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export default async function Page() {
  const inad = await serverGetInadimplentes()
  return <FinanceiroView initialInad={inad} />
}
