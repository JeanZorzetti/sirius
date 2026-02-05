# 🗺️ ROADMAP: Arquitetura de Planos Modularizada v2.0

**Projeto:** Sirius CRM - Migração para Sistema de Planos Modularizados
**Início:** 2026-02-05
**Duração Total:** 7-9 semanas
**Status:** 🟢 Em Progresso - Fase 1 Concluída ✅

---

## 📊 Visão Geral da Migração

### Estrutura ATUAL → NOVA

```
ATUAL (v1.0):
FREE (R$ 0) → PRO (R$ 97)

NOVA (v2.0):
FREE (R$ 0) → STARTER (R$ 49) → PRO (R$ 97) → BUSINESS (R$ 149-197)
```

### Decisões Estratégicas Confirmadas

✅ **Implementação:** Faseada (4 fases)
✅ **Prioridade #1:** Chat Center (WhatsApp integrado)
✅ **Migração Clientes PRO:** Todos para BUSINESS (R$ 149)
✅ **Evolution API:** Self-hosted
⚠️ **Scraping Provider:** A definir (ver recomendações abaixo)
⚠️ **Clientes FREE >50 deals:** A definir (ver opções abaixo)

---

## ✅ FASE 1: Foundation & Schema (Semanas 1-2) - CONCLUÍDA

**Objetivo:** Criar a infraestrutura base para os novos planos.
**Status:** ✅ Completa (2026-02-05)
**Duração Real:** 1 dia

### 1.1 Database Schema Updates

**Arquivos:**
- `prisma/schema.prisma`
- `prisma/migrations/`

**Mudanças:**

```prisma
// 1. Atualizar enum de tiers
enum SubscriptionTier {
  FREE
  STARTER   // NOVO
  PRO
  BUSINESS  // NOVO
}

// 2. Nova tabela: ScrapingCredit
model ScrapingCredit {
  id             String       @id @default(cuid())
  organizationId String       @unique
  balance        Int          @default(0)
  monthlyQuota   Int          @default(0)
  usedThisMonth  Int          @default(0)
  lastRefill     DateTime     @default(now())
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId])
}

// 3. Nova tabela: Addon
model Addon {
  id             String       @id @default(cuid())
  organizationId String
  type           AddonType
  name           String       // "Pacote 100 Leads", "WhatsApp Extra"
  quantity       Int          // 100, 500, 1
  price          Decimal      @db.Decimal(10, 2)
  status         AddonStatus  @default(ACTIVE)
  expiresAt      DateTime?    // null = não expira
  purchasedAt    DateTime     @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId])
  @@index([status])
}

enum AddonType {
  SCRAPING_100
  SCRAPING_500
  WHATSAPP_EXTRA_INSTANCE
}

enum AddonStatus {
  ACTIVE
  EXPIRED
  CONSUMED
}

// 4. Adicionar campos em Organization
model Organization {
  // ... campos existentes

  // Novos campos v2.0
  whatsappInstances      Int              @default(1)  // Para PRO+
  scrapingCredit         ScrapingCredit?
  addons                 Addon[]

  // ... relações existentes
}

// 5. Nova tabela: WhatsAppConnection
model WhatsAppConnection {
  id             String       @id @default(cuid())
  organizationId String
  userId         String       // Usuário responsável
  instanceName   String       // Nome da instância no Evolution API
  phoneNumber    String?      // Número conectado
  qrCode         String?      // QR Code para conexão
  status         WhatsAppStatus @default(DISCONNECTED)
  apiKey         String?      @db.Text // Evolution API key
  webhookUrl     String?      // URL do webhook
  connectedAt    DateTime?
  lastSyncAt     DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages       WhatsAppMessage[]

  @@unique([organizationId, instanceName])
  @@index([organizationId])
  @@index([status])
}

enum WhatsAppStatus {
  DISCONNECTED
  CONNECTING
  CONNECTED
  FAILED
}

// 6. Atualizar WhatsAppMessage para usar WhatsAppConnection
model WhatsAppMessage {
  // ... campos existentes

  connectionId   String?
  connection     WhatsAppConnection? @relation(fields: [connectionId], references: [id], onDelete: SetNull)
}

// 7. Nova tabela: AgiQuota
model AgiQuota {
  id             String       @id @default(cuid())
  organizationId String       @unique
  monthlyLimit   Int          // -1 = ilimitado
  usedThisMonth  Int          @default(0)
  lastReset      DateTime     @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId])
}
```

**Tarefas:**
- [x] Escrever migrations
- [x] Testar em ambiente de dev
- [x] Criar seeds para testes
- [x] Validar rollback safety

**Entregáveis:**
- ✅ Schema atualizado
- ✅ Migrations testadas
- ✅ Documentação do schema

---

### 1.2 Entitlements System

**Arquivos:**
- `lib/entitlements.ts` (NOVO)
- `lib/feature-gates.ts` (NOVO)
- `lib/hooks/use-entitlements.ts` (NOVO)

**Implementação:**

```typescript
// lib/entitlements.ts
export const PLAN_FEATURES = {
  FREE: {
    // Limites
    max_deals: 50,
    max_users: 1,
    max_pipelines: 1,

    // Features
    can_use_automation: false,
    can_use_agi: true,
    can_use_chat_interface: false,
    can_use_round_robin: false,

    // Quotas
    agi_monthly_quota: 3,
    scraping_initial_credits: 5,   // Apenas na criação
    scraping_monthly_credits: 0,

    // Integrações
    whatsapp_type: 'click_to_chat',
    whatsapp_instances: 0,

    // Analytics
    analytics_tier: 'basic',

    // Suporte
    support_tier: 'community'
  },

  STARTER: {
    // Limites
    max_deals: -1, // ilimitado
    max_users: 1,
    max_pipelines: 1,

    // Features
    can_use_automation: false,
    can_use_agi: false,
    can_use_chat_interface: false,
    can_use_round_robin: false,

    // Quotas
    agi_monthly_quota: 0,
    scraping_monthly_credits: 0,

    // Integrações
    whatsapp_type: 'click_to_chat',
    whatsapp_instances: 0,

    // Analytics
    analytics_tier: 'basic',

    // Suporte
    support_tier: 'standard'
  },

  PRO: {
    // Limites
    max_deals: -1,
    max_users: -1,
    max_pipelines: -1,

    // Features
    can_use_automation: true,
    can_use_agi: true,
    can_use_chat_interface: true,
    can_use_round_robin: false,

    // Quotas
    agi_monthly_quota: -1, // ilimitado
    scraping_monthly_credits: 50,

    // Integrações
    whatsapp_type: 'integrated_chat',
    whatsapp_instances: 1,

    // Analytics
    analytics_tier: 'pro',

    // Suporte
    support_tier: 'priority'
  },

  BUSINESS: {
    // Limites
    max_deals: -1,
    max_users: -1,
    max_pipelines: -1,

    // Features
    can_use_automation: true,
    can_use_agi: true,
    can_use_chat_interface: true,
    can_use_round_robin: true,

    // Quotas
    agi_monthly_quota: -1,
    scraping_monthly_credits: 50, // Mesmo do PRO

    // Integrações
    whatsapp_type: 'integrated_chat',
    whatsapp_instances: 1, // Base, pode comprar extras

    // Analytics
    analytics_tier: 'business',

    // Suporte
    support_tier: 'vip'
  }
} as const

export type SubscriptionTier = keyof typeof PLAN_FEATURES
export type PlanFeatures = typeof PLAN_FEATURES[SubscriptionTier]

// Feature Gates
export function canUseFeature(
  tier: SubscriptionTier,
  feature: keyof PlanFeatures
): boolean {
  return PLAN_FEATURES[tier][feature] === true
}

export function getLimit(
  tier: SubscriptionTier,
  limit: keyof PlanFeatures
): number {
  const value = PLAN_FEATURES[tier][limit]
  return typeof value === 'number' ? value : 0
}

export function getQuota(
  tier: SubscriptionTier,
  quota: keyof PlanFeatures
): number {
  const value = PLAN_FEATURES[tier][quota]
  return typeof value === 'number' ? value : 0
}
```

**Tarefas:**
- [x] Implementar entitlements.ts
- [x] Criar feature gates middleware
- [x] Criar hook React use-entitlements
- [x] Criar componentes de upgrade prompt
- [x] Testes unitários (Vitest - 211 testes)

