# Feature Specification: Mandar ao navegador só as traduções que ele usa

**Feature Branch**: `005-trim-client-messages`

**Created**: 2026-09-23

**Status**: Draft

**Input**: Passo 1 do `handoff.md` de 23/09 (home "Carta de Bayer"): LCP da home em 4,9s, alvo 2,5s. O root
layout passa **todas** as mensagens do next-intl ao provider do client e elas vão serializadas no HTML de
toda página.

## Contexto

| Onde | Evidência |
|---|---|
| `app/[locale]/layout.tsx` | `const messages = await getMessages()` → `<NextIntlClientProvider messages={messages}>` |
| `i18n/request.ts` | carrega os 10 namespaces: `common`, `marketing`, `auth`, `dashboard`, `blog`, `errors`, `emails`, `api`, `components`, `lib` |
| `messages/pt-BR/` | 133.000 bytes, dos quais **87.481 são `marketing.json`** e 12.796 são `emails.json` |
| HTML da home (handoff) | 246 kb cru / 65 kb gz, para uma página cujo design soma 3,2 kb gz de JS |

**O que o navegador de fato lê** (varredura de 23/09, `useTranslations` com string literal; nenhuma
chamada usa namespace dinâmico):

| Namespace | Tamanho | Quem usa no client |
|---|---|---|
| `common` | 4,2 kb | 58 componentes |
| `components` (inteiro) | 9,3 kb | `kanban-board/index.tsx` pede a raiz |
| `marketing.home.nav`, `.niche_labels`, `.agiPreview`, `marketing.blog`, `marketing.features.nav` | ~2,2 kb | header, menu mobile, blog |
| `marketing.features.sections` | 21,3 kb | os dois menus leem **só** `<seção>.<feature>.name` (1,6 kb) |

E-mails, API, lib, auth, dashboard, errors e 95% de `marketing` só são lidos no servidor, e hoje viajam
em toda página.

## Clarifications

### Session 2026-09-23

- Q: O CSS global (447 kb cru / 54 kb gz, Tailwind do app inteiro) entra nesta feature? → A: **Não.** É
  outra alavanca, com outro risco (separar CSS por grupo de rotas mexe no visual do dashboard). Esta spec
  mede o efeito das mensagens isolado. O CSS vira spec própria se o LCP não fechar.
- Q: Um recorte por grupo de rotas (marketing vê só marketing, dashboard vê só components) ou um recorte
  global? → A: **Global.** Os providers aninhados do next-intl não somam mensagens: cada grupo teria de
  repetir `common` e a checagem precisaria saber qual componente vive sob qual provider. O recorte
  global corta ~87% com uma lista só. O restante (`components`, 9,3 kb) fica anotado como teto
  conhecido.
- Q: O que acontece se alguém criar componente client com namespace fora do recorte? → A: **Um teste
  falha antes do deploy.** Em produção o next-intl não quebra a página: mostra a chave crua
  (`marketing.pricing.title`) no lugar do texto. É exatamente o defeito que ninguém vê em code review.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A página chega mais cedo em conexão ruim (Priority: P1)

Um visitante no celular, em 4G fraco, abre a home e vê o conteúdo principal mais cedo, porque o HTML
deixou de carregar ~110 kb de traduções que a página nunca mostra.

**Why this priority**: é o pedido. O LCP da home é o único gate aberto da direção de arte (G29).

**Independent Test**: build de produção local e o mesmo perfil do handoff (4G lento 1,6 Mbps / 150 ms,
CPU 4×, mediana de 3). Comparar o tamanho do HTML e o LCP antes e depois.

**Acceptance Scenarios**:

1. **Given** a home servida pelo build de produção, **When** medimos o HTML, **Then** ele não contém
   nenhuma string de `emails`, `api` ou `lib` (ex.: o assunto do e-mail de boas-vindas).
2. **Given** o perfil de rede e CPU acima, **When** medimos a home 3×, **Then** a mediana do LCP é menor
   que a de antes, e o número entra no handoff.

---

### User Story 2 - Nenhum texto some da tela (Priority: P1)

Quem usa qualquer parte do produto (menu do site, blog, kanban, chat, tarefas, onboarding, suporte)
continua vendo o texto traduzido, e nunca a chave crua.

