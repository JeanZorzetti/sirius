# Feature Specification: Remoção de código morto — Sirius CRM

**Feature Branch**: `002-remove-dead-code`

**Created**: 2026-08-22

**Status**: Draft

**Input**: User description: "Crie uma spec para execução da refatoração do projeto" — com base em `docs/AUDITORIA_OVER_ENGINEERING_2026-08-22.md`.

---

## Contexto / Evidência (não-normativo)

Auditoria de 22/08/2026 (`ponytail-audit` + `scripts/audit-dead-code.js`, que resolve import estático, `import()` dinâmico e `require()`):

| Base medida | Linhas |
|---|---:|
| `app/` + `components/` + `lib/` + `hooks/` | 199.799 |
| **Não alcançável por nenhum caminho de execução** | **24.411 (12,2%)** |

**Causa raiz.** Commit `2d29773` — *"feat: add access tracking system and clean up obsolete admin pages"*, 27/04/2026 — apagou 10 páginas de admin que eram a **única superfície de consumo** de quatro subsistemas. As páginas foram; os subsistemas ficaram, com testes, rotas e documentação. **16.057 das 24.411 linhas ficaram órfãs nesse único commit.** Nada quebrou porque código não alcançado compila, passa no lint e passa nos próprios testes.

O que esta feature entrega, portanto, não é só a deleção: é o **gate que impede a repetição** — a limpeza de uma UI passa a exigir a pergunta "quem mais chamava isto?" antes do merge, automatizada pelo `audit-dead-code.js`.

**Aviso sobre os números.** As somas por fase da auditoria se sobrepõem — o Anexo A contém arquivos que também aparecem nos itens 1, 9, 11 e 15. O único total não sobreposto é **24.411**. Por isso o progresso desta feature é medido pela **saída do `audit-dead-code.js`**, nunca pela soma das linhas por história.

---

## Clarifications

### Session 2026-08-22

- Q: O subsistema Generative UI (14.666 linhas, 60% do corte) é feature abandonada ou pausada? → A: **Abandonada — apagar.** Verificado nesta sessão: nenhum arquivo fora de `components/generative-ui/` e `lib/generative-ui/` importa `MessageRenderer` ou `DynamicUIComponent`; o chat em produção (`AgiChatSidebar`, `AgiPreview`) usa `/api/agi/chat` (texto), não `/api/agi/chat-with-ui`. Último commit de feature: 03/02/2026. Nenhum usuário final chegou a ver o subsistema. Os 5 documentos `GENERATIVE_UI_*.md` vão junto.
- Q: As 4 rotas `/api/export/*` (PDF/XLSX de deals e contatos, 284 linhas) são lixo ou feature desligada? → A: **Feature desligada — ligar.** As rotas ficam, e a UI ganha o botão que faltava. Isso as tira do escopo de deleção da história de rotas órfãs.
- Q: `lib/env.ts` (122 linhas, zero importadores) — ligar ou apagar? → A: **Ligar, em modo relatório.** Erro de env var é a primeira hipótese de debug documentada no `CLAUDE.md` do projeto. Restrição: hoje `validateEnv()` **lança** com env var faltando, e chaves obrigatórias da lista (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) ainda estão pendentes em produção — ligar como está derruba o boot. Ver FR-021.

---

## User Scenarios & Testing *(mandatory)*

Cada história é um PR próprio, na ordem de risco crescente. Todas as histórias de deleção são independentemente testáveis pela mesma tríade: a suíte continua verde e o número do `audit-dead-code.js` cai. **US0 vem antes de todas** — é ela que torna "continua verde" uma afirmação verificável.

O ator principal de US0–US3 e US5–US7 é **quem mantém o repositório** (time e agentes): o valor entregue é código que não precisa ser lido, type-checado nem testado. US4 é a única história voltada ao usuário final do CRM.

### User Story 0 - Baseline de verificação restaurado (Priority: P0)

*Adicionada em 22/08 pela Fase 0 do plano.* Deixar a CI verde em `main` e fazer os testes realmente executarem, antes de qualquer deleção.

