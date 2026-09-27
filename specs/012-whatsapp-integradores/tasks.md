---
description: "Tarefas da spec 012: WhatsApp pelo integrador que o cliente já contrata"
---

# Tasks: WhatsApp pelo integrador que o cliente já contrata

**Input**: `specs/012-whatsapp-integradores/` (spec, plan, research, data-model, contracts/rotas.md,
contracts/adaptador.md, quickstart)

**Tests**: pedidos. O quickstart §1 lista os arquivos de teste e o que cada um prova, e o SC-006 exige um teste por
caminho de envio. Em cada história, o teste vem antes do código e precisa falhar antes da implementação.

**Organização**: por história. A ordem das fases segue a entrega do plan: US4 vem antes de US3 porque as travas da
seção 6.5 sobem no mesmo push do envio (push B), e US3 sobe no push C.

## Formato: `[ID] [P?] [Story] Descrição`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem depender de tarefa aberta)
- **[Story]**: a história da tarefa (US1…US5)
- Caminhos relativos à raiz do repo (`CRM/crm-project`)

---

## Phase 1: Setup (schema do banco WA no lugar novo)

**Purpose**: preparar o push A sem mudar comportamento do app.

- [ ] T001 Mover `prisma/whatsapp.prisma` para `prisma/wa/schema.prisma` com `git mv`, sem mudar o conteúdo, e
  ajustar os caminhos relativos do bloco `generator` (o `output`, se for relativo) para o import de
  `lib/prisma-wa.ts` continuar resolvendo o `client-wa`
- [ ] T002 [P] Trocar `--schema prisma/whatsapp.prisma` por `--schema prisma/wa/schema.prisma` em `package.json`
  (script `build`), `Dockerfile` (linha 23) e `playwright.config.ts` (linha 85)
- [ ] T003 [P] Trocar o caminho do schema nos 6 jobs de `.github/workflows/ci.yml` que rodam
  `prisma generate --schema prisma/whatsapp.prisma`
- [ ] T004 [P] Atualizar o comentário de `scripts/migrate-wa-data.ts` (linha 12) para o caminho novo
- [ ] T005 Rodar o gate do quickstart §0 no console do container do EasyPanel: `DATABASE_URL_WA_DIRECT` definida,
  `migrate diff --from-url "$DATABASE_URL_WA"` contra o schema de hoje e a contagem de conexões por `status`.
  Registrar o resultado em `specs/012-whatsapp-integradores/handoff.md`. Diferença em tabela ou coluna que a migration
  altera: parar e voltar ao research R1

**Checkpoint**: `npx prisma generate --schema prisma/wa/schema.prisma` e `npx tsc --noEmit` passam; o gate liberou.

---

## Phase 2: Foundational (migration do banco WA e peças compartilhadas)

**Purpose**: o push A e as peças que todas as histórias usam.

**⚠️ CRITICAL**: nenhuma história começa antes desta fase.

### Push A: banco WA com migration formal

- [ ] T006 Gerar a linha de base com o schema ainda sem mudança:
  `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/wa/schema.prisma --script` em
  `prisma/wa/migrations/0_init/migration.sql`, e criar `prisma/wa/migrations/migration_lock.toml`
  (`provider = "postgresql"`)
- [ ] T007 Aplicar o data-model em `prisma/wa/schema.prisma`: enum `WhatsAppIntegrador` (`ZAPI`, `UAZAPI`,
  `EVOLUTION`), valor `SUSPENDED` em `WhatsAppStatus`; em `WhatsAppConnection`, os campos `provider`,
  `baseUrl`, `webhookSegredoHash @unique`, `instanciaChave @unique`, `statusMotivo`, `statusMudouEm`, `avisoVersao` e
  `@@index([provider, status])`; em `WhatsAppMessage`, `erro String? @db.Text`
- [ ] T008 Escrever `prisma/wa/migrations/20260928000000_integradores/migration.sql`, só aditiva:
  - `CREATE TYPE "WhatsAppIntegrador"` dentro de `DO $$ … EXCEPTION WHEN duplicate_object` (o PostgreSQL não tem
    `CREATE TYPE IF NOT EXISTS`);
  - `ALTER TYPE "WhatsAppStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED'`;
  - `ADD COLUMN IF NOT EXISTS` para cada coluna e `CREATE [UNIQUE] INDEX IF NOT EXISTS` para cada índice.

  Conferir com `migrate diff --from-migrations prisma/wa/migrations --to-schema-datamodel prisma/wa/schema.prisma`
  (com `--shadow-database-url` local) que a diferença é vazia
- [ ] T009 Em `docker/entrypoint.sh`, trocar a linha "Skipping WhatsApp DB push" por
  `echo "Running WhatsApp DB migrations..."` e `migrate deploy --schema prisma/wa/schema.prisma`. Se o deploy falhar,
  rodar `migrate resolve --applied 0_init --schema prisma/wa/schema.prisma` e o deploy de novo; qualquer outra falha
  derruba a subida pelo `set -e` (research R1)
- [ ] T010 Push A: `npx prisma generate`, `npx prisma generate --schema prisma/wa/schema.prisma`,
  `npx tsc --noEmit -p tsconfig.json` e `npx vitest run` verdes; commit só dos caminhos das T001–T009
  (`git commit -- <caminhos>`); push; conferir no log da subida a marcação de `0_init`, a aplicação da migration e o
  `/api/health` saudável (quickstart §3.1)

### Peças compartilhadas (push B)

- [ ] T011 [P] Criar `lib/whatsapp/integradores/tipos.ts` com `Credenciais`, `EstadoIntegrador`, `Midia`, `RefMidia`,
  `Evento`, a interface `Adaptador` e a classe `RecusaIntegrador` (`campo`, `motivo`), como em
  `contracts/adaptador.md`
