# Feature Specification: Remover o locale EN e as rotas `/en`

**Feature Branch**: `004-remove-en-locale`

**Created**: 2026-09-22

**Status**: Draft

**Input**: User description: "A muito tempo eu tinha pedido pra tirar todo '/en' do projeto, foi retirado completamente?" → resposta: não, nada foi removido. Pedido reconfirmado: remover.

## Contexto

O pedido de remover o `/en` foi feito há tempos e **nunca virou tarefa**. O histórico mostra o
movimento oposto: `fae2d8b` (Phases 0-7), `41712d5` (EN para os 45 posts), `d6104ab` (25 artigos
de help), `825a2ab` (Phase 11). O locale EN está inteiro e no ar:

| Onde | Evidência |
|---|---|
| `i18n/config.ts:1` | `locales = ['pt-BR', 'en']` |
| `i18n/routing.ts` | `localePrefix: 'as-needed'` + ~60 pathnames traduzidos |
| `middleware.ts:23-38` | tira o prefixo `/en` pra auth, redireciona pra `/en/login` |
| `app/sitemap.ts:41` | emite `hreflang` para `${baseUrl}/en${enRoute}` |
| `app/[locale]/(marketing)/layout.tsx:60` | `<LanguageSwitcher />` no header |
| `messages/en/` | 10 namespaces, 144 KB |
| `lib/blog/*` (45 arquivos) | `titleEn` / `excerptEn` / `contentEn` |
| `prisma/schema.prisma:264` | `locale String @default("pt-BR")` com `"en"` no comentário |

## Clarifications

### Session 2026-09-22

- Q: Até onde vai a remoção — só o locale EN, ou arrancar o next-intl inteiro? → A: **Só o locale
  EN.** O next-intl fica de pé com `pt-BR` único, `app/[locale]` continua existindo e os 109
  arquivos com `useTranslations` **não são tocados**. Arrancar o next-intl seria um diff de ~230
  arquivos onde cada chave não resolvida vira string vazia na tela sem quebrar o build — risco
  desproporcional para o que foi pedido, que é o `/en` sumir da web.
- Q: Para onde apontam os 301 das URLs `/en` já indexadas? → A: **Equivalente em PT**
  (`/en/pricing` → `/pricing`, `/en/proposal` → `/proposta`, `/en/tools/roi-calculator` →
  `/ferramentas/calculadora-roi`). Redirect em massa para a home é tratado pelo Google como
  soft-404 e a autoridade da URL evapora em vez de ser herdada.
- Q: O conteúdo EN do blog e a coluna `User.locale`? → A: **Deixar morto por ora.** Os campos
  `titleEn`/`excerptEn`/`contentEn` ficam nos 45 arquivos e a coluna fica no banco, sem leitor.
  Nenhuma migração destrutiva no mesmo deploy que mexe em rota.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Nenhuma URL `/en` responde 200 (Priority: P1)

Um visitante (ou um crawler) que abre qualquer URL `/en/...` — de um link antigo, de um
resultado do Google ou de um bookmark — chega na página equivalente em português por 301, nunca
num 404 nem numa página em inglês.

**Why this priority**: É o pedido literal. Sem isso, nada foi entregue.

**Independent Test**: `curl -I` em uma amostra de URLs `/en` e conferir `301` + `Location`
apontando para o caminho PT correspondente.

**Acceptance Scenarios**:

1. **Given** `/en/pricing` indexado no Google, **When** alguém abre a URL, **Then** recebe 301 para `/pricing`.
2. **Given** `/en/proposal` (slug traduzido), **When** alguém abre a URL, **Then** recebe 301 para `/proposta`.
3. **Given** `/en/tools/roi-calculator`, **When** alguém abre a URL, **Then** recebe 301 para `/ferramentas/calculadora-roi`.
4. **Given** `/en/qualquer-coisa-que-nao-existe`, **When** alguém abre a URL, **Then** recebe 301 para `/qualquer-coisa-que-nao-existe` (que então resolve 404 na sua própria rota PT, não em `/en`).
5. **Given** `/en/dashboard` sem sessão, **When** alguém abre a URL, **Then** chega em `/login` — nunca em `/en/login`.

---

### User Story 2 - O site para de anunciar que existe em inglês (Priority: P1)

Nenhum sinal para buscador ou para usuário sugere uma versão EN: sem `hreflang`, sem URL `/en`
no sitemap, sem seletor de idioma no header.

**Why this priority**: Anunciar `hreflang` para URL que agora é 301 queima crawl budget e mantém
o EN vivo no índice por meses. Mesma prioridade que a US1 — as duas juntas são o "sumiu da web".

**Independent Test**: gerar o sitemap e conferir zero ocorrência de `/en`; abrir a home e
conferir que o header não tem seletor de idioma.

**Acceptance Scenarios**:

1. **Given** o sitemap gerado, **When** buscamos por `/en`, **Then** zero ocorrências — nem como `<loc>`, nem como `hreflang`.
2. **Given** a home, **When** um visitante olha o header do marketing, **Then** não existe seletor de idioma.
3. **Given** qualquer página de marketing, **When** inspecionamos o `<head>`, **Then** não há `<link rel="alternate" hreflang="en">`.

---

### User Story 3 - O código não carrega mais o peso do EN (Priority: P2)

