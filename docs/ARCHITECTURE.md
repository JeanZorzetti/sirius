# 🏗️ Arquitetura - Sirius CRM

## Visão Geral

Sirius CRM é uma aplicação SaaS moderna para gestão de vendas, construída com Next.js 16, React, TypeScript e Prisma ORM. A arquitetura é orientada a componentes, server-first, com otimizações de performance e segurança de nível enterprise.

## 📊 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUÁRIO FINAL                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL EDGE NETWORK                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   CDN Cache  │  │ Image Optim  │  │   Firewall   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS 16 APP ROUTER                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              SERVER COMPONENTS (RSC)                        │ │
│  │  • Marketing Pages (Static)                                │ │
│  │  • Dashboard Pages (Dynamic)                               │ │
│  │  • Server Actions (Mutations)                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              CLIENT COMPONENTS (Interactive)                │ │
│  │  • Kanban Board (DnD)                                      │ │
│  │  • Forms & Dialogs                                         │ │
│  │  • Charts (Recharts)                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              API ROUTES                                     │ │
│  │  • /api/auth/[...nextauth]  - NextAuth                     │ │
│  │  • /api/contacts            - CRUD Operations              │ │
│  │  • /api/stripe/*            - Payments                     │ │
│  │  • /api/webhooks/*          - External Events              │ │
│  │  • /api/cron/*              - Scheduled Jobs               │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA DE DADOS                               │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │  Prisma ORM    │  │  NextAuth.js   │  │   Sentry.io    │    │
│  │  (Type-safe)   │  │  (Auth)        │  │  (Monitoring)  │    │
│  └────────┬───────┘  └────────┬───────┘  └────────────────┘    │
│           │                   │                                  │
└───────────┼───────────────────┼──────────────────────────────────┘
            │                   │
            ▼                   ▼
┌─────────────────┐   ┌─────────────────┐
│  PostgreSQL DB  │   │  Session Store  │
│  (Neon/Vercel)  │   │  (DB Sessions)  │
└─────────────────┘   └─────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│         INTEGRAÇÕES EXTERNAS             │
│  • Stripe (Payments)                    │
│  • Resend (Emails)                      │
│  • Sentry (Error Tracking)              │
└─────────────────────────────────────────┘
```

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** Next.js 16.1.1 (App Router, React Server Components)
- **UI Library:** React 19
- **Language:** TypeScript 5
- **Styling:**
  - Tailwind CSS 3.4
  - shadcn/ui (Radix UI primitives)
  - Custom design system
- **State Management:**
  - React Server Components (server state)
  - useState/useReducer (client state)
  - URL state (searchParams)
- **Charts:** Recharts 3.6.0
- **Forms:** React Hook Form + Zod validation
- **Drag & Drop:** @dnd-kit/core

### **Backend**
- **Runtime:** Node.js 20+
- **Framework:** Next.js API Routes & Server Actions
- **ORM:** Prisma 5.19.0
- **Database:** PostgreSQL 15+
- **Authentication:** NextAuth.js (Auth.js v5)
- **Session Management:** Database sessions (secure)

### **Infrastructure**
- **Hosting:** Vercel (Edge Network)
- **Database:** Neon/Vercel Postgres
- **CDN:** Vercel Edge Network
- **Monitoring:** Sentry.io
- **Logs:** Pino (structured logging)

### **Payments & Billing**
- **Provider:** Stripe
- **Integration:** Webhooks + Checkout Sessions
- **Plans:** FREE, PRO (MRR tracking)

### **Email**
- **Provider:** Resend
- **Templates:** React Email
- **Automation:** Event-driven (deal stages, upgrades)

### **Developer Tools**
- **Package Manager:** npm
- **Testing:**
  - Playwright (E2E)
  - Vitest (Unit - planned)
- **Code Quality:**
  - ESLint
  - TypeScript strict mode
  - Prettier (formatting)
- **CI/CD:** Vercel (automatic deploys)

## 🏛️ Padrões de Arquitetura

### **1. Server-First Architecture**

```typescript
// ✅ Server Component (default)
export default async function DashboardPage() {
  const deals = await prisma.deal.findMany({
    where: { organizationId: user.organizationId }
  })

  return <DashboardClient deals={deals} />
}

// ✅ Client Component (when needed)
'use client'
export function DashboardClient({ deals }) {
  const [filter, setFilter] = useState('')
  return <KanbanBoard deals={deals} filter={filter} />
}
```

**Benefícios:**
- Menor bundle JavaScript (server components não vão pro cliente)
- Melhor SEO (HTML renderizado no servidor)
- Acesso direto ao banco sem API routes
- Dados frescos em cada request

### **2. Server Actions Pattern**

```typescript
// app/dashboard/actions.ts
'use server'

export async function createDeal(formData: FormData) {
  const session = await getSession()

  // Validação
  const data = dealSchema.parse({
    title: formData.get('title'),
    value: formData.get('value'),
  })

  // Mutation
  const deal = await prisma.deal.create({
    data: { ...data, userId: session.user.id }
  })

  // Revalidation
  revalidatePath('/dashboard')

  return { success: true, deal }
}
```

**Benefícios:**
- Type-safe mutations
- Automatic revalidation
- Progressive enhancement
- Menor código boilerplate

### **3. Multi-Tenancy Pattern**

```typescript
// Todos os modelos têm organizationId
model Deal {
  id             String       @id
  organizationId String       // Tenant isolation
  organization   Organization @relation(...)

  @@index([organizationId, stageId]) // Performance
}

// Queries sempre filtram por org
const deals = await prisma.deal.findMany({
  where: { organizationId: user.organizationId }
})
```

**Benefícios:**
- Isolamento total de dados entre organizações
- Segurança row-level
- Performance otimizada (indexes compostos)

### **4. Role-Based Access Control (RBAC)**

```typescript
// Níveis de acesso
enum Role {
  USER  = 'USER',   // Usuário regular
  ADMIN = 'ADMIN'   // Admin da plataforma (ROI Labs)
}

enum OrgRole {
  OWNER  = 'OWNER',  // Dono da organização
  MEMBER = 'MEMBER'  // Membro da equipe
}

// Verificação de permissões
if (user.role !== 'ADMIN') {
  throw new Error('Access denied')
}

if (user.orgRole !== 'OWNER') {
  // Members só veem seus próprios deals
  where.userId = user.id
}
```

### **5. Feature Flags Pattern**

```typescript
// Plan-based features
const isPro = user.organization.plan === 'PRO'

if (!isPro) {
  return <UpgradePage feature="Analytics PRO" />
}

// Feature gates em server components
export default async function AnalyticsProPage() {
  const user = await getUser()

  if (user.organization.plan !== 'PRO') {
    return <UpgradeRequired />
  }

  return <AnalyticsProDashboard />
}
```

### **6. Performance Patterns**

**a) Query Optimization:**
```typescript
// ✅ Select apenas campos necessários
const user = await prisma.user.findUnique({
  where: { email },
  select: {
    id: true,
    organizationId: true,
    organization: {
      select: { plan: true }
    }
  }
})

// ✅ Includes para evitar N+1
const stages = await prisma.pipelineStage.findMany({
  include: {
    deals: {
      include: {
        contact: {
          select: { id: true, name: true }
        }
      }
    }
  }
})
```

**b) Database Indexes:**
```prisma
model Deal {
  @@index([organizationId, stageId]) // Kanban queries
  @@index([userId])                   // User filter
}

model Contact {
  @@index([organizationId])           // Listing
}
```

**c) Image Optimization:**
```typescript
<Image
  src="/logo.png"
  alt="Logo"
  priority              // Critical images
  sizes="32px"          // Responsive sizing
  // Auto WebP/AVIF conversion
/>
```

### **7. Analytics Pattern**

```typescript
// Snapshot-based analytics (não recalcula histórico)
model DealSnapshot {
  date            DateTime
  totalDeals      Int
  totalValue      Decimal
  dealsByStage    Json     // Pre-aggregated
  organizationId  String

  @@unique([organizationId, date])
}

// Cron job diário
export async function POST() {
  const orgs = await prisma.organization.findMany()

  for (const org of orgs) {
    const snapshot = await calculateDailySnapshot(org.id)
    await prisma.dealSnapshot.create({ data: snapshot })
  }
}
```

## 📁 Estrutura de Pastas

```
crm-project/
├── app/                          # Next.js App Router
│   ├── (marketing)/              # Grupo de rotas públicas
│   │   ├── layout.tsx            # Layout marketing
│   │   ├── page.tsx              # Homepage
│   │   ├── about/                # Sobre nós
│   │   ├── blog/                 # Blog posts
│   │   └── pricing/              # Preços
│   ├── dashboard/                # App autenticado
│   │   ├── page.tsx              # Kanban board
│   │   ├── contacts/             # Gestão de contatos
│   │   ├── analytics/            # Dashboard analytics
│   │   ├── analytics-pro/        # Analytics PRO (feature gate)
│   │   ├── billing/              # Planos e pagamento
│   │   └── settings/             # Configurações
│   ├── admin/                    # Admin dashboard (ADMIN role)
│   │   ├── analytics/            # Platform analytics
│   │   ├── organizations/        # Gestão de orgs
│   │   └── users/                # Gestão de users
│   ├── api/                      # API Routes
│   │   ├── auth/                 # NextAuth endpoints
│   │   ├── contacts/             # Contact CRUD
│   │   ├── stripe/               # Stripe integration
│   │   ├── webhooks/             # External webhooks
│   │   └── cron/                 # Scheduled jobs
│   ├── login/                    # Auth pages
│   ├── register/
│   └── layout.tsx                # Root layout
├── components/                   # Componentes React
│   ├── ui/                       # shadcn/ui components
│   ├── dashboard/                # Dashboard components
│   ├── analytics/                # Analytics components
│   ├── marketing/                # Marketing components
│   └── contacts/                 # Contact components
├── lib/                          # Utilities & configs
│   ├── prisma.ts                 # Prisma client
│   ├── auth.ts                   # NextAuth config
│   ├── stripe.ts                 # Stripe client
│   ├── logger.ts                 # Pino logger
│   ├── analytics/                # Analytics logic
│   └── utils.ts                  # Helper functions
├── prisma/                       # Database
│   ├── schema.prisma             # Schema definition
│   └── migrations/               # Migration history
├── public/                       # Static assets
├── docs/                         # Documentação
└── tests/                        # E2E tests (Playwright)
```

## 🔒 Segurança

### **Autenticação**
- NextAuth.js com database sessions (não JWT)
- Password hashing com bcrypt
- Session rotation automática
- CSRF protection (SameSite cookies)

### **Autorização**
- Row-level security (organizationId filtering)
- Role-based access control (RBAC)
- Server-side validation em todas mutations
- Feature gates baseados em plano

### **Data Protection**
- SQL Injection: Prisma ORM (prepared statements)
- XSS: React auto-escaping + sanitization
- CSRF: SameSite cookies + token validation
- Secrets: Environment variables (never hardcoded)

### **Monitoring**
- Sentry: Error tracking + performance monitoring
- Structured logging: Pino (JSON logs)
- Audit trail: UserActivity tracking

## 🚀 Performance

### **Otimizações Implementadas**

1. **Database:**
   - 4 indexes estratégicos
   - Query optimization (select/include)
   - Connection pooling

2. **Frontend:**
   - Server Components (RSC)
   - Image optimization (WebP/AVIF)
   - Code splitting automático
   - Static generation onde possível

3. **Caching:**
   - Next.js route cache
   - Image cache (1 ano)
   - Database query cache

4. **Bundle Size:**
   - Server components reduzem JS client-side
   - Tree shaking automático
   - Dynamic imports para features pesadas

### **Métricas Target**
- **LCP:** < 2.5s (Largest Contentful Paint)
- **FID:** < 100ms (First Input Delay)
- **CLS:** < 0.1 (Cumulative Layout Shift)
- **TTI:** < 3.5s (Time to Interactive)

## 🔄 Data Flow

### **Leitura de Dados (Read)**
```
User Request
    ↓
Next.js Server Component
    ↓
Prisma Query (optimized)
    ↓
PostgreSQL (indexed)
    ↓
Server Component Render
    ↓
HTML Response (cached)
```

### **Mutação de Dados (Write)**
```
User Action (Form Submit)
    ↓
Server Action
    ↓
Validation (Zod schema)
    ↓
Authorization Check
    ↓
Prisma Mutation
    ↓
Database Write
    ↓
revalidatePath()
    ↓
UI Auto-update
```

## 📦 Build & Deploy

### **Build Process**
```bash
npm run build
  ↓
1. Prisma generate    # Generate type-safe client
2. Next.js build      # Compile app
3. TypeScript check   # Type safety
4. Sentry upload      # Source maps
```

### **Deploy Process**
```
Git Push to main
    ↓
Vercel Detects Changes
    ↓
Install Dependencies
    ↓
Run Migrations (npx prisma migrate deploy)
    ↓
Build Application
    ↓
Deploy to Edge Network
    ↓
Health Checks
    ↓
Traffic Switch (zero-downtime)
```

## 🧪 Testing Strategy

### **Níveis de Teste**
1. **E2E Tests:** Playwright (user flows críticos)
2. **Integration Tests:** API routes + database
3. **Unit Tests:** Utilities e helpers (Vitest)

### **Coverage Target**
- Critical paths: 90%+
- Overall: 70%+

## 📚 Referências

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js Docs](https://next-auth.js.org)
- [Vercel Platform](https://vercel.com/docs)
