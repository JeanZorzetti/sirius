# Implementation Plan: A área logada veste a pele do Pipeline

**Branch**: `010-pele-area-logada` (trabalho em `main`, como as specs 005–009) | **Date**: 2026-09-25 |
**Spec**: [spec.md](./spec.md)

## Summary

A pele do Pipeline (escolha A por imagem) passa a valer na área logada inteira por uma folha nova, `app/app-pele.css`,
que só a folha do app importa. Ela promove os tokens do Pipeline para o `:root` e o `.dark`, remapeia as 22 matizes da
paleta do Tailwind para as rampas da direção (o que alcança as 6.227 classes fixas sem editá-las) e aplica as regras de
forma (canto de 4 px, sem sombra fora das camadas que flutuam, sem vidro, gradiente achatado). As fontes do Pipeline
sobem para o `:root` nos layouts do app. A moldura (barra lateral, barra inferior, botão do assistente) é ajustada à mão,
os ~480 hex dos arquivos do app passam por um codemod pela AST, e uma guarda impede literais de cor novos.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js 16.3 (App Router)

**Primary Dependencies**: Tailwind CSS v4 (`@tailwindcss/postcss`), shadcn/ui (Radix), `next/font/google`, next-themes, recharts

**Storage**: N/A

**Testing**: vitest (guarda estática), Playwright via `playwright-core` (retratos, cor computada, contraste, LCP)

**Target Platform**: web, VPS/EasyPanel (push em `main` = deploy em ~3 min)

**Project Type**: aplicação web, só front

**Performance Goals**: LCP de Contatos, Tarefas e Pipeline ≤ 1,10 × o de antes (régua da 009); 0 kb de JS novo

**Constraints**: páginas públicas idênticas (a folha pública não muda); Pipeline idêntico exceto o anel de foco;
contraste AA nos dois temas

**Scale/Scope**: 69 rotas; 6.227 classes de cor fixa em 245 arquivos; 480 hex em 46 arquivos; 119 gradientes

## Constitution Check

A constituição (`.specify/memory/constitution.md`) é o template vazio. Valem os portões das specs 005–009:

| Portão | Situação |
|---|---|
| Mudança de visual escolhida por imagem | ✅ três folhas, escolha A em 25/09 (`.art/log.json`) |
| Medir antes de mudar | ✅ R9: LCP e retratos "antes" antes do push |
| Páginas públicas intocadas | ✅ R1: folha só do app |
| Guarda que impede a volta | ✅ R8 |
| Push em `main` = deploy: verificar em produção | ✅ tarefa final |

Pós-desenho: sem violação. Nenhuma dependência nova.

## Project Structure

### Documentation (this feature)

```text
specs/010-pele-area-logada/
├── spec.md
├── plan.md              # este arquivo
├── research.md          # R1–R9
├── data-model.md        # contrato de tokens
├── quickstart.md        # como conferir
├── checklists/requirements.md
└── tasks.md
```

Sem `contracts/`: a feature não expõe interface a outro sistema.

### Source Code (repository root)

```text
app/
├── app-pele.css                         # NOVO: tokens, paleta remapeada, regras de forma (R1–R4)
├── globals.css                          # + @import "./app-pele.css"
└── [locale]/
    ├── dashboard/layout.tsx             # <style> das fontes no :root (R5)
    ├── dashboard/hoje.css               # anel grafite; sai a regra do data-assistente
    ├── (admin)/layout.tsx               # <style> das fontes
    └── (ia)/layout.tsx                  # <style> das fontes
components/
├── dashboard/sidebar.tsx                # presa à borda, tokens da barra lateral (R6)
├── dashboard/bottom-nav.tsx             # item ativo em primary (R6)
├── agi/AgiChatSidebar.tsx               # botão do assistente em primary (R6)
└── chat/**, analytics/**, admin/**, ia/**, tasks/**   # hex → variáveis (R7, codemod)
scripts/
└── codemod-hex-pele.mjs                 # NOVO: codemod pela AST (R7)
__tests__/styles/
└── app-color-guard.test.ts              # NOVO: guarda (R8)
```

**Structure Decision**: uma folha nova e um codemod; nenhum componente novo. A moldura muda nos próprios arquivos.

## Complexity Tracking

Sem violações a justificar.
