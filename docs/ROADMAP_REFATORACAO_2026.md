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

### Sprint R2 — Higiene de código ✅ FEITO (2026-06-11)
1. ✅ Zero `console.log` incondicional em prod: instrumentação PERF atrás de dev-gate/`NEXT_PUBLIC_PERF_DEBUG`, rotas server migradas para `logger` (pino). **Bônus de segurança:** removido log que vazava prefixo da `RESEND_API_KEY` no forgot-password.
2. ⚠️ Migração `middleware.ts` → `proxy` **ADIADA**: Next 16.1.1 valida a convenção mas o build Turbopack DESCARTA silenciosamente o proxy.ts (middleware-manifest vazio = `/dashboard` desprotegido — provado A/B local). Reavaliar no próximo upgrade do Next. Warning de deprecação é cosmético.
3. ✅ `turbopack.root` fixado no next.config (lockfile órfão do HOME não é mais inferido como root; não deletado pois `C:\Users\jeanz\package.json` tem deps possivelmente em uso).
4. ✅ eslint `--fix` aplicado (10 fixes); zero `no-unused-vars`. Restam 1.272 `no-explicit-any` → escopo R3/R4.

### Sprint R3 — Tipos de domínio do Pipeline ✅ FEITO (2026-06-11)
Criado `lib/types/pipeline.ts` (`PipelineDeal`, `PipelineStageWithDeals`, `PipelineSummary`, `PipelineContact`, `OptimisticDeal` — enums ancorados no Prisma; shape espelha a serialização do `DashboardTabsWrapper`: Decimal→number, Date→ISO). Adotado em 6 componentes: `dashboard-tabs` (props `any[]` eliminados, estado `editingDeal` tipado), `mobile-pipeline-list`, `kanban-board` (`Deal.value: any`→`number|null`, callback otimista `Partial<PipelineDeal>`), `edit-deal-dialog` (`SimpleDeal.value` idem), `create-deal-dialog` (`onOptimisticAdd: OptimisticDeal` + fix de `undefined` em contact), `dashboard-with-pipeline-selector`. Zero `any` nos props de todos; restam anys internos do edit-deal-dialog (`fullDeal`, notes/activities) → tratar na decomposição do R6.

### Sprint R4 — Tipagem das rotas críticas + remoção do whatsmeow ✅ FEITO (2026-06-11)
- **whatsmeow removido** (26 arquivos afetados): deletados o client, o webhook do gateway, as 4 rotas `connections/whatsmeow/*`, o `whatsmeow-connect-card` e o `whatsapp-provider`. Rotas de envio QR (`send-message`, `send-media`, `v1/whatsapp/send`, `admin/sync-contacts`) viraram **410 Gone** com mensagem de migração para WABA; `media`/`profile-pic`/`connections/[id]/*` perderam só o branch do gateway (MinIO/WABA intactos); `chat/page.tsx` desacoplado; página de settings legada redireciona para `whatsapp-official`. Automations/retry de WhatsApp QR retornam erro claro (reimplementar via WABA é feature futura).
- **mercadopago webhook tipado**: `MpPayment` derivado do próprio SDK (`Awaited<ReturnType<Payment['get']>>` + `preapproval_id`), `AddonType` do Prisma em vez de string solta, zero anys.
- **contacts/actions tipado**: casts `(prisma.X as any)` removidos (client atualizado), helpers `errMessage`/`errStack` p/ narrowing de catch, zero anys. **Bug latente corrigido**: auto-criação de Product sem `price` (obrigatório) crashava em runtime — o cast escondia.
- Gotcha: `.next/types` stale mascarava 13 erros de tipo — limpar ao deletar rotas.

### Sprint R5 — Decompor `message-area.tsx` (2.169 linhas) ✅ FEITO (2026-06-11)
- **`message-area.tsx` (2.169) → diretório `components/chat/message-area/`** com 14 arquivos, todos <400 linhas. O `index.tsx` preserva o import path (`./message-area` resolve no diretório): `types.ts` (contratos), `utils.ts` (formatação/bubble/mídia), `audio-player.tsx`, `media-bubble.tsx`, `message-bubble.tsx` (+ `buildMessageMenuItems`), `message-list.tsx` (Virtuoso+skeleton+FAB), `chat-header.tsx` (desktop+mobile), `composer.tsx` (reply/file bars + input + gravação), `window-banners.tsx`, `chat-modals.tsx`, e hooks `use-chat-messages` (fetch+polling+Pusher+scroll), `use-send-message` (pipeline otimista único p/ texto/mídia/áudio — dedupe de 4 cópias), `use-audio-recording`, `use-ai-draft` (co-pilot).
- **Bônus pelo critério "nenhum arquivo do chat >400":** `conversation-list.tsx` (573→231) extraiu `conversation-item.tsx` + `use-conversation-actions.ts` (pin/archive/read/clear — dedupe de handlers duplicados); `chat-interface.tsx` (472→387) extraiu `chat-empty-states.tsx` (WABA waiting, skeleton de sync, placeholders).
- **Código morto removido:** `components/chat/message-bubble.tsx` antigo (248 linhas, zero importadores — tentativa de extração abandonada).
- **Lint dos novos arquivos zerado:** `Math.random()` em render (waveform → jitter determinístico), ref lido em render (QuickReplyPicker posiciona via estado `taHeight`), detecção de quick-reply derivada no render em vez de setState em effect.

**Critério verificado:** nenhum arquivo do chat >400 linhas (maior: index 399); tsc 0 erros; 656 testes verdes.

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
