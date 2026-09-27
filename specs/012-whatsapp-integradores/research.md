# Research: 012 WhatsApp pelo integrador que o cliente já contrata

## R1. Onde a conexão mora e como o banco WA passa a ter migration

- **Decisão**: a conexão por integrador é uma linha de `WhatsAppConnection`, no banco WA. É lá que já estão as
  mensagens, a chave `connectionId` da mensagem, a contagem de limite (`checkWhatsAppInstanceLimit`) e o filtro do
  inbox (`lib/chat/queries.ts`). O banco WA passa a ter migration formal:
  - `prisma/whatsapp.prisma` muda para `prisma/wa/schema.prisma`. O Prisma 5 procura `migrations/` ao lado do
    schema, e com os dois schemas no mesmo diretório as duas bases dividiriam `prisma/migrations`.
  - `prisma/wa/migrations/0_init/` guarda a linha de base, gerada por
    `migrate diff --from-empty --to-schema-datamodel` sobre o schema de hoje. Ela nunca roda no banco de produção.
  - `prisma/wa/migrations/20260928000000_integradores/` é aditiva e escrita com `IF NOT EXISTS`.
  - No `docker/entrypoint.sh`, o passo que hoje pula o banco WA passa a rodar
    `migrate deploy --schema prisma/wa/schema.prisma`. Se o deploy falhar, o script marca `0_init` como aplicada
    (`migrate resolve --applied 0_init`) e roda o deploy de novo. Isso cobre a primeira subida, em que o banco criado
    pelo gateway Go não tem histórico e o deploy responde P3005. Qualquer outra falha derruba a subida: o `resolve`
    responde P3008 (a linha de base já está marcada) e o `set -e` para o container.
- **Por quê**:
  - hoje nenhum caminho aplica mudança no banco WA. O entrypoint diz "schema managed by whatsmeow Go service", e esse
    serviço não existe mais;
  - `db execute` manual é proibido pelo `CLAUDE.md`, e `db push --accept-data-loss` apaga o que não está no schema.
- **Pré-condição (gate antes do push da migration)**: no console do container do EasyPanel, com a imagem de hoje,
  rodar o comparativo só de leitura:

  ```sh
  node node_modules/prisma/build/index.js migrate diff \
    --from-url "$DATABASE_URL_WA" --to-schema-datamodel prisma/whatsapp.prisma --script
  ```

  - **Saída vazia, ou com itens que o app não usa**: segue.
  - **Falta tabela ou coluna que a migration altera**: para e revisa.
  - `DATABASE_URL_WA_DIRECT` precisa estar definida, porque é o `directUrl` que o `migrate` usa.
- **Indício de que o banco bate com o schema**: a página do chat lê `whatsAppConnection.findMany` sem `select` e a rota
  oficial grava `whatsAppMessage` com os campos do schema. As duas funcionam em produção.
- **Alternativas recusadas**:
  - **Tabela nova no banco CRM**, que já tem migration: a mensagem continua no banco WA com chave para
    `WhatsAppConnection`, o motivo da falha precisa de coluna na mensagem de qualquer jeito, e duas tabelas de conexão
    em bancos diferentes dividiriam o inbox e o limite.
  - **Reaproveitar colunas sem migration** (`apiKey`, `webhookUrl`, `qrCode`): não há onde guardar o integrador, o
    segredo do aviso nem o motivo do estado.

## R2. Os três integradores

Fontes: documentação da Z-API (`developer.z-api.io`), guia de webhooks da uazapi (`docs.uazapi.com`) e referência da
Evolution API v2. A doc da uazapi é renderizada no navegador, e alguns caminhos marcados com *(confirmar)* vêm do
contrato OpenAPI 2.x e de SDKs públicos. O teste de contrato do quickstart confirma cada um numa instância real antes do
push.

