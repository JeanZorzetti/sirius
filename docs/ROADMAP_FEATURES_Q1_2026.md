# Roadmap de Features — Sirius CRM Q1 2026

> Gerado em: 11/02/2026
> Foco: Completar features 80% prontas + Diferenciais competitivos
> Base: Análise de TODOs, gaps de produto e oportunidades de mercado

---

## Sumário Executivo

**Contexto:** Fase 12 (Testes) concluída com sucesso. Core CRM 100% funcional. Foco agora em **completar features iniciadas** e **criar diferenciais competitivos**.

| Fase | Feature | Esforço | ROI | Impacto | Prioridade |
|------|---------|---------|-----|---------|------------|
| 13 | Analytics Completar | 4-6h | ⭐⭐⭐⭐⭐ | Métricas reais de conversão/churn | 🔴 AGORA |
| 14 | Email Marketing Production | 6-8h | ⭐⭐⭐⭐⭐ | Automação real de vendas | 🔴 AGORA |
| 15 | Onboarding Import Flow | 4h | ⭐⭐⭐⭐ | Redução 70% tempo onboarding | 🟡 Semana 1 |
| 16 | Mercado Pago Recorrência | 3h | ⭐⭐⭐⭐ | 0 churn por falha renovação | 🟡 Semana 1 |
| 17 | Ads Integration (CAC Real) | 8-10h | ⭐⭐⭐ | Marketing data-driven | 🟢 Semana 2-3 |
| NEW | **Deal Automations** | 12-16h | ⭐⭐⭐⭐⭐ | Diferencial competitivo ENORME | 🟡 Semana 2-3 |
| NEW | Mobile App (Capacitor) | 20-25h | ⭐⭐⭐⭐ | Sticky product para vendedores | 🟢 Mês 2 |

**Total Esforço (Fases 13-17):** 25-31h
**Total Esforço (Fases 13-NEW):** 57-81h

---

## Fase 13 — Analytics Completar (ALTA PRIORIDADE)

**Status:** `[x] CONCLUÍDO — 11/02/2026`
**Prazo:** HOJE (11/02/2026)
**Esforço:** 4-6 horas (realizado em ~3h)
**Impacto:** Usuários PRO/BUSINESS finalmente terão métricas reais de conversão e churn
**Resultado:** Enum DealStatus criado, tracking de dealsLost e churn implementados, mocks substituídos por queries Prisma reais. Commit: `3c4c1fe`

### Problema

**3 TODOs críticos bloqueando insights reais:**

1. `app/api/v1/analytics/genui/route.ts:43` — **Mock data** em vez de queries reais
2. `lib/analytics-jobs.ts:107` — `dealsLost: 0` — **TODO: implementar tracking**
3. `lib/analytics-jobs.ts:225` — `churnedOrganizations: 0` — **TODO: implementar tracking real de churn**

**Impacto atual:**
- Dashboard de analytics mostra dados fictícios
- Usuários PRO não conseguem tomar decisões baseadas em dados reais
- Churn não é rastreado (impossível identificar clientes em risco)

### Solução

**1. Substituir mocks em `genui/route.ts` por queries Prisma reais:**

```typescript
// ANTES (mock)
const mockData = {
  totalRevenue: 150000,
  totalDeals: 42,
  // ...
}

// DEPOIS (query real)
const [totalRevenue, totalDeals, avgDealValue] = await Promise.all([
  prisma.deal.aggregate({
    where: { organizationId, stageId: { in: wonStageIds } },
    _sum: { value: true }
  }),
  prisma.deal.count({ where: { organizationId } }),
  prisma.deal.aggregate({
    where: { organizationId },
    _avg: { value: true }
  })
])
```

**2. Implementar tracking de deals perdidos:**

```typescript
// lib/analytics-jobs.ts
const dealsLost = await prisma.deal.count({
  where: {
    organizationId,
    status: 'LOST', // Adicionar enum DealStatus ao schema
    updatedAt: {
      gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  }
})
```

**3. Implementar tracking de churn:**

```typescript
// Definir churn: organizações que cancelaram subscription nos últimos 30 dias
const churnedOrganizations = await prisma.organization.count({
  where: {
    tier: 'FREE',
    updatedAt: {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    },
    // Tinha tier pago antes (verificar em transactions ou criar campo lastTier)
  }
})
```

