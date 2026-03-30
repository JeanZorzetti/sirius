# Sirius CRM Dual: SaaS + AgaaS na mesma base

## Context

**Visão:** O Sirius CRM ganha uma segunda face — `sirius.roilabs.com.br/IA` — que funciona como um produto separado visualmente, mas compartilha a mesma base (auth, banco, API, Prisma). O `/dashboard` atual permanece intocado para clientes que preferem operar manualmente. O `/IA` é a experiência AgaaS: futurista, clean, elegante, onde agentes autônomos operam o CRM e o humano supervisiona.

**Inspiração:** Jensen Huang (GTC 2026) — "toda empresa SaaS se tornará AgaaS". O software não morre; quem opera são agentes. O humano vira supervisor.

**Arquitetura:** Mesmo codebase Next.js, route group `(ia)` com layout/design próprio. Sofia IA como cérebro orquestrador externo chamando Sirius via API.

```
sirius.roilabs.com.br/dashboard   →  CRM tradicional (como é hoje)
sirius.roilabs.com.br/IA          →  CRM agêntico (nova face)
```

---

## IA que o Sirius tem HOJE (sem Sofia)

Tudo **reativo** — humano aciona, IA responde:

| Feature | Provider | Autônomo? |
|---------|----------|-----------|
| Chat SPIN/Sandler | Groq | Reativo |
| Análise BANT/MEDDIC | Groq | Reativo |
| Scripts (cold call, email, demo) | Groq | Reativo |
| SPIN State Machine | Determinístico | Híbrido |
| NLP Entity Extraction | Groq | Reativo |
| Graph-RAG | Groq + Graph | Reativo |
| Diagnóstico de problemas | Groq + Graph | Reativo |
| Generative UI | Groq | Semi-autônomo |
| SEO Assistant + Tavily | Groq + Tavily | Semi-autônomo |
| Guardrails | Heurísticas | Autônomo |
| Skills (BANT, métricas, funil) | Regras | Reativo |

**Zero operação autônoma do CRM.**

## O que Sofia tem que Sirius não tem

| Sofia | Gap Sirius | Pra que serve no `/IA` |
|-------|-----------|----------------------|
| Multi-agente (DAG, branching) | Agente único | Flows de qualificação + follow-up |
| Delegação agent-to-agent | Sem inter-agente | Especialistas (qualificar, agendar, enriquecer) |
| Cognitive Pipeline (3 estágios) | Prompt direto | Perfil psicológico do prospect |
| Memória persistente | Conversas efêmeras | Lembrar preferências entre sessões |
| MCP + Plugins + Skills | Só built-ins | Tools que operam o Sirius via API |
| Scheduling autônomo | Crons rule-based | Follow-up inteligente, não template |
| RAG pgvector | Keyword search | Base de conhecimento do produto |

---

## Arquitetura Dual

```
┌─────────────────────────────────────────────────────────────┐
│                      SIRIUS CRM (Next.js)                   │
│                                                             │
│  ┌──────────────────────┐   ┌────────────────────────────┐  │
│  │   /dashboard         │   │   /IA                      │  │
│  │   (CRM Tradicional)  │   │   (CRM Agêntico)           │  │
│  │                      │   │                            │  │
│  │  • Pipeline Kanban   │   │  • Agent Activity Feed     │  │
│  │  • Contatos CRUD     │   │  • Command Chat            │  │
│  │  • Analytics manual  │   │  • Pipeline com overlays   │  │
│  │  • Chat WhatsApp     │   │  • Supervisão + Aprovação  │  │
│  │  • AGI reativo       │   │  • Agent Analytics         │  │
│  │                      │   │  • Configuração de Agentes │  │
│  │  Layout: sidebar     │   │  Layout: minimal/futurista │  │
│  │  Theme: light/dark   │   │  Theme: dark-first         │  │
│  └──────────┬───────────┘   └──────────┬─────────────────┘  │
│             │                          │                    │
│  ┌──────────┴──────────────────────────┴─────────────────┐  │
│  │              CAMADA COMPARTILHADA                     │  │
│  │  Prisma · Auth · API v1 · Pusher · Entitlements       │  │
│  └──────────────────────┬────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────┘
                          │ Webhooks (eventos)
                          ▼
┌─────────────────────────┼───────────────────────────────────┐
│                    SOFIA IA (Cérebro)                        │
│                         │                                   │
│  ┌──────────┐  ┌────────┴──┐  ┌──────────┐  ┌───────────┐  │
│  │ Lead     │  │ Follow-up │  │ Meeting  │  │ Contact   │  │
│  │Qualifier │  │Coordinator│  │Scheduler │  │Enricher   │  │
│  └──────────┘  └───────────┘  └──────────┘  └───────────┘  │
│                                                             │
│  Flow Engine · Delegação · Memória · Cognitive Pipeline     │
└─────────────────────────────────────────────────────────────┘
```

