# Implementation Plan: Página pública só baixa o JavaScript que usa

**Branch**: `006-trim-public-js` | **Date**: 2026-09-23 | **Spec**: [spec.md](./spec.md)

## Summary

Duas mudanças independentes, com o mesmo instrumento de medida. (1) O índice do blog vira server component: lê
`blogPosts` no servidor e passa ao client só os campos do cartão. (2) O root layout para de montar os três
componentes do app logado. O push passa a ser montado pelo `DashboardShellClient`, que já monta o prompt de
instalação, e o `OfflineStatus` e a fila sem escritor são apagados.

## Technical Context

- Next 16.3.5 (Turbopack), next-intl 4.8.3, React 19. O `DashboardShellClient` já usa
  `dynamic(() => import(...), { ssr: false, loading: () => null })` para 7 componentes. O push entra como o 8º.
- `useTranslations` em server component síncrono lê a configuração do servidor (spec 005, Edge Cases). O
  componente client do blog continua com `useTranslations('marketing.blog')`, que já está em
  `CLIENT_MESSAGE_PATHS`. O teste de cobertura da spec 005 segue o arquivo novo sozinho, porque varre todo
  `'use client'`.
- Medição: `medir.cjs` (o mesmo script da spec 005, acrescido do `loadEventEnd`) e `perfil.cjs` (trace da thread
  principal). Os dois vivem no scratchpad da sessão. O perfil é 4G lento, CPU 4×, 390×844, contexto frio,
  `next build` + `next start` local.

## Constitution Check

`.specify/memory/constitution.md` ainda é o template vazio. Não há princípio a checar.

## Project Structure

### Source Code (arquivos no diff)

```text
app/[locale]/(marketing)/blog/page.tsx         # vira server: lê blogPosts, monta cartões e categorias
components/blog/blog-index.tsx                 # NOVO ('use client'): o corpo da página de hoje, com props
app/[locale]/layout.tsx                        # sai PWAInstallPrompt, PushNotificationManager, OfflineStatus
components/dashboard/dashboard-shell-client.tsx  # entra PushNotificationManager (dynamic, ssr:false)
components/offline-status.tsx                  # APAGADO
lib/offline-queue.ts                           # APAGADO
```

## Decisões de implementação

### D1 — Recorte explícito do cartão, não `Omit<BlogPost, 'content'>`

`Omit` passaria `keywordsEn`, `relatedSlugs`, `author` e `lastModified`, que o cartão não lê, e qualquer campo
pesado que alguém acrescente ao post no futuro iria junto. Um `Pick` com os 8 campos faz o TypeScript cobrar no
servidor o que o cartão precisa, e só isso.

### D2 — Slug de categoria calculado no servidor

`slugifyCategory` mora em `lib/blog/index.ts`, o mesmo módulo que importa os 46 posts. Importá-la no client
traria o acervo de volta. O servidor manda `categoryLinks: { name, slug }[]` e o client não importa nada de `@/lib/blog-data`.
O teste de guarda é o critério de aceite 1 da US1: a classe `callout-formula` não pode aparecer em nenhum script.

### D3 — Mover o corpo da página, não reescrever

O client novo é o `page.tsx` de hoje com três trocas: `blogPosts` vira prop, `getAllCategories()` +
`slugifyCategory()` viram a prop de categorias, e o nome da função muda. O markup, as classes e a animação ficam
iguais. Com detecção de cópia (`git diff -C -C`) o diff mostra só as trocas. Ver Achados em `tasks.md`.

### D4 — Apagar em vez de mover o `OfflineStatus`

Sem nenhum chamador de `queueAction()`, o contador fica sempre em zero, e o componente se reduz a um aviso de
offline que o `NetworkStatusBanner` já mostra no dashboard. Movê-lo para o dashboard deixaria dois avisos de
offline lá. `lib/offline-queue.ts` só é importada por ele.

## Complexity Tracking

Nenhuma violação. Um arquivo novo que é um `git mv`, dois apagados, e ~10 linhas mudadas no layout e no shell.
