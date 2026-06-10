# Roadmap de Refatoração — Sirius CRM (Junho 2026)

> Auditoria executada em 2026-06-10. Regra de execução: **1 sprint por sessão**, build verde + commit por sprint.
> Escopo auditado: `components/`, `app/`, `lib/`, `hooks/` (~1.500 arquivos TS/TSX, 251 rotas API).

---

## Diagnóstico — números da auditoria

| Frente | Achado | Evidência |
|--------|--------|-----------|
| **Gate de tipos DESLIGADO** | `typescript.ignoreBuildErrors: true` — deploy nunca typecheca | `next.config.ts:9` + log de build "Skipping validation of types" |
| Erros de tipo latentes | 624 erros no `tsc --noEmit` (quase todos em `__tests__` sem types do vitest) | `npx tsc --noEmit` |
| Tipagem fraca | **625** usos de `: any` / `as any` em código de produção | grep |
| Componentes gigantes | `message-area.tsx` **2.169** linhas, `edit-deal-dialog.tsx` **1.412**, `kanban-board.tsx` **968**, `agaas-executor.ts` 944, webhook mercadopago 848, `ia-agents.tsx` 747 | wc -l |
| Queries sem paginação | 260 `findMany` no total, só **~31 com `take:`**. `contacts/page.tsx` carrega TODOS os contatos + TODAS as activities da org | grep |
| SQL raw triplicado | `chat/page.tsx` (345 linhas): 6 queries raw quase idênticas (matriz evolution×waba) | leitura |
| console.log em prod | 30 ocorrências + instrumentação `[PERF-CLIENT]`/`PerfTimer` ativa em produção | grep |
| framer-motion | importado em **49 arquivos** (lição Estetia: ~300KB de JS cortados ao eliminar) | grep |
| Avisos de build | convenção `middleware` deprecada (Next 16 pede `proxy`); lockfile duplicado em `C:\Users\jeanz\package-lock.json` | log de build |

### Hotspots de `any` (top)
| Arquivo | Usos |
|---------|------|
| `app/api/webhooks/whatsmeow/route.ts` | 23 |
| `app/[locale]/(marketing)/features/[slug]/page.tsx` | 22 |
| `app/[locale]/dashboard/contacts/actions.ts` | 16 |
| `lib/url-inspection.ts` / webhook mercadopago | 14 |
| `app/[locale]/dashboard/contacts/page.tsx` | 13 |
| `components/deals/edit-deal-dialog.tsx` | 12 |
| `components/dashboard/dashboard-tabs.tsx` (props `pipelines/stages/contacts` são `any[]`) | 11 |

---

## Sprints (ordem de execução)

### Sprint R1 — Religar o gate de tipos ⭐ FUNDAÇÃO ✅ FEITO (commit `921331d`, 2026-06-10)
O motivo de bugs chegarem em prod sem aviso. Tudo que vier depois depende disso.
1. Configurar types do vitest (`vitest/globals` no `tsconfig` ou `exclude: ["__tests__"]` do build-check)
2. Corrigir os erros de tipo restantes em código de aplicação (poucos — ex.: `canUse` faltando em quota-display)
3. Flipar `ignoreBuildErrors: false` e garantir `next build` verde
4. (Opcional) script `typecheck` no package.json + pre-commit

**Critério de pronto:** `next build` typecheca e passa.

### Sprint R1.5 — Suíte de testes verde ✅ FEITO (commit `3cb00fa`, 2026-06-10)
Eram 98 falhas em 21 arquivos (drift: testes escritos contra planos/APIs antigos + falhas de infra de teste). Resultado: **35/35 arquivos, 656 testes verdes**. Bugs reais corrigidos no caminho: ALTER TABLE como side effect do `lib/prisma.ts`, DealFormGenerator travando submit com NaN sem erro visível, regexes de intent sem tolerar artigos, `minLeadScore` que não agia como mínimo, vitest coletando testes do zod de `mcp-server/node_modules`.