**Why this priority**: tem a mesma prioridade da US1. Economizar bytes e mostrar
`components.tasks.title` na tela é regressão.

**Independent Test**: um teste automatizado percorre todo código que roda no navegador e confere que
cada namespace pedido está dentro do recorte. Depois, conferência visual do menu de features (desktop e
mobile), que é o único ponto com recorte parcial.

**Acceptance Scenarios**:

1. **Given** um componente client novo que pede `useTranslations('marketing.pricing')`, **When** o teste
   roda, **Then** ele falha e nomeia o arquivo e o namespace.
2. **Given** um componente client que chama `useTranslations(variavel)`, **When** o teste roda, **Then**
   ele falha, porque o recorte não pode ser verificado.
3. **Given** um componente **sem** `'use client'` importado por um componente client (ex.:
   `edit-contact-dialog.tsx`), **When** o teste roda, **Then** os namespaces dele também são cobrados.
4. **Given** o menu de features no header, **When** o visitante o abre, **Then** vê os nomes das
   features, não as chaves.

### Edge Cases

- **Componente de servidor que usa `useTranslations` sem `async`** (`(marketing)/layout.tsx`,
  `(carta)/page.tsx`, `components/marketing/footer.tsx`): lê a configuração do servidor, que continua com as 10
  namespaces. Não entra no recorte e não pode ser cobrado pelo teste, senão o recorte volta a ser tudo.
- **Recorte parcial** (`features.sections.*.*.name`): a checagem não enxerga chave dinâmica. Fica
  declarado na lista como projeção explícita, com a conferência visual da US2.
- **Código morto** (`hero.tsx`, `bento-grid.tsx`, `AgiPreview.tsx`): se nenhum client o importa, não
  entra no recorte. Se algum importar, entra e custa poucos bytes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O provider do client DEVE receber só a lista declarada de caminhos de mensagem, não o
  objeto inteiro.
- **FR-002**: A lista DEVE aceitar projeção por curinga, para mandar `sections.*.*.name` sem as
  descrições.
- **FR-003**: Um teste DEVE percorrer o grafo de imports a partir de todo arquivo `'use client'` e falhar
  se um namespace pedido não estiver coberto pela lista.
- **FR-004**: O teste DEVE falhar em `useTranslations` com argumento que não seja string literal.
- **FR-005**: A configuração do servidor (`i18n/request.ts`) NÃO DEVE mudar. `getTranslations` e o
  `useTranslations` de servidor continuam vendo tudo.
- **FR-006**: A mudança NÃO DEVE tocar nenhum dos componentes que usam tradução.

### Key Entities

- **Lista de mensagens do client**: caminhos (`common`, `marketing.home.nav`,
  `marketing.features.sections.*.*.name`) mais a função que recorta o objeto de mensagens. Mora num
  arquivo só, e o layout e o teste importam dele.

## Success Criteria *(mandatory)*

- **SC-001**: As mensagens entregues ao client caem de ~104 kb (JSON minificado) para ≤ 26 kb. *(Era
  ≤ 20 kb. Subiu na implementação: `pricing/page.tsx` e `contact/page.tsx` são `'use client'` com BOM
  antes da diretiva, e a varredura manual da spec não os viu. Eles somam `marketing.pricing` e
  `marketing.contact`, 7,6 kb.)*
- **SC-002**: O HTML da home diminui em pelo menos 100 kb cru, medido no build de produção.
- **SC-003**: A mediana do LCP da home cai em relação à medição de antes, com o mesmo perfil, e os dois
  números ficam registrados. 2,5s é o alvo, não gate desta spec: o CSS global fica de fora.
- **SC-004**: O teste de cobertura passa, e falha quando se injeta um namespace fora da lista.
- **SC-005**: `tsc -p tsconfig.build.json` e a suíte vitest ficam no mesmo estado de antes.
- **SC-006**: Em produção, depois do deploy, o menu de features (desktop e mobile) e uma tela do
  dashboard mostram texto, não chaves. Conferido na tela, não no HTTP 200.

## Assumptions

- `NextIntlClientProvider` com `messages` explícito usa só o que recebeu. Não herda nem soma a
  configuração do servidor (next-intl 4.8).
- O pt-BR é o único locale (spec 004). A lista vale para qualquer locale futuro, porque recorta por
  caminho e não por arquivo.
