# Tasks: Cada conta só alcança o que é dela, e cada pessoa só o que pode ver

**Input**: `specs/011-isolamento-contas/` (spec, plan, research, data-model, contracts, quickstart)

**Tests**: pedidos pela spec (FR-003, FR-004). Cada falha corrigida ganha teste de comportamento, e a guarda estática é
o teste que roda no CI.

**Ordem**: as fases seguem a entrega do plano, P4 → P2 → P1 → P3, com um push por história depois de `tsc` e `vitest`
verdes. O rótulo `[USn]` é a história da spec: US1 = P1 acesso por id, US2 = P2 IA, US3 = P3 visibilidade,
US4 = P4 webhooks.

## Phase 1: Setup

- [X] T001 Declarar `undici` (versão já instalada, 7.21) nas dependências de `package.json` com `npm install undici@7.21.0 --save` rodado no diretório do projeto, e conferir que `package-lock.json` só mudou na entrada da raiz
- [X] T002 Acrescentar `Organization.wabaAppSecret String? @db.Text` e o modelo `AuditLog` (campos e índice de `data-model.md`) em `prisma/schema.prisma`, com a relação `auditLogs AuditLog[]` em `Organization` e `User`
- [X] T003 Gerar `prisma/migrations/20260925000000_isolamento_contas/migration.sql` com `prisma migrate diff --from-schema-datamodel <schema do HEAD> --to-schema-datamodel prisma/schema.prisma --script`, acrescentar `UPDATE "AgentAction" SET status = 'NEEDS_APPROVAL' WHERE status = 'PENDING';` e rodar `npx prisma generate --schema prisma/schema.prisma`

## Phase 2: Foundational

- [X] T004 [P] Criar `lib/meta-assinatura.ts` com `assinaturaMetaValida(corpoCru, cabecalho, segredo): boolean` (HMAC-SHA256 hex com prefixo `sha256=`, `timingSafeEqual`, `false` sem segredo ou cabeçalho)
- [X] T005 [P] Criar `lib/url-publica.ts` com `ipPublico(ip)`, `garantirUrlPublica(url, { exigirHttps })` e `fetchPublico(url, init, opcoes)`, usando um `Agent` do `undici` cujo `connect.lookup` recusa IP não público (faixas de `research.md` R3)
- [X] T006 [P] Criar `lib/auditoria.ts` com `registrarAuditoria({ organizationId, autor, acao, alvo, formato?, linhas?, ip? })`, que só insere
- [X] T007 [P] Criar `lib/visibilidade.ts` com `carregarAcesso(userId)`, `podeVerTudo`, `podeExportar`, `escopoPipeline`, `escopoNegocio` e `escopoTarefa` (regras de `data-model.md`, papel normalizado por `normalizeRole`)
- [X] T008 [P] Testes unitários em `__tests__/isolamento/fundacao.test.ts`: assinatura válida, inválida e ausente; IPs públicos e privados (v4, v6, mapeado); escopos por papel e por restrição de pipeline, inclusive lista vazia

## Phase 3: User Story 4, webhook só entra assinado e só sai para a internet (P4)

**Goal**: aviso da Meta sem assinatura válida é recusado sem gravar nada; chamada a endereço configurado pela conta só vai para IP público.

**Independent Test**: `__tests__/isolamento/webhooks.test.ts` manda aviso válido, inválido e sem assinatura aos três webhooks e confere 200/401 e o que foi gravado; automação com URL interna falha com o motivo.

- [X] T009 [US4] Em `app/api/webhooks/whatsapp-official/route.ts`, ler `request.text()`, achar as contas de cada `entry.id`, conferir a assinatura com o `wabaAppSecret` decifrado de cada uma e devolver 401 antes de gravar qualquer coisa
- [X] T010 [P] [US4] Em `app/api/webhooks/facebook-leads/route.ts`, conferir a assinatura com `FACEBOOK_APP_SECRET` antes de ler o corpo
- [X] T011 [P] [US4] Em `app/api/instagram/webhook/route.ts`, conferir a assinatura com `INSTAGRAM_APP_SECRET` antes de ler o corpo
- [X] T012 [US4] Em `app/api/integrations/whatsapp-official/settings/route.ts`, aceitar `appSecret` (cifrado com `lib/encryption.ts`, nunca devolvido) e responder `temAppSecret`; na página `app/[locale]/dashboard/settings/integrations/whatsapp-official/page.tsx` e no formulário dela, acrescentar o campo "App Secret" só de escrita e o aviso de chave faltando (texto do contrato)
- [X] T013 [P] [US4] Trocar `fetch` por `fetchPublico` em `lib/automations/actions.ts` (`SEND_WEBHOOK`, com `exigirHttps: true`), `lib/integrations/n8n-client.ts`, `lib/integrations/retry-handler.ts`, `lib/webhooks.ts` e `lib/webhooks/dispatcher.ts`. Ficaram de fora o cliente
  Evolution, que não existe mais no código, e `lib/scraping/crawler/simple-crawler.ts`, que só chama `google.com`