---

## Fase 1: Fundação no Sirius (Semana 1-3) ✅ DONE

### 1.1 Modelo `AgentAction` no Prisma ✅

Auditoria de tudo que agentes fazem — necessário para o feed de atividade do `/IA`.

```prisma
model AgentAction {
  id             String   @id @default(uuid())
  organizationId String
  agentName      String   // "LeadQualifier", "FollowUpCoordinator"
  actionType     String   // "UPDATE_DEAL", "SEND_WHATSAPP", "CREATE_NOTE"
  entityType     String   // "Deal", "Contact"
  entityId       String
  reasoning      String   @db.Text
  confidence     Float    // 0-1
  input          Json
  output         Json?
  status         String   // SUCCESS, FAILED, PENDING, NEEDS_APPROVAL
  reviewedBy     String?  // userId que aprovou/rejeitou
  reviewedAt     DateTime?
  createdAt      DateTime @default(now())
  organization   Organization @relation(fields: [organizationId], references: [id])
  @@index([organizationId, createdAt])
  @@index([entityType, entityId])
  @@index([status])
}
```

### 1.2 Endpoints novos na API v1 (para Sofia operar) ✅

| Endpoint | Método | Descrição | Status |
|----------|--------|-----------|--------|
| `/api/v1/contacts/[id]/context` | GET | Tudo do contato: deals, notas, WhatsApp msgs, atividades, emails | ✅ |
| `/api/v1/deals/[id]/context` | GET | Deal completo: pipeline, contato, notas, histórico de estágios | ✅ |
| `/api/v1/deals/[id]/stage` | PATCH | Mover estágio (campo `movedBy: 'agent' \| 'human'`) | ✅ |
| `/api/v1/deals/[id]/notes` | POST | Criar nota (agente registra análises) | ✅ |
| `/api/v1/whatsapp/send` | POST | Enviar WhatsApp por connectionId + phone + message | ✅ |
| `/api/v1/calendar/availability` | GET | Slots livres Google Calendar do vendedor | ✅ |
| `/api/v1/calendar/book` | POST | Agendar reunião | ✅ |
| `/api/v1/agents/actions` | POST | Registrar AgentAction (log de auditoria) | ✅ |
| `/api/v1/agents/actions` | GET | Listar ações (para o feed do `/IA`) | ✅ |
| `/api/v1/agents/actions/[id]/review` | PATCH | Aprovar/rejeitar ação pendente | ✅ |

### 1.3 Webhook Dispatcher real (Sirius → Sofia) ✅

Substituir o stub em `lib/webhooks.ts` com dispatch HTTP para Sofia:

```typescript
// Eventos que Sirius dispara para Sofia
'contact.created'        // Novo contato → Sofia enriquece + qualifica
'deal.created'           // Novo deal → Sofia analisa
'deal.stage_changed'     // Estágio mudou → Sofia avalia próximos passos
'deal.idle'              // Deal parado 7+ dias → Sofia faz follow-up
'whatsapp.message.in'    // WhatsApp recebido → Sofia qualifica/responde
'note.created'           // Nova nota → Sofia analisa sentimento
```

Config: `SOFIA_WEBHOOK_URL` + `SOFIA_WEBHOOK_SECRET` nas env vars.

### Arquivos afetados (Fase 1)