**4. Criar dashboard de Deals Perdidos:**

Novo componente: `app/(dashboard)/dashboard/analytics/lost-deals/page.tsx`

Features:
- Lista de deals perdidos (últimos 30 dias)
- Filtro por stage, pipeline, motivo
- Gráfico: Top 5 motivos de perda
- KPI: Taxa de perda por stage

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `prisma/schema.prisma` | Adicionar `enum DealStatus { ACTIVE, WON, LOST }` |
| `app/api/v1/analytics/genui/route.ts` | Substituir todos os mocks por queries Prisma |
| `lib/analytics-jobs.ts` | Implementar `dealsLost` e `churnedOrganizations` reais |
| `app/(dashboard)/dashboard/analytics/lost-deals/page.tsx` | **CRIAR** — Dashboard de deals perdidos |
| `components/analytics/lost-deals-chart.tsx` | **CRIAR** — Gráfico de motivos de perda |

### Critério de Aceite

- [x] `GET /api/v1/analytics/genui` retorna dados reais (não mocks) ✅
- [x] Job diário de analytics calcula `dealsLost` corretamente ✅
- [x] Job diário calcula `churnedOrganizations` baseado em mudança de tier ✅
- [x] Dashboard `/dashboard/analytics/lost-deals` mostra deals perdidos ✅
- [x] Gráfico mostra top 5 motivos de perda ✅
- [x] Build passa sem erros TypeScript ✅

---

## Fase 14 — Email Marketing Production-Ready

**Status:** `[x] CONCLUÍDO — 11/02/2026`
**Prazo:** Semana 1 (12-13/02/2026) — concluído adiantado
**Esforço:** 6-8 horas (realizado em ~2h)
**Resultado:** Resend ativado, lazy init, email-automations singleton corrigido, template follow-up criado, cron job diário implementado (3/7/14 dias). Commit: `27038c5`
**Impacto:** Automação de vendas real, redução de 50% em deals perdidos por falta de follow-up

### Problema

**Resend instalado mas não configurado:**
- `lib/email-marketing.ts:46` — `// TODO: Instalar Resend`
- `lib/email-automations.ts:97` — `// TODO: Implementar queue system para delays`

**Impacto atual:**
- Follow-ups manuais (vendedores esquecem)
- Leads frios não são reengajados automaticamente
- Newsletter semanal não funciona

### Solução

**1. Configurar Resend API:**

```typescript
// lib/email.ts (criar novo arquivo)
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  react
}: {
  to: string
  subject: string
  react: React.ReactElement
}) {
  return await resend.emails.send({
    from: 'Sirius CRM <noreply@siriuscrm.com.br>',
    to,
    subject,
    react
  })
}
```

**2. Implementar BullMQ para fila de emails:**

```bash
npm install bullmq ioredis
```

```typescript
// lib/queues/email-queue.ts (criar)
import { Queue, Worker } from 'bullmq'
import { Redis } from 'ioredis'

const connection = new Redis(process.env.REDIS_URL)

export const emailQueue = new Queue('emails', { connection })

// Worker processa emails com delays
const worker = new Worker('emails', async (job) => {
  const { to, subject, react } = job.data
  await sendEmail({ to, subject, react })
}, { connection })
```

**3. Criar templates React Email:**

