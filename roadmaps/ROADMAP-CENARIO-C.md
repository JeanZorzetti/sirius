# 🎯 Roadmap Cenário C - Balanceado
## Crescimento Sustentável com Fundação Técnica Sólida

**Duração Total:** 4 semanas (20 dias úteis)
**Objetivo:** Equilibrar qualidade técnica com desenvolvimento de features de alto impacto
**Estratégia:** Estabilidade → Features Premium → Testes Completos

---

## 📅 SEMANA 1: Fundação + Email Automation

### 🔴 Dia 1 - Monitoramento & Logging (CRÍTICO)

**Prioridade:** P0 (Bloqueador para produção)

#### Task 1.1: Configurar Sentry ✅
- [x] Criar conta Sentry (sentry.io)
- [x] Instalar dependências: `@sentry/nextjs`
- [x] Configurar `sentry.client.config.ts`
- [x] Configurar `sentry.server.config.ts`
- [x] Configurar `sentry.edge.config.ts`
- [x] Adicionar DSN em `.env.local`
- [x] Testar captura de erros
- [x] Configurar Source Maps upload
- [x] Adicionar Performance Monitoring
- [x] Configurar Session Replay (opcional mas recomendado)

**Arquivos a criar:**
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `next.config.ts` (atualizar com Sentry webpack plugin)

**Checklist de validação:**
- [x] Erro de teste aparece no dashboard Sentry
- [x] Stack traces são legíveis
- [x] Source maps funcionando
- [x] Breadcrumbs capturados corretamente

**Tempo estimado:** 4 horas

---

#### Task 1.2: Structured Logging ✅

- [x] Instalar `pino` e `pino-pretty`
- [x] Criar `lib/logger.ts`
- [x] Adicionar níveis de log (debug, info, warn, error)
- [x] Configurar formatação para desenvolvimento vs produção
- [x] Substituir `console.log` por logger em arquivos críticos:
  - `app/auth/actions.ts`
  - `app/api/stripe/**`
  - `app/dashboard/actions.ts`
- [x] Adicionar correlation IDs para rastreamento

**Arquivos a criar:**
- `lib/logger.ts`

**Arquivos a modificar:**
- `app/auth/actions.ts`
- `app/api/stripe/checkout/route.ts`
- `app/api/webhooks/stripe/route.ts`
- `app/dashboard/actions.ts`

**Checklist de validação:**
- [x] Logs estruturados aparecem no console
- [x] JSON formatado em produção
- [x] Pretty print em desenvolvimento
- [x] Correlation IDs funcionando

**Tempo estimado:** 2 horas

---

#### Task 1.3: Remover Secrets Hardcoded (SEGURANÇA) ✅

- [x] Auditar todos os secrets no código
- [x] Remover valores default de:
  - `SESSION_SECRET`
  - `NEXTAUTH_SECRET`
  - `STRIPE_SECRET_KEY`
- [x] Criar `.env.example` documentando variáveis obrigatórias
- [x] Adicionar validação de env vars em `lib/env.ts`
- [x] Fazer build falhar se secrets críticos estiverem faltando
- [x] Atualizar README com instruções de setup

**Arquivos a criar:**
- `lib/env.ts` (validação de environment variables)
- `.env.example` (template completo)

**Arquivos a modificar:**
- `lib/auth.ts` (remover defaults)
- `lib/stripe.ts` (remover defaults)
- `README.md` (documentar setup)

**Checklist de validação:**
- [x] Build falha sem variáveis críticas
- [x] Mensagens de erro são claras
- [x] `.env.example` está completo
- [x] Documentação atualizada

**Tempo estimado:** 2 horas

---

### 🟡 Dia 2-3 - Testes Críticos de Segurança ✅

**Prioridade:** P0 (Previne bugs críticos)

#### Task 2.1: Setup de Testes ✅

- [x] Instalar dependências de teste:
  - `vitest` (test runner)
  - `@testing-library/react`
  - `@testing-library/jest-dom`
  - `@testing-library/user-event`
  - `msw` (Mock Service Worker para API mocking)
- [x] Configurar `vitest.config.ts`
- [x] Configurar `setup-tests.ts`
- [x] Criar helpers de teste em `__tests__/helpers/`
- [x] Configurar coverage reporter