| Arquivo | Ação | Status |
|---------|------|--------|
| `prisma/schema.prisma` | ADD model AgentAction | ✅ |
| `app/api/v1/contacts/[id]/context/route.ts` | CRIAR | ✅ |
| `app/api/v1/deals/[id]/context/route.ts` | CRIAR | ✅ |
| `app/api/v1/deals/[id]/stage/route.ts` | CRIAR | ✅ |
| `app/api/v1/deals/[id]/notes/route.ts` | CRIAR | ✅ |
| `app/api/v1/whatsapp/send/route.ts` | CRIAR | ✅ |
| `app/api/v1/calendar/availability/route.ts` | CRIAR | ✅ |
| `app/api/v1/calendar/book/route.ts` | CRIAR | ✅ |
| `app/api/v1/agents/actions/route.ts` | CRIAR | ✅ |
| `app/api/v1/agents/actions/[id]/review/route.ts` | CRIAR | ✅ |
| `lib/webhooks.ts` | MODIFICAR — dispatch HTTP real | ✅ |
| `middleware.ts` | MODIFICAR — proteger `/IA` routes | ✅ |

---

## Fase 2: Interface `/IA` no Sirius (Semana 3-6) ✅ DONE

### 2.1 Route Group `(ia)` ✅

```
app/
└── (ia)/
    ├── layout.tsx              # Layout futurista, dark-first, minimal       ✅
    ├── IA/
    │   ├── page.tsx            # Feed de atividade dos agentes (home)        ✅
    │   ├── pipeline/
    │   │   └── page.tsx        # Pipeline com overlays de agente             ✅
    │   ├── command/
    │   │   └── page.tsx        # Chat/command interface                      ✅
    │   ├── agents/
    │   │   └── page.tsx        # Configuração de agentes                     ✅
    │   ├── analytics/
    │   │   └── page.tsx        # Performance dos agentes                     ✅
    │   └── settings/
    │       └── page.tsx        # Thresholds, aprovações, limites             ✅
```

### 2.2 Design Language — `/IA`

**Filosofia:** Oposto do dashboard atual. Menos é mais. O agente faz, o humano observa.