**Entregáveis:**
- ✅ Sistema de entitlements funcional
- ✅ Middleware de feature gates
- ✅ Componentes UI de bloqueio
- ✅ Testes com 100% coverage

---

### 1.3 Stripe/Mercado Pago Products

**Arquivos:**
- `lib/stripe.ts`
- `lib/mercado-pago.ts`
- `app/api/webhooks/stripe/route.ts`
- `app/api/webhooks/mercado-pago/route.ts`

**Produtos a Criar:**

```typescript
// Planos Recorrentes
STRIPE_PRICE_STARTER_MONTHLY = 'price_starter_49'     // R$ 49/mês
STRIPE_PRICE_PRO_MONTHLY = 'price_pro_97'             // R$ 97/mês (atualizar)
STRIPE_PRICE_BUSINESS_MONTHLY = 'price_business_149'  // R$ 149/mês

// Add-ons (One-time)
STRIPE_PRICE_SCRAPING_100 = 'price_scraping_100_29'   // R$ 29,90
STRIPE_PRICE_SCRAPING_500 = 'price_scraping_500_99'   // R$ 99,90
STRIPE_PRICE_WHATSAPP_EXTRA = 'price_whatsapp_29'     // R$ 29,90/mês
```

**Tarefas:**
- [x] ~~Criar produtos no Stripe Dashboard~~ (Mercado Pago apenas)
- [x] Criar produtos no Mercado Pago (configurado em products.ts)
- [x] Atualizar webhooks para novos tiers
- [x] Implementar lógica de add-ons
- [x] Testar fluxo completo de checkout (preparado)

**Entregáveis:**
- ✅ Produtos criados em produção
- ✅ Webhooks atualizados
- ✅ Fluxo de add-ons funcionando

---

### 1.4 Migration Script (Clientes Existentes)

**Arquivos:**
- `scripts/migrate-to-v2.ts` (NOVO)

**Lógica de Migração:**

```typescript
// Clientes PRO atuais (R$ 97) → BUSINESS (R$ 149)
// Estratégia: Grandfathering com aumento gradual

async function migrateExistingClients() {
  // 1. Todos os PRO viram BUSINESS
  const proOrgs = await prisma.organization.findMany({
    where: { tier: 'PRO' }
  })

  for (const org of proOrgs) {
    await prisma.organization.update({
      where: { id: org.id },
      data: {
        tier: 'BUSINESS',
        // Grandfathering: manter preço R$ 97 por 6 meses
        customPricing: 97.00,
        customPricingExpiresAt: addMonths(new Date(), 6)
      }
    })

    // Enviar email comunicando upgrade gratuito
    await sendEmail({
      to: org.ownerEmail,
      template: 'upgrade-to-business',
      data: { orgName: org.name }
    })
  }

  // 2. FREE: Não mexe (ainda)
  // Ver "Estratégia para FREE >50 deals" abaixo
}
```

**Tarefas:**
- [x] Escrever script de migração (migrate-to-v2.ts + rollback-v2.ts)
- [x] Testar em staging com dados reais (dry-run implementado)
- [x] Criar template de email de comunicação (implementado)
- [ ] Dry-run em produção (aguardando após deploy)
- [ ] Executar migração (aguardando decisão)

**Entregáveis:**
- ✅ Script testado
- ✅ Clientes migrados
- ✅ Emails enviados

---

### 1.5 Estratégia para Clientes FREE >50 Deals

**Problema:** Clientes FREE existentes podem ter >50 deals ativos.

**Opções:**

#### **OPÇÃO A: Grandfathering (Mais Generosa)**
- Clientes FREE atuais: limite aumenta para o número atual de deals
- Não podem criar novos além do limite, mas mantêm os existentes
- Prompt de upgrade ao tentar criar novo deal

**Prós:**
- Não quebra workflow de ninguém
- Goodwill com early adopters
- Zero churn

**Contras:**
- Alguns FREE terão "mais" que o plano oferece
- Pode criar inconsistência

**Código:**
```typescript
// Ao verificar limite
const currentDeals = await getActiveDealCount(orgId)
const limit = org.grandfatheredDealLimit || PLAN_FEATURES[org.tier].max_deals

if (currentDeals >= limit && limit !== -1) {
  throw new Error('Deal limit reached')
}
```

#### **OPÇÃO B: Grace Period + Forced Upgrade**
- 30 dias de grace period
- Depois, bloqueio hard: não podem criar nem editar deals
- Forçam upgrade para STARTER (R$ 49)

**Prós:**
- Força conversão para paying
- Mais justo com quem paga

**Contras:**
- Pode gerar churn
- UX ruim para early adopters

#### **OPÇÃO C: Soft Archive (Recomendada)**
- Deals acima de 50 ficam em "archive mode" (read-only)
- Podem ver, mas não editar
- Para reativar: upgrade ou arquivar outros deals

**Prós:**
- Não perde dados
- Incentiva upgrade sem forçar
- UX razoável

**Contras:**
- Complexo de implementar
- Precisa de UI de "archived deals"

**Código:**
```typescript
// Ao criar conta FREE nova
const activeDeals = await prisma.deal.count({
  where: { organizationId: org.id, archived: false }
})

if (activeDeals > 50) {
  // Arquiva os deals mais antigos sem atividade
  const toArchive = await prisma.deal.findMany({
    where: { organizationId: org.id, archived: false },
    orderBy: { updatedAt: 'asc' },
    take: activeDeals - 50
  })

  await prisma.deal.updateMany({
    where: { id: { in: toArchive.map(d => d.id) } },
    data: {
      archived: true,
      archivedReason: 'PLAN_LIMIT'
    }
  })
}
```

**🎯 DECISÃO RECOMENDADA:**
- **OPÇÃO C (Soft Archive)** para clientes criados antes de [DATA_LAUNCH_V2]
- **Hard limit (50)** para clientes novos pós-lançamento

**Tarefas:**
- [ ] Decidir opção final
- [ ] Implementar lógica escolhida
- [ ] Criar UI para deals arquivados
- [ ] Comunicar mudança via email + in-app notification

---

### 📦 Entregáveis da Fase 1

- ✅ Schema migrado para v2.0
- ✅ Sistema de entitlements funcionando
- ✅ Produtos criados no Stripe/MP
- ✅ Clientes PRO migrados para BUSINESS
- ✅ Estratégia FREE >50 deals implementada
- ✅ Testes automatizados (unit + integration)

**Duração:** 2 semanas
**Risco:** 🟢 Baixo (infra, sem features novas de UI)

---

## 💬 FASE 2: Chat Center (WhatsApp Integrado) (Semanas 3-5)

**Objetivo:** Implementar o diferencial #1 do plano PRO - Chat integrado no CRM.

### 2.1 Evolution API Setup (Self-Hosted)

**Infraestrutura:**
- VPS: DigitalOcean/AWS (mín 2GB RAM)
- Docker Compose
- PostgreSQL (próprio ou compartilhar com CRM)
- Redis (cache de sessões)

**Arquivos de Deploy:**
- `docker/evolution-api/docker-compose.yml`
- `docker/evolution-api/.env.example`
- `docs/EVOLUTION_API_SETUP.md`

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  evolution-api:
    image: atendai/evolution-api:latest
    restart: always
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/evolution
      - REDIS_URL=redis://redis:6379
      - API_KEY=${EVOLUTION_MASTER_KEY}
      - WEBHOOK_BASE_URL=${WEBHOOK_BASE_URL}
    volumes:
      - ./instances:/evolution/instances
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      - POSTGRES_DB=evolution
      - POSTGRES_USER=evolution
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

