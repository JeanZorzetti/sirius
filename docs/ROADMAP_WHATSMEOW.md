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
               │ + Pusher (real-time)
               ▼
┌─────────────────────────────────────────────────┐
│        Whatsmeow Gateway (Go microservice)      │
│                                                 │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐ │
│  │ HTTP API │  │ SSE/QR    │  │ Webhook Push │ │
│  │ (Gin)    │  │ Stream    │  │ (to CRM)     │ │
│  └────┬─────┘  └─────┬─────┘  └──────┬───────┘ │
│       │              │               │          │
│  ┌────▼──────────────▼───────────────▼────────┐ │
│  │         Session Manager (multi-instance)   │ │
│  │  - QR code generation (broadcast pattern)  │ │
│  │  - Auto-reconnect (exp. backoff)           │ │
│  │  - Device store (PostgreSQL)               │ │
│  └────────────────────┬───────────────────────┘ │
│                       │                         │
│  ┌────────────────────▼───────────────────────┐ │
│  │         whatsmeow Client                   │ │
│  │  - events.Message (receive)                │ │
│  │  - events.HistorySync (bulk sync)          │ │
│  │  - events.Receipt (delivery/read)          │ │
│  │  - events.ChatPresence (typing)            │ │
│  │  - SendMessage (send)                      │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## Fases

---

### Fase 0 — Setup do Projeto Go ✅ DONE

- [x] Inicializar módulo Go (`go mod init`)
- [x] Estrutura de diretórios (`cmd/server`, `internal/{api,whatsapp,webhook,store,config}`)
- [x] Dependências core: `whatsmeow`, `gin`, `godotenv`
- [x] Docker Compose: Go service + PostgreSQL
- [x] Health check endpoint: `GET /health`

---

### Fase 1 — Conexão e QR Code ✅ DONE

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

**Funcionalidades:**
- [x] Device store persistido em PostgreSQL (whatsmeow sqlstore)
- [x] Auto-reconnect com backoff exponencial (1s, 2s, 4s, max 60s)
- [x] Multi-instance: suporte a N conexões simultâneas
- [x] Webhook para CRM em cada mudança de status (HMAC signed)
- [x] QR broadcast pattern (múltiplos listeners, cache do último QR)
- [x] Auto-restart de QR quando timeout ocorre
- [x] RestoreInstances na startup (reconecta sessões persistidas)

---

### Fase 2 — History Sync ✅ DONE

**Funcionalidades:**
- [x] Processar `events.HistorySync` (tipos: INITIAL, RECENT, PUSH, ON_DEMAND)
- [x] Extrair conversas, mensagens, contatos, grupos do blob
- [x] Enviar em batches para o CRM (webhook POST com array de mensagens)
- [x] Dedup por messageId antes de enviar
- [x] Endpoint para solicitar histórico on-demand (`POST /api/instances/:id/sync/request`)
- [x] Tracking de progresso (`GET /api/instances/:id/sync/status` — totalMessages, totalConversations, lastSyncAt, inProgress)

---

### Fase 3 — Envio e Recebimento Real-time ✅ DONE

**Endpoints:**

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/instances/:id/messages/text` | Enviar mensagem de texto |
| POST | `/api/instances/:id/messages/media` | Enviar mídia (imagem, vídeo, doc, áudio) |
| POST | `/api/instances/:id/messages/reaction` | Enviar reação (emoji) |
| POST | `/api/instances/:id/messages/read` | Marcar como lida |

**Funcionalidades:**
- [x] Enviar texto para JID individual e grupo
- [x] Upload e envio de mídia (imagem, vídeo, documento, áudio, sticker)
- [x] Receber mensagens e encaminhar ao CRM via webhook
- [x] Receber e encaminhar receipts (sent, delivered, read)
- [x] Enviar reações (emoji)
- [x] Marcar mensagens como lidas
- [x] Typing indicators via Pusher (`chat.presence` → webhook → `chat:typing` Pusher event)

---

### Fase 4 — Contatos e Grupos ✅ DONE

**Endpoints:**

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/instances/:id/contacts` | Listar contatos (do device store) |
| GET | `/api/instances/:id/groups` | Listar grupos com metadata |
| GET | `/api/instances/:id/groups/:jid` | Info detalhada de um grupo |
| GET | `/api/instances/:id/profile-pic/:jid` | Foto de perfil |

**Funcionalidades:**
- [x] Listar todos os contatos salvos (do device store)
- [x] Listar grupos com name, topic, participants count
- [x] Info detalhada de grupo (participants com roles, owner, created)
- [x] Buscar foto de perfil por JID
- [x] whatsmeow-client.ts: getContacts, getGroups, getGroupInfo, getProfilePic

---

