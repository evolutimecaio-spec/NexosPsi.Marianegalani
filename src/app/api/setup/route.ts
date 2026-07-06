import { NextResponse } from 'next/server'

// SQL executado automaticamente via Supabase Management API
// Requer SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente da Vercel
const SETUP_SQL = `
create extension if not exists "uuid-ossp";

create table if not exists configuracoes (id text primary key default 'nexopsi', dados jsonb not null default '{}'::jsonb, updated_at timestamptz default now());
create table if not exists pacientes (id uuid primary key default uuid_generate_v4(), nome text not null, avatar text default '', nascimento date, sexo text default '', cpf text default '', fone text default '', email text default '', endereco text default '', cid text default '', modalidade text default 'Presencial', local_id text default 'unimed', perfil text[] default '{}', valor_sessao numeric(10,2) default 180, venc_dia int default 10, sessoes_total int default 0, devedor_total numeric(10,2) default 0, obs text default '', ativo boolean default true, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists agendamentos (id uuid primary key default uuid_generate_v4(), paciente_id uuid references pacientes(id) on delete cascade, data date not null, hora text not null, tipo text default 'Terapia Individual', modalidade text default 'Presencial', local_id text default '', status text default 'agendado', valor_sessao numeric(10,2) default 0, pago boolean default false, obs text default '', created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists faturas (id uuid primary key default uuid_generate_v4(), paciente_id uuid references pacientes(id) on delete cascade, mes text not null, valor numeric(10,2) not null, sessoes_count int default 0, vencimento date not null, pago boolean default false, status text default 'aberto', data_pagamento date, created_at timestamptz default now());
create table if not exists evolucoes (id uuid primary key default uuid_generate_v4(), paciente_id uuid references pacientes(id) on delete cascade, data date not null default current_date, sessao_num int, texto text not null, cid text default '', gerado_luma boolean default false, transcricao text, created_at timestamptz default now());
create table if not exists cartoes (id uuid primary key default uuid_generate_v4(), paciente_id uuid references pacientes(id) on delete cascade, titulo text not null, gerado_luma boolean default false, ativo boolean default true, validade text default 'Semanal', created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists tarefas_cartao (id uuid primary key default uuid_generate_v4(), cartao_id uuid references cartoes(id) on delete cascade, titulo text not null, descricao text default '', feita boolean default false, ordem int default 0);
create table if not exists anamneses (id uuid primary key default uuid_generate_v4(), paciente_id uuid references pacientes(id) on delete cascade, modelo text not null, status text default 'enviado', enviado_em timestamptz default now(), respondido_em timestamptz, respostas jsonb default '{}'::jsonb, created_at timestamptz default now());
create table if not exists documentos (id uuid primary key default uuid_generate_v4(), paciente_id uuid references pacientes(id) on delete cascade, nome text not null, tipo text default 'Documento', url text default '', created_at timestamptz default now());

alter table configuracoes   enable row level security;
alter table pacientes       enable row level security;
alter table agendamentos    enable row level security;
alter table faturas         enable row level security;
alter table evolucoes       enable row level security;
alter table cartoes         enable row level security;
alter table tarefas_cartao  enable row level security;
alter table anamneses       enable row level security;
alter table documentos      enable row level security;

do $pol$ begin
  if not exists (select 1 from pg_policies where tablename='pacientes' and policyname='anon_all') then
    create policy "anon_all" on configuracoes   for all using (true) with check (true);
    create policy "anon_all" on pacientes       for all using (true) with check (true);
    create policy "anon_all" on agendamentos    for all using (true) with check (true);
    create policy "anon_all" on faturas         for all using (true) with check (true);
    create policy "anon_all" on evolucoes       for all using (true) with check (true);
    create policy "anon_all" on cartoes         for all using (true) with check (true);
    create policy "anon_all" on tarefas_cartao  for all using (true) with check (true);
    create policy "anon_all" on anamneses       for all using (true) with check (true);
    create policy "anon_all" on documentos      for all using (true) with check (true);
  end if;
end $pol$;

create or replace function set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
do $trg$ begin
  if not exists (select 1 from pg_trigger where tgname='t_pac_upd') then
    create trigger t_pac_upd  before update on pacientes    for each row execute procedure set_updated_at();
    create trigger t_ag_upd   before update on agendamentos for each row execute procedure set_updated_at();
    create trigger t_cart_upd before update on cartoes      for each row execute procedure set_updated_at();
  end if;
end $trg$;

insert into configuracoes (id, dados) values ('nexopsi', '{"psicologa":{"nome":"Mariane Galani","crp":"06/XXXXX","email":"mariane@email.com","whatsapp":"5511999990000","endereco":"R. Exemplo, 123","cidade":"Jundiaí, SP"},"financeiro":{"valorSessaoPadrao":180,"metaMensalFaturamento":10000,"chavePix":"mariane@email.com"}}') on conflict (id) do nothing;

insert into pacientes (nome,avatar,nascimento,sexo,fone,cid,modalidade,local_id,perfil,valor_sessao,venc_dia,sessoes_total,devedor_total,obs)
select * from (values ('Ana Silva','AS','1991-03-15'::date,'F','5511999990001','F41.1','Presencial','aquarela','{adulto}'::text[],180::numeric,3,18,360::numeric,'Ansiedade generalizada.'),('Carla Nunes','CN','1997-07-22'::date,'F','5511999990002','','Presencial','unimed','{adulto,mulher}'::text[],200::numeric,6,12,0::numeric,''),('Marcos Lima','ML','1984-11-08'::date,'M','5511999990003','F32.0','Online','unimed','{adulto}'::text[],160::numeric,10,28,0::numeric,''),('Paula Mendes','PM','1999-07-03'::date,'F','5511999990004','','Presencial','ceped','{adulto,mulher}'::text[],220::numeric,15,8,0::numeric,''),('Rafael Costa','RC','1992-05-18'::date,'M','5511999990005','F40.1','Online','ceped','{adulto}'::text[],180::numeric,20,15,0::numeric,''),('Thiago Braga','TB','1996-02-14'::date,'M','5511999990006','','Online','aquarela','{adulto}'::text[],150::numeric,2,3,150::numeric,''),('João Pereira','JP','1980-09-30'::date,'M','5511999990007','','Presencial','aquarela','{adulto}'::text[],150::numeric,15,6,150::numeric,''),('Sofia Lima','SL','2017-04-12'::date,'F','5511999990008','F84.0','Presencial','aquarela','{crianca,neurodiverge}'::text[],190::numeric,10,10,0::numeric,'TEA nível 1.'),('Pedro Mendes','PD','2018-08-20'::date,'M','5511999990009','F90.0','Presencial','unimed','{crianca,neurodiverge}'::text[],190::numeric,15,6,0::numeric,'TDAH combinado.'),('Lúcia Ferreira','LF','1990-11-05'::date,'F','5511999990010','','Online','ceped','{supervisao}'::text[],250::numeric,25,14,0::numeric,'Supervisão quinzenal.')) as v(nome,avatar,nascimento,sexo,fone,cid,modalidade,local_id,perfil,valor_sessao,venc_dia,sessoes_total,devedor_total,obs)
where not exists (select 1 from pacientes limit 1);

insert into agendamentos (paciente_id,data,hora,tipo,modalidade,local_id,status,valor_sessao,pago)
select p.id,current_date,'09:00','Terapia Individual','Presencial','unimed','confirmado',200,true from pacientes p where p.nome='Carla Nunes' and not exists(select 1 from agendamentos limit 1) union all
select p.id,current_date,'10:00','Terapia Individual','Presencial','aquarela','confirmado',180,false from pacientes p where p.nome='Ana Silva' and not exists(select 1 from agendamentos limit 1) union all
select p.id,current_date,'14:00','Terapia Individual','Online','unimed','confirmado',160,true from pacientes p where p.nome='Marcos Lima' and not exists(select 1 from agendamentos limit 1) union all
select p.id,current_date,'16:00','Terapia Individual','Online','ceped','aguardando',180,false from pacientes p where p.nome='Rafael Costa' and not exists(select 1 from agendamentos limit 1);

insert into faturas (paciente_id,mes,valor,sessoes_count,vencimento,pago,status)
select p.id,to_char(current_date-10,'YYYY-MM'),360,2,current_date-10,false,'atrasado' from pacientes p where p.nome='Ana Silva' and not exists(select 1 from faturas limit 1) union all
select p.id,to_char(current_date-5,'YYYY-MM'),150,1,current_date-5,false,'atrasado' from pacientes p where p.nome='Thiago Braga' and not exists(select 1 from faturas limit 1);
`

// Extrai o ref do projeto da URL do Supabase
function extractProjectRef(url: string): string {
  return url.replace('https://', '').split('.')[0]
}

export async function GET() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) return NextResponse.json({ ok: false, error: 'NEXT_PUBLIC_SUPABASE_URL não configurada' }, { status: 400 })
  if (!svcKey) return NextResponse.json({ ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY não configurada na Vercel' }, { status: 400 })

  const ref = extractProjectRef(url)

  try {
    // Supabase Management API — executa SQL com privilégio total
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${svcKey}`,
      },
      body: JSON.stringify({ query: SETUP_SQL }),
    })

    const body = await res.json().catch(() => ({}))

    if (res.ok) {
      return NextResponse.json({ ok: true, status: 'setup_complete' })
    }

    return NextResponse.json({ ok: false, status: res.status, body }, { status: 500 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