**Why this priority**: Toda história desta feature se verifica por **ausência de regressão** — e isso não é observável a partir de vermelho. A CI de `main` falha em todas as execuções desde pelo menos 12/07/2026: `lint`, `typecheck` e `db-migration-check` reprovam, e `build`, `test` e `e2e` sequer chegam a rodar. Além disso o job de teste unitário chama um script que não existe (`test:unit`), saindo verde sem executar nada. Adicionar o gate da FR-023 a uma CI que já não barra nada produziria aparência de proteção, não proteção.

**Independent Test**: A execução mais recente da CI em `main` conclui com sucesso, e o log do job de teste mostra contagem de testes executados.

**Acceptance Scenarios**:

1. **Given** a CI type-checando sem gerar o cliente Prisma do schema WhatsApp, **When** o passo faltante é adicionado, **Then** os erros `TS2307` e a cascata de `TS7006` desaparecem sem nenhuma alteração em código de aplicação.
2. **Given** o job de teste unitário chamando um script inexistente com `--if-present`, **When** a história é concluída, **Then** o job executa a suíte e reprova se algum teste falhar.
3. **Given** o job de build executando `npm run build`, que aplica migrations, **When** a história é concluída, **Then** o build de CI gera os clientes Prisma e compila **sem** tocar em banco.
4. **Given** o scanner de código morto saindo sempre com código 0, **When** a história é concluída, **Then** existe um modo de verificação que reprova com código 1, e uma allowlist versionada com o motivo escrito de cada exceção.

---

### User Story 1 - Varredura sem risco (Priority: P1)

Apagar o que nenhum caminho de execução alcança e nada pode quebrar: 2 arquivos `.bak` versionados, 4 barrels de re-export sem importador, 3 componentes shadcn nunca usados, e 12 dependências declaradas e nunca importadas.

**Why this priority**: Risco nenhum e destrava a confiança no processo. Os `.bak` são também questão de segurança — podem conter credencial antiga.

**Independent Test**: `npm run typecheck` e `npm test` verdes; `npm ci` instala sem os 12 pacotes; o app sobe.

**Acceptance Scenarios**:

1. **Given** `lib/email-automations.ts.bak` e `__tests__/components/generative-ui/DynamicUIComponent.test.tsx.bak` versionados, **When** a história é concluída, **Then** os dois arquivos não existem mais no repositório e **foram inspecionados por credencial antes da deleção** — qualquer segredo encontrado entra na lista de rotação.
2. **Given** 12 dependências nunca importadas em `package.json`, **When** elas são removidas, **Then** `npm ci` seguido de `npm run typecheck`, `npm test` e build passa sem erro.
3. **Given** `pino-pretty`, `@tailwindcss/typography` e `tw-animate-css` parecem órfãos numa busca por `import` mas são usados por string e por CSS, **When** a limpeza de dependências roda, **Then** os três permanecem em `package.json`.

---

### User Story 2 - Duplicatas e infraestrutura órfã (Priority: P2)

Eliminar as ambiguidades que fazem alguém editar o arquivo errado: dois rate limiters cujos nomes diferem por um hífen, um `plan-limits.ts` morto com xará vivo em outro diretório, 5 providers de scraping nunca registrados na factory, e `lib/env.ts` que dá falsa sensação de validação.

**Why this priority**: Risco baixo, mas é a classe de dívida que causa bug de verdade — editar `rate-limit.ts` achando que é `ratelimit.ts` é erro que passa em review.

**Independent Test**: Buscar por `plan-limits` retorna um único arquivo; buscar por rate limiter retorna um único módulo; o boot reporta env vars ausentes no log.

**Acceptance Scenarios**:

1. **Given** `lib/rate-limit.ts` (1 importador) e `lib/ratelimit.ts` (29 importadores) coexistindo, **When** a história é concluída, **Then** existe um único módulo de rate limit e `lib/api-middleware.ts` usa ele, com o comportamento de limite preservado.
2. **Given** `middleware/plan-limits.ts` sem importadores e `lib/plan-limits.ts` vivo, **When** o morto é apagado, **Then** todo call site de plan limits resolve para `lib/`.
3. **Given** 5 providers de scraping fora da lista de `lib/scraping/providers/index.ts`, **When** eles são apagados, **Then** uma busca de leads continua funcionando pelos providers registrados e a suíte de scraping passa.
4. **Given** o app subindo sem uma env var obrigatória, **When** o processo inicia, **Then** o log registra explicitamente qual variável falta **e o processo continua subindo**.

---

