# Implementation Plan: As páginas públicas vestem a pele da home

**Branch**: `008-fluxo-skin-public-pages` (trabalho em `main`, como as specs 005–007) | **Date**: 2026-09-24 |
**Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-fluxo-skin-public-pages/spec.md`

## Summary

As 38 páginas do layout `(marketing)` passam a vestir a pele da home Fluxo (escolha B por imagem). O layout público
ganha o mesmo atributo da home (`data-art="fluxo"`) e as mesmas fontes. Os tokens da home saem de `fluxo.css` para
`app/fluxo-pele.css`, na folha pública, e mapeiam as variáveis do shadcn que os componentes já leem. As ~440 classes
de cor fixa dos arquivos públicos viram classes semânticas. Sombra, raio e tema escuro dos componentes
compartilhados com o app são resolvidos por regra de escopo. Uma guarda de teste impede a volta das cores fixas.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js 16.3 (App Router)

**Primary Dependencies**: Tailwind CSS v4 (`@tailwindcss/postcss`), shadcn/ui, `next/font/google`, next-themes

**Storage**: N/A

**Testing**: vitest (guarda estática), Playwright via `playwright-core` (retratos, varredura de cor, LCP)

**Target Platform**: web, VPS/EasyPanel (push em `main` = deploy)

**Project Type**: aplicação web (Next.js), só front

**Performance Goals**: LCP de `/pricing` e `/blog` ≤ 1,10 × o de antes (régua da 007); 0 kb de JS novo

**Constraints**: app (dashboard) e home visualmente idênticos; contraste AA; foco visível; a folha pública
(`public.css`, 007) continua sendo a única folha das rotas públicas

**Scale/Scope**: 38 rotas; ~440 usos de cor fixa em 34 arquivos; 3 páginas escuras; 22 com `dark:`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

A constituição do projeto (`.specify/memory/constitution.md`) nunca foi preenchida: é o template. Valem as regras de
trabalho do projeto e o padrão das specs 005–007, usados como portões:

| Portão | Situação |
|---|---|
| Medir antes de mudar (régua da 007, antes e depois na mesma máquina) | ✅ R9, quickstart |
| Mudança de visual escolhida por imagem, não por descrição | ✅ folha A/B/C de 24/09, `.art/log.json` |
| App intocado (spec 007 separou as folhas justamente para isso) | ✅ tokens só dentro de `[data-art]`; `components/ui` não muda |
| Guarda que impede a volta do defeito | ✅ R8 |
| Push em `main` = deploy: verificar em produção depois | ✅ tarefa final |

Pós-desenho: sem violação. Nenhuma camada, pacote ou dependência nova.

## Project Structure

### Documentation (this feature)

```text
specs/008-fluxo-skin-public-pages/
├── spec.md
├── plan.md              # este arquivo
├── research.md          # R1–R9
├── data-model.md        # contrato de tokens
├── quickstart.md        # como conferir
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

Sem `contracts/`: a feature não expõe interface a outro sistema.

### Source Code (repository root)

```text
app/
├── fluxo-pele.css                      # NOVO: primitivos + mapeamento shadcn + regras de escopo (R1, R2, R4)
├── public.css                          # + @import "./fluxo-pele.css" layer(public)
├── theme.css                           # variante dark ignora [data-art] (R5); --font-mono com DM Mono (R6); --color-destaque (R2)
└── [locale]/
    ├── (fluxo)/
    │   ├── layout.tsx                  # fontes vêm de components/fluxo/fontes.ts
    │   └── fluxo.css                   # perde o bloco de tokens e as regras gerais (vão para fluxo-pele.css)
    ├── (marketing)/
    │   ├── layout.tsx                  # data-art="fluxo" + fontes; menu com fundo sólido
    │   └── **/page.tsx, layout.tsx     # 23 páginas: cores fixas → semânticas (R3)
    ├── not-found.tsx                   # veste a pele (fora do layout (marketing))
components/
├── fluxo/fontes.ts                     # NOVO: Schibsted Grotesk + DM Mono, uma instância
├── marketing/*.tsx                     # R3
├── blog/*.tsx                          # R3; barra de leitura sem o gradiente do Progress
└── calculadora-roi.tsx                 # R3; séries do gráfico com os tokens
config/city-data.ts, config/niche-data.ts   # R3
__tests__/styles/public-css-guard.test.ts   # + guarda de paleta (R8)
```

**Structure Decision**: sem pasta nova. Um CSS novo (`fluxo-pele.css`) porque os tokens passam a ser de duas
superfícies (home e páginas) e o `fluxo.css` só carrega na home; um módulo novo (`fontes.ts`) porque `next/font`
precisa de uma instância compartilhada para não baixar a fonte duas vezes.

## Ordem de execução

1. **Medir antes** (retratos da amostra + LCP), com o código de hoje.
2. **Fundação** (vira a pele de todas as páginas de uma vez, sem editar página): `fluxo-pele.css`, `theme.css`,
   `fontes.ts`, os dois layouts. Conferir a home e o dashboard iguais. Nesse ponto a folha B já aparece onde a
   página usa classes semânticas.
3. **Limpeza por arquivo** (R3), das páginas de mais tráfego para as de menos: `/pricing`, `/blog` + componentes do
   blog, `/solucoes` (+ `config/`), calculadoras, `/login` `/register` `/anuario`, o resto.
4. **Guarda** (R8) verde.
5. **Verificar** (quickstart) e **medir depois**; retratos lado a lado com a folha B.
6. Push, conferir em produção, handoff.

## Complexity Tracking

Sem violações.
