-- ═══════════════════════════════════════════════════════════════════
-- NexxoPsi — Setup Supabase
-- Execute este SQL no SQL Editor do seu projeto Supabase:
-- https://supabase.com/dashboard/project/wltxwmcraqdskjobraoy/sql
-- ═══════════════════════════════════════════════════════════════════

-- ── Extensões ────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Limpar tabelas antigas (se re-executar) ───────────────────────
drop table if exists documentos cascade;
drop table if exists tarefas_cartao cascade;
drop table if exists cartoes cascade;
drop table if exists anamneses cascade;
drop table if exists evolucoes cascade;
drop table if exists faturas cascade;
drop table if exists agendamentos cascade;
drop table if exists pacientes cascade;
drop table if exists configuracoes cascade;

-- ═══════════════════════════════════════════════════════════════════
-- TABELA: configuracoes (1 linha por instalação)
-- ═══════════════════════════════════════════════════════════════════
create table configuracoes (
  id          text primary key default 'nexopsi',
  dados       jsonb not null default '{}'::jsonb,
  updated_at  timestamp with time zone default now()
);

insert into configuracoes (id, dados) values ('nexopsi', '{
  "psicologa": {
    "nome": "Mariane Galani",
    "crp": "06/XXXXX",
    "email": "mariane@email.com",
    "whatsapp": "5511999990000",
    "cidade": "Jundiaí, SP"
  },
  "financeiro": {
    "valorSessaoPadrao": 180,
    "metaMensalFaturamento": 10000,
    "chavePix": "mariane@email.com"
  }
}'::jsonb);

-- ═══════════════════════════════════════════════════════════════════
-- TABELA: pacientes
-- ═══════════════════════════════════════════════════════════════════
create table pacientes (
  id              uuid primary key default uuid_generate_v4(),
  nome            text not null,
  nascimento      date,
  sexo            text check (sexo in ('M','F','NB','')),
  cpf             text,
  fone            text,
  email           text,
  endereco        text,
  cid             text,
  modalidade      text default 'Presencial',
  local_id        text default 'unimed',
  perfil          text[] default '{}',
  valor_sessao    numeric(10,2) default 180,
  venc_dia        integer default 10,
  inicio          text,
  sessoes_total   integer default 0,
  devedor_total   numeric(10,2) default 0,
  ativo           boolean default true,
  obs             text,
  avatar          text,
  created_at      timestamp with time zone default now(),
  updated_at      timestamp with time zone default now()
);

-- ═══════════════════════════════════════════════════════════════════
-- TABELA: agendamentos
-- ═══════════════════════════════════════════════════════════════════
create table agendamentos (
  id              uuid primary key default uuid_generate_v4(),
  paciente_id     uuid references pacientes(id) on delete cascade,
  data            date not null,
  hora            text not null,
  tipo            text default 'Terapia Individual',
  modalidade      text default 'Presencial',
  local_id        text,
  status          text default 'agendado'
                  check (status in ('agendado','confirmado','realizado','cancelado','aguardando')),
  valor_sessao    numeric(10,2) default 180,
  pago            boolean default false,
  recorrencia_id  text,
  notas           text,
  created_at      timestamp with time zone default now(),
  updated_at      timestamp with time zone default now()
);

create index idx_agendamentos_data on agendamentos(data);
create index idx_agendamentos_paciente on agendamentos(paciente_id);

-- ═══════════════════════════════════════════════════════════════════
-- TABELA: faturas
-- ═══════════════════════════════════════════════════════════════════
create table faturas (
  id              uuid primary key default uuid_generate_v4(),
  paciente_id     uuid references pacientes(id) on delete cascade,
  mes             text not null,
  valor           numeric(10,2) not null,
  sessoes_count   integer default 1,
  vencimento      date not null,
  pago            boolean default false,
  data_pagamento  date,
  status          text default 'aberto'
                  check (status in ('aberto','pago','atrasado','cancelado')),
  created_at      timestamp with time zone default now()
);

create index idx_faturas_paciente on faturas(paciente_id);
create index idx_faturas_vencimento on faturas(vencimento);

-- ═══════════════════════════════════════════════════════════════════
-- TABELA: evolucoes
-- ═══════════════════════════════════════════════════════════════════
create table evolucoes (
  id              uuid primary key default uuid_generate_v4(),
  paciente_id     uuid references pacientes(id) on delete cascade,
  agendamento_id  uuid references agendamentos(id),
  data            date not null default current_date,
  sessao_num      integer,
  texto           text not null,
  cid             text,
  gerado_luma     boolean default false,
  transcricao     text,
  created_at      timestamp with time zone default now()
);

create index idx_evolucoes_paciente on evolucoes(paciente_id);

-- ═══════════════════════════════════════════════════════════════════
-- TABELA: cartoes (cartões terapêuticos)
-- ═══════════════════════════════════════════════════════════════════
create table cartoes (
  id              uuid primary key default uuid_generate_v4(),
  paciente_id     uuid references pacientes(id) on delete cascade,
  titulo          text not null,
  gerado_luma     boolean default false,
  ativo           boolean default true,
  validade        text default 'Semanal',
  created_at      timestamp with time zone default now(),
  updated_at      timestamp with time zone default now()
);

create table tarefas_cartao (
  id              uuid primary key default uuid_generate_v4(),
  cartao_id       uuid references cartoes(id) on delete cascade,
  titulo          text not null,
  descricao       text,
  feita           boolean default false,
  ordem           integer default 0
);