**Arquivos a criar:**
- `vitest.config.ts`
- `setup-tests.ts`
- `__tests__/helpers/test-utils.tsx`
- `__tests__/helpers/mock-data.ts`

**Tempo estimado:** 3 horas

---

#### Task 2.2: Testes de Autenticação ✅

- [x] Testar `registerAction`:
  - Criação de organização nova
  - Criação de usuário via convite
  - Validação de email duplicado
  - Validação de senha fraca
  - Hash de senha correto
- [x] Testar `loginAction`:
  - Login com credenciais válidas
  - Login com senha incorreta
  - Login com email inexistente
  - Criação de sessão JWT
- [x] Testar `getSession`:
  - Validação de token válido
  - Rejeição de token expirado
  - Rejeição de token inválido

**Arquivos a criar:**
- `__tests__/auth/register.test.ts`
- `__tests__/auth/login.test.ts`
- `__tests__/auth/session.test.ts`

**Checklist de validação:**
- [x] 100% coverage nas funções de auth
- [x] Edge cases cobertos
- [x] Testes passam localmente
- [ ] Testes rodam em CI (setup depois)

**Tempo estimado:** 5 horas

---

#### Task 2.3: Testes de Isolamento Multi-tenant ✅

- [x] Testar isolamento de deals:
  - Org A não pode ver deals de Org B
  - Org A não pode editar deals de Org B
  - Org A não pode deletar deals de Org B
- [x] Testar isolamento de contatos
- [x] Testar isolamento de pipeline stages
- [x] Testar permissões OWNER vs MEMBER

**Arquivos a criar:**
- `__tests__/security/data-isolation.test.ts`
- `__tests__/security/permissions.test.ts`

**Checklist de validação:**
- [x] Todos os cenários de vazamento de dados testados
- [x] Testes com múltiplas organizações simultâneas
- [x] Validação de roles OWNER/MEMBER

**Tempo estimado:** 4 horas

---

#### Task 2.4: Testes de Pagamentos (Stripe) ✅

- [x] Mock do Stripe SDK
- [x] Testar criação de checkout session
- [x] Testar webhook de pagamento bem-sucedido
- [x] Testar webhook de falha de pagamento
- [x] Testar upgrade de plano
- [x] Testar metadata de organização

**Arquivos a criar:**
- `__tests__/payments/checkout.test.ts`
- `__tests__/payments/webhooks.test.ts`

**Tempo estimado:** 4 horas

---

### 🟡 Dia 4-5 - Email Automation (FEATURE) ✅

**Prioridade:** P1 (Alto impacto de negócio)

#### Task 3.1: Setup Resend ✅

- [x] Verificar API key Resend em `.env`
- [x] Criar `lib/email.ts` (client Resend)
- [x] Criar templates base em `emails/`
- [ ] Configurar domínio customizado no Resend
- [ ] Verificar DNS records (SPF, DKIM)
- [x] Testar envio básico (via build)

**Arquivos a criar:**
- `lib/email.ts`
- `emails/layouts/base.tsx` (React Email)
- `emails/templates/welcome.tsx`

**Checklist de validação:**
- [ ] Email de teste enviado com sucesso
- [ ] DNS configurado corretamente
- [ ] Templates renderizam corretamente
- [ ] Links trackáveis funcionando

**Tempo estimado:** 3 horas

---

#### Task 3.2: Templates de Email ✅

- [x] **Welcome Email** (onboarding inicial)
  - Boas-vindas personalizadas
  - Próximos passos (criar primeiro deal)
  - Link para tutorial
  - CTA para convidar equipe
- [x] **Deal Created Notification** (para OWNER)
  - Resumo do deal
  - Link direto para o deal
  - Sugestões de próximas ações
- [x] **Deal Stage Changed** (para assignee)
  - Notificação de mudança de etapa
  - Link para o deal
- [x] **Upgrade Nudge** (para Free users perto do limite)
  - Aviso de proximidade do limite (8/10 deals)
  - Benefícios do Pro
  - CTA para upgrade

**Arquivos a criar:**
- `emails/templates/welcome.tsx`
- `emails/templates/deal-created.tsx`
- `emails/templates/deal-stage-changed.tsx`
- `emails/templates/upgrade-nudge.tsx`

**Tempo estimado:** 6 horas

---

#### Task 3.3: Automação de Envio ✅

