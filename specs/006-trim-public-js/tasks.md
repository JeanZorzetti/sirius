# Tasks: Página pública só baixa o JavaScript que usa

**Input**: [spec.md](./spec.md) · [plan.md](./plan.md)
**Branch**: `006-trim-public-js`

---

## Fase 1 — Linha de base

- [X] **T001** Medição do build `d5b9d8c` com `medir.cjs`: `/` 7×, `/pricing` 3×, `/blog` 3× (LCP, `load`, JS,
      total). Trace com `perfil.cjs` em `/`, `/pricing` e `/blog`. Números no Contexto da spec.

## Fase 2 — Blog (US1)

- [X] **T002** [US1] `git mv` de `app/[locale]/(marketing)/blog/page.tsx` para `components/blog/blog-index.tsx`.
      Trocar `blogPosts` pela prop `posts: BlogCard[]` e `getAllCategories()`/`slugifyCategory()` pela prop
      `categoryLinks`. Nenhum import de `@/lib/blog-data` (D2, D3).
- [X] **T003** [US1] `app/[locale]/(marketing)/blog/page.tsx` novo, de servidor: monta os cartões (D1) e as
      categorias, e renderiza `<BlogIndex />`.

## Fase 3 — Root layout (US2)

- [X] **T004** [US2] `app/[locale]/layout.tsx`: sai `PWAInstallPrompt`, `PushNotificationManager` e
      `OfflineStatus` (FR-004).
- [X] **T005** [US2] `components/dashboard/dashboard-shell-client.tsx`: entra `PushNotificationManager` com
      `dynamic(..., { ssr: false })` (FR-005).
- [X] **T006** [US2] Apagar `components/offline-status.tsx` e `lib/offline-queue.ts` (FR-006, D4).

## Fase 4 — Verificação

- [X] **T007** `tsc -p tsconfig.build.json`, vitest e `audit-dead-code.js --check` no mesmo estado de antes
      (SC-005).
- [X] **T008** `npx next build` + `next start`. Os scripts de `/blog` não contêm `callout-formula` e os da home
      não contêm os três textos da US2 (US1-1, SC-003). Medição com o mesmo script: SC-001, SC-002, SC-004.
- [X] **T009** Tela local de `/blog` (retrato em 1366, capturas em 360, 768 e 1440): 46 posts, filtro por categoria com a mesma contagem de antes,
      links de categoria iguais (US1-2, US1-3).
- [X] **T010** Commit + push (deploy) e conferência da TELA em produção (SC-006). Os números vão para o
      `handoff.md`.

## Achados durante a implementação (não previstos no plano)

- **O git não vê o `git mv`**, porque o caminho antigo ganhou um `page.tsx` novo no mesmo commit. Com detecção
  de cópia aparece: `git diff -C -C` e `git log -C -C --follow components/blog/blog-index.tsx` mostram
  `page.tsx => components/blog/blog-index.tsx` com 25 linhas mudadas.
- **Os campos EN são 11 kb crus dos 31 kb que os cartões somam ao payload RSC.** Os 46 posts têm `titleEn` e
  `excerptEn`. Ficaram (spec, Assumptions): tirar exige apagar os ramos `isEn` do componente, e o EN
  aposentado ainda tem ramos assim no app inteiro. É outra limpeza.
- **Uma corrida de 7 da home deu `load` de 3.221 ms.** Nas 5 seguintes o valor ficou entre 2.652 e 2.719 ms. Foi
  ruído da máquina, e a mudança não mexe no que dispara o `load` da home.
- **Defeitos pré-existentes, confirmados em produção antes deste diff.** Ficam fora porque o FR-003 proíbe mudar
  o visível, e cada um vira tarefa própria:
  1. `/blog` estoura 120 px na horizontal a 360 px. A causa é o blur decorativo do hero (`w-150` = 600 px,
     centrado com `-translate-x-1/2`).
  2. A capa de `whatsapp-api-oficial-meta-crm` (`/images/blog/whatsapp-api-oficial-meta-crm.webp`) não existe
     em `public/`, e o `/_next/image` responde 400 no `/blog`.
  3. Os chips do filtro são `Badge` (`div`) com `onClick`, e o Tab não chega neles. Os links de categoria logo
     abaixo são alcançáveis e levam às páginas de categoria.
  4. O atraso da animação dos cartões é `índice × 100 ms`, contado da página inteira: o 45º cartão espera
     4,4s para aparecer, mesmo se já estiver na tela.
  5. O "g" do h1 "Blog" sai cortado embaixo (`bg-clip-text text-transparent` recorta o descendente).

