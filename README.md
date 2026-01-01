# 🌟 Sirius CRM

**O CRM mais intuitivo do mercado brasileiro.** Pipeline visual, WhatsApp com 1 clique, e métricas que brilham.

---

## 📋 Pré-requisitos

- **Node.js** 18+
- **PostgreSQL** 14+
- **npm** ou **yarn**

---

## 🚀 Setup Inicial

### 1. Clone o repositório

```bash
git clone https://github.com/ROI-Labs/sirius-crm.git
cd sirius-crm
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Edite `.env.local` e preencha **TODAS** as variáveis obrigatórias:

#### 🔒 Segurança (OBRIGATÓRIO)

```bash
# Gere uma string aleatória segura:
openssl rand -base64 32

SESSION_SECRET="cole-a-string-gerada-aqui"
NEXTAUTH_SECRET="cole-outra-string-diferente-aqui"
```

#### 🗄️ Database

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/sirius_crm"
```

#### 💳 Stripe

1. Crie uma conta em [stripe.com](https://stripe.com)
2. Acesse [Dashboard > API Keys](https://dashboard.stripe.com/apikeys)
3. Copie as chaves:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
```

4. Configure o webhook:
   - Acesse [Webhooks](https://dashboard.stripe.com/webhooks)
   - Adicione endpoint: `https://seu-dominio.com/api/webhooks/stripe`
   - Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copie o Signing Secret:

```bash
STRIPE_WEBHOOK_SECRET="whsec_..."
```

#### 📧 Email (Opcional - para automações)

1. Crie conta em [resend.com](https://resend.com)
2. Crie API key:

```bash
RESEND_API_KEY="re_..."
```

#### 📊 Sentry (Opcional - recomendado para produção)

1. Crie conta em [sentry.io](https://sentry.io)
2. Crie novo projeto Next.js
3. Configure:

```bash
NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
SENTRY_ORG="seu-org-slug"
SENTRY_PROJECT="sirius-crm"
SENTRY_AUTH_TOKEN="..." # Para upload de source maps
```

#### 🌐 App Configuration

```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Em produção: https://seu-dominio.com
NEXTAUTH_URL="http://localhost:3000"         # Mesma URL acima
```

### 4. Configure o banco de dados

```bash
# Inicie o PostgreSQL (Docker Compose)
docker-compose up -d

# Rode as migrations
npx prisma migrate deploy

# (Opcional) Seed de dados de exemplo
npx prisma db seed
```

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Inicia servidor de produção |
| `npm run lint` | Roda o linter |
| `npx prisma studio` | Abre interface visual do banco |
| `npx prisma migrate dev` | Cria nova migration |
| `npx prisma generate` | Gera Prisma Client |

---

## 📦 Estrutura do Projeto

```
sirius-crm/
├── app/                    # Next.js App Router
│   ├── (marketing)/       # Páginas públicas (landing, pricing)
│   ├── dashboard/         # Área logada (CRM)
│   ├── api/               # API routes
│   └── auth/              # Autenticação
├── components/            # Componentes React
│   ├── ui/               # Componentes base (Shadcn)
│   ├── deals/            # Componentes de deals
│   ├── contacts/         # Componentes de contatos
│   └── analytics/        # Trackers de eventos
├── lib/                   # Utilitários
│   ├── auth.ts           # JWT/Sessions
│   ├── stripe.ts         # Stripe client
│   ├── prisma.ts         # Database client
│   ├── logger.ts         # Structured logging
│   └── analytics.ts      # GTM events
├── prisma/                # Database schema
│   └── schema.prisma
├── docs/                  # Documentação
└── roadmaps/             # Roadmaps de desenvolvimento
```

---

## 🔐 Segurança

**⚠️ IMPORTANTE:**
- **NUNCA** comite `.env.local` no git
- **SEMPRE** use strings aleatórias para secrets
- **SEMPRE** rode `npm audit` antes de deploy
- **SEMPRE** use HTTPS em produção

### Gerar Secrets Seguros

```bash
# macOS/Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🚀 Deploy em Produção

### Vercel (Recomendado)

1. Conecte seu repositório no [Vercel](https://vercel.com)
2. Adicione todas as environment variables
3. Deploy automático!

### Outras Plataformas

- **Railway**: Suporte nativo a PostgreSQL
- **Render**: Free tier disponível
- **DigitalOcean App Platform**: $5/mês

**Checklist de Deploy:**
- [ ] Todas as env vars configuradas
- [ ] Database provisionado
- [ ] Stripe webhooks apontando para produção
- [ ] Sentry configurado
- [ ] DNS configurado
- [ ] SSL/HTTPS habilitado

---

## 📚 Documentação

- [Arquitetura](docs/ARCHITECTURE.md)
- [Database Schema](docs/DATABASE.md)
- [GTM Setup](docs/GTM-EVENTS-SETUP.md)
- [Conversions Optimizations](docs/CONVERSION-OPTIMIZATIONS.md)
- [Roadmap Cenário C](roadmaps/ROADMAP-CENARIO-C.md)

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/MinhaFeature`
3. Commit: `git commit -m 'feat: Minha nova feature'`
4. Push: `git push origin feature/MinhaFeature`
5. Abra um Pull Request

---

## 📝 Licença

Propriedade de **ROI Labs**. Todos os direitos reservados.

---

## 🆘 Suporte

- **Email:** suporte@roilabs.com.br
- **Documentação:** [docs.sirius.roilabs.com.br](https://docs.sirius.roilabs.com.br)
- **Issues:** [GitHub Issues](https://github.com/ROI-Labs/sirius-crm/issues)

---

**Desenvolvido com ❤️ pela equipe ROI Labs**