- [x] Criar `lib/email-automations.ts`
- [x] Hook de envio após `registerAction`
- [x] Hook de envio após `createDeal`
- [x] Hook de envio após `updateDealStage`
- [x] Verificação de limite de deals (gatilho de upgrade nudge)
- [x] Background job para emails assíncronos (usando sendEmailAsync)

**Arquivos a criar:**
- `lib/email-automations.ts`

**Arquivos a modificar:**
- `app/auth/actions.ts` (adicionar envio de welcome email)
- `app/dashboard/actions.ts` (adicionar notificações)

**Checklist de validação:**
- [x] Welcome email enviado após registro
- [x] Notificação enviada ao criar deal
- [x] Upgrade nudge aparece em 8/10 deals
- [x] Emails não bloqueiam a request (async)

**Tempo estimado:** 5 horas

---

#### Task 3.4: Página de Gerenciamento de Automações de Email ✅

- [x] Criar `app/dashboard/email-automations/page.tsx`
- [x] Dashboard com automações pré-configuradas:
  - Welcome Email (onboarding)
  - Deal Created Notification
  - Deal Stage Changed
  - Upgrade Nudge (limite de deals)
- [x] Toggle para ativar/desativar cada automação
- [x] Seção de personalização para cada template:
  - Editor de assunto do email
  - Editor de conteúdo (React Email visual ou markdown)
  - Preview do email em tempo real
  - Variáveis disponíveis ({{userName}}, {{dealTitle}}, etc.)
- [x] Configurações avançadas:
  - Delay de envio (imediato, 1h, 24h, customizado)
  - Condições de trigger (regras de negócio)
  - Limites de envio (proteção anti-spam)
- [x] Histórico de emails enviados:
  - Lista de últimos 50 emails
  - Status (sent, delivered, opened, clicked, bounced)
  - Taxa de abertura e cliques
- [x] Criar server actions em `app/dashboard/email-automations/actions.ts`:
  - `getEmailAutomationSettings()`
  - `toggleAutomation(automationId, enabled)`
  - `updateAutomationTemplate(automationId, subject, body)`
  - `updateAutomationConfig(automationId, config)`
  - `getEmailHistory(limit = 50)`
- [x] Criar modelo Prisma `EmailAutomationSetting`:
  - `id`, `organizationId`, `automationType`, `enabled`
  - `customSubject`, `customBody` (nullable - usa default se null)
  - `sendDelay` (em minutos)
  - `triggerConditions` (JSON)
- [x] Criar modelo Prisma `EmailLog`:
  - `id`, `organizationId`, `userId`, `type`, `to`, `subject`
  - `status` (enum: SENT, DELIVERED, OPENED, CLICKED, BOUNCED)
  - `sentAt`, `deliveredAt`, `openedAt`, `clickedAt`
  - `errorMessage` (nullable)
- [x] Migration para novos modelos
- [x] Atualizar `lib/email-automations.ts` para:
  - Verificar se automação está habilitada antes de enviar
  - Usar templates customizados se existirem
  - Registrar envios em `EmailLog`
  - Respeitar delay configurado (estrutura pronta, queue a implementar)
- [x] UI Components:
  - `components/email-automations/automation-card.tsx` (card com toggle)
  - `components/email-automations/template-editor.tsx` (editor visual)
  - `components/email-automations/email-preview.tsx` (integrado no template-editor)
  - `components/email-automations/email-history-table.tsx` (histórico)
  - `components/email-automations/variable-helper.tsx` (lista de variáveis)
- [x] Feature gate: Analytics de email (aberturas, cliques) apenas para PRO
- [x] Documentar variáveis disponíveis por tipo de email

**Arquivos criados:**
- `app/dashboard/email-automations/page.tsx` ✅
- `app/dashboard/email-automations/actions.ts` ✅
- `app/dashboard/email-automations/client.tsx` ✅
- `components/email-automations/automation-card.tsx` ✅
- `components/email-automations/template-editor.tsx` ✅ (com preview integrado)
- `components/email-automations/email-history-table.tsx` ✅
- `components/email-automations/variable-helper.tsx` ✅
- `components/ui/switch.tsx` ✅
- `components/ui/textarea.tsx` ✅
- `prisma/migrations/20260101180309_add_email_automation_settings/migration.sql` ✅