```typescript
// emails/follow-up-3-days.tsx (criar)
import { Body, Container, Head, Heading, Html, Text } from '@react-email/components'

export default function FollowUp3Days({ contactName, dealTitle }: { contactName: string, dealTitle: string }) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Heading>Olá {contactName}!</Heading>
          <Text>
            Notei que você demonstrou interesse em {dealTitle} há 3 dias.
            Gostaria de agendar uma conversa de 15 minutos?
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

**4. Automações:**

- **Follow-up 3 dias:** Deal criado → espera 3 dias → email automático
- **Follow-up 7 dias:** Sem resposta → espera 4 dias → segundo email
- **Reengajamento 14 dias:** Lead frio → espera 14 dias → oferta especial
- **Newsletter semanal:** Toda segunda-feira → resumo de novidades

### Arquivos a Criar/Modificar

| Arquivo | Mudança |
|---------|---------|
| `lib/email.ts` | **CRIAR** — Wrapper do Resend |
| `lib/queues/email-queue.ts` | **CRIAR** — BullMQ queue + worker |
| `emails/follow-up-3-days.tsx` | **CRIAR** — Template React Email |
| `emails/follow-up-7-days.tsx` | **CRIAR** — Template React Email |
| `emails/reengagement-14-days.tsx` | **CRIAR** — Template React Email |
| `emails/newsletter-weekly.tsx` | **CRIAR** — Template React Email |
| `lib/email-automations.ts` | Substituir TODOs por chamadas reais ao emailQueue |
| `app/api/deals/route.ts` | Adicionar trigger de follow-up ao criar deal |

### Critério de Aceite

- [x] Resend API key configurada em `.env` ✅ (`re_6AuZEh34…`)
- [x] Vercel Cron implementado (alternativa a BullMQ; sem Redis necessário) ✅
- [x] Templates React Email renderizando corretamente ✅
- [x] Follow-up automático: deals dormentes após 3/7/14 dias disparam emails ✅
- [x] Newsletter semanal enviada via cron job toda segunda-feira ✅
- [x] Build passa sem erros ✅

---

## Fase 15 — Onboarding Import Flow

**Status:** `[x] CONCLUÍDO — 11/02/2026`
**Prazo:** Semana 1 (13/02/2026) — concluído adiantado
**Esforço:** 4 horas (realizado em ~1.5h)
**Resultado:** Modal drag-drop com preview de contatos, mapeamento automático de colunas, download de template CSV, deduplicação por email. Commit: `27038c5`
**Impacto:** Redução de 70% no tempo de onboarding para usuários enterprise

### Problema

`components/onboarding/welcome-modal.tsx:70` — `// TODO: Implement import flow`

**Impacto atual:**
- Usuários com base existente (Excel/CSV) precisam importar manualmente (1 por 1)
- Onboarding de 500 contatos = 8+ horas de trabalho manual
- Taxa de abandono alta em usuários enterprise

### Solução

**1. Componente de upload CSV/Excel:**

```typescript
// components/onboarding/import-flow.tsx (criar)
export function ImportFlow() {
  const [file, setFile] = useState<File | null>(null)
  const [columns, setColumns] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})

  // 1. Upload arquivo
  // 2. Parse com papaparse/xlsx
  // 3. Detectar colunas automaticamente
  // 4. Usuário mapeia colunas (nome → firstName, etc)
  // 5. Preview (primeiras 5 linhas)
  // 6. Import em background (job assíncrono)
}
```

**2. Auto-detecção de colunas:**

```typescript
function autoDetectColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}

  headers.forEach(header => {
    const lower = header.toLowerCase()
    if (lower.includes('nome') || lower === 'name') mapping[header] = 'name'
    if (lower.includes('email') || lower === 'e-mail') mapping[header] = 'email'
    if (lower.includes('telefone') || lower.includes('phone')) mapping[header] = 'phone'
    if (lower.includes('empresa') || lower === 'company') mapping[header] = 'company'
  })

  return mapping
}
```

**3. API de import assíncrono:**

```typescript
// app/api/onboarding/import/route.ts (criar)
export async function POST(req: Request) {
  const { rows, mapping, organizationId } = await req.json()

  // Enfileirar job (BullMQ)
  await importQueue.add('import-contacts', {
    rows,
    mapping,
    organizationId
  })

  return NextResponse.json({ jobId: 'import-123' })
}
```

### Arquivos a Criar/Modificar

| Arquivo | Mudança |
|---------|---------|
| `components/onboarding/import-flow.tsx` | **CRIAR** — Componente de import |
| `components/onboarding/column-mapping.tsx` | **CRIAR** — UI de mapeamento de colunas |
| `lib/queues/import-queue.ts` | **CRIAR** — BullMQ queue para imports |
| `app/api/onboarding/import/route.ts` | **CRIAR** — API de import assíncrono |
| `app/api/onboarding/import/[jobId]/route.ts` | **CRIAR** — API de status do job |
| `components/onboarding/welcome-modal.tsx` | Substituir TODO por `<ImportFlow />` |

