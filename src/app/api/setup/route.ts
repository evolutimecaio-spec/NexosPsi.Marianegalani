import { NextResponse } from 'next/server'

const SETUP_SQL = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS configuracoes (
  id text PRIMARY KEY DEFAULT 'nexopsi',
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pacientes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome text NOT NULL,
  avatar text DEFAULT '',
  nascimento date,
  sexo text DEFAULT '',
  cpf text DEFAULT '',
  fone text DEFAULT '',
  email text DEFAULT '',
  endereco text DEFAULT '',
  cid text DEFAULT '',
  modalidade text DEFAULT 'Presencial',
  local_id text DEFAULT 'unimed',
  perfil text[] DEFAULT '{}',
  valor_sessao numeric(10,2) DEFAULT 180,
  venc_dia int DEFAULT 10,
  sessoes_total int DEFAULT 0,
  devedor_total numeric(10,2) DEFAULT 0,
  obs text DEFAULT '',
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agendamentos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE,
  data date NOT NULL,
  hora text NOT NULL,
  tipo text DEFAULT 'Terapia Individual',
  modalidade text DEFAULT 'Presencial',
  local_id text DEFAULT '',
  status text DEFAULT 'agendado',
  valor_sessao numeric(10,2) DEFAULT 0,
  pago boolean DEFAULT false,
  obs text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faturas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE,
  mes text NOT NULL,
  valor numeric(10,2) NOT NULL,
  sessoes_count int DEFAULT 0,
  vencimento date NOT NULL,
  pago boolean DEFAULT false,
  status text DEFAULT 'aberto',
  data_pagamento date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evolucoes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE,
  data date NOT NULL DEFAULT CURRENT_DATE,
  sessao_num int,
  texto text NOT NULL,
  cid text DEFAULT '',
  gerado_luma boolean DEFAULT false,
  transcricao text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cartoes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  gerado_luma boolean DEFAULT false,
  ativo boolean DEFAULT true,
  validade text DEFAULT 'Semanal',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tarefas_cartao (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cartao_id uuid REFERENCES cartoes(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text DEFAULT '',
  feita boolean DEFAULT false,
  ordem int DEFAULT 0
);

CREATE TABLE IF NOT EXISTS anamneses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE,
  modelo text NOT NULL,
  status text DEFAULT 'enviado',
  enviado_em timestamptz DEFAULT now(),
  respondido_em timestamptz,
  respostas jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documentos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo text DEFAULT 'Documento',
  url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

DO $rls$ BEGIN
  ALTER TABLE configuracoes  ENABLE ROW LEVEL SECURITY;
  ALTER TABLE pacientes      ENABLE ROW LEVEL SECURITY;
  ALTER TABLE agendamentos   ENABLE ROW LEVEL SECURITY;
  ALTER TABLE faturas        ENABLE ROW LEVEL SECURITY;
  ALTER TABLE evolucoes      ENABLE ROW LEVEL SECURITY;
  ALTER TABLE cartoes        ENABLE ROW LEVEL SECURITY;
  ALTER TABLE tarefas_cartao ENABLE ROW LEVEL SECURITY;
  ALTER TABLE anamneses      ENABLE ROW LEVEL SECURITY;
  ALTER TABLE documentos     ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $rls$;

DO $pol$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pacientes' AND policyname='anon_all') THEN
    CREATE POLICY "anon_all" ON configuracoes   FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all" ON pacientes       FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all" ON agendamentos    FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all" ON faturas         FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all" ON evolucoes       FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all" ON cartoes         FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all" ON tarefas_cartao  FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all" ON anamneses       FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "anon_all" ON documentos      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $pol$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DO $trg$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='t_pac_upd') THEN
    CREATE TRIGGER t_pac_upd  BEFORE UPDATE ON pacientes    FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
    CREATE TRIGGER t_ag_upd   BEFORE UPDATE ON agendamentos FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
    CREATE TRIGGER t_cart_upd BEFORE UPDATE ON cartoes      FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
  END IF;
END $trg$;

INSERT INTO configuracoes (id, dados) VALUES ('nexopsi', '{"psicologa":{"nome":"Mariane Galani","crp":"06/XXXXX","email":"","whatsapp":"","endereco":"","cidade":"Jundiaí, SP"},"financeiro":{"valorSessaoPadrao":180,"metaMensalFaturamento":10000,"chavePix":""}}') ON CONFLICT (id) DO NOTHING;
`

export async function GET() {
  const dbUrl  = process.env.DATABASE_URL
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL

  // Tentar via pg (connection string direta) — mais confiável para DDL
  if (dbUrl) {
    try {
      const { Client } = await import('pg')
      const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
      await client.connect()
      await client.query(SETUP_SQL)
      await client.end()
      return NextResponse.json({ ok: true, method: 'pg' })
    } catch (e: any) {
      console.error('[setup/pg]', e.message)
    }
  }

  // Fallback: Supabase Management API com service_role
  if (svcKey && url) {
    const ref = url.replace('https://', '').split('.')[0]
    try {
      const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${svcKey}`,
        },
        body: JSON.stringify({ query: SETUP_SQL }),
      })
      if (res.ok) return NextResponse.json({ ok: true, method: 'management_api' })
      const err = await res.text()
      console.error('[setup/mgmt]', res.status, err)
    } catch (e: any) {
      console.error('[setup/mgmt]', e.message)
    }
  }

  return NextResponse.json({ ok: false, error: 'Configure DATABASE_URL ou SUPABASE_SERVICE_ROLE_KEY na Vercel' }, { status: 500 })
}