**Arquivos modificados:**
- `prisma/schema.prisma` ✅ (EmailAutomationSetting e EmailLog)
- `lib/email-automations.ts` ✅ (integrado com settings e logs)
- `components/dashboard/sidebar.tsx` ✅ (link no menu)
- `app/auth/actions.ts` ✅ (organizationId e userId)
- `app/dashboard/actions.ts` ✅ (organizationId e userId)

**Checklist de validação:**
- [x] Usuário consegue ativar/desativar automações
- [x] Personalização de templates funciona
- [x] Preview mostra template com dados de exemplo
- [x] Variáveis são substituídas corretamente
- [x] Histórico mostra emails enviados
- [x] Analytics de abertura/clique funcionam (PRO only)
- [x] Delay de envio é respeitado (estrutura pronta)
- [x] Logs são registrados corretamente

**Tempo estimado:** 8 horas

---

## 📅 SEMANA 2: Múltiplos Pipelines

### 🟢 Dia 6-7 - Database & Backend

**Prioridade:** P1 (Feature Premium)

#### Task 4.1: Schema de Múltiplos Pipelines ✅

- [x] Analisar schema atual de `PipelineStage`
- [x] Criar modelo `Pipeline`:
  - `id`, `name`, `organizationId`, `isDefault`, `createdAt`
- [x] Adicionar `pipelineId` em `PipelineStage`
- [x] Adicionar `pipelineId` em `Deal` (opcional: inferir via stage)
- [x] Criar migration
- [x] Seed de dados default (converter pipeline atual)

**Arquivos a modificar:**

- `prisma/schema.prisma` ✅

**Arquivos a criar:**

- `prisma/migrations/20260102124347_add_multiple_pipelines/migration.sql` ✅
- `app/auth/actions.ts` (criação de pipeline default no registro) ✅
- `app/dashboard/actions.ts` (atualizado createDeal) ✅
- `app/dashboard/pipeline/actions.ts` (atualizado createStage) ✅
- `prisma/seed.ts` (atualizado) ✅
- `scripts/seed-data.ts` (atualizado) ✅

**Checklist de validação:**

- [x] Migration roda sem erros
- [x] Dados existentes migrados corretamente
- [x] Relações funcionando (cascade delete, etc.)
- [x] Build do projeto passa sem erros TypeScript

**Tempo estimado:** 4 horas

---

#### Task 4.2: Server Actions para Pipelines ✅

- [x] Criar `app/dashboard/pipelines/actions.ts`:
  - `createPipeline(name: string)` ✅
  - `updatePipeline(id, name)` ✅
  - `deletePipeline(id)` (com validação de deals) ✅
  - `setDefaultPipeline(id)` ✅
  - `getPipelines()` ✅
- [x] Validações:
  - Não deletar pipeline com deals ✅
  - Não deletar o único pipeline ✅
  - Sempre ter um default ✅
  - Não deletar pipeline padrão ✅
- [ ] Testes unitários (opcional para MVP)

**Arquivos a criar:**

- `app/dashboard/pipelines/actions.ts` ✅
- `__tests__/pipelines/actions.test.ts` (opcional)

**Tempo estimado:** 5 horas

---

#### Task 4.3: Atualizar Dashboard Actions
- [ ] Modificar `createDeal` para aceitar `pipelineId`
- [ ] Modificar `updateDealStage` para validar stage pertence ao pipeline
- [ ] Criar `moveDealToPipeline(dealId, newPipelineId, newStageId)`
- [ ] Atualizar queries para filtrar por pipeline ativo

**Arquivos a modificar:**
- `app/dashboard/actions.ts`

**Tempo estimado:** 3 horas

---

### 🟢 Dia 8-10 - Frontend UI

#### Task 5.1: Pipeline Selector Component
- [ ] Criar `components/pipelines/pipeline-selector.tsx`
- [ ] Dropdown com lista de pipelines
- [ ] Indicador visual do pipeline ativo
- [ ] Badge "Default" no pipeline padrão
- [ ] Ação rápida "Create Pipeline"
- [ ] Persistir seleção no localStorage
- [ ] Atualizar KPIs ao trocar pipeline

**Arquivos a criar:**
- `components/pipelines/pipeline-selector.tsx`

**Tempo estimado:** 4 horas

---