| | Z-API | uazapi | Evolution API v2 |
|---|---|---|---|
| **Credenciais que o dono cola** | ID da instância, token da instância e Client-Token (token de segurança da conta, quando ligado) | endereço do servidor (`https://<sub>.uazapi.com`) e token da instância | endereço do servidor, nome da instância e API key da instância |
| **Autenticação** | caminho `…/instances/{id}/token/{token}/` + cabeçalho `Client-Token` | cabeçalho `token` | cabeçalho `apikey` |
| **Endereço** | fixo: `https://api.z-api.io` | do cliente, sempre HTTPS público | do cliente (autohospedada), sempre HTTPS público |
| **Estado (tela e cron)** | `GET status` → `connected`, `error`, `smartphoneConnected` | `GET /instance/status` → `instance.status` (`connected`, `connecting`, `disconnected`), `status.loggedIn` *(confirmar)* | `GET /instance/connectionState/{inst}` → `instance.state` (`open`, `connecting`, `close`) |
| **Número conectado** | `GET device` → `phone` | `instance.owner` no status | `GET /instance/fetchInstances?instanceName={inst}` → `ownerJid` |
| **QR Code** | `GET qr-code/image` → `value` (data URI), renova a cada ~20 s | `POST /instance/connect` sem `phone` → `instance.qrcode` *(confirmar)* | `GET /instance/connect/{inst}` → `base64` |
| **Ligar o aviso** | `PUT update-every-webhooks` com `{ value, notifySentByMe: true }` (só HTTPS) | `POST /webhook` com `{ enabled, url, events: [messages, messages_update, connection], excludeMessages: [wasSentByApi], addUrlEvents: false, addUrlTypesMessages: false }` | `POST /webhook/set/{inst}` com `{ webhook: { enabled, url, byEvents: false, base64: false, events: [MESSAGES_UPSERT, MESSAGES_UPDATE, CONNECTION_UPDATE] } }` |
| **Desligar o aviso** | o mesmo, com `value: ""` *(confirmar)* | o mesmo, com `enabled: false` | o mesmo, com `enabled: false` |
| **Enviar texto** | `POST send-text` `{ phone, message }` → `messageId` | `POST /send/text` `{ number, text }` → `messageid` | `POST /message/sendText/{inst}` `{ number, text }` → `key.id` |
| **Enviar mídia** | `send-image`, `send-audio`, `send-video`, `send-document/{ext}` (URL ou base64) | `POST /send/media` `{ number, type, file, text, docName }` | `sendMedia` `{ number, mediatype, mimetype, media, caption, fileName }` e `sendWhatsAppAudio` `{ number, audio }` (base64 sem prefixo `data:`) |
| **Baixar mídia recebida** | URL no próprio aviso (`image.imageUrl`, `audio.audioUrl`, `video.videoUrl`, `document.documentUrl`, `sticker.stickerUrl`), guardada por 30 dias | `POST /message/download` `{ id, return_base64: true }` *(confirmar)* | `POST /chat/getBase64FromMediaMessage/{inst}` `{ message: { key: { id } } }` |
| **Aviso de mensagem** | `type: ReceivedCallback`, `messageId`, `phone`, `fromMe`, `fromApi`, `momment` (ms), `senderName`, `text.message` | `EventType: messages`, `message.{ messageid, chatid, fromMe, isGroup, messageType, text, messageTimestamp, wasSentByApi, sender_pn, sender_lid }` | `event: messages.upsert`, `data.key.{ remoteJid, fromMe, id }`, `data.key.remoteJidAlt` / `data.senderPn`, `data.pushName`, `data.message.*`, `data.messageTimestamp` (s) |
| **Grupo, status e canal** | `isGroup`, `broadcast`, `isNewsletter` | `isGroup`, `chatid` com `@g.us`, `@broadcast` ou `@newsletter` | `remoteJid` com `@g.us`, `status@broadcast` ou `@newsletter` |
| **LID** | `chatLid` / `senderLid` (`…@lid`), com `phone` quando o número é conhecido | `sender_lid`, com `sender_pn` quando conhecido | `remoteJid` em `@lid`, com o número em `remoteJidAlt` / `senderPn` quando conhecido |
| **Estado de entrega** | `MessageStatusCallback`: `status` (`SENT`, `RECEIVED`, `READ`, `PLAYED`) e `ids[]` | `EventType: messages_update` (entregue, lida) e ids | `event: messages.update`: `status` (`SERVER_ACK`, `DELIVERY_ACK`, `READ`, `PLAYED`, `ERROR`) |
| **Conexão** | `ConnectedCallback` e `DisconnectedCallback` (`error`) | `EventType: connection`, com `instance.status` | `event: connection.update`, com `state` e `statusReason` (401 = sessão encerrada, 403 = número proibido) |
| **Assina o aviso?** | não | não (o corpo traz o `token` da instância) | não (aceita cabeçalhos fixos, e o corpo traz a `apikey`) |