### User Story 3 - Arquivos sem nenhum importador (Priority: P3)

Apagar os arquivos do Anexo A que não pertencem a nenhuma outra história — nem import estático, nem `import()`, nem `require()` alcança qualquer um deles.

**Why this priority**: É o maior corte que não depende de decisão de produto nenhuma. Inclui os 12 módulos mobile órfãos (`lib/mobile/`, `components/mobile/`) — o stack Capacitor em si continua vivo e intocado.

**Independent Test**: Rodar o app em web e no build mobile; a lista de arquivos sem importador do `audit-dead-code.js` fica vazia fora da allowlist.

**Acceptance Scenarios**:

1. **Given** um arquivo do Anexo A, **When** ele é proposto para deleção, **Then** `git log --diff-filter=D --name-only -- "*<nome>*"` foi consultado para confirmar que o consumidor foi apagado — e por quê.
2. **Given** `components/microsoft-clarity.tsx` sem importador, **When** verificado se o snippet migrou para o `<head>` do layout, **Then** confirma-se que **não migrou** (zero referências a Clarity fora do próprio componente) — apagar remove o rastreamento por completo, e essa consequência é registrada no PR.
3. **Given** `app/[locale]/dashboard/tasks/actions.ts` (server actions, 272 linhas) sem importador enquanto os outros diretórios de dashboard importam o seu próprio `'./actions'`, **When** a tela de tasks é exercitada em runtime, **Then** confirma-se que nenhuma action dele é invocada antes da deleção.
4. **Given** os 12 módulos de `lib/mobile/` e `components/mobile/` apagados, **When** o app Capacitor é buildado e aberto, **Then** navegação, `bottom-nav`, teclado, status bar e deep links continuam funcionando.

---

### User Story 4 - Exportar deals e contatos pela tela (Priority: P4)

Como usuário do CRM, quero baixar minha lista de deals e de contatos em PDF ou XLSX direto da tela, sem pedir para ninguém.

**Why this priority**: Única história com valor para o usuário final, e **precisa vir antes da US5** — as 4 rotas `/api/export/*` estão hoje na lista de rotas sem chamador e seriam apagadas junto.

**Independent Test**: Abrir a tela de deals, clicar em exportar, receber o arquivo. Idem contatos. Sem tocar em nenhum outro escopo.

**Acceptance Scenarios**:

1. **Given** um usuário na listagem de deals com registros visíveis, **When** aciona exportar e escolhe PDF ou XLSX, **Then** o arquivo baixa contendo os registros que o usuário tem permissão de ver, e o rótulo do controle deixa claro que a exportação é do conjunto inteiro. *(Emendado em 22/08 pela Fase 0: as rotas não leem query param nenhum — respeitar o filtro da tela exigiria backend novo, fora do escopo de uma história de UI. Ver [research.md R5](./research.md).)*
2. **Given** um usuário na listagem de contatos, **When** aciona exportar, **Then** vale o mesmo comportamento.
3. **Given** um usuário de outra organização, **When** tenta exportar, **Then** recebe apenas os dados da própria organização — a exportação respeita o mesmo isolamento das telas.
4. **Given** uma listagem vazia, **When** o usuário aciona exportar, **Then** recebe uma mensagem clara em vez de um arquivo vazio sem explicação.

---

### User Story 5 - Rotas órfãs, libs AGI e migrações one-shot (Priority: P5)

Apagar as rotas de API sem chamador (Anexo B, descontadas as 3 com chamador externo confirmado e as 4 de export ligadas na US4), as libs AGI que caem junto com elas, e converter as 6 rotas admin que são migração de uma vez só em scripts.

**Why this priority**: Risco médio — rota órfã pode ter chamador fora do repo. Endpoint permanente para operação de uma vez é superfície de ataque parada de graça.

**Independent Test**: Monitorar 404/500 novos em produção nas 72h seguintes ao deploy; nenhum.

**Acceptance Scenarios**:

