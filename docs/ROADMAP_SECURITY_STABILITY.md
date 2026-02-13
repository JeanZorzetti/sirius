# Roadmap: Security & Stability Round

> Auditoria realizada em 13/02/2026. Pontos organizados por prioridade.

---

## CRITICO

### 1. [x] Trocar `new PrismaClient()` pelo singleton em 5 arquivos app/lib
- **Impacto:** Memory leak, esgotamento de conexões em dev/prod
- **Fix:** Substituir por `import { prisma } from '@/lib/prisma'`

### 2. [x] Adicionar auth check em 15 API routes desprotegidas (AGI/NLP/Graph)
- **Impacto:** Acesso não autorizado a dados sensíveis (AGI, analytics, NLP, graph, A/B testing)
- **Fix:** Adicionar `getSession()` check no início de cada route

### 3. [x] Remover exposição da Evolution API key no webhook
- **Impacto:** Key parcial exposta no response de erro
- **Arquivo:** `app/api/webhooks/evolution/route.ts`

### 4. [x] Fixar fallback user hardcoded no dashboard layout
- **Impacto:** Usuário não autenticado acessa dashboard com dados fake
- **Arquivo:** `app/dashboard/layout.tsx`

### 5. [x] Criar error boundaries globais
- **Impacto:** Erros de runtime mostram tela padrão do Next.js
- **Criar:** `app/error.tsx` + `app/global-error.tsx`

---

## ALTO

### 6. [x] Adicionar metadata (title) em 20 páginas do dashboard
- **Impacto:** Títulos das abas faltando, SEO interno

### 7. [x] Substituir 109 console.log/error/warn por logger em 69 arquivos
- **Impacto:** Info disclosure no browser, poluição de logs
- **Usar:** `lib/logger.ts`

### 8. [x] Adicionar loading states (Suspense/skeleton) nas páginas lentas
- **Impacto:** UX ruim em analytics, settings, pipeline
- **Páginas:** analytics, analytics-pro, settings/*, pipelines

### 9. [x] Aplicar rate limiting nas APIs públicas
- **Impacto:** DDoS, esgotamento de créditos Groq/API
- **Usar:** `lib/ratelimit.ts` (já existe, não é importado)

---

## MEDIO

### 10. [x] Melhorar responsividade mobile do dashboard
- **Impacto:** Kanban, tabelas e charts quebram em tela pequena
- **Prioridade:** Kanban > Analytics > Settings

### 11. [x] Completar integração WhatsApp (upload mídia + templates)
- **Impacto:** Feature incompleta para usuários

### 12. [x] Documentar/resolver dependência da Prospecção Google Maps
- **Impacto:** Feature aparece na UI mas não funciona sem `SIRIUS_SCRAPER_URL` + `GOOGLE_PLACES_API_KEY`

### 13. [ ] Adicionar confirmation dialogs para ações destrutivas
- **Impacto:** Exclusão acidental de deals, pipelines, automations, team members
- **Páginas:** kanban-board, pipelines, automations, team, webhooks

### 14. [ ] Padronizar empty states em todas as listagens
- **Impacto:** UX inconsistente
- **Faltam:** deals, automations, webhooks, notifications

---

## BAIXO

### 15. [ ] Remover dead code e libs não utilizadas
- **Arquivos:** `lib/google-trends.ts`, `lib/ml/*.ts` (5), `lib/generative-ui/*`
- **Rodar:** `npx depcheck` para dependências não usadas

### 16. [ ] Padronizar mensagens de erro (PT-BR para user-facing, EN para logs)
- **Impacto:** Inconsistência entre português e inglês nos responses

### 17. [ ] Testar/remover integrações não funcionais
- **Google Ads:** 30% implementado
- **Facebook Ads:** 30% implementado
- **N8N:** 40% implementado
- **Google Calendar:** 60% implementado

---

## Progresso

| # | Status | Descrição |
|---|--------|-----------|
| 1 | DONE | Prisma singleton (5 app/lib files) |
| 2 | DONE | Auth check (15 AGI/NLP/Graph routes) |
| 3 | DONE | Evolution key exposure |
| 4 | DONE | Fallback user layout |
| 5 | DONE | Error boundaries |
| 6 | DONE | Dashboard metadata (20 pages) |
| 7 | DONE | Console.log -> logger (109 in 69 files) |
| 8 | DONE | Loading states (12 pages) |
| 9 | DONE | Rate limiting (22 routes) |
| 10 | DONE | Mobile responsiveness (6 components) |
| 11 | DONE | WhatsApp media upload |
| 12 | DONE | Prospecção config check + banner |
| 13 | Pendente | Confirmation dialogs |
| 14 | Pendente | Empty states |
| 15 | Pendente | Dead code cleanup |
| 16 | Pendente | Error messages i18n |
| 17 | Pendente | Integrações teste |