- [ ] T012 [P] Escrever `__tests__/whatsapp-integrador/telefone.test.ts`: `+55 11 98765-4321`, `5511987654321`,
  `551187654321` e `11987654321` dão a mesma chave; DDD diferente dá outra; JID `@g.us`, `status@broadcast`,
  `@newsletter` e `@broadcast` são ignorados; `@lid` não vira telefone
- [ ] T013 Criar `lib/whatsapp/telefone.ts`: dígitos, 55 quando o número tem 10 ou 11 dígitos, chave
  `55 + DDD + últimos 8`, telefone a partir do JID, `jidIgnorado()` e o número de envio (research R6). T012 passa
- [ ] T014 Criar `lib/whatsapp/integradores/conexao.ts`:
  - `SELECT_PUBLICO` e `paraPublica(linha): ConexaoPublica` (contracts/rotas.md), a única forma de uma conexão sair
    numa resposta;
  - `carregarConexao(organizationId, id)`, com a conta no `where` (guarda estática da 011), que devolve a linha e as
    `Credenciais` decifradas com `decrypt()` de `lib/encryption.ts`;
  - `cifrarCredenciais(c)` com `encrypt()`;
  - `conexaoDaConversa(organizationId, contactId)`, pela última mensagem de entrada do contato (FR-018): devolve
    `{ via: 'oficial' }`, `{ via: 'integrador', connectionId }` ou `{ via: 'nenhuma' }` quando o contato nunca
    escreveu. Nulo não pode significar as duas coisas, senão o primeiro contato pelo integrador é recusado;
  - `numeroJaConectado(organizationId, phoneNumber, excetoId)`: compara pela chave do telefone com o
    `display_phone_number` de `getPhoneNumberInfo()` (`lib/integrations/whatsapp-official-client.ts`), quando a conta
    tem API oficial, e com as outras conexões da conta que têm credencial; devolve o motivo ou `null` (FR-008)
- [ ] T015 Criar `lib/whatsapp/integradores/estado.ts` com `mudarEstado(conexao, novo, motivo)`: `updateMany`
  condicionado ao estado anterior, grava `status`, `statusMotivo`, `statusMudouEm` (e `connectedAt` na primeira vez
  em `CONNECTED`) e devolve se mudou a linha. A notificação entra na T067
- [ ] T016 Criar `lib/whatsapp/integradores/index.ts` com `chamarIntegrador(url, init)`: `fetchPublico(url, init,
  { exigirHttps: true })` de `lib/url-publica.ts` com `AbortSignal.timeout(10_000)`; 401 e 403 viram
  `RecusaIntegrador`; nunca registra corpo nem cabeçalho de autenticação
- [ ] T017 [P] Atualizar `lib/__tests__/entitlements.test.ts`: chat liberado em Starter e Pro; limite 0/1/2/5 por
  plano; o add-on `WHATSAPP_EXTRA_INSTANCE` soma uma vez só; teste de 7 dias conta como Pro; conexões sem `provider`
  ou sem `apiKey` não contam
- [ ] T018 Em `lib/entitlements.ts` (FR-029, research R9): `can_use_chat_interface: true` em `STARTER` e `PRO`;
  `maxWhatsAppInstances` 0 no Free, 1 no Starter, 2 no Pro e 5 no Business; `checkWhatsAppInstanceLimit` calcula
  `PLAN_LIMITS[getEffectiveTier(org)].maxWhatsAppInstances` mais os add-ons ativos, conta só as linhas com `provider`
  e `apiKey` e aceita o id de uma linha reusada para não contá-la. Sai o uso de `Organization.whatsappInstances` no
  limite. T017 passa

**Checkpoint**: `npx vitest run __tests__/whatsapp-integrador lib/__tests__/entitlements.test.ts` verde.

---

## Phase 3: User Story 1 - O dono conecta o número pelo integrador que já contrata (Priority: P1) 🎯 MVP

**Goal**: o dono ou gerente escolhe o integrador, cola as credenciais, aceita o aviso, e o Sirius confere, grava o
aceite, liga o aviso e mostra "Conectado" ou o QR Code.

**Independent Test**: com uma instância de teste de cada integrador, conectar e conferir o estado "Conectado", o aceite
em Configurações → Auditoria, as credenciais que nunca voltam e a recusa sem aceite. Na suíte:
`__tests__/whatsapp-integrador/conexoes.test.ts`.

### Tests for User Story 1 ⚠️

- [ ] T019 [P] [US1] Escrever `__tests__/whatsapp-integrador/conexoes.test.ts`, com Prisma simulado no padrão de
  `__tests__/isolamento/`:
  - sem `aceite` dá `400` e nada gravado (nem aceite, nem conexão);
  - vendedor dá `403`; conta Free dá `403`;
  - `baseUrl` com `http://`, IP interno ou o próprio host do Sirius é recusado antes de qualquer `fetch`;
  - credencial recusada dá `422` com o campo, sem aceite nem conexão gravados;
  - limite atingido dá `409`; a mesma `instanciaChave` ativa em outra conta dá `409` sem dizer a conta;
  - o JSON de `GET /connections`, `POST /connections`, `GET` e `DELETE /connections/[id]` nunca contém o token, a
    API key, o segredo nem o hash

### Implementation for User Story 1

- [ ] T020 [P] [US1] Criar `lib/whatsapp/integradores/zapi.ts` com `conferir`, `ligarAviso`
  (`PUT update-every-webhooks`, `notifySentByMe: true`), `desligarAviso`, `qrCode` (`GET qr-code/image`) e `estado`
  (`GET status` + `GET device`), pela tabela do research R2 e com `chamarIntegrador()`
