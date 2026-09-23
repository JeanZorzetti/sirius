# Implementation Plan: Mandar ao navegador só as traduções que ele usa

**Branch**: `005-trim-client-messages` | **Date**: 2026-09-23 | **Spec**: [spec.md](./spec.md)

## Summary

O root layout passa a entregar ao `NextIntlClientProvider` um recorte das mensagens, e não o objeto
inteiro. Esse recorte é uma lista de caminhos com curinga. Um teste vitest percorre o grafo de imports a
partir de todo `'use client'` e cobra que cada `useTranslations('ns')` alcançado esteja coberto pela lista.

## Technical Context

- Next 16.3.5, next-intl 4.8.3. O `NextIntlClientProviderServer` faz `messages: void 0 === v ? await
  getMessages() : v`, ou seja, com `messages` explícito não herda nada (verificado em
  `node_modules/next-intl/dist/esm/production/react-server/NextIntlClientProviderServer.js`).
- Vitest 4 com happy-dom e alias `@` → raiz. Os testes moram em `__tests__/`.
- Medição: `playwright-core` do próprio repo, CDP (150 ms, 1,6 Mbps / 750 kbps, CPU 4×), viewport mobile
  412×823, contexto frio por corrida, mediana de 3, `next build` + `next start` local.

## Constitution Check

`.specify/memory/constitution.md` ainda é o template vazio. Não há princípio a checar.

## Project Structure

### Source Code (arquivos no diff)

```text
i18n/client-messages.ts                  # NOVO: lista + pickMessages()
app/[locale]/layout.tsx                  # usa pickMessages(await getMessages(), CLIENT_MESSAGE_PATHS)
__tests__/i18n/client-messages.test.ts   # NOVO: grafo de imports × lista
```

## Decisões de implementação

### D1 — Uma lista global, não um provider por grupo de rotas

Os providers aninhados substituem as mensagens, não somam. Um recorte por grupo teria de repetir `common`
em cada um, e o teste precisaria saber sob qual provider cada componente renderiza. Uma lista global
resolve com um arquivo. Teto conhecido: `components` (9,3 kb) viaja também nas páginas de marketing.
Vira upgrade se medir.

### D2 — Curinga só onde o ganho paga

`marketing.features.sections` tem 21,3 kb, e os menus leem só `<seção>.<feature>.name` (1,6 kb). Entra
como `marketing.features.sections.*.*.name`. O teste aceita um namespace coberto por projeção quando ele é
o prefixo estático da entrada (`marketing.features.sections`). Chave dinâmica não se verifica
estaticamente, e por isso a US2 pede conferência visual do menu.

### D3 — O teste segue imports, não só a diretiva

`edit-contact-dialog.tsx`, `create-deal-dialog.tsx`, `task-checklist.tsx`, `time-tracker-widget.tsx` e
`template-editor.tsx` não têm `'use client'`, mas rodam no client porque um client os importa. Olhar só
a diretiva deixaria passar. Por outro lado, varrer **todo** arquivo cobraria `(marketing)/layout.tsx`,
`(carta)/page.tsx` e o footer, que são servidor, e a lista voltaria a ter 60+ kb. *(Correção na
implementação: `contact/page.tsx` e `pricing/page.tsx` estavam nessa lista por engano. São client, com
BOM antes da diretiva. Ver tasks.md, Achados.)* BFS a partir
dos `'use client'` de `app/`, `components/`, `hooks/` e `lib/`, resolvendo `@/` e caminhos relativos.

### D4 — Medir antes de mexer

O LCP de 4,9s do handoff saiu de um script que não existe mais. O "antes" é remedido com o script novo,
no mesmo build, para a comparação ser do mesmo instrumento.

## Complexity Tracking

Nenhuma violação. São 2 arquivos novos (~30 linhas de código e ~70 de teste) e 2 linhas no layout.