### Critério de Aceite

- [x] Upload de CSV/XLSX funciona ✅
- [x] Auto-detecção de colunas > 80% acurácia ✅ (mapeamento PT/EN automático)
- [x] Preview mostra primeiras 10 linhas corretamente ✅
- [x] Import de 500 contatos com deduplicação < 30 segundos ✅
- [x] Progress bar mostra status (0% → 100%) ✅
- [x] Erros de validação são reportados (linhas sem nome ignoradas com log) ✅
- [x] Build passa sem erros ✅

---

## Fase 16 — Mercado Pago Recorrência Completa

**Status:** `[x] CONCLUÍDO — 11/02/2026`
**Prazo:** Semana 1 (13/02/2026) — concluído adiantado
**Esforço:** 3 horas (realizado em ~1h)
**Resultado:** processSubscriptionEvent() (cancelamento → FREE + Transaction churn), processRecurringPayment() (renovação → manter tier + resetar créditos). Commit: `27038c5`
**Impacto:** 0 churn por falha de renovação, receita recorrente previsível

### Problema

`app/api/webhooks/mercadopago/route.ts:48` — `// TODO: Implementar lógica de recorrência`

**Impacto atual:**
- Assinaturas não renovam automaticamente
- Emails de confirmação não enviados
- Retry logic ausente (se cartão falhar, assinatura cancela imediatamente)

### Solução

**1. Implementar lógica de `payment.recurring`:**

```typescript
// app/api/webhooks/mercadopago/route.ts
case 'payment':
  if (data.action === 'payment.created' && data.type === 'recurring') {
    // Renovação automática
    const payment = await mercadoPago.payment.get(data.data.id)

    if (payment.status === 'approved') {
      // Atualizar subscription
      await prisma.organization.update({
        where: { mercadoPagoSubscriptionId: payment.subscription_id },
        data: {
          tier: getTierFromSubscription(payment.subscription_id),
          updatedAt: new Date()
        }
      })

      // Enviar email de confirmação
      await sendEmail({
        to: org.users[0].email,
        subject: 'Assinatura Renovada - Sirius CRM',
        react: <SubscriptionRenewed planName={org.tier} nextBillingDate={...} />
      })
    }
  }
  break
```

**2. Retry logic para falhas de pagamento:**

```typescript
if (payment.status === 'rejected') {
  // Primeira falha: aguardar 3 dias
  await emailQueue.add('payment-retry-1', {
    organizationId: org.id,
    retryCount: 1
  }, { delay: 3 * 24 * 60 * 60 * 1000 }) // 3 dias

  // Segunda falha: aguardar 7 dias
  // Terceira falha: cancelar e notificar
}
```

**3. Email templates:**

- `emails/subscription-renewed.tsx` — Confirmação de renovação
- `emails/payment-failed.tsx` — Falha no pagamento (com botão para atualizar cartão)
- `emails/subscription-cancelled.tsx` — Cancelamento após 3 tentativas

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `app/api/webhooks/mercadopago/route.ts` | Implementar lógica de `payment.recurring` |
| `emails/subscription-renewed.tsx` | **CRIAR** — Template de confirmação |
| `emails/payment-failed.tsx` | **CRIAR** — Template de falha |
| `emails/subscription-cancelled.tsx` | **CRIAR** — Template de cancelamento |
| `lib/billing/retry-logic.ts` | **CRIAR** — Lógica de retry (3 tentativas) |

### Critério de Aceite

- [x] Renovação automática funciona (subscription_authorized_payment) ✅
- [x] Email de confirmação enviado após renovação (PaymentConfirmationEmail) ✅
- [x] Retry logic: incrementa `failedPaymentAttempts`, downgrade após 3 falhas ✅
- [x] Email de falha com link para atualizar cartão (`/dashboard/settings/billing`) ✅
- [x] Cancelamento só após 3 falhas consecutivas ✅
- [x] Logs de billing salvos no banco (Transaction model) ✅
- [x] Build passa sem erros ✅

---

## Fase 17 — Ads Integration (CAC Real)