- [X] T014 [US4] Testes de comportamento em `__tests__/isolamento/webhooks.test.ts` (três webhooks × válido, inválido e sem assinatura; conta sem App Secret) e em `__tests__/isolamento/saida.test.ts` (`SEND_WEBHOOK` para `http://127.0.0.1`, `http://10.0.0.1`, `https://[::1]` e para domínio que resolve para IP privado)
- [X] T015 [US4] `tsc` + `vitest` verdes; commit só dos arquivos da US4 e da Phase 1–2; push (deploy)

## Phase 4: User Story 2, a IA sugere e quem grava é uma pessoa (P2)

**Goal**: toda proposta nasce aguardando aprovação, com rascunho; nada é enviado nem gravado fora da ação sem aprovação; a entidade é sempre da conta.

**Independent Test**: `__tests__/isolamento/ia.test.ts` dispara o gatilho com limiar 0 e confere que nada sai; aprova e confere que só o aprovado acontece, com o histórico e o dono certos; entidade de outra conta é recusada.

- [X] T016 [US2] Em `lib/agaas-executor.ts`, carregar a entidade (negócio ou contato) e o `input.contactId` por `(id, organizationId)` no começo de `executeAgentAction`, falhando sem ler nada se não achar
- [X] T017 [US2] Em `lib/agaas-executor.ts`, separar cada agente em `rascunho` (sem efeito colateral) e `aplicar` (usa o rascunho guardado em `output.rascunho`, ou gera se não houver), conforme a tabela de `research.md` R4
- [X] T018 [US2] Em `lib/agaas-executor.ts`: `LeadQualifier` aplica sob `pg_advisory_xact_lock`, não cria negócio se o contato já tem um aberto, grava `value: null` sem sugestão, e o dono é o responsável pelo contato ou o dono mais antigo da conta; `DealStageAnalyzer` grava `Activity` `STAGE_CHANGE` com quem aprovou; `ContactEnricher` e `LeadProfiler` não gravam no contato; `PropertyMatcher` usa `Product` da conta
- [X] T019 [US2] Em `lib/agaas-agent-trigger.ts`, criar toda ação como `NEEDS_APPROVAL` com o rascunho em `output`, sem executar; trocar a busca por `role: 'ADMIN'`; não criar `LeadQualifier` se já houver um pendente para o contato (sob a mesma trava)
- [X] T020 [US2] Em `app/api/v1/agents/actions/route.ts`, recusar com 404 `entityType`/`entityId` fora da conta; em `app/api/v1/agents/actions/[id]/review/route.ts` e `app/api/ia/actions/[id]/review/route.ts`, aplicar com `modo: 'aplicar'` e quem aprovou como autor
- [X] T021 [US2] Tirar o limiar de confiança de `components/ia/ia-settings.tsx`, `components/ia/agent-edit-modal.tsx`, `components/ia/ia-onboarding-wizard.tsx` e `app/[locale]/(ia)/IA/setup/page.tsx`, pondo a frase "Toda ação da IA passa pela sua aprovação"; em `components/ia/ia-feed.tsx`, mostrar o rascunho da ação
- [X] T022 [US2] Testes de comportamento em `__tests__/isolamento/ia.test.ts`: nada executa no gatilho; aprovação aplica só o aprovado; 3 mensagens seguidas → 1 proposta; sem valor → `null`; dono; empresa digitada intacta; entidade de outra conta recusada na API e no executor
- [X] T023 [US2] `tsc` + `vitest` verdes; commit da US2; push

## Phase 5: User Story 1, nenhuma conta alcança registro de outra (P1)

**Goal**: toda consulta ou gravação por id tem conta, conferência ou justificativa; a guarda estática garante isso no CI.

**Independent Test**: `__tests__/isolamento/guarda-estatica.test.ts` passa com 0 pontos e falha com um ponto plantado; os testes de comportamento das falhas corrigidas passam.

- [X] T024 [US1] Levar a varredura do protótipo (v2) para `__tests__/isolamento/varredura.ts` (função `varrer(raiz)`), com fixtures em `__tests__/isolamento/fixtures/` provando o que ela pega e o que ela aceita
- [X] T025 [US1] Criar `__tests__/isolamento/guarda-estatica.test.ts`, que roda `varrer` sobre `app/`, `lib/` e `components/` e falha listando `arquivo:linha modelo.op`
- [X] T026 [P] [US1] Corrigir ou justificar os pontos de `app/[locale]/**`, entre eles `addNote`, `addDealClosing` (produto) e `reorderDeals` em `app/[locale]/dashboard/deals/actions.ts`, e apagar dessa página as cópias sem importador (`updateDealStage`, `updateDealValue`)
- [X] T027 [P] [US1] Corrigir os pontos de `app/api/tasks/**` e `app/api/task-projects/**`: cada rota confere a tarefa ou o projeto pela conta antes de ler ou gravar os filhos (anexos, atividades, checklists, comentários, dependências, tempo, colunas, rótulos)
- [X] T028 [P] [US1] Corrigir ou justificar os pontos de `app/api/whatsapp/**`, `app/api/v1/**`, `app/api/instagram/**`, `app/api/support/**`, `app/api/integrations/**`, `app/api/export/**` e das demais rotas de `app/api/` com sessão
- [X] T029 [P] [US1] Justificar, com `// isolamento: <motivo>`, os pontos de cron, webhook, painel da equipe e `lib/` que agem sobre ids já resolvidos pelo chamador ou que cruzam contas por definição (`app/api/cron/**`, `app/api/webhooks/**`, `app/api/admin/**`, `app/[locale]/(admin)/**`, `lib/**`), corrigindo os que não se sustentam
- [X] T030 [US1] Testes de comportamento em `__tests__/isolamento/acesso-por-id.test.ts` para cada falha corrigida em T026–T029 (sessão da conta B com id da conta A → recusa e nada gravado)
- [X] T031 [US1] `tsc` + `vitest` verdes (guarda com 0 pontos); commit da US1; push