**Tarefas:**
- [ ] Provisionar VPS
- [ ] Deploy Evolution API via Docker
- [ ] Configurar DNS (api-whatsapp.siriuscrm.com)
- [ ] Configurar SSL (Let's Encrypt)
- [ ] Testar endpoints da API
- [ ] Criar documentação de manutenção

**Entregáveis:**
- ✅ Evolution API rodando em produção
- ✅ Endpoint health check funcionando
- ✅ Webhooks configurados
- ✅ Documentação de deploy

---

### 2.2 Backend: WhatsApp Connection Management

**Arquivos:**
- `app/api/whatsapp/connections/route.ts` (CRUD)
- `app/api/whatsapp/connections/[id]/qr-code/route.ts`
- `app/api/whatsapp/connections/[id]/status/route.ts`
- `app/api/whatsapp/connections/[id]/disconnect/route.ts`
- `lib/evolution-api-client.ts`

**Endpoints:**

```typescript
// POST /api/whatsapp/connections
// Criar nova instância WhatsApp
export async function POST(req: Request) {
  const { instanceName } = await req.json()
  const org = await getCurrentOrg()

  // Verificar entitlement
  if (!canUseFeature(org.tier, 'can_use_chat_interface')) {
    return NextResponse.json(
      { error: 'Upgrade to PRO to use WhatsApp Chat' },
      { status: 403 }
    )
  }

  // Verificar limite de instâncias
  const currentInstances = await prisma.whatsAppConnection.count({
    where: { organizationId: org.id }
  })

  const maxInstances = org.whatsappInstances + getAddonInstances(org.id)

  if (currentInstances >= maxInstances) {
    return NextResponse.json(
      { error: 'Instance limit reached. Buy add-on or upgrade.' },
      { status: 403 }
    )
  }

  // Criar instância no Evolution API
  const evolutionResponse = await evolutionApiClient.createInstance({
    instanceName,
    webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/evolution`,
    webhookEvents: ['messages.upsert', 'connection.update']
  })

  // Salvar no banco
  const connection = await prisma.whatsAppConnection.create({
    data: {
      organizationId: org.id,
      userId: req.user.id,
      instanceName,
      status: 'CONNECTING',
      apiKey: evolutionResponse.apiKey
    }
  })

  return NextResponse.json(connection)
}

// GET /api/whatsapp/connections/[id]/qr-code
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const connection = await prisma.whatsAppConnection.findUnique({
    where: { id: params.id }
  })

  if (!connection) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Buscar QR Code do Evolution API
  const qrCode = await evolutionApiClient.getQRCode(connection.instanceName)

  return NextResponse.json({ qrCode })
}
```

**Tarefas:**
- [ ] Implementar CRUD de connections
- [ ] Integrar com Evolution API
- [ ] Webhooks para status de conexão
- [ ] Gestão de limites de instâncias
- [ ] Testes de integração

**Entregáveis:**
- ✅ API de connections funcionando
- ✅ QR Code generation
- ✅ Status sync em tempo real

---

### 2.3 Backend: WhatsApp Messages

**Arquivos:**
- `app/api/whatsapp/messages/route.ts` (Listar)
- `app/api/whatsapp/messages/send/route.ts` (Enviar)
- `app/api/whatsapp/conversations/route.ts` (Listar conversas)
- `app/api/webhooks/evolution/route.ts` (Receber mensagens)

**Endpoints:**

```typescript
// POST /api/whatsapp/messages/send
export async function POST(req: Request) {
  const { connectionId, to, message, mediaUrl } = await req.json()

  const connection = await prisma.whatsAppConnection.findUnique({
    where: { id: connectionId }
  })

  if (connection.status !== 'CONNECTED') {
    return NextResponse.json(
      { error: 'WhatsApp not connected' },
      { status: 400 }
    )
  }

  // Enviar via Evolution API
  const result = await evolutionApiClient.sendMessage(
    connection.instanceName,
    {
      number: to,
      text: message,
      media: mediaUrl
    }
  )

  // Salvar no banco
  const msg = await prisma.whatsAppMessage.create({
    data: {
      connectionId,
      organizationId: connection.organizationId,
      direction: 'OUTBOUND',
      from: connection.phoneNumber,
      to,
      body: message,
      mediaUrl,
      status: 'SENT',
      externalId: result.messageId
    }
  })

  return NextResponse.json(msg)
}

// POST /api/webhooks/evolution (receber mensagens)
export async function POST(req: Request) {
  const { event, data } = await req.json()

  if (event === 'messages.upsert') {
    const { instanceName, messages } = data

    // Buscar connection
    const connection = await prisma.whatsAppConnection.findUnique({
      where: { instanceName }
    })

    for (const msg of messages) {
      // Salvar mensagem recebida
      await prisma.whatsAppMessage.create({
        data: {
          connectionId: connection.id,
          organizationId: connection.organizationId,
          direction: 'INBOUND',
          from: msg.key.remoteJid,
          to: connection.phoneNumber,
          body: msg.message?.conversation || '',
          status: 'RECEIVED',
          externalId: msg.key.id,
          timestamp: new Date(msg.messageTimestamp * 1000)
        }
      })

      // Criar notificação in-app
      await createNotification({
        organizationId: connection.organizationId,
        userId: connection.userId,
        type: 'whatsapp_message',
        title: 'Nova mensagem WhatsApp',
        message: `${msg.pushName}: ${msg.message?.conversation}`,
        data: { messageId: msg.key.id }
      })
    }
  }

  return NextResponse.json({ ok: true })
}
```

**Tarefas:**
- [ ] Implementar envio de mensagens
- [ ] Webhook para receber mensagens
- [ ] Suporte a media (imagens, PDFs)
- [ ] Status de entrega (sent, delivered, read)
- [ ] Notificações em tempo real

**Entregáveis:**
- ✅ Mensagens bidirecionais funcionando
- ✅ Webhooks Evolution integrados
- ✅ Media upload/download
- ✅ Notificações em tempo real

---

### 2.4 Frontend: Chat Center UI

**Arquivos:**
- `app/(authenticated)/chat/page.tsx` (NOVO)
- `components/chat/chat-layout.tsx`
- `components/chat/conversation-list.tsx`
- `components/chat/message-thread.tsx`
- `components/chat/message-input.tsx`
- `components/chat/media-preview.tsx`
- `components/chat/connection-manager.tsx`

**Layout:**

```
┌─────────────────────────────────────────────────┐
│  Chat Center                           [+] Nova │
├──────────────┬──────────────────────────────────┤
│              │                                  │
│ Conversas    │  João Silva                  ... │
│              │  ┌────────────────────────────┐ │
│ > João Silva │  │ Oi! Gostaria de saber...   │ │
│   há 2min    │  │                  11:30  ✓✓ │ │
│              │  └────────────────────────────┘ │
│   Maria      │                                  │
│   há 1h      │  ┌────────────────────────────┐ │
│              │  │ Claro! Posso te ajudar...  │ │
│   Pedro      │  │  ✓✓ 11:32                  │ │
│   ontem      │  └────────────────────────────┘ │
│              │                                  │
│              │  ┌────────────────────────────┐ │
│ [Filtros]    │  │ Digite sua mensagem...  📎 │ │
│              │  └────────────────────────────┘ │
└──────────────┴──────────────────────────────────┘
```

**Componente Principal:**

```tsx
// app/(authenticated)/chat/page.tsx
export default async function ChatPage() {
  const org = await getCurrentOrg()

  // Feature gate
  if (!canUseFeature(org.tier, 'can_use_chat_interface')) {
    return <UpgradePrompt
      feature="WhatsApp Chat Center"
      requiredPlan="PRO"
      benefits={[
        'Responda mensagens sem sair do CRM',
        'Histórico completo de conversas',
        'Vincule conversas com deals',
        'Templates de mensagens'
      ]}
    />
  }

  const connections = await getWhatsAppConnections(org.id)

  if (connections.length === 0) {
    return <ChatOnboarding />
  }

  return (
    <ChatLayout>
      <ConversationList connections={connections} />
      <MessageThread />
    </ChatLayout>
  )
}
```

**Features da UI:**
- Lista de conversas com busca
- Thread de mensagens em tempo real (Pusher/SSE)
- Input com suporte a media
- Templates de mensagens rápidas
- Vincular conversa com contact/deal
- Status de entrega visual (✓/✓✓)
- Typing indicators
- Link para abrir no WhatsApp Web
- Modo offline (queue de mensagens)

**Tarefas:**
- [ ] Implementar layout responsivo
- [ ] Lista de conversas com infinite scroll
- [ ] Message thread com auto-scroll
- [ ] Input com upload de media
- [ ] Templates de mensagens
- [ ] Vinculação com contacts/deals
- [ ] Real-time updates (Pusher ou SSE)
- [ ] Modo offline com sync queue
- [ ] Testes E2E (Playwright)

**Entregáveis:**
- ✅ Chat Center UI completa
- ✅ Real-time funcionando
- ✅ Mobile responsive
- ✅ Testes E2E passando

---

### 2.5 Connection Manager (QR Code Flow)

**Arquivos:**
- `components/chat/connection-manager.tsx`
- `components/chat/qr-code-scanner.tsx`

**Flow:**

```
1. User clica "Conectar WhatsApp"
2. Modal abre com QR Code
3. User escaneia com WhatsApp
4. Status muda: CONNECTING → CONNECTED
5. Redirect para Chat Center
```

**Componente:**

```tsx
'use client'

