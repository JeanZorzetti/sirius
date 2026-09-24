# Feature Specification: Página pública só baixa o JavaScript que usa

**Feature Branch**: `006-trim-public-js`

**Created**: 2026-09-23

**Status**: Draft

**Input**: Passo 1 do `handoff.md` de 23/09 (home "Fluxo"): "LCP e JS do app inteiro, com `web-performance`". A
hipótese do handoff era que o LCP esperava a hidratação do root layout (PostHog, Theme, PWA×3, Toaster,
AiTrafficMonitor, GTM).

## Contexto

Medição de 23/09, build de produção local (`d5b9d8c`), 4G lento (150 ms, 1,6 Mbps / 750 kbps), CPU 4×,
390×844, contexto frio. Não há dado de campo: o CrUX devolve 404 para a origem e para a URL (tráfego baixo), e
o PageSpeed recusou (cota diária esgotada, e a chave do roihub não tem essa API).

**A hipótese do handoff não se sustenta.** Trace da thread principal, 3 corridas na home e 1 em `/pricing` e
`/blog`: o JS roda **depois** da primeira pintura (a avaliação do react-dom começa aos ~2,5s, e o FCP foi de
2,1–2,3s). A pintura espera o CSS global (53 kb gz, bloqueante), que termina aos ~1,7–1,9s porque divide o link
com todo o resto pedido no mesmo instante: HTML, fontes pré-carregadas e os 16 scripts `async`. Depois disso vêm
~400–500 ms de estilo e layout. **Todo byte que sai da janela inicial adianta o LCP**, mesmo o de um script que
só roda depois.

| Página | LCP (mediana) | `load` | JS transferido | O que pesa |
|---|---|---|---|---|
| `/` | 2.164 ms (7×) | 2.733 ms | 516 kb | 193 kb gz de chunks na abertura (136 kb são o framework) |
| `/pricing` | 2.176 ms (3×) | — | 563 kb | igual à home |
| `/blog` | 2.100 ms (3×) | **5.171 ms** | **940 kb** | um chunk de **381 kb gz / 1,5 MB** com o texto dos 46 artigos |
| `/blog/roi-de-crm` | — | — | 269 kb (só `_next`) | limpo |

**Achado 1 — o índice do blog baixa o acervo inteiro.** `app/[locale]/(marketing)/blog/page.tsx` é
`'use client'` e importa `blogPosts` de `@/lib/blog-data`. Cada post traz `content` e `contentEn`
(`lib/blog/posts/`, 1,6 MB). A página usa 8 campos de cada post para desenhar o cartão. Como o chunk é `async`,
o LCP não muda, mas `/blog` só hidrata (filtro de categoria, animação dos cartões) quando os 381 kb chegam: o
`load` vem aos 5,2s. As páginas de post são de servidor e não carregam o chunk.

**Achado 2 — o root layout monta, em toda página, UI de quem está logado.**
`app/[locale]/layout.tsx` renderiza, fora do dashboard também:

| Componente | O que faz | Por que não serve à página pública |
|---|---|---|
| `PWAInstallPrompt` | banner "Instalar Sirius CRM" 30s depois do `beforeinstallprompt` | o manifest abre em `/dashboard`. E o `DashboardShellClient` **já** o carrega depois da pintura, ou seja, no dashboard há **dois** banners |
| `PushNotificationManager` | pede permissão de push aos 60s | `POST /api/push/subscribe` exige sessão. Um visitante que aceita recebe um 401 e o alerta "Erro ao ativar notificações" |
| `OfflineStatus` | aviso de offline + contador de uma fila em IndexedDB, consultada a cada 10s | ninguém chama `queueAction()`, e a fila `sirius-offline-queue` nunca é gravada. O dashboard já mostra o aviso real (`NetworkStatusBanner`, fila `lib/mobile/offline`) |

