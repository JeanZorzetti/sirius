# 📡 API Reference - Sirius CRM

## Status da API

⚠️ **API Pública em Desenvolvimento** (Planejada para v1.1 - Q1 2025)

Atualmente, o Sirius CRM utiliza:
- **Server Actions** do Next.js para mutations
- **Server Components** para queries
- **API Routes** para webhooks externos (Stripe, Resend)

Esta documentação prepara a estrutura para a **API REST pública** que será lançada em breve.

---

## 🎯 Visão Geral

### Endpoints Planejados

| Categoria | Endpoints | Status |
|-----------|-----------|--------|
| **Authentication** | `/api/v1/auth/*` | 🔮 Planejado |
| **Deals** | `/api/v1/deals/*` | 🔮 Planejado |
| **Contacts** | `/api/v1/contacts/*` | ✅ Parcial |
| **Pipelines** | `/api/v1/pipelines/*` | 🔮 Planejado |
| **Analytics** | `/api/v1/analytics/*` | 🔮 Planejado |
| **Webhooks** | `/api/v1/webhooks/*` | ✅ Implementado |
| **Organizations** | `/api/v1/organizations/*` | 🔮 Planejado |

### Base URL

```
Production: https://sirius.roilabs.com.br/api/v1
Development: http://localhost:3000/api/v1
```

---

## 🔐 Autenticação

### Método: API Keys (Planejado v1.1)

```http
Authorization: Bearer YOUR_API_KEY
```

**Obter API Key:**
1. Acesse `/dashboard/settings/api`
2. Clique em "Generate API Key"
3. Copie e guarde com segurança (só é exibida uma vez)

**Segurança:**
- API Keys são hasheadas no banco (bcrypt)
- Rate limiting por key
- Revogação instantânea
- Logs de uso por key

### Autenticação Atual (NextAuth)

Atualmente, a autenticação é feita via:
- **Session cookies** (database sessions)
- **NextAuth.js** (Auth.js v5)
- **CSRF protection** (SameSite cookies)

```typescript
// Exemplo: Server Action com auth
'use server'

export async function createDeal(data: DealInput) {
  const session = await getServerSession(authOptions)

  if (!session) {
    throw new Error('Unauthorized')
  }

  // User autenticado, pode criar deal
  const deal = await prisma.deal.create({
    data: {
      ...data,
      userId: session.user.id,
      organizationId: session.user.organizationId
    }
  })

  return deal
}
```

---

## 📋 Endpoints

### **Contacts API** (Parcialmente Implementado)

#### `GET /api/contacts`

Lista todos os contatos da organização.

**Query Parameters:**
```typescript
{
  page?: number          // Default: 1
  limit?: number         // Default: 20, Max: 100
  search?: string        // Busca por nome/email
  sortBy?: 'name' | 'email' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}
```

