# 📋 DOSSIÊ COMPLETO - SIRIUS CRM
## Projeto de CRM Empresarial com IA e Automações

---

## 📑 ÍNDICE

1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Informações Técnicas](#informações-técnicas)
3. [Arquitetura do Sistema](#arquitetura-do-sistema)
4. [Estrutura de Diretórios](#estrutura-de-diretórios)
5. [Funcionalidades Principais](#funcionalidades-principais)
6. [Stack Tecnológico](#stack-tecnológico)
7. [Banco de Dados](#banco-de-dados)
8. [APIs e Integrações](#apis-e-integrações)
9. [Autenticação e Segurança](#autenticação-e-segurança)
10. [Analytics e Monitoramento](#analytics-e-monitoramento)
11. [PWA e Mobile](#pwa-e-mobile)
12. [AGI Sirius (Assistente de IA)](#agi-sirius-assistente-de-ia)
13. [Sistema de Testes](#sistema-de-testes)
14. [Deploy e Infraestrutura](#deploy-e-infraestrutura)
15. [Configuração e Variáveis de Ambiente](#configuração-e-variáveis-de-ambiente)
16. [Scripts Disponíveis](#scripts-disponíveis)
17. [Dependências do Projeto](#dependências-do-projeto)
18. [Roadmap e Histórico](#roadmap-e-histórico)
19. [Documentação Técnica](#documentação-técnica)
20. [Marketing e SEO](#marketing-e-seo)

---

## 1. VISÃO GERAL DO PROJETO

### 🎯 Descrição
**Sirius CRM** é uma plataforma SaaS completa de gestão de vendas (Customer Relationship Management) desenvolvida pela **ROI Labs**, focada no mercado brasileiro. O sistema oferece gestão de pipeline visual, automação de vendas, inteligência artificial para análise de deals, integrações com WhatsApp e Google Calendar, e analytics avançado.

### 🌟 Proposta de Valor
- **CRM Intuitivo**: Interface visual Kanban para gestão de pipeline de vendas
- **IA Integrada**: Assistente AGI Sirius para análise de deals, qualificação BANT/MEDDIC e geração de scripts
- **Multi-tenant**: Suporte completo para múltiplas organizações
- **Automações**: Email marketing, WhatsApp, sincronização de calendário
- **Analytics**: Métricas em tempo real, forecasting e data warehouse
- **PWA**: Aplicativo instalável com modo offline

### 👥 Público-Alvo
- Corretores de imóveis
- Consultores de vendas
- Agências de marketing
- Representantes comerciais
- Instaladores de energia solar
- Times de vendas B2B

### 📊 Status do Projeto
- **Versão Atual**: 1.0.0
- **Status**: Produção
- **URL de Produção**: https://sirius.roilabs.com.br
- **Repositório**: https://github.com/JeanZorzetti/sirius.git
- **Última Atualização**: Janeiro 2026

---

## 2. INFORMAÇÕES TÉCNICAS

### 📦 Metadados do Projeto
```json
{
  "name": "crm-project",
  "version": "0.1.0",
  "private": true,
  "author": "Jean Zorzetti",
  "organization": "ROI Labs",
  "license": "Proprietário"
}
```

### 🔧 Requisitos do Sistema
- **Node.js**: 20+ (LTS)
- **npm**: 9+
- **PostgreSQL**: 15+
- **RAM**: Mínimo 4GB (Recomendado 8GB)
- **Espaço em Disco**: ~500MB (node_modules incluído)

### 🌐 Navegadores Suportados
- Chrome/Edge 100+
- Firefox 95+
- Safari 15+
- Mobile (iOS Safari 15+, Chrome Android 100+)

---

## 3. ARQUITETURA DO SISTEMA

### 🏗️ Diagrama Arquitetural

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUÁRIO FINAL                            │
│                    (Web, Mobile, PWA)                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL EDGE NETWORK                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   CDN Cache  │  │ Image Optim  │  │  WAF/DDoS    │          │
│  │   (Static)   │  │  (WebP/AVIF) │  │  Protection  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              NEXT.JS 16.1.1 APP ROUTER (TURBOPACK)              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         SERVER COMPONENTS (React Server Components)        │ │
│  │  • Marketing Pages (Static Generation)                     │ │
│  │  • Dashboard Pages (Dynamic Rendering)                     │ │
│  │  • Blog (SSG com ISR)                                      │ │
│  │  • Server Actions (Data Mutations)                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         CLIENT COMPONENTS (Interactive UI)                 │ │
│  │  • Kanban Board (Drag & Drop)                              │ │
│  │  • Forms & Modals                                          │ │
│  │  • Charts (Recharts)                                       │ │
│  │  • Real-time Updates                                       │ │
│  │  • PWA Features                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   API ROUTES (/api/*)                      │ │
│  │  • /api/auth/*          - NextAuth (Sessões)               │ │
│  │  • /api/contacts        - Gestão de Contatos               │ │
│  │  • /api/v1/*            - Public REST API                  │ │
│  │  • /api/webhooks/*      - Integrações Externas             │ │
│  │  • /api/mercadopago/*   - Pagamentos                       │ │
│  │  • /api/cron/*          - Jobs Agendados                   │ │
│  │  • /api/agi/*           - AGI Sirius (IA)                  │ │
│  │  • /api/integrations/*  - N8N, WhatsApp, Calendar          │ │
│  │  • /api/push/*          - Push Notifications               │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CAMADA DE DADOS                             │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │  Prisma ORM    │  │  NextAuth.js   │  │  Upstash Redis │    │
│  │  (Type-safe)   │  │  (Sessions)    │  │  (Rate Limit)  │    │
│  └────────┬───────┘  └────────┬───────┘  └────────────────┘    │
│           │                   │                                  │
│           ▼                   ▼                                  │
│  ┌─────────────────────────────────────┐                        │
│  │      PostgreSQL Database             │                        │
│  │    (Neon/Vercel Postgres)            │                        │
│  │  • Organizations (Multi-tenant)      │                        │
│  │  • Users & Auth                      │                        │
│  │  • Contacts & Deals                  │                        │
│  │  • Pipelines & Stages                │                        │
│  │  • Analytics Snapshots               │                        │
│  │  • AGI Conversations                 │                        │
│  │  • Integrations & Webhooks           │                        │
│  └─────────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVIÇOS EXTERNOS                             │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │ Mercado Pago   │  │   Resend.com   │  │   Sentry.io    │    │
│  │  (Pagamentos)  │  │    (Emails)    │  │  (Monitoring)  │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │  Google APIs   │  │   Svix.com     │  │   PostHog      │    │
│  │  (Calendar)    │  │  (Webhooks)    │  │  (Analytics)   │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │  Evolution API │  │     N8N        │  │  Vercel Edge   │    │
│  │  (WhatsApp)    │  │  (Workflows)   │  │   (Hosting)    │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 🔄 Fluxo de Dados

#### Fluxo de Autenticação
```
1. User → Login Form
2. POST /api/auth/[...nextauth]
3. NextAuth valida credenciais
4. Bcrypt compara hash
5. Session criada no DB
6. Cookie JWT enviado
7. Middleware valida em cada request
```

#### Fluxo de Deal (CRUD)
```
1. Client Component → Server Action
2. Server Action valida sessão
3. Prisma ORM executa query
4. PostgreSQL retorna dados
5. Revalidação de cache (revalidatePath)
6. UI atualizada automaticamente
```

#### Fluxo de Analytics
```
1. Cron Job diário (Vercel Cron)
2. /api/cron/daily-snapshot
3. Agregação de métricas (Prisma)
4. Snapshot salvo no DB
5. Dashboard consome dados agregados
6. Recharts renderiza gráficos
```

---

## 4. ESTRUTURA DE DIRETÓRIOS

### 📁 Árvore de Diretórios Principais

```
crm-project/
├── .claude/                      # Configurações Claude Code
├── .github/                      # GitHub Actions & Templates
│   ├── RELEASE_TEMPLATE.md
│   └── VERSIONING.md
├── .next/                        # Build output (Next.js)
├── __tests__/                    # Testes unitários (Vitest)
│   ├── auth/
│   ├── helpers/
│   ├── multi-tenant/
│   └── payments/
├── app/                          # Next.js 16 App Router
│   ├── (admin)/                  # Admin dashboard (protected)
│   │   └── admin/
│   │       ├── analytics/
│   │       ├── funnel/
│   │       ├── organizations/
│   │       ├── pwa-metrics/
│   │       ├── seo/
│   │       └── users/
│   ├── (marketing)/              # Marketing site (public)
│   │   ├── about/
│   │   ├── blog/                 # Blog com artigos SEO
│   │   │   ├── [slug]/           # Dynamic blog posts
│   │   │   └── planilha-controle-comissao-corretor/
│   │   ├── changelog/
│   │   ├── community/
│   │   ├── contact/
│   │   ├── design-system/
│   │   ├── download/
│   │   ├── features/
│   │   ├── ferramentas/          # Calculadoras ROI
│   │   │   ├── calculadora-roi/
│   │   │   ├── calculadora-roi-agencias/
│   │   │   ├── calculadora-roi-consultores/
│   │   │   ├── calculadora-roi-corretores/
│   │   │   ├── calculadora-roi-energia-solar/
│   │   │   └── calculadora-roi-representantes/
│   │   ├── forgot-password/
│   │   ├── help/
│   │   │   └── [categoria]/[slug]/
│   │   ├── login/
│   │   ├── pricing/
│   │   ├── privacy/
│   │   ├── register/
│   │   ├── reset-password/
│   │   ├── solucoes/             # Páginas de soluções por nicho
│   │   │   └── [slug]/
│   │   ├── terms/
│   │   └── vendas-automaticas/
│   ├── api/                      # API Routes
│   │   ├── agi/                  # AGI Sirius (IA)
│   │   │   ├── analyze-deal/
│   │   │   ├── chat/
│   │   │   ├── diagnostic/
│   │   │   ├── generate-script/
│   │   │   ├── insights/
│   │   │   ├── test/
│   │   │   └── usage/
│   │   ├── analytics/
│   │   │   └── backfill-snapshots/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── chat/
│   │   │   └── seo/
│   │   ├── contact/
│   │   ├── contacts/
│   │   ├── cron/                 # Scheduled jobs
│   │   │   ├── calendar-reminders/
│   │   │   ├── daily-snapshot/
│   │   │   ├── monthly-revenue/
│   │   │   ├── process-integration-retries/
│   │   │   └── sync-google-calendar/
│   │   ├── docs/                 # API Documentation (Scalar)
│   │   ├── export/               # PDF/XLSX exports
│   │   │   ├── contacts/
│   │   │   └── deals/
│   │   ├── indexnow/             # SEO indexing
│   │   ├── integrations/
│   │   │   ├── evolution-api/
│   │   │   ├── google-calendar/
│   │   │   └── n8n/
│   │   ├── leads/
│   │   ├── mercadopago/          # Payment gateway
│   │   │   ├── checkout/
│   │   │   ├── notifications/
│   │   │   └── preferences/
│   │   ├── notifications/
│   │   ├── onboarding/
│   │   ├── openapi.json/
│   │   ├── push/                 # Push notifications
│   │   │   ├── send/
│   │   │   ├── subscribe/
│   │   │   └── test/
│   │   ├── pwa/                  # PWA metrics
│   │   ├── sync/
│   │   ├── v1/                   # Public REST API
│   │   │   ├── contacts/
│   │   │   ├── deals/
│   │   │   ├── pipelines/
│   │   │   └── webhooks/
│   │   └── webhooks/
│   │       ├── evolution/
│   │       ├── mercadopago/
│   │       └── n8n/
│   ├── auth/                     # Auth pages
│   ├── checkout/                 # Checkout flow
│   │   └── sucesso/
│   ├── dashboard/                # Main app (protected)
│   │   ├── analytics/
│   │   ├── analytics-pro/
│   │   ├── billing/
│   │   ├── contacts/
│   │   ├── deals/
│   │   ├── email-automations/
│   │   ├── pipeline/             # Kanban board
│   │   ├── pipelines/            # Multi-pipeline management
│   │   └── settings/
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Homepage
│   ├── providers.tsx             # Context providers
│   └── globals.css               # Global styles
├── blog/                         # Blog content (markdown)
│   └── spin-selling-guia-completo.md
├── components/                   # React Components (104 files)
│   ├── admin/
│   ├── agi/                      # AGI Sirius components
│   ├── analytics/
│   ├── blog/
│   ├── contacts/
│   ├── dashboard/
│   │   └── billing/
│   ├── deals/
│   ├── email-automations/
│   ├── integrations/
│   ├── marketing/
│   ├── onboarding/
│   ├── pipelines/
│   ├── plan/
│   ├── settings/
│   └── ui/                       # shadcn/ui components
├── config/                       # Configuration files
├── docs/                         # Technical documentation
│   ├── AGI_DEPLOYMENT.md
│   ├── API.md
│   └── ARCHITECTURE.md
├── e2e/                          # End-to-end tests (Playwright)
│   ├── api/
│   ├── auth/
│   ├── deals/
│   ├── fixtures/
│   ├── page-objects/
│   └── pipelines/
├── emails/                       # Email templates (React Email)
│   ├── layouts/
│   └── templates/
├── hooks/                        # Custom React hooks
├── lib/                          # Utility libraries
│   ├── agi/                      # AGI Sirius brain
│   │   ├── brain.ts
│   │   ├── insights.ts
│   │   ├── memory.ts
│   │   ├── providers.ts
│   │   ├── skills.ts
│   │   └── usage.ts
│   ├── analytics/
│   │   ├── forecasting.ts
│   │   ├── funnel-service.ts
│   │   ├── kpis.ts
│   │   └── revenue-simulator.ts
│   ├── integrations/
│   │   ├── encryption.ts
│   │   ├── evolution-api.ts
│   │   ├── google-calendar.ts
│   │   └── n8n.ts
│   ├── webhooks/
│   ├── analytics-config.ts
│   ├── analytics-jobs.ts
│   ├── analytics.ts
│   ├── api-helpers.ts
│   ├── api-keys.ts
│   ├── api-middleware.ts
│   ├── api-validators.ts
│   ├── auth.ts
│   ├── blog-data.ts              # Blog posts data
│   ├── blog-types.ts
│   └── ...
├── prisma/                       # Database schema & migrations
│   ├── migrations/               # 17 migrations
│   └── schema.prisma             # Prisma schema (972 linhas)
├── public/                       # Static assets
│   ├── audio/
│   ├── avatars/
│   ├── downloads/
│   │   └── spin-selling/
│   └── images/
│       └── blog/                 # Blog cover images
│           ├── crm-simples-complexo.png
│           ├── follow-up.png
│           ├── funil-vendas.png
│           ├── pipeline-vendas.png
│           ├── planilha-controle-comissao.png
│           └── spin-selling.png
├── roadmaps/                     # Development roadmaps
├── scripts/                      # Utility scripts
│   └── submit-to-indexnow.ts
├── test-results/                 # Playwright test results
├── .env.example                  # Environment variables template
├── .eslintrc.json               # ESLint config
├── .gitignore
├── CHANGELOG.md                  # Version history
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies
├── playwright.config.ts          # E2E test config
├── tailwind.config.ts            # Tailwind CSS config
├── tsconfig.json                 # TypeScript config
└── vitest.config.ts              # Unit test config
```

### 📊 Estatísticas do Projeto

```
Total de Arquivos TypeScript: ~250+
Total de Componentes React: 104
Total de API Routes: ~60+
Total de Páginas: ~40+
Total de Migrações DB: 17
Total de Testes E2E: ~50+ (Playwright)
Linhas de Código (estimado): ~30.000+
```

---

## 5. FUNCIONALIDADES PRINCIPAIS

### 🎯 Core CRM Features

#### 5.1 Gestão de Pipeline (Kanban Board)
```typescript
// Localização: app/dashboard/pipeline/page.tsx
// Tecnologias: @hello-pangea/dnd, Prisma, Server Actions

Funcionalidades:
✅ Drag & Drop entre estágios
✅ Ordenação vertical manual
✅ Cores por valor do deal
✅ Contadores em tempo real
✅ Filtros por pipeline, usuário, data
✅ Responsivo mobile
✅ Offline-first com sync
✅ Animações suaves

Estágios Padrão:
1. Prospecção
2. Qualificação
3. Proposta
4. Negociação
5. Fechado (Ganho/Perdido)
```

#### 5.2 Gestão de Deals
```typescript
// Localização: app/api/v1/deals/route.ts
// Schema: prisma/schema.prisma (Deal model)

Campos do Deal:
- id: UUID
- title: String
- value: Decimal (10,2)
- closeDate: DateTime
- dueDate: DateTime (follow-up)
- order: Int (ordenação manual)
- stageId: FK → PipelineStage
- pipelineId: FK → Pipeline
- contactId: FK → Contact
- userId: FK → User (responsável)
- organizationId: FK → Organization

Features:
✅ CRUD completo
✅ Histórico de atividades
✅ Notas e comentários
✅ Tags customizadas
✅ Anexos de arquivos
✅ WhatsApp integrado
✅ Eventos de calendário
✅ Análise AGI (qualificação)
```

#### 5.3 Gestão de Contatos
```typescript
// Localização: app/dashboard/contacts/page.tsx
// API: /api/contacts

Features:
✅ Database ilimitado de leads
✅ Importação CSV/XLSX
✅ Exportação PDF/XLSX
✅ Busca full-text
✅ Filtros avançados
✅ Paginação server-side
✅ WhatsApp click-to-chat
✅ Histórico de interações
✅ Vinculação com deals

Campos:
- Nome
- Email
- Telefone (com validação BR)
- Empresa
- Posição
- Origem (lead source)
- Tags
```

#### 5.4 Multi-Pipeline (PRO)
```typescript
// Localização: app/dashboard/pipelines/page.tsx
// Feature Flag: plan === "PRO"

Funcionalidades:
✅ Pipelines ilimitados
✅ Etapas customizadas por pipeline
✅ Métricas separadas
✅ Seletor de pipeline persistente
✅ Templates pré-configurados
✅ Duplicação de pipelines
✅ Arquivamento

Exemplos de Pipelines:
- Vendas B2B
- Vendas B2C
- Pós-venda/Upsell
- Renovações
- Parcerias
```

### 📊 Analytics & Business Intelligence

#### 5.5 Dashboard Analytics
```typescript
// Localização: app/dashboard/analytics/page.tsx
// Tecnologia: Recharts, Prisma Aggregations

Métricas Principais:
📈 Taxa de Conversão
💰 Receita Prevista (Pipeline Value)
🎯 Ticket Médio
⏱️ Tempo Médio de Fechamento
📊 Deals por Estágio
👥 Performance por Vendedor
📅 Funil de Conversão
📉 Taxa de Churn

Gráficos:
- Line Chart (receita ao longo do tempo)
- Bar Chart (deals por estágio)
- Pie Chart (distribuição de status)
- Area Chart (forecast)
- Funnel Chart (conversão)
```

#### 5.6 Analytics PRO
```typescript
// Localização: app/dashboard/analytics-pro/page.tsx
// Feature: Apenas para plano PRO

Features Avançadas:
✅ Forecasting ML (90 dias)
✅ Análise de cohort
✅ LTV (Lifetime Value)
✅ CAC (Customer Acquisition Cost)
✅ Churn prediction
✅ Revenue Simulator
✅ Deal score (probabilidade de fechar)
✅ Exportação de relatórios
✅ Alertas customizados
```

#### 5.7 Data Warehouse (Snapshots)
```typescript
// Localização: lib/analytics-jobs.ts
// Cron: Diário às 00:00 UTC

Modelos:
1. DealSnapshot (diário)
   - Total de deals
   - Valor total
   - Breakdown por stage/pipeline
   - Deals criados/fechados/perdidos

2. RevenueSnapshot (mensal)
   - MRR (Monthly Recurring Revenue)
   - ARR (Annual Recurring Revenue)
   - Total organizações
   - Churn rate
   - Forecast 30/60/90d

3. UserActivity (log contínuo)
   - Eventos de usuário
   - Page views
   - Feature usage
   - Login/Logout
```

### 🤖 AGI Sirius (Assistente de IA)

#### 5.8 AGI Brain
```typescript
// Localização: lib/agi/brain.ts
// Tecnologia: Groq Cloud (llama3.2)

Modelos por Plano:
- FREE: llama3.2:1b (1024 tokens/response)
- PRO: llama3.2:3b (2048 tokens/response)

Limites Mensais:
- FREE: 50.000 tokens (~50-75 conversas)
- PRO: 500.000 tokens (~500-750 conversas)

Skills Disponíveis:
✅ qualificacao_bant
✅ qualificacao_meddic
✅ analise_funil
✅ next_step_suggestion
✅ objection_handling
✅ script_generation
✅ deal_risk_assessment
```

#### 5.9 AGI Skills
```typescript
// Localização: lib/agi/skills.ts

1. BANT Qualification (Budget, Authority, Need, Timeline)
   Input: Deal data
   Output: Score 0-100 + breakdown

2. MEDDIC Qualification
   Input: Deal data
   Output: Score 0-100 + gaps

3. Script Generation
   Input: Tipo (prospecção, follow-up, objeção)
   Output: Script personalizado

4. Pipeline Analysis
   Input: organizationId
   Output: Bottlenecks, recomendações

5. Risk Assessment
   Input: dealId
   Output: Probabilidade de fechar (%)
```

#### 5.10 AGI Memory & Context
```typescript
// Localização: lib/agi/memory.ts
// Storage: AgiConversation model

Features:
✅ Histórico de conversas
✅ Contexto multi-turn
✅ Summary automático
✅ Recuperação semântica
✅ Context window management
✅ Token tracking
```

### 📧 Email Automations

#### 5.11 Email Automation System
```typescript
// Localização: app/dashboard/email-automations/page.tsx
// Provider: Resend.com
// Templates: React Email

Triggers Disponíveis:
1. Welcome Email (novo usuário)
2. Deal Created (novo deal)
3. Deal Stage Changed (mudança de estágio)
4. Upgrade Nudge (incentivo upgrade PRO)

Configurações:
- Subject customizado
- Body customizado (Rich Text)
- Delay (minutos)
- Conditions (JSON rules)

Status Tracking:
- SENT → DELIVERED → OPENED → CLICKED
- Bounce handling
- Error logging
```

### 🔌 Integrações

#### 5.12 WhatsApp (Evolution API)
```typescript
// Localização: lib/integrations/evolution-api.ts
// API: Self-hosted Evolution API

Features:
✅ Send messages
✅ Receive webhooks
✅ Media support (images, docs)
✅ Message status tracking
✅ Contact sync
✅ Deal linking

Fluxo:
1. User configura instance
2. QR Code scan
3. Webhook configurado
4. Messages aparecem no CRM
5. Reply direto da interface
```

#### 5.13 Google Calendar
```typescript
// Localização: lib/integrations/google-calendar.ts
// API: Google Calendar API v3

Features:
✅ OAuth2 authentication
✅ Sync bidirectional
✅ Event creation from deals
✅ Reminders automáticos
✅ Calendar selection
✅ Conflict detection

Eventos Sincronizados:
- Follow-ups agendados
- Reuniões de vendas
- Demos de produto
- Deadlines de proposta
```

#### 5.14 N8N Workflows
```typescript
// Localização: lib/integrations/n8n.ts
// Platform: Self-hosted N8N

Features:
✅ Webhook triggers
✅ HTTP requests
✅ Workflow execution
✅ Error handling
✅ Retry logic

Use Cases:
- Zapier alternative
- Custom automations
- API integrations
- Data sync
```

### 💳 Billing & Payments

#### 5.15 Mercado Pago Integration
```typescript
// Localização: app/api/mercadopago/
// Gateway: Mercado Pago Brasil

Planos:
1. FREE (R$ 0/mês)
   - 1 usuário
   - 1 pipeline
   - 100 deals/mês
   - Analytics básico
   - AGI: 50k tokens/mês

2. PRO (R$ 97/mês)
   - Usuários ilimitados
   - Pipelines ilimitados
   - Deals ilimitados
   - Analytics PRO
   - AGI: 500k tokens/mês
   - Integrações avançadas
   - Suporte prioritário

Fluxo de Checkout:
1. User seleciona plano
2. Redirect para Mercado Pago
3. Pagamento processado
4. Webhook notifica sistema
5. Upgrade automático
6. Email de confirmação
```

### 🌐 PWA & Mobile

#### 5.16 Progressive Web App
```typescript
// Localização: next.config.ts (withPWA)
// Service Worker: next-pwa

Features:
✅ Instalável (Add to Home Screen)
✅ Offline mode (cache)
✅ Push notifications
✅ Background sync
✅ App-like experience

Caches:
- Static assets (1 ano)
- API responses (5 min)
- Images (24h)
- Fonts (1 semana)
```

#### 5.17 Push Notifications
```typescript
// Localização: components/push-notification-manager.tsx
// Protocol: Web Push (VAPID)

Triggers:
✅ Novo deal criado
✅ Deal ganho/perdido
✅ WhatsApp message
✅ Calendar reminder
✅ Menções (@user)
✅ System alerts

Preferências:
- Gerenciamento por tipo
- Quiet hours
- Devices múltiplos
```

### 🔐 Multi-tenancy & Team

#### 5.18 Organization Management
```typescript
// Model: Organization (schema.prisma)

Features:
✅ Multi-tenant architecture
✅ Data isolation
✅ Custom subdomain (roadmap)
✅ Team invites
✅ Role-based access (OWNER, MEMBER)
✅ Billing por organização
✅ Usage tracking

Roles:
- OWNER: Full access
- MEMBER: Limited access (no billing, no delete org)
```

#### 5.19 Team Collaboration
```typescript
// Localização: app/dashboard/settings/team/

Features:
✅ Invite by email
✅ Token-based invites (24h expiry)
✅ Pending invitations
✅ Member management
✅ Activity tracking
✅ Performance per user

Onboarding Flow:
1. Owner envia invite
2. Email com link mágico
3. Recipient cadastra senha
4. Auto-join na org
5. Onboarding tutorial
```

---

## 6. STACK TECNOLÓGICO

### 🎨 Frontend Stack

```typescript
// Framework
Next.js: 16.1.1 (App Router, Turbopack)
React: 19.2.3 (Server Components, Suspense)
TypeScript: 5.x (Strict mode)

// UI & Styling
Tailwind CSS: 4.x (JIT, CSS Variables)
shadcn/ui: Custom (Radix UI primitives)
Lucide React: 0.562.0 (Icons)
next-themes: 0.4.6 (Dark mode)
class-variance-authority: 0.7.1 (CVA)
tailwind-merge: 3.4.0 (Class merging)

// Forms & Validation
react-hook-form: Latest
zod: 4.3.6 (Schema validation)

// Drag & Drop
@hello-pangea/dnd: 18.0.1 (Kanban)

// Charts & Data Viz
recharts: 3.7.0
@tanstack/react-table: 8.21.3

// State Management
React Server Components (server state)
useState/useReducer (client state)
URL State (searchParams)

// Markdown & Content
react-markdown: 10.1.0
```

### ⚙️ Backend Stack

```typescript
// Runtime
Node.js: 20+ LTS
Next.js API Routes
Next.js Server Actions

// Database
PostgreSQL: 15+
Prisma ORM: 5.19.0 (Type-safe, Migrations)

// Authentication
NextAuth.js: 4.24.13 (Auth.js v5)
bcryptjs: 3.0.3 (Password hashing)
jose: 6.1.3 (JWT)

// Payments
mercadopago: 2.11.0 (SDK oficial)

// Email
resend: 6.6.0 (Email delivery)
@react-email/components: 1.0.3 (Templates)
react-email: 5.1.1 (Builder)

// AI & LLM
@ai-sdk/groq: 3.0.16
@ai-sdk/react: 3.0.60
ai: 6.0.58 (Vercel AI SDK)

// Rate Limiting
@upstash/ratelimit: 2.0.7
@upstash/redis: 1.36.1

// Webhooks
svix: 1.84.1 (Webhook management)

// File Generation
jspdf: 4.0.0
jspdf-autotable: 5.0.7
xlsx: 0.18.5

// QR Code
qrcode.react: 4.2.0

// Push Notifications
web-push: 3.6.7

// Search & Discovery
@tavily/core: 0.7.1

// Logging
pino: 10.1.0
pino-pretty: 13.1.3

// Google APIs
googleapis: 170.1.0
```

### 🧪 Testing & Quality

```typescript
// Unit Testing
vitest: 4.0.16
@testing-library/react: 16.3.1
@testing-library/jest-dom: 6.9.1
@testing-library/user-event: 14.6.1
happy-dom: 20.0.11 (jsdom alternative)
vitest-mock-extended: 3.1.0

// E2E Testing
@playwright/test: 1.57.0
Browsers: Chromium, Firefox, WebKit

// Mocking
msw: 2.12.7 (Mock Service Worker)

// Linting
ESLint: 9.x
eslint-config-next: 16.1.1

// TypeScript
typescript: 5.x (Strict)
@types/node: 20
@types/react: 19
@types/react-dom: 19
```

### 📊 Analytics & Monitoring

```typescript
// Error Tracking
@sentry/nextjs: 10.36.0

// Product Analytics
posthog-js: 1.335.4
@vercel/analytics: 1.6.1
@vercel/speed-insights: 1.3.1

// Web Analytics
Google Analytics (gtag.js): G-WJE82VNKX8
Google Tag Manager: GTM-XXXXXXX
Microsoft Clarity: Integration ativa

// Performance
Vercel Analytics (Core Web Vitals)
Lighthouse CI (roadmap)
```

### 🏗️ Infrastructure & DevOps

```typescript
// Hosting
Vercel: Edge Network, Serverless Functions

// Database
Neon / Vercel Postgres: Serverless PostgreSQL

// CDN
Vercel Edge Network (Global)

// Image Optimization
Next.js Image (WebP, AVIF)
Device-responsive sizing

// Caching
Vercel Edge Cache
Redis (Upstash) - Rate limiting

// CI/CD
Vercel Git Integration (auto-deploy)
GitHub Actions (tests)

// Monitoring
Sentry (Errors)
Vercel Monitoring (Performance)
Uptime monitoring (roadmap)
```

---

## 7. BANCO DE DADOS

### 📊 Prisma Schema Overview

```prisma
// Arquivo: prisma/schema.prisma
// Total: 972 linhas
// Modelos: 30+
// Enums: 10+
// Indexes: 50+
```

### 🗃️ Modelos Principais

#### 7.1 Organization (Multi-tenancy)
```prisma
model Organization {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  plan      String   @default("FREE") // FREE | PRO

  // Mercado Pago
  mercadoPagoCustomerId     String?
  mercadoPagoSubscriptionId String?
  mercadoPagoPreferenceId   String?

  // Relações (30+ relations)
  users               User[]
  contacts            Contact[]
  deals               Deal[]
  pipelines           Pipeline[]
  pipelineStages      PipelineStage[]
  invites             Invite[]
  tags                Tag[]
  emailAutomationSettings EmailAutomationSetting[]
  emailLogs           EmailLog[]
  dealSnapshots       DealSnapshot[]
  userActivities      UserActivity[]
  revenueSnapshots    RevenueSnapshot[]
  apiKeys             ApiKey[]
  webhooks            Webhook[]
  integrationLogs     IntegrationLog[]
  whatsappMessages    WhatsAppMessage[]
  calendarEvents      CalendarEvent[]
  pushSubscriptions   PushSubscription[]
  notifications       Notification[]
  agiConversations    AgiConversation[]
  agiInsights         AgiInsight[]
  agiUsage            AgiUsage[]
  onboardingProgress  OnboardingProgress[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### 7.2 User
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  password  String   // bcrypt hash
  role      Role     @default(USER)     // USER | ADMIN
  orgRole   OrgRole  @default(OWNER)    // OWNER | MEMBER

  organizationId String
  organization   Organization @relation(...)

  // Relações
  deals         Deal[]
  notes         Note[]
  activities    Activity[]
  emailLogs     EmailLog[]
  userActivities UserActivity[]
  pushSubscriptions PushSubscription[]
  notifications Notification[]
  notificationPreference NotificationPreference?
  agiConversations AgiConversation[]
  onboarding    OnboardingProgress?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### 7.3 Contact
```prisma
model Contact {
  id        String   @id @default(uuid())
  name      String
  email     String?
  phone     String?
  company   String?

  organizationId String
  organization   Organization @relation(...)

  deals            Deal[]
  whatsappMessages WhatsAppMessage[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([organizationId])
}
```

#### 7.4 Pipeline & PipelineStage
```prisma
model Pipeline {
  id        String   @id @default(uuid())
  name      String
  isDefault Boolean  @default(false)

  organizationId String
  organization   Organization @relation(...)

  stages PipelineStage[]
  deals  Deal[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([organizationId, isDefault])
}

model PipelineStage {
  id    String @id @default(uuid())
  name  String
  order Int    // 1, 2, 3...

  organizationId String
  pipelineId     String

  organization Organization @relation(...)
  pipeline     Pipeline     @relation(...)
  deals        Deal[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([pipelineId, order])
  @@index([organizationId, pipelineId])
}
```

#### 7.5 Deal (Core Entity)
```prisma
model Deal {
  id        String    @id @default(uuid())
  title     String
  value     Decimal?  @db.Decimal(10, 2)
  closeDate DateTime?
  dueDate   DateTime? // Follow-up
  order     Int?      // Manual sort

  organizationId String
  pipelineId     String
  stageId        String
  contactId      String?
  userId         String

  organization Organization  @relation(...)
  pipeline     Pipeline      @relation(...)
  stage        PipelineStage @relation(...)
  contact      Contact?      @relation(...)
  user         User          @relation(...)

  // Deal 2.0 Features
  notes               Note[]
  tags                Tag[]
  activities          Activity[]
  whatsappMessages    WhatsAppMessage[]
  calendarEvents      CalendarEvent[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([organizationId, stageId])
  @@index([userId])
}
```

### 📈 Analytics Models

#### 7.6 DealSnapshot (Data Warehouse)
```prisma
model DealSnapshot {
  id   String   @id @default(uuid())
  date DateTime // Sem hora

  // Métricas agregadas
  totalDeals      Int
  totalValue      Decimal @db.Decimal(12, 2)
  avgDealValue    Decimal @db.Decimal(12, 2)

  // Breakdown
  dealsByStage    Json // { stageId: { count, value } }
  dealsByPipeline Json // { pipelineId: { count, value } }

  // Conversão
  dealsCreated Int @default(0)
  dealsClosed  Int @default(0)
  dealsLost    Int @default(0)

  organizationId String
  organization   Organization @relation(...)

  createdAt DateTime @default(now())

  @@unique([organizationId, date])
  @@index([organizationId, date])
}
```

#### 7.7 UserActivity (Event Tracking)
```prisma
enum UserActivityType {
  LOGIN
  LOGOUT
  DEAL_CREATED
  DEAL_UPDATED
  DEAL_DELETED
  DEAL_STAGE_CHANGED
  CONTACT_CREATED
  CONTACT_UPDATED
  CONTACT_DELETED
  PIPELINE_CREATED
  EMAIL_SENT
  PAGE_VIEW
  FEATURE_USED
}

model UserActivity {
  id   String           @id @default(uuid())
  type UserActivityType

  metadata  Json?   // Dados flexíveis
  ipAddress String?
  userAgent String? @db.Text

  userId         String?
  organizationId String

  user         User?        @relation(...)
  organization Organization @relation(...)

  createdAt DateTime @default(now())

  @@index([organizationId, createdAt])
  @@index([userId, createdAt])
  @@index([type, createdAt])
}
```

#### 7.8 RevenueSnapshot (MRR/ARR)
```prisma
model RevenueSnapshot {
  id    String   @id @default(uuid())
  date  DateTime
  month Int      // 1-12
  year  Int

  // Revenue
  mrr Decimal @db.Decimal(12, 2) // Monthly Recurring Revenue
  arr Decimal @db.Decimal(12, 2) // Annual (MRR * 12)

  // Organizations
  totalOrganizations Int
  freeOrganizations  Int
  proOrganizations   Int

  // Churn
  churnedOrganizations Int @default(0)
  newOrganizations     Int @default(0)

  // Metrics
  avgLtv Decimal? @db.Decimal(12, 2)
  avgCac Decimal? @db.Decimal(12, 2)

  // Forecast
  forecastNext30d Decimal? @db.Decimal(12, 2)
  forecastNext60d Decimal? @db.Decimal(12, 2)
  forecastNext90d Decimal? @db.Decimal(12, 2)

  organizationId String?
  organization   Organization? @relation(...)

  createdAt DateTime @default(now())

  @@unique([organizationId, year, month])
  @@index([year, month])
}
```

### 🤖 AGI Models

#### 7.9 AgiConversation
```prisma
model AgiConversation {
  id      String @id @default(uuid())

  dealId     String?
  pipelineId String?
  context    String? // "deal" | "pipeline" | "general"

  messages   Json // Array de messages
  summary    String? @db.Text
  tokensUsed Int @default(0)

  userId         String
  organizationId String

  user         User         @relation(...)
  organization Organization @relation(...)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([organizationId, userId])
  @@index([dealId])
  @@index([pipelineId])
}
```

#### 7.10 AgiInsight
```prisma
enum AgiInsightType {
  QUALIFICATION_BANT
  QUALIFICATION_MEDDIC
  NEXT_STEP_SUGGESTION
  OBJECTION_HANDLING
  SCRIPT_GENERATED
  PIPELINE_ANALYSIS
  DEAL_RISK_ASSESSMENT
}

model AgiInsight {
  id    String        @id @default(uuid())
  type  AgiInsightType
  title String
  content    String @db.Text
  confidence Decimal @db.Decimal(3, 2) // 0.00-1.00

  applied   Boolean @default(false)
  dismissed Boolean @default(false)

  dealId     String?
  pipelineId String?
  metadata   Json?

  userId         String
  organizationId String

  user         User         @relation(...)
  organization Organization @relation(...)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([organizationId, type])
  @@index([dealId])
}
```

### 🔌 Integration Models

#### 7.11 WhatsAppMessage
```prisma
enum MessageDirection {
  INBOUND
  OUTBOUND
}

enum WhatsAppMessageStatus {
  PENDING
  SENT
  DELIVERED
  READ
  FAILED
}

model WhatsAppMessage {
  id        String @id @default(uuid())

  remoteJid String  // "5511987654321@s.whatsapp.net"
  messageId String?
  text      String  @db.Text
  direction MessageDirection
  status    WhatsAppMessageStatus @default(PENDING)

  mediaUrl  String?
  mediaType String? // "image" | "video" | "document"

  dealId    String?
  contactId String?

  deal    Deal?    @relation(...)
  contact Contact? @relation(...)

  sentAt      DateTime  @default(now())
  deliveredAt DateTime?
  readAt      DateTime?

  organizationId String
  organization   Organization @relation(...)

  @@index([organizationId, sentAt])
  @@index([dealId])
  @@index([contactId])
  @@index([remoteJid])
}
```

#### 7.12 CalendarEvent
```prisma
enum SyncStatus {
  PENDING
  SYNCED
  FAILED
}

model CalendarEvent {
  id            String @id @default(uuid())
  googleEventId String? @unique

  title       String
  description String? @db.Text
  startTime   DateTime
  endTime     DateTime
  location    String?

  syncStatus SyncStatus @default(PENDING)
  lastSyncAt DateTime?

  dealId String?
  deal   Deal? @relation(...)

  organizationId String
  organization   Organization @relation(...)

  @@index([organizationId, startTime])
  @@index([dealId])
  @@index([googleEventId])
}
```

### 🔐 API & Webhooks

#### 7.13 ApiKey
```prisma
model ApiKey {
  id        String @id @default(uuid())
  name      String
  keyHash   String @unique // bcrypt
  keyPrefix String // "sk_live_1234..."

  lastUsed     DateTime?
  expiresAt    DateTime?
  requestCount Int @default(0)

  organizationId String
  organization   Organization @relation(...)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([organizationId])
  @@index([keyPrefix])
}
```

#### 7.14 Webhook
```prisma
enum WebhookStatus {
  SUCCESS
  FAILED
  PENDING
  RETRYING
}

model Webhook {
  id             String @id @default(uuid())
  svixAppId      String // Svix application ID
  svixEndpointId String // Svix endpoint ID
  url            String
  description    String?
  enabled        Boolean @default(true)
  events         Json    // ["deal.created", "contact.created"]

  organizationId String
  organization   Organization @relation(...)
  logs           WebhookLog[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([organizationId])
  @@index([svixAppId])
}

model WebhookLog {
  id            String        @id @default(uuid())
  eventType     String
  payload       Json
  status        WebhookStatus @default(PENDING)
  statusCode    Int?
  errorMessage  String? @db.Text
  attempts      Int @default(0)
  svixMessageId String?
  sentAt        DateTime @default(now())

  webhookId      String
  organizationId String

  webhook      Webhook      @relation(...)
  organization Organization @relation(...)

  @@index([webhookId, sentAt])
  @@index([organizationId, eventType, sentAt])
  @@index([status])
}
```

### 📧 Email Automation

#### 7.15 EmailAutomationSetting
```prisma
enum EmailAutomationType {
  WELCOME_EMAIL
  DEAL_CREATED
  DEAL_STAGE_CHANGED
  UPGRADE_NUDGE
}

model EmailAutomationSetting {
  id      String             @id @default(uuid())
  type    EmailAutomationType
  enabled Boolean @default(true)

  customSubject String?
  customBody    String? @db.Text

  sendDelayMinutes  Int  @default(0) // 0=immediate
  triggerConditions Json?

  organizationId String
  organization   Organization @relation(...)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([organizationId, type])
}
```

#### 7.16 EmailLog
```prisma
enum EmailStatus {
  SENT
  DELIVERED
  OPENED
  CLICKED
  BOUNCED
  FAILED
}

model EmailLog {
  id      String             @id @default(uuid())
  type    EmailAutomationType
  to      String
  subject String
  status  EmailStatus @default(SENT)

  sentAt      DateTime  @default(now())
  deliveredAt DateTime?
  openedAt    DateTime?
  clickedAt   DateTime?

  errorMessage String? @db.Text

  organizationId String
  userId         String?

  organization Organization @relation(...)
  user         User?        @relation(...)

  @@index([organizationId, sentAt])
  @@index([status])
}
```

### 🔔 Notifications

#### 7.17 Notification
```prisma
enum NotificationType {
  DEAL_CREATED
  DEAL_WON
  DEAL_LOST
  DEAL_STAGE_CHANGED
  WHATSAPP_MESSAGE
  CALENDAR_REMINDER
  MENTION
  SYSTEM
}

model Notification {
  id      String           @id @default(uuid())
  type    NotificationType
  title   String
  message String @db.Text

  read      Boolean   @default(false)
  readAt    DateTime?
  actionUrl String?
  metadata  Json?

  userId         String
  organizationId String

  user         User         @relation(...)
  organization Organization @relation(...)

  createdAt DateTime @default(now())

  @@index([userId, read])
  @@index([organizationId, createdAt])
  @@index([userId, createdAt])
}
```

### 🎯 Onboarding

#### 7.18 OnboardingProgress
```prisma
enum OnboardingStatus {
  IN_PROGRESS
  COMPLETED
  SKIPPED
}

model OnboardingProgress {
  id             String @id @default(uuid())
  currentStep    Int    @default(0) // 0-5
  completedSteps String[] @default([])
  status         OnboardingStatus @default(IN_PROGRESS)

  completedAt DateTime?
  skippedAt   DateTime?
  stepData    Json?

  badges      String[] @default([])
  totalPoints Int      @default(0)

  userId         String @unique
  organizationId String

  user         User         @relation(...)
  organization Organization @relation(...)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([organizationId])
  @@index([status])
}
```

### 📊 Database Indexes & Performance

```prisma
// Indexes Estratégicos (50+)

Performance Critical:
✅ Contact.organizationId
✅ Deal.organizationId + stageId (composite)
✅ Deal.userId
✅ PipelineStage.pipelineId + order
✅ UserActivity.organizationId + createdAt
✅ UserActivity.type + createdAt
✅ DealSnapshot.organizationId + date (unique)
✅ ApiKey.keyPrefix (fast lookup)
✅ Webhook.svixAppId
✅ WhatsAppMessage.remoteJid
✅ Notification.userId + read

Query Optimization:
- Composite indexes para queries multi-field
- Covering indexes para SELECT comuns
- Partial indexes para condições WHERE frequentes
```

### 🔄 Migrations History

```bash
# Total: 17 migrations
prisma/migrations/
├── 20251228153553_add_organization/
├── 20251228185002_add_stripe_fields/
├── 20251228234538_add_user_role/
├── 20251229143728_add_org_role/
├── 20251230152415_add_invite_system/
├── 20251230153812_deal_v2_features/
├── 20260101180309_add_email_automation_settings/
├── 20260102124347_add_multiple_pipelines/
├── 20260105182116_add_analytics_models/
├── 20260105230854_add_performance_indexes/
├── 20260108143526_add_public_api_models/
├── 20260108175339_migrate_stripe_to_mercadopago/
├── 20260108221108_add_integrations_foundation/
├── 20260109155710_add_push_subscriptions/
├── 20260109173249_add_pwa_metrics/
├── 20260109201236_add_notification_preferences/
├── 20260114182358_add_agi_tables/
├── 20260124123145_add_password_reset_token/
├── 20260125002032_add_notifications/
└── 20260126010000_add_onboarding_progress/
```

---

## 8. APIS E INTEGRAÇÕES

### 🌐 Public REST API (v1)

```typescript
// Base URL: /api/v1
// Documentation: /api/docs (Scalar UI)
// OpenAPI Spec: /api/openapi.json

Endpoints:

# Authentication
POST /api/v1/auth
  Headers: Authorization: Bearer {apiKey}
  Response: { user, organization }

# Contacts
GET    /api/v1/contacts
POST   /api/v1/contacts
GET    /api/v1/contacts/:id
PUT    /api/v1/contacts/:id
DELETE /api/v1/contacts/:id

# Deals
GET    /api/v1/deals
POST   /api/v1/deals
GET    /api/v1/deals/:id
PUT    /api/v1/deals/:id
DELETE /api/v1/deals/:id

# Pipelines
GET    /api/v1/pipelines
GET    /api/v1/pipelines/:id
GET    /api/v1/pipelines/:id/stages

# Webhooks
GET    /api/v1/webhooks
POST   /api/v1/webhooks
PUT    /api/v1/webhooks/:id
DELETE /api/v1/webhooks/:id
GET    /api/v1/webhooks/:id/logs

# API Keys
GET    /api/v1/api-keys
POST   /api/v1/api-keys
DELETE /api/v1/api-keys/:id
```

### 🔐 Authentication

```typescript
// API Key Format
sk_live_1234567890abcdef

// Header
Authorization: Bearer sk_live_1234567890abcdef

// Rate Limiting (Upstash Redis)
FREE: 100 requests/hour
PRO: 1000 requests/hour

// Error Responses
401 Unauthorized: Invalid API key
403 Forbidden: No permission
429 Too Many Requests: Rate limit exceeded
```

### 📡 Webhooks

```typescript
// Provider: Svix.com
// Events Available:

deal.created
deal.updated
deal.deleted
deal.stage_changed
deal.won
deal.lost

contact.created
contact.updated
contact.deleted

pipeline.created
pipeline.deleted

// Webhook Payload Example
{
  "event": "deal.created",
  "timestamp": "2026-01-29T12:00:00Z",
  "data": {
    "id": "uuid",
    "title": "Deal Title",
    "value": 5000.00,
    "stage": "Qualificação",
    "contact": {
      "id": "uuid",
      "name": "John Doe"
    }
  },
  "organizationId": "uuid"
}

// Signature Verification
Svix-Signature header
Svix-Timestamp header
HMAC SHA-256
```

### 🔄 Integration APIs

#### N8N Automation
```typescript
// lib/integrations/n8n.ts

Endpoints:
GET  /workflows
POST /workflows/{id}/execute
GET  /executions
GET  /executions/{id}

Use Cases:
- Trigger workflows on deal events
- Sync data to external systems
- Custom automation chains
```

#### Evolution API (WhatsApp)
```typescript
// lib/integrations/evolution-api.ts

Endpoints:
POST /message/sendText
POST /message/sendMedia
GET  /instance/connect
GET  /instance/qrcode
POST /webhook/set

Features:
- Send/receive messages
- Media support
- QR code authentication
- Real-time webhooks
```

#### Google Calendar
```typescript
// lib/integrations/google-calendar.ts

Scopes:
- https://www.googleapis.com/auth/calendar.readonly
- https://www.googleapis.com/auth/calendar.events

Methods:
- calendar.events.list()
- calendar.events.insert()
- calendar.events.update()
- calendar.events.delete()

Sync:
- Bidirectional sync
- Cron job (5min interval)
- Conflict resolution
```

---

## 9. AUTENTICAÇÃO E SEGURANÇA

### 🔐 NextAuth.js Configuration

```typescript
// app/api/auth/[...nextauth]/route.ts

Providers:
✅ Credentials (Email + Password)
✅ Google OAuth (roadmap)

Session Strategy:
- Database sessions (secure)
- JWT cookies (httpOnly, sameSite)
- 30 days expiration

Password Security:
- bcryptjs (10 rounds)
- Minimum 8 characters
- No plaintext storage
```

### 🛡️ Security Headers

```typescript
// next.config.ts

Security Headers:
✅ X-Content-Type-Options: nosniff
✅ X-Frame-Options: DENY
✅ X-XSS-Protection: 1; mode=block
✅ Referrer-Policy: strict-origin-when-cross-origin
✅ Permissions-Policy: camera=(), microphone=()
✅ Strict-Transport-Security: max-age=31536000
✅ Content-Security-Policy: (comprehensive)

CSP Directives:
- default-src 'self'
- script-src: Sentry, GTM, Vercel, PostHog
- img-src: data:, https:, blob:
- connect-src: Analytics, Sentry, APIs
- frame-ancestors 'none'
- upgrade-insecure-requests
```

### 🔒 Data Protection

```typescript
// Encryption
AES-256-GCM (lib/integrations/encryption.ts)

Encrypted Fields:
- Integration API keys
- OAuth refresh tokens
- Sensitive configuration

Key Management:
INTEGRATION_ENCRYPTION_KEY (env variable)
32-byte hex key
Rotação semestral (roadmap)
```

### 🚦 Rate Limiting

```typescript
// @upstash/ratelimit

Limits:
API Public:
  FREE: 100 req/hour
  PRO: 1000 req/hour

Login Attempts:
  5 attempts per 15 minutes

AGI Requests:
  FREE: 20 req/hour
  PRO: 100 req/hour

Implementation:
- Redis-backed (Upstash)
- Sliding window
- Per-IP + Per-Organization
```

### 🔍 Input Validation

```typescript
// Zod schemas

All API routes:
✅ Request body validation
✅ Query parameter validation
✅ Type coercion
✅ Custom error messages

Example:
const createDealSchema = z.object({
  title: z.string().min(1).max(200),
  value: z.number().positive().optional(),
  contactId: z.string().uuid().optional(),
  stageId: z.string().uuid(),
})
```

### 🛡️ OWASP Top 10 Protection

```typescript
✅ A01:2021 - Broken Access Control
   → Multi-tenant isolation
   → Organization-level permissions
   → Role-based access (OWNER, MEMBER)

✅ A02:2021 - Cryptographic Failures
   → bcrypt for passwords
   → AES-256-GCM for secrets
   → HTTPS only

✅ A03:2021 - Injection
   → Prisma ORM (parameterized queries)
   → Zod validation
   → No raw SQL

✅ A04:2021 - Insecure Design
   → Secure defaults
   → Least privilege
   → Defense in depth

✅ A05:2021 - Security Misconfiguration
   → Security headers
   → Sentry monitoring
   → Regular updates

✅ A06:2021 - Vulnerable Components
   → npm audit
   → Dependabot
   → Automated updates

✅ A07:2021 - Authentication Failures
   → NextAuth.js
   → Rate limiting
   → Session management

✅ A08:2021 - Software Data Integrity
   → Checksum verification
   → Signed deployments (Vercel)

✅ A09:2021 - Logging Failures
   → Sentry error tracking
   → Pino structured logging
   → UserActivity audit trail

✅ A10:2021 - SSRF
   → URL validation
   → Webhook verification (Svix)
   → No user-controlled URLs
```

---

## 10. ANALYTICS E MONITORAMENTO

### 📊 Google Analytics 4

```typescript
// Measurement ID: G-WJE82VNKX8
// Implementation: app/layout.tsx

Events Tracked:
- page_view (automatic)
- sign_up
- login
- purchase (subscription)
- deal_created
- contact_created
- feature_used

Custom Dimensions:
- organization_plan (FREE/PRO)
- user_role (OWNER/MEMBER)
- pipeline_count
```

### 🏷️ Google Tag Manager

```typescript
// Container: GTM-XXXXXXX
// Implementation: components/google-tag-manager.tsx

Tags:
- GA4 Configuration
- Meta Pixel (roadmap)
- LinkedIn Insight (roadmap)

Triggers:
- Pageview
- Custom events
- Form submissions
- Button clicks

Variables:
- User ID
- Organization ID
- Plan type
```

### 📈 Microsoft Clarity

```typescript
// Project ID: Configured
// Implementation: components/microsoft-clarity.tsx

Features:
✅ Session recordings
✅ Heatmaps
✅ Rage clicks detection
✅ Dead clicks detection
✅ Excessive scrolling
✅ Quick backs

Privacy:
- GDPR compliant
- Cookie consent
- PII masking
```

### 🎯 PostHog

```typescript
// Project: phc_...
// Implementation: app/providers.tsx

Features:
✅ Product analytics
✅ Feature flags
✅ A/B testing (roadmap)
✅ Session replay
✅ User cohorts
✅ Funnel analysis

Events:
- User signup
- Onboarding steps
- Feature adoption
- Churn signals
```

### 🐛 Sentry.io

```typescript
// @sentry/nextjs: 10.36.0
// Configuration: sentry.client.config.ts, sentry.server.config.ts

Features:
✅ Error tracking
✅ Performance monitoring
✅ Release tracking
✅ Source maps upload
✅ User context
✅ Breadcrumbs

Environments:
- development (disabled)
- preview (enabled)
- production (enabled)

Sample Rates:
- Errors: 100%
- Transactions: 10%

Integrations:
- Next.js (automatic)
- Prisma (manual)
- Vercel (deployment)
```

### ⚡ Vercel Analytics

```typescript
// @vercel/analytics: 1.6.1
// @vercel/speed-insights: 1.3.1

Core Web Vitals:
✅ LCP (Largest Contentful Paint)
✅ FID (First Input Delay)
✅ CLS (Cumulative Layout Shift)
✅ FCP (First Contentful Paint)
✅ TTFB (Time to First Byte)

Real User Monitoring:
- Geographic distribution
- Device breakdown
- Browser distribution
- Network type
```

### 📉 Internal Analytics

```typescript
// lib/analytics-jobs.ts

Cron Jobs:
1. Daily Snapshot (00:00 UTC)
   - Deal metrics
   - Pipeline health
   - User activity

2. Monthly Revenue (Last day of month)
   - MRR calculation
   - ARR projection
   - Churn rate
   - Forecast

3. User Activity Tracking (Real-time)
   - Login/Logout
   - Feature usage
   - Page views
   - API calls

Data Warehouse:
- DealSnapshot (daily)
- RevenueSnapshot (monthly)
- UserActivity (continuous)
```

---

## 11. PWA E MOBILE

### 📱 Progressive Web App

```typescript
// next-pwa: 5.6.0
// Configuration: next.config.ts

Features:
✅ Installable (Add to Home Screen)
✅ Offline-first
✅ Service Worker
✅ Background sync
✅ Push notifications
✅ App manifest

Manifest (/public/manifest.json):
{
  "name": "Sirius CRM",
  "short_name": "Sirius",
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/dashboard",
  "icons": [...]
}
```

### 🔄 Service Worker

```javascript
// Generated by next-pwa

Caching Strategies:
1. CacheFirst (Google Fonts)
   - Max 1 year

2. StaleWhileRevalidate (Assets)
   - Images: 24h
   - Fonts: 7 days
   - JS/CSS: 24h

3. NetworkFirst (API)
   - Timeout: 10s
   - Fallback to cache

4. NetworkFirst (Pages)
   - General fallback

Precaching:
- Static assets
- App shell
- Critical CSS/JS
```

### 🔔 Push Notifications

```typescript
// web-push: 3.6.7
// Implementation: components/push-notification-manager.tsx

VAPID Keys:
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_EMAIL

Notification Types:
✅ Deal created
✅ Deal won/lost
✅ WhatsApp message
✅ Calendar reminder
✅ Mentions
✅ System alerts

Permission Flow:
1. User grants permission
2. Subscription created
3. Stored in DB (PushSubscription)
4. Notifications sent via worker

Browser Support:
- Chrome/Edge 42+
- Firefox 44+
- Safari 16+ (macOS only)
```

### 📴 Offline Mode

```typescript
// components/offline-status.tsx

Features:
✅ Offline detection (navigator.onLine)
✅ Queue mutations
✅ Background sync
✅ Toast notifications
✅ Retry logic

Offline Queue:
- Deal creation
- Contact creation
- Stage changes
- Notes

Sync Behavior:
1. Detect online
2. Process queue (FIFO)
3. Retry failures (3x)
4. Update UI
5. Clear queue
```

### 📊 PWA Metrics

```typescript
// Model: PWAMetric

Tracked Events:
- INSTALL_PROMPT_SHOWN
- INSTALL_PROMPT_ACCEPTED
- INSTALL_PROMPT_DISMISSED
- APP_INSTALLED
- PUSH_PERMISSION_GRANTED
- PUSH_PERMISSION_DENIED
- OFFLINE_SYNC_SUCCESS
- OFFLINE_SYNC_FAILURE
- SERVICE_WORKER_UPDATED

Dashboard:
/admin/pwa-metrics
- Installation rate
- Permission grant rate
- Offline usage
- Device breakdown
```

### 📱 Mobile Optimization

```typescript
// Responsive Design

Breakpoints (Tailwind):
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px

Mobile Features:
✅ Touch-optimized UI
✅ Swipe gestures
✅ Bottom sheets
✅ Mobile navigation
✅ Haptic feedback (roadmap)
✅ Biometric auth (roadmap)

Performance:
- Lazy loading
- Image optimization
- Code splitting
- Prefetching
- Service Worker caching
```

---

## 12. AGI SIRIUS (ASSISTENTE DE IA)

### 🤖 Visão Geral

```typescript
// lib/agi/brain.ts
// Provider: Groq Cloud (llama3.2)

Mission:
Assistente de vendas com IA que ajuda vendedores a:
- Qualificar leads (BANT, MEDDIC)
- Gerar scripts de vendas
- Analisar pipeline
- Sugerir próximos passos
- Lidar com objeções
- Avaliar risco de deals
```

### 🧠 Modelos e Configuração

```typescript
// FREE Plan
Model: llama3.2:1b
Max Tokens: 1024/response
Monthly Limit: 50.000 tokens (~50-75 conversas)
Temperature: 0.7

// PRO Plan
Model: llama3.2:3b
Max Tokens: 2048/response
Monthly Limit: 500.000 tokens (~500-750 conversas)
Temperature: 0.7

// Provider Configuration
Provider: Groq Cloud
API: @ai-sdk/groq
Endpoint: https://api.groq.com/openai/v1
```

### 🎯 Skills Disponíveis

#### 1. Qualificação BANT
```typescript
// lib/agi/skills.ts → qualificacao_bant

Input:
- Deal data
- Contact info
- Conversation history

Output:
{
  score: 75, // 0-100
  breakdown: {
    budget: { score: 80, rationale: "..." },
    authority: { score: 70, rationale: "..." },
    need: { score: 90, rationale: "..." },
    timeline: { score: 60, rationale: "..." }
  },
  recommendations: [
    "Validar orçamento disponível",
    "Agendar call com decisor",
    ...
  ],
  nextSteps: ["..."]
}

UI: app/dashboard/deals/[id] → AGI Panel
```

#### 2. Qualificação MEDDIC
```typescript
// MEDDIC = Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion

Input: Deal context

Output:
{
  score: 65,
  gaps: [
    { criterion: "Economic Buyer", identified: false },
    { criterion: "Champion", identified: true },
    ...
  ],
  suggestions: [...]
}
```

#### 3. Geração de Scripts
```typescript
// Tipos de script:
- prospeccao: Cold call inicial
- follow_up: Acompanhamento de proposta
- objecao: Contorno de objeções
- fechamento: Closing

Input:
{
  tipo: "prospeccao",
  contexto: {
    segmento: "SaaS B2B",
    painPoints: ["desorganização", "perda de leads"],
    valueProposition: "CRM intuitivo"
  }
}

Output:
Script estruturado com:
- Abertura
- Qualificação
- Apresentação de valor
- Próximos passos
```

#### 4. Análise de Pipeline
```typescript
// Identifica bottlenecks e oportunidades

Input: organizationId

Output:
{
  bottlenecks: [
    {
      stage: "Negociação",
      avgDaysStuck: 15,
      dealsCount: 8,
      recommendations: [...]
    }
  ],
  opportunities: [
    "Deals com alta probabilidade de fechar",
    "Deals em risco de perda"
  ],
  kpis: {
    conversionRate: 0.25,
    avgDealCycle: 30,
    winRate: 0.40
  }
}
```

#### 5. Avaliação de Risco
```typescript
// Deal risk scoring

Input: dealId

Output:
{
  riskScore: 35, // 0-100 (0=alto risco, 100=baixo risco)
  probability: 0.65, // Probabilidade de fechar
  riskFactors: [
    { factor: "Sem contato há 7 dias", weight: 0.3 },
    { factor: "Valor acima do ticket médio", weight: 0.2 }
  ],
  mitigationSteps: [
    "Agendar follow-up urgente",
    "Oferecer desconto escalonado"
  ]
}
```

### 💬 Conversational Interface

```typescript
// app/dashboard/deals/[id] → Chat AGI

Features:
✅ Multi-turn conversation
✅ Context awareness
✅ Deal-specific insights
✅ Markdown rendering
✅ Code snippets (scripts)
✅ Token tracking
✅ Conversation history

Example Flow:
User: "Qualifique este lead usando BANT"
AGI: [Analisa deal, executa skill]
     "Este lead tem um score BANT de 75/100.

     📊 Breakdown:
     - Budget: 80/100 ✅
     - Authority: 70/100 ⚠️
     - Need: 90/100 ✅
     - Timeline: 60/100 ⚠️

     🎯 Próximos passos:
     1. Validar orçamento específico
     2. Identificar decisor final
     3. Definir timeline de implementação"
```

### 📊 Usage Tracking

```typescript
// Model: AgiUsage

Tracking:
- Tokens used (per day)
- Request count
- Plan at time of use
- Monthly aggregation

Limits Enforcement:
if (monthlyTokens > limit) {
  throw new Error("Monthly AGI limit exceeded")
}

Dashboard:
/dashboard/settings → AGI Usage
- Current month usage
- Historical data
- Remaining tokens
- Upgrade CTA (FREE users)
```

### 🧩 Integration com CRM

```typescript
// Pontos de Integração:

1. Deal Detail Page
   - Chat sidebar
   - Quick insights
   - Risk score badge

2. Pipeline View
   - Deal scoring overlay
   - Priority indicators

3. Contacts
   - Lead quality score
   - Qualification suggestions

4. Dashboard Analytics
   - Pipeline analysis widget
   - Recommendations panel
```

### 🔮 Roadmap AGI

```typescript
Planned Features:
✅ Voice-to-text (input)
✅ Text-to-speech (output)
✅ Email draft generation
✅ WhatsApp message suggestions
✅ Predictive lead scoring
✅ Sentiment analysis (WhatsApp)
✅ Auto-follow-up suggestions
✅ Deal outcome prediction
✅ Custom training (fine-tuning)
```

---

## 13. SISTEMA DE TESTES

### 🧪 Unit Tests (Vitest)

```typescript
// Framework: Vitest 4.0.16
// Configuration: vitest.config.ts

Test Files: __tests__/
- auth/
  - login.test.ts
  - register.test.ts
  - session.test.ts
- helpers/
  - formatters.test.ts
  - validators.test.ts
- multi-tenant/
  - isolation.test.ts
  - permissions.test.ts
- payments/
  - mercadopago.test.ts
  - subscription.test.ts

Test Utilities:
- @testing-library/react
- @testing-library/jest-dom
- vitest-mock-extended
- happy-dom (jsdom alternative)

Coverage:
- Statements: ~70%
- Branches: ~65%
- Functions: ~68%
- Lines: ~70%

Run Tests:
npm run test
npm run test:ui        # Vitest UI
npm run test:coverage  # Coverage report
```

### 🎭 E2E Tests (Playwright)

```typescript
// Framework: @playwright/test 1.57.0
// Configuration: playwright.config.ts

Test Files: e2e/
- auth/
  - login.spec.ts
  - register.spec.ts
  - protected-routes.spec.ts
- deals/
  - crud.spec.ts
  - kanban.spec.ts
  - filters.spec.ts
- pipelines/
  - multi-pipeline.spec.ts
  - stage-management.spec.ts
- api/
  - contacts.spec.ts
  - webhooks.spec.ts

Browsers:
✅ Chromium
✅ Firefox
✅ WebKit

Features:
- Parallel execution
- Screenshot on failure
- Video recording
- Trace viewer
- Network mocking
- Database fixtures

Run Tests:
npm run test:e2e
npm run test:e2e:ui      # Playwright UI
npm run test:e2e:debug   # Debug mode
npm run test:e2e:report  # HTML report

CI Integration:
- GitHub Actions (planned)
- Run on pull requests
- Deploy preview testing
```

### 📸 Visual Regression (Planned)

```typescript
// Tool: Percy.io or Chromatic

Snapshots:
- Marketing pages
- Dashboard views
- Email templates
- Mobile views

Workflow:
1. Capture baseline
2. PR creates diff
3. Review changes
4. Approve/Reject
5. Update baseline
```

### 🔍 Code Quality

```typescript
// ESLint
Configuration: .eslintrc.json
Extends: next/core-web-vitals
Rules: Strict TypeScript

// TypeScript
Strict mode: true
noUnusedLocals: true
noUnusedParameters: true
noImplicitReturns: true

// Prettier (Planned)
Auto-formatting
Pre-commit hook
```

---

## 14. DEPLOY E INFRAESTRUTURA

### 🚀 Vercel Deployment

```typescript
// Platform: Vercel Edge Network
// Framework Preset: Next.js

Configuration:
- Build Command: npm run build
- Output Directory: .next
- Install Command: npm install
- Dev Command: npm run dev

Environment: Production
- Node.js: 20.x
- Build Cache: Enabled
- Edge Functions: Auto
- Serverless Functions: Auto

Regions:
Primary: iad1 (Washington, D.C.)
Edge: Global CDN

Build Process:
1. npm install
2. Prisma generate
3. Prisma migrate deploy
4. Next.js build
5. Asset optimization
6. Source map upload (Sentry)
7. Deploy to Edge

Deployment URL:
https://sirius.roilabs.com.br
https://sirius-git-main-roilabs.vercel.app
https://sirius-[hash].vercel.app (preview)
```

### 🗄️ Database Hosting

```typescript
// Provider: Neon / Vercel Postgres
// Engine: PostgreSQL 15

Configuration:
- Connection Pooling: Enabled (PgBouncer)
- Max Connections: 100
- Auto-pause: Disabled (production)
- Backups: Daily (7-day retention)
- Point-in-time Recovery: 7 days

Connection String:
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

Regions:
Primary: US East (AWS us-east-1)

Performance:
- SSD storage
- 1GB RAM (compute)
- Autoscaling (planned)
```

### 📦 Static Assets

```typescript
// CDN: Vercel Edge Network

Assets:
/public/
  - Images (optimized)
  - Icons (SVG, PNG)
  - Fonts (preloaded)
  - Audio files
  - Downloads (PDFs)

Optimization:
- Next.js Image (WebP, AVIF)
- Responsive sizes
- Lazy loading
- Priority loading (LCP)
- Immutable caching (hashed files)

Cache Headers:
- Images: public, max-age=31536000, immutable
- Fonts: public, max-age=31536000, immutable
- JS/CSS: public, max-age=31536000, immutable
- HTML: private, no-cache
```

### 🔄 CI/CD Pipeline

```typescript
// Git Integration: GitHub
// Branch: main → Production
// PRs: Automatic preview deploys

Workflow:
1. Push to GitHub
2. Vercel webhook triggered
3. Build starts
4. Tests run (planned)
5. Build succeeds
6. Deploy to production
7. Purge CDN cache
8. Health check
9. Rollback if errors

Preview Deploys:
- Every PR gets unique URL
- Automatic comments on PR
- Live preview
- Isolated environment

Rollback:
- One-click rollback
- Instant (edge redirection)
- No downtime
```

### 📊 Monitoring & Alerts

```typescript
// Vercel Analytics
- Real-time metrics
- Core Web Vitals
- Error rate
- 95th percentile response time

// Sentry
- Error tracking
- Performance monitoring
- Release tracking
- Alerts (Slack, Email)

// Uptime Monitoring (Planned)
- Ping checks (1min interval)
- SSL monitoring
- DNS monitoring
- Status page
```

### 🔐 Environment Variables

```typescript
// Vercel Environment Variables

Environments:
1. Production
2. Preview
3. Development (local only)

Critical Secrets:
✅ DATABASE_URL
✅ SESSION_SECRET
✅ NEXTAUTH_SECRET
✅ MERCADO_PAGO_ACCESS_TOKEN
✅ RESEND_API_KEY
✅ SENTRY_AUTH_TOKEN
✅ INTEGRATION_ENCRYPTION_KEY
✅ VAPID_PRIVATE_KEY

Sync:
vercel env pull .env.local
```

### 🌍 Custom Domain

```typescript
// Domain: sirius.roilabs.com.br
// Registrar: Hostinger / Registro.br

DNS Configuration:
A     @ → 76.76.21.21 (Vercel)
CNAME www → cname.vercel-dns.com

SSL/TLS:
- Auto-renewed (Let's Encrypt)
- HTTPS-only
- HSTS enabled
- Certificate pinning (planned)

Redirects:
www.sirius.roilabs.com.br → sirius.roilabs.com.br
http:// → https://
```

---

## 15. CONFIGURAÇÃO E VARIÁVEIS DE AMBIENTE

### 🔧 .env.example

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Authentication
SESSION_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN="APP_USR-..."
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY="APP_USR-..."
MERCADO_PAGO_WEBHOOK_SECRET="your-webhook-secret"

# Email - Resend
RESEND_API_KEY="re_..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Cron Jobs
CRON_SECRET="generate-with-openssl-rand-base64-32"

# Sentry
NEXT_PUBLIC_SENTRY_DSN=""
SENTRY_ORG=""
SENTRY_PROJECT=""
SENTRY_AUTH_TOKEN=""

# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL="https://your-endpoint.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# Svix (Webhook Management)
SVIX_API_KEY="your-svix-api-key"

# Integration Encryption
INTEGRATION_ENCRYPTION_KEY="generate-with-openssl-rand-hex-32"

# N8N (Optional)
N8N_BASE_URL="https://n8n.example.com"
N8N_API_KEY="your-n8n-api-key"

# Evolution API (WhatsApp) (Optional)
EVOLUTION_API_BASE_URL="https://evolution.example.com"
EVOLUTION_API_KEY="your-evolution-api-key"
EVOLUTION_INSTANCE_NAME="your-instance-name"

# Google Calendar (Optional)
GOOGLE_CALENDAR_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CALENDAR_CLIENT_SECRET="your-client-secret"
GOOGLE_CALENDAR_REDIRECT_URI="${NEXT_PUBLIC_APP_URL}/api/integrations/google-calendar/callback"

# Web Push (VAPID Keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
VAPID_EMAIL="noreply@yourdomain.com"

# AGI Sirius
AGI_MODEL_FREE="llama3.2:1b"
AGI_MODEL_PRO="llama3.2:3b"
AGI_TEMPERATURE="0.7"
AGI_MAX_TOKENS_FREE="1024"
AGI_MAX_TOKENS_PRO="2048"
AGI_MONTHLY_LIMIT_FREE="50000"
AGI_MONTHLY_LIMIT_PRO="500000"
AGI_ENABLED="true"
```

### 🔐 Secret Generation

```bash
# Session & NextAuth Secrets (32 bytes base64)
openssl rand -base64 32

# Integration Encryption Key (32 bytes hex)
openssl rand -hex 32

# VAPID Keys (Web Push)
npx web-push generate-vapid-keys
```

---

## 16. SCRIPTS DISPONÍVEIS

### 📜 package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "npx prisma migrate deploy && npx prisma generate && next build",
    "start": "next start",
    "lint": "eslint",

    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",

    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report",

    "indexnow": "tsx scripts/submit-to-indexnow.ts"
  }
}
```

### 🛠️ Utility Scripts

```typescript
// scripts/submit-to-indexnow.ts
// Submit URLs to IndexNow for instant indexing

Usage:
npm run indexnow

Submits:
- Homepage
- Feature pages
- Blog posts
- Solution pages
- Calculator pages

Engines:
- Bing (Microsoft)
- Yandex
```

---

## 17. DEPENDÊNCIAS DO PROJETO

### 📦 Dependencies (Production)

```json
{
  "@ai-sdk/groq": "^3.0.16",
  "@ai-sdk/react": "^3.0.60",
  "@hello-pangea/dnd": "^18.0.1",
  "@prisma/client": "^5.19.0",
  "@radix-ui/react-*": "Latest", // 15 packages
  "@react-email/components": "^1.0.3",
  "@scalar/nextjs-api-reference": "^0.9.9",
  "@sentry/nextjs": "^10.36.0",
  "@tanstack/react-table": "^8.21.3",
  "@tavily/core": "^0.7.1",
  "@upstash/ratelimit": "^2.0.7",
  "@upstash/redis": "^1.36.1",
  "@vercel/analytics": "^1.6.1",
  "@vercel/speed-insights": "^1.3.1",
  "ai": "^6.0.58",
  "bcryptjs": "^3.0.3",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "date-fns": "^4.1.0",
  "googleapis": "^170.1.0",
  "jose": "^6.1.3",
  "jspdf": "^4.0.0",
  "jspdf-autotable": "^5.0.7",
  "lucide-react": "^0.562.0",
  "mercadopago": "^2.11.0",
  "next": "16.1.1",
  "next-auth": "^4.24.13",
  "next-pwa": "^5.6.0",
  "next-themes": "^0.4.6",
  "pino": "^10.1.0",
  "pino-pretty": "^13.1.3",
  "posthog-js": "^1.335.4",
  "qrcode.react": "^4.2.0",
  "react": "19.2.3",
  "react-dom": "19.2.3",
  "react-email": "^5.1.1",
  "react-markdown": "^10.1.0",
  "recharts": "^3.7.0",
  "resend": "^6.6.0",
  "simple-statistics": "^7.8.8",
  "sonner": "^2.0.7",
  "svix": "^1.84.1",
  "tailwind-merge": "^3.4.0",
  "web-push": "^3.6.7",
  "xlsx": "^0.18.5",
  "zod": "^4.3.6"
}
```

### 🔧 DevDependencies

```json
{
  "@playwright/test": "^1.57.0",
  "@tailwindcss/postcss": "^4",
  "@testing-library/jest-dom": "^6.9.1",
  "@testing-library/react": "^16.3.1",
  "@testing-library/user-event": "^14.6.1",
  "@types/bcryptjs": "^2.4.6",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "@types/web-push": "^3.6.4",
  "@vitejs/plugin-react": "^5.1.2",
  "eslint": "^9",
  "eslint-config-next": "16.1.1",
  "happy-dom": "^20.0.11",
  "msw": "^2.12.7",
  "prisma": "^5.19.0",
  "tailwindcss": "^4",
  "tsx": "^4.21.0",
  "tw-animate-css": "^1.4.0",
  "typescript": "^5",
  "vitest": "^4.0.16",
  "vitest-mock-extended": "^3.1.0"
}
```

---

## 18. ROADMAP E HISTÓRICO

### 📜 CHANGELOG.md (Resumo)

```markdown
## [1.0.0] - 2026-01-05

### 🎉 Release Inicial
- ✅ Kanban Board completo
- ✅ Gestão de Deals & Contacts
- ✅ Multi-Pipeline (PRO)
- ✅ Analytics & Forecasting
- ✅ Email Automations
- ✅ Public REST API
- ✅ Webhooks (Svix)
- ✅ Integrações (WhatsApp, Calendar, N8N)
- ✅ PWA & Push Notifications
- ✅ AGI Sirius (AI Assistant)
- ✅ Mercado Pago Billing
- ✅ Multi-tenancy
- ✅ Onboarding System

## [Unreleased]
- 🚧 A/B Testing (PostHog)
- 🚧 Voice-to-text AGI
- 🚧 Mobile Apps (React Native)
- 🚧 Custom Subdomains
- 🚧 SSO (SAML, OIDC)
```

### 🗓️ Development Timeline

```
Dezembro 2025:
- Setup inicial Next.js 16
- Database schema (Prisma)
- Authentication (NextAuth)
- Basic CRUD (Deals, Contacts)
- Kanban Board (DnD)

Janeiro 2026:
- Multi-Pipeline
- Analytics Dashboard
- Email Automations
- Public API v1
- Integrations (N8N, WhatsApp, Calendar)
- PWA Features
- AGI Sirius
- Mercado Pago Billing
- Blog SEO
- Launch v1.0.0 🚀
```

### 🔮 Roadmap 2026

```typescript
Q1 2026 (Jan-Mar):
✅ Launch MVP
✅ Blog & SEO
✅ AGI Sirius v1
□ Mobile App (React Native)
□ SSO (Google, Microsoft)
□ Advanced Reporting

Q2 2026 (Apr-Jun):
□ Telefonia Integration (Twilio)
□ Email Inbox (Gmail, Outlook)
□ AI Sales Coach
□ Chrome Extension
□ Slack Integration

Q3 2026 (Jul-Sep):
□ Marketplace (Plugins)
□ White-label
□ Enterprise Plan
□ Advanced Permissions
□ Audit Logs

Q4 2026 (Oct-Dec):
□ Global Expansion
□ Multi-language
□ On-premise Option
□ Advanced AI Features
□ Voice AI Calls
```

---

## 19. DOCUMENTAÇÃO TÉCNICA

### 📚 Documentos Disponíveis

```
docs/
├── ARCHITECTURE.md       # Arquitetura completa do sistema
├── API.md                # Documentação da Public API v1
└── AGI_DEPLOYMENT.md     # Setup e deployment do AGI Sirius

.github/
├── RELEASE_TEMPLATE.md   # Template para release notes
└── VERSIONING.md         # Semantic versioning guide

components/
├── calculadora-roi.md    # Especificação das calculadoras
└── onboarding/README.md  # Sistema de onboarding

app/(marketing)/vendas-automaticas/README.md
blog/spin-selling-guia-completo.md

CHANGELOG.md              # Histórico de versões
README.md                 # (criar) Instruções de setup
CONTRIBUTING.md           # (planejar) Guia de contribuição
```

### 📖 API Documentation

```typescript
// Scalar API Reference
// URL: /api/docs
// Spec: /api/openapi.json

Features:
✅ Interactive playground
✅ Authentication testing
✅ Request/Response examples
✅ Schema validation
✅ Code generation (curl, JS, Python)

OpenAPI 3.1 Spec:
- 40+ endpoints
- Full schema definitions
- Authentication flows
- Error responses
- Rate limit headers
```

---

## 20. MARKETING E SEO

### 📝 Blog System

```typescript
// Localização: app/(marketing)/blog/
// Data Source: lib/blog-data.ts

Posts Publicados:
1. Pipeline de Vendas: O Guia Completo (2025-12-28)
2. CRM Simples vs CRM Complexo (2025-12-27)
3. Follow-up: Guia Completo (2025-12-25)
4. Funil de Vendas (2026-01-09)
5. SPIN Selling (2026-01-10)
6. Planilha de Controle de Comissão (2026-01-28) ⭐

Features:
✅ SSG (Static Site Generation)
✅ SEO optimizado
✅ Schema.org markup
✅ Open Graph
✅ Twitter Cards
✅ Sticky category filter
✅ Featured post section
✅ Date sorting (newest first)
✅ Next.js Image optimization
✅ Reading time estimate
✅ Social share buttons (planned)

Blog Images:
public/images/blog/
- crm-simples-complexo.png
- follow-up.png
- funil-vendas.png
- pipeline-vendas.png
- planilha-controle-comissao.png (Gemini AI)
- spin-selling.png
```

### 🧮 ROI Calculators

```typescript
// Localização: app/(marketing)/ferramentas/

Calculadoras:
1. /ferramentas/calculadora-roi
   - Geral (todos os nichos)

2. /ferramentas/calculadora-roi-corretores
   - Corretores de Imóveis

3. /ferramentas/calculadora-roi-agencias
   - Agências de Marketing

4. /ferramentas/calculadora-roi-consultores
   - Consultores e Freelancers

5. /ferramentas/calculadora-roi-energia-solar
   - Instaladores de Energia Solar

6. /ferramentas/calculadora-roi-representantes
   - Representantes Comerciais

Features:
✅ Cálculo de ROI em tempo real
✅ Inputs customizados por nicho
✅ Visualização de resultados
✅ Lead capture (email)
✅ Download de planilha
✅ SEO otimizado
✅ Schema.org (SoftwareApplication)
```

### 🎯 Solution Pages

```typescript
// Localização: app/(marketing)/solucoes/[slug]/

Soluções:
1. /solucoes/corretores-de-imoveis
   - CRM para Corretores
   - Features específicas
   - Depoimentos
   - Recursos gratuitos (Planilha, ROI Calculator)

2. /solucoes/consultores (planned)
3. /solucoes/agencias (planned)
4. /solucoes/energia-solar (planned)

Features:
✅ Hero section
✅ Features list
✅ Testimonials
✅ Pricing comparison
✅ Free resources section
✅ CTA buttons
✅ SEO optimizado
```

### 📊 SEO Optimization

```typescript
// Strategy: On-page + Technical SEO

Metadata:
✅ Title tags (unique per page)
✅ Meta descriptions
✅ Keywords
✅ Canonical URLs
✅ Hreflang (pt-BR)

Schema.org:
✅ WebSite
✅ Organization
✅ SoftwareApplication
✅ BlogPosting
✅ FAQPage
✅ BreadcrumbList

Technical SEO:
✅ Sitemap.xml (auto-generated)
✅ Robots.txt
✅ 301 Redirects
✅ Core Web Vitals
✅ Mobile-friendly
✅ HTTPS
✅ Structured data

Performance:
✅ Lighthouse Score: 95+
✅ LCP < 2.5s
✅ FID < 100ms
✅ CLS < 0.1

IndexNow:
✅ Instant indexing (Bing, Yandex)
✅ Script: scripts/submit-to-indexnow.ts
✅ Automated submissions
```

### 📈 Analytics & Tracking

```typescript
// Multi-platform tracking

Google Analytics 4:
- Measurement ID: G-WJE82VNKX8
- Events: page_view, sign_up, purchase
- Conversions: Signup, Subscription

Google Tag Manager:
- Container: GTM-XXXXXXX
- Tags: GA4, Clarity, (Meta Pixel planned)

Microsoft Clarity:
- Session recordings
- Heatmaps
- User behavior

PostHog:
- Product analytics
- Feature flags
- User cohorts
- Funnel analysis

Vercel Analytics:
- Real User Monitoring
- Core Web Vitals
- Geographic distribution
```

---

## 📝 CONCLUSÃO

### 🎯 Resumo Executivo

O **Sirius CRM** é uma plataforma SaaS completa e moderna de gestão de vendas, desenvolvida com as tecnologias mais atuais do ecossistema React/Next.js. O projeto demonstra excelência técnica em múltiplas áreas:

**Arquitetura:**
- Next.js 16 App Router com React Server Components
- Multi-tenancy com isolamento total de dados
- Arquitetura orientada a eventos com webhooks
- Data warehouse para analytics avançado

**Funcionalidades Destacadas:**
- Kanban Board interativo com drag & drop
- AGI Sirius (Assistente de IA com skills especializados)
- Multi-Pipeline para processos complexos
- Integrações nativas (WhatsApp, Google Calendar, N8N)
- PWA com modo offline e push notifications
- Public REST API com documentação interativa

**Qualidade & Performance:**
- Testes E2E com Playwright (50+ specs)
- Lighthouse Score 95+
- Monitoring completo (Sentry, Vercel, PostHog)
- Security headers enterprise-grade
- OWASP Top 10 compliance

**Escalabilidade:**
- Database indexing estratégico
- Edge caching (Vercel CDN)
- Rate limiting (Redis)
- Serverless architecture
- Auto-scaling ready

### 📊 Métricas do Projeto

```
Linhas de Código: ~30.000+
Componentes React: 104
API Routes: 60+
Database Models: 30+
Database Migrations: 17
Blog Posts: 6
Solution Pages: 1 (+ 4 planned)
ROI Calculators: 6
Test Specs: 50+ (E2E)
Dependencies: 80+ (production + dev)
```

### 🏆 Diferenciais Competitivos

1. **IA Nativa**: AGI Sirius integrado, não é add-on
2. **Foco BR**: Mercado Pago, WhatsApp, validações brasileiras
3. **Developer-First**: Public API documentada, webhooks robustos
4. **Performance**: PWA, offline-first, otimizações extremas
5. **Analytics**: Data warehouse nativo, forecasting ML
6. **Multi-Pipeline**: Flexibilidade para processos complexos

### 🚀 Próximos Passos Recomendados

**Curto Prazo (30 dias):**
- [ ] Finalizar smoke tests
- [ ] Security audit completo
- [ ] Performance profiling
- [ ] Documentation review
- [ ] Marketing content (case studies)

**Médio Prazo (90 dias):**
- [ ] Mobile app (React Native)
- [ ] SSO (Google, Microsoft)
- [ ] Advanced reporting
- [ ] Telefonia integration
- [ ] Email inbox sync

**Longo Prazo (6 meses):**
- [ ] Marketplace de plugins
- [ ] White-label option
- [ ] Enterprise plan
- [ ] Global expansion (i18n)
- [ ] On-premise deployment

### 📞 Contatos & Links

**Website:** https://sirius.roilabs.com.br
**Empresa:** ROI Labs (https://roilabs.com.br)
**Repositório:** https://github.com/JeanZorzetti/sirius.git
**Desenvolvedor:** Jean Zorzetti
**Email:** contato@roilabs.com.br (configurar)
**Suporte:** /help (built-in)

---

**Última Atualização:** 29 de Janeiro de 2026
**Versão do Dossiê:** 1.0.0
**Gerado por:** Claude Sonnet 4.5 + Jean Zorzetti

---

*Este dossiê é um documento vivo e deve ser atualizado conforme o projeto evolui.*
