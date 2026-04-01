# Roadmap: Whatsmeow Gateway (Go)

> **Objetivo:** Substituir a dependência da Evolution API por um microserviço Go próprio usando a lib [whatsmeow](https://github.com/tulir/whatsmeow), com controle total sobre conexão, sync de histórico, envio/recebimento e reconexão automática.

## Por que pivotar?

| Problema com Evolution API | Solução com Whatsmeow |
|---|---|
| Paginação inconsistente (`page`/`offset` com bugs documentados) | Controle direto: `events.HistorySync` entrega todas as msgs automaticamente |
| `findMessages` e `findChats` retornam dados parciais | History sync nativo do WhatsApp: recebe TUDO no primeiro login |
| Sem endpoint de resync on-demand | `BuildHistorySyncRequest()` pede mensagens antigas sob demanda |
| REST wrapper (Node/Baileys) com overhead e instabilidade | Go compilado, ~20MB RAM, binário único, zero dependência runtime |
| Duplicatas por falta de controle no fluxo | Event-driven: cada mensagem tem ID único no evento, dedup trivial |
| Filtro de timestamp com formato ISO inconsistente | Timestamps Unix nativos nos eventos Go |

## Arquitetura

```
┌─────────────────────────────────────────────────┐
│              Sirius CRM (Next.js)               │
│  - Dashboard / Chat UI                          │
│  - PostgreSQL (Prisma)                          │
└──────────────┬──────────────────────────────────┘
               │ REST API (JSON)
               │ + WebSocket (real-time)
               ▼
┌─────────────────────────────────────────────────┐
│        Whatsmeow Gateway (Go microservice)      │
│                                                 │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐ │
│  │ HTTP API │  │ WS Server │  │ Webhook Push │ │
│  │ (Gin)    │  │ (Gorilla) │  │ (to CRM)     │ │
│  └────┬─────┘  └─────┬─────┘  └──────┬───────┘ │
│       │              │               │          │
│  ┌────▼──────────────▼───────────────▼────────┐ │
│  │         Session Manager (multi-instance)   │ │
│  │  - QR code generation                      │ │
│  │  - Auto-reconnect                          │ │
│  │  - Device store (SQLite/Postgres)          │ │
│  └────────────────────┬───────────────────────┘ │
│                       │                         │
│  ┌────────────────────▼───────────────────────┐ │
│  │         whatsmeow Client                   │ │
│  │  - events.Message (receive)                │ │
│  │  - events.HistorySync (bulk sync)          │ │
│  │  - events.Receipt (delivery/read)          │ │
│  │  - SendMessage (send)                      │ │
│  │  - BuildHistorySyncRequest (on-demand)     │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## Fases

---

### Fase 0 — Setup do Projeto Go (1-2 dias) ✅ DONE

- [x] Inicializar módulo Go (`go mod init`)
- [x] Estrutura de diretórios:
  ```
  whatsmeow-gateway/
  ├── cmd/server/main.go        # Entry point
  ├── internal/
  │   ├── api/                  # HTTP handlers (Gin)
  │   ├── whatsapp/             # whatsmeow wrapper (client.go)
  │   ├── webhook/              # Push events to CRM
  │   ├── store/                # DB (raw sql + sqlstore)
  │   └── config/               # Env config
  ├── Dockerfile
  ├── docker-compose.yml
  └── .env.example
  ```
- [x] Dependências core: `whatsmeow`, `gin`, `godotenv`
- [x] Docker Compose: Go service + PostgreSQL
- [x] Health check endpoint: `GET /health`

---

### Fase 1 — Conexão e QR Code (2-3 dias) ✅ DONE

**Endpoints:**

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/instances` | Criar nova instância (device store) |
| GET | `/api/instances/:id/qr` | Gerar QR code (SSE stream) |
| GET | `/api/instances/:id/status` | Status da conexão |
| GET | `/api/instances` | Listar instâncias por org |
| GET | `/api/instances/:id` | Detalhes de uma instância |
| DELETE | `/api/instances/:id` | Remover instância |
| PUT | `/api/instances/:id/restart` | Reconectar sem QR |

**Eventos whatsmeow tratados:**
- `events.QR` → broadcast QR via SSE (múltiplos subscribers)
- `events.Connected` → marcar connected, salvar JID/phone
- `events.Disconnected` → marcar disconnected, auto-reconnect
- `events.LoggedOut` → marcar logged_out, notificar CRM
- `events.TemporaryBan` → marcar banned

**Funcionalidades:**
- [x] Device store persistido em PostgreSQL (whatsmeow sqlstore)
- [x] Auto-reconnect com backoff exponencial (1s, 2s, 4s, max 60s)
- [x] Multi-instance: suporte a N conexões simultâneas
- [x] Webhook para CRM em cada mudança de status (HMAC signed)
- [x] QR broadcast pattern (múltiplos listeners, cache do último QR)
- [x] Auto-restart de QR quando timeout ocorre
- [x] RestoreInstances na startup (reconecta sessões persistidas)

---

### Fase 2 — History Sync (3-4 dias) ✅ DONE (core)

**O diferencial.** Whatsmeow recebe o history sync automaticamente após login.

**Fluxo:**
1. Após `events.Connected`, whatsmeow dispara `events.HistorySync` automaticamente
2. Cada evento contém um blob com conversas, mensagens, contatos
3. Gateway processa e envia para o CRM via webhook batch

**Endpoints:**

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/instances/:id/sync/request` | Pedir mais histórico on-demand (`BuildHistorySyncRequest`) |
| GET | `/api/instances/:id/sync/status` | Status do sync (total msgs, progress, last_sync) |

**Event handler `events.HistorySync`:**
```go
// Pseudo-código
func handleHistorySync(evt *events.HistorySync) {
    for _, conv := range evt.Data.GetConversations() {
        remoteJid := conv.GetId()
        pushName  := conv.GetName() || conv.GetDisplayName()
        
        for _, msg := range conv.GetMessages() {
            info := msg.GetMessage()
            // Extrair: messageId, text, timestamp, fromMe, mediaType
            // Enviar batch ao CRM via webhook
        }
    }
}
```

**On-demand sync (mensagens mais antigas):**
```go
// Pedir 50 mensagens antes de uma mensagem específica
req := client.BuildHistorySyncRequest(info, 50)
client.SendNode(*req)
// Resposta vem como events.HistorySync com tipo ON_DEMAND
```

**Funcionalidades:**
- [x] Processar `events.HistorySync` (tipos: INITIAL, RECENT, PUSH, ON_DEMAND)
- [x] Extrair conversas, mensagens, contatos, grupos do blob
- [x] Enviar em batches para o CRM (webhook POST com array de mensagens)
- [x] Dedup por messageId antes de enviar
- [ ] Endpoint para solicitar histórico mais antigo on-demand
- [ ] Tracking de progresso (% completo, msgs processadas)

---

### Fase 3 — Envio e Recebimento Real-time (2-3 dias) ✅ DONE (core)

**Endpoints:**

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/instances/:id/messages/text` | Enviar mensagem de texto |
| POST | `/api/instances/:id/messages/media` | Enviar mídia (imagem, vídeo, doc, áudio) |
| POST | `/api/instances/:id/messages/reaction` | Enviar reação (emoji) |
| POST | `/api/instances/:id/messages/read` | Marcar como lida |

**Eventos real-time (push via webhook + WebSocket):**

| Evento whatsmeow | Ação |
|---|---|
| `events.Message` | Webhook POST `/api/webhooks/whatsmeow` no CRM |
| `events.Receipt` (delivered/read) | Atualizar status da mensagem no CRM |
| `events.ChatPresence` | Push typing indicator via WebSocket |
| `events.PushName` | Atualizar nome do contato no CRM |

**Funcionalidades:**
- [x] Enviar texto para JID individual e grupo
- [x] Upload e envio de mídia (imagem, vídeo, documento, áudio, sticker) — gateway + CRM
- [x] Receber mensagens e encaminhar ao CRM via webhook
- [x] Receber e encaminhar receipts (sent, delivered, read)
- [x] Enviar reações (emoji) — gateway + CRM client
- [x] Marcar mensagens como lidas — gateway + CRM client
- [ ] WebSocket para typing indicators em tempo real

---

### Fase 4 — Contatos e Grupos (1-2 dias) ✅ DONE

**Endpoints:**

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/instances/:id/contacts` | Listar contatos (do device store) |
| GET | `/api/instances/:id/groups` | Listar grupos com metadata |
| GET | `/api/instances/:id/groups/:jid` | Info detalhada de um grupo |
| GET | `/api/instances/:id/profile-pic/:jid` | Foto de perfil |

**Eventos:**
- `events.PushName` → webhook `contact.update` ao CRM ✅
- `events.ChatPresence` → webhook `chat.presence` ao CRM ✅

**Funcionalidades:**
- [x] Listar todos os contatos salvos (do device store)
- [x] Listar grupos com name, topic, participants count
- [x] Info detalhada de grupo (participants com roles, owner, created)
- [x] Buscar foto de perfil por JID
- [x] whatsmeow-client.ts: getContacts, getGroups, getGroupInfo, getProfilePic

---

### Fase 5 — Integração com Sirius CRM (3-4 dias) ✅ DONE (core)

Adaptar o CRM para consumir do gateway Go em vez da Evolution API.

**No CRM (Next.js):**

- [x] Novo client: `lib/integrations/whatsmeow-client.ts`
- [x] Webhook receiver: `app/api/webhooks/whatsmeow/route.ts`
  - Recebe mensagens, receipts, status changes, contact updates, history sync
  - Cria/atualiza contatos no DB (com dedup por phone normalizado)
  - Insere mensagens com dedup por messageId
  - HMAC signature validation
  - Pusher real-time + AgaaS trigger
- [x] Adaptar tela de conexões:
  - QR code via SSE proxy (`/api/whatsapp/connections/whatsmeow/[id]/qr`)
  - UI: WhatsmeowConnectCard com form + QR + status badge
- [x] API: `POST /api/whatsapp/connections/whatsmeow` (criar instância)
- [x] Adaptar `chat-interface.tsx` — transparente (send-message/send-media auto-detect provider)
- [x] Adaptar `send-message` route para suportar provider whatsmeow (auto-detect por `apiKey`)
- [x] Adaptar `send-media` route para suportar provider whatsmeow
- [x] Adaptar `v1/whatsapp/send` (Sofia IA) para suportar provider whatsmeow
- [x] whatsmeow-client.ts: sendMedia, markRead, sendReaction
- [ ] Feature flag: `WHATSAPP_PROVIDER=whatsmeow|evolution` (coexistência temporária)
- [ ] Migrar dados existentes da Evolution API para o novo formato (se necessário)

---

### Fase 6 — Deploy e Observabilidade (1-2 dias) ✅ DONE

- [x] Deploy do gateway Go no EasyPanel (Docker)
- [x] Variáveis de ambiente configuradas:
  ```env
  PORT=8080
  DATABASE_URL=postgres://...
  CRM_WEBHOOK_URL=https://sirius.roilabs.com.br/api/webhooks/whatsmeow
  CRM_WEBHOOK_SECRET=QKDi3kDOH_dY4ZQzK2EibJrFnvEfH-RYSrXkLpMU_DA
  API_KEY=eqbX4gHFtqZcw8psIS_pg8a7C3ic7EL5_l5zoCtzuoc
  LOG_LEVEL=info
  ```
- [x] Logs estruturados (slog JSON)
- [ ] Métricas: msgs/s, conexões ativas, erros, latência
- [x] Healthcheck para EasyPanel/Docker (`GET /health`)
- [ ] Rate limiting no gateway
- [x] HMAC signature nos webhooks
- [x] Domínio: `whatsmeow.roilabs.com.br`

---

### Fase 7 — Hardening e Produção (2-3 dias) ✅ DONE (core)

- [x] Retry com dead-letter queue para webhooks que falham (3 retries, backoff exponencial, persist em `webhook_dead_letters` table)
- [x] Graceful shutdown (SIGINT/SIGTERM → drain HTTP 15s → disconnect all WA clients → drain webhook queue)
- [x] Limite de instâncias por organização (`MAX_INSTANCES_PER_ORG` env, default 5, valida no CreateInstance)
- [ ] Criptografia de credenciais em repouso
- [ ] Testes de integração (Go test)
- [x] Monitoramento de bans temporários (`events.TemporaryBan` → webhook `connection.update` com status `banned`)
- [x] Alertas quando conexão cai e não reconecta (webhook `connection.alert` após 30 tentativas falhas)

---

## Timeline Estimada

| Fase | Escopo | Duração |
|------|--------|---------|
| 0 | Setup Go + Docker | 1-2 dias |
| 1 | Conexão + QR + reconnect | 2-3 dias |
| 2 | History Sync (diferencial) | 3-4 dias |
| 3 | Envio/Recebimento real-time | 2-3 dias |
| 4 | Contatos + Grupos | 1-2 dias |
| 5 | Integração CRM | 3-4 dias |
| 6 | Deploy + Observabilidade | 1-2 dias |
| 7 | Hardening + Produção | 2-3 dias |
| **Total** | | **15-23 dias** |

## Referências

- [whatsmeow](https://github.com/tulir/whatsmeow) — Lib Go (5.7k stars, MPL-2.0)
- [whatsmeow godoc](https://pkg.go.dev/go.mau.fi/whatsmeow) — Documentação completa
- [whatsmeow events](https://pkg.go.dev/go.mau.fi/whatsmeow/types/events) — 80+ eventos
- [wuzapi](https://github.com/asternic/wuzapi) — REST wrapper de referência
- [go-whatsapp-multi-session](https://github.com/gdbrns/go-whatsapp-multi-session-rest-api) — Multi-session de referência
- [Evolution Go](https://github.com/EvolutionAPI/evolution-go) — Evolution reescrita em Go (referência)
- [BuildHistorySyncRequest](https://pkg.go.dev/go.mau.fi/whatsmeow#Client.BuildHistorySyncRequest) — Sync on-demand