Os três moram no mesmo chunk (15 kb gz) do GTM, do PostHog e do AiTrafficMonitor. Com eles vêm `Button`,
`Card`, ícones e `lib/offline-queue`.

## Clarifications

### Session 2026-09-23

- Q: O `Toaster` (sonner, 11,5 kb gz) também sai do root? → A: **Não.** O sonner 2.0.7 inicia o `Toaster` com
  lista vazia e não reproduz os toasts disparados antes de montar. Carregá-lo depois perderia o toast de quem
  chama `toast()` na montagem, e há 84 arquivos importando o sonner. O custo fica anotado.
- Q: A Geist (29 kb, pré-carregada pelo root layout e não usada na home) sai da home? → A: **Não nesta spec.**
  Há três saídas e as três custam algo: `preload: false` põe FOUT em toda página que usa Geist; auto-hospedar
  com preload manual perde o fallback ajustado do `next/font`; e root layouts por grupo reestruturam o app.
  São ~145 ms nesse perfil, só na home. É decisão de design, e fica para o Jean.
- Q: GTM + gtag entram? → A: **Não.** São 296 kb e ~1s de thread principal (CPU 4×) em toda página, depois do
  `load`. Não pesam no LCP. Pesam no INP de quem toca a tela entre 5 e 8s. Tirar ou adiar o GA4 é decisão de
  negócio. O número vai para o handoff.
- Q: O prompt de instalação some das páginas públicas. É perda? → A: Não. Ele abre o app em `/dashboard`, e
  instalar a partir de um post leva ao login. No dashboard o prompt continua, agora uma vez só.
- Q: O `app/error.tsx` usa `Button`, que traz o `tailwind-merge` (8,4 kb gz) para toda rota. Entra? → A: **Não.**
  Só a home deixaria de carregá-lo, porque as outras páginas públicas usam `Button` em componentes client.
  Ganho de ~50 ms numa página, com a classe do botão duplicada. Fica anotado como teto.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - O índice do blog baixa os cartões, não os artigos (Priority: P1)

Um visitante no celular abre `/blog` e o filtro de categoria responde assim que a página aparece. Hoje a página
só fica interativa depois de baixar os 46 artigos inteiros, que ela não mostra.

**Why this priority**: é o maior desperdício do site público (381 kb gz de 940 kb), numa página de entrada do
SEO.

**Independent Test**: build de produção local, mesmo perfil de rede e CPU. Comparar o JS transferido e o `load`
de `/blog`. No navegador, conferir os cartões, o filtro e os links de categoria.

**Acceptance Scenarios**:

1. **Given** `/blog` servida pelo build de produção, **When** medimos o JS transferido, **Then** nenhum script
   contém o corpo de um artigo (ex.: a classe `callout-formula`, que só existe dentro de `content`).
2. **Given** `/blog`, **When** o visitante clica numa categoria, **Then** a lista filtra como antes, e o total de
   cartões por categoria é o mesmo do build anterior.
3. **Given** `/blog`, **When** lemos o HTML, **Then** os 46 posts continuam lá (1 destaque + 45 cartões) e os
   links `/blog/categoria/<slug>` são os mesmos de antes.

---

### User Story 2 - Página pública não carrega a UI do app logado (Priority: P1)

Quem visita a home, o blog ou os preços não baixa o banner de instalação, o pedido de push nem o aviso da fila
offline. Quem está no dashboard vê um banner de instalação só, e continua recebendo o pedido de push.

**Why this priority**: remove bytes de toda página pública e conserta dois defeitos: o banner duplicado no
dashboard e o push que falha para visitante anônimo.

**Independent Test**: os textos "Instalar Sirius CRM", "Ativar Notificações" e "Fila de Sincronização" não
aparecem nos scripts da home. No código, cada um desses componentes tem um ponto de montagem só, dentro do
dashboard.

**Acceptance Scenarios**:

1. **Given** a home servida pelo build de produção, **When** varremos os scripts carregados, **Then** nenhum
   contém os três textos acima.
