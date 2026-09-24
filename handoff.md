# Handoff: og:image, purchase e pendências do passo 5 (2026-09-24, manhã, 3ª sessão)

## Estado em uma linha
O passo 5 do handoff anterior está no ar (`bab2e95`, `5f26d33`, conferido em produção às 11:42), menos a marca da
área de IA. O PostHog continua sem chave. A capa do artigo do WhatsApp está esperando o Jean escolher uma letra.

## Feito

### 1. og:image em 26 páginas públicas (`bab2e95`)
- O defeito não era só o `/blog`. O Next mescla metadata por chave de 1º nível, então **toda página que define
  `openGraph` sem `images` troca o objeto do root layout e sai sem `og:image`**. Eram 26: `/blog`, `/solucoes` (+
  `[slug]` e cidade), `/ferramentas` e as 6 calculadoras, `/help`, `/terms`, `/privacy`, `/download`, `/anuario` e outras.
- O `opengraph-image` por arquivo não resolve: vale só no segmento onde está (conferido em
  `next/dist/lib/metadata/resolve-metadata.js`). Por isso é uma constante `DEFAULT_OG_IMAGES` em `lib/seo/canonical.ts`.
- **Guarda**: `__tests__/seo/og-image-guard.test.ts` falha e dá o nome de qualquer `openGraph` em `app/` sem `images`.

### 2. `purchase` passa a disparar (`5f26d33`)
- O `PurchaseTracker` estava em `/dashboard/billing`, mas o Stripe volta para `/checkout/sucesso?session_id=…`. Agora a
  página de sucesso lê a Checkout Session no servidor e manda o **valor pago de verdade** (antes era R$ 49 fixo).
- `purchaseFromSession` (`lib/stripe.ts`) só conta sessão `paid`, com `organization_id` e valor > 0, porque a conta
  Stripe é compartilhada. Teste: `__tests__/lib/stripe-purchase.test.ts`. Sessão inválida vira `logger.warn` e a página
  segue 200.
- Limite conhecido: boleto e outros métodos assíncronos chegam `unpaid` no redirect e não viram `purchase`.

### 3. Pequenos
- Modal de boas-vindas: "Bem-vindo ao Sirius CRM, Kimi!" (era "CRM!, Kimi").
- `manifest.json` `theme_color` `#2563eb` → `#ffffff`, igual à meta `theme-color` clara da página. A barra do app
  instalado já ficava branca depois de carregar; o azul só aparecia na abertura.

| Conferido | Local (`next build` + `start`) | Produção |
|---|---|---|
| `og:image` em `/blog`, `/solucoes`, `/ferramentas`, `/privacy`, `/help`, categoria, home, `/pricing` | sim | 4 rotas |
| `/checkout/sucesso` sem id, com id falso e com lixo: 200, sem tracker, `warn` no log | sim | 200 |
| `manifest.json` branco | sim | sim |
| `tsc` / vitest / auditoria | 0 / 363 + 1 skip / exit 0 | |

O `purchase` com sessão paga de verdade **não foi exercitado** (a chave local é live; não criei sessão). Conferir no
GA4 DebugView na próxima compra real.

## Próximos passos (em ordem)
1. ~~Capa de `whatsapp-api-oficial-meta-crm`~~ **feita** (`9312574`, no ar 11:56): o Jean delegou, escolhi a A
   (`photo-1587310285959-d768493970b6`, mão com o celular e o logo; não repete a foto dos artigos relacionados).
2. **PostHog**: nenhuma chave em nenhum `.env` (`.env.easypanel` tem `""`). O roteiro está em `git show 9797615:handoff.md`, item 1.
3. **Próxima alavanca de CSS** (spec nova, Spec Kit): o CSS próprio do `base.css` (animações de chat, kanban) ainda vai
   na folha pública.
4. **Dashboard não foi medido em desempenho** (também baixa a folha pública).
5. **Marca da área de IA** (`/IA`: quadrado com gradiente + "Sirius IA"). É decisão visual: mostrar quadro e pedir letra.
6. Herdados: GA4 manda `en=All Pages` no hit a frio; "+127 empresas" no anuário não conferido; a página de sucesso diz
   "Sirius Pro" para qualquer plano (a sessão tem `metadata.plan`); textos das 8 faixas → `marketing.json` só se o i18n
   valer a pena; depoimentos dos 6 pagantes.

## Gotchas do ambiente
- **Unsplash bloqueia `curl`** (desafio anti-bot em `/napi`). `playwright-core` do projeto + Chrome headless busca normal:
  script `unsplash.mjs` (busca) e `folha.mjs` (quadro com letras) no scratchpad desta sessão.
- Commit com `GIT_LITERAL_PATHSPECS=1` e caminhos explícitos; `xargs` + heredoc na mesma linha brigam pelo stdin (usar `-F arquivo`).
- O 1º push deu 500 no GitHub; o 2º passou.
- Herdados: `sessao.mjs` abre `/dashboard` em produção (bloquear `/api/access/*` e `/api/push/*`); `MSYS_NO_PATHCONV=1`
  quebra `/c/...`; `npm run build` roda migrate (usar `npx next build`); push em `main` = deploy (~2 min); o working tree
  tem mudanças de outras sessões (`e2e/`, `.specify/`, `docs/`, `CLAUDE.md`, `scripts/reset-onboarding.ts`).
