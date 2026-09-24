# Feature Specification: Página pública só baixa o CSS que usa

**Feature Branch**: `007-split-public-css`

**Created**: 2026-09-24

**Status**: Implemented

**Input**: Decisão do Jean em 24/09 sobre o passo 1 do `handoff.md` da spec 006: "CSS por grupo de rotas" aprovado
como spec 007, e a Geist pré-carregada na home resolvida dentro dela.

## Contexto

A spec 006 mostrou que o LCP das páginas públicas espera o CSS global, que é bloqueante e divide o link com o
HTML, as fontes e os scripts. **Todo byte que sai da janela inicial adianta o LCP.** Depois da 006, o CSS é o
maior item da janela inicial que ainda sobra.

Medição de 24/09, build de produção local (`6bed4bc`):

| Item | Hoje | Quem pede |
|---|---|---|
| CSS global (`app/globals.css` compilado) | 440 kb crus, **53,2 kb gz** | **toda** rota, pública ou do app |
| CSS da home (`(fluxo)/fluxo.css`) | 14 kb crus, 3,5 kb gz | só a home |
| Geist (sans), pré-carregada | 29 kb (~145 ms no perfil 4G lento) | toda rota, **inclusive a home, que não usa** |

**Achado 1: o CSS carrega o app inteiro em toda página.** O Tailwind gera uma regra para cada classe que
encontra no repositório. Das 3.509 classes, só 7 vêm de docs, specs e roadmaps: o peso é do código do app
(dashboard, admin, IA, chat, gráficos). Um CSS gerado só do código das páginas públicas ficaria em ~28 kb gz na
mesma régua em que o global dá 48,5 (estimativa do handoff da 006 com o compilador do projeto). Isso tira
~20 kb da janela inicial de toda página pública.

**Achado 2: a Geist é pré-carregada em toda rota e nenhuma página pública desenha com ela.** A variável
`--font-geist-sans` é definida no `<body>`, mas a regra de fonte do Tailwind fica no `<html>`, onde a variável
não existe. Por isso o texto cai na pilha do sistema (`ui-sans-serif, system-ui`). Conferido em produção em
`/pricing`: a Geist é baixada e `document.fonts` não tem nenhuma face carregada. Só desenham com ela o layout
`(ia)` e os elementos com `font-sans` explícito, que estão quase todos no app. A home usa Schibsted Grotesk e DM
Mono. **São 29 kb baixados à toa na janela inicial de toda página pública**, e não só na home.

**Rotas públicas** (entram no CSS enxuto): a home `(fluxo)`, todo o grupo `(marketing)` (blog, preços, login,
cadastro, soluções, ferramentas etc.), o 404 e as páginas de erro.
**Rotas do app** (continuam com o CSS de hoje): `dashboard`, `admin` e `(admin)`, `(ia)`, `checkout`, `debug` e
`auth/*`.

## Clarifications

### Session 2026-09-24

- Q: GA4/GTM entra nesta spec? → A: **Não.** Fora do escopo. Em 24/09 o GA4 foi removido (`6bed4bc`) e
  restaurado (`6ade6a2`), porque o PostHog nunca teve chave em produção. Trocar o GA4 depende de configurar o
  PostHog.
- Q: Como conferir o app com sessão, antes e depois? → A: **Build local com uma das 4 contas de teste**
  (`isTestAccount`), sessão assinada localmente, banco do `.env`. Retratos do dashboard, kanban, contatos e
  configurações. É só leitura, exceto o log de acesso que o `AccessTracker` grava para essa conta.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitante baixa só o CSS das páginas públicas (Priority: P1)

Um visitante no celular abre a home, os preços ou um post do blog, e a primeira pintura chega mais cedo porque
o navegador não espera o CSS do dashboard, que ele não vai ver.

**Why this priority**: é a maior alavanca de LCP que resta em toda página pública (handoff da 006), e as
páginas públicas são as que o SEO traz.

**Independent Test**: build de produção local, perfil 4G lento (150 ms, 1,6 Mbps), CPU 4×, 390×844. Medir o CSS
transferido e o LCP de `/`, `/pricing` e `/blog`. Retratar as mesmas páginas antes e depois, em 1366 e 390 px.

**Acceptance Scenarios**:

1. **Given** `/`, `/pricing`, `/blog` e um post, **When** medimos o CSS transferido, **Then** nenhuma delas pede
   a folha do app, e a folha pública tem no máximo 33 kb gz.
2. **Given** as mesmas páginas, **When** comparamos os retratos de antes e depois em 1366 e 390 px, **Then**
   não há diferença visível: cores, espaçamentos, tipografia do post (`prose`), tema escuro e estados de foco.
3. **Given** uma URL inexistente, **When** o 404 abre, **Then** ele tem estilo. O 404 de primeiro nível
   (`/qualquer-coisa`) sai hoje **sem nenhuma folha**: o `app/not-found.tsx` fica fora do layout que importa o
   CSS. Ele passa a carregar a folha pública. O 404 aninhado (`/blog/x`) já tinha estilo e não muda.

---

### User Story 2 - Quem está logado vê o app exatamente como hoje (Priority: P1)

Um cliente entra pelo `/login` e cai no dashboard. Tudo fica onde estava: kanban, gráficos, chat, admin e IA
não perdem nenhuma regra. Isso vale entrando pela URL direto e navegando a partir de uma página pública.

**Why this priority**: é o risco da mudança. O app é o que o cliente paga.

**Independent Test**: a folha que as rotas do app recebem tem o mesmo conjunto de regras de hoje. E retratos
das telas principais do app, antes e depois, com sessão de uma conta de teste.