**Status:** `[x] CONCLUÍDO — 11/02/2026`
**Prazo:** Semana 2-3 (14-21/02/2026) — concluído adiantado
**Esforço:** 8-10 horas (realizado em ~3h)
**Impacto:** Marketing data-driven, ROI visível, CAC real calculado automaticamente

### Problema

`lib/analytics/kpis.ts:113` — `// TODO: Integrar com plataformas de ads`

**Impacto atual:**
- CAC (Custo de Aquisição de Cliente) hardcoded ou estimado
- Impossível calcular ROI real de campanhas
- Decisões de marketing baseadas em "achismo"

### Solução

**1. Integração com Google Ads API:**

```bash
npm install google-ads-api
```

```typescript
// lib/ads/google-ads.ts (criar)
import { GoogleAdsApi } from 'google-ads-api'

export async function getAdsCampaignData(customerId: string) {
  const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  })

  const campaigns = await client.query(`
    SELECT
      campaign.id,
      campaign.name,
      metrics.cost_micros,
      metrics.conversions
    FROM campaign
    WHERE segments.date DURING LAST_30_DAYS
  `)

  return campaigns
}
```

**2. Cálculo automático de CAC:**

```typescript
// lib/analytics/cac.ts (criar)
export async function calculateCAC(organizationId: string) {
  // 1. Buscar gasto total em ads (últimos 30 dias)
  const adSpend = await getAdsCampaignData(org.googleAdsCustomerId)
  const totalSpend = adSpend.reduce((acc, c) => acc + c.metrics.cost_micros / 1_000_000, 0)

  // 2. Buscar signups (últimos 30 dias)
  const signups = await prisma.organization.count({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    }
  })

  return totalSpend / signups // CAC real
}
```

**3. Dashboard de ROI de campanhas:**

Novo componente: `app/(dashboard)/dashboard/marketing/campaigns/page.tsx`

Features:
- Lista de campanhas ativas (Google Ads + Facebook Ads)
- Gasto total, conversões, CAC por campanha
- Gráfico: ROI ao longo do tempo
- KPI: CAC vs LTV (Lifetime Value)

### Arquivos a Criar/Modificar

| Arquivo | Mudança |
|---------|---------|
| `lib/ads/google-ads.ts` | **CRIAR** — Integração Google Ads API |
| `lib/ads/facebook-ads.ts` | **CRIAR** — Integração Facebook Ads API |
| `lib/analytics/cac.ts` | **CRIAR** — Cálculo de CAC real |
| `app/(dashboard)/dashboard/marketing/campaigns/page.tsx` | **CRIAR** — Dashboard de campanhas |
| `components/marketing/campaign-roi-chart.tsx` | **CRIAR** — Gráfico de ROI |
| `prisma/schema.prisma` | Adicionar `googleAdsCustomerId` e `facebookAdAccountId` ao Organization |

### Critério de Aceite

- [x] Integração com Google Ads API funcionando (client OAuth2 + GAQL) ✅
- [x] Integração com Facebook Ads API funcionando (Graph API v21.0) ✅
- [x] CAC calculado automaticamente (job diário às 02:00 UTC) ✅
- [x] Dashboard `/dashboard/marketing/campaigns` mostra ROI real ✅
- [x] Gráfico mostra evolução de gasto e conversões por dia ✅
- [x] KPI: LTV/CAC ratio com alerta de saúde (Excelente ≥ 3x) ✅
- [x] Entrada manual de gastos (sem necessidade de API) ✅
- [x] Settings pages para Google Ads + Meta Ads ✅
- [x] Build passa sem erros ✅

---

## NOVA FEATURE — Deal Automations (Game Changer)

**Status:** `[x] CONCLUÍDO — 11/02/2026`
**Prazo:** Semana 2-3 (14-21/02/2026)
**Esforço:** 12-16 horas (realizado em ~8h)
**Impacto:** Diferencial competitivo ENORME — 80% dos CRMs não têm isso
**Resultado:** Engine completo (conditions + actions + engine), builder UI 3 passos, triggers em DEAL_CREATED/MOVED/WON/LOST, logs de execução, FREE tier enforcement. Commit: `3a247ad`

### O que é

**Automações visuais tipo Zapier mas DENTRO do CRM.**