- [ ] T021 [P] [US1] Criar `lib/whatsapp/integradores/uazapi.ts` com as mesmas cinco operações (`GET /instance/status`,
  `POST /webhook` com `excludeMessages: [wasSentByApi]`, `POST /instance/connect`). Os caminhos *(confirmar)* ficam
  marcados com `// TODO(012 §2)` até a T059
- [ ] T022 [P] [US1] Criar `lib/whatsapp/integradores/evolution.ts` com as mesmas cinco operações
  (`GET /instance/connectionState/{inst}`, `GET /instance/fetchInstances`, `POST /webhook/set/{inst}`,
  `GET /instance/connect/{inst}`), com a API key da instância, nunca a global
- [ ] T023 [US1] Em `lib/whatsapp/integradores/index.ts`, acrescentar `adaptador(provider)`, que devolve o módulo de
  T020–T022
- [ ] T024 [US1] Reescrever `app/api/whatsapp/connections/route.ts`:
  - `GET`: `{ conexoes: ConexaoPublica[], limite, usadas, podeGerenciar }`, só conexões com `provider`;
  - `POST`: os 11 passos de contracts/rotas.md, na ordem. `autorizarConfiguracao()` (`lib/visibilidade.ts`), corpo
    em `z.discriminatedUnion('provider', …)`, `garantirUrlPublica(url, { exigirHttps: true })`, segredo de 32 bytes
    (`crypto.randomBytes`) em base64url com o SHA-256 hex em `webhookSegredoHash`, aviso em
    `${NEXT_PUBLIC_APP_URL}/api/webhooks/whatsapp-integrador/${segredo}`, `registrarAceiteIntegrador()`
    (`lib/auditoria.ts`) com `ip: ipDoPedido(req.headers)` antes de gravar a conexão (sem o `ip`, o aceite grava IP
    nulo sem erro), `avisoVersao = VERSAO_AVISO_INTEGRADOR`. No passo 11, número já conectado na conta
    (`numeroJaConectado`) deixa a conexão em `FAILED` com o motivo e desliga o aviso
- [ ] T025 [US1] Reescrever `app/api/whatsapp/connections/[id]/route.ts`: `GET` devolve `ConexaoPublica`; `DELETE`
  tenta `desligarAviso()` (falha só registrada), zera `apiKey`, `webhookSegredoHash` e `instanciaChave` e chama
  `mudarEstado(…, 'DISCONNECTED', 'desconectada por <nome>')` sem notificar. Conexão de outra conta: `404`
- [ ] T026 [US1] Reescrever `app/api/whatsapp/connections/[id]/qr-code/route.ts` como `GET` sem SSE: dono ou gerente,
  `adaptador().qrCode()`; pareada devolve `{ status: 'CONNECTED', phoneNumber }` e chama `mudarEstado` (com a
  conferência de `numeroJaConectado`); não pareada devolve `{ status: 'CONNECTING', qrCode }`. Serve também para
  reconectar `FAILED` e `DISCONNECTED` com credencial
- [ ] T027 [US1] Apagar as rotas do gateway: `app/api/whatsapp/connections/[id]/status/route.ts`,
  `app/api/whatsapp/connections/[id]/sync/route.ts`, `app/api/whatsapp/connections/[id]/disconnect/route.ts` e os
  diretórios vazios `app/api/whatsapp/connections/whatsmeow/[id]/{qr,status}`
- [ ] T028 [P] [US1] Em `app/api/integrations/whatsapp-official/settings/route.ts`, ao ativar a API oficial, comparar o
  `display_phone_number` de `getPhoneNumberInfo()` com o `phoneNumber` das conexões por integrador da conta que têm
  credencial, pela chave de `lib/whatsapp/telefone.ts`. Número igual dá `409`: "este número já está conectado por
  integrador; desconecte antes de ativar a API oficial" (FR-008, no sentido contrário)
- [ ] T029 [P] [US1] Reescrever `components/chat/new-connection-dialog.tsx`: escolha entre Z-API, uazapi e Evolution
  API; só os campos que cada integrador pede; `<AceiteIntegrador>` (`components/chat/aceite-integrador.tsx`) obrigatório
  para enviar; o `error` de `400`/`409`/`422`/`502` na tela, dizendo qual dado foi recusado; no `409` de limite, o
  caminho do add-on ou do plano seguinte; "API oficial" indicada como recurso do Business (US5-1). Com `201` em
  `CONNECTING`, abre o QR
- [ ] T030 [US1] Tirar `AceiteIntegrador` de `scripts/dead-code-allowlist.json` (depois da T029)
- [ ] T031 [P] [US1] Reescrever `components/chat/qr-code-dialog.tsx`: `GET /api/whatsapp/connections/[id]/qr-code` a
  cada 3 s enquanto aberto, troca para "Conectado" e fecha sozinho no `CONNECTED`; saem o SSE e as chamadas a
  `/status` e `/sync`
- [ ] T032 [P] [US1] Reescrever `components/chat/connection-manager.tsx` sobre `ConexaoPublica`: integrador, número,
  estado, motivo e "desde <hora>"; desconectar por `DELETE /api/whatsapp/connections/[id]` com confirmação na tela;
  reconectar abre o QR; sem `podeGerenciar`, só leitura
- [ ] T033 [US1] Em `components/chat/chat-interface.tsx`, tirar as chamadas a `/api/whatsapp/connections/[id]/sync`
  (linhas 167 e 185) e trocar o tipo das conexões por `ConexaoPublica`
