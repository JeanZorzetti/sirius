# Research — Remoção de código morto

**Feature**: `002-remove-dead-code` | **Data**: 2026-08-22 | **Fase**: 0

Tudo aqui foi verificado no repositório ou na API do GitHub Actions nesta sessão. Nenhum item veio da auditoria sem reconferência.

---

## R1 — O baseline de verificação está vermelho (bloqueia FR-002, FR-004, FR-023, SC-007)

**Achado**: a CI falha em **todas** as execuções de `main` desde pelo menos 12/07/2026. Na execução mais recente (`docs(spec): add spec 002`, 22/08): `Lint`, `TypeScript Type Check` e `Database Migration Check` falham; `Build`, `Unit Tests` e `E2E` são **skipped** por dependerem dos anteriores.

**Causa do typecheck**: a primeira linha de erro é `lib/chat/queries.ts(3,46): error TS2307: Cannot find module '.prisma/client-wa'`. O workflow roda apenas `npx prisma generate` (schema padrão), enquanto `npm run build` roda **dois** generates — o segundo com `--schema prisma/whatsapp.prisma`. Sem o cliente WhatsApp gerado, os tipos do Prisma viram `any` implícito e cascateiam em ~20 erros `TS7006` espalhados por `app/api/whatsapp/*`, `app/api/contact/*`, `lib/agaas-executor.ts`. **Não são bugs de tipo no código; são um passo faltando na CI.**

**Decision**: criar **US0 — restaurar o baseline verde**, executada antes de qualquer deleção. Escopo: adicionar `npx prisma generate --schema prisma/whatsapp.prisma` aos jobs que type-checam e buildam; investigar a falha do `prisma validate`; deixar `lint`, `typecheck`, `build` e `test` verdes em `main`.

**Rationale**: sem baseline verde não existe "continua verde". Toda história desta feature se verifica por ausência de regressão — e ausência de regressão não é observável a partir de vermelho. Pior: FR-023 pede um gate novo numa CI que já não barra nada, o que produziria a *aparência* de proteção.

**Alternatives considered**:
- *Verificar só localmente e ignorar a CI*: rejeitado — FR-023 exige o gate na CI, e a máquina local não é o que barra PR de terceiro (nem de agente).
- *Consertar a CI depois, ao final das deleções*: rejeitado — as histórias P1–P7 seriam mescladas sem nenhuma verificação automática, que é exatamente como as 16.057 linhas órfãs entraram.

---

## R2 — O job de teste unitário nunca rodou

**Achado**: o job `Unit Tests (Vitest)` executa `npm run test:unit --if-present`. O `package.json` **não tem** o script `test:unit` (tem `test`, `test:ui`, `test:coverage`). Com `--if-present`, o npm sai com código 0 sem executar nada. O job é verde por vacuidade quando chega a rodar.

**Decision**: adicionar `"test:unit": "vitest run"` ao `package.json` e manter o job apontando para ele. Entra na US0.

**Rationale**: `vitest` sem `run` entra em modo watch; funciona em CI por não haver TTY, mas é frágil e trava em execução local. `vitest run` é explícito nos dois ambientes.

**Alternatives considered**: apontar o job para `npm test` — rejeitado pelo mesmo motivo do watch.

---

## R3 — O build da CI aplica migrations

**Achado**: o job `Build Application` roda `npm run build`, que é `npx prisma migrate deploy && npx prisma generate && npx prisma generate --schema prisma/whatsapp.prisma && next build`. Em CI não há `DATABASE_URL` no env do job — o `migrate deploy` falha ou, pior, num ambiente onde a variável existisse, aplicaria migration a partir de um PR.

**Decision**: na CI, substituir por `npx prisma generate` + `npx prisma generate --schema prisma/whatsapp.prisma` + `npx next build`. Mesma decomposição que a FR-003 já exige para verificação local. Entra na US0.

**Rationale**: build de verificação não pode ter efeito colateral em banco. Alinha CI e procedimento local numa forma única.

---

## R4 — Os dois rate limiters **não** são o mesmo conceito (emenda à FR-015)

**Achado**: a auditoria (item 7) recomendou substituir `lib/rate-limit.ts` por `lib/ratelimit.ts` porque os nomes diferem por um hífen. As APIs mostram que são coisas diferentes:

| | `lib/rate-limit.ts` (1 importador) | `lib/ratelimit.ts` (29 importadores) |
|---|---|---|
| Assinatura | `checkRateLimit(organizationId, plan)` | `checkRateLimit(req)` |
| Unidade | organização | requisição/IP |
| Regra | cota por plano (`RATE_LIMITS` FREE/PRO) | janela deslizante por rota (`authRateLimit`, `agiRateLimit`, …) |
| Usado por | `lib/api-middleware.ts`, que emite `X-RateLimit-*` | 29 rotas |

Apagar `rate-limit.ts` e apontar `api-middleware.ts` para `ratelimit.ts` **removeria a cota por plano** — perda de comportamento de faturamento, não limpeza.

**Decision**: **não fundir. Renomear.** `lib/rate-limit.ts` → `lib/plan-quota.ts`, com `checkRateLimit` → `checkPlanQuota`. `lib/ratelimit.ts` fica como está. A FR-015 é emendada de "um único módulo de rate limit" para "nomes que não se confundem: cota de plano e limite de rota são módulos distintos e nomeados como tal".

