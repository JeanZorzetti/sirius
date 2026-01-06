# 🚀 Deployment - Sirius CRM

## Visão Geral

Este guia cobre o processo completo de deployment do Sirius CRM, desde a configuração local até produção na Vercel.

## 📋 Pré-requisitos

- Node.js 20+ instalado
- npm ou yarn
- Conta GitHub
- Conta Vercel
- Conta no provedor de banco PostgreSQL (Neon, Vercel Postgres, etc.)
- Contas nos serviços externos (Stripe, Resend, Sentry)

## 🔧 Setup Local

### **1. Clone o Repositório**

```bash
git clone https://github.com/JeanZorzetti/sirius.git
cd sirius
```

### **2. Instale Dependências**

```bash
npm install
```

### **3. Configure Environment Variables**

Crie um arquivo `.env` na raiz do projeto:

```bash
cp .env.example .env
```

Edite `.env` com suas credenciais (veja seção [Environment Variables](#environment-variables) abaixo).

### **4. Setup do Banco de Dados**

```bash
# Gerar Prisma Client
npx prisma generate

# Rodar migrations
npx prisma migrate deploy

# (Opcional) Seed inicial
npx prisma db seed
```

### **5. Rodar em Desenvolvimento**

```bash
npm run dev
```

Acesse http://localhost:3000

## 🔐 Environment Variables

### **Arquivo `.env.example`**

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-generate-with-openssl-rand-base64-32"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_PRICE_ID="price_..."

# Resend (Email)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@sirius.roilabs.com.br"

# Sentry (Monitoring)
SENTRY_DSN="https://...@sentry.io/..."
SENTRY_ORG="roi-labs"
SENTRY_PROJECT="sirius-crm"
SENTRY_AUTH_TOKEN="sntrys_..."

# Environment
NODE_ENV="development" # development | production
```

### **Variáveis Obrigatórias**

#### **DATABASE_URL**
Connection string do PostgreSQL.

**Formato:**
```
postgresql://[user]:[password]@[host]:[port]/[database]?schema=public
```

**Providers:**
- **Neon:** https://neon.tech (recomendado)
- **Vercel Postgres:** https://vercel.com/storage/postgres
- **Railway:** https://railway.app
- **Supabase:** https://supabase.com

**Exemplo (Neon):**
```
DATABASE_URL="postgresql://user:password@ep-example-123.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

#### **NEXTAUTH_URL**
URL pública da aplicação.

**Development:**
```
NEXTAUTH_URL="http://localhost:3000"
```

**Production:**
```
NEXTAUTH_URL="https://sirius.roilabs.com.br"
```

#### **NEXTAUTH_SECRET**
Secret aleatório para criptografia de sessões.

**Gerar:**
```bash
openssl rand -base64 32
```

**Exemplo:**
```
NEXTAUTH_SECRET="kJ8N7mP3qR5tV9wX2yZ4aB6cD8eF0gH1iJ3kL5mN7oP"
```

#### **STRIPE_SECRET_KEY**
API key do Stripe (secret).

**Obter:**
1. Acesse https://dashboard.stripe.com/apikeys
2. Copie "Secret key"

**Test mode:**
```
STRIPE_SECRET_KEY="sk_test_..."
```

**Live mode:**
```
STRIPE_SECRET_KEY="sk_live_..."
```

#### **STRIPE_PUBLISHABLE_KEY**
API key do Stripe (public).

```
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

#### **STRIPE_WEBHOOK_SECRET**
Secret para validar webhooks do Stripe.

**Obter:**
1. Dashboard Stripe → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copie "Signing secret"

```
STRIPE_WEBHOOK_SECRET="whsec_..."
```

#### **STRIPE_PRO_PRICE_ID**
ID do preço do plano PRO no Stripe.

**Obter:**
1. Dashboard Stripe → Products
2. Criar produto "Sirius CRM PRO"
3. Preço: R$ 97/mês (ou seu valor)
4. Copie "Price ID"

```
STRIPE_PRO_PRICE_ID="price_1234..."
```

#### **RESEND_API_KEY**
API key do Resend para envio de emails.

**Obter:**
1. https://resend.com/api-keys
2. Create API key

```
RESEND_API_KEY="re_..."
```

#### **RESEND_FROM_EMAIL**
Email remetente (deve estar verificado no Resend).

```
RESEND_FROM_EMAIL="noreply@sirius.roilabs.com.br"
```

**Setup de domínio:**
1. Resend → Domains → Add domain
2. Adicionar registros DNS (MX, TXT, CNAME)
3. Aguardar verificação

#### **SENTRY_DSN**
URL do projeto Sentry para error tracking.

**Obter:**
1. https://sentry.io
2. Create project (Next.js)
3. Copie DSN

```
SENTRY_DSN="https://abc123@o123.ingest.sentry.io/456"
```

#### **SENTRY_AUTH_TOKEN**
Token para upload de source maps.

**Obter:**
1. Sentry → Settings → Auth Tokens
2. Create new token
3. Scopes: `project:releases`, `project:write`

```
SENTRY_AUTH_TOKEN="sntrys_..."
```

### **Variáveis Opcionais**

#### **NODE_ENV**
Ambiente de execução.

```
NODE_ENV="development"  # Development
NODE_ENV="production"   # Production
```

Auto-configurado pela Vercel em produção.

## 🏗️ Build Process

### **Local Build**

```bash
npm run build
```

**Steps:**
1. Prisma migrate deploy (aplica migrations)
2. Prisma generate (gera client)
3. Next.js build (compila app)
4. TypeScript check (valida tipos)
5. Sentry upload (source maps)

### **Build Output**

```
.next/
├── cache/              # Build cache
├── server/             # Server bundles
│   ├── app/            # App routes
│   ├── pages/          # API routes
│   └── chunks/         # Shared chunks
└── static/             # Static assets
    ├── chunks/         # Client bundles
    └── media/          # Images, fonts
```

### **Production Checks**

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build

# Run production server locally
npm start
```

## ☁️ Vercel Deployment

### **1. Conectar Repositório**

1. Acesse https://vercel.com/new
2. Import Git Repository
3. Selecione o repositório do Sirius CRM
4. Configure o projeto

### **2. Configurar Framework Preset**

- **Framework Preset:** Next.js
- **Root Directory:** `./` (raiz)
- **Build Command:** `npm run build` (default)
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install` (default)

### **3. Environment Variables**

Adicione todas as variáveis de ambiente listadas acima:

```
Settings → Environment Variables
```

**Importante:**
- Use valores de **production** (não test)
- Marque variáveis sensíveis como "Sensitive"
- Configure para todos os environments (Production, Preview, Development)

### **4. Deploy**

Clique em "Deploy" e aguarde.

**Processo:**
1. Clone do repositório
2. Install dependencies
3. Run migrations (`npx prisma migrate deploy`)
4. Build application
5. Deploy to Edge Network
6. Health checks
7. Traffic switch

### **5. Domínio Customizado**

```
Settings → Domains → Add Domain
```

1. Adicione `sirius.roilabs.com.br`
2. Configure DNS:
   - **A Record:** `76.76.21.21` (Vercel IP)
   - **CNAME:** `cname.vercel-dns.com`
3. Aguarde propagação (até 48h)
4. SSL automático (Let's Encrypt)

### **6. Configurações Recomendadas**

#### **General**
- **Node.js Version:** 20.x
- **Build & Development Settings:**
  - Override: `npm run build`
- **Auto Deploy:** Enabled (main branch)

#### **Git**
- **Production Branch:** `main`
- **Deploy Previews:** Enabled (all branches)
- **Comments:** Enabled (GitHub)

#### **Security**
- **Environment Variable Encryption:** Enabled
- **HTTPS Only:** Enabled
- **HSTS:** Enabled

#### **Performance**
- **Edge Network:** Enabled (default)
- **Image Optimization:** Enabled (default)
- **Automatic GZIP:** Enabled (default)

## 🗄️ Database Setup

### **Neon PostgreSQL (Recomendado)**

#### **1. Criar Projeto**

1. Acesse https://neon.tech
2. Create new project
3. Nome: "Sirius CRM Production"
4. Region: US East (Ohio) ou mais próximo
5. PostgreSQL version: 15

#### **2. Obter Connection String**

```
Dashboard → Connection Details → Connection string
```

Copie a URL e adicione nas env vars da Vercel.

#### **3. Rodar Migrations**

Migrations rodam automaticamente no build da Vercel:

```bash
npm run build
  ↓
npx prisma migrate deploy
```

**Verificar migrations:**
```bash
npx prisma migrate status --schema=./prisma/schema.prisma
```

#### **4. Configurações Recomendadas**

- **Connection Pooling:** Enabled (Neon gerencia automaticamente)
- **Autosuspend:** Disabled (para produção)
- **Compute Size:** Shared (Free tier) ou dedicado

### **Backups**

#### **Neon:**
- Backups automáticos diários
- Point-in-time recovery (até 7 dias)
- Snapshots manuais via dashboard

#### **Manual Backup:**
```bash
# Dump database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20240115.sql
```

## 🔄 CI/CD Pipeline

### **Workflow Automático**

```
Git Push → main
    ↓
Vercel detecta mudanças
    ↓
1. Clone repositório
2. Install dependencies
3. Run migrations
4. Build application
5. Run tests (se configurado)
6. Deploy to preview
    ↓
Checks pass?
    ↓
Deploy to production (zero-downtime)
    ↓
Health checks
    ↓
Traffic switch
    ↓
Notify (Slack, email, etc.)
```

### **Preview Deployments**

Cada branch/PR gera um preview deployment:

```
https://sirius-git-feature-x-roilabs.vercel.app
```

**Benefícios:**
- Testar features antes de merge
- Validar mudanças visualmente
- QA em ambiente isolado

### **Rollback**

```
Vercel Dashboard → Deployments → Redeploy anterior
```

Rollback instantâneo para qualquer deployment anterior.

## 📊 Monitoring & Logs

### **Vercel Dashboard**

- **Analytics:** Traffic, performance, errors
- **Logs:** Real-time logs de todas as funções
- **Speed Insights:** Core Web Vitals

### **Sentry**

- **Error Tracking:** Stack traces completos
- **Performance Monitoring:** Transaction traces
- **Alerts:** Email/Slack quando erros ocorrem

**Dashboard:** https://sentry.io/organizations/roi-labs/issues/

### **Database Monitoring**

- **Neon Dashboard:** Query performance, connections
- **Prisma Studio:** Explorar dados (development)

```bash
npx prisma studio
```

## 🔒 Security Checklist

### **Pre-Deploy**

- [ ] Todas env vars configuradas
- [ ] Secrets não commitados no código
- [ ] NEXTAUTH_SECRET aleatório e seguro
- [ ] DATABASE_URL com SSL (`?sslmode=require`)
- [ ] Stripe keys de production (não test)
- [ ] Webhook secrets configurados

### **Post-Deploy**

- [ ] HTTPS funcionando
- [ ] Domínio customizado configurado
- [ ] SSL certificate válido
- [ ] Stripe webhooks recebendo eventos
- [ ] Emails sendo enviados (Resend)
- [ ] Sentry capturando erros
- [ ] Login/Register funcionando
- [ ] Payments funcionando (teste com cartão de teste)

### **Ongoing**

- [ ] Monitorar logs diariamente
- [ ] Revisar Sentry errors semanalmente
- [ ] Backups automáticos configurados
- [ ] Updates de dependências mensais
- [ ] Security audits trimestrais

## 🧪 Testing em Produção

### **Smoke Tests**

```bash
# Health check
curl https://sirius.roilabs.com.br/api/health

# Auth flow
1. Registrar novo usuário
2. Confirmar email
3. Login
4. Criar deal
5. Logout

# Payment flow
1. Login com user FREE
2. Ir para /dashboard/billing
3. Clicar "Upgrade para PRO"
4. Usar cartão teste: 4242 4242 4242 4242
5. Verificar assinatura ativa
```

### **Cartões de Teste Stripe**

```
Sucesso:    4242 4242 4242 4242
Decline:    4000 0000 0000 0002
3D Secure:  4000 0027 6000 3184

CVV: qualquer 3 dígitos
Data: qualquer data futura
```

## 📈 Scaling

### **Vercel Edge Network**

- Auto-scaling automático
- Sem limites de concorrência
- Global CDN

### **Database**

**Neon:**
- Scale automático de compute
- Connection pooling gerenciado
- Read replicas (planos pagos)

**Otimizações:**
- Indexes já implementados (ver [DATABASE.md](DATABASE.md))
- Query optimization em todas as páginas
- Caching de Server Components

### **Limites Vercel (Pro Plan)**

- **Bandwidth:** 1 TB/mês
- **Function Executions:** Ilimitado
- **Build Minutes:** Ilimitado
- **Team Members:** Ilimitado

## 🆘 Troubleshooting

### **Build Fails**

```bash
# Check logs
Vercel Dashboard → Deployments → Failed deployment → Logs

# Common issues:
# 1. Missing env vars → Add in Settings
# 2. TypeScript errors → Fix and push
# 3. Database connection → Check DATABASE_URL
# 4. Migration errors → Check schema.prisma
```

### **Runtime Errors**

```bash
# Check Sentry
https://sentry.io → Issues

# Check Vercel logs
Dashboard → Functions → Select function → Logs

# Common issues:
# 1. Database timeout → Check Neon connection
# 2. Auth errors → Check NEXTAUTH_SECRET
# 3. Stripe errors → Check webhook secret
```

### **Slow Performance**

```bash
# Vercel Speed Insights
Dashboard → Analytics → Speed Insights

# Common fixes:
# 1. Add database indexes
# 2. Optimize images
# 3. Use Server Components
# 4. Reduce client JS
```

## 📚 Referências

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Neon PostgreSQL](https://neon.tech/docs)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Resend Setup](https://resend.com/docs/send-with-nextjs)

## 🤝 Suporte

- **Email:** suporte@roilabs.com.br
- **GitHub Issues:** https://github.com/JeanZorzetti/sirius/issues
- **Docs:** https://github.com/JeanZorzetti/sirius/tree/main/docs