- [ ] T034 [US1] Em `app/[locale]/dashboard/chat/page.tsx`:
  - `canUseFeature(getEffectiveTier(org), 'can_use_chat_interface')`, para o teste de 7 dias entrar;
  - `findMany` com `select: SELECT_PUBLICO` e `paraPublica()`: o componente cliente recebe só os campos de
    `ConexaoPublica` (FR-005);
  - o escopo do inbox passa a usar as conexões em qualquer estado, como `app/api/whatsapp/conversations/route.ts`;
  - `maxInstances` sai de `checkWhatsAppInstanceLimit`, não de `organization.whatsappInstances`
- [ ] T035 [P] [US1] Em `app/[locale]/dashboard/page.tsx`, `hasWhatsApp` conta conexão por integrador com credencial
- [ ] T036 [P] [US1] Em `components/chat/chat-upgrade-cta.tsx`, o texto do Free diz o que o recurso faz e que ele está
  nos planos pagos a partir do Starter, com o caminho para assinar (US1-7)
- [ ] T037 [US1] Rodar `npx vitest run __tests__/whatsapp-integrador/conexoes.test.ts __tests__/isolamento` e
  `npx tsc --noEmit`; a guarda estática da 011 continua em 0 pontos

**Checkpoint**: a conexão funciona de ponta a ponta nos três integradores, sem mensagens ainda.

---

## Phase 4: User Story 2 - O vendedor conversa pelo inbox do Sirius (Priority: P1)

**Goal**: mensagens de texto e mídia entram e saem pelo inbox que já existe, com dedup, estado só para frente e
resposta pela mesma conexão.

**Independent Test**: com uma conexão ativa de cada integrador, texto, foto e áudio do cliente aparecem no inbox; a
resposta pelo Sirius chega no celular; a resposta pelo celular aparece como enviada; o mesmo aviso três vezes dá uma
mensagem.

### Tests for User Story 2 ⚠️

- [ ] T038 [P] [US2] Criar as fixtures em `__tests__/whatsapp-integrador/fixtures/{zapi,uazapi,evolution}/` (a partir
  dos exemplos das docs, com tokens trocados por `REDACTED`; a T059 troca pelos corpos reais) e escrever
  `__tests__/whatsapp-integrador/interpretar.test.ts`: texto, imagem, áudio, documento, `fromMe`, LID com e sem
  telefone; grupo, status e canal viram `[]`; o eco (`fromApi`, `wasSentByApi`) vira `[]`; os avisos de entrega e de
  conexão viram o evento certo, com a tradução de estado do research R2
- [ ] T039 [P] [US2] Escrever `__tests__/whatsapp-integrador/status-entrega.test.ts`: `READ` seguido de `DELIVERED`
  fica `READ`; `FAILED` não passa por cima de `DELIVERED`; `FAILED` entra sobre `PENDING` e `SENT`
- [ ] T040 [P] [US2] Escrever `__tests__/whatsapp-integrador/webhook.test.ts`: segredo errado ou ausente dá `404` sem
  gravação nem leitura de outra conta (SC-007); o mesmo aviso três vezes dá uma mensagem (SC-004); conta Free ou
  conexão `SUSPENDED` dá `200` sem gravar; grupo dá `200` sem gravar; o corpo cru nunca aparece em `console.*`
- [ ] T041 [P] [US2] Escrever `__tests__/whatsapp-integrador/envio.test.ts` para `send-message` e `send-media`:
  contato ou conexão de outra conta dá `404`; `connectionId` diferente da conexão da conversa dá `409`; contato que
  nunca escreveu sai por uma conexão da conta com `201`; conexão fora de `CONNECTED` dá `409`; recusa do integrador
  grava `FAILED` com `erro` e responde `502`, e `RecusaIntegrador` leva a conexão para `FAILED`; o eco que chega antes
  do id (P2002 no update) apaga a linha pendente e devolve a do eco; mídia acima do limite dá `413` e tipo fora dá
  `415` antes de qualquer chamada
- [ ] T042 [P] [US2] Escrever `__tests__/whatsapp-integrador/entrada.test.ts` para `registrarEntrada`:
  - contato gravado como `(11) 98765-4321` recebe mensagem de `5511987654321` sem criar duplicado (US2-2);
  - o mesmo final com DDD diferente cria outro contato;
  - LID sem telefone reusa o contato da mensagem anterior com o mesmo `remoteJid`; sem histórico, cria um contato com
    `phone` nulo e `source: 'whatsapp_lid'`;
  - `fromMe` não chama `dispatchWebhookAsync`; entrada comum chama com `whatsapp.message.in`;
  - a mídia é gravada pela chave `orgId/contactId/messageId`, e a URL do integrador nunca vai para `mediaUrl`
- [ ] T043 [P] [US2] Escrever `__tests__/whatsapp-integrador/webhook-oficial.test.ts`, regressão da rota da API
  oficial que a T051 refaz: o mesmo `wamid` três vezes dá uma mensagem; `read` seguido de `delivered` fica `READ`; o
  `200` sai antes do processamento; o agente de IA continua disparando

### Implementation for User Story 2

- [ ] T044 [P] [US2] Em `lib/whatsapp/integradores/zapi.ts`, acrescentar `enviarTexto` (`send-text`), `enviarMidia`
  (`send-image`, `send-audio`, `send-video`, `send-document/{ext}` em base64), `baixarMidia` (pela URL do aviso) e
  `interpretar` (`ReceivedCallback`, `MessageStatusCallback`, `ConnectedCallback`, `DisconnectedCallback`)
- [ ] T045 [P] [US2] Em `lib/whatsapp/integradores/uazapi.ts`, acrescentar `enviarTexto` (`/send/text`),
  `enviarMidia` (`/send/media`), `baixarMidia` (`/message/download`) e `interpretar` (`messages`,
  `messages_update`, `connection`)
