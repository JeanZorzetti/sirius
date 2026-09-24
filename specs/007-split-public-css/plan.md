# Implementation Plan: Página pública só baixa o CSS que usa

**Branch**: `007-split-public-css` | **Date**: 2026-09-24 | **Spec**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)

## Summary

O `globals.css` vira duas folhas, geradas das mesmas fontes de estilo. A **pública** varre só as pastas que as
rotas públicas importam (28,5 kb gz contra 48,5 kb na mesma régua) e mora inteira numa cascade layer `public`.
A **do app** é a de hoje, byte a byte. O root layout carrega a pública, e as rotas do app acrescentam a delas. Como
a camada `public` é a mais baixa, quando as duas estão na página a do app decide tudo, em qualquer ordem de carga.
A Geist perde o `preload`, porque nenhuma página pública desenha com ela.

## Technical Context

- Next 16.3.5 (Turbopack), React 19, Tailwind 4.1.18 via `@tailwindcss/postcss` (`postcss.config.mjs` só com esse
  plugin), `tw-animate-css`, `@tailwindcss/typography`.
- O `app/layout.tsx` é transparente. Quem renderiza `<html>` é `app/[locale]/layout.tsx`, que hoje importa
  `../globals.css` e declara Geist (com preload) e Geist Mono (`preload: false`).
- Medição: `medir.cjs` (LCP, `load`, JS, mediana de N) e retratos com `playwright-core` do repositório. Perfil 4G
  lento (150 ms, 1,6 Mbps), CPU 4×, 390×844, contexto frio, `npx next build` + `npx next start`. Não usar
  `npm run build`, que roda `prisma migrate deploy`.
- Sessão para o app: cookie assinado localmente com `SESSION_SECRET` do `.env` para uma conta `isTestAccount`
  (decisão do Jean, Clarifications da spec).

## Constitution Check

`.specify/memory/constitution.md` ainda é o template vazio. Não há princípio a checar.

## Project Structure

### Source Code (arquivos no diff)

```text
app/theme.css                      # NOVO: @custom-variant + @theme inline (movidos do globals.css, linhas 5–48)
app/base.css                       # NOVO: :root/.dark + @layer base + @layer utilities (movidos, linhas 50–917)
app/globals.css                    # folha do app: @layer properties, public; + imports de hoje + theme + base
app/public.css                     # NOVO: folha pública, camada public, @source por pasta
app/[locale]/layout.tsx            # globals.css → public.css; Geist com preload: false
app/[locale]/dashboard/layout.tsx  # + import globals.css
app/[locale]/(admin)/layout.tsx    # + import globals.css
app/[locale]/(ia)/layout.tsx       # + import globals.css
app/[locale]/admin/generative-ui-analytics/page.tsx  # + import globals.css
app/[locale]/checkout/sucesso/page.tsx               # + import globals.css
app/[locale]/debug/page.tsx                          # + import globals.css
__tests__/styles/public-css-guard.test.ts            # NOVO: grafo público ⊆ @source; página do app ⇒ globals.css
```

`data-model.md` e `contracts/`: não se aplicam. A mudança não tem entidade nem interface externa.

## Decisões de implementação

### D1: cascade layer `public` em vez de separar os mundos por root layout

Ver research R2. O problema real é a ordem entre folhas que ficam no documento depois da navegação. A camada
resolve pela cascata, sem mover rota. A condição é que a folha do app contenha tudo o que a pública contém, e isso
é garantido porque ela varre o repositório inteiro, como hoje.

### D2: mover o conteúdo do `globals.css`, não reescrever

`theme.css` e `base.css` são recortes literais do arquivo de hoje. O critério SC-004 é mecânico: compilar o
`globals.css` novo e o de `6ade6a2` e comparar. A única diferença permitida é a declaração da camada.

### D3: o root carrega a pública, e o app acrescenta a sua

Ver research R4. Nenhuma rota fica sem estilo por esquecimento. O custo é a folha pública baixada também no app,
em cache a partir da segunda visita.

### D4: `@source` por pasta, com teste de guarda

Ver research R1. O teste reusa a lógica do `grafo.cjs`: parte das rotas públicas, segue os imports `@/` e
relativos, e falha se um arquivo alcançado estiver fora das pastas do `public.css`. Sem passo de build novo.

### D5: `preload: false` na Geist

Ver research R5. Uma linha. A troca da fonte do site (a Geist nunca foi aplicada) fica fora, e vai para o handoff.

## Complexity Tracking

Nenhuma violação. Dois arquivos de CSS novos são recortes do atual, uma folha nova tem ~25 linhas, há 7 imports
de uma linha e um teste.