- **Decisão**: um adaptador por integrador em `lib/whatsapp/integradores/`, todos com as mesmas oito operações:
  conferir, ligar o aviso, desligar o aviso, QR, estado, enviar texto, enviar mídia e baixar mídia. Os adaptadores
  também traduzem o aviso para um evento único (mensagem, estado de entrega ou conexão). Toda chamada de saída passa por
  `fetchPublico(url, init, { exigirHttps: true })` com `AbortSignal.timeout(10_000)`.
- **Tradução do estado de entrega**: `SENT` / `SERVER_ACK` → `SENT`; `RECEIVED` / `DELIVERY_ACK` / entregue →
  `DELIVERED`; `READ` / `PLAYED` / lida → `READ`; `ERROR` → `FAILED`. `READ_BY_ME` é ignorado.
- **Tradução do estado da conexão**:

  | Integrador responde | Estado no Sirius |
  |---|---|
  | conectado / `open` | `CONNECTED` |
  | conectando / `connecting` | `CONNECTING` |
  | caiu, com sessão ainda válida | `DISCONNECTED` (pode voltar sozinha) |
  | sessão encerrada (401, `loggedOut`, "not connected") ou credencial recusada (401/403 na chamada) | `FAILED`, mostrado como "Reconectar" |
  | número proibido (`statusReason` 403, ou o motivo do integrador) | `FAILED`, com o motivo "bloqueado" e a API oficial como saída |

- **Credencial nunca vira log**: os corpos da uazapi e da Evolution trazem a credencial da instância. A rota do aviso
  nunca registra o corpo cru, só o tipo do evento, a conexão e o id da mensagem.
- **Alternativas recusadas**:
  - **Pedir ao dono que configure o aviso no painel do integrador**: é o passo que mais falha e o FR-006 manda o
    Sirius configurar.
  - **Chave global da Evolution**: dá acesso a todas as instâncias do servidor do cliente. Pedimos a da instância.
  - **W-API e WAHA**: fora do escopo (decisão do dono).

## R3. Autenticação do aviso: segredo no caminho

- **Decisão**: o endereço do aviso é `/api/webhooks/whatsapp-integrador/{segredo}`.
  - O segredo tem 32 bytes aleatórios (`crypto.randomBytes`) em base64url e é único por conexão.
  - O banco guarda só o SHA-256 do segredo, em `webhookSegredoHash @unique`.
  - A rota calcula o hash do segmento recebido e busca a conexão por ele. Não achou, a conexão não tem integrador ou
    está desligada: `404` e nada gravado.
  - A conta sai da conexão encontrada. Nenhum campo do corpo (`instanceId`, `instance`, `owner`, `token`) decide a
    conta.
- **Por quê**: nenhum dos três assina o aviso, e o segredo no caminho funciona igual nos três. A busca pelo hash de um
  valor de 256 bits não abre ataque de tempo, e um vazamento do banco não entrega o segredo.
- **Alternativas recusadas**:
  - **Cabeçalho fixo**: só a Evolution aceita.
  - **Conferir a credencial que vem no corpo**: a Z-API não manda credencial, e a comparação dependeria de decifrar a
    credencial a cada aviso.
  - **Id da conexão no caminho junto com o segredo**: não acrescenta nada, porque o hash já identifica a conexão.

## R4. Responder rápido e processar depois

- **Decisão**: a rota valida o segredo, lê e interpreta o corpo, responde `200` e agenda o processamento com `after()`
  de `next/server`. O `after` roda depois da resposta, dentro do mesmo processo Node do container.
- **Por quê**: o FR-011 pede para não segurar o integrador. O inbox já busca mensagens novas a cada 5 s
  (`use-chat-messages.ts`) e conversas a cada 5 s (`chat-interface.tsx`), então o processamento em segundo plano cabe
  nos 10 s do SC-003 sem SSE nem fila.
- **Limite declarado**: um reinício do container no meio do processamento perde aquele aviso, e os três integradores
  não reenviam depois de um `200`.
  - Na **mensagem**, a dedup por id deixa uma fila durável trocar o `after` sem mexer no resto.
  - No **estado da conexão**, a conferência periódica (R8) cobre a perda.
