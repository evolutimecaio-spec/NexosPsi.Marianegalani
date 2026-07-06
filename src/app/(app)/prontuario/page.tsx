import { serverGetPacientes } from '@/lib/server-db'
import ProntuarioView from '@/components/views/Prontuario'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export default async function Page() {
  const pacientes = await serverGetPacientes()
  return <ProntuarioView initialPacientes={pacientes} />
}