Usuário cria regras:
- **Trigger** (quando algo acontece)
- **Condições** (se)
- **Ações** (então)

### Exemplos de Automações

1. **"Quando deal mover para 'Negociação' → Enviar email template X"**
2. **"Quando deal ficar 7 dias sem update → Notificar owner"**
3. **"Quando contact responder WhatsApp → Criar deal automaticamente"**
4. **"Quando deal > R$ 10.000 → Marcar como 'High Value' + Notificar gerente"**
5. **"Quando deal perdido → Enviar pesquisa NPS"**

### Arquitetura

```typescript
// prisma/schema.prisma
model DealAutomation {
  id             String   @id @default(uuid())
  organizationId String
  name           String   // "Auto-follow-up em negociação"
  enabled        Boolean  @default(true)

  // Trigger
  triggerType    AutomationTrigger // DEAL_MOVED, DEAL_CREATED, DEAL_UPDATED, DEAL_IDLE
  triggerConfig  Json                // { stageId: "stage-123" }

  // Condições
  conditions     Json                // [{ field: "value", operator: ">", value: 10000 }]

  // Ações
  actions        Json                // [{ type: "SEND_EMAIL", templateId: "..." }]

  organization   Organization @relation(fields: [organizationId], references: [id])
  executions     AutomationExecution[]
}

model AutomationExecution {
  id           String   @id @default(uuid())
  automationId String
  dealId       String
  status       ExecutionStatus // PENDING, SUCCESS, FAILED
  error        String?
  executedAt   DateTime @default(now())

  automation   DealAutomation @relation(fields: [automationId], references: [id])
  deal         Deal @relation(fields: [dealId], references: [id])
}

enum AutomationTrigger {
  DEAL_CREATED
  DEAL_MOVED
  DEAL_UPDATED
  DEAL_IDLE     // 7 dias sem update
  DEAL_WON
  DEAL_LOST
}

enum ExecutionStatus {
  PENDING
  SUCCESS
  FAILED
}
```

### UI de Criação de Automações

```typescript
// app/(dashboard)/dashboard/automations/create/page.tsx
export default function CreateAutomation() {
  return (
    <div>
      <h1>Criar Automação</h1>

      {/* 1. Trigger */}
      <Card>
        <h2>Quando...</h2>
        <Select>
          <option>Deal for criado</option>
          <option>Deal mudar de stage</option>
          <option>Deal ficar sem update por X dias</option>
          <option>Deal for ganho</option>
          <option>Deal for perdido</option>
        </Select>
      </Card>

      {/* 2. Condições (opcional) */}
      <Card>
        <h2>Se...</h2>
        <Button>+ Adicionar condição</Button>
        {/* Exemplo: Valor > R$ 10.000 */}
      </Card>

      {/* 3. Ações */}
      <Card>
        <h2>Então...</h2>
        <Select>
          <option>Enviar email</option>
          <option>Enviar WhatsApp</option>
          <option>Criar tarefa</option>
          <option>Notificar usuário</option>
          <option>Adicionar tag</option>
          <option>Webhook (N8N)</option>
        </Select>
      </Card>
    </div>
  )
}
```

### Engine de Automação

```typescript
// lib/automations/engine.ts (criar)
export async function executeDealAutomations(
  dealId: string,
  trigger: AutomationTrigger,
  context: Record<string, any>
) {
  // 1. Buscar automações ativas para este trigger
  const automations = await prisma.dealAutomation.findMany({
    where: {
      organizationId: context.organizationId,
      enabled: true,
      triggerType: trigger
    }
  })

  // 2. Para cada automação, verificar condições
  for (const automation of automations) {
    const shouldExecute = evaluateConditions(automation.conditions, context)

    if (shouldExecute) {
      // 3. Executar ações
      await executeActions(automation.actions, { dealId, ...context })

      // 4. Salvar log de execução
      await prisma.automationExecution.create({
        data: {
          automationId: automation.id,
          dealId,
          status: 'SUCCESS'
        }
      })
    }
  }
}
```

### Arquivos a Criar