- **Alternativas recusadas**:
  - **Fila com Redis**: o Upstash é opcional hoje (`rate-limiter.ts` devolve `null` sem credencial), e a fila
    acrescentaria worker e infraestrutura para um volume que cabe no processo.
  - **Processar antes de responder**: é o que o FR-011 proíbe.

## R5. Dedup e o eco do próprio envio

- **Decisão**:
  - A mensagem é gravada com `create`. O erro P2002 em `@@unique([organizationId, messageId])` significa que ela já
    existe, e o processamento para ali. Isso substitui o `findFirst` + `create` da rota oficial, que deixa duas cópias
    passarem quando dois avisos chegam juntos.
  - O envio pelo Sirius grava a mensagem como `PENDING` antes de chamar o integrador e depois grava o id que o
    integrador devolveu. Se o eco do integrador chegou antes e já criou a mensagem com o mesmo id (P2002 no update), o
    envio apaga a própria linha pendente e devolve a do eco.
  - O `excludeMessages: [wasSentByApi]` da uazapi e o `fromApi` da Z-API reduzem o eco. A dedup por id vale para os
    três e é a garantia.
- **Estado só para frente (FR-016)**: `updateMany` com `status: { in: <estados anteriores ao novo> }`, na ordem
  `PENDING < SENT < DELIVERED < READ`. `FAILED` só entra sobre `PENDING` ou `SENT`. A rota oficial passa a usar a mesma
  função, porque hoje um `delivered` atrasado volta a mensagem de `READ` para `DELIVERED`.
- **Estado de entrega de mensagem ainda sem id**: se o estado chega antes de o envio gravar o id, o `updateMany` não
  encontra nada e o estado se perde. O próximo estado (lida) corrige. Não vale uma fila para isso.

## R6. Telefone, nono dígito e LID

- **Decisão**:
  - `lib/whatsapp/telefone.ts` extrai os dígitos, completa o 55 quando o número tem 10 ou 11 dígitos e calcula a chave
    `55 + DDD + últimos 8 dígitos`. A chave é igual com ou sem o nono dígito e com ou sem o +55.
  - A busca do contato usa SQL cru na conta: `regexp_replace(phone, '\D', '', 'g') LIKE '%' || <últimos 8>`. Entre os
    candidatos, fica o de mesma chave (DDD igual). Isso substitui o `contains` dos últimos 9 dígitos da rota oficial,
    que falha com telefone gravado com hífen (`98765-4321`) e casa contatos de DDD diferente.
  - **LID**: o JID completo vai para `WhatsAppMessage.remoteJid`, como já acontece com o JID de telefone.
    - Com o telefone junto (`phone`, `sender_pn`, `remoteJidAlt`), o contato é casado pelo telefone.
    - Com o LID sozinho, o contato é o da última mensagem da conta com o mesmo `remoteJid` (já existe índice em
      `remoteJid`).
    - Sem mensagem anterior, o Sirius cria um contato sem telefone, com o nome do perfil e `source: 'whatsapp_lid'`,
      que a ficha mostra como "completar cadastro".
- **Por quê**: não exige coluna nova em `Contact` nem migration no banco CRM. A normalização completa do telefone do
  contato é da spec de "registrar contato" (ação 6 da revisão de 25/09).
- **Alternativas recusadas**:
  - **Coluna `telefoneNormalizado` em `Contact`**: pede backfill e manutenção em todo lugar que grava contato, e isso é
    a próxima spec.
  - **Coluna `lid` em `Contact`**: o histórico de mensagens já guarda o LID.
- **Limite declarado**: a busca varre os contatos da conta com filtro por texto, sem índice. Hoje as contas têm até
  alguns milhares de contatos. Com contas de centenas de milhares, a coluna normalizada vira necessária.

## R7. Travas da seção 6.5, derivadas das mensagens