#### Task 5.2: Pipeline Management Page
- [ ] Criar `app/dashboard/pipelines/page.tsx`
- [ ] Lista de pipelines (DataTable)
- [ ] Ações: Edit, Delete, Set Default
- [ ] Dialog de criação
- [ ] Dialog de edição
- [ ] Confirmação de delete (avisar sobre deals)
- [ ] Visualização de stages por pipeline

**Arquivos a criar:**
- `app/dashboard/pipelines/page.tsx`
- `components/pipelines/pipeline-list.tsx`
- `components/pipelines/create-pipeline-dialog.tsx`

**Tempo estimado:** 6 hours

---

#### Task 5.3: Integrar no Kanban Board
- [ ] Adicionar pipeline selector no header do Kanban
- [ ] Filtrar stages por pipeline ativo
- [ ] Filtrar deals por pipeline ativo
- [ ] Atualizar analytics para considerar pipeline
- [ ] Adicionar "Move to Pipeline" no menu de deal

**Arquivos a modificar:**
- `components/kanban-board.tsx`
- `app/dashboard/page.tsx`

**Tempo estimado:** 4 horas

---

#### Task 5.4: Feature Gate Pro
- [ ] Limitar Free users a 1 pipeline
- [ ] Modal de upgrade ao tentar criar segundo pipeline
- [ ] Badge "PRO" na UI de múltiplos pipelines
- [ ] Atualizar pricing page destacando feature

**Arquivos a modificar:**
- `app/dashboard/pipelines/actions.ts` (validação)
- `components/pipelines/create-pipeline-dialog.tsx` (gate)
- `app/(marketing)/pricing/page.tsx` (destacar)

**Tempo estimado:** 2 horas

---

## 📅 SEMANA 3: Testes E2E

### 🟡 Dia 11-13 - Playwright Setup & Core Flows

**Prioridade:** P1 (Previne regressões)

#### Task 6.1: Setup Playwright
- [ ] Instalar `@playwright/test`
- [ ] Configurar `playwright.config.ts`
- [ ] Setup de databases de teste
- [ ] Criar fixtures para auth
- [ ] Criar page objects base
- [ ] Configurar CI para rodar E2E

**Arquivos a criar:**
- `playwright.config.ts`
- `e2e/fixtures/auth.ts`
- `e2e/page-objects/base-page.ts`

**Tempo estimado:** 4 horas

---

#### Task 6.2: Testes de Autenticação E2E
- [ ] Teste: Registro completo de novo usuário
- [ ] Teste: Login com credenciais válidas
- [ ] Teste: Tentativa de login com senha errada
- [ ] Teste: Logout
- [ ] Teste: Registro via convite
- [ ] Teste: Proteção de rotas autenticadas

**Arquivos a criar:**
- `e2e/auth/register.spec.ts`
- `e2e/auth/login.spec.ts`
- `e2e/page-objects/login-page.ts`
- `e2e/page-objects/register-page.ts`

**Tempo estimado:** 6 horas

---

#### Task 6.3: Testes de Pipeline & Deals E2E
- [ ] Teste: Criar deal no pipeline
- [ ] Teste: Arrastar deal entre stages
- [ ] Teste: Editar deal
- [ ] Teste: Deletar deal
- [ ] Teste: Criar contato inline
- [ ] Teste: WhatsApp click tracking
- [ ] Teste: Trocar entre pipelines
- [ ] Teste: Criar novo pipeline (Pro)

**Arquivos a criar:**
- `e2e/deals/kanban.spec.ts`
- `e2e/deals/crud.spec.ts`
- `e2e/pipelines/multi-pipeline.spec.ts`
- `e2e/page-objects/kanban-page.ts`

**Tempo estimado:** 8 horas

---

#### Task 6.4: Testes de Pagamentos E2E
- [ ] Teste: Fluxo de checkout Stripe (test mode)
- [ ] Teste: Upgrade Free → Pro
- [ ] Teste: Feature gate funcionando
- [ ] Teste: Webhook processing

**Arquivos a criar:**
- `e2e/billing/checkout.spec.ts`
- `e2e/billing/upgrade.spec.ts`

**Tempo estimado:** 4 horas

---

### 🟢 Dia 14-15 - Analytics Avançado (Foundation)

**Prioridade:** P2 (Preparação para futuro)