- [ ] T046 [P] [US2] Em `lib/whatsapp/integradores/evolution.ts`, acrescentar `enviarTexto` (`sendText`),
  `enviarMidia` (`sendMedia` e `sendWhatsAppAudio`, base64 sem prefixo `data:`), `baixarMidia`
  (`getBase64FromMediaMessage`) e `interpretar` (`messages.upsert`, `messages.update`, `connection.update` com
  `statusReason` 401 e 403). T038 passa
- [ ] T047 [US2] Criar `lib/whatsapp/entrada.ts` com `registrarEntrada(organizationId, connectionId | null, evento,
  baixar?)`:
  - casa o contato pela chave do telefone com SQL cru na conta (`regexp_replace(phone, '\D', '', 'g') LIKE …`),
    desempatando pelo DDD; só com LID, usa o contato da última mensagem da conta com o mesmo `remoteJid`, ou cria um
    sem telefone com `source: 'whatsapp_lid'`; sem contato, cria com o nome do perfil e `+55…` (research R6);
  - grava a mensagem com `create`, e P2002 em `(organizationId, messageId)` encerra ali (FR-012);
  - entrada nova fica não lida;
  - fora `fromMe`, dispara `whatsapp.message.in` por `dispatchWebhookAsync` de `lib/webhooks.ts` (FR-019); `fromMe`
    não dispara webhook, agente nem notificação (FR-015)
- [ ] T048 [US2] Em `lib/whatsapp/entrada.ts`, a mídia: com `baixar` informado, baixa, grava com `uploadMedia`
  (`lib/storage.ts`, chave `orgId/contactId/messageId`) e atualiza `mediaUrl` com a chave; o link do integrador nunca
  é gravado (FR-017, research R10). T042 passa
- [ ] T049 [US2] Em `lib/whatsapp/entrada.ts`, `avancarStatus(organizationId, messageIds, status)`: `updateMany` com
  `status: { in: <anteriores> }` na ordem `PENDING < SENT < DELIVERED < READ`, e `FAILED` só sobre `PENDING` ou
  `SENT` (FR-016). T039 passa
- [ ] T050 [US2] Criar `app/api/webhooks/whatsapp-integrador/[segredo]/route.ts` (contracts/rotas.md): busca pela
  SHA-256 do segmento em `webhookSegredoHash`; `404` sem achar ou sem `provider`; `400` em corpo inválido; `200` sem
  gravar para conta sem plano pago, `SUSPENDED` ou `FAILED`; `interpretar()` e `200`; em `after()` de `next/server`,
  mensagem → `registrarEntrada` com `baixar` do adaptador (em `DISCONNECTED`, também `mudarEstado` para `CONNECTED`,
  porque só chega mensagem de sessão viva), entrega → `avancarStatus`, conexão → `mudarEstado` (com
  `numeroJaConectado` no pareamento). Log só com tipo do evento, conexão, id da mensagem e `atrasoMs` (fim da gravação
  menos `enviadaEm`, para o SC-003). T040 passa
- [ ] T051 [US2] Em `app/api/webhooks/whatsapp-official/route.ts`, passar a entrada para `registrarEntrada(org, null,
  …)` e os estados para `avancarStatus`, com o processamento em `after()` depois do `200`; sai o `findFirst` +
  `create`; os agentes de IA continuam disparando só aqui. T043 passa
- [ ] T052 [US2] Reescrever `app/api/whatsapp/send-message/route.ts` (sai o `410`): `getSession()`, contato e conexão
  da conta (`carregarConexao`); `conexaoDaConversa` com `via: 'integrador'` igual ao `connectionId`, ou
  `via: 'nenhuma'` com qualquer conexão da conta; `CONNECTED` e plano pago; grava `PENDING`,
  `adaptador().enviarTexto()`, grava o id e `SENT`; P2002 no update apaga a própria linha e devolve a do eco; falha do
  integrador grava `FAILED` com `erro` e responde `502`, e `RecusaIntegrador` também leva a conexão para `FAILED` por
  `mudarEstado`, sem esperar o cron. O passo das travas entra na T063
- [ ] T053 [US2] Reescrever `app/api/whatsapp/send-media/route.ts` na mesma ordem, com `FormData`: limites de 5 MB
  (imagem), 16 MB (áudio e vídeo) e 100 MB (documento), `413`/`415` com o limite escrito, envio em base64, cópia no
  storage por `uploadMedia`. T041 passa
- [ ] T054 [P] [US2] Incluir `erro` no `select` de `app/api/contact/[id]/interactions/route.ts` e no tipo da mensagem
  em `components/chat/message-area/types.ts`
- [ ] T055 [US2] Em `components/chat/message-area/use-send-message.ts`, a resposta `409`/`502` mantém a mensagem na
  tela como "não enviada" com o motivo do `error`, sem apagar o texto
- [ ] T056 [US2] Em `components/chat/message-area/message-bubble.tsx`, a bolha `FAILED` mostra "não enviada ·
  <erro>"
- [ ] T057 [US2] Na tela, a resposta sai pela conexão da conversa (FR-018, US2-7), depois da T055 (mesmo arquivo):
  - `connectionId` em `ChatLastMessage` e no SELECT da última mensagem em `lib/chat/queries.ts`;
  - em `components/chat/message-area/index.tsx`, o `conn` sai do `connectionId` da conversa, não de `connections[0]`;
  - em `components/chat/message-area/use-send-message.ts`, a rota sai da conversa: nulo vai para `send-waba` e
    `send-waba-media`, preenchido vai para `send-message` e `send-media`. Sai a escolha pelo `wabaEnabled` da conta;
  - conversa sem mensagem usa a API oficial se a conta tiver; senão a única conexão por integrador; com mais de uma,
    o vendedor escolhe o número em `components/chat/message-area/composer.tsx`;
  - `components/chat/chat-interface.tsx` (linha 395) passa todas as conexões da conta, não só as `CONNECTED`, para a
    conversa de uma conexão caída mostrar o motivo