### Fase 5 — Integração com Sirius CRM ✅ DONE

- [x] Client TypeScript: `lib/integrations/whatsmeow-client.ts`
- [x] Webhook receiver: `app/api/webhooks/whatsmeow/route.ts`
  - message, reaction, receipt, connection.update, connection.alert, contact.update, chat.presence, history.sync
  - Dedup por messageId, HMAC signature, Pusher real-time, AgaaS trigger
- [x] QR code via SSE proxy (`/api/whatsapp/connections/whatsmeow/[id]/qr`)
- [x] WhatsmeowConnectCard UI (form + QR + status)
- [x] Auto-detect provider: `lib/whatsapp-provider.ts` (`isWhatsmeow()`)
- [x] Feature flag: `WHATSAPP_PROVIDER` env var override (whatsmeow|evolution)
- [x] Dual-provider support em send-message, send-media, v1/whatsapp/send

---

### Fase 6 — Deploy e Observabilidade ✅ DONE

- [x] Deploy do gateway Go no EasyPanel (Docker)
- [x] Variáveis de ambiente configuradas
- [x] Logs estruturados (slog JSON)
- [x] Métricas endpoint: `GET /metrics` (uptime, instances, goroutines, memory, GC)
- [x] Healthcheck para EasyPanel/Docker (`GET /health`)
- [x] Rate limiting: token bucket 100 req/s por IP
- [x] HMAC signature nos webhooks
- [x] Domínio: `whatsmeow.roilabs.com.br`

---

### Fase 7 — Hardening e Produção ✅ DONE

- [x] Retry com dead-letter queue para webhooks (3 retries, backoff exponencial, persist em `webhook_dead_letters` table)
- [x] Graceful shutdown (SIGINT/SIGTERM → drain HTTP 15s → disconnect all WA clients → drain webhook queue)
- [x] Limite de instâncias por organização (`MAX_INSTANCES_PER_ORG` env, default 5)
- [x] Monitoramento de bans temporários (`events.TemporaryBan` → webhook `connection.update` com status `banned`)
- [x] Alertas quando conexão cai e não reconecta (webhook `connection.alert` após 30 tentativas falhas)
- [x] Testes de integração Go (14 testes: auth middleware, rate limiter, webhook delivery, HMAC, retry/dead-letter)

---

### Fase 8 — Refinamentos do Chat (UX & Mídia)

> Elevar o chat de "funcional" para "WhatsApp-like" com visualização rica de mídia, fotos de perfil, e UX premium.

#### 8.1 — Visualização de Mídia no Chat

- [x] **Lightbox para imagens**: Modal com zoom, pan e close (substituir `window.open()` atual)
  - Componente: `components/chat/media-lightbox.tsx`
  - Zoom (+/-/double-click), rotação (R), download, Esc para fechar
  - Keyboard shortcuts completos
  - Botão de download na lightbox
- [x] **Thumbnails de imagem no bubble**: Renderizar preview inline (max 280px) com blur placeholder
  - Lazy load com skeleton enquanto carrega base64
  - Click abre lightbox
- [x] **Player de vídeo melhorado**: Thumbnail com ícone play → abre lightbox com player fullscreen
  - Thumbnail com overlay de play button
  - Player fullscreen no lightbox com autoPlay e controls
- [ ] **Player de áudio customizado**: Waveform visual (estilo WhatsApp)
  - Barra de progresso com duração total
  - Ícone de play/pause estilizado
  - Indicador de mensagem de voz vs áudio genérico
- [ ] **Preview de documentos**: Ícone por tipo (PDF, DOCX, XLS, ZIP)
  - Nome do arquivo + tamanho formatado (KB/MB)
  - PDF inline viewer (iframe ou react-pdf) para arquivos pequenos
  - Botão de download sempre visível
- [x] **Stickers/Figurinhas**: Renderizar como imagem sem bubble background (fundo transparente)
- [ ] **Galeria de mídia por conversa**: Tab "Mídia" no contact-sidebar
  - Grid de thumbnails (imagens, vídeos)
  - Lista de documentos e áudios
  - Click abre lightbox com contexto da conversa

#### 8.2 — Fotos de Perfil (Avatares)

- [ ] **Fetch automático de fotos via whatsmeow**: Chamar `GET /api/instances/:id/profile-pic/:jid` em batch
  - Endpoint CRM: `POST /api/whatsapp/profile-pics/batch` (aceita array de contactIds)
  - Cache em `Contact.profilePicUrl` com TTL de 7 dias (re-fetch se stale)