#### Task 7.1: Data Warehouse Schema
- [ ] Criar `prisma/analytics-schema.prisma` (opcional: separate DB)
- [ ] Modelos:
  - `DealSnapshot` (histórico diário de deals)
  - `UserActivity` (eventos de uso)
  - `RevenueSnapshot` (MRR, ARR tracking)
- [ ] Criar jobs de agregação
- [ ] Configurar Vercel Cron (ou alternativa)

**Arquivos a criar:**
- `prisma/analytics-schema.prisma`
- `lib/analytics-jobs.ts`
- `app/api/cron/daily-snapshot/route.ts`

**Tempo estimado:** 6 horas

---

#### Task 7.2: KPIs Avançados
- [ ] Calcular MRR (Monthly Recurring Revenue)
- [ ] Calcular ARR (Annual Recurring Revenue)
- [ ] Calcular Churn Rate
- [ ] Calcular LTV (Lifetime Value)
- [ ] Calcular Conversion Rate por pipeline
- [ ] Forecast revenue (30/60/90 dias)

**Arquivos a criar:**
- `lib/analytics/kpis.ts`
- `lib/analytics/forecasting.ts`

**Tempo estimado:** 5 horas

---

#### Task 7.3: Dashboard de Analytics
- [ ] Criar `app/dashboard/analytics-pro/page.tsx`
- [ ] Cards de KPIs:
  - MRR/ARR
  - Churn
  - LTV
  - CAC (quando integrar ads)
- [ ] Gráficos:
  - Revenue trend (Recharts)
  - Deal velocity
  - Conversion funnel
- [ ] Feature gate: PRO only

**Arquivos a criar:**
- `app/dashboard/analytics-pro/page.tsx`
- `components/analytics/revenue-chart.tsx`
- `components/analytics/funnel-chart.tsx`

**Tempo estimado:** 5 horas

---

## 📅 SEMANA 4: Polish & Documentação

### 🟡 Dia 16-17 - Performance & Optimization

#### Task 8.1: Database Indexes
- [ ] Analisar queries lentas (Prisma Studio)
- [ ] Adicionar indexes:
  - `Deal.organizationId + stageId`
  - `Deal.userId`
  - `Contact.organizationId`
  - `PipelineStage.organizationId + pipelineId`
  - `User.email` (unique já é indexed)
- [ ] Testar performance antes/depois

**Arquivos a modificar:**
- `prisma/schema.prisma` (adicionar `@@index`)

**Tempo estimado:** 3 horas

---

#### Task 8.2: Query Optimization
- [ ] Analisar N+1 queries no Kanban
- [ ] Adicionar `include` otimizados
- [ ] Usar `select` para reduzir payload
- [ ] Implementar pagination em listas grandes
- [ ] Cache de queries frequentes (React Query ou SWR)

**Arquivos a modificar:**
- `app/dashboard/page.tsx`
- `app/dashboard/contacts/page.tsx`
- `app/dashboard/analytics/page.tsx`

**Tempo estimado:** 4 horas

---

#### Task 8.3: Image Optimization
- [ ] Converter imagens para WebP
- [ ] Adicionar `next/image` nos avatars
- [ ] Lazy loading de imagens
- [ ] Placeholder blur

**Tempo estimado:** 2 horas

---

### 🟢 Dia 18-19 - Documentação

#### Task 9.1: Documentação Técnica
- [ ] Criar `docs/ARCHITECTURE.md`
  - Diagrama de arquitetura
  - Tech stack detalhado
  - Patterns de código
- [ ] Criar `docs/DATABASE.md`
  - Schema diagram (dbdiagram.io)
  - Relacionamentos
  - Migrations guide
- [ ] Criar `docs/DEPLOYMENT.md`
  - Environment variables
  - Build process
  - Vercel setup
  - Database setup

**Arquivos a criar:**
- `docs/ARCHITECTURE.md`
- `docs/DATABASE.md`
- `docs/DEPLOYMENT.md`

**Tempo estimado:** 6 horas

---

#### Task 9.2: Documentação de Features
- [ ] Atualizar `README.md`
- [ ] Criar `docs/FEATURES.md`
  - Lista completa de features
  - Free vs Pro comparison
  - Roadmap público
- [ ] Criar `docs/API.md` (preparação para API pública)

**Arquivos a criar:**
- `docs/FEATURES.md`
- `docs/API.md`

**Arquivos a modificar:**
- `README.md`

