# Implementation Plan: Remoção de código morto — Sirius CRM

**Branch**: `002-remove-dead-code` | **Date**: 2026-08-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-remove-dead-code/spec.md`

## Summary

Remover ~24.400 linhas não alcançáveis (12% da base TS/TSX) em PRs sequenciais de risco crescente, ligar a exportação que já existe e nenhuma tela oferece, e deixar para trás um gate de CI que impede a causa raiz de se repetir.

A Fase 0 encontrou um bloqueio que a auditoria não via: **a CI de `main` está vermelha desde julho**, por falta de um `prisma generate` do schema WhatsApp no workflow — e o job de teste unitário nunca executou nada, porque aponta para um script que não existe. Toda a verificação desta feature é por ausência de regressão, o que não se observa a partir de vermelho. Por isso o plano abre com **US0 — restaurar o baseline**, antes de qualquer deleção.

A Fase 0 também corrigiu duas recomendações da auditoria: os dois rate limiters não são duplicata (são cota-de-plano e limite-de-rota, e fundir removeria cobrança), e as rotas de export não aceitam filtro (o cenário US4-1 é ajustado). Detalhes em [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 5 / Node 20 (CI) · React 19 · Next.js 15 App Router

**Primary Dependencies**: Prisma (2 schemas: `schema.prisma` e `whatsapp.prisma`), Vitest, Playwright, Tailwind, Capacitor, Sentry, Upstash Redis, Stripe

**Storage**: PostgreSQL via Prisma. **Esta feature não altera schema nem dados.**

**Testing**: Vitest (unitário, `__tests__/` + `lib/__tests__/`), Playwright (e2e, `e2e/`). Verificação adicional específica: `node scripts/audit-dead-code.js`

**Target Platform**: Web (container Node standalone, EasyPanel) + app Capacitor (Android/iOS)

**Project Type**: Aplicação web Next.js monolítica com app móvel embarcado — sem separação frontend/backend

**Performance Goals**: N/A para o comportamento. A meta de performance é de processo: a suíte e o type-check não podem ficar mais lentos (SC-007)

**Constraints**:
- `npm run build` executa `prisma migrate deploy` — **proibido** como verificação (FR-003), local ou em CI
- Preservações da FR-007 a FR-012 são inegociáveis e valem para todas as histórias
- Um PR por história; sem misturar histórias no mesmo merge

**Scale/Scope**: ~200k linhas medidas em `app/`, `components/`, `lib/`, `hooks/`; 247 rotas de API; 8 histórias (US0 + US1–US7)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` está com o **template não preenchido** — princípios, seções e regras de governança são todos placeholders (`[PRINCIPLE_1_NAME]`, `[GOVERNANCE_RULES]`).

**Resultado do gate: vacuoso — não "aprovado".** Não há princípio a violar porque não há princípio escrito. Registrar isso explicitamente é o ponto: um gate que passa porque está vazio não é evidência de conformidade, e tratá-lo como aprovação seria o mesmo erro de medir um check que ainda não mede nada.

Nenhuma ação exigida por esta feature — escrever a constituição é trabalho próprio, não pré-requisito de uma remoção de código morto. Se ela for preenchida antes da US7, este gate é reavaliado.

## Project Structure

### Documentation (this feature)

```text
specs/002-remove-dead-code/
├── plan.md              # Este arquivo
├── spec.md              # Spec da feature
├── research.md          # Fase 0 — 8 decisões verificadas
├── data-model.md        # Fase 1 — sem entidades de dados; formas-alvo dos módulos
├── quickstart.md        # Fase 1 — guia de verificação por história
├── contracts/
│   ├── audit-dead-code-cli.md   # Contrato do scanner + allowlist (FR-023, FR-024)
│   └── export-endpoints.md      # Contrato das 4 rotas de export (US4)
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 — gerado por /speckit-tasks
```

### Source Code (repository root)

Os diretórios abaixo são os que esta feature toca. Todo o resto do repositório fica intacto.