- [ ] **Avatar na conversation list**: Já implementado — garantir que busca proativa para contatos visíveis
- [ ] **Avatar no message header**: Foto grande no topo da conversa ativa (já existe, confirmar que funciona com whatsmeow)
- [ ] **Avatar no contact sidebar**: Foto grande (80x80) clicável para ver em tamanho completo
- [ ] **Fallback melhorado**: Gradiente baseado no hash do nome (em vez de 8 cores fixas)

#### 8.3 — Envio de Mídia (Upload UX)

- [x] **Drag & Drop**: Arrastar arquivo para a área de chat abre preview
  - Overlay visual "Solte o arquivo aqui" com ícone Paperclip
  - Suportar múltiplos arquivos (enviar em sequência)
- [x] **Paste de imagem**: Ctrl+V / Cmd+V cola imagem do clipboard
  - Detectar `clipboardData.items` com tipo `image/*`
  - Gerar preview instantâneo e abrir barra de confirmação
- [ ] **Preview antes de enviar**: Modal com preview expandido + campo de legenda
  - Imagem: preview com crop/resize opcional
  - Vídeo: player com preview
  - Documento: ícone + nome + tamanho
  - Áudio: waveform preview
- [ ] **Progress bar de upload**: Barra de progresso real (não apenas spinner)
  - Usar `XMLHttpRequest` com `onprogress` ou stream upload
  - Mostrar % e tamanho enviado
- [ ] **Compressão de imagem client-side**: Reduzir imagens >1MB antes de enviar
  - Canvas resize para max 1920px no maior lado
  - Qualidade JPEG 85%
  - Manter original para documentos

#### 8.4 — UX do Chat

- [x] **Indicador de digitação**: Mostrar "digitando..." baseado no Pusher `chat:typing` event
  - Conectado via `usePusher` hook em `message-area.tsx`, auto-clear 5s failsafe
- [ ] **Link preview**: Detectar URLs no texto e mostrar card com título + imagem + domínio
  - Endpoint: `GET /api/og-preview?url=...` (fetch Open Graph tags server-side)
  - Cache de OG data por URL
- [ ] **Mensagens de localização**: Renderizar mini-mapa estático (Google Static Maps ou Mapbox)
  - Extrair lat/lng do `locationMessage` no gateway
  - Click abre Google Maps
- [ ] **Contatos compartilhados**: Renderizar card com nome + telefone do vCard
  - Botão "Adicionar ao CRM" para criar contato automaticamente
- [x] **Scroll to bottom FAB**: Botão flutuante quando scroll está acima das últimas mensagens
  - Badge com count de novas mensagens não vistas, Virtuoso `atBottomStateChange`
- [x] **Read receipts visuais**: Ticks azuis animados (✓ → ✓✓ → ✓✓ azul)
  - Real-time via Pusher `message:status` event, atualiza status inline sem re-fetch

#### 8.5 — Performance & Polish

- [ ] **Lazy loading de mídia**: Só buscar base64 quando bubble entra no viewport
  - Usar IntersectionObserver no MediaBubble
  - Placeholder skeleton enquanto carrega
- [ ] **Cache de mídia no client**: IndexedDB para armazenar base64 de mídia já carregada
  - Evita re-fetch ao rolar para cima e voltar
  - Limite de 100MB com LRU eviction
- [ ] **Skeleton loading na conversa**: Ao trocar de contato, mostrar skeleton do chat (não flash branco)
- [ ] **Otimização de re-renders**: Memo nos message bubbles, evitar re-render da lista inteira
  - Aproveitar react-virtuoso itemContent com keys estáveis
- [ ] **PWA Push notifications**: Notificar no desktop quando mensagem chega
  - Pusher → Service Worker → Notification API

---

## Status

**Fases 0-7 completas.** Gateway whatsmeow production-ready.

**Fase 8 (Refinamentos)**: Novo — foco em UX do chat e visualização de mídia.

### Item deferido:
- Criptografia de credenciais em repouso (baixa prioridade)

---

## Timeline

| Fase | Escopo | Status |
|------|--------|--------|
| 0 | Setup Go + Docker | ✅ |
| 1 | Conexão + QR + reconnect | ✅ |
| 2 | History Sync | ✅ |
| 3 | Envio/Recebimento real-time | ✅ |
| 4 | Contatos + Grupos | ✅ |
| 5 | Integração CRM | ✅ |
| 6 | Deploy + Observabilidade | ✅ |
| 7 | Hardening + Produção | ✅ |
| 8 | Refinamentos Chat & Mídia | 🔧 |

## Referências

- [whatsmeow](https://github.com/tulir/whatsmeow) — Lib Go (5.7k stars, MPL-2.0)
- [whatsmeow godoc](https://pkg.go.dev/go.mau.fi/whatsmeow) — Documentação completa
- [whatsmeow events](https://pkg.go.dev/go.mau.fi/whatsmeow/types/events) — 80+ eventos
