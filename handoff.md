# Handoff: marca aplicada e Geist removida (2026-09-24, manhã, 2ª sessão)

## Estado em uma linha
Dois itens do handoff anterior foram decididos por imagem e estão no ar (`49e7466`, conferido em produção). A
marca "sirius" com o pingo vermelho está no header, na sidebar, no favicon, nos ícones e no OG, e a Geist saiu do
código. O PostHog continua sem chave, e a capa do artigo da API do WhatsApp continua faltando.

## Feito

### 1. Marca em todo o site (`49e7466`)
- O Jean escolheu, por imagem, o **pingo A no vermelho da home** (`#d02d23`) entre três cores. A skill `logo-design`
  veta a estrela de 4 pontas (o `logo.png` antigo), então a pergunta foi só a cor.
- **Header do marketing**: wordmark no lugar de estrela + "Sirius CRM" em texto. **Sidebar do app**: fechada mostra
  os dois pingos; aberta mostra o wordmark, que já tem os pingos, então não há lockup.
- **Ícones** gerados de `components/brand` (script descartável): `app/icon.svg` (cores fixas + modo escuro no
  próprio SVG), `app/favicon.ico` (16 e 32), `app/apple-icon.png` (opaco, sobre o gelo `#f5f7f9`), os 12 PNGs de
  `public/icons/` (maskable: marca dentro de 56%) e `public/logo.png` (logo da Organization no JSON-LD, centro do
  QR, página `/download`).
- **`/og-image.png` criado.** Home, `/pricing`, `/features`, `/about`, `/changelog` e o JSON-LD apontavam para ele,
  e ele dava 404. O root layout usava o `logo.png` quadrado como OG 1200×630 e agora usa o `og-image.png`.
- **OG do blog** (`app/api/og/blog`): saiu o "S" num quadrado roxo, entrou o wordmark sobre o grafite.
- Token `--marca-pingo` em `app/base.css`, que a home sobrescreve com `--pulso`. A geometria do wordmark agora é
  exportada (`WORDMARK_*`) para o `next/og`, que não tem CSS.

### 2. Geist removida (`49e7466`)
- O Jean perguntou o que era. Resposta: é a fonte padrão do Next.js, e nunca desenhou o site. Escolheu apagar.
- Saíram o import, o `--font-sans: var(--font-geist-sans)` do `theme.css` e a classe da área de IA. O texto continua
  na pilha do sistema, que é a mesma que já desenhava. **A Geist Mono ficou**, porque os números do dashboard
  (`Total: R$ 0,00`) desenham com ela.

| Conferido | Local (build) | Produção |
|---|---|---|
| `html` em `ui-sans-serif, system-ui` e nenhuma Geist baixada no público | sim | sim |
| `<head>`: `favicon.ico`, `icon.svg`, `apple-icon.png`; `og:image` = `/og-image.png` | sim | sim |
| Header 1366/390, sidebar aberta e fechada, claro e escuro, `/download`, `/IA` | retratos | retratos |
| `tsc` / vitest / auditoria | 0 / 359 + 1 skip / exit 0 | |

## Achados
- **Outra sessão fez commit no meio desta.** O `9797615` (handoff anterior) levou a remoção do `app/icon.png` e o
  `git mv` do `icon.svg`, que eu tinha deixado no índice. Produção ficou alguns minutos com o favicon SVG nas cores
  antigas. Lição: `git add` só na hora do commit.
- **`/blog` não tem `og:image`**: a página define `openGraph` sem `images` e anula o do root layout.
- **A área de IA (`/IA`) tem marca própria**: um quadrado com gradiente no canto e "Sirius IA". Não foi trocada.
- **`manifest.json` segue com `theme_color: #2563eb`** (azul): a barra do app instalado não usa a cor da marca.
- O modal de boas-vindas diz "Bem-vindo ao Sirius CRM!, Kimi" (ponto de exclamação antes da vírgula).
- Herdados e ainda abertos: o `purchase` nunca dispara (`PurchaseTracker` em `/dashboard/billing`, o Stripe volta
  para `/checkout/sucesso`, valor fixo R$ 49); GA4 manda `en=All Pages` no hit a frio; "+127 empresas" no anuário
  não conferido.

## Próximos passos (em ordem)
1. **PostHog**: nenhuma chave em nenhum `.env` da máquina. O Jean precisa criar o projeto e mandar a chave. O roteiro
   para concluir a troca está no handoff anterior (`git show 9797615:handoff.md`, item 1).
2. **Capa de `whatsapp-api-oficial-meta-crm`** (`/images/blog/…webp`, 404). Os outros artigos usam foto gratuita do
   Unsplash, mas a única de WhatsApp já em uso (`photo-1611746872915-…`) está nos dois artigos relacionados. A busca
   do Unsplash exige chave. Escolher a foto por imagem.
3. **Próxima alavanca de CSS** (spec nova, Spec Kit): a folha pública ainda leva o CSS próprio do `base.css`
   (animações de chat, kanban etc.).
4. **Dashboard não foi medido em desempenho** (baixa também a folha pública).
5. `purchase` quebrado (ver achados), OG do `/blog`, marca da área de IA e `theme_color`.
6. Herdados: textos das 8 faixas → `marketing.json` só se o i18n valer a pena; depoimentos dos 6 pagantes.

## Gotchas do ambiente
- **Sessão da conta de teste em produção funciona**: `sessao.mjs` assina com o `SESSION_SECRET` do `.env` e o
  cookie `session` abre `/dashboard` em `siriuscrm.com.br`. Bloquear `/api/access/*` e `/api/push/*`.
- **`MSYS_NO_PATHCONV=1` quebra caminho `/c/...`** do script: passar o scratchpad como `C:/...`.
- O `sharp` não lê `.ico` (erro esperado). O `favicon.ico` é montado à mão: cabeçalho ICO + PNGs 16/32.
- Herdados: Git Bash converte `/rota` em caminho do Windows; `[locale]` em pathspec é glob (`--literal-pathspecs`);
  `npm run build` roda migrate (usar `npx next build`); push em `main` = deploy (~2 min, desta vez 105 s); o working
  tree tem mudanças de outras sessões (`e2e/`, `.specify/`, `docs/`, `CLAUDE.md`, `scripts/reset-onboarding.ts`).
- Scripts no scratchpad desta sessão: `fontes.cjs` (mesma tela nas duas fontes), `marca.cjs` (quadro de marca
  injetado nas telas reais), `icones.cjs` (todos os ícones + OG), `confere.cjs` (fontes, `<head>`, retratos).