| Aspecto | `/dashboard` (atual) | `/IA` (novo) |
|---------|---------------------|--------------|
| Theme | Light-first, sidebar lateral | Dark-first, navegação top/minimal |
| Layout | Sidebar + content area | Full-width, cards flutuantes |
| Interação | Formulários, tabelas, botões | Feed em tempo real, chat, gestos |
| Densidade | Alta (muitos dados) | Baixa (só o essencial) |
| Cor primária | Indigo (#4338ca) | Gradiente cyan→violet ou neon |
| Tipografia | Geist Sans regular | Geist Sans light/thin |
| Animações | Subtis (fade) | Cinéticas (spring, glow, pulse) |
| Sensação | "Planilha inteligente" | "Cockpit de controle" |

**Referências visuais:** Linear App, Vercel Dashboard, Apple Intelligence, Framer.

### 2.3 Páginas do `/IA`

#### Home — Agent Activity Feed (`/IA`)
```
┌─────────────────────────────────────────────────┐
│  ● Sirius IA                    [Modo Manual ↗] │
├─────────────────────────────────────────────────┤
│                                                 │
│  AGORA                                          │
│  ┌─────────────────────────────────────────┐    │
│  │ 🤖 LeadQualifier qualificou João Silva  │    │
│  │    BANT: 82/100 · Confiança: 0.91      │    │
│  │    → Criou deal "Empresa X" no pipeline │    │
│  │    [Ver raciocínio] [Reverter]          │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  HÁ 12 MIN                                     │
│  ┌─────────────────────────────────────────┐    │
│  │ 🤖 FollowUpCoordinator enviou WhatsApp  │    │
│  │    para Maria Souza (deal parado 9 dias)│    │
│  │    "Olá Maria, notei que..." [preview]  │    │
│  │    [Ver raciocínio] [Aprovar] [Rejeitar]│    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  PENDENTE APROVAÇÃO (2)                         │
│  ┌─────────────────────────────────────────┐    │
│  │ ⏳ MeetingScheduler quer agendar reunião│    │
│  │    com Pedro Lima · Qua 14h ou Qui 10h  │    │
│  │    Confiança: 0.68 (abaixo do threshold)│    │
│  │    [Aprovar] [Editar horário] [Rejeitar]│    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ─── RESUMO HOJE ───────────────────────────    │
│  12 ações · 3 deals qualificados · 5 follow-ups│
│  2 pendentes · 0 falhas · R$ 45k pipeline novo  │
└─────────────────────────────────────────────────┘
```

#### Command Chat (`/IA/command`)
Interface conversacional para dar comandos aos agentes:
```
> "Qualifique todos os leads que entraram hoje"
> "Faça follow-up nos deals parados há mais de 5 dias"
> "Mostre a análise SPIN do deal com a Empresa Y"
> "Agende reunião com o contato João para semana que vem"
```

Usa a IA do Sirius (Groq) + dispara ações via Sofia.

#### Pipeline Overlay (`/IA/pipeline`)
Mesmo pipeline Kanban do `/dashboard`, mas com overlays:
- Badge de confiança do agente em cada deal
- Sugestões de próximo passo sobrepostas
- Deals movidos por agente têm borda diferente (cyan glow)
- Tooltip com raciocínio do agente ao hover

#### Agent Analytics (`/IA/analytics`)
- Deals qualificados por agente vs. humano (gráfico)
- Tempo médio de resposta do agente
- Taxa de acerto (ações aprovadas vs. rejeitadas)
- Tokens/custo por agente
- ROI estimado (tempo economizado × custo hora vendedor)

#### Agent Settings (`/IA/settings`)
- Toggle on/off por agente
- Threshold de confiança (abaixo = requer aprovação)
- Limites de ações por dia
- Canais permitidos (WhatsApp, email)
- Horários de operação

### 2.4 Navegação entre modos ✅

- No `/dashboard` sidebar: link sutil "✦ Modo IA" no topo ✅
- No `/IA` header: link "Modo Manual ↗" para voltar ao dashboard ✅
- Mesma sessão, mesmo user, mesmos dados — só muda a interface ✅

---

## Fase 3: Agentes Sofia operando o Sirius (Semana 6-9) ✅ DONE

### 3.1 Tools na Sofia para Sirius ✅

Criado `src/lib/tools/sirius-tools.ts` na Sofia com 8 tools OpenAI-format:

| Tool | Endpoint | Status |
|------|----------|--------|
| `sirius_get_contact_context` | GET /api/v1/contacts/:id/context | ✅ |
| `sirius_get_deal_context` | GET /api/v1/deals/:id/context | ✅ |
| `sirius_update_deal_stage` | PATCH /api/v1/deals/:id/stage | ✅ |
| `sirius_add_deal_note` | POST /api/v1/deals/:id/notes | ✅ |
| `sirius_send_whatsapp` | POST /api/v1/whatsapp/send | ✅ |
| `sirius_check_calendar` | GET /api/v1/calendar/availability | ✅ |
| `sirius_book_meeting` | POST /api/v1/calendar/book | ✅ |
| `sirius_log_action` | POST /api/v1/agents/actions | ✅ |

### 3.2 Agentes a criar na Sofia ✅

| Agente | Trigger | Status |
|--------|---------|--------|
| **LeadQualifier** | `whatsapp.message.in` + `contact.created` | ✅ seed criado |
| **FollowUpCoordinator** | `deal.idle` | ✅ seed criado |
| **DealStageAnalyzer** | `note.created` + `whatsapp.message.in` + `deal.created` | ✅ seed criado |
| **MeetingScheduler** | Delegação | ✅ seed criado |
| **ContactEnricher** | `contact.created` | ✅ seed criado |

### 3.3 Flow: Nova Mensagem WhatsApp (exemplo)

```
WhatsApp msg → Sirius webhook → Sofia
  → LeadQualifier:
      1. sirius_get_contact_context(phone)
      2. Se contato novo: sirius_create_contact(data)
      3. Cognitive Pipeline: perfil psicológico + estratégia
      4. BANT qualification (3-4 perguntas SPIN via WhatsApp)
      5. Se score >= 75:
          → DELEGATE → MeetingScheduler
          → sirius_update_deal_stage(dealId, 'Qualified')
      6. Se score < 75:
          → sirius_send_whatsapp(nurture message)
          → save_memory(lead preferences)
      7. sirius_log_action(reasoning, confidence, result)
```

### 3.4 Webhook receiver na Sofia

Novo endpoint na Sofia: `POST /api/webhooks/sirius`
- Recebe eventos do Sirius (contact.created, deal.idle, etc.)
- Roteia para o agente correto via Flow Engine
- Auth: `SIRIUS_WEBHOOK_SECRET` header

### 3.5 Detalhamento: sirius-tools.ts

Cada tool é uma função que chama a API v1 do Sirius com Bearer token:

```typescript
// src/lib/tools/sirius-tools.ts (Sofia)
import { z } from 'zod'

const SIRIUS_API_URL = process.env.SIRIUS_API_URL // https://sirius.roilabs.com.br
const SIRIUS_API_KEY = process.env.SIRIUS_API_KEY // API key da organização

async function siriusRequest(method: string, path: string, body?: any) {
  const res = await fetch(`${SIRIUS_API_URL}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${SIRIUS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

export const siriusTools = {
  sirius_get_contact_context: {
    description: 'Busca contexto completo de um contato: deals, notas, WhatsApp, tags',
    parameters: z.object({ contactId: z.string().uuid() }),
    execute: async ({ contactId }) => siriusRequest('GET', `/api/v1/contacts/${contactId}/context`),
  },
  sirius_get_deal_context: {
    description: 'Busca contexto completo de um deal: pipeline, estágios, notas, atividades, WhatsApp',
    parameters: z.object({ dealId: z.string().uuid() }),
    execute: async ({ dealId }) => siriusRequest('GET', `/api/v1/deals/${dealId}/context`),
  },
  sirius_update_deal_stage: {
    description: 'Move deal para outro estágio do pipeline. Registra motivo.',
    parameters: z.object({
      dealId: z.string().uuid(),
      stageId: z.string().uuid(),
      reason: z.string().optional(),
    }),
    execute: async ({ dealId, stageId, reason }) =>
      siriusRequest('PATCH', `/api/v1/deals/${dealId}/stage`, { stageId, movedBy: 'agent', reason }),
  },
  sirius_add_deal_note: {
    description: 'Adiciona nota em um deal. Usado para registrar análises e observações.',
    parameters: z.object({
      dealId: z.string().uuid(),
      content: z.string(),
      authorName: z.string().optional(),
    }),
    execute: async ({ dealId, content, authorName }) =>
      siriusRequest('POST', `/api/v1/deals/${dealId}/notes`, { content, authorName }),
  },
  sirius_send_whatsapp: {
    description: 'Envia mensagem WhatsApp para um número via conexão Evolution API.',
    parameters: z.object({
      connectionId: z.string().uuid(),
      phone: z.string(),
      message: z.string(),
    }),
    execute: async (params) => siriusRequest('POST', '/api/v1/whatsapp/send', params),
  },
  sirius_check_calendar: {
    description: 'Verifica slots disponíveis no Google Calendar da organização.',
    parameters: z.object({
      startDate: z.string(),
      endDate: z.string(),
      durationMinutes: z.number().optional(),
    }),
    execute: async ({ startDate, endDate, durationMinutes }) =>
      siriusRequest('GET', `/api/v1/calendar/availability?startDate=${startDate}&endDate=${endDate}${durationMinutes ? `&durationMinutes=${durationMinutes}` : ''}`),
  },
  sirius_book_meeting: {
    description: 'Agenda reunião no calendário, opcionalmente vinculada a um deal.',
    parameters: z.object({
      title: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      dealId: z.string().uuid().optional(),
      description: z.string().optional(),
    }),
    execute: async (params) => siriusRequest('POST', '/api/v1/calendar/book', params),
  },
  sirius_log_action: {
    description: 'Registra ação do agente para auditoria e feed do /IA.',
    parameters: z.object({
      agentName: z.string(),
      actionType: z.string(),
      entityType: z.string(),
      entityId: z.string(),
      reasoning: z.string(),
      confidence: z.number(),
      input: z.any(),
      output: z.any().optional(),
    }),
    execute: async (params) => siriusRequest('POST', '/api/v1/agents/actions', params),
  },
}
```

### 3.6 Detalhamento: Webhook receiver na Sofia

```typescript
// src/app/api/webhooks/sirius/route.ts (Sofia)
import crypto from 'crypto'

const SIRIUS_WEBHOOK_SECRET = process.env.SIRIUS_WEBHOOK_SECRET

function verifySignature(body: string, signature: string): boolean {
  const expected = crypto.createHmac('sha256', SIRIUS_WEBHOOK_SECRET!)
    .update(body).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

// Mapa: evento → agente que deve processar
const EVENT_ROUTING: Record<string, string[]> = {
  'contact.created':      ['ContactEnricher', 'LeadQualifier'],
  'whatsapp.message.in':  ['LeadQualifier', 'DealStageAnalyzer'],
  'deal.idle':            ['FollowUpCoordinator'],
  'deal.stage_changed':   ['DealStageAnalyzer'],
  'note.created':         ['DealStageAnalyzer'],
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-sirius-signature')
  const event = request.headers.get('x-sirius-event')

  if (!signature || !verifySignature(body, signature)) {
    return new Response('Invalid signature', { status: 401 })
  }

  const payload = JSON.parse(body)
  const agents = EVENT_ROUTING[event || ''] || []

  // Despachar para cada agente via Flow Engine
  for (const agentName of agents) {
    await dispatchToAgent(agentName, {
      event,
      organizationId: payload.organizationId,
      data: payload.payload,
    })
  }

  return new Response('OK', { status: 200 })
}
```

### 3.7 Env vars necessárias (Sofia)

```env
# API do Sirius para tools
SIRIUS_API_URL=https://sirius.roilabs.com.br
SIRIUS_API_KEY=<API key gerada no dashboard Sirius por organização>

# Webhook verification
SIRIUS_WEBHOOK_SECRET=<mesmo valor de SOFIA_WEBHOOK_SECRET no Sirius>
```

### Arquivos afetados (Sofia)

| Arquivo | Ação |
|---------|------|
| `src/lib/tools/sirius-tools.ts` | CRIAR — 8 tools para API Sirius |
| `src/app/api/webhooks/sirius/route.ts` | CRIAR — receiver com HMAC + routing |
| Agents (via dashboard Sofia) | CRIAR — 5 agentes especializados |
| Flows (via dashboard Sofia) | CRIAR — orquestrações com delegação |

### Ordem de implementação (Fase 3)

1. Criar `sirius-tools.ts` na Sofia + testar cada tool individualmente
2. Criar webhook receiver + verificar HMAC end-to-end
3. Criar agente `ContactEnricher` (mais simples, baixo risco)
4. Criar agente `LeadQualifier` com flow BANT
5. Criar agente `FollowUpCoordinator` com cron `deal.idle`
6. Criar agente `DealStageAnalyzer` com análise de sentimento
7. Criar agente `MeetingScheduler` com delegação

---

## Fase 4: Pricing AgaaS (Semana 9-10) ✅ DONE

### 4.1 Modelo dual de cobrança ✅

O `/dashboard` mantém pricing atual. O `/IA` adiciona camada de "agentes".

| Plano | Dashboard (SaaS) | + IA (AgaaS) |
|-------|------------------|--------------|
| FREE | 1 user, 100 contacts | 0 agentes (só visualiza o feed) |
| STARTER | 3 users, R$49 | 1 agente, 100 ações/mês |
| PRO | 10 users, R$97 | 3 agentes, 500 ações/mês |
| BUSINESS | 50 users, R$149 | Agentes ilimitados, ações ilimitadas |

Ação = qualquer operação autônoma (enviar WhatsApp, mover deal, criar nota).

### 4.2 Implementação técnica do billing AgaaS ✅

#### Prisma — novos campos em Organization ✅

```prisma
// Adicionado ao model Organization
agaasEnabled        Boolean  @default(false)
agaasAgentLimit     Int      @default(0)   // 0=free, 1=starter, 3=pro, -1=unlimited
agaasMonthlyQuota   Int      @default(0)   // Ações/mês permitidas (0=free)
agaasActionsUsed    Int      @default(0)   // Contador reset mensal
agaasQuotaResetAt   DateTime?              // Próximo reset
```

#### Middleware de quota (antes de cada ação do agente) ✅

```typescript
// lib/agaas-quota.ts
export async function checkAgaasQuota(organizationId: string): Promise<{
  allowed: boolean
  remaining: number
  reason?: string
}> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      agaasEnabled: true,
      agaasMonthlyQuota: true,
      agaasActionsUsed: true,
      agaasQuotaResetAt: true,
    }
  })

  if (!org?.agaasEnabled) return { allowed: false, remaining: 0, reason: 'AgaaS not enabled' }
  if (org.agaasMonthlyQuota === -1) return { allowed: true, remaining: Infinity } // BUSINESS

  // Auto-reset mensal
  if (org.agaasQuotaResetAt && new Date() > org.agaasQuotaResetAt) {
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        agaasActionsUsed: 0,
        agaasQuotaResetAt: nextMonthDate(),
      }
    })
    return { allowed: true, remaining: org.agaasMonthlyQuota }
  }

  const remaining = org.agaasMonthlyQuota - org.agaasActionsUsed
  return { allowed: remaining > 0, remaining, reason: remaining <= 0 ? 'Monthly quota exceeded' : undefined }
}

