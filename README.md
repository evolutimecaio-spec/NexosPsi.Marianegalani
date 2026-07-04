# NexxoPsi — Sistema de Gestão Clínica

Sistema completo para gestão de consultório psicológico.

## Estrutura do projeto

```
nexopsi/
├── index.html          # Arquivo principal
├── assets/
│   ├── logo-full.png   # Logo completo NexxoPsi
│   └── logo-icon.png   # Ícone (sidebar e favicon)
├── css/
│   ├── base.css        # Variáveis, reset, layout principal
│   ├── components.css  # Métricas, alertas, badges, sessões
│   ├── agenda.css      # Grade semanal da agenda
│   ├── prontuario.css  # Lista de pacientes e timeline
│   ├── smartnotes.css  # Gravador e LUMA IA
│   ├── anamnese.css    # Formulários de anamnese
│   ├── cartoes.css     # Cartões terapêuticos
│   ├── financeiro.css  # Pacotes, recibos, inadimplência
│   ├── whatsapp.css    # Preview de mensagens
│   ├── modals.css      # Modais e toast
│   ├── login.css       # Tela de login
│   └── responsive.css  # Mobile (breakpoint 768px)
└── js/
    ├── nav.js          # Navegação entre views
    ├── auth.js         # Login, logout, sessão 8h
    ├── mobile.js       # Hamburger, sidebar, bottom nav
    ├── pacientes.js    # Lista e seleção de pacientes
    ├── prontuario.js   # Abas internas e evoluções
    ├── smartnotes.js   # Gravador, timer, LUMA
    ├── agenda.js       # Semanas, agendamentos
    ├── anamnese.js     # Envio de formulários
    ├── cartoes.js      # Tarefas e adesão
    ├── financeiro.js   # Recibos e inadimplência
    ├── whatsapp.js     # Geração de links wa.me
    ├── alertas.js      # Sistema de alertas por data
    ├── modals.js       # Modais de cadastro
    ├── charts.js       # Gráficos Chart.js
    └── config.js       # Configurações
```

## Acesso

**Senha padrão:** `mariane2025`

Para alterar, gere o hash SHA-256 da nova senha e substitua
a constante `HASH_CORRETO` em `js/auth.js`.

## Como hospedar

### Netlify (grátis, recomendado)
1. Acesse netlify.com → "Add new site" → "Deploy manually"
2. Arraste a pasta `nexopsi/` inteira
3. Pronto — URL gerada instantaneamente

### Vercel (grátis)
```bash
npm i -g vercel
cd nexopsi
vercel --prod
```

### GitHub Pages (grátis)
1. Crie repositório no GitHub
2. Faça upload da pasta nexopsi/
3. Settings → Pages → Branch: main → Save

### Servidor próprio (Apache/Nginx)
Copie a pasta nexopsi/ para a raiz do servidor web.
Nenhuma configuração especial necessária — é HTML/CSS/JS puro.

## Funcionalidades

- **Login** com senha + sessão de 8 horas
- **Painel** com agenda do dia, alertas e aniversariantes
- **Agenda** semanal presencial/online
- **Prontuários** com linha do tempo clínica e CID
- **Smart Notes / LUMA** — gravação + transcrição + IA
- **Anamneses** digitais enviadas ao paciente
- **Cartões terapêuticos** entre sessões
- **Alertas financeiros** automáticos (7, 3, 1 dia e vencimento)
- **Lembretes de sessão** para o dia anterior
- **WhatsApp** — geração de links wa.me com mensagem pronta
- **Financeiro** — pacotes, recibos PDF, inadimplência
- **Responsivo** — mobile-first com bottom navigation

## Senha
**Senha atual:** `mariane2025`

Para trocar: abra `js/auth.js`, localize `HASH_CORRETO` e
substitua pelo SHA-256 da nova senha.
Gerador: https://emn178.github.io/online-tools/sha256.html