- **Decisão**: `lib/whatsapp/integradores/travas.ts` tem uma função pura que recebe a origem do envio, o número de
  destinatários, a última mensagem de entrada do contato naquela conexão e a contagem de envios no último minuto.
  Ela devolve `null` (pode enviar) ou o motivo da recusa.
  - **FR-020, só pessoa pelo inbox**: a origem é um tipo literal. Hoje só existe `'inbox'`, e qualquer outro valor é
    recusado com o motivo e o caminho para a API oficial. Mais de um destinatário é sempre recusado.
  - **FR-021, primeiro contato**: envio sem pessoa digitando exige uma mensagem de entrada daquele contato naquela
    conexão. A regra já está na função para quando um envio automático passar a existir.
  - **FR-022, "SAIR"**: se a última mensagem de entrada do contato naquela conexão, sem espaço nem pontuação e em
    minúsculas, é `sair`, `parar` ou `stop`, o envio é recusado. A trava some sozinha quando chega uma mensagem nova. A
    conversa mostra a trava pela mesma regra.
  - **FR-023, limite por minuto**: conta as mensagens de saída da conexão nos últimos 60 s (há índice em
    `connectionId`). Com 20 ou mais, o envio é recusado na hora com "aguarde". O valor é uma constante no módulo:
    20 por minuto passa uma pessoa digitando rápido com respostas prontas.
- **Por quê**: as quatro regras saem das mensagens que já existem, sem coluna nova, e valem entre vários processos,
  porque a contagem está no banco.
- **Caminhos de envio hoje**:
  - `forward`, `send-template`, `send-buttons`, `send-location`, agentes (`agaas-executor.ts`) e
    `/api/v1/whatsapp/send` só falam com a API oficial ou respondem 410;
  - as automações não enviam WhatsApp;
  - o único caminho para o integrador é o do inbox (`send-message` e `send-media`).

  Um teste estático confere que nenhum desses módulos importa o envio pelo integrador (SC-006, um teste por caminho),
  e os testes da função cobrem cada origem.
- **Alternativas recusadas**:
  - **Coluna de trava no contato**: precisa de migration no banco CRM e de código para destravar, e a última mensagem já
    diz tudo.
  - **Limite no Upstash**: sem credencial ele vira `null` e o limite some calado.
  - **Limite em memória**: erra com mais de um processo.

## R8. Estado, conferência periódica e aviso de queda

- **Decisão**:
  - `lib/whatsapp/integradores/estado.ts` tem uma função só para mudar estado, `mudarEstado(conexao, novo, motivo)`.
    Ela faz um `updateMany` condicionado ao estado anterior e grava `status`, `statusMotivo` e `statusMudouEm`.
  - Só quem muda a linha (`count === 1`) notifica. A notificação vai para o dono e os gerentes da conta, pelo
    `createNotifications`, com tipo `SYSTEM` e link para a tela de conexão. É uma notificação por queda, mesmo com o
    aviso do integrador e a conferência chegando juntos (FR-026, US3-5).
  - Na volta para `CONNECTED` depois de uma queda, o motivo registra quanto tempo a conexão ficou fora (US3-4).
  - O cron `GET /api/cron/whatsapp-integradores` roda a cada 5 minutos, com `CRON_SECRET` como os outros. Ele confere
    no integrador cada conexão com credencial e aplica as regras abaixo, de 10 em 10 conexões em paralelo e com tempo
    limite por chamada.

    | Conta e resposta | O que o cron faz |
    |---|---|
    | conta sem plano pago | vai para `SUSPENDED` |
    | conta com plano pago e conexão `SUSPENDED` | volta para o estado que o integrador disser |
    | estado do integrador diferente do gravado | chama `mudarEstado` |

- **Por quê**: o FR-025 manda mostrar a queda em até 15 minutos mesmo quando o integrador fica calado. A cada 5
  minutos, com uma falha de rede, a queda aparece em 10.
- **Aviso na tela**: a tela de conexão e o topo do inbox mostram a conexão com estado diferente de `CONNECTED`. O inbox
  já busca as conexões a cada 10 s, então o aviso não precisa de canal novo.
- **Agendamento**: os crons de `/api/cron/*` são chamados de fora do repositório, pelo agendador do EasyPanel ou por um
  serviço externo. O quickstart registra o novo junto dos outros.
- **Alternativas recusadas**:
  - **`setInterval` no `instrumentation.ts`**: foge do padrão dos outros crons e roda em cada processo.
  - **Coluna "já notificado"**: a mudança condicionada já garante uma notificação por queda.
  - **E-mail a cada queda**: a notificação no Sirius e o aviso no inbox cumprem os Termos. O e-mail entra se o dono
    pedir.

## R9. Planos e limite de conexões