export async function incrementAgaasUsage(organizationId: string) {
  await prisma.organization.update({
    where: { id: organizationId },
    data: { agaasActionsUsed: { increment: 1 } }
  })
}
```

#### Entrypoint no POST /api/v1/agents/actions ✅

Antes de registrar a ação, verificar quota:

```typescript
const quota = await checkAgaasQuota(context.organizationId)
if (!quota.allowed) {
  return NextResponse.json(apiResponse(context.requestId, undefined, {
    code: 'QUOTA_EXCEEDED',
    message: quota.reason || 'AgaaS quota exceeded',
  }), { status: 429 })
}
// ... criar ação ...
await incrementAgaasUsage(context.organizationId)
```

#### UI — `/IA/settings` badge de usage ✅

Implementado no topo do settings com barra de progresso colorida:
- Cyan (<70%), Amber (70-90%), Red (>90%)
- Countdown de renovação em dias
- Alerta "Cota esgotada" com link de Upgrade quando `used >= quota`

### 4.3 Mercado Pago — upgrade flow ⏳ PENDENTE

Reutilizar o checkout flow existente (`lib/mercado-pago.ts`), adicionando `agaas_tier` ao metadata do pagamento. O webhook de subscription atualiza os campos `agaas*` na Organization.

> **Nota:** A infraestrutura de quota e gating está pronta. A integração com Mercado Pago para upgrade automático via payment webhook será feita quando houver demanda real.

### 4.4 Gating no `/IA` ✅

| Página | FREE | STARTER | PRO | BUSINESS | Status |
|--------|------|---------|-----|----------|--------|
| `/IA` (feed) | Visualiza, sem ações | Visualiza + aprova | Full | Full | ✅ |
| `/IA/pipeline` | Read-only | Read-only | Full | Full | ✅ (já era read-only) |
| `/IA/command` | Bloqueado | 1 agente | 3 agentes | Todos | ⏳ |
| `/IA/agents` | Todos off, sem toggle | 1 toggle | 3 toggles | Todos | ✅ |
| `/IA/analytics` | Últimas 24h | 7 dias | 30 dias | Ilimitado | ⏳ |
| `/IA/settings` | Apenas visualiza | Edita | Edita | Edita | ✅ |

### Arquivos afetados (Fase 4)

| Arquivo | Ação | Status |
|---------|------|--------|
| `prisma/schema.prisma` | ADD campos `agaas*` + `iaConfig` em Organization | ✅ |
| `lib/agaas-quota.ts` | CRIAR — check + increment + auto-reset + TIER_LIMITS | ✅ |
| `app/api/ia/quota/route.ts` | CRIAR — endpoint session-based para UI | ✅ |
| `app/api/ia/settings/route.ts` | CRIAR — GET/PUT iaConfig via session auth | ✅ |
| `app/api/v1/agents/actions/route.ts` | MODIFICAR — quota check (429) + increment | ✅ |
| `components/ia/ia-agents.tsx` | REESCREVER — tier gating, Lock, upgrade banners | ✅ |
| `components/ia/ia-settings.tsx` | REESCREVER — usage badge, progress bar, quota alerts | ✅ |
| `components/ia/ia-feed.tsx` | MODIFICAR — FREE banner, conditional approve/reject | ✅ |
| `lib/mercado-pago.ts` | MODIFICAR — metadata agaas_tier | ⏳ |

---

## Registro de Implementação

### Commits

| Commit | Fase | Resumo |
|--------|------|--------|
| `eaa062b` | Fase 1 | AgentAction model, 10 endpoints API v1, webhook dispatcher HMAC-SHA256, middleware `/IA` |
| `99a5552` | Fase 2 | 6 páginas `/IA`, layout dark-first, navbar animada, feed approve/reject, pipeline overlays, command chat, agents config, analytics, settings |
| `044324c` | Fase 3 | sirius-tools.ts (8 tools), webhook receiver HMAC-SHA256, seed script 5 agentes (Sofia repo) |
| `be91ad0` | Fase 3.1 | Persistência de toggles e settings (iaConfig JSON, /api/ia/settings) |
| `ced239b` | Fase 4 | Pricing AgaaS: quota system, tier gating, usage badges, TIER_LIMITS, auto-reset mensal |

### Arquivos criados além do plano original

| Arquivo | Motivo |
|---------|--------|
| `app/api/ia/actions/[id]/review/route.ts` | Review via session auth (o feed `/IA` não tem Bearer token, precisa de rota interna) |
| `components/ia/ia-navbar.tsx` | Navbar top com navegação animada (framer-motion layoutId), logo Sirius IA, link "Dashboard ↗" |
| `components/ia/agent-action-card.tsx` | Card reutilizável: avatar do agente, confidence badge, status, reasoning expandível, botões aprovar/rejeitar/reverter |
| `components/ia/ia-feed.tsx` | Feed client component: stats, filtros por agente/status, grupos por tempo, empty state |
| `components/ia/ia-pipeline.tsx` | Kanban read-only com overlays de agente (cyan glow, confidence, reasoning tooltip) |
| `components/ia/ia-command.tsx` | Chat interface com sugestões, placeholder para conexão Sofia Fase 3 |
| `components/ia/ia-agents.tsx` | 5 agentes configuráveis com toggle, capabilities, triggers |
| `components/ia/ia-analytics.tsx` | Métricas agregadas, bar charts animados por agente, approval rate |
| `components/ia/ia-settings.tsx` | Threshold slider, limites diários, horário de operação, canais, usage badge |
| `app/api/ia/quota/route.ts` | Endpoint session-based para UI consultar tier/uso/limites (Fase 4) |
| `app/api/ia/settings/route.ts` | GET/PUT iaConfig da organização via session auth (Fase 3.1) |
| `lib/agaas-quota.ts` | checkAgaasQuota + incrementAgaasUsage + TIER_LIMITS + auto-reset (Fase 4) |

### Env vars necessárias (Fase 1)

```env
# Webhook dispatcher Sirius → Sofia
SOFIA_WEBHOOK_URL=https://sofiaia.roilabs.com.br/api/webhooks/sirius
SOFIA_WEBHOOK_SECRET=<gerar com openssl rand -base64 32>
```

### Migrations ✅

- `AgentAction` model: migrado via `prisma migrate dev --name add_agent_action` (2026-03-28)
- Campos `agaas*` + `iaConfig` em Organization: aplicados via `prisma db push` (2026-03-28)

---

## O que NÃO muda

- `/dashboard` inteiro — zero alterações
- Schema Prisma existente (apenas ADD AgentAction + campos agaas* em Organization)
- Blog, SEO, marketing pages
- WhatsApp Evolution, Mercado Pago, integrações existentes
- Planos e monetização atuais (coexistem)
- AI reativa do Sirius (chat SPIN, análise) — continua funcionando

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Agente envia WhatsApp errado | Threshold de confiança → ações com < 0.7 requerem aprovação humana |
| Agente move deal errado | Reversão 1-click no feed + log completo + notificação |
| Custo Groq explode | Rate limiting per-org + quota mensal + alertas no `/IA/analytics` |
| Sofia fora do ar | Sirius funciona 100% sem Sofia (modo manual via `/dashboard`) |
| UX confusa entre dois modos | Toggle claro, não forçar migração, preservar tudo do `/dashboard` |

## Verificação

1. **Dual access:** Login → `/dashboard` funciona como antes. Clicar "Modo IA" → `/IA` com layout futurista
2. **Agent feed:** `/IA` mostra feed em tempo real de AgentActions (via Pusher ou polling)
3. **Approval flow:** Ação com confiança < 0.7 aparece como "Pendente" → humano aprova/rejeita
4. **WhatsApp autônomo:** Enviar msg para número Sirius → Sofia qualifica → deal aparece no pipeline
5. **Follow-up:** Deal parado 7 dias → Sofia envia follow-up personalizado → aparece no feed
6. **Reversão:** Clicar "Reverter" numa ação → deal volta ao estado anterior
7. **Analytics:** `/IA/analytics` mostra ações/dia, taxa de aprovação, custo, ROI