- [ ] T058 [P] [US2] Em `components/chat/contact-sidebar.tsx` e `components/contacts/contact-profile-modal.tsx`, o
  contato com `source: 'whatsapp_lid'` e sem telefone mostra "Completar cadastro", com o campo de telefone para
  preencher (caso de borda do LID)
- [ ] T059 [US2] Teste de contrato do quickstart §2, com instância de teste e chip de teste de cada integrador, por um
  túnel HTTPS: conferir texto, foto e áudio nos dois sentidos, QR e eco. Corrigir os caminhos `// TODO(012 §2)` em
  `lib/whatsapp/integradores/uazapi.ts` e o `desligarAviso` de `lib/whatsapp/integradores/zapi.ts`, e trocar as
  fixtures de `__tests__/whatsapp-integrador/fixtures/` pelos corpos reais com `REDACTED`

**Checkpoint**: US1 e US2 funcionam nos três integradores. Não sobe sem a Phase 5.

---

## Phase 5: User Story 4 - As regras da seção 6.5 valem no código (Priority: P2)

**Goal**: pelo integrador só sai envio de pessoa, para um destinatário, pelo inbox; "SAIR" trava o contato; o limite
por minuto recusa na hora.

**Independent Test**: `travas.test.ts` cobre cada origem e cada trava; `caminhos-de-envio.test.ts` confere que nenhum
outro caminho importa o envio pelo integrador (SC-006).

### Tests for User Story 4 ⚠️

- [ ] T060 [P] [US4] Escrever `__tests__/whatsapp-integrador/travas.test.ts`: toda origem diferente de `'inbox'` é
  recusada com o caminho para a API oficial; dois destinatários são recusados; envio automático sem entrada anterior é
  recusado (FR-021); "SAIR", "Parar." e "stop" travam e uma mensagem nova destrava; o 21º envio do minuto é recusado
  com "aguarde"
- [ ] T061 [P] [US4] Escrever `__tests__/whatsapp-integrador/caminhos-de-envio.test.ts`, estático: um caso por
  arquivo, conferindo que `app/api/whatsapp/forward/route.ts`, `app/api/whatsapp/send-template/route.ts`,
  `app/api/whatsapp/send-buttons/route.ts`, `app/api/whatsapp/send-location/route.ts`, `lib/agaas-executor.ts` e
  `app/api/v1/whatsapp/send/route.ts` não importam `lib/whatsapp/integradores`

### Implementation for User Story 4

- [ ] T062 [US4] Criar `lib/whatsapp/integradores/travas.ts`:
  - `avaliarTravas({ origem, destinatarios, ultimaEntrada, enviosUltimoMinuto })`, pura, que devolve `null` ou o
    motivo; `origem` é um tipo literal com só `'inbox'` permitido;
  - `pediuParaParar(texto)`, pura, sem espaço nem pontuação e em minúsculas, igual a `sair`, `parar` ou `stop`;
  - `LIMITE_POR_MINUTO = 20`;
  - `dadosDasTravas(organizationId, connectionId, contactId)`: a última mensagem de entrada do contato na conexão e a
    contagem de saídas da conexão nos últimos 60 s.

  T060 passa
- [ ] T063 [US4] Ligar as travas no passo 4 de `app/api/whatsapp/send-message/route.ts` e
  `app/api/whatsapp/send-media/route.ts`, com `origem: 'inbox'` e um destinatário: recusa dá `409` com o motivo, antes
  de gravar `PENDING`, e fica registrada em log sem o texto da mensagem
- [ ] T064 [US4] Em `app/api/whatsapp/forward/route.ts`, conta sem API oficial responde `409` com o motivo do FR-020
  ("envio para vários contatos só pela API oficial") em vez de "WABA não configurado", e
  `components/chat/forward-modal.tsx` mostra esse motivo
- [ ] T065 [US4] Em `components/chat/message-area/window-banners.tsx` e `components/chat/message-area/composer.tsx`,
  a conversa de integrador cuja última entrada `pediuParaParar()` mostra a trava e desabilita o envio até chegar
  mensagem nova (FR-022)

**Checkpoint**: push B com US1, US2 e US4: `npx tsc --noEmit`, `npx vitest run` e a guarda estática verdes; commit só
dos caminhos da 012; push.

---

## Phase 6: User Story 3 - O dono fica sabendo quando a conexão cai (Priority: P2)

**Goal**: queda avisada pelo integrador ou detectada pelo cron vira uma notificação por queda para dono e gerentes e um
aviso no inbox; a conta sem plano pago fica `SUSPENDED`.

**Independent Test**: desparear o celular de uma conexão de teste; em até 15 minutos o dono recebe a notificação e o
inbox mostra o aviso, com e sem o aviso do integrador. Na suíte: `estado.test.ts`.

### Tests for User Story 3 ⚠️

- [ ] T066 [P] [US3] Escrever `__tests__/whatsapp-integrador/estado.test.ts`: aviso e cron concorrentes na mesma
  queda geram uma notificação; a volta para `CONNECTED` registra o tempo fora no motivo; a desconexão pelo dono não
  notifica; `SUSPENDED` notifica; o cron com erro de rede não muda estado e conta em `falhas`

### Implementation for User Story 3