**Acceptance Scenarios**:

1. **Given** o build novo, **When** comparamos a folha das rotas do app com a folha global de hoje, **Then** não
   falta nenhuma regra.
2. **Given** uma sessão, **When** o usuário vai do `/login` ao dashboard sem recarregar, **Then** o dashboard fica
   igual ao aberto a frio.
3. **Given** o dashboard, **When** o usuário volta a uma página pública sem recarregar, **Then** a página pública
   fica igual à aberta a frio.

---

### User Story 3 - Nenhuma página baixa uma fonte com que não desenha (Priority: P2)

A home, os preços e o blog param de baixar a Geist, que não desenham. As telas que desenham com ela (a área de
IA e os elementos com `font-sans`) continuam com ela.

**Why this priority**: são 29 kb (~145 ms no perfil) na janela inicial de toda página pública, e o visual não muda.

**Independent Test**: contar os pedidos de fonte de `/`, `/pricing` e `/blog`, e retratar as mesmas páginas e o
dashboard antes e depois.

**Acceptance Scenarios**:

1. **Given** `/`, `/pricing` e `/blog`, **When** a página carrega, **Then** nenhum arquivo da Geist é pedido.
2. **Given** uma tela da área de IA, **When** a página carrega, **Then** o texto é desenhado com a Geist, como hoje.

### Edge Cases

- **Navegação entre os dois mundos na mesma aba**: a folha de uma rota pode continuar no documento depois que o
  usuário sai dela. As duas folhas vêm da mesma fonte de estilo, então uma regra repetida tem o mesmo valor. A
  US2 cobre os dois sentidos.
- **Página pública que mostra componente do app** (`/design-system` exibe botões, abas e campos): entra na folha
  pública. Se ela sozinha pesar muito, a decisão de movê-la sai no plano, com o número.
- **Rotas sem layout próprio** (`checkout`, `debug`, `admin`): precisam receber a folha do app por algum ponto.
  Nenhuma rota pode ficar sem estilo.
- **Página de erro** (`app/error.tsx`, `global-error.tsx`) e **404** (`[locale]/not-found.tsx`): estão fora dos
  grupos, e cada uma precisa da sua folha.
- **Tema escuro**: os tokens de cor (`:root` e `.dark`) ficam nas duas folhas. O `(ia)` força `dark`.
- **Classes montadas em tempo de execução** (strings em `lib/`, `config/`, HTML dos posts em
  `lib/blog/posts/`): a folha pública precisa enxergar as que as páginas públicas usam, como as do corpo dos
  posts.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: As rotas públicas NÃO DEVEM pedir a folha do app. A folha delas DEVE conter só as regras geradas a
  partir do código que as rotas públicas renderizam, mais a base comum (reset, tokens de tema, tipografia dos
  posts).
- **FR-002**: As rotas do app DEVEM receber o mesmo conjunto de regras que recebem hoje.
- **FR-003**: Toda rota DEVE ter estilo, inclusive o 404, as páginas de erro e as rotas sem layout próprio.
- **FR-004**: Navegar de uma rota pública para uma do app, e de volta, sem recarregar, NÃO DEVE mudar a aparência
  de nenhuma das duas em relação à abertura a frio.
- **FR-005**: Nenhuma página DEVE pedir a Geist se não desenha com ela. As telas que desenham com ela DEVEM
  continuar a desenhar.
- **FR-006**: O visual das rotas públicas NÃO DEVE mudar: tema claro e escuro, `prose` dos posts, animações e
  estados de foco.
- **FR-007**: Uma classe nova usada numa página pública DEVE passar a existir na folha pública sem passo manual.
  Não pode haver lista de classes mantida à mão.

### Key Entities

- **Folha pública**: o CSS das rotas públicas, gerado do código delas.
- **Folha do app**: o CSS das rotas do app. É o CSS global de hoje.

## Success Criteria *(mandatory)*

- **SC-001**: O CSS pedido por `/`, `/pricing` e `/blog` cai de 53,2 para no máximo 33 kb gz, medido no arquivo
  do build de produção.
- **SC-002**: `/`, `/pricing` e `/blog` fazem 0 pedidos de arquivo da Geist.
- **SC-003**: A mediana de 7 do LCP da home cai pelo menos 150 ms em relação à linha de base medida no mesmo dia,
  no mesmo perfil. As medianas de 3 de `/pricing` e `/blog` não pioram, e o número de cada uma entra no handoff.
- **SC-004**: A folha do app tem todas as regras da folha global de antes. Nenhuma falta, conferido por
  comparação automática.
- **SC-005**: Os retratos antes/depois de `/`, `/pricing`, `/blog`, um post e o 404 aninhado, em 1366 e 390 px,
  não diferem. O 404 de primeiro nível muda de propósito (US1, cenário 3). As telas principais do app também não: dashboard, kanban, contatos e configurações.
- **SC-006**: O `tsc`, a suíte vitest e a auditoria de código morto ficam no mesmo estado de antes. Em
  produção, a conferência é na tela, não no HTTP 200.

## Assumptions

- Uma estimativa de ~28 kb gz (contra 48,5 na mesma régua) veio do compilador do projeto, restringindo as fontes.
  O plano refaz a conta com a lista real de arquivos que as rotas públicas importam.
- O navegador guarda em cache a folha pública e a do app separadamente. Quem vai de uma página pública para o
  app baixa a folha do app uma vez, como hoje, porque hoje ela já é baixada na página pública.
- O retrato do app usa um build local com sessão de uma conta de teste (ver Clarifications).
- O locale EN foi aposentado (spec 004). Nenhuma rota EN entra na conta.