1. **Given** `/api/sync/process` (chamado por `public/sw-push.js`), `/api/mobile/sync` (app Capacitor) e `/api/mercadopago/checkout` (redirect), **When** as rotas órfãs são apagadas, **Then** essas três **permanecem** e continuam na allowlist `EXTERNAL` do scanner.
2. **Given** `lib/mercadopago.ts` (10 importadores) e `/api/webhooks/mercadopago` vivos por causa de assinaturas legadas, **When** a limpeza do Mercado Pago acontece, **Then** apenas `lib/mercado-pago/checkout.ts` (diretório com hífen) é tocado, e só após confirmar no banco que nenhuma organização ativa depende do fluxo de checkout novo.
3. **Given** `lib/nlp/graph-rag.ts` e `lib/nlp/graph-queries.ts` alcançados por `admin/knowledge-graph` via `/api/graph/rag`, **When** as libs AGI órfãs são apagadas, **Then** esses dois **permanecem** e a tela de knowledge graph continua funcionando.
4. **Given** as 6 rotas admin de migração one-shot (`migrate-deals-pipeline`, `fix-unread`, `fix-waba-id`, `add-closings-permission`, `reset-wa-db`, `sync-contacts`), **When** elas são removidas, **Then** existe um script equivalente em `scripts/` executável com `tsx` para cada operação que ainda precise ser repetível.

---

### User Story 6 - Generative UI removido (Priority: P6)

Apagar o subsistema Generative UI inteiro — 14.666 linhas em componentes, libs, intelligence, hooks, testes, rotas e a página `admin/cache-stats` — mais os 5 documentos que o descrevem como se estivesse em produção.

**Why this priority**: É 60% do corte total, e é a única história que dependia de decisão de produto. Decisão tomada em 22/08 (ver Clarifications).

**Independent Test**: O chat do site responde normalmente; a suíte encolhe em 5 arquivos de teste e continua verde.

**Acceptance Scenarios**:

1. **Given** o chat em produção usando `/api/agi/chat`, **When** o subsistema e `/api/agi/chat-with-ui` são apagados, **Then** `AgiChatSidebar` e `AgiPreview` continuam respondendo normalmente.
2. **Given** as 3 rotas `/api/ab-testing/*` e os hooks `useABTest`, `useWorkflow`, `useOptimisticUpdate`, `useComponentCache`, `useComponentAnalytics`, **When** o subsistema é removido, **Then** nenhum resíduo permanece — `lib/agi/tools/render-ui-tool.ts` e `lib/agi/prompts/generative-ui-prompt.ts` incluídos.
3. **Given** os 5 documentos `GENERATIVE_UI_*.md`, **When** o código deixa de existir, **Then** os documentos são removidos e o `CHANGELOG.md` registra a remoção com o motivo e o commit de origem do órfão (`2d29773`), para que a decisão seja recuperável.

---

### User Story 7 - Consolidação de conceitos duplicados (Priority: P7)

Unificar o que existe em três lugares com nomes diferentes: formatadores reescritos à mão em 25 arquivos, três módulos para o conceito de plano/limite, e dois diretórios de hooks com convenções de nome diferentes.

**Why this priority**: Risco médio e é refatoração de código **vivo** — a única história que muda comportamento potencialmente observável (formatação de moeda, data e telefone).

**Independent Test**: Comparar a renderização de valores, datas e telefones nas telas principais antes e depois; nenhuma diferença visível.

**Acceptance Scenarios**:

1. **Given** 10 `formatCurrency`, 10 `formatDate`, 3 `formatPhone` e 2 `timeAgo` independentes, **When** consolidados num módulo único, **Then** todo call site usa o módulo único e a saída renderizada é idêntica à anterior em pt-BR — incluindo os casos de borda de cada implementação antiga.
2. **Given** `lib/entitlements.ts`, `lib/feature-gates.ts` e `lib/plan-limits.ts` descrevendo o mesmo conceito, **When** fundidos, **Then** existe uma fonte única de limites de plano e todos os gates de feature a consultam.
3. **Given** `hooks/` e `lib/hooks/` com convenções de nome misturadas, **When** a história é concluída, **Then** existe um único diretório com uma única convenção.

---

### Edge Cases