- [ ] T067 [US3] Em `lib/whatsapp/integradores/estado.ts`, quando `mudarEstado` muda a linha para `DISCONNECTED`,
  `FAILED` ou `SUSPENDED`, notificar os usuários `OWNER` e `GERENTE` da conta por `createNotifications`
  (`lib/notifications.ts`), tipo `SYSTEM`, com link para a tela de conexão e o texto "WhatsApp (<integrador>)
  desconectado desde <hora> — reconectar"; a volta para `CONNECTED` depois de queda grava "voltou depois de N min
  fora". O padrão é notificar, com a opção `notificar: false`; passar `notificar: false` na chamada de `mudarEstado`
  em `app/api/whatsapp/connections/[id]/route.ts` (T025), senão a desconexão feita pelo próprio dono passa a notificar
- [ ] T068 [US3] Criar `app/api/cron/whatsapp-integradores/route.ts`, com a autenticação por `CRON_SECRET` de
  `app/api/cron/deal-idle/route.ts`: conexões com `provider` e `apiKey`, de 10 em 10 em paralelo; conta sem plano
  pago → `SUSPENDED`; conta paga com conexão `SUSPENDED` → o estado do integrador, sem novo aceite se `avisoVersao`
  é a vigente e `FAILED` com "aceite o aviso novo para reativar" se não é (FR-027); `RecusaIntegrador` → `FAILED`;
  estado diferente do gravado → `mudarEstado`; tempo esgotado ou 5xx → `falhas`; grava `lastSyncAt`; responde
  `{ conferidas, mudancas, falhas, ms }`. T066 passa
- [ ] T069 [US3] Em `components/chat/chat-interface.tsx`, um aviso no topo do inbox para cada conexão fora de
  `CONNECTED`, com integrador, estado, "desde <hora>" e, para quem gerencia, o botão de reconectar; usa a busca de
  conexões que já roda a cada 10 s
- [ ] T070 [US3] Em `components/chat/connection-manager.tsx`, explicar `FAILED` pelo motivo: sessão encerrada pede
  parear de novo e abre o QR; número bloqueado aponta a API oficial como saída; `SUSPENDED` diz que o plano não
  inclui WhatsApp e mostra o caminho do plano
- [ ] T071 [US3] Registrar `GET <app>/api/cron/whatsapp-integradores` a cada 5 minutos, com
  `Authorization: Bearer $CRON_SECRET`, no mesmo agendador dos outros `/api/cron/*` (quickstart §3.2), e anotar onde
  ficou em `specs/012-whatsapp-integradores/handoff.md`

**Checkpoint**: push C no mesmo dia do push B, antes de anunciar o recurso. A primeira chamada do cron responde `200`
com `conferidas`.

---

## Phase 7: User Story 5 - Starter e Pro passam a ter WhatsApp, e os textos dizem isso (Priority: P3)

**Goal**: os textos públicos dizem o que cada plano libera (FR-030). A liberação no código já veio na T018 e o
"API oficial no Business" do diálogo na T029.

**Independent Test**: contas Starter, Pro e Business abrem o inbox e conectam por integrador, e uma Free não; a busca
do quickstart §3.8 não encontra "WhatsApp só no Business" nem WhatsApp oficial no Starter ou no Pro.

Em todas as tarefas desta fase: "WhatsApp Business" como nome do aplicativo não muda. Muda a frase que diz que o
WhatsApp é só do plano Business, ou que Starter e Pro têm a API oficial.

- [ ] T072 [P] [US5] Revisar os 13 trechos de `messages/pt-BR/marketing.json`, incluindo a tabela da página de
  preços: WhatsApp por integrador em Starter (1 conexão), Pro (2) e Business (5); API oficial no Business
- [ ] T073 [P] [US5] Revisar `lib/help-articles.ts` (4 trechos) e `lib/faq-schema.ts` (3), mantendo o FAQ e o JSON-LD
  com o mesmo texto
- [ ] T074 [P] [US5] Revisar `app/[locale]/(marketing)/features/page.tsx` (2), `app/[locale]/(marketing)/anuario/page.tsx`
  (1) e `messages/pt-BR/emails.json` (1)
- [ ] T075 [P] [US5] Revisar `lib/blog/posts/whatsapp-api-oficial-meta-crm.ts` (24 trechos)
- [ ] T076 [P] [US5] Revisar `lib/blog/posts/crm-com-whatsapp-integrado.ts` (22 trechos), incluindo a menção ao
  gateway `whatsmeow`
- [ ] T077 [P] [US5] Revisar `lib/blog/posts/representante-comercial-autonomo-ferramentas.ts` (18) e
  `lib/blog/posts/whatsapp-vendas-b2b-estrategias.ts` (14)
- [ ] T078 [P] [US5] Revisar os comparativos `lib/blog/posts/sirius-vs-rd-station.ts` (10),
  `lib/blog/posts/alternativas-ao-pipedrive-brasil.ts` (7), `lib/blog/posts/sirius-vs-pipedrive.ts` (6) e
  `lib/blog/posts/sirius-vs-hubspot.ts` (3)
- [ ] T079 [P] [US5] Revisar os posts com 1 a 3 trechos: `como-escolher-crm-b2b-2026.ts`,
  `crm-para-representante-comercial-2026.ts`, `como-migrar-planilha-para-crm.ts`, `roi-de-crm.ts`,
  `melhor-crm-2026-comparativo.ts`, `crm-para-agencia-de-marketing.ts`, `crm-gratuito-brasil-2026.ts`,
  `como-usar-google-maps-para-prospectar.ts`, `como-funciona-sofia-ia-sirius.ts` e
  `agentes-ia-vs-saas-tradicional.ts`, todos em `lib/blog/posts/`
- [ ] T080 [P] [US5] Em `app/[locale]/dashboard/settings/integrations/page.tsx`, um cartão "WhatsApp por integrador"
  (Z-API, uazapi e Evolution API), liberado a partir do Starter, com link para `/dashboard/chat`; o cartão "WhatsApp
  Oficial" passa a indicar "plano Business" (US5-1)