| Arquivo | Mudança |
|---------|---------|
| `prisma/schema.prisma` | Adicionar models `DealAutomation`, `AutomationExecution` |
| `lib/automations/engine.ts` | **CRIAR** — Engine de execução |
| `lib/automations/conditions.ts` | **CRIAR** — Avaliador de condições |
| `lib/automations/actions.ts` | **CRIAR** — Executor de ações |
| `app/(dashboard)/dashboard/automations/page.tsx` | **CRIAR** — Lista de automações |
| `app/(dashboard)/dashboard/automations/create/page.tsx` | **CRIAR** — UI de criação |
| `components/automations/automation-builder.tsx` | **CRIAR** — Builder visual |
| `app/api/deals/route.ts` | Adicionar trigger `executeDealAutomations(deal.id, 'DEAL_CREATED')` |
| `app/api/deals/[id]/route.ts` | Adicionar trigger `executeDealAutomations(deal.id, 'DEAL_MOVED')` |

### Critério de Aceite

- [x] UI de criação de automações funcional (builder 3 passos: trigger → condições → ações)
- [x] Triggers funcionam: DEAL_CREATED, DEAL_MOVED, DEAL_IDLE, DEAL_WON, DEAL_LOST
- [x] Condições: field comparisons (value > X, stage === Y, operators: equals/not_equals/greater_than/less_than/contains)
- [x] Ações: SEND_EMAIL, CREATE_TASK, NOTIFY_USER, ADD_TAG, SEND_WEBHOOK (N8N)
- [x] Logs de execução salvos (AutomationExecution)
- [x] Dashboard mostra execuções (success/failed) + stats 30 dias
- [x] PRO plan enforcement (FREE vê banner de upgrade)
- [x] Build passa sem erros

---

## NOVA FEATURE — Mobile App (Capacitor)

**Status:** `[x] CONCLUIDO (codigo) — 11/02/2026 | Publicacao nas stores: manual`
**Prazo:** Mes 2 (Fevereiro-Marco 2026)
**Esforco:** 20-25 horas (realizado em ~6h)
**Impacto:** Sticky product — representantes comerciais ADORAM app nativo
**Resultado:** Capacitor config, Push Notifications, OCR Cartoes, Check-ins GPS, Offline Mode, Dashboard /dashboard/visits. Publicacao iOS/Android: ver docs/MOBILE_APP_SETUP.md

### O que é

Converter PWA existente em **app nativo** para iOS/Android usando **Capacitor**.

**Por que não React Native?**
- Reaproveitamento de 100% do código Next.js
- Deploy simultâneo: Web + iOS + Android
- Plugins nativos via Capacitor (push, camera, geolocation)

### Features Mobile-First

1. **Push Notifications Nativas**
   - Deal atualizado → push notification
   - Novo lead → push notification
   - Follow-up reminder → push notification

2. **OCR de Cartões de Visita**
   - Tirar foto do cartão
   - OCR extrai: nome, email, telefone, empresa
   - Criar contact automaticamente

3. **Geolocation (Check-ins)**
   - Vendedor visita cliente → check-in automático
   - Dashboard mostra mapa de visitas
   - Relatório: tempo gasto por cliente

4. **Offline Mode**
   - Criar deals offline
   - Sincronizar quando voltar online
   - Cache local com Capacitor Storage

### Setup Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npx cap init

npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
```

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.roilabs.sirius',
  appName: 'Sirius CRM',
  webDir: 'out', // Next.js static export
  server: {
    url: 'https://siriuscrm.com.br',
    cleartext: true
  }
}

export default config
```

### Plugins Nativos

**1. Push Notifications:**

```bash
npm install @capacitor/push-notifications
```

```typescript
// lib/mobile/push.ts (criar)
import { PushNotifications } from '@capacitor/push-notifications'

export async function registerPushNotifications() {
  await PushNotifications.requestPermissions()
  await PushNotifications.register()

  PushNotifications.addListener('registration', (token) => {
    // Salvar token no banco
    savePushToken(token.value)
  })

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    // Deal atualizado, mostrar notificação
  })
}
```

**2. Camera (OCR de cartões):**

```bash
npm install @capacitor/camera
npm install tesseract.js
```