```text
.github/workflows/ci.yml         # US0: prisma generate do schema WhatsApp, build sem migrate, gate do scanner
package.json                     # US0: script test:unit · US1: -12 dependências
scripts/
├── audit-dead-code.js           # US0: flag --check + leitura da allowlist
├── dead-code-allowlist.json     # US0: novo — falsos positivos com motivo
└── (6 scripts novos)            # US5: migrações one-shot que saem das rotas admin
instrumentation.ts               # US2: try/catch que liga lib/env.ts em modo relatório

app/
├── [locale]/(admin)/admin/cache-stats/   # US6: apagado
├── [locale]/dashboard/                   # US4: botão de exportar em deals e contatos
└── api/
    ├── agi/chat-with-ui/, ab-testing/    # US6: apagadas
    ├── export/{deals,contacts}/{pdf,xlsx}/  # US4: PRESERVADAS e ligadas
    ├── admin/{6 rotas one-shot}/         # US5: viram scripts
    └── {rotas órfãs do Anexo B}/         # US5: apagadas

components/
├── generative-ui/                        # US6: apagado inteiro
├── mobile/                               # US3: 6 folhas órfãs (o stack Capacitor fica)
└── ui/{sidebar,responsive-sheet,mode-toggle}.tsx  # US1: apagados

lib/
├── generative-ui/                        # US6: apagado inteiro
├── rate-limit.ts → plan-quota.ts         # US2: RENOMEADO, não apagado (ver research R4)
├── mobile/                               # US3: 6 folhas órfãs
├── scraping/providers/                   # US2: 5 providers não registrados
├── format.ts                             # US7: novo — consolida 25 arquivos
└── {entitlements,feature-gates,plan-limits}.ts  # US7: fundidos em entitlements.ts

hooks/                                    # US6 esvazia os 5 do generative-ui; US7 unifica o resto
docs/GENERATIVE_UI_*.md                   # US6: 5 documentos apagados
```

**Structure Decision**: monolito Next.js existente, sem estrutura nova. Um único módulo novo de produção nasce nesta feature (`lib/format.ts`, US7); todo o resto é deleção, renome ou fiação. `lib/plan-quota.ts` é renome de arquivo existente, não módulo novo.

## Ordem de execução

Cada linha é um PR. A ordem não é negociável nos dois pontos marcados.

| # | História | Entrega | Depende de |
|---|---|---|---|
| **US0** | Baseline verde | CI passa em `main`; `test:unit` executa; build sem `migrate deploy`; scanner com `--check` e allowlist | — |
| US1 | Varredura sem risco | `.bak`, barrels, 3 shadcn, 12 deps | US0 |
| US2 | Duplicatas e infra órfã | rename `plan-quota`, `middleware/plan-limits` apagado, 5 providers, `env` ligado | US0 |
| US3 | Arquivos sem importador | Anexo A menos o que pertence a outras histórias | US0 |
| **US4** | Exportar pela tela | botão em deals e contatos | US0 · **antes da US5** |
| US5 | Rotas órfãs e one-shot | Anexo B menos allowlist e menos export; libs AGI; 6 scripts | **US4** |
| US6 | Generative UI removido | 14.666 linhas + 5 docs | US0 |
| US7 | Consolidação | `lib/format.ts`, entitlements fundido, hooks unificados | **US3 e US6** |

Duas dependências duras: **US4 antes de US5** (senão a US5 apaga as rotas que a US4 ia ligar) e **US7 depois de US3 e US6** (senão consolida formatadores e hooks de arquivos que vão ser apagados).

O gate do scanner (FR-023) entra na US0 em modo **relatório** e passa a **bloquear** ao fim da US3, quando a lista de arquivos sem importador chega a zero. Ligar o bloqueio antes disso deixaria a CI vermelha por design durante quatro PRs.

## Emendas à spec produzidas pela Fase 0

Estas três precisam ser refletidas em `spec.md` antes de `/speckit-implement`:

1. **FR-015** — de "um único módulo de rate limit" para "cota de plano e limite de rota são módulos distintos, com nomes que não se confundem". Fundir removeria a cota por plano que `api-middleware.ts` aplica (research R4).
2. **US4, cenário 1** — de "respeitando os filtros aplicados" para "os mesmos registros que o usuário tem permissão de ver". As rotas não leem query param (research R5).
3. **Nova US0** — restaurar o baseline de CI, antes de tudo. A spec assume verificação automática que hoje não roda (research R1, R2, R3).

## Complexity Tracking

O Constitution Check é vacuoso, então não há violação formal a justificar. Registrado aqui o que foi mantido apesar de a auditoria sugerir corte, e por quê:

| Item | Por que fica | Alternativa rejeitada |
|---|---|---|
| `lib/rate-limit.ts` (renomeado) | Aplica cota por plano no `api-middleware`; é receita, não duplicata | Apagar e usar `ratelimit.ts` — removeria a cota |
| 4 rotas `/api/export/*` | Feature pronta; decisão do usuário em 22/08 foi ligar | Apagar junto com as órfãs |
| `lib/env.ts` | Erro de env var é a primeira hipótese de debug do projeto | Apagar as 122 linhas |
| `lib/nlp/graph-rag.ts`, `graph-queries.ts` | Alcançados por `admin/knowledge-graph` via `/api/graph/rag` | Apagar junto com o cluster AGI |
| `lib/mercadopago.ts`, `/api/webhooks/mercadopago` | Assinaturas legadas ativas | Apagar junto com `lib/mercado-pago/checkout.ts` |
