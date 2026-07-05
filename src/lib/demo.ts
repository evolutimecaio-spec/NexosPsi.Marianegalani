// NexxoPsi — Dados demo para funcionar sem banco configurado
import type { Paciente, Agendamento, Fatura, Inadimplente } from '@/types'

export const DEMO_PACIENTES: Paciente[] = [
  { id:'p1', nome:'Ana Silva',     avatar:'AS', nascimento:'1991-03-15', sexo:'F', fone:'5511999990001', email:'ana@email.com', cid:'F41.1', modalidade:'Presencial', local_id:'aquarela',   perfil:['adulto'],          valor_sessao:180, venc_dia:3,  sessoes_total:18, devedor_total:360, ativo:true, obs:'Ansiedade generalizada.' },
  { id:'p2', nome:'Carla Nunes',   avatar:'CN', nascimento:'1997-07-22', sexo:'F', fone:'5511999990002', email:'',             cid:'',      modalidade:'Presencial', local_id:'unimed',     perfil:['adulto','mulher'],  valor_sessao:200, venc_dia:6,  sessoes_total:12, devedor_total:0,   ativo:true, obs:'' },
  { id:'p3', nome:'Marcos Lima',   avatar:'ML', nascimento:'1984-11-08', sexo:'M', fone:'5511999990003', email:'',             cid:'F32.0', modalidade:'Online',     local_id:'unimed',     perfil:['adulto'],          valor_sessao:160, venc_dia:10, sessoes_total:28, devedor_total:0,   ativo:true, obs:'' },
  { id:'p4', nome:'Paula Mendes',  avatar:'PM', nascimento:'1999-07-03', sexo:'F', fone:'5511999990004', email:'',             cid:'',      modalidade:'Presencial', local_id:'anhangabau', perfil:['adulto','mulher'],  valor_sessao:220, venc_dia:15, sessoes_total:8,  devedor_total:0,   ativo:true, obs:'' },
  { id:'p5', nome:'Rafael Costa',  avatar:'RC', nascimento:'1992-05-18', sexo:'M', fone:'5511999990005', email:'',             cid:'F40.1', modalidade:'Online',     local_id:'anhangabau', perfil:['adulto'],          valor_sessao:180, venc_dia:20, sessoes_total:15, devedor_total:0,   ativo:true, obs:'' },
  { id:'p6', nome:'Thiago Braga',  avatar:'TB', nascimento:'1996-02-14', sexo:'M', fone:'5511999990006', email:'',             cid:'',      modalidade:'Online',     local_id:'aquarela',   perfil:['adulto'],          valor_sessao:150, venc_dia:2,  sessoes_total:3,  devedor_total:150, ativo:true, obs:'' },
  { id:'p7', nome:'Sofia Lima',    avatar:'SL', nascimento:'2017-04-12', sexo:'F', fone:'5511999990008', email:'',             cid:'F84.0', modalidade:'Presencial', local_id:'aquarela',   perfil:['crianca','neurodiverge'], valor_sessao:190, venc_dia:10, sessoes_total:10, devedor_total:0, ativo:true, obs:'TEA nível 1.' },
  { id:'p8', nome:'Pedro Mendes',  avatar:'PD', nascimento:'2018-08-20', sexo:'M', fone:'5511999990009', email:'',             cid:'F90.0', modalidade:'Presencial', local_id:'unimed',     perfil:['crianca','neurodiverge'], valor_sessao:190, venc_dia:15, sessoes_total:6,  devedor_total:0, ativo:true, obs:'TDAH combinado.' },
]

function d(off: number): string {
  const x = new Date(); x.setDate(x.getDate() + off); return x.toISOString().slice(0,10)
}

export const DEMO_AGENDAMENTOS: Agendamento[] = [
  { id:'ag1', paciente_id:'p1', paciente: DEMO_PACIENTES[0] as any, data:d(0),  hora:'10:00', tipo:'Terapia Individual', modalidade:'Presencial', status:'confirmado', valor_sessao:180, pago:false },
  { id:'ag2', paciente_id:'p3', paciente: DEMO_PACIENTES[2] as any, data:d(0),  hora:'14:00', tipo:'Terapia Individual', modalidade:'Online',     status:'confirmado', valor_sessao:160, pago:true  },
  { id:'ag3', paciente_id:'p2', paciente: DEMO_PACIENTES[1] as any, data:d(0),  hora:'09:00', tipo:'Terapia Individual', modalidade:'Presencial', status:'confirmado', valor_sessao:200, pago:true  },
  { id:'ag4', paciente_id:'p5', paciente: DEMO_PACIENTES[4] as any, data:d(0),  hora:'16:00', tipo:'Terapia Individual', modalidade:'Online',     status:'aguardando', valor_sessao:180, pago:false },
  { id:'ag5', paciente_id:'p4', paciente: DEMO_PACIENTES[3] as any, data:d(1),  hora:'08:00', tipo:'Terapia Individual', modalidade:'Presencial', status:'agendado',   valor_sessao:220, pago:false },
  { id:'ag6', paciente_id:'p1', paciente: DEMO_PACIENTES[0] as any, data:d(7),  hora:'10:00', tipo:'Terapia Individual', modalidade:'Presencial', status:'agendado',   valor_sessao:180, pago:false },
  { id:'ag7', paciente_id:'p3', paciente: DEMO_PACIENTES[2] as any, data:d(-7), hora:'14:00', tipo:'Terapia Individual', modalidade:'Online',     status:'realizado',  valor_sessao:160, pago:true  },
]

export const DEMO_INADIMPLENTES: Inadimplente[] = [
  { paciente: DEMO_PACIENTES[0] as any, fatura:{ id:'f1', valor:360, vencimento: d(-5), status:'atrasado' }, diasAtraso:5 },
  { paciente: DEMO_PACIENTES[5] as any, fatura:{ id:'f2', valor:150, vencimento: d(-3), status:'atrasado' }, diasAtraso:3 },
]
