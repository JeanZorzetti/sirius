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

### Fase 0 — Setup do Projeto Go (1-2 dias)

- [ ] Inicializar módulo Go (`go mod init`)
- [ ] Estrutura de diretórios:
  ```
  whatsmeow-gateway/
  ├── cmd/server/main.go        # Entry point
  ├── internal/
  │   ├── api/                  # HTTP handlers (Gin)
  │   ├── ws/                   # WebSocket hub
  │   ├── whatsapp/             # whatsmeow wrapper
  │   │   ├── client.go         # Client lifecycle
  │   │   ├── events.go         # Event handlers
  │   │   ├── history.go        # History sync logic
  │   │   └── media.go          # Media download/upload
  │   ├── webhook/              # Push events to CRM
  │   ├── store/                # DB models (GORM ou sqlc)
  │   └── config/               # Env config
  ├── Dockerfile
  ├── docker-compose.yml
  └── .env.example
  ```
- [ ] Dependências core: `whatsmeow`, `gin`, `gorm`, `godotenv`
- [ ] Docker Compose: Go service + PostgreSQL (ou SQLite para dev)
- [ ] Health check endpoint: `GET /health`

---

### Fase 1 — Conexão e QR Code (2-3 dias)

**Endpoints:**

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/instances` | Criar nova instância (device store) |
| GET | `/api/instances/:id/qr` | Gerar QR code (SSE stream ou base64) |
| GET | `/api/instances/:id/status` | Status da conexão (`connected`, `disconnected`, `qr_pending`) |
| DELETE | `/api/instances/:id` | Remover instância (logout + delete store) |
| PUT | `/api/instances/:id/restart` | Reconectar sem QR (sessão persistida) |

**Eventos whatsmeow tratados:**
- `events.QR` → gerar QR e enviar via SSE/WebSocket
- `events.PairSuccess` → salvar device, marcar connected
- `events.Connected` → marcar connected, disparar history sync
- `events.Disconnected` → marcar disconnected, auto-reconnect
- `events.LoggedOut` → limpar device store, notificar CRM

**Funcionalidades:**
- [ ] Device store persistido em PostgreSQL (tabela `whatsmeow_devices`)
- [ ] Auto-reconnect com backoff exponencial (1s, 2s, 4s, 8s, max 60s)
- [ ] Multi-instance: suporte a N conexões simultâneas
- [ ] Webhook para CRM em cada mudança de status

---

### Fase 2 — History Sync (3-4 dias)

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
- [ ] Processar `events.HistorySync` (tipos: INITIAL, RECENT, PUSH, ON_DEMAND)
- [ ] Extrair conversas, mensagens, contatos, grupos do blob
- [ ] Enviar em batches para o CRM (webhook POST com array de mensagens)
- [ ] Dedup por messageId antes de enviar
- [ ] Endpoint para solicitar histórico mais antigo on-demand
- [ ] Tracking de progresso (% completo, msgs processadas)

---

### Fase 3 — Envio e Recebimento Real-time (2-3 dias)

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
- [ ] Enviar texto para JID individual e grupo
- [ ] Upload e envio de mídia (imagem, vídeo, documento, áudio, sticker)
- [ ] Receber mensagens e encaminhar ao CRM via webhook
- [ ] Receber e encaminhar receipts (sent, delivered, read)
- [ ] WebSocket para typing indicators em tempo real
- [ ] Marcar mensagens como lidas

---

### Fase 4 — Contatos e Grupos (1-2 dias)

**Endpoints:**

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/instances/:id/contacts` | Listar contatos (do device store) |
| GET | `/api/instances/:id/groups` | Listar grupos com metadata |
| GET | `/api/instances/:id/groups/:jid` | Info detalhada de um grupo |
| GET | `/api/instances/:id/profile-pic/:jid` | Foto de perfil |

**Eventos:**
- `events.Contact` → sync de contatos (app state)
- `events.PushName` / `events.BusinessName` → atualizar nomes
- `events.GroupInfo` → mudanças em grupos
- `events.JoinedGroup` → entrou em novo grupo
- `events.Picture` → foto de perfil atualizada

**Funcionalidades:**
- [ ] Listar todos os contatos salvos
- [ ] Listar grupos com subject, description, participants count
- [ ] Buscar foto de perfil por JID
- [ ] Push de eventos de grupo ao CRM

---

### Fase 5 — Integração com Sirius CRM (3-4 dias)

Adaptar o CRM para consumir do gateway Go em vez da Evolution API.

**No CRM (Next.js):**

- [ ] Novo client: `lib/whatsmeow-client.ts` (substitui `evolution-api-client.ts`)
- [ ] Webhook receiver: `app/api/webhooks/whatsmeow/route.ts`
  - Recebe mensagens, receipts, status changes
  - Cria/atualiza contatos no DB (com dedup por phone normalizado)
  - Insere mensagens com dedup por `@@unique([organizationId, messageId])`
- [ ] Adaptar `chat-interface.tsx`:
  - Conexão WebSocket para typing indicators
  - Envio de mensagens via novo gateway
- [ ] Adaptar tela de conexões:
  - QR code via SSE do gateway Go
  - Status da conexão via polling do gateway
- [ ] Feature flag: `WHATSAPP_PROVIDER=whatsmeow|evolution` (coexistência temporária)
- [ ] Migrar dados existentes da Evolution API para o novo formato (se necessário)

---

### Fase 6 — Deploy e Observabilidade (1-2 dias)

- [ ] Deploy do gateway Go no EasyPanel (Docker)
- [ ] Variáveis de ambiente:
  ```env
  PORT=8090
  DATABASE_URL=postgres://...
  CRM_WEBHOOK_URL=https://sirius.roilabs.com.br/api/webhooks/whatsmeow
  CRM_WEBHOOK_SECRET=hmac-secret
  API_KEY=gateway-auth-key
  LOG_LEVEL=info
  ```
- [ ] Logs estruturados (zerolog ou slog)
- [ ] Métricas: msgs/s, conexões ativas, erros, latência
- [ ] Healthcheck para EasyPanel/Docker
- [ ] Rate limiting no gateway
- [ ] HMAC signature nos webhooks

---

### Fase 7 — Hardening e Produção (2-3 dias)

- [ ] Retry com dead-letter queue para webhooks que falham
- [ ] Graceful shutdown (aguardar mensagens em flight)
- [ ] Limite de instâncias por organização (respeitar plano)
- [ ] Criptografia de credenciais em repouso
- [ ] Testes de integração (Go test)
- [ ] Monitoramento de bans temporários (`events.TemporaryBan`)
- [ ] Alertas quando conexão cai e não reconecta

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