**Rationale**: o defeito real do item 7 é ambiguidade de nome, não duplicação de código. Renomear resolve o defeito inteiro sem tocar em comportamento.

**Alternatives considered**: fundir os dois num módulo com duas funções — rejeitado; junta dois conceitos num arquivo só para satisfazer uma contagem.

---

## R5 — As rotas de export não aceitam filtro (emenda ao cenário US4-1)

**Achado**: `GET /api/export/{deals,contacts}/{xlsx,pdf}` não lê nenhum query param. `deals` filtra por `session.user.id`; `contacts` filtra por `session.user.organizationId`. O cenário US4-1 diz "respeitando os filtros aplicados" — hoje isso não é implementável sem mudar o backend.

**Decision**: **v1 exporta o escopo do usuário, sem filtros**, e o rótulo do botão diz isso ("Exportar tudo"). O cenário US4-1 é emendado para "os mesmos registros que o usuário tem permissão de ver". Repassar os filtros da tela fica como follow-up, se alguém pedir.

**Rationale**: o valor da US4 é que a feature deixe de estar desligada. Plumbar filtros é backend novo numa história que a spec define como de UI.

**Alternatives considered**: passar a query string da listagem e aplicar no `where` do Prisma — não rejeitado em definitivo, só adiado; vira spec própria se houver demanda.

**Nota**: a divergência de escopo entre as duas rotas (`userId` para deals, `organizationId` para contacts) é intencionalmente preservada. Deals é mais restritivo que a regra da tela, o que satisfaz o cenário US4-3.

---

## R6 — A allowlist do scanner não contém os falsos positivos conhecidos

**Achado**: `scripts/audit-dead-code.js` tem duas allowlists implícitas — `SKIP` (diretórios, inclui `public/`) e a regex `EXTERNAL` (webhooks, cron, auth, mcp, og, sitemap…). As três rotas com chamador externo confirmado — `/api/sync/process`, `/api/mobile/sync`, `/api/mercadopago/checkout` — **não** casam com `EXTERNAL`; elas foram anotadas à mão no documento da auditoria. O script também não chama `process.exit`: sai sempre com 0.

**Decision**: (a) criar `scripts/dead-code-allowlist.json`, com um motivo escrito por entrada; (b) adicionar a flag `--check`, que sai com código 1 quando aparece qualquer item fora da allowlist. Sem flag, o comportamento de relatório continua idêntico.

**Rationale**: FR-023 precisa de código de saída, e FR-024 exige que o motivo de cada exceção seja versionado junto — anotação em documento não é lida por CI nem por quem apaga o arquivo seis meses depois.

**Alternatives considered**: estender a regex `EXTERNAL` — rejeitado; regex não guarda o porquê, e foi justamente a falta do porquê que deixou 16k linhas órfãs passarem despercebidas.

---

## R7 — Ligar `lib/env.ts` sem alterá-lo

**Achado**: `validateEnv()` roda no topo do módulo (`export const env = validateEnv()`) e **lança** quando falta variável obrigatória. A lista inclui `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET`, pendentes em produção conforme o handoff de 07/07. Importar o módulo como está derruba o boot.

**Decision**: importar dinamicamente dentro de `try/catch` em `instrumentation.ts` e logar a mensagem no `catch`. Quatro linhas, nenhuma alteração em `lib/env.ts`.

**Rationale**: a exceção já carrega a lista completa de variáveis faltantes formatada; capturar e logar entrega exatamente o que a FR-021 pede (relatar sem derrubar) sem reescrever a validação.

**Alternatives considered**: adicionar um parâmetro `throwOnError` a `validateEnv()` — rejeitado; é API nova para um único chamador.

---

## R8 — O que sobra em `hooks/` depois das deleções (simplifica a US7)

**Achado**: após US3 (`use-task-pusher`, `useDragScroll`) e US6 (`useABTest`, `useComponentAnalytics`, `useComponentCache`, `useOptimisticUpdate`, `useWorkflow`), `hooks/` fica com `use-audio-player`, `use-biometric-lock`, `use-media-query`, `use-pusher`, `use-toast` e **`useNotifications`** — um único arquivo fora da convenção. `lib/hooks/` tem um arquivo (`use-entitlements.ts`) e um `__tests__/`.

**Decision**: a parte de hooks da US7 vira dois movimentos: renomear `useNotifications.ts` → `use-notifications.ts` e mover `lib/hooks/` para `hooks/` (com o `__tests__`). Nenhuma decisão de convenção a tomar — `use-x.ts` já é maioria.

**Rationale**: a ordem das histórias resolve sozinha 5 dos 6 arquivos fora do padrão. Fazer a US7 antes das deleções seria renomear arquivos que vão ser apagados.

---

## Riscos residuais

| Risco | Mitigação |
|---|---|
| `prisma validate` falhar por motivo diferente de env var | US0 investiga antes de prometer baseline verde; se for schema quebrado de verdade, vira história própria e as deleções seguem com typecheck+test |
| A árvore de trabalho local tem alterações não commitadas de outra frente | Cada história começa de `main` limpa; a US0 mede o baseline na CI, não na máquina |
| Deletar `components/microsoft-clarity.tsx` remove o rastreamento Clarity | Confirmado que o snippet não está no layout: apagar é remover uma integração que já não funciona. Registrar no PR |
| Rota órfã com chamador no app mobile fora deste repo | US5 exige busca no repositório mobile antes de cada deleção de rota, além da allowlist |