2. **Given** o dashboard, **When** a página monta, **Then** `PWAInstallPrompt` e `PushNotificationManager` são
   montados uma vez cada, carregados depois da primeira pintura.
3. **Given** o repositório, **When** a auditoria de código morto roda, **Then** ela não acusa nada novo. O
   `OfflineStatus` e a `lib/offline-queue.ts` são apagados, porque não têm quem grave na fila.

### Edge Cases

- **Visitante que já dispensou o banner de instalação** numa página pública: o `sessionStorage`
  (`pwa-prompt-dismissed`) continua valendo no dashboard, porque o componente é o mesmo.
- **Service worker**: `PWARegister` fica no root. O registro do `/sw.js` em toda página não muda, e a
  instalabilidade também não.
- **Tipo do cartão**: o cartão recebe só os campos que desenha. Se alguém precisar de um campo novo no cartão,
  o TypeScript acusa no ponto em que o servidor monta a lista.
- **SEO de `/blog`**: o HTML do servidor não muda (o client já era renderizado no servidor). O JSON-LD
  `CollectionPage` do `blog/layout.tsx` não é tocado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `/blog` NÃO DEVE mandar ao navegador o `content` nem o `contentEn` de nenhum post.
- **FR-002**: A leitura de `blogPosts` no índice DEVE acontecer no servidor, e o componente client DEVE receber
  só os campos que desenha, mais os pares nome/slug das categorias.
- **FR-003**: O comportamento visível de `/blog` NÃO DEVE mudar: ordem por data, destaque, filtro, animação de
  entrada e links de categoria.
- **FR-004**: O root layout NÃO DEVE renderizar `PWAInstallPrompt`, `PushNotificationManager` nem
  `OfflineStatus`.
- **FR-005**: O dashboard DEVE montar `PushNotificationManager` do mesmo jeito que já monta o
  `PWAInstallPrompt`: carregado depois da primeira pintura, pelo `DashboardShellClient`.
- **FR-006**: `components/offline-status.tsx` e `lib/offline-queue.ts` DEVEM ser apagados.

### Key Entities

- **Cartão de post**: `slug`, `title`, `titleEn`, `excerpt`, `excerptEn`, `category`, `date`, `image`. É um
  recorte de `BlogPost` sem o corpo.

## Success Criteria *(mandatory)*

- **SC-001**: O JS transferido por `/blog` cai pelo menos 350 kb (de 940 kb), no mesmo perfil.
- **SC-002**: O `load` de `/blog` cai pelo menos 1,5s (de 5,2s), em mediana de 3.
- **SC-003**: Os três textos da US2 somem dos scripts da home, e o JS inicial da home cai (o número entra no
  handoff).
- **SC-004**: A mediana de 7 do LCP da home e a de 3 de `/blog` não pioram em relação à linha de base (2.164 ms
  e 2.100 ms). O efeito esperado na home é de ~10 kb, abaixo do ruído, então este critério é de não regressão.
- **SC-005**: `tsc -p tsconfig.build.json`, a suíte vitest e `node scripts/audit-dead-code.js --check` ficam no
  mesmo estado de antes.
- **SC-006**: Em produção, depois do deploy: `/blog` mostra os cartões e o filtro funciona, e a home, `/pricing`
  e `/blog` não têm chave crua. A conferência é na tela, em 1366 e 390 px, não no HTTP 200.

## Assumptions

- As props de um client component vindas de um server component vão serializadas no payload RSC do HTML. Os 46
  cartões somam ~20 kb crus, contra 1,5 MB do chunk de hoje.
- O locale EN foi aposentado (spec 004). `titleEn`/`excerptEn` continuam no cartão só para o componente não
  mudar, e custam poucos bytes.
- O dashboard não foi medido: exige sessão. A mudança nele é de ponto de montagem, conferida no código e no
  build.
