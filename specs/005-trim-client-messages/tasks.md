# Tasks: Mandar ao navegador só as traduções que ele usa

**Input**: [spec.md](./spec.md) · [plan.md](./plan.md)
**Branch**: `005-trim-client-messages`

---

## Fase 1 — Linha de base (D4)

- [X] **T001** `npx next build` do estado atual. `next start` e medição da home (`/`) e de `/pricing`:
      LCP, FCP, TTFB, HTML cru/transferido, JS, CSS. Mediana de 3.

## Fase 2 — O recorte (US1, US2)

- [X] **T002** [US2] `__tests__/i18n/client-messages.test.ts`: BFS de imports a partir dos `'use client'`,
      extração dos namespaces, falha em arg não literal e em namespace fora da lista, e checagem de que
      toda entrada da lista existe nas mensagens reais. Escrito antes da lista, deve falhar (RED).
- [X] **T003** [US1] `i18n/client-messages.ts`: `CLIENT_MESSAGE_PATHS` + `pickMessages()` com curinga.
      O teste fica verde.
- [X] **T004** [US1] `app/[locale]/layout.tsx`: provider recebe
      `pickMessages(await getMessages(), CLIENT_MESSAGE_PATHS)`.
- [X] **T005** [US2] Prova negativa: um arquivo client temporário com `useTranslations('marketing.pricing')`
      faz o teste falhar e nomear o arquivo. O arquivo é apagado depois (SC-004).

## Fase 3 — Verificação

- [X] **T006** `tsc -p tsconfig.build.json` e a suíte vitest ficam no mesmo estado de antes (SC-005).
- [X] **T007** Build + medição com o mesmo script: HTML −100 kb ou mais (SC-002), e a string de
      `emails` ausente do HTML (US1-1). LCP depois × antes (SC-003).
- [X] **T008** Tela local: menu de features no desktop e no mobile, e uma página do dashboard ou do
      login sem chave crua (US2-4).
- [ ] **T009** Commit + push (deploy) e conferência da TELA em produção (SC-006). Os números vão para
      o `handoff.md`.

## Achados durante a implementação (não previstos no plano)

- **Duas páginas client invisíveis na varredura da spec.** `(marketing)/pricing/page.tsx` e
  `(marketing)/contact/page.tsx` começam com BOM (`EF BB BF`) antes do `'use client'`, e o `head | grep`
  da spec não casou. O teste (que tira o BOM) as pegou no primeiro GREEN. Sem ele, `/pricing` e
  `/contact` iriam ao ar mostrando chaves cruas. As duas entraram na lista, e o SC-001 subiu de 20 para
  26 kb.

- **A prova negativa usou `marketing.about`**, porque `marketing.pricing` passou a estar na lista. Um
  client com `useTranslations('marketing.about')` e outro com `useTranslations(ns)` fizeram o teste falhar,
  nomeando o arquivo.
- **Suíte vitest**: 352 ok, 1 skip, 3 falhas em `__tests__/multi-tenant/deal-isolation.test.ts`. Rodado
  isolado, o arquivo passa (7 ok, 1 skip). É flake de carga: import dinâmico de actions pesadas enquanto
  o `tsc` rodava em paralelo. Não importa nada deste diff.

## Resultado (build de produção local, mesmo script antes/depois)

Perfil: 4G lento (150 ms, 1,6 Mbps / 750 kbps), CPU 4×, viewport 412×823, contexto frio.

| | Antes | Depois | Critério |
|---|---|---|---|
| Mensagens no client (JSON minificado) | 104,4 kb / 32,6 kb gz | 25,1 kb / 8,8 kb gz | SC-001 ≤ 26 kb ✅ |
| HTML da home | 247,4 kb cru / 65,4 kb gz | 160,8 kb / 41,1 kb gz | SC-002 −100 kb ❌ (−86,6 kb) |
| Flight RSC da home | 191 kb | 106 kb | — |
| HTML de `/pricing` | 216,4 kb / 51,6 kb transf. | 131,8 kb / 27,5 kb transf. | — |
| Frase de `emails` no HTML | presente | ausente | US1-1 ✅ |
| LCP da home, mediana de 7 | 3,92s (2,7 a 5,3) | 4,54s (2,6 a 6,4) | SC-003 ❌ (ruído > efeito) |
| LCP de `/pricing`, mediana de 3 | 2,29s | 2,25s | — |
| Chave crua / `MISSING_MESSAGE` | — | 0 em 6 páginas × 2 larguras, e o menu de features com 4/4 nomes | US2 ✅ |

- **SC-002 não bateu**, por erro de estimativa da spec. Os 133 kb eram arquivos formatados. O objeto
  real é 104 kb minificado, e o client precisa de 25 kb dele: o teto era ~87 kb, e a mudança entregou 86,6.
- **SC-003 não bateu, e a causa não são as mensagens.** Tirar 24 kb gz vale ~120 ms nesse link, abaixo
  do ruído. Na corrida de diagnóstico, FCP = LCP (`p.abertura__lide`) e a primeira pintura espera por:
  1. **Fontes x CSS bloqueante.** Seis woff2 pré-carregados (~287 kb: Bricolage variável com
     `opsz`+`wdth` de 128 kb, EB Garamond em latin+greek × normal+italic, e Geist do root layout)
     começam aos 230 ms e dividem o link com o CSS global de 53 kb, que só termina aos 1,8s.
  2. **Uma tarefa longa de ~2,5s** (hidratação com CPU 4×) logo depois. Quando ela entra antes da
     pintura, o LCP vai a ~5s. É a fonte da variância.

  As duas alavancas ficam para a próxima spec. A primeira mexe na tipografia aprovada da direção.

## Fora de escopo (decidido, não esquecido)

- CSS global de 447 kb / 54 kb gz: vira spec própria se o LCP não fechar.
- Recorte por grupo de rotas para tirar `components` do marketing (plano D1).
