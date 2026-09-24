# Implementation Plan: O pipeline abre pela fila de quem pede ação hoje

**Branch**: `009-dashboard-fila-de-hoje` (trabalho em `main`, como as specs 005–008) | **Date**: 2026-09-24 | **Spec**: [spec.md](spec.md)

## Summary

Acima do quadro Kanban do `/dashboard` entra a **fila de hoje** (negócios abertos com retorno vencido ou parados há
mais de 30 dias na etapa), e o quadro passa a dizer a verdade em cada coluna e cartão (contagem, soma com cobertura,
fato de tempo em texto, "sem valor"). A tela veste a direção **Hoje**: clara por padrão, com a tinta, as fontes e o
pulso da home; escura para quem salvou tema escuro, na versão da folha (noite azul, luz âmbar). Tudo com escopo
`[data-tela="hoje"]`: nenhuma outra tela muda.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.3 (App Router)
**Primary Dependencies**: já instaladas — `@hello-pangea/dnd` (arrastar), `next-themes` (tema), `next/font/google`
(Schibsted Grotesk + DM Mono, instâncias sem preload de `components/fluxo/fontes.ts`), Prisma 5
**Storage**: PostgreSQL via Prisma; leitura de `Activity` (`type = 'STAGE_CHANGE'`) e `Organization.createdAt`
**Testing**: vitest (regra pura em `lib/pipeline/hoje.ts`); retratos com playwright-core; `tsc --noEmit`
**Target Platform**: web (desktop 1366–1920, celular 360–430) e o app Capacitor que abre a mesma rota
**Project Type**: web app (Next.js monolito)
**Performance Goals**: faixa **Marca** da `art-direction` — JS novo ≤ 5 kb gzip, LCP ≤ 2,5 s (4G lento + CPU 4×),
CLS ≤ 0,1; SC-005: primeira pintura não piora mais de 10% contra a atual
**Constraints**: `dark:` do Tailwind não casa em página com `[data-art]` (`app/theme.css`), por isso o escopo é
`data-tela`, não `data-art`; fontes sem preload (lição da spec 008); nada de cor fixa nova nos componentes
**Scale/Scope**: 1 rota; pior caso real 274 negócios numa conta, 32 numa coluna, 10 etapas

## Constitution Check

`.specify/memory/constitution.md` é o modelo não preenchido: sem princípios a checar. Valem as regras do repo
(`CLAUDE.md`): Prisma singleton, `getSession()`, sem `db execute` manual — esta spec não mexe em schema.

## Project Structure

### Documentation (this feature)

```text
specs/009-dashboard-fila-de-hoje/
├── spec.md · plan.md · research.md · data-model.md · quickstart.md · tasks.md
└── checklists/requirements.md
```

### Source Code (repository root)

```text
lib/pipeline/hoje.ts                         # NOVO: regra pura (dias, fato de tempo, pede ação, fila, resumo, dinheiro)
__tests__/pipeline/hoje.test.ts              # NOVO
lib/types/pipeline.ts                        # + stageEnteredAt, exemplo em PipelineDeal
components/dashboard/dashboard-tabs-wrapper.tsx  # deriva stageEnteredAt (Activity) e exemplo (Organization.createdAt)
components/dashboard/fila-de-hoje.tsx        # NOVO: a fila (client), desktop 3 grandes + contagem, celular rolagem
components/dashboard/dashboard-tabs.tsx      # topo numa linha (funil como título + buscas por slot), fila, sem a aba única
app/[locale]/dashboard/page.tsx              # wrapper data-tela="hoje" + fontes; buscas vão como slot; sai o h1/subtítulo
app/[locale]/dashboard/hoje.css              # NOVO: tokens claro/escuro com escopo, mapeamento shadcn, botão do assistente
components/kanban-board/{types,kanban-column,deal-card,index}.tsx  # cabeçalho honesto, cartão com fato de tempo, vazio em texto
components/dashboard/{mobile-pipeline-list,stage-stories,deal-mobile-card}.tsx  # celular: fila, etapas sem arco-íris, cartão honesto
components/pipelines/pipeline-selector.tsx   # vira o título (sem o ponto azul)
components/agi/AgiChatSidebar.tsx            # só um atributo no botão flutuante (a cor sai do hoje.css, só nesta rota)
```

**Structure Decision**: a regra de negócio (o que pede ação, em que ordem, como resumir) fica num módulo puro
testável; os componentes só derivam no render. A derivação que depende do banco (entrada na etapa, exemplo) fica no
servidor, junto da serialização que já existe. O estado do funil selecionado continua no `DashboardTabs` (e na URL
`?pipeline=`); "Abrir" da fila reusa o `setEditingDeal` do link direto `?deal=`.

## Complexity Tracking

Nenhuma violação. Nenhuma dependência nova.