- **Decisão**:
  - `PLAN_FEATURES[STARTER|PRO].can_use_chat_interface` passa a ser `true`.
  - `PLAN_LIMITS.maxWhatsAppInstances` passa a ser 0 no Free, 1 no Starter, 2 no Pro e 5 no Business.
  - O limite da conta é `maxWhatsAppInstances` do plano efetivo mais a soma dos add-ons `WHATSAPP_EXTRA_INSTANCE`
    ativos. Contam as conexões por integrador com credencial. As antigas do gateway e as desconectadas pelo dono não
    contam.
  - O plano efetivo é o de `getEffectiveTier()`, então o teste de 7 dias (recursos do Pro) conecta.
- **Por quê**:
  - `checkWhatsAppInstanceLimit` hoje soma `Organization.whatsappInstances`, que nasce 1 em todo plano e sobe 1 a cada
    add-on comprado (`billing-effects.ts`), com os add-ons de novo: o add-on conta em dobro;
  - a página do chat usa o `tier` cru, e quem está no teste ficaria de fora.
- **API oficial**: continua como está: Business ou `wabaGrandfathered`.

## R10. Mídia

- **Recebida (FR-017)**: o processamento em segundo plano baixa a mídia pelo adaptador e grava com `uploadMedia`
  (`lib/storage.ts`, com a chave `orgId/contactId/messageId`). Depois grava a chave no `mediaUrl` da mensagem. A
  rota `/api/whatsapp/media` já serve a chave com conferência de conta. O link do integrador nunca é gravado.
- **Enviada**: a rota recebe o arquivo como hoje (`FormData`) e confere tamanho e tipo antes de sair, com os limites
  do WhatsApp: imagem 5 MB, áudio e vídeo 16 MB, documento 100 MB. A rota envia para o integrador em base64, então o
  arquivo não precisa de endereço público. A cópia vai para o storage para a conversa mostrar a mídia depois.

## R11. Uma entrada só para a API oficial e o integrador

- **Decisão**: `lib/whatsapp/entrada.ts` concentra o que a mensagem recebida faz nos dois caminhos:
  - casa ou cria o contato (R6);
  - grava a mensagem com dedup (R5);
  - agenda a mídia (R10);
  - dispara o webhook de saída `whatsapp.message.in` (`dispatchWebhookAsync`).

  A rota oficial passa a chamar essa função e a responder antes de processar (`after`). Os agentes de IA continuam
  disparando só no caminho oficial.
- **Achado**:
  - o evento `whatsapp.message.in` existe em `lib/webhooks.ts` e aparece na tela de webhooks, mas nenhum código o
    dispara hoje, nem na API oficial. O FR-019 fica verdadeiro para os dois caminhos com a entrada única;
  - `notifyWhatsAppMessage` também não é chamado por ninguém. A mensagem nova aparece como não lida no inbox, e isso
    continua sendo o aviso de mensagem nova. Uma notificação por mensagem fica fora, para não inundar a conta;
  - a mensagem enviada pelo celular (`fromMe`) não dispara webhook de saída, agente nem notificação (FR-015).
- **Resposta pela mesma conexão (FR-018)**: o servidor decide o caminho. A conexão da conversa é a da última mensagem
  de entrada do contato: `connectionId` nulo é a API oficial, preenchido é o integrador. O cliente manda o
  `connectionId` que a conversa mostra, e a rota confere que ele é da conta e bate com a conversa.

## R12. Textos públicos (FR-030)

- **Medição**: a busca por "WhatsApp" perto de "Business", "apenas", "só no" e "exclusiv" dá 121 ocorrências em 21
  arquivos:
  - `messages/pt-BR/marketing.json`: 11;
  - `lib/faq-schema.ts`: 3;
  - `lib/help-articles.ts`: 2;
  - 17 posts do blog, com mais ocorrências em `whatsapp-api-oficial-meta-crm.ts` (20), `crm-com-whatsapp-integrado.ts`
    (18) e `representante-comercial-autonomo-ferramentas.ts` (18).

  Parte é falso positivo, como o "WhatsApp Business" que é o nome do aplicativo.
- **Decisão**: o `tasks.md` lista arquivo por arquivo, e o critério de pronto é o do SC-008.
  - A tela de planos da área logada (`dashboard/billing/plans`) lê `PLAN_LIMITS`, então a mudança do R9 corrige os
    números dela.
  - A página de preços pública tem texto próprio em `messages/pt-BR/marketing.json` e muda à mão.
