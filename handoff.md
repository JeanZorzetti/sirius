# Handoff: JS das páginas públicas, spec 006 (2026-09-24, madrugada)

## Estado em uma linha
O passo 1 do handoff anterior ("LCP e JS do app inteiro") virou a spec 006, e a medição mudou o alvo. O LCP não
espera a hidratação do root layout: espera o CSS global, que só termina de chegar junto com todos os outros bytes.
O `/blog` parou de baixar o texto dos 46 artigos (JS de 940 para 555 kb, `load` de 5,2 para 3,4s), e o root
layout parou de montar UI de app logado em página pública. Está em produção (`289cc88`). Falta decidir quatro
coisas, e os números de cada uma estão abaixo.

## Contexto
- **Não existe dado de campo.** O CrUX devolve 404 para a origem e para a URL, por tráfego baixo. O PageSpeed
  recusou: a cota anônima estava esgotada, e a `CRUX_API_KEY` do roihub não tem essa API. O instrumento é o
  laboratório local: build de produção, 4G lento (150 ms, 1,6 Mbps), CPU 4×, 390×844.
- **O trace refutou a hipótese do handoff anterior.** Em `/`, `/pricing` e `/blog`, FCP = LCP (1,9–2,3s) e o JS
  roda **depois** da primeira pintura. A pintura espera o CSS global (53 kb gz, bloqueante). Ele termina aos
  ~1,8s porque divide o link com o HTML, as fontes e os scripts `async`, e depois vêm ~400–500 ms de estilo e
  layout. **Todo byte que sai da janela inicial adianta o LCP**, mesmo o de um script que só roda depois.
- Spec completa, com antes/depois e achados: [specs/006-trim-public-js/](specs/006-trim-public-js/).

## Feito (`289cc88`)

### 1. `/blog` sem o acervo
- O índice era `'use client'` e importava `blogPosts`, e cada post traz `content`/`contentEn` (1,6 MB em
  `lib/blog/posts/`). Toda visita baixava 381 kb gz para desenhar 46 cartões, e a página só hidratava aos 5,2s.
- Agora [app/[locale]/(marketing)/blog/page.tsx](app/[locale]/(marketing)/blog/page.tsx) é de servidor e passa
  só os 8 campos do cartão a [components/blog/blog-index.tsx](components/blog/blog-index.tsx) (o corpo antigo
  da página). **O client não pode importar nada de `@/lib/blog-data`**, nem `slugifyCategory`, porque o módulo
  arrasta os 46 posts. Os slugs de categoria chegam por prop.
- As páginas de post já eram de servidor e estavam limpas.

### 2. Root layout sem UI de app logado
- `PWAInstallPrompt` já era carregado pelo `DashboardShellClient`: **no dashboard havia dois**. Saiu do root.
- `PushNotificationManager` pedia push a visitante anônimo, e o `subscribe` exige sessão (401). Foi para o
  `DashboardShellClient`, com `dynamic(..., { ssr: false })`.
- `OfflineStatus` e `lib/offline-queue.ts` foram **apagados**. Ninguém chamava `queueAction()`, então a fila
  `sirius-offline-queue` nunca era gravada, e o aviso de offline do dashboard já é o `NetworkStatusBanner`
  (fila real em `lib/mobile/offline`).
- O prompt de instalação não aparece mais em página pública. O manifest abre em `/dashboard`, então instalar a
  partir de um post levava ao login.

## Medido

| | Antes | Depois |
|---|---|---|
| `/blog`: JS transferido | 940 kb | 555 kb (em produção, 521 kb) |
| `/blog`: `load` | 5.171 ms | 3.360 ms |
| `/blog`: LCP | 2.100 ms | 2.116 ms (ruído) |
| `/blog`: HTML | 43,0 kb gz | 49,3 kb gz (os cartões no payload RSC) |
| Home: JS inicial (gz, sem o polyfill `noModule`) | 192,9 kb | 185,5 kb |
| Home: LCP, mediana de 7 | 2.164 ms | 2.076 ms |
| `tsc` build / vitest / auditoria de código morto | 0 / ok / exit 0 | 0 / 355 ok + 1 skip / exit 0 |

Produção conferida na tela: `/`, `/pricing` e `/blog` em 1366 e 390 px, zero chave crua, e a tela do `/blog`
idêntica ao retrato do build anterior. **O dashboard não foi conferido**, porque exige sessão.

## Números do rodapé (passo 5 do handoff anterior) — conferidos
`marketing.json` → `about.description` aparece no **rodapé de toda página pública**, inclusive na home. Leitura
do banco de produção em 24/09, 00:05, sem as 4 contas de teste (`isTestAccount`):

| O texto diz | O banco tem | Veredito |
|---|---|---|
| "mais de 100 empresas" | 108 contas, das quais 26 criaram um deal próprio | verdadeiro como cadastro; "utilizada por" é generoso |
| "110 usuários" | 116 | verdadeiro |
| "mais de 950 negócios" | 928 deals, dos quais **681 criados pelos clientes** (os outros 247 são os exemplos do cadastro) | **falso** |
| Starter R$67, Pro R$147, Business R$397 | igual a `pricing.tiers.*.price_monthly` | verdadeiro |

O texto **não foi mudado**. A redação é decisão do Jean: "mais de 650 negócios criados pelos clientes" é
verdadeiro hoje.

