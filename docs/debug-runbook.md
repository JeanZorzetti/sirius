# Debug Runbook — Sirius CRM

Use este runbook com a skill `/debug [sintoma]`. Seguir as etapas em ordem. Parar ao encontrar o problema.

---

## Env Vars críticas (checar primeiro)

| Variável | Gotcha conhecido |
|----------|-----------------|
| `DATABASE_URL` | Deve usar IP direto `31.97.23.166:5499` — Cloudflare bloqueia o domínio nessa porta |
| `SESSION_SECRET` / `NEXTAUTH_SECRET` | Se alterados em produção, todas as sessões ativas invalidam |
| `NEXTAUTH_URL` | Deve ser a URL pública em produção (ex: `https://crm.roilabs.com.br`) — URL errada quebra OAuth redirect |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Checar se o domínio de produção está na lista de redirect URIs no Google Console |
| `MERCADO_PAGO_ACCESS_TOKEN` | Começa com `APP_USR-` — checar se não foi truncado |
| `RESEND_API_KEY` | Começa com `re_` |
| `CRON_SECRET` | Necessário para rotas `/api/cron/*` — se ausente, crons falham com 401 |
| `UPSTASH_REDIS_REST_URL` | Se ausente ou errado, rate limiting das rotas públicas falha |

**Checar no painel do Vercel → Settings → Environment Variables.**

---

## Endpoints críticos para health check

```bash
# Health
curl -s https://crm.roilabs.com.br/api/health

# Auth (deve redirecionar, não 500)
curl -s -o /dev/null -w "%{http_code}" https://crm.roilabs.com.br/api/auth/session

# Leads (autenticado — deve retornar 401 sem token, não 500)
curl -s -o /dev/null -w "%{http_code}" https://crm.roilabs.com.br/api/leads

# Analytics
curl -s -o /dev/null -w "%{http_code}" https://crm.roilabs.com.br/api/analytics
```

---

## Sequência de diagnóstico

### Etapa 1 — Env vars
- Ler vars acima e checar gotchas da tabela
- **Atenção especial**: `DATABASE_URL` com domínio em vez de IP `31.97.23.166:5499` é o bug mais frequente
- **Se env var errada: corrigir no Vercel → redeploy → parar aqui**

### Etapa 2 — Banco de dados
```bash
npx prisma migrate status          # Ver migrations pendentes
```
- Se migration pendente: `npx prisma migrate deploy`
- **NUNCA usar `prisma db execute` manual** — sempre via migration formal
- **Se schema diverge: rodar migration → parar aqui**

### Etapa 3 — Commits recentes
```bash
git log --oneline -10
git show <hash>   # Checar o diff do commit suspeito
```

### Etapa 4 — Padrões de bug recorrentes

**Bug: params não resolvido em route handlers**
```ts
// Next.js 15 — params são Promise:
const { slug } = await params  // CORRETO
const { slug } = params        // ERRADO — causa erro de build
```

**Bug: INSUFFICIENT_PATH em deploy**
- Geralmente causado por rota dinâmica com `params` não resolvido (ver acima)
- Ou arquivo de rota em pasta errada

**Bug: useSearchParams sem Suspense**
```tsx
// Client components com useSearchParams DEVEM ter Suspense pai:
<Suspense fallback={...}>
  <ComponentWithSearchParams />
</Suspense>
```

**Bug: auth retorna null**
```ts
// Padrão correto:
const session = await getSession()
if (!session?.user?.email) return // não autenticado
const user = await prisma.user.findUnique({ where: { email: session.user.email } })
```

**Bug: Decimal do Prisma em JSON**
```ts
// Converter antes de serializar:
Number(deal.value)  // CORRETO
deal.value          // Decimal não é JSON-serializable diretamente
```

### Etapa 5 — Propor fix
Só aqui, após descartar etapas 1-4, propor correção de código com nível de confiança.

---

## Estrutura de rotas API (para referência rápida)

```
/api/auth/*          → NextAuth (login, session, OAuth)
/api/leads/*         → Gestão de leads/contatos
/api/deals/*         → Pipeline/kanban
/api/analytics/*     → Métricas e relatórios
/api/contacts/*      → Base de contatos
/api/automations/*   → Automações e workflows
/api/billing/*       → Planos e pagamentos (Mercado Pago)
/api/webhooks/*      → Eventos externos
/api/cron/*          → Jobs agendados (requer CRON_SECRET)
/api/admin/*         → Painel administrativo
/api/ads/*           → Integração Facebook Ads
```