- **Chamador fora do repositório.** Webhook, cron externo, app Capacitor, service worker. O scanner não os enxerga. Tratados por allowlist `EXTERNAL`; qualquer rota nova candidata a deleção exige busca no repo mobile e em `public/`.
- **Caminho montado em runtime.** Um `import()` cujo caminho é montado por template string passaria batido pelo scanner. Nenhum caso encontrado hoje; se aparecer durante a execução, a deleção correspondente é revertida e o caso vira teste do scanner.
- **Referência só em Markdown.** A primeira versão do scanner lia `.md` e deu 13 rotas como vivas que só existiam na documentação. Documentação não é chamador.
- **Entrypoints por convenção.** `page.tsx`, `route.ts`, `middleware.ts`, `i18n/request.ts`, seeds — nunca têm importador e nunca são código morto. Tratados por allowlist `isEntry`.
- **O arquivo morto guardava um segredo.** Os 2 `.bak` e o service account `sirius-crm-483316-a2e815438069.json` na raiz: apagar sem ler perde a informação de que a credencial vazou e precisa ser rotacionada.
- **A ausência é que quebra.** Código morto não quebra teste; a remoção dele é que pode. Toda história exige a tríade de verificação, não a leitura do diff.

---

## Requirements *(mandatory)*

### Functional Requirements

**Escopo e processo**

- **FR-001**: Cada história MUST ser entregue como um PR próprio, na ordem de prioridade (P1→P7), sem misturar histórias no mesmo commit de merge.
- **FR-002**: Todo PR MUST passar por `npm run typecheck`, `npm test` e um build de produção **antes** do merge, com a saída registrada no PR.
- **FR-003**: O build de verificação MUST NOT ser feito por `npm run build` — esse script executa `prisma migrate deploy` contra o banco. A verificação usa `npx prisma generate` seguido de `npx next build`.
- **FR-004**: Todo PR MUST reportar a saída de `node scripts/audit-dead-code.js` antes e depois, e o número MUST cair.
- **FR-005**: Nenhum arquivo MUST ser apagado sem antes consultar `git log --diff-filter=D --name-only -- "*<nome>*"` para identificar quando e por que o consumidor sumiu.
- **FR-006**: Arquivos com segredo (os 2 `.bak`) MUST ser inspecionados antes da deleção; qualquer credencial encontrada MUST ser adicionada à lista de rotação.

**Preservações inegociáveis** *(o que NÃO pode ser removido)*

- **FR-007**: `/api/sync/process`, `/api/mobile/sync` e `/api/mercadopago/checkout` MUST permanecer — chamadores externos confirmados.
- **FR-008**: `lib/mercadopago.ts` e `/api/webhooks/mercadopago` MUST permanecer enquanto houver `mercadoPagoSubscriptionId` ativo em alguma organização.
- **FR-009**: `lib/nlp/graph-rag.ts` e `lib/nlp/graph-queries.ts` MUST permanecer — alcançados por `admin/knowledge-graph`.
- **FR-010**: `pino-pretty`, `@tailwindcss/typography` e `tw-animate-css` MUST permanecer em `package.json` — usados por string e por CSS.
- **FR-011**: As 4 rotas `/api/export/*` MUST permanecer e MUST ser ligadas à UI (US4), não apagadas.
- **FR-012**: O stack Capacitor vivo (`native-initializer`, `keyboard`, `status-bar`, `deep-links`, `badge`, os 15 plugins) MUST permanecer intocado.

**Deleções**

- **FR-013**: O sistema MUST NOT conter arquivos `.bak` versionados, barrels de re-export sem importador, nem componentes de UI instalados e nunca usados.
- **FR-014**: `package.json` MUST NOT declarar dependência que nenhum código importa. As duas de telemetria (`@vercel/analytics`, `@vercel/speed-insights`) MUST ser removidas por não estarem montadas em lugar nenhum.
- **FR-015**: Cota de plano e limite de rota MUST ser módulos distintos, com nomes que não se confundam — o módulo de cota por organização/plano (usado por `lib/api-middleware.ts`) MUST ser **renomeado**, não fundido com o de limite por rota/IP. Limites de plano MUST ter uma fonte única. *(Emendado em 22/08 pela Fase 0: os dois "rate limiters" não são duplicata; fundir removeria a cota por plano. Ver [research.md R4](./research.md).)*
- **FR-016**: O sistema MUST NOT conter provider de scraping que não esteja registrado na factory, nem export de factory sem nenhum uso.
- **FR-017**: O sistema MUST NOT expor endpoint permanente para operação executada uma única vez; essas operações MUST viver em `scripts/`.
- **FR-018**: O subsistema Generative UI MUST ser removido por inteiro — componentes, layouts, workflows, libs, intelligence, hooks, testes, rotas `/api/agi/chat-with-ui` e `/api/ab-testing/*`, página `admin/cache-stats`, tool e prompt em `lib/agi/`, e os 5 documentos `GENERATIVE_UI_*.md`.
- **FR-019**: O `CHANGELOG.md` MUST registrar cada remoção grande com o motivo e o commit que originou o órfão, para que a decisão seja recuperável por quem chegar depois.