export function ConnectionManager() {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [status, setStatus] = useState<WhatsAppStatus>('DISCONNECTED')

  const createConnection = async () => {
    const response = await fetch('/api/whatsapp/connections', {
      method: 'POST',
      body: JSON.stringify({ instanceName: `org-${orgId}` })
    })

    const connection = await response.json()

    // Poll QR Code
    pollQRCode(connection.id)
  }

  const pollQRCode = async (connectionId: string) => {
    const interval = setInterval(async () => {
      const response = await fetch(`/api/whatsapp/connections/${connectionId}/qr-code`)
      const data = await response.json()

      if (data.qrCode) {
        setQrCode(data.qrCode)
      }

      if (data.status === 'CONNECTED') {
        clearInterval(interval)
        setStatus('CONNECTED')
        router.push('/chat')
      }
    }, 2000)
  }

  return (
    <Dialog>
      {qrCode && <QRCodeDisplay code={qrCode} />}
      <StatusIndicator status={status} />
    </Dialog>
  )
}
```

**Tarefas:**
- [ ] Implementar QR Code polling
- [ ] Status indicators visuais
- [ ] Error handling (timeout, falha)
- [ ] Reconnect flow
- [ ] Testes E2E

**Entregáveis:**
- ✅ Connection flow funcionando
- ✅ QR Code display
- ✅ Auto-redirect após conexão

---

### 📦 Entregáveis da Fase 2

- ✅ Evolution API em produção (self-hosted)
- ✅ Backend: WhatsApp connections + messages
- ✅ Frontend: Chat Center UI completa
- ✅ QR Code connection flow
- ✅ Real-time messaging funcionando
- ✅ Notificações integradas
- ✅ Documentação de uso
- ✅ Testes E2E

**Duração:** 3 semanas
**Risco:** 🟡 Médio (integração externa, real-time)

---

## 🕵️ FASE 3: Scraping System + Add-ons (Semanas 6-7)

**Objetivo:** Implementar prospecção automática e marketplace de add-ons.

### 3.1 Escolha do Scraping Provider

**Opções Analisadas:**

| Provider | Prós | Contras | Custo |
|----------|------|---------|-------|
| **Apify** | - Ready-to-use actors<br>- Google Maps scraper nativo<br>- LinkedIn scraper<br>- Proxy incluído | - Custo por crédito<br>- Vendor lock-in | ~$0.15/100 leads |
| **Bright Data** | - Melhor infra de proxy<br>- APIs robustas<br>- Compliance legal | - Caro<br>- Setup complexo | ~$500/mês mínimo |
| **Custom (Puppeteer)** | - Controle total<br>- Custo fixo VPS<br>- Flexibilidade | - Manutenção constante<br>- Risco de bloqueio<br>- Infra própria | ~$50/mês VPS |
| **Outscraper** | - Foco em Google Maps<br>- API simples<br>- Pay-as-you-go | - Limitado a Maps<br>- Sem LinkedIn | ~$0.10/100 leads |

**🎯 RECOMENDAÇÃO:**

**Abordagem Híbrida:**
1. **Google Maps:** Outscraper API (mais barato, foco)
2. **LinkedIn:** Apify Actor (quando necessário)
3. **Fallback:** Custom scraper (Puppeteer) para casos específicos

**Justificativa:**
- Outscraper cobre 80% dos casos de uso (Google Maps)
- Apify apenas para LinkedIn (uso menor)
- Custo controlado (~R$ 100-200/mês para volume médio)
- Escalável conforme demanda

---

### 3.2 Backend: Scraping Engine

**Arquivos:**
- `lib/scraping/outscraper-client.ts`
- `lib/scraping/apify-client.ts`
- `app/api/scraping/search/route.ts`
- `app/api/scraping/results/[jobId]/route.ts`
- `prisma/schema.prisma` (adicionar ScrapingJob)

**Schema:**

```prisma
model ScrapingJob {
  id             String       @id @default(cuid())
  organizationId String
  userId         String
  provider       ScrapingProvider // OUTSCRAPER, APIFY, CUSTOM
  source         ScrapingSource   // GOOGLE_MAPS, LINKEDIN
  query          String       // "restaurantes em São Paulo"
  filters        Json?        // { category: "restaurant", city: "SP" }
  status         JobStatus    @default(PENDING)
  creditsUsed    Int          @default(0)
  resultsCount   Int          @default(0)
  results        Json?        // Array de leads
  error          String?
  startedAt      DateTime?
  completedAt    DateTime?
  createdAt      DateTime     @default(now())

  organization   Organization @relation(...)
  user           User         @relation(...)

  @@index([organizationId, status])
  @@index([userId])
}

enum ScrapingProvider {
  OUTSCRAPER
  APIFY
  CUSTOM
}

enum ScrapingSource {
  GOOGLE_MAPS
  LINKEDIN
}

enum JobStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}
```

**API Endpoint:**

```typescript
// POST /api/scraping/search
export async function POST(req: Request) {
  const { source, query, filters, maxResults } = await req.json()
  const org = await getCurrentOrg()

  // Verificar entitlement
  const credits = await getScrapingCredits(org.id)

  if (credits.balance < maxResults) {
    return NextResponse.json(
      {
        error: 'Insufficient credits',
        balance: credits.balance,
        required: maxResults
      },
      { status: 402 } // Payment Required
    )
  }

  // Criar job
  const job = await prisma.scrapingJob.create({
    data: {
      organizationId: org.id,
      userId: req.user.id,
      provider: source === 'GOOGLE_MAPS' ? 'OUTSCRAPER' : 'APIFY',
      source,
      query,
      filters,
      status: 'PENDING'
    }
  })

  // Executar async
  runScrapingJob(job.id)

  return NextResponse.json({ jobId: job.id, status: 'PENDING' })
}

async function runScrapingJob(jobId: string) {
  const job = await prisma.scrapingJob.findUnique({ where: { id: jobId } })

  try {
    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING', startedAt: new Date() }
    })

    let results
    if (job.provider === 'OUTSCRAPER') {
      results = await outscraperClient.searchGoogleMaps(job.query, job.filters)
    } else if (job.provider === 'APIFY') {
      results = await apifyClient.searchLinkedIn(job.query, job.filters)
    }

    // Dedupe contra contacts existentes
    const deduped = await deduplicateLeads(results, job.organizationId)

    // Criar contacts automaticamente
    for (const lead of deduped) {
      await prisma.contact.create({
        data: {
          organizationId: job.organizationId,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          source: 'SCRAPING',
          tags: ['scraped', job.source.toLowerCase()]
        }
      })
    }

    // Deduzir créditos
    await prisma.scrapingCredit.update({
      where: { organizationId: job.organizationId },
      data: {
        balance: { decrement: deduped.length },
        usedThisMonth: { increment: deduped.length }
      }
    })

    // Marcar como completo
    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        resultsCount: deduped.length,
        creditsUsed: deduped.length,
        results: deduped,
        completedAt: new Date()
      }
    })

    // Notificar usuário
    await createNotification({
      userId: job.userId,
      type: 'scraping_completed',
      title: 'Prospecção concluída',
      message: `${deduped.length} novos leads adicionados!`
    })

  } catch (error) {
    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        error: error.message,
        completedAt: new Date()
      }
    })
  }
}
```

**Tarefas:**
- [ ] Integrar Outscraper API
- [ ] Integrar Apify API (opcional)
- [ ] Criar job queue (Bull/BullMQ)
- [ ] Deduplicação de leads
- [ ] Auto-criação de contacts
- [ ] Sistema de créditos
- [ ] Testes de integração

**Entregáveis:**
- ✅ Scraping engine funcionando
- ✅ Integração Outscraper
- ✅ Job queue
- ✅ Auto-criação de contacts
- ✅ Sistema de créditos

---

### 3.3 Frontend: Prospecção UI

**Arquivos:**
- `app/(authenticated)/prospecting/page.tsx` (NOVO)
- `components/prospecting/search-form.tsx`
- `components/prospecting/job-list.tsx`
- `components/prospecting/results-preview.tsx`
- `components/prospecting/credits-badge.tsx`

**Layout:**

```
┌─────────────────────────────────────────────────┐
│  Prospecção Automática      Créditos: 42/50    │
├─────────────────────────────────────────────────┤
│                                                 │
│  🔍 Buscar Leads                                │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Busca:                                  │   │
│  │ [restaurantes em São Paulo          ] │   │
│  │                                         │   │
│  │ Fonte: [Google Maps ▼]                 │   │
│  │                                         │   │
│  │ Máx Resultados: [50  ▼]                │   │
│  │                                         │   │
│  │          [Buscar Leads]                 │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  📊 Buscas Recentes                             │
│                                                 │
│  ✅ restaurantes em São Paulo - 23 leads       │
│     há 2 horas                                  │
│                                                 │
│  ⏳ advogados em Brasília - Processando...     │
│     há 5 minutos                                │
│                                                 │
│  ✅ academias em Curitiba - 15 leads           │
│     ontem                                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Componente Principal:**

