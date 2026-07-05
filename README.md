# NexxoPsi — Sistema de Gestão Clínica

Sistema full-stack para psicólogas, construído com Next.js 14 + TypeScript + Supabase + Tailwind CSS.

## Páginas

| Rota | Descrição |
|------|-----------|
| `/dashboard` | Painel com métricas, agenda do dia, alertas e aniversariantes |
| `/agenda` | Grade semanal interativa com modal de agendamento |
| `/prontuario` | Lista de pacientes + evoluções, financeiro, cartões e documentos |
| `/smartnotes` | Gravação de sessão + transcrição + geração de evolução pela LUMA |
| `/anamnese` | Envio de fichas de anamnese por WhatsApp |
| `/cartoes` | Cartões terapêuticos com checklist e adesão |
| `/alertas` | Alertas de inadimplência e vencimentos |
| `/financeiro` | Controle financeiro e cobranças |
| `/relatorios` | Relatórios com gráficos + exportação CSV e PDF |
| `/whatsapp` | Templates de mensagens com preview |
| `/usuarios` | Gerenciamento de usuários e perfis |
| `/config` | Configurações do sistema |

## Setup

### 1. Banco de dados (Supabase)

1. Acesse: `https://supabase.com/dashboard/project/wltxwmcraqdskjobraoy/sql`
2. Cole o conteúdo de `SETUP.sql` e clique em **Run**

### 2. Variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://wltxwmcraqdskjobraoy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=cole_sua_anon_key_aqui
```

A Anon Key está em: **Supabase Dashboard → Settings → API → Project API keys → anon public**

### 3. Rodar local

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000

**Senha de acesso:** `mariane2025`

### 4. Deploy (Vercel)

```bash
npx vercel --prod
```

Adicione as variáveis de ambiente no dashboard da Vercel.

## Stack

- **Next.js 14** — App Router, Server Components
- **TypeScript** — tipagem completa
- **Supabase** — banco PostgreSQL + auth
- **Tailwind CSS** — utilitários
- **Recharts** — gráficos
- **Lucide Icons + Tabler Icons** — ícones