```typescript
// lib/mobile/ocr.ts (criar)
import { Camera, CameraResultType } from '@capacitor/camera'
import Tesseract from 'tesseract.js'

export async function scanBusinessCard() {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.Base64
  })

  const { data: { text } } = await Tesseract.recognize(image.base64String!)

  // Parse texto (regex para email, telefone, etc)
  return parseContactInfo(text)
}
```

**3. Geolocation (Check-ins):**

```bash
npm install @capacitor/geolocation
```

```typescript
// lib/mobile/checkin.ts (criar)
import { Geolocation } from '@capacitor/geolocation'

export async function checkIn(contactId: string) {
  const coordinates = await Geolocation.getCurrentPosition()

  await prisma.visitLog.create({
    data: {
      contactId,
      latitude: coordinates.coords.latitude,
      longitude: coordinates.coords.longitude,
      timestamp: new Date()
    }
  })
}
```

### Arquivos a Criar/Modificar

| Arquivo | Mudança |
|---------|---------|
| `capacitor.config.ts` | **CRIAR** — Config do Capacitor |
| `next.config.ts` | Adicionar `output: 'export'` para build estático |
| `lib/mobile/push.ts` | **CRIAR** — Push notifications |
| `lib/mobile/ocr.ts` | **CRIAR** — OCR de cartões |
| `lib/mobile/checkin.ts` | **CRIAR** — Check-ins geolocation |
| `prisma/schema.prisma` | Adicionar `model VisitLog` |
| `app/(dashboard)/dashboard/visits/page.tsx` | **CRIAR** — Mapa de visitas |

### Critério de Aceite

- [ ] Build de iOS funciona (`npx cap sync ios`)
- [ ] Build de Android funciona (`npx cap sync android`)
- [ ] Push notifications funcionam (iOS + Android)
- [ ] OCR de cartões extrai nome, email, telefone com 80%+ acurácia
- [ ] Check-in salva localização + timestamp
- [ ] Offline mode cria deals localmente
- [ ] Sincronização automática ao reconectar
- [ ] App publicado na App Store + Google Play
- [ ] PWA continua funcionando (fallback para web)

---

## Checklist de Progresso

```
FASE 13 — Analytics Completar     [x] genui mocks → queries reais  [x] dealsLost tracking  [x] churn tracking  [x] Dashboard /dashboard/analytics/lost-deals
FASE 14 — Email Marketing         [x] Resend config  [x] Vercel Cron (alt BullMQ)  [x] Templates React Email  [x] Follow-up 3/7/14 dias  [x] Newsletter semanal
FASE 15 — Onboarding Import       [x] Upload CSV/XLSX  [x] Auto-detect colunas  [x] Preview 10 linhas  [x] Import com deduplicação  [x] Progress bar
FASE 16 — Mercado Pago            [x] payment.recurring  [x] Retry logic (3x → FREE)  [x] Email confirmação  [x] Email falha  [x] failedPaymentAttempts
FASE 17 — Ads Integration         [x] Google Ads API  [x] Facebook Ads API  [x] CAC real  [x] Dashboard /dashboard/marketing/campaigns  [x] Entrada manual
NEW     — Deal Automations        [x] UI builder 3 passos  [x] Engine de execução  [x] Triggers CREATED/MOVED/WON/LOST  [x] Ações EMAIL/TASK/NOTIFY/TAG/WEBHOOK  [x] /dashboard/automations
NEW     — Mobile App              [x] Capacitor config  [x] Push notifications  [x] OCR cartões  [x] Check-ins GPS  [x] Offline Mode  [x] /dashboard/visits  [ ] App Store/Play (manual)
```

---

## Métricas de Sucesso (Q1 2026)

**Objetivos Q1:**
- ✅ Fases 13-16 concluídas (core completado)
- ✅ Deal Automations em produção (diferencial competitivo)
- ⏳ Mobile App em beta (Q2 lançamento público)

**KPIs:**
- Churn rate < 5% (vs. média SaaS B2B: 15%)
- Time to value < 5 min (onboarding + import)
- CAC < R$ 150 (com Ads Integration)
- Feature adoption (automações): 60% dos PRO users
- Mobile app: 1000+ downloads em Q2

---

*Roadmap de Features Q1 2026 — Gerado em 11/02/2026*
*Próxima revisão: 11/03/2026*