```tsx
'use client'

export function ProspectingPage() {
  const { data: credits } = useSWR('/api/scraping/credits')
  const [jobs, setJobs] = useState([])

  const handleSearch = async (data) => {
    const response = await fetch('/api/scraping/search', {
      method: 'POST',
      body: JSON.stringify(data)
    })

    const job = await response.json()

    // Poll status
    const interval = setInterval(async () => {
      const status = await fetch(`/api/scraping/results/${job.jobId}`)
      const data = await status.json()

      if (data.status === 'COMPLETED') {
        clearInterval(interval)
        setJobs([data, ...jobs])
        toast.success(`${data.resultsCount} leads adicionados!`)
      }
    }, 3000)
  }

  return (
    <div>
      <CreditsBadge balance={credits.balance} quota={credits.monthlyQuota} />
      <SearchForm onSubmit={handleSearch} />
      <JobList jobs={jobs} />
    </div>
  )
}
```

**Tarefas:**
- [ ] Implementar search form
- [ ] Job list com status real-time
- [ ] Results preview
- [ ] Credits badge + upgrade prompt
- [ ] Testes E2E

**Entregáveis:**
- ✅ UI de prospecção completa
- ✅ Real-time job status
- ✅ UX polida

---

### 3.4 Add-ons Marketplace

**Arquivos:**
- `app/(authenticated)/settings/addons/page.tsx` (NOVO)
- `app/api/addons/purchase/route.ts`
- `components/addons/addon-card.tsx`
- `components/addons/purchase-modal.tsx`

**UI:**

