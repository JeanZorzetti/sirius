# Quickstart — verificação da remoção de código morto

**Feature**: `002-remove-dead-code` | **Fase**: 1

Guia de validação. Código morto não quebra teste — **a ausência dele é que pode quebrar**. Por isso a verificação aqui não é ler o diff: é rodar os comandos e comparar números.

## Pré-requisitos

```bash
cd CRM/crm-project
npm ci --legacy-peer-deps
npx prisma generate
npx prisma generate --schema prisma/whatsapp.prisma   # sem este, o typecheck falha em cascata
```

O segundo `prisma generate` é o que faltava na CI e deixou `main` vermelha desde julho (research R1). Ele gera `.prisma/client-wa`, sem o qual `lib/chat/queries.ts` não compila e ~20 erros `TS7006` aparecem espalhados pelo repositório.

## A tríade — roda em toda história, antes e depois

```bash
npx tsc --noEmit                              # typecheck
npx vitest run                                # testes unitários
node scripts/audit-dead-code.js               # o número tem que cair
```

Para o build:

```bash
npx prisma generate && npx prisma generate --schema prisma/whatsapp.prisma && npx next build
```

**Nunca `npm run build`** (FR-003): esse script começa com `prisma migrate deploy`, que aplica migration contra o banco apontado pelo `DATABASE_URL` do ambiente.

Anotar no PR a saída de `audit-dead-code.js` de antes e de depois (FR-004).

## Antes de apagar qualquer arquivo

```bash
git log --diff-filter=D --name-only -- "*<nome>*"
```

Mostra quando o consumidor sumiu e por quê (FR-005). Foi assim que o commit `2d29773` foi identificado como a origem de dois terços do código órfão.

## Ponto de partida esperado

| Medida | Valor em 22/08/2026 |
|---|---|
| Arquivos sem importador | 59 (7.368 linhas) |
| Rotas sem chamador | 32 de 247 (2.061 linhas) |
| Total removível | 24.411 linhas |

## Validação por história

### US0 — baseline verde

```bash
gh run list --limit 1 --json conclusion --jq '.[0].conclusion'   # esperado: success
```

Checar também que o job de teste unitário **executou** testes, em vez de sair em silêncio: hoje ele roda `npm run test:unit --if-present` e esse script não existe (research R2). No log do job tem de aparecer contagem de testes.

### US1 — varredura sem risco

```bash
npm ci --legacy-peer-deps && npx tsc --noEmit && npx vitest run
grep -rn "pino-pretty" lib/logger.ts          # tem de continuar existindo
```

Os 3 pacotes que parecem órfãos e não são (`pino-pretty`, `@tailwindcss/typography`, `tw-animate-css`) continuam no `package.json` (FR-010).

### US2 — duplicatas e infra órfã

```bash
grep -rn "plan-limits" --include=*.ts --include=*.tsx . | grep -v node_modules   # só lib/plan-limits.ts
grep -rn "checkPlanQuota" lib/api-middleware.ts                                  # cota de plano preservada
```

Subir o app **sem** uma variável obrigatória no `.env` e confirmar duas coisas ao mesmo tempo: o log nomeia a variável faltante **e o processo continua de pé** (FR-021).

Exercitar uma busca de leads para confirmar que a factory de scraping continua entregando resultado pelos providers registrados.

### US3 — arquivos sem importador

```bash
node scripts/audit-dead-code.js    # ARQUIVOS SEM IMPORTADOR: 0
npm run build:mobile               # app Capacitor buildando
```

Abrir o app móvel e passar por navegação, `bottom-nav`, teclado, status bar e deep link (FR-012). São os vizinhos das 12 folhas mobile apagadas.

### US4 — exportar pela tela

Com sessão iniciada: abrir a listagem de deals, acionar exportar em XLSX e em PDF, abrir os dois arquivos. Repetir em contatos. Com listagem vazia, confirmar que o controle está desabilitado e explica o motivo, em vez de baixar arquivo vazio ([contrato](./contracts/export-endpoints.md)).

### US5 — rotas órfãs

```bash
node scripts/audit-dead-code.js    # ROTAS SEM CHAMADOR: no máximo 3, todas na allowlist
```

Preservações a conferir uma a uma (FR-007 a FR-009): `/api/sync/process`, `/api/mobile/sync`, `/api/mercadopago/checkout`, `lib/mercadopago.ts`, `/api/webhooks/mercadopago`, `lib/nlp/graph-rag.ts`, `lib/nlp/graph-queries.ts`. Abrir `admin/knowledge-graph` e confirmar que a tela responde.

Depois do deploy: acompanhar 404 e 500 novos no Sentry por 72 horas (SC-004).

### US6 — Generative UI removido

Abrir o chat do site e conversar. `AgiChatSidebar` e `AgiPreview` usam `/api/agi/chat`, que não é tocado.

```bash
grep -rn "MessageRenderer\|DynamicUIComponent\|chat-with-ui" --include=*.ts --include=*.tsx . | grep -v node_modules
ls docs/GENERATIVE_UI_*.md 2>&1     # esperado: nenhum arquivo
```

Ambos têm de vir vazios.

### US7 — consolidação

Comparar, antes e depois, a renderização de valor monetário, data e telefone nas telas principais (listagem de deals, ficha de contato, dashboard). Nenhuma diferença visível — nem separador, nem casa decimal, nem formato de data.

```bash
grep -rn "function formatCurrency\|const formatCurrency" --include=*.ts --include=*.tsx . | grep -v node_modules | grep -v lib/format.ts
```

Esperado: vazio.

## Prova final do gate (SC-006)

Num PR descartável: apagar uma página que seja a única consumidora de uma rota de API e abrir o PR. **Esperado: a CI reprova**, nomeando a rota órfã. É a reprodução do commit `2d29773`. Enquanto esse teste não reprovar, a FR-023 não está entregue — mesmo com o job existindo e verde.

## Estado final esperado

| Medida | Alvo |
|---|---|
| Arquivos sem importador | 0 |
| Rotas sem chamador | ≤ 3, todas na allowlist com motivo |
| Linhas removidas | ≥ 24.000 |
| Dependências no `package.json` | 12 a menos |
| CI em `main` | verde, com testes realmente executando |