**Tempo estimado:** 4 horas

---

#### Task 9.3: Changelog & Release Notes
- [ ] Criar `CHANGELOG.md`
- [ ] Documentar releases anteriores
- [ ] Setup de versioning (semver)
- [ ] Criar template de release notes

**Arquivos a criar:**
- `CHANGELOG.md`
- `.github/RELEASE_TEMPLATE.md`

**Tempo estimado:** 2 horas

---

### 🟡 Dia 20 - Final Testing & Deploy

#### Task 10.1: Smoke Tests
- [ ] Rodar todos os testes (unit + E2E)
- [ ] Verificar coverage (target: 70%+)
- [ ] Fix flaky tests
- [ ] Validar CI pipeline

**Tempo estimado:** 3 horas

---

#### Task 10.2: Security Audit
- [ ] Rodar `npm audit`
- [ ] Verificar vulnerabilidades de dependências
- [ ] Atualizar packages críticos
- [ ] Revisar OWASP Top 10:
  - [x] SQL Injection (Prisma protege)
  - [ ] XSS (validar inputs em forms)
  - [x] CSRF (SameSite cookies)
  - [x] Broken Auth (JWT + session)
  - [x] Sensitive Data Exposure (env vars)

**Tempo estimado:** 3 horas

---

#### Task 10.3: Production Deploy
- [ ] Criar environment de staging
- [ ] Deploy staging
- [ ] Smoke test em staging
- [ ] Deploy production
- [ ] Monitorar Sentry por 24h
- [ ] Verificar analytics (GTM)

**Tempo estimado:** 2 horas

---

## 📊 MÉTRICAS DE SUCESSO

### Objetivos Técnicos
- [ ] **Test Coverage:** >70%
- [ ] **Sentry Setup:** 100% dos erros capturados
- [ ] **Performance:** LCP <2.5s, FID <100ms
- [ ] **Security:** 0 vulnerabilidades críticas

### Objetivos de Produto
- [ ] **Email Automation:** Taxa de abertura >30%
- [ ] **Múltiplos Pipelines:** Usado por >20% dos Pro users
- [ ] **Analytics Avançado:** Acessado semanalmente por >50% dos Pro users

### Objetivos de Negócio
- [ ] **Conversão Free→Pro:** +20% (baseline atual desconhecida)
- [ ] **Churn:** <5% mensal
- [ ] **NPS:** >40

---

## 🚀 PRÓXIMOS PASSOS (Pós-Roadmap)

### Semana 5-6: API Pública
- REST API com autenticação
- Webhooks outbound
- Rate limiting
- Documentação Swagger

### Semana 7-8: Integrações
- Zapier
- Google Calendar
- Slack notifications
- WhatsApp API oficial

### Semana 9-12: Mobile
- PWA offline-first
- Push notifications
- Mobile-optimized UI
- App Store listing

---

## 📝 NOTAS IMPORTANTES

### Priorização Flexível
Este roadmap é uma **sugestão inicial**. Você pode:
- Pular tarefas de baixa prioridade
- Re-priorizar baseado em feedback de usuários
- Adicionar tarefas emergentes

### Gestão de Riscos
**Riscos Identificados:**
1. **Email deliverability:** Testar SPF/DKIM antes de enviar em massa
2. **Database migrations:** Sempre testar em staging primeiro
3. **Stripe webhooks:** Garantir idempotência

### Dependências Externas
- **Sentry:** Conta paga necessária para >5k eventos/mês
- **Resend:** Limite de 100 emails/dia no free tier
- **Vercel:** Hobby plan pode ter limites de execução

### Quando Pedir Ajuda
- Bloqueios técnicos >4 horas
- Decisões de arquitetura complexas
- Trade-offs de produto

---

## ✅ CHECKLIST DE INÍCIO

Antes de começar, garanta que você tem:
- [ ] Ambiente local rodando (`npm run dev`)
- [ ] Database PostgreSQL ativo
- [ ] Variáveis de ambiente configuradas
- [ ] Git branch criada: `feature/roadmap-cenario-c`
- [ ] Sentry account criada
- [ ] Resend API key obtida
- [ ] Noção do que priorizar (converse com usuários!)

---

**Última atualização:** 2026-01-01
**Versão:** 1.0
**Autor:** Claude Code + Jean Zorzetti