## Phase 6: User Story 3, cada pessoa vê só o que pode, em qualquer tela (P3)

**Goal**: a restrição de pipeline e a visibilidade de tarefa valem em toda leitura; exportar é de dono e gerente; exportação e "entrar como" ficam no registro de auditoria, que o dono consulta.

**Independent Test**: `__tests__/isolamento/visibilidade.test.ts` com dono, gerente e vendedora restrita confere o `where` de cada leitura, a recusa da exportação e o registro de auditoria.

- [X] T032 [US3] Trocar o `$queryRaw` e o filtro local de `components/dashboard/dashboard-tabs-wrapper.tsx` por `carregarAcesso` + `escopoPipeline` + `escopoNegocio`
- [X] T033 [P] [US3] Aplicar `escopoPipeline`/`escopoNegocio` em `app/[locale]/dashboard/analytics/page.tsx` (lista de pipelines, `pid` cortado aos permitidos, negócios e fechamentos) e em `app/[locale]/dashboard/analytics/lost-deals/page.tsx`
- [X] T034 [P] [US3] Aplicar `escopoNegocio` em `app/[locale]/dashboard/contacts/page.tsx`, `app/[locale]/dashboard/contacts/actions.ts`, `app/[locale]/dashboard/agenda/page.tsx`, `app/api/search/global/route.ts`, `app/api/agi/chat/route.ts` e `app/api/ia/actions/contact/route.ts`
- [X] T035 [P] [US3] Aplicar `escopoTarefa` em `app/api/tasks/route.ts`, `app/api/tasks/[taskId]/route.ts`, `app/api/tasks/analytics/route.ts`, `app/api/tasks/analytics/summary/route.ts`, `app/[locale]/dashboard/agenda/page.tsx` e `app/[locale]/dashboard/tasks/[projectId]/page.tsx`, apagando as regras locais de `orgRole === 'MEMBER'`
- [X] T036 [US3] Nas 4 rotas de `app/api/export/{contacts,deals}/{xlsx,pdf}/route.ts`: recusar 403 quem não `podeExportar`, aplicar `escopoNegocio` nos negócios e chamar `registrarAuditoria` com formato e linhas; esconder os botões de exportar para quem não pode, no componente que os mostra
- [X] T037 [US3] Em `app/[locale]/(admin)/admin/actions.ts#impersonateUser`, chamar `registrarAuditoria` na conta visitada com autor da equipe
- [X] T038 [US3] Criar `app/[locale]/dashboard/settings/auditoria/page.tsx` (só `OWNER`; tabela com data, quem, ação, alvo e linhas; estado vazio) e o link na navegação de configurações
- [X] T039 [US3] Testes em `__tests__/isolamento/visibilidade.test.ts`: escopos por papel, `pid` fora dos permitidos, tarefa "só administradores" e privada, exportação recusada ao vendedor, auditoria gravada na exportação e no "entrar como"
- [X] T040 [US3] `tsc` + `vitest` verdes; commit da US3; push

## Phase 7: Polish

- [X] T041 Rodar o `quickstart.md` seções 1 e 3 e registrar o resultado no fim de `quickstart.md`
- [X] T042 Atualizar `handoff.md` (sem descrever falhas) e marcar a spec como `Implemented` com os hashes; commit dos documentos da spec; push

## Dependencies & Execution Order

- **Phase 1 → Phase 2 → histórias.** A US4 usa `meta-assinatura`, `url-publica` e a migration. A US3 usa `visibilidade`, `auditoria` e a migration.
- **As histórias não dependem entre si**, mas a US1 (guarda) vem depois da US2, porque a reescrita do executor e do gatilho resolve 28 dos pontos da guarda.
- Dentro de cada história: implementação → testes → push.

## Parallel Opportunities

- T004–T008 são arquivos diferentes.
- T010, T011 e T013 são rotas e clientes independentes.
- T026–T029 são áreas diferentes do código.
- T033–T035 são telas diferentes.

## Implementation Strategy

A US4 é o MVP, porque é a única porta aberta para quem não tem conta: ela entra primeiro, sozinha. Cada história
seguinte vai para produção assim que fica verde. Se a sessão acabar no meio, o que está no ar já é completo por história.