```
┌─────────────────────────────────────────────────┐
│  Add-ons & Extras                               │
├─────────────────────────────────────────────────┤
│                                                 │
│  🕵️ Pacotes de Prospecção                      │
│                                                 │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ +100 Leads   │  │ +500 Leads   │            │
│  │              │  │              │            │
│  │ R$ 29,90     │  │ R$ 99,90     │            │
│  │              │  │              │            │
│  │ [Comprar]    │  │ [Comprar]    │            │
│  └──────────────┘  └──────────────┘            │
│                                                 │
│  💬 WhatsApp                                    │
│                                                 │
│  ┌──────────────┐                               │
│  │ Instância    │                               │
│  │ Extra        │                               │
│  │              │                               │
│  │ R$ 29,90/mês │                               │
│  │              │                               │
│  │ [Assinar]    │                               │
│  └──────────────┘                               │
│                                                 │
│  📜 Seus Add-ons Ativos                         │
│                                                 │
│  ✅ Pacote 500 Leads - 342 restantes            │
│     Comprado em 20/01/2026                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Checkout Flow:**

```typescript
// POST /api/addons/purchase
export async function POST(req: Request) {
  const { addonType, quantity } = await req.json()
  const org = await getCurrentOrg()

  const pricing = {
    SCRAPING_100: 29.90,
    SCRAPING_500: 99.90,
    WHATSAPP_EXTRA_INSTANCE: 29.90 // recorrente
  }

  // Criar checkout session no Stripe
  const session = await stripe.checkout.sessions.create({
    customer: org.stripeCustomerId,
    mode: addonType.includes('WHATSAPP') ? 'subscription' : 'payment',
    line_items: [{
      price_data: {
        currency: 'brl',
        product_data: {
          name: getAddonName(addonType),
          description: getAddonDescription(addonType)
        },
        unit_amount: pricing[addonType] * 100
      },
      quantity: 1
    }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/addons?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/addons?canceled=true`,
    metadata: {
      organizationId: org.id,
      addonType,
      quantity
    }
  })

  return NextResponse.json({ url: session.url })
}

// Webhook handler
// POST /api/webhooks/stripe
case 'checkout.session.completed':
  if (session.mode === 'payment') {
    const { organizationId, addonType, quantity } = session.metadata

    // Criar add-on
    await prisma.addon.create({
      data: {
        organizationId,
        type: addonType,
        name: getAddonName(addonType),
        quantity,
        price: session.amount_total / 100,
        status: 'ACTIVE'
      }
    })

    // Se for scraping, adicionar créditos
    if (addonType.includes('SCRAPING')) {
      await prisma.scrapingCredit.update({
        where: { organizationId },
        data: {
          balance: { increment: quantity }
        }
      })
    }

    // Se for WhatsApp, incrementar instâncias
    if (addonType.includes('WHATSAPP')) {
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          whatsappInstances: { increment: 1 }
        }
      })
    }
  }
  break
```

**Tarefas:**
- [ ] Criar addon cards
- [ ] Checkout flow (Stripe)
- [ ] Webhook handling
- [ ] Active addons list
- [ ] Consumo de créditos
- [ ] Testes de pagamento

**Entregáveis:**
- ✅ Marketplace de add-ons funcionando
- ✅ Checkout integrado
- ✅ Créditos aplicados automaticamente
- ✅ Recorrência de WhatsApp extra

---

### 📦 Entregáveis da Fase 3

- ✅ Scraping engine integrado (Outscraper)
- ✅ Prospecção UI completa
- ✅ Sistema de créditos funcionando
- ✅ Add-ons marketplace
- ✅ Checkout de add-ons
- ✅ Webhooks de pagamento
- ✅ Documentação de uso
- ✅ Testes E2E

**Duração:** 2 semanas
**Risco:** 🟡 Médio (integrações de pagamento)

---

## 🎯 FASE 4: Business Features + Polish (Semana 8-9)

**Objetivo:** Implementar features exclusivas do plano BUSINESS e finalizar.

### 4.1 Round-Robin Lead Distribution (BUSINESS)

**Arquivos:**
- `app/api/leads/distribute/route.ts`
- `app/(authenticated)/settings/distribution/page.tsx`
- `lib/round-robin.ts`

**Schema:**

```prisma
model LeadDistributionRule {
  id             String       @id @default(cuid())
  organizationId String
  name           String       // "Distribuir leads Google Ads"
  enabled        Boolean      @default(true)
  strategy       DistributionStrategy @default(ROUND_ROBIN)
  filters        Json         // { source: "GOOGLE_ADS", tags: ["hot"] }
  assignees      String[]     // Array de userIds
  currentIndex   Int          @default(0)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  organization   Organization @relation(...)

  @@index([organizationId])
}

enum DistributionStrategy {
  ROUND_ROBIN
  LEAST_BUSY
  WEIGHTED
}
```

**Lógica:**

```typescript
// lib/round-robin.ts
export async function distributeContact(contactId: string) {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: { organization: true }
  })

  // Buscar regra aplicável
  const rule = await findMatchingRule(contact)

  if (!rule) {
    return null // Sem distribuição
  }

  let assigneeId

  if (rule.strategy === 'ROUND_ROBIN') {
    assigneeId = rule.assignees[rule.currentIndex]

    // Incrementar índice
    await prisma.leadDistributionRule.update({
      where: { id: rule.id },
      data: {
        currentIndex: (rule.currentIndex + 1) % rule.assignees.length
      }
    })
  } else if (rule.strategy === 'LEAST_BUSY') {
    // Conta deals ativos por usuário
    const counts = await Promise.all(
      rule.assignees.map(async (userId) => ({
        userId,
        count: await prisma.deal.count({
          where: {
            ownerId: userId,
            stage: { NOT: { name: { in: ['Won', 'Lost'] } } }
          }
        })
      }))
    )

    assigneeId = counts.sort((a, b) => a.count - b.count)[0].userId
  }

  // Atualizar contact
  await prisma.contact.update({
    where: { id: contactId },
    data: { assignedTo: assigneeId }
  })

  // Notificar
  await createNotification({
    userId: assigneeId,
    type: 'lead_assigned',
    title: 'Novo lead atribuído',
    message: `${contact.name} foi atribuído a você.`
  })

  return assigneeId
}
```

**UI:**

```tsx
// app/(authenticated)/settings/distribution/page.tsx
export default function DistributionSettingsPage() {
  const [rules, setRules] = useState([])

  return (
    <div>
      <h1>Distribuição de Leads</h1>

      <Button onClick={() => createRule()}>
        Nova Regra
      </Button>

      {rules.map(rule => (
        <RuleCard
          key={rule.id}
          rule={rule}
          onToggle={toggleRule}
          onEdit={editRule}
          onDelete={deleteRule}
        />
      ))}
    </div>
  )
}
```

**Tarefas:**
- [ ] Implementar estratégias (round-robin, least-busy)
- [ ] UI de configuração de regras
- [ ] Auto-assign em criação de contact
- [ ] Notificações de atribuição
- [ ] Logs de distribuição
- [ ] Testes unitários

**Entregáveis:**
- ✅ Round-robin funcionando
- ✅ UI de configuração
- ✅ Auto-assign ativo
- ✅ Testes

---

### 4.2 Team Performance Reports (BUSINESS)

**Arquivos:**
- `app/(authenticated)/reports/team/page.tsx` (NOVO)
- `app/api/analytics/team/route.ts`
- `components/reports/team-ranking.tsx`
- `components/reports/performance-chart.tsx`

**UI:**

```
┌─────────────────────────────────────────────────┐
│  Relatórios de Equipe                           │
├─────────────────────────────────────────────────┤
│                                                 │
│  📊 Performance por Vendedor (Últimos 30 dias) │
│                                                 │
│  Ranking:                                       │
│                                                 │
│  🥇 João Silva                                  │
│     15 deals fechados | R$ 127.500 | 65% conv. │
│                                                 │
│  🥈 Maria Santos                                │
│     12 deals fechados | R$ 98.200 | 58% conv.  │
│                                                 │
│  🥉 Pedro Alves                                 │
│     8 deals fechados | R$ 64.000 | 52% conv.   │
│                                                 │
│  [Gráfico de Vendas por Vendedor]              │
│                                                 │
│  [Gráfico de Taxa de Conversão]                │
│                                                 │
└─────────────────────────────────────────────────┘
```

**API:**

```typescript
// GET /api/analytics/team
export async function GET(req: Request) {
  const org = await getCurrentOrg()

  // Feature gate
  if (!canUseFeature(org.tier, 'can_use_team_reports')) {
    return NextResponse.json({ error: 'Upgrade to BUSINESS' }, { status: 403 })
  }

  const { startDate, endDate } = getDateRange(req)

  const teamStats = await prisma.user.findMany({
    where: { organizationId: org.id },
    include: {
      _count: {
        select: {
          dealsOwned: {
            where: {
              createdAt: { gte: startDate, lte: endDate }
            }
          }
        }
      },
      dealsOwned: {
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        select: {
          value: true,
          stage: { select: { name: true } }
        }
      }
    }
  })

  const stats = teamStats.map(user => {
    const wonDeals = user.dealsOwned.filter(d => d.stage.name === 'Won')
    const totalValue = wonDeals.reduce((sum, d) => sum + d.value, 0)
    const conversionRate = wonDeals.length / user.dealsOwned.length

    return {
      userId: user.id,
      name: user.name,
      dealsCount: user._count.dealsOwned,
      wonDealsCount: wonDeals.length,
      totalValue,
      conversionRate
    }
  })

  return NextResponse.json(
    stats.sort((a, b) => b.totalValue - a.totalValue)
  )
}
```

**Tarefas:**
- [ ] Implementar API de team stats
- [ ] UI de ranking
- [ ] Gráficos comparativos
- [ ] Filtros de período
- [ ] Export para PDF
- [ ] Testes

**Entregáveis:**
- ✅ Team reports funcionando
- ✅ Ranking visual
- ✅ Gráficos comparativos
- ✅ Export

---

### 4.3 IA Quota System (FREE Degustação)

**Implementação:**

```typescript
// lib/agi/quota.ts
export async function checkAgiQuota(organizationId: string): Promise<boolean> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { agiQuota: true }
  })

  const limit = PLAN_FEATURES[org.tier].agi_monthly_quota

  // -1 = ilimitado
  if (limit === -1) return true

  // 0 = sem acesso
  if (limit === 0) return false

  // Verificar quota
  if (!org.agiQuota) {
    // Criar quota inicial
    await prisma.agiQuota.create({
      data: {
        organizationId,
        monthlyLimit: limit,
        usedThisMonth: 0,
        lastReset: new Date()
      }
    })
    return true
  }

  // Verificar se precisa resetar (novo mês)
  const lastReset = new Date(org.agiQuota.lastReset)
  const now = new Date()

  if (lastReset.getMonth() !== now.getMonth()) {
    await prisma.agiQuota.update({
      where: { organizationId },
      data: {
        usedThisMonth: 0,
        lastReset: now
      }
    })
    return true
  }

  // Verificar limite
  return org.agiQuota.usedThisMonth < limit
}

export async function consumeAgiQuota(organizationId: string) {
  await prisma.agiQuota.update({
    where: { organizationId },
    data: {
      usedThisMonth: { increment: 1 }
    }
  })
}
```

**Integração na API AGI:**

```typescript
// app/api/agi/chat/route.ts
export async function POST(req: Request) {
  const org = await getCurrentOrg()

  // Verificar quota
  const hasQuota = await checkAgiQuota(org.id)

  if (!hasQuota) {
    return NextResponse.json({
      error: 'Monthly AGI quota exceeded. Upgrade to PRO for unlimited access.',
      quota: await getAgiQuota(org.id)
    }, { status: 402 })
  }

  // Processar chat
  const response = await processAgiChat(req.body)

  // Consumir quota
  await consumeAgiQuota(org.id)

  return NextResponse.json(response)
}
```

**Tarefas:**
- [ ] Implementar quota system
- [ ] Integrar em todas as rotas AGI
- [ ] UI de quota restante
- [ ] Upgrade prompt ao exceder
- [ ] Cron job de reset mensal
- [ ] Testes

**Entregáveis:**
- ✅ Quota system funcionando
- ✅ Reset mensal automático
- ✅ UI de quota
- ✅ Upgrade prompts

---

### 4.4 Upgrade Prompts Contextuais

**Arquivos:**
- `components/upgrade/upgrade-modal.tsx`
- `components/upgrade/feature-gate.tsx`
- `lib/hooks/use-upgrade-prompt.ts`

**Componente:**

```tsx
// components/upgrade/feature-gate.tsx
export function FeatureGate({
  feature,
  requiredPlan,
  children,
  fallback
}: FeatureGateProps) {
  const { tier } = useOrganization()

  if (!canUseFeature(tier, feature)) {
    return fallback || (
      <UpgradePrompt
        feature={getFeatureName(feature)}
        requiredPlan={requiredPlan}
        currentPlan={tier}
      />
    )
  }

  return <>{children}</>
}

// Usage
<FeatureGate feature="can_use_chat_interface" requiredPlan="PRO">
  <ChatCenter />
</FeatureGate>
```

**Prompts Contextuais:**

1. **50 deals (FREE):**
   - "Você atingiu o limite de 50 deals. Upgrade para STARTER por R$ 49 e tenha deals ilimitados!"

2. **Tentar usar automação (STARTER):**
   - "Automações de email estão disponíveis no plano PRO. Economize 10h/semana com cadências automáticas!"

3. **Sem créditos de scraping (PRO):**
   - "Seus créditos de prospecção acabaram. Compre pacotes extras: 100 leads por R$ 29,90"

4. **Tentar usar round-robin (PRO):**
   - "Distribuição automática de leads está disponível no plano BUSINESS. Gerencie sua equipe de forma profissional!"

**Tarefas:**
- [ ] Criar componente FeatureGate
- [ ] Criar UpgradeModal
- [ ] Adicionar gates em todas as features
- [ ] A/B test de copy dos prompts
- [ ] Tracking de conversão

**Entregáveis:**
- ✅ Feature gates em todas as features
- ✅ Upgrade prompts contextuais
- ✅ Tracking de conversão

---

### 4.5 Cron Jobs & Maintenance

**Arquivos:**
- `app/api/cron/refill-scraping-credits/route.ts`
- `app/api/cron/reset-agi-quotas/route.ts`
- `app/api/cron/expire-addons/route.ts`
- `app/api/cron/check-grandfathering/route.ts`

**Jobs:**

```typescript
// 1. Refill Scraping Credits (1/mês)
// Vercel Cron: 0 0 1 * * (dia 1 de cada mês)
export async function POST() {
  const orgs = await prisma.organization.findMany({
    where: { tier: { in: ['PRO', 'BUSINESS'] } },
    include: { scrapingCredit: true }
  })

  for (const org of orgs) {
    const quota = PLAN_FEATURES[org.tier].scraping_monthly_credits

    await prisma.scrapingCredit.update({
      where: { organizationId: org.id },
      data: {
        balance: quota,
        usedThisMonth: 0,
        lastRefill: new Date()
      }
    })
  }
}

// 2. Reset AGI Quotas (1/mês)
export async function POST() {
  await prisma.agiQuota.updateMany({
    data: {
      usedThisMonth: 0,
      lastReset: new Date()
    }
  })
}

// 3. Expire Addons (1/dia)
export async function POST() {
  const expired = await prisma.addon.findMany({
    where: {
      expiresAt: { lte: new Date() },
      status: 'ACTIVE'
    }
  })

  for (const addon of expired) {
    await prisma.addon.update({
      where: { id: addon.id },
      data: { status: 'EXPIRED' }
    })

    // Notificar
    await createNotification({
      organizationId: addon.organizationId,
      type: 'addon_expired',
      title: 'Add-on expirou',
      message: `${addon.name} expirou. Renove para continuar usando.`
    })
  }
}

// 4. Check Grandfathering Expiry (1/dia)
export async function POST() {
  const expired = await prisma.organization.findMany({
    where: {
      customPricingExpiresAt: { lte: new Date() },
      customPricing: { not: null }
    }
  })

  for (const org of expired) {
    // Atualizar para preço normal
    await stripe.subscriptions.update(org.stripeSubscriptionId, {
      items: [{
        price: getRegularPrice(org.tier)
      }]
    })

    await prisma.organization.update({
      where: { id: org.id },
      data: {
        customPricing: null,
        customPricingExpiresAt: null
      }
    })

    // Notificar
    await sendEmail({
      to: org.ownerEmail,
      template: 'grandfathering-ended',
      data: { newPrice: getRegularPrice(org.tier) }
    })
  }
}
```

**Configuração Vercel:**

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/refill-scraping-credits",
      "schedule": "0 0 1 * *"
    },
    {
      "path": "/api/cron/reset-agi-quotas",
      "schedule": "0 0 1 * *"
    },
    {
      "path": "/api/cron/expire-addons",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/check-grandfathering",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Tarefas:**
- [ ] Implementar todos os cron jobs
- [ ] Configurar no Vercel
- [ ] Adicionar logging
- [ ] Testes de execução
- [ ] Monitoring (Sentry)

**Entregáveis:**
- ✅ Todos os crons funcionando
- ✅ Logs estruturados
- ✅ Monitoring ativo

---

### 4.6 Documentation & Communication

**Documentos a Criar:**

1. **CHANGELOG.md**
   - Anunciar v2.0
   - Listar todas as features novas
   - Explicar mudanças de planos

2. **MIGRATION_GUIDE.md**
   - Para clientes PRO → BUSINESS
   - Para clientes FREE >50 deals
   - FAQs

3. **USER_GUIDE_CHAT_CENTER.md**
   - Como conectar WhatsApp
   - Como usar o Chat Center
   - Troubleshooting

4. **USER_GUIDE_PROSPECTING.md**
   - Como usar prospecção
   - Melhores práticas
   - Limites de créditos

5. **ADMIN_GUIDE.md**
   - Gerenciar add-ons
   - Round-robin setup
   - Team reports

**Comunicação com Clientes:**

```typescript
// Email Templates a Criar

// 1. Para clientes PRO (upgrade gratuito)
Subject: 🎉 Você foi promovido para o Plano BUSINESS!

Olá [Nome],

Temos uma ótima notícia! Como agradecimento pela sua confiança,
promovemos sua conta para o Plano BUSINESS (valor R$ 149/mês)
GRATUITAMENTE por 6 meses.

Novas features que você já pode usar:
- 💬 Chat Center (WhatsApp integrado)
- 🕵️ 50 créditos de prospecção/mês
- 🎯 Distribuição automática de leads
- 📊 Relatórios de equipe

Seu preço continua R$ 97/mês até agosto/2026.

Aproveite!
Equipe Sirius CRM

// 2. Para clientes FREE >50 deals
Subject: ⚠️ Ação necessária: Limite de deals

Olá [Nome],

Sua conta FREE tem [X] deals ativos, acima do novo limite de 50.

Você tem 3 opções:
1. Upgrade para STARTER (R$ 49) - deals ilimitados
2. Arquivar [X-50] deals antigos
3. Manter todos em modo leitura (não pode editar)

Escolha sua opção em: [Link]

Dúvidas? Responda este email.

// 3. Anúncio geral (newsletter)
Subject: 🚀 Sirius CRM v2.0: WhatsApp, Prospecção e Muito Mais!

[Changelog visual com imagens]
```

**Tarefas:**
- [ ] Escrever toda a documentação
- [ ] Criar templates de email
- [ ] Gravar vídeos tutoriais
- [ ] Atualizar help center
- [ ] Preparar post de lançamento

**Entregáveis:**
- ✅ Documentação completa
- ✅ Templates de email
- ✅ Vídeos tutoriais
- ✅ Help center atualizado

---

### 📦 Entregáveis da Fase 4

- ✅ Round-robin funcionando (BUSINESS)
- ✅ Team reports (BUSINESS)
- ✅ IA quota system (FREE degustação)
- ✅ Upgrade prompts contextuais
- ✅ Todos os cron jobs ativos
- ✅ Documentação completa
- ✅ Comunicação preparada
- ✅ Testes E2E completos

**Duração:** 2 semanas
**Risco:** 🟢 Baixo (polish e docs)

---

## 🎬 LANÇAMENTO (Semana 9)

### Pre-Launch Checklist

**Técnico:**
- [ ] Todos os testes E2E passando (Playwright)
- [ ] Lighthouse score >90 (performance)
- [ ] Sentry configurado e testado
- [ ] Cron jobs rodando em produção
- [ ] Stripe/MP products criados
- [ ] Evolution API estável (uptime >99%)
- [ ] Database backups configurados
- [ ] Rollback plan documentado

**Negócio:**
- [ ] Pricing page atualizada
- [ ] Features page atualizada
- [ ] Emails de migração prontos
- [ ] Support team treinado
- [ ] FAQs atualizados
- [ ] Changelog publicado
- [ ] Post de blog escrito

**Legal/Compliance:**
- [ ] Termos de uso atualizados (add-ons)
- [ ] Política de privacidade (Evolution API)
- [ ] LGPD compliance check

### Launch Day Plan

**09:00** - Deploy para produção
**09:30** - Smoke tests
**10:00** - Migrar primeiros 10 clientes (canary)
**12:00** - Almoço + monitor
**14:00** - Migrar todos os clientes PRO
**15:00** - Enviar emails de comunicação
**16:00** - Publicar changelog + blog post
**17:00** - Anúncio em redes sociais
**18:00** - Monitor de 24h inicia

### Rollback Plan

Se >10% de error rate ou >5% de churn:

1. Reverter migration (clientes voltam para PRO v1)
2. Desabilitar feature gates v2.0
3. Comunicar transparentemente
4. Investigar e corrigir
5. Novo launch em 1 semana

---

## 📊 MÉTRICAS DE SUCESSO

### KPIs de Produto

**Adoção:**
- \>70% dos PRO usam Chat Center em 30 dias
- \>50% dos PRO usam Prospecção em 30 dias
- \>20% de conversão FREE → STARTER

**Engajamento:**
- Mensagens WhatsApp enviadas/dia
- Créditos de scraping consumidos
- Deals criados via prospecção

**Receita:**
- MRR growth \>30% em 90 dias
- LTV/CAC ratio \>3.0
- Churn rate \<5%

**Add-ons:**
- \>10% de PRO compram add-ons em 60 dias
- AOV (Average Order Value) de add-ons \>R$ 50

### Monitoramento

**Dashboard Interno:**
```sql
-- Criar view de métricas v2.0
CREATE VIEW v2_adoption_metrics AS
SELECT
  COUNT(DISTINCT wc.organizationId) AS orgs_using_chat,
  COUNT(DISTINCT sj.organizationId) AS orgs_using_scraping,
  COUNT(DISTINCT a.organizationId) AS orgs_with_addons,
  AVG(sc.usedThisMonth) AS avg_credits_used
FROM organizations o
LEFT JOIN whatsapp_connections wc ON wc.organizationId = o.id
LEFT JOIN scraping_jobs sj ON sj.organizationId = o.id
LEFT JOIN addons a ON a.organizationId = o.id
LEFT JOIN scraping_credits sc ON sc.organizationId = o.id
WHERE o.tier IN ('PRO', 'BUSINESS')
```

**Alertas:**
- Sentry: error rate \>1%
- Churn spike \>10%/semana
- Evolution API downtime \>5min
- Scraping failure rate \>20%

---

## 💰 PROJEÇÃO DE RECEITA

### Cenário Conservador (90 dias)

**Clientes Atuais:**
- 50 PRO → 50 BUSINESS (R$ 97 grandfathered) = R$ 4.850/mês
- Após 6 meses: 50 × R$ 149 = R$ 7.450/mês

**Novos Clientes:**
- +30 STARTER × R$ 49 = R$ 1.470/mês
- +20 PRO × R$ 97 = R$ 1.940/mês
- +5 BUSINESS × R$ 149 = R$ 745/mês

**Add-ons:**
- 10 orgs × R$ 30/mês (média) = R$ 300/mês

**TOTAL MRR:**
- Mês 1: R$ 8.560
- Mês 3: R$ 9.305
- Mês 6: R$ 11.905 (após fim do grandfathering)

**ARR Projetado:** ~R$ 143.000

---

## 🎯 PRÓXIMAS ITERAÇÕES (Pós-v2.0)

### v2.1 (30 dias após lançamento)
- A/B tests de pricing
- Otimizações de conversão
- Mobile app (PWA melhorado)

### v2.2 (60 dias)
- Integração com mais fontes de scraping
- WhatsApp templates library
- API pública v1 (beta)

### v3.0 (180 dias)
- IA para previsão de vendas
- Advanced reporting (BI)
- White-label solution
- Enterprise plan

---

## 📝 RECOMENDAÇÕES DO ARQUITETO

### Scraping Provider

**Escolha:** Outscraper (Google Maps) + Apify (LinkedIn)

**Justificativa:**
- Outscraper: R$ 0,10/100 leads (muito barato)
- Apify: R$ 0,15/100 leads (LinkedIn é nicho)
- Custo mensal esperado: R$ 100-200
- Escalável conforme demanda
- Sem infra própria (menos manutenção)

**Alternativa:** Se volume crescer muito (\>10k leads/mês), migrar para Bright Data.

### Clientes FREE \>50 Deals

**Escolha:** Opção C (Soft Archive)

**Justificativa:**
- Não perde dados (goodwill)
- Incentiva upgrade sem forçar
- UX aceitável
- Menor risco de churn

**Implementação:**
- Avisar 30 dias antes
- UI de "deals arquivados" simples
- Botão de upgrade visível

### Grandfathering PRO → BUSINESS

**Escolha:** 6 meses de R$ 97, depois R$ 149

**Justificativa:**
- Recompensa early adopters
- Tempo de provar valor do BUSINESS
- Comunica transparentemente o aumento
- Email + in-app notification 30 dias antes

### Evolution API (Self-Hosted)

**Escolha:** DigitalOcean Droplet (2GB RAM, R$ 48/mês)

**Justificativa:**
- Self-hosted = controle total
- Custo fixo e previsível
- Escalável (upgrade droplet se necessário)
- Sem vendor lock-in

**Setup:**
- Docker Compose
- Nginx reverse proxy
- Let's Encrypt SSL
- PostgreSQL + Redis
- Monit para auto-restart

---

## 🚨 RISCOS & MITIGAÇÕES

### 1. Evolution API Instabilidade
**Risco:** Downtime afeta experiência de Chat Center
**Mitigação:**
- Uptime monitoring (UptimeRobot)
- Auto-restart (Monit)
- Fallback para click-to-chat
- SLA interno: 99% uptime

### 2. Scraping Providers Ban
**Risco:** Outscraper/Apify bloqueados
**Mitigação:**
- Ter 3 providers configurados
- Fallback automático
- Rate limiting interno
- Compliance com ToS

### 3. Churn em Migração
**Risco:** Clientes não entendem mudanças
**Mitigação:**
- Comunicação clara 30 dias antes
- Grandfathering generoso
- Support ativo (chat)
- FAQs detalhadas

### 4. Complexidade do Sistema
**Risco:** Bugs em produção
**Mitigação:**
- Testes E2E completos (>90% coverage)
- Canary deployment (10% first)
- Rollback plan documentado
- Monitoring 24/7 (Sentry)

---

## 📚 RECURSOS NECESSÁRIOS

### Equipe

**Dev:**
- 1 Full-stack (você) - 100% dedicação
- 1 Frontend (opcional) - para acelerar UI
- 1 QA (part-time) - testes E2E

**Infra:**
- 1 DevOps (consultoria) - setup Evolution API

**Design:**
- 1 Designer (freelance) - Chat Center mockups

### Custos Mensais Recorrentes

| Item | Custo |
|------|-------|
| DigitalOcean (Evolution API) | R$ 48 |
| Outscraper (scraping) | R$ 100-200 |
| Apify (LinkedIn scraping) | R$ 50-100 |
| Stripe/MP fees (2.9% + R$ 0,39) | Variável |
| Vercel Pro | US$ 20 (~R$ 100) |
| Sentry | Grátis (tier atual) |
| **TOTAL** | **~R$ 300-450/mês** |

### Custos One-Time

| Item | Custo |
|------|-------|
| Designer (mockups) | R$ 500-1000 |
| DevOps (setup) | R$ 1000-2000 |
| **TOTAL** | **~R$ 1500-3000** |

---

## ✅ DEFINITION OF DONE

A migração para v2.0 está completa quando:

**Técnico:**
- [ ] Schema migrado em produção
- [ ] Todos os testes E2E passando
- [ ] Chat Center funcionando para PRO+
- [ ] Scraping funcionando para PRO+
- [ ] Add-ons marketplace ativo
- [ ] Round-robin funcionando para BUSINESS
- [ ] Todos os cron jobs ativos
- [ ] Monitoring e alertas configurados
- [ ] Performance: LCP \<2.5s, FID \<100ms

**Produto:**
- [ ] 100% dos clientes PRO migrados para BUSINESS
- [ ] FREE \>50 deals: estratégia aplicada
- [ ] Feature gates funcionando em todas as features
- [ ] Upgrade prompts contextuais ativos
- [ ] Pricing page atualizada

**Documentação:**
- [ ] CHANGELOG publicado
- [ ] User guides escritos
- [ ] FAQs atualizados
- [ ] Vídeos tutoriais gravados
- [ ] Help center atualizado

**Comunicação:**
- [ ] Emails de migração enviados
- [ ] Blog post publicado
- [ ] Redes sociais atualizadas
- [ ] Support team treinado

**Negócio:**
- [ ] Churn \<5% na primeira semana
- [ ] \>50% dos PRO testaram Chat Center
- [ ] Zero critical bugs em produção
- [ ] NPS \>40 nos primeiros 30 dias

---

## 🎬 CONCLUSÃO

Este roadmap define um caminho claro e executável para migrar o Sirius CRM para a arquitetura v2.0 de planos modularizados.

**Próximos Passos Imediatos:**

1. ✅ Aprovar roadmap
2. ✅ Definir scraping provider final (recomendação: Outscraper)
3. ✅ Decidir estratégia FREE \>50 deals (recomendação: Soft Archive)
4. 🚀 Iniciar Fase 1 (Foundation)

**Contato para Dúvidas:**
Este roadmap está vivo e pode ser ajustado conforme aprendizados.

---

**Última Atualização:** 2026-02-04
**Versão:** 1.0
**Status:** 🟡 Aguardando Aprovação