**Response:**
```json
{
  "contacts": [
    {
      "id": "clx...",
      "name": "João Silva",
      "email": "joao@example.com",
      "phone": "+55 11 99999-9999",
      "company": "Empresa XYZ",
      "createdAt": "2024-01-15T10:30:00Z",
      "deals": [
        {
          "id": "clx...",
          "title": "Deal 1",
          "value": 5000
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Status Codes:**
- `200` OK
- `401` Unauthorized
- `403` Forbidden (not in organization)
- `500` Internal Server Error

---

### **Deals API** (Planejado v1.1)

#### `GET /api/v1/deals`

Lista todos os deals da organização.

**Query Parameters:**
```typescript
{
  pipelineId?: string    // Filtrar por pipeline
  stageId?: string       // Filtrar por etapa
  userId?: string        // Filtrar por responsável
  status?: 'OPEN' | 'WON' | 'LOST'
  page?: number
  limit?: number
}
```

**Response:**
```json
{
  "deals": [
    {
      "id": "clx...",
      "title": "Venda Empresa ABC",
      "value": 15000,
      "expectedCloseDate": "2024-02-15",
      "status": "OPEN",
      "stage": {
        "id": "clx...",
        "name": "Negociação",
        "order": 3
      },
      "contact": {
        "id": "clx...",
        "name": "João Silva",
        "email": "joao@abc.com"
      },
      "user": {
        "id": "clx...",
        "name": "Vendedor 1"
      },
      "createdAt": "2024-01-10T14:20:00Z",
      "updatedAt": "2024-01-12T09:15:00Z"
    }
  ],
  "pagination": {...}
}
```

#### `POST /api/v1/deals`

Cria um novo deal.

**Request Body:**
```json
{
  "title": "Nova Venda",
  "value": 10000,
  "expectedCloseDate": "2024-03-01",
  "contactId": "clx...",
  "pipelineId": "clx...",
  "stageId": "clx...",
  "userId": "clx..."  // Opcional, default: user autenticado
}
```

**Response:**
```json
{
  "deal": {
    "id": "clx...",
    "title": "Nova Venda",
    "value": 10000,
    "status": "OPEN",
    "createdAt": "2024-01-15T16:30:00Z"
  }
}
```

**Status Codes:**
- `201` Created
- `400` Bad Request (validation error)
- `401` Unauthorized
- `403` Forbidden (PRO feature if creating in non-default pipeline)

#### `PATCH /api/v1/deals/:id`

Atualiza um deal existente.

**Request Body:**
```json
{
  "title": "Título Atualizado",
  "value": 12000,
  "stageId": "clx..."  // Move para outra etapa
}
```

#### `DELETE /api/v1/deals/:id`

Deleta um deal (soft delete).

**Response:**
```json
{
  "message": "Deal deleted successfully",
  "id": "clx..."
}
```

---

### **Pipelines API** (Planejado v1.1)

#### `GET /api/v1/pipelines`

Lista todos os pipelines da organização.

**Response:**
```json
{
  "pipelines": [
    {
      "id": "clx...",
      "name": "Vendas Diretas",
      "isDefault": true,
      "stages": [
        {
          "id": "clx...",
          "name": "Qualificação",
          "order": 1,
          "color": "#3B82F6",
          "dealsCount": 5
        },
        {
          "id": "clx...",
          "name": "Proposta",
          "order": 2,
          "color": "#8B5CF6",
          "dealsCount": 3
        }
      ],
      "dealsCount": 25,
      "totalValue": 125000,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### `POST /api/v1/pipelines` (PRO Only)

Cria um novo pipeline.

**Request Body:**
```json
{
  "name": "Pipeline Parcerias",
  "stages": [
    {
      "name": "Prospecção",
      "color": "#3B82F6"
    },
    {
      "name": "Negociação",
      "color": "#8B5CF6"
    },
    {
      "name": "Fechamento",
      "color": "#10B981"
    }
  ]
}
```

---

### **Analytics API** (Planejado v1.1)

#### `GET /api/v1/analytics/overview`

Retorna KPIs principais do dashboard.

**Query Parameters:**
```typescript
{
  pipelineId?: string    // Filtrar por pipeline
  period?: '7d' | '30d' | '90d' | 'custom'
  startDate?: string     // ISO 8601
  endDate?: string       // ISO 8601
}
```

**Response:**
```json
{
  "kpis": {
    "totalPipelineValue": 250000,
    "conversionRate": 23.5,
    "forecastThisMonth": 45000,
    "averageTicket": 8500
  },
  "dealsByStage": [
    {
      "stageName": "Qualificação",
      "count": 12,
      "value": 60000
    },
    {
      "stageName": "Proposta",
      "count": 8,
      "value": 80000
    }
  ]
}
```

#### `GET /api/v1/analytics/pro` (PRO Only)

Retorna analytics avançado (8 KPIs + 4 gráficos).

**Response:**
```json
{
  "kpis": {
    "conversionRate": 23.5,
    "winRate": 34.2,
    "averageDealValue": 8500,
    "salesCycleLength": 18,
    "pipelineVelocity": 2.3,
    "forecast30d": 45000,
    "forecast60d": 95000,
    "forecast90d": 150000,
    "churnRate": 3.2,
    "ltvCacRatio": 4.5
  },
  "charts": {
    "pipelineTrend": [...],
    "conversionFunnel": [...],
    "winLossBreakdown": {...},
    "revenueForecast": [...]
  }
}
```

---

## 🪝 Webhooks

### Eventos Disponíveis

O Sirius CRM pode enviar webhooks para endpoints externos quando certos eventos ocorrem.

**Eventos:**
- `deal.created` - Novo deal criado
- `deal.updated` - Deal atualizado
- `deal.stage_changed` - Deal mudou de etapa
- `deal.won` - Deal ganho
- `deal.lost` - Deal perdido
- `contact.created` - Novo contato criado
- `organization.upgraded` - Org fez upgrade para PRO
- `organization.downgraded` - Org fez downgrade para FREE

### Configurar Webhook

**No Dashboard:**
1. Vá em `/dashboard/settings/webhooks` (PRO only)
2. Clique em "Add Webhook"
3. Insira URL do endpoint
4. Selecione eventos
5. Salve (receberá um `webhook_secret`)

### Payload Exemplo

```json
{
  "event": "deal.stage_changed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "deal": {
      "id": "clx...",
      "title": "Venda ABC",
      "value": 15000,
      "previousStage": {
        "id": "clx...",
        "name": "Proposta"
      },
      "currentStage": {
        "id": "clx...",
        "name": "Negociação"
      }
    },
    "organization": {
      "id": "clx...",
      "name": "Empresa XYZ"
    },
    "user": {
      "id": "clx...",
      "name": "João Vendedor"
    }
  }
}
```

### Verificar Webhook Signature

```typescript
import crypto from 'crypto'

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

// Uso no endpoint
export async function POST(req: Request) {
  const payload = await req.text()
  const signature = req.headers.get('X-Sirius-Signature')
  const secret = process.env.WEBHOOK_SECRET

  if (!verifyWebhookSignature(payload, signature, secret)) {
    return new Response('Invalid signature', { status: 401 })
  }

  // Processar webhook
  const data = JSON.parse(payload)
  console.log('Webhook recebido:', data.event)

  return new Response('OK', { status: 200 })
}
```

---

## 🔒 Rate Limiting

### Limites por Plano

| Plano | Requests/min | Requests/hora | Requests/dia |
|-------|:------------:|:-------------:|:------------:|
| FREE | 60 | 1,000 | 10,000 |
| PRO | 300 | 10,000 | 100,000 |

### Headers de Rate Limit

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642345678
```

### Resposta ao Atingir Limite

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again in 30 seconds.",
    "retryAfter": 30
  }
}
```

**Status Code:** `429 Too Many Requests`

---

## ⚠️ Error Handling

### Códigos de Erro

| Código | Descrição |
|--------|-----------|
| `400` | Bad Request - Validação falhou |
| `401` | Unauthorized - API key inválida ou ausente |
| `403` | Forbidden - Sem permissão (feature PRO, role inadequada) |
| `404` | Not Found - Recurso não existe |
| `409` | Conflict - Conflito (ex: email duplicado) |
| `422` | Unprocessable Entity - Dados inválidos |
| `429` | Too Many Requests - Rate limit excedido |
| `500` | Internal Server Error - Erro no servidor |
| `503` | Service Unavailable - Manutenção |

### Formato de Erro

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      },
      {
        "field": "value",
        "message": "Value must be greater than 0"
      }
    ],
    "requestId": "req_abc123",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Códigos de Erro Customizados

| Código | Descrição |
|--------|-----------|
| `UNAUTHORIZED` | API key inválida |
| `FORBIDDEN` | Sem permissão |
| `NOT_FOUND` | Recurso não encontrado |
| `VALIDATION_ERROR` | Erro de validação |
| `DUPLICATE_ENTRY` | Entrada duplicada |
| `RATE_LIMIT_EXCEEDED` | Rate limit excedido |
| `FEATURE_NOT_AVAILABLE` | Feature não disponível no plano |
| `ORGANIZATION_LIMIT_REACHED` | Limite da org atingido |
| `INVALID_PIPELINE` | Pipeline inválido para operação |

---

## 📚 SDKs e Libraries

### JavaScript/TypeScript SDK (Planejado)

```bash
npm install @sirius-crm/sdk
```

```typescript
import { SiriusCRM } from '@sirius-crm/sdk'

const client = new SiriusCRM({
  apiKey: process.env.SIRIUS_API_KEY,
  environment: 'production' // or 'development'
})

// Criar deal
const deal = await client.deals.create({
  title: 'Nova Venda',
  value: 10000,
  contactId: 'clx...',
  stageId: 'clx...'
})

// Listar contatos
const contacts = await client.contacts.list({
  page: 1,
  limit: 20,
  search: 'joão'
})

// Buscar analytics
const analytics = await client.analytics.getOverview({
  period: '30d',
  pipelineId: 'clx...'
})
```

### Python SDK (Planejado v2.0)

```bash
pip install sirius-crm
```

```python
from sirius_crm import SiriusCRM

client = SiriusCRM(api_key=os.getenv('SIRIUS_API_KEY'))

# Criar deal
deal = client.deals.create(
    title='Nova Venda',
    value=10000,
    contact_id='clx...',
    stage_id='clx...'
)

# Listar contatos
contacts = client.contacts.list(page=1, limit=20)
```

---

## 🔗 Integrações Nativas

### Stripe (Pagamentos)

**Webhook Endpoint:** `/api/webhooks/stripe`

**Eventos processados:**
- `checkout.session.completed` - Assinatura criada
- `invoice.paid` - Pagamento recebido
- `customer.subscription.updated` - Assinatura atualizada
- `customer.subscription.deleted` - Assinatura cancelada

### Resend (Email)

**Webhook Endpoint:** `/api/webhooks/resend`

**Eventos processados:**
- `email.sent` - Email enviado
- `email.delivered` - Email entregue
- `email.opened` - Email aberto
- `email.clicked` - Link clicado
- `email.bounced` - Email rejeitado

---

## 🧪 Sandbox & Testing

### Ambiente de Teste

```
Sandbox URL: https://sandbox.sirius.roilabs.com.br/api/v1
```

**Características:**
- Banco de dados separado
- API keys de teste
- Rate limits menores (10 req/min)
- Dados resetados semanalmente
- Ideal para integração

### Exemplo de Teste

```typescript
import { test, expect } from '@jest/globals'
import { SiriusCRM } from '@sirius-crm/sdk'

const client = new SiriusCRM({
  apiKey: process.env.SIRIUS_TEST_API_KEY,
  environment: 'sandbox'
})

test('deve criar deal com sucesso', async () => {
  const deal = await client.deals.create({
    title: 'Test Deal',
    value: 1000,
    contactId: 'test_contact_id',
    stageId: 'test_stage_id'
  })

  expect(deal.id).toBeDefined()
  expect(deal.title).toBe('Test Deal')
  expect(deal.value).toBe(1000)
})
```

---

## 📊 API Versioning

### Estratégia de Versão

- **URL Versioning:** `/api/v1/`, `/api/v2/`
- **Suporte:** Cada versão é suportada por 12 meses após deprecação
- **Breaking Changes:** Apenas em novas major versions

### Changelog

**v1.0 (Current - Planning)**
- Autenticação via API Keys
- CRUD de Deals, Contacts, Pipelines
- Analytics endpoints
- Webhooks

**v2.0 (Planejado Q3 2025)**
- OAuth 2.0 support
- GraphQL endpoint
- Batch operations
- Real-time WebSocket API

---

## 🆘 Suporte

- **Documentação:** [docs.sirius.roilabs.com.br](https://docs.sirius.roilabs.com.br)
- **Email:** api@roilabs.com.br
- **Status Page:** [status.sirius.roilabs.com.br](https://status.sirius.roilabs.com.br)
- **GitHub Issues:** [github.com/JeanZorzetti/sirius/issues](https://github.com/JeanZorzetti/sirius/issues)

---

## 📝 Roadmap da API

### v1.1 - Q1 2025
- [ ] API REST pública
- [ ] API Key authentication
- [ ] Rate limiting
- [ ] Webhooks customizados
- [ ] SDK JavaScript/TypeScript

### v1.2 - Q2 2025
- [ ] Advanced filtering & search
- [ ] Bulk operations
- [ ] Export/Import API
- [ ] Audit logs API

### v2.0 - Q3 2025
- [ ] OAuth 2.0
- [ ] GraphQL endpoint
- [ ] WebSocket real-time API
- [ ] Python SDK
- [ ] Mobile SDKs (iOS/Android)

---

**Última atualização:** 2024-01-15
**Versão da API:** v1.0 (em desenvolvimento)