## Resultado (build de produção local, mesmo script antes/depois)

Perfil: 4G lento (150 ms, 1,6 Mbps / 750 kbps), CPU 4×, 390×844, contexto frio.

| | Antes | Depois | Critério |
|---|---|---|---|
| `/blog`: JS transferido | 940 kb | 555 kb | SC-001 −350 kb ✅ (−385) |
| `/blog`: `load`, mediana de 3 | 5.171 ms | 3.360 ms | SC-002 −1,5s ✅ (−1,81s) |
| `/blog`: LCP, mediana de 3 | 2.100 ms | 2.116 ms | SC-004 ✅ (dentro do ruído) |
| `/blog`: HTML | 398 kb / 43,0 kb gz (produção) | 429 kb / 49,3 kb gz | +6,3 kb gz: os 46 cartões no payload RSC |
| Corpo de artigo (`callout-formula`) em algum chunk | 1 chunk de 381 kb gz | nenhum | US1-1 ✅ |
| Tela de `/blog`: posts, ordem, 10 filtros e contagens, 9 links, chave crua | — | idêntica ao build anterior | US1-2, US1-3 ✅ |
| Cartões animados depois de rolar (360 / 768 / 1440) | — | 45/45 nas três | hidratação ✅ |
| Home: JS inicial moderno (gz, sem o polyfill `noModule`) | 192.898 B (16 scripts) | 185.476 B (15) | SC-003 ✅ (−7,4 kb) |
| Home: textos da US2 nos scripts | 3 | 0 | SC-003 ✅ |
| Home: JS transferido | 516 kb | 507 kb | — |
| Home: LCP | 2.164 ms (7×) | 2.076 ms (7×), 2.140 ms (5×) | SC-004 ✅ |
| Home: `load` | 2.733 ms (3×) | 2.707 ms (5×) | — |
| `/pricing`: LCP / JS | 2.176 ms / 563 kb | 2.164 ms / 557 kb | — |
| `tsc -p tsconfig.build.json` | 0 erros | 0 erros | SC-005 ✅ |
| vitest | 352 ok, 1 skip, 3 flakes de carga (registro da spec 005) | 355 ok, 1 skip | SC-005 ✅ |
| `audit-dead-code.js --check` | exit 0 | exit 0 | SC-005 ✅ |

## Produção (T010, `289cc88`, deploy em ~2,7 min)

- A tela de `/blog` em `siriuscrm.com.br` bateu com o retrato do build anterior: 46 posts, ordem, 10 filtros
  com as mesmas contagens, 9 links de categoria e zero chave crua.
- Os scripts servidos em `/` (15) e `/blog` (19) não têm corpo de artigo nem os textos da US2.
- Nas seis combinações (`/`, `/pricing` e `/blog` × 1366 e 390 px): zero chave crua, um h1 e nenhum erro novo. O
  único erro é o 400 da capa, que já existia.
- JS transferido em produção, sem limite de rede e com o GTM: home 480 kb, `/pricing` 522 kb, `/blog` 521 kb.
- **Não conferido na tela: o dashboard**, porque exige sessão. A mudança nele é de ponto de montagem
  (`DashboardShellClient`), e o build e os tipos cobrem.

## Fora de escopo (decidido, não esquecido)

Os números estão nas Clarifications da spec.

- `Toaster` no root (11,5 kb gz): o sonner não reproduz toast disparado antes de montar.
- Geist pré-carregada na home (29 kb, ~145 ms nesse perfil): é decisão de design.
- GTM + gtag: 296 kb e ~1s de thread principal (CPU 4×) em toda página, depois do `load`. Tirar ou adiar o GA4
  é decisão de negócio.
- `app/error.tsx` com `Button`: mantém o `tailwind-merge` (8,4 kb gz) na home.
- CSS global de 48,6 kb gz, bloqueante: um CSS só do marketing teria 28,1 kb gz (estimativa com
  `@tailwindcss/postcss` e `@source` limitado). É a maior alavanca que resta para o LCP de toda página pública.
