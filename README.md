# 🌟 Sirius CRM

<div align="center">

**O CRM mais intuitivo para PMEs brasileiras**

Pipeline visual, automações inteligentes, e analytics que realmente ajudam a vender.

[Demo](https://siriuscrm.com.br) · [Documentação](docs/) · [Roadmap](roadmaps/ROADMAP-CENARIO-C.md) · [Reportar Bug](https://github.com/JeanZorzetti/sirius/issues)

[![CI](https://github.com/JeanZorzetti/sirius/actions/workflows/ci.yml/badge.svg)](https://github.com/JeanZorzetti/sirius/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.19-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red)]()

</div>

---

## 📖 Sobre o Sirius CRM

Sirius CRM é uma plataforma SaaS moderna de gestão de vendas, construída especificamente para pequenas e médias empresas brasileiras. Com foco em simplicidade e eficiência, oferecemos:

- 🎯 **Kanban Visual** - Arraste e solte deals entre etapas
- 📊 **Analytics Avançado** - KPIs, forecasts e métricas em tempo real
- 📧 **Email Automation** - Automações inteligentes por etapa do pipeline
- 💰 **Multi-Pipeline** - Diferentes fluxos de venda na mesma conta
- 👥 **Gestão de Equipe** - Controle de permissões e visibilidade
- 🚀 **Performance** - Otimizado para orgs com milhares de deals

### ✨ Features Principais

| Feature | FREE | PRO |
|---------|:----:|:---:|
| Deals ilimitados | ✅ | ✅ |
| 1 Pipeline | ✅ | ✅ |
| Contatos ilimitados | ✅ | ✅ |
| Kanban board | ✅ | ✅ |
| Analytics básico | ✅ | ✅ |
| **Pipelines ilimitados** | ❌ | ✅ |
| **Analytics PRO** | ❌ | ✅ |
| **Email automations** | ❌ | ✅ |
| **Time permissions** | ❌ | ✅ |
| **Priority support** | ❌ | ✅ |

[Ver comparação completa →](docs/FEATURES.md)

---

## 🚀 Quick Start

### Pré-requisitos

- Node.js 20+
- PostgreSQL 15+
- npm ou yarn

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/JeanZorzetti/sirius.git
cd sirius

# 2. Instale dependências
npm install

# 3. Configure environment variables
cp .env.example .env
# Edite .env com suas credenciais

# 4. Setup database
npx prisma migrate deploy
npx prisma generate

# 5. Inicie o servidor
npm run dev
```

Acesse http://localhost:3000

### Deploy em 1 Clique

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/JeanZorzetti/sirius)

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** Next.js 16.1 (App Router, React Server Components)
- **UI:** React 19 + TypeScript 5
- **Styling:** Tailwind CSS 3.4 + shadcn/ui
- **Charts:** Recharts 3.6
- **DnD:** @dnd-kit

### **Backend**
- **Runtime:** Node.js 20+
- **ORM:** Prisma 5.19
- **Database:** PostgreSQL 15+
- **Auth:** NextAuth.js (Auth.js v5)

### **Infrastructure**
- **Hosting:** Vercel Edge Network
- **Database:** Neon / Vercel Postgres
- **Monitoring:** Sentry.io
- **Emails:** Resend
- **Payments:** Stripe

[Ver arquitetura completa →](docs/ARCHITECTURE.md)

---

## 📁 Estrutura do Projeto

```
sirius-crm/
├── app/                    # Next.js App Router
│   ├── (marketing)/       # Landing pages (SSG)
│   ├── dashboard/         # Authenticated app (SSR)
│   ├── admin/             # Admin dashboard (ADMIN role)
│   └── api/               # API routes & webhooks
├── components/            # React components
│   ├── ui/               # Base components (shadcn)
│   ├── dashboard/        # Dashboard components
│   ├── analytics/        # Charts & KPI cards
│   └── contacts/         # Contact management
├── lib/                   # Utilities & configs
│   ├── prisma.ts         # Database client
│   ├── auth.ts           # NextAuth config
│   ├── stripe.ts         # Stripe client
│   ├── logger.ts         # Pino logger
│   └── analytics/        # KPI calculations
├── prisma/               # Database
│   ├── schema.prisma     # Schema definition
│   └── migrations/       # Migration history
├── docs/                 # Documentation
│   ├── ARCHITECTURE.md   # System architecture
│   ├── DATABASE.md       # Database schema
│   ├── DEPLOYMENT.md     # Deploy guide
│   ├── FEATURES.md       # Feature list
│   └── API.md            # API reference
└── tests/                # E2E tests (Playwright)
```

---

## 🔐 Environment Variables

Crie um arquivo `.env` com as seguintes variáveis:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_PRICE_ID="price_..."

# Resend (Email)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# Sentry (Monitoring)
SENTRY_DSN="https://...@sentry.io/..."
SENTRY_ORG="your-org"
SENTRY_PROJECT="sirius-crm"
SENTRY_AUTH_TOKEN="sntrys_..."
```

[Guia completo de environment variables →](docs/DEPLOYMENT.md#environment-variables)

---

## 📊 Database Schema

O Sirius CRM utiliza PostgreSQL com 15 modelos principais:

- **Core:** Organization, User, Contact, Pipeline, PipelineStage, Deal
- **Enhancements:** Note, Tag, Activity
- **Auth:** Invite
- **Email:** EmailAutomationSetting, EmailLog
- **Analytics:** DealSnapshot, UserActivity, RevenueSnapshot

[Ver schema completo →](docs/DATABASE.md)

---

## 🎯 Roadmap

### ✅ Concluído (v1.0)

- [x] Autenticação e multi-tenancy
- [x] Kanban board com drag & drop
- [x] Multi-pipeline
- [x] Gestão de contatos
- [x] Dashboard analytics
- [x] Admin dashboard
- [x] Email automations
- [x] Stripe integration (billing)
- [x] Performance optimizations (indexes, query optimization, image optimization)
- [x] Monitoring (Sentry)
- [x] Documentação completa

### 🚧 Em Desenvolvimento (v1.1)

- [ ] Testes E2E completos (Playwright)
- [ ] API pública REST
- [ ] Webhooks customizados
- [ ] Integrações (WhatsApp, Google Calendar)

### 🔮 Planejado (v2.0)

- [ ] Mobile app (React Native)
- [ ] IA para previsão de vendas
- [ ] Advanced reporting
- [ ] White-label solution

[Roadmap completo →](roadmaps/ROADMAP-CENARIO-C.md)

---

## 🧪 Testing

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/deals-crud.spec.ts
```

**Coverage:**
- E2E Tests: Playwright (auth, deals, pipelines)
- Unit Tests: Planejado (Vitest)
- Integration Tests: Planejado

---

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitetura, tech stack, patterns |
| [DATABASE.md](docs/DATABASE.md) | Schema, relationships, migrations |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploy guide, env vars, CI/CD |
| [FEATURES.md](docs/FEATURES.md) | Feature list (FREE vs PRO) |
| [API.md](docs/API.md) | API reference (em desenvolvimento) |

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, siga estas etapas:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'feat: Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Commit Convention

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
perf: Performance improvement
test: Add tests
chore: Update dependencies
```

---

## 📈 Performance

### Otimizações Implementadas

- ✅ **Database indexes** (4 strategic indexes)
- ✅ **Query optimization** (60-90% payload reduction)
- ✅ **Image optimization** (WebP/AVIF, lazy loading)
- ✅ **Server Components** (reduced client JS)
- ✅ **Edge Network** (global CDN)

### Metrics

| Metric | Target | Current |
|--------|:------:|:-------:|
| LCP | < 2.5s | ✅ |
| FID | < 100ms | ✅ |
| CLS | < 0.1 | ✅ |
| TTI | < 3.5s | ✅ |

---

## 🔒 Segurança

### Medidas Implementadas

- ✅ SQL Injection: Prisma ORM (prepared statements)
- ✅ XSS: React auto-escaping + sanitization
- ✅ CSRF: SameSite cookies + token validation
- ✅ Auth: Database sessions (não JWT)
- ✅ Password hashing: bcrypt
- ✅ Row-level security: organizationId filtering
- ✅ RBAC: Role-based + Organization role
- ✅ Secrets: Environment variables (nunca hardcoded)
- ✅ HTTPS: SSL/TLS em produção
- ✅ Rate limiting: Vercel edge
- ✅ Monitoring: Sentry error tracking

### Reportar Vulnerabilidade

Se você descobrir uma vulnerabilidade de segurança, por favor **NÃO** abra uma issue pública.
Envie um email para: seguranca@roilabs.com.br

---

## 📝 Licença

Propriedade de **ROI Labs**. Todos os direitos reservados.

Este software é proprietário e confidencial. Uso não autorizado é estritamente proibido.

---

## 🆘 Suporte

- **Email:** suporte@roilabs.com.br
- **Documentação:** [docs/](docs/)
- **Issues:** [GitHub Issues](https://github.com/JeanZorzetti/sirius/issues)
- **Discord:** Em breve

---

## 👥 Time

**Desenvolvido com ❤️ pela equipe ROI Labs**

- **Lead Developer:** Jean Zorzetti
- **Product Owner:** ROI Labs
- **Contributors:** [Ver todos](https://github.com/JeanZorzetti/sirius/graphs/contributors)

---

## 🙏 Agradecimentos

- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://www.prisma.io/) - Type-safe ORM
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Vercel](https://vercel.com/) - Hosting platform
- [Stripe](https://stripe.com/) - Payment processing
- [Sentry](https://sentry.io/) - Error tracking

---

<div align="center">

**[⬆ Voltar ao topo](#-sirius-crm)**

Made with ⚡ by [ROI Labs](https://roilabs.com.br)

</div>