### Sprint R2 — Higiene de código
1. Remover/condicionar os 30 `console.log` (instrumentação PERF atrás de `process.env.NODE_ENV === 'development'` ou flag)
2. Migrar `middleware.ts` → convenção `proxy` (Next 16)
3. Remover lockfile órfão `C:\Users\jeanz\package-lock.json` (warning de workspace root) ou setar `turbopack.root`
4. Varredura de imports não usados / código morto (eslint `--fix` + revisão)

**Critério de pronto:** zero console.log incondicional em prod; build sem warnings novos.

### Sprint R3 — Tipos de domínio do Pipeline
Criar `lib/types/pipeline.ts` com `Pipeline`, `PipelineStage`, `Deal`, `DealContact` (derivados do Prisma via `Prisma.DealGetPayload<>`) e adotar em:
- `dashboard-tabs.tsx` (props deixam de ser `any[]`)
- `kanban-board.tsx`, `mobile-pipeline-list.tsx`, `edit-deal-dialog.tsx`, `create-deal-dialog.tsx`

**Critério de pronto:** zero `any` nos props desses 5 componentes; typecheck verde.

### Sprint R4 — Tipagem das rotas críticas + remoção do whatsmeow
- **whatsmeow está MORTO** (foi só um teste, confirmado 2026-06-10): em vez de tipar, REMOVER `app/api/webhooks/whatsmeow/`, `lib/integrations/whatsmeow-client.ts` e desacoplar `chat/page.tsx` (que ainda importa o client e o `prismaWa`). Mapear dependências antes de deletar.
- `app/api/webhooks/mercadopago/route.ts` (14 anys, 848 linhas — tipar payloads MP)
- `app/[locale]/dashboard/contacts/actions.ts` (16 anys)

**Critério de pronto:** código whatsmeow removido sem quebrar o chat; ≤2 `any` justificados por arquivo restante (payload externo na borda, validado com zod).

### Sprint R5 — Decompor `message-area.tsx` (2.169 linhas)
Extrair em `components/chat/message-area/`: header, lista de mensagens, bolha de mensagem, composer/input, painel de anexos, modais (já há padrão de decomposição no projeto — V2 Sprint).

**Critério de pronto:** nenhum arquivo do chat >400 linhas; comportamento idêntico (smoke test no chat).

### Sprint R6 — Decompor `edit-deal-dialog.tsx` (1.412) + `kanban-board.tsx` (968)
- Edit-deal: abas/seções viram subcomponentes; lógica de submit vira hook `useDealForm`
- Kanban: coluna, card e DnD handlers em arquivos próprios

**Critério de pronto:** arquivos <400 linhas; pipeline funcional (drag, edição, criação).

### Sprint R7 — Camada de dados do Chat (dedupe SQL)
`chat/page.tsx`: extrair para `lib/chat/queries.ts` uma única função parametrizada para a matriz (evolution / waba / ambos) — hoje são 6 queries raw quase idênticas. Reduz a página de 345 → ~80 linhas.

**Critério de pronto:** 1 query builder testado (unit), página fina, chat funcional.

### Sprint R8 — Performance de dados
1. `contacts/page.tsx`: paginação server-side (ou ao menos `take` + cursor) para contatos e activities — hoje carrega a org inteira a cada acesso
2. Auditar os ~230 `findMany` sem `take` e adicionar limites nos de listagem
3. Auditar os 49 imports de framer-motion: substituir por CSS/`Reveal` pattern onde for animação simples (lição Estetia: -300KB)

**Critério de pronto:** contacts page com paginação; bundle do dashboard mensurado antes/depois.

---

## Regras durante a refatoração
- **Nunca** `prisma db execute` manual; schema só via migration formal
- `import { prisma } from '@/lib/prisma'` sempre; params de rota são `Promise` (Next 16)
- Cada sprint: branch própria → build verde → commit → deploy só após validação
- Sem mudança de comportamento visível ao usuário (refactor ≠ feature)