**Consolidações**

- **FR-020**: Formatação de moeda, data, telefone e tempo relativo MUST ter uma implementação única, reutilizando o que já existe no projeto (APIs nativas de internacionalização e a biblioteca de datas já instalada) em vez de código próprio.
- **FR-021**: O sistema MUST reportar no boot, no log, toda env var obrigatória ausente ou com valor inseguro — e MUST NOT interromper o boot por causa disso. *(Restrição: hoje a validação lança exceção e há chaves obrigatórias pendentes em produção; ligar sem mudar esse comportamento derruba o site.)*
- **FR-022**: Hooks MUST viver em um único diretório com uma única convenção de nome.

**Prevenção de regressão** *(a entrega que impede a causa raiz de se repetir)*

- **FR-023**: A verificação de código não alcançável MUST rodar automaticamente em cada PR e MUST falhar o PR quando aparecer arquivo sem importador ou rota sem chamador fora da allowlist.
- **FR-024**: A allowlist de falsos positivos MUST ser explícita e versionada, com o motivo de cada entrada escrito ao lado.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A verificação de código não alcançável reporta **zero** arquivos sem importador e **no máximo 3** rotas sem chamador (as três com chamador externo confirmado, todas na allowlist) — partindo de 59 arquivos e 32 rotas.
- **SC-002**: O código de aplicação encolhe em pelo menos **24.000 linhas** (~12% da base medida) sem nenhuma funcionalidade alcançável por usuário deixar de existir.
- **SC-003**: `package.json` tem 12 dependências a menos e a instalação limpa continua produzindo um app que sobe.
- **SC-004**: Nenhum erro novo de rota inexistente ou falha de servidor aparece em produção nas 72 horas seguintes a cada deploy de história.
- **SC-005**: Um usuário consegue exportar sua lista de deals ou de contatos em PDF ou XLSX pela tela, em no máximo 3 cliques a partir da listagem.
- **SC-006**: Um PR que deixe um arquivo ou rota sem consumidor **falha automaticamente** — verificável abrindo um PR de teste que apaga uma página e deixa o backend dela para trás.
- **SC-007**: A suíte de testes continua verde em todas as histórias, e o tempo total de execução não aumenta.
- **SC-008**: Nenhum documento do repositório descreve como estando em produção um subsistema que não existe mais.

---

## Assumptions

- Os números da auditoria (22/08/2026) continuam válidos na hora da execução; se o repo receber features novas antes do início, a auditoria é re-rodada e os anexos regerados. A fonte de verdade é a saída do script, não a lista congelada no documento.
- As somas de linhas por história são aproximadas e se sobrepõem entre si (o Anexo A alimenta várias histórias). Só o total agregado de 24.411 é não sobreposto.
- Existe ambiente onde `npx next build` roda sem aplicar migrations, e existe forma de observar erros de produção (Sentry já instrumentado) para validar SC-004.
- A exportação (US4) reusa as 4 rotas existentes como estão; a história é de UI, não de backend novo. Se as rotas se mostrarem quebradas ao serem exercitadas pela primeira vez, o conserto entra no escopo dela.
- O app mobile Capacitor é buildado e aberto ao menos uma vez durante a US3, para validar que os módulos mobile apagados eram mesmo folhas soltas.
- Deleção não é perda: tudo volta do git. Nenhuma história precisa de branch de arquivamento ou cópia de segurança fora do histórico.

---

## Fora de escopo

- **`sirius-crm-483316-a2e815438069.json`** — service account do Google versionada na raiz do repositório. É achado de segurança, não de over-engineering: pede `/security-review` e rotação de credencial em passagem própria. Esta feature só o menciona para que não seja esquecido.
- Correção de bugs, performance e segurança em geral. A auditoria de origem cobriu exclusivamente over-engineering.
- Retomar o Generative UI. A decisão de 22/08 foi apagar; retomar seria feature nova, com spec própria.