-- ═══════════════════════════════════════════════════════════════════
-- TABELA: anamneses
-- ═══════════════════════════════════════════════════════════════════
create table anamneses (
  id              uuid primary key default uuid_generate_v4(),
  paciente_id     uuid references pacientes(id) on delete cascade,
  modelo          text default 'adulto',
  status          text default 'pendente'
                  check (status in ('pendente','enviado','preenchido')),
  respostas       jsonb default '{}'::jsonb,
  enviado_em      timestamp with time zone,
  respondido_em   timestamp with time zone,
  created_at      timestamp with time zone default now()
);

-- ═══════════════════════════════════════════════════════════════════
-- TABELA: documentos
-- ═══════════════════════════════════════════════════════════════════
create table documentos (
  id              uuid primary key default uuid_generate_v4(),
  paciente_id     uuid references pacientes(id) on delete cascade,
  nome            text not null,
  tipo            text,
  url             text,
  tamanho_bytes   integer,
  created_at      timestamp with time zone default now()
);

-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY: desabilitado (app single-user via anon key)
-- ═══════════════════════════════════════════════════════════════════
alter table configuracoes  enable row level security;
alter table pacientes       enable row level security;
alter table agendamentos    enable row level security;
alter table faturas         enable row level security;
alter table evolucoes       enable row level security;
alter table cartoes         enable row level security;
alter table tarefas_cartao  enable row level security;
alter table anamneses       enable row level security;
alter table documentos      enable row level security;

-- Políticas permissivas para anon (chave pública do frontend)
create policy "allow_all_configuracoes" on configuracoes for all using (true) with check (true);
create policy "allow_all_pacientes"     on pacientes     for all using (true) with check (true);
create policy "allow_all_agendamentos"  on agendamentos  for all using (true) with check (true);
create policy "allow_all_faturas"       on faturas       for all using (true) with check (true);
create policy "allow_all_evolucoes"     on evolucoes     for all using (true) with check (true);
create policy "allow_all_cartoes"       on cartoes       for all using (true) with check (true);
create policy "allow_all_tarefas"       on tarefas_cartao for all using (true) with check (true);
create policy "allow_all_anamneses"     on anamneses     for all using (true) with check (true);
create policy "allow_all_documentos"    on documentos    for all using (true) with check (true);

-- ═══════════════════════════════════════════════════════════════════
-- TRIGGER: updated_at automático
-- ═══════════════════════════════════════════════════════════════════
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_pacientes_updated    before update on pacientes    for each row execute procedure set_updated_at();
create trigger trg_agendamentos_updated before update on agendamentos for each row execute procedure set_updated_at();
create trigger trg_cartoes_updated      before update on cartoes      for each row execute procedure set_updated_at();

-- ═══════════════════════════════════════════════════════════════════
-- DADOS DEMO (pacientes de exemplo)
-- ═══════════════════════════════════════════════════════════════════
insert into pacientes (nome, nascimento, sexo, fone, cid, modalidade, local_id, perfil, valor_sessao, venc_dia, sessoes_total, devedor_total, obs, avatar) values
('Ana Silva',    '1991-03-15', 'F', '5511999990001', 'F41.1', 'Presencial', 'aquarela',   '{adulto}',                 180, 3,  18, 360, 'Ansiedade generalizada. Paciente comprometida.', 'AS'),
('Carla Nunes',  '1997-07-22', 'F', '5511999990002', '',      'Presencial', 'unimed',     '{adulto,mulher}',          200, 6,  12, 0,   '', 'CN'),
('Marcos Lima',  '1984-11-08', 'M', '5511999990003', 'F32.0', 'Online',     'unimed',     '{adulto}',                 160, 10, 28, 0,   '', 'ML'),
('Paula Mendes', '1999-07-03', 'F', '5511999990004', '',      'Presencial', 'anhangabau', '{adulto,mulher}',          220, 15, 8,  0,   '', 'PM'),
('Rafael Costa', '1992-05-18', 'M', '5511999990005', 'F40.1', 'Online',     'anhangabau', '{adulto}',                 180, 20, 15, 0,   '', 'RC'),
('Thiago Braga', '1996-02-14', 'M', '5511999990006', '',      'Online',     'aquarela',   '{adulto}',                 150, 2,  3,  150, '', 'TB'),
('João Pereira', '1980-09-30', 'M', '5511999990007', '',      'Presencial', 'aquarela',   '{adulto}',                 150, 15, 6,  150, '', 'JP'),
('Sofia Lima',   '2017-04-12', 'F', '5511999990008', 'F84.0', 'Presencial', 'aquarela',   '{crianca,neurodiverge}',   190, 10, 10, 0,   'TEA nível 1. ABA e DIR Floortime.', 'SL'),
('Pedro Mendes', '2018-08-20', 'M', '5511999990009', 'F90.0', 'Presencial', 'unimed',     '{crianca,neurodiverge}',   190, 15, 6,  0,   'TDAH combinado. Sessões 40min.', 'PD'),
('Lúcia Ferreira','1990-11-05','F', '5511999990010', '',      'Online',     'anhangabau', '{supervisao}',             250, 25, 14, 0,   'Supervisão clínica quinzenal.', 'LF');

-- Agendamentos demo (hoje e próximos dias)
-- (serão inseridos via JS no primeiro acesso para usar datas relativas)

select 'Setup concluído! Tabelas criadas com sucesso.' as status;