- [ ] T081 [US5] Rodar a busca do quickstart §3.8 em `messages lib app` e zerar o que sobrar; conferir que
  `app/[locale]/dashboard/billing/plans` mostra os limites novos a partir de `PLAN_LIMITS`

**Checkpoint**: push D, junto com os documentos da Phase 8.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T082 Rodar `npx tsc --noEmit -p tsconfig.json`, `npx vitest run`, o ESLint do CI e `node scripts/audit-dead-code.js`;
  conferir por `grep` que nenhum `console.*` dos arquivos novos em `lib/whatsapp/` e `app/api/webhooks/whatsapp-integrador/`
  registra corpo, credencial ou cabeçalho de autenticação
- [ ] T083 Trocar o "não medido" das conexões antigas nas Assumptions de `specs/012-whatsapp-integradores/spec.md`
  pela contagem da T005
- [ ] T084 Depois do deploy, rodar o quickstart §3 inteiro (aviso sem segredo dá `404`, conta Starter de teste, queda,
  seção 6.5 e a consulta do SC-002 cruzada com `AuditLog`) e, depois de 7 dias, o p95 de `atrasoMs` do §3.9, que
  precisa ficar em até 10 s (SC-003). Registrar o resultado em `specs/012-whatsapp-integradores/handoff.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependência. A T005 (gate) bloqueia o push A.
- **Foundational (Phase 2)**: depois do Setup. T006 antes de T007 (a linha de base sai do schema sem mudança). T010
  (push A) antes de qualquer push de código. Bloqueia todas as histórias.
- **US1 (Phase 3)**: depois da Phase 2.
- **US2 (Phase 4)**: depois da Phase 2. Usa os adaptadores de T020–T022 (mesmo arquivo, então T044–T046 vêm depois
  deles) e a conexão ativa de US1 para o teste real (T059).
- **US4 (Phase 5)**: depende de T052–T053 (as rotas de envio). **Push B = US1 + US2 + US4**: o envio pelo integrador
  não sobe sem as travas, porque os Termos já prometem.
- **US3 (Phase 6)**: depois da Phase 2 e de T025 (`notificar: false`). Push C no mesmo dia do push B.
- **US5 (Phase 7)**: os textos só sobem depois de US1 e US2 no ar.
- **Polish (Phase 8)**: T084 depois do último deploy.

### Dentro de cada história

- teste antes, falhando; depois biblioteca (`lib/`), rotas (`app/api/`) e tela (`components/`);
- T023 depois de T020–T022; T030 depois de T029; T047 → T048 → T049 (mesmo arquivo); T052 → T063 e T053 → T063;
  T057 depois de T055 (mesmo `use-send-message.ts`); T028 depois de T013 (usa a chave do telefone).

### Parallel Opportunities

- Setup: T002, T003 e T004.
- Foundational: T011, T012 e T017 juntos; T013–T016 e T018 em arquivos diferentes, cada um depois do seu teste.
- US1: T019 e T020–T022 juntos; depois T028, T029, T031, T032, T035 e T036 juntos.
- US2: T038–T043 juntos; T044–T046 juntos; T054 junto com T047–T053; T058 junto com T057.
- US4: T060 e T061 juntos.
- US5: T072–T080, todos juntos.

---

## Parallel Example: User Story 1

```bash
# Teste e adaptadores juntos:
Task: "T019 conexoes.test.ts em __tests__/whatsapp-integrador/conexoes.test.ts"
Task: "T020 operações de conexão em lib/whatsapp/integradores/zapi.ts"
Task: "T021 operações de conexão em lib/whatsapp/integradores/uazapi.ts"
Task: "T022 operações de conexão em lib/whatsapp/integradores/evolution.ts"

# Telas juntas, depois das rotas T024–T026:
Task: "T029 components/chat/new-connection-dialog.tsx"
Task: "T031 components/chat/qr-code-dialog.tsx"
Task: "T032 components/chat/connection-manager.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "T038 fixtures + interpretar.test.ts"
Task: "T039 status-entrega.test.ts"
Task: "T040 webhook.test.ts"
Task: "T041 envio.test.ts"
Task: "T042 entrada.test.ts"
Task: "T043 webhook-oficial.test.ts"
# depois:
Task: "T044 envio, mídia e interpretar em zapi.ts"
Task: "T045 envio, mídia e interpretar em uazapi.ts"
Task: "T046 envio, mídia e interpretar em evolution.ts"
```

---

## Implementation Strategy

### MVP (US1)

1. Phase 1 e Phase 2, com o push A no ar e a migration aplicada.
2. Phase 3: a conexão funciona nos três integradores.
3. **Parar e validar** com as instâncias de teste. US1 sozinha não sobe para produção, porque conecta e não conversa.

### Entrega incremental (plan, seção Entrega)

1. **Push A**: banco WA (T001–T010).
2. **Push B**: US1 + US2 + US4, depois do teste de contrato (T059).
3. **Push C**: US3, no mesmo dia do B, com o cron registrado (T071).
4. **Push D**: US5 e os documentos (T072–T083).

## Notes

- Push em `main` é deploy (~2 min), e o repo é público: commit com os caminhos explícitos (`git commit -- <caminhos>`)
  e mensagem que descreve o comportamento novo.
- Nada de `db execute` manual nem `db push`; o build de produção só vale no Docker.
- Ao implementar, invocar `whatsapp` antes dos adaptadores (T020–T022, T044–T046), `crm-tenancy-security` nas rotas
  (T024–T026, T028, T050, T052–T053, T068), e `accessibility` e `ux-writing` nas telas (T029, T031, T032, T036,
  T055–T056, T057, T058, T065, T069–T070, T080).
- Ler a doc do Next em `node_modules/next/dist/docs/` antes do código de rota (`after` já conferido).