## Próximos passos (em ordem)
1. **Quatro decisões do Jean, com número pronto:**
   - **GA4 via GTM**: 296 kb e ~1s de thread principal (CPU 4×) em toda página, depois do `load`. Não pesa no
     LCP. Pesa no INP de quem toca a tela entre 5 e 8s. As opções são manter, adiar para a primeira interação
     ou trocar pelo PostHog, que já está no ar.
   - **CSS por grupo de rotas**: um CSS só do marketing cairia de 48,6 para 28,1 kb gz (estimativa com
     `@tailwindcss/postcss` e `@source` limitado). **É a maior alavanca de LCP que resta em toda página
     pública.** Vira a spec 007 se aprovado. O risco é o visual do dashboard.
   - **Geist pré-carregada na home** (29 kb, ~145 ms): a home não usa. Tirar custa FOUT nas outras páginas, ou
     reestruturar os root layouts.
   - **O "950 negócios" do rodapé** (tabela acima).
2. **Defeitos do `/blog` que já existiam** (confirmados em produção, fora da 006 porque ela não podia mudar o
   visível):
   - estouro horizontal de 105–120 px a 360/390 px, causado pelo blur do hero (`w-150` = 600 px);
   - a capa de `whatsapp-api-oficial-meta-crm` (`/images/blog/whatsapp-api-oficial-meta-crm.webp`) não
     existe, e dá 400 no `/_next/image`;
   - os chips do filtro são `div` com `onClick`, fora do alcance do Tab;
   - a animação dos cartões atrasa `índice × 100 ms`, e o 45º espera 4,4s;
   - o "g" do h1 "Blog" sai cortado (`bg-clip-text`).
3. **Espalhar a marca** (continua do handoff anterior; histórico em `3a9c6ed`):
   - o header de [app/[locale]/(marketing)/layout.tsx](app/[locale]/(marketing)/layout.tsx) ainda usa
     `/logo.png`;
   - favicon, `apple-icon` e OG (o `/og-image.png` citado no JSON-LD **não existe** em `public/`);
   - os ícones de PWA.

   Escolha visual é por imagem: mostrar quadros e pedir uma letra.
4. **Texto das 8 faixas e dos planos da home** (hoje em `(fluxo)/page.tsx`): mover para `marketing.json` só se
   o padrão de i18n valer a pena. O EN foi aposentado (spec 004), então hoje não há um segundo locale.
5. **Prova social real:** pedir depoimentos aos 6 pagantes (Cartopel, 3A3, Wordseg, VOE, London Finance e Boxer).

## Pendências / decisões em aberto (herdadas)
- **Levar o Fluxo para as outras páginas de marketing?** Só se o Jean pedir. Nesse caso, promover os tokens de
  `(fluxo)/fluxo.css` para o global, e `design-systems` formaliza.
- **360×640 na home:** o texto do hero ocupa a primeira tela e o campo começa na dobra.
- **O botão da nav da home** vem de `hero.ctaNav`. Se a nav compartilhada virar caixa de frase, apagar essa chave.
- **Tetos conhecidos da 006:** o `Toaster` (11,5 kb gz) fica no root, porque o sonner 2.0.7 não reproduz toast
  disparado antes de montar. O `app/error.tsx` usa `Button`, e isso mantém o `tailwind-merge` (8,4 kb gz) na
  home. O canvas do campo gera uma tarefa de ~790 ms (quase toda `Commit`) depois do `load` da home. Essa é da
  direção de arte.

## Gotchas do ambiente
- **`[locale]` num pathspec do git é glob.** Usar `git --literal-pathspecs add` e conferir `git diff --cached --stat`.
- **`git mv` seguido de um arquivo novo no caminho antigo esconde o rename.** Usar `git diff -C -C` e
  `git log -C -C --follow` para ver a cópia.
- **`npm run build` roda `prisma migrate deploy`.** Para build local, usar `npx next build` (~1,5–3 min).
- **`TaskStop` no `npx next start` não mata o node filho.** Matar pelo dono da porta (`Get-NetTCPConnection -LocalPort <p>`).
- **`@tailwindcss/postcss` guarda o compilador em cache pelo caminho do `from`.** Para comparar variações do CSS
  no mesmo processo, dar um `from` diferente a cada uma, senão o resultado sai idêntico.
- **O Playwright MCP não conectou nesta sessão** (timeout). As provas foram feitas com `playwright-core` do
  próprio repo.
- **`next dev` 16.3 acrescenta ao `CLAUDE.md`** um bloco `nextjs-agent-rules`. Está não-commitado no working tree.
- **Push em `main` = deploy** (~2,7 min nesta sessão). Conferir a TELA, não só o HTTP 200.
- **O working tree tem mudanças de outras sessões** (`e2e/`, `.specify/`, `docs/`, `scripts/reset-onboarding.ts`).
  Nunca usar `git add -A` sem pathspec.
- Os scripts de medida vivem no scratchpad da sessão: `medir.cjs` (LCP, `load`, JS, mediana de N), `perfil.cjs`
  (trace da thread principal), `blog-tela.cjs` (retrato do `/blog`), `verifica-blog.cjs` e `tw-fontes.mjs`
  (tamanho do CSS por `@source`).