Quem abre o projeto não encontra traduções, rotas traduzidas ou branches de idioma que não
servem a nada. `messages/en/` e o componente de troca de idioma não existem mais; `routing.ts`
tem um locale só.

**Why this priority**: É consequência, não causa. O site já cumpriu o pedido com as US1 e US2;
esta limpa o rastro para o próximo que editar o arquivo.

**Independent Test**: procurar por `'en'` em `i18n/`, `messages/` e `middleware.ts` e não achar nada.

**Acceptance Scenarios**:

1. **Given** `i18n/config.ts`, **When** lido, **Then** `locales = ['pt-BR']`.
2. **Given** `i18n/routing.ts`, **When** lido, **Then** nenhum pathname tem chave `en`.
3. **Given** o repositório, **When** procuramos `messages/en/`, **Then** o diretório não existe.
4. **Given** `middleware.ts`, **When** lido, **Then** nenhuma menção a `/en`.

---

### Edge Cases

- **Cookie `NEXT_LOCALE=en` de visitante antigo**: com um locale só, `next-intl` não tem para onde
  ir e resolve `pt-BR`. `localeDetection` já está `false` — não regredir isso.
- **Sessão gravada com `User.locale = 'en'`**: a coluna continua existindo e pode ter linhas com
  `'en'`. O carregador de mensagens precisa cair em `pt-BR` para qualquer valor desconhecido, não
  estourar no `import()` de um arquivo que não existe mais.
- **Link interno hard-coded para `/en/...`**: se existir em algum lugar, vira um 301 extra em vez
  de 404. Aceitável, mas vale varrer.
- **Ordem dos redirects**: o `next.config` já redireciona `/mes`/`/month` e `/mês → /pricing`; as
  novas regras `/en/*` não podem colidir com elas.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE aceitar `pt-BR` como único locale (`i18n/config.ts`, `i18n/routing.ts`).
- **FR-002**: O sistema DEVE responder 301 permanente para toda URL sob `/en`, apontando para o caminho PT equivalente.
- **FR-003**: O redirect DEVE traduzir os slugs que diferem entre os idiomas (`proposal`→`proposta`, `yearbook`→`anuario`, `tools`→`ferramentas`, `solutions`→`solucoes`, `automatic-sales`→`vendas-automaticas`, `checkout/success`→`checkout/sucesso`, `blog/category`→`blog/categoria`, `help/[category]`→`help/[categoria]`), e DEVE ter um fallback que apenas retira o prefixo para todo o resto.
- **FR-004**: O sitemap NÃO DEVE conter nenhuma URL `/en` nem nenhum `hreflang` apontando para inglês.
- **FR-005**: O header do marketing NÃO DEVE exibir seletor de idioma.
- **FR-006**: O middleware NÃO DEVE conter lógica condicional de prefixo `/en`.
- **FR-007**: O diretório `messages/en/` e `components/marketing/language-switcher.tsx` DEVEM ser removidos do repositório.
- **FR-008**: O carregador de mensagens DEVE resolver `pt-BR` para qualquer locale desconhecido, sem lançar — inclusive para `'en'` vindo de cookie ou de `User.locale`.
- **FR-009**: A mudança NÃO DEVE alterar nenhum dos 109 arquivos que usam `useTranslations`/`getTranslations`, nem mover `app/[locale]`. *(Corrigido no plano: arquivos dentro de `app/[locale]` que emitem `hreflang` EM SI — `layout.tsx` e 4 páginas com `generateMetadata` próprio — precisam ser editados, senão a US2 não fecha. O que permanece intocado são os 109 arquivos de tradução e a posição do diretório.)*
- **FR-010**: A mudança NÃO DEVE incluir migração de banco. `User.locale` permanece.

### Key Entities

- **Locale**: passa do conjunto `{pt-BR, en}` para `{pt-BR}`. Continua sendo o segmento opcional de rota e a chave do diretório `messages/`.
- **Pathname map** (`i18n/routing.ts`): perde a coluna `en`. As entradas que existiam só para traduzir um slug viram string simples.
- **Redirect table** (`next.config.ts`): entidade nova, ~9 regras, existe para herdar a autoridade das URLs `/en` indexadas. É a única parte da feature com prazo de validade — pode sair quando o Google tiver reprocessado (meses).

## Success Criteria *(mandatory)*

- **SC-001**: Nenhuma ocorrência de rota EN em `i18n/`, `middleware.ts` e `app/sitemap.ts`.
- **SC-002**: Uma amostra de 9 URLs `/en` (uma por regra de redirect) responde 301 com `Location` no caminho PT correto, verificada com o servidor rodando.
- **SC-003**: O sitemap gerado tem zero ocorrências da string `/en`.
- **SC-004**: `npm run build` passa e a suíte de testes fica no mesmo estado de antes (nenhum teste novo quebrado).
- **SC-005**: O diff não altera nenhum arquivo que use `useTranslations`/`getTranslations` e não move `app/[locale]/`. Dentro de `app/[locale]/` só entram os emissores de `hreflang`: `layout.tsx`, `(marketing)/layout.tsx` e as 4 páginas com `generateMetadata` próprio.
- **SC-006**: Nenhuma página emite `<link rel="alternate" hreflang="en">` — verificado no HTML servido, não só no código.
