import { serverGetPacientes, serverGetAgendamentosHoje } from '@/lib/server-db'
import AgendaView from '@/components/views/Agenda'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export default async function Page() {
  const [pacientes, agHoje] = await Promise.all([
    serverGetPacientes(),
    serverGetAgendamentosHoje(),
  ])
  return <AgendaView initialPacientes={pacientes} initialAgs={agHoje} />
}
