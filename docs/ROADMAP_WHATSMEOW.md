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

- [x] **Proxy de fotos via whatsmeow**: `GET /api/whatsapp/profile-pic?contactId=x&proxy=1`
  - Busca URL fresca no gateway a cada request (URLs do CDN do WhatsApp expiram)
  - Faz download e proxy da imagem — browser nunca acessa `pps.whatsapp.net` diretamente
  - Cache-Control: 24h no browser
- [x] **Avatar na conversation list**: Busca proativa para contatos visíveis (stagger 200ms)
- [x] **Avatar no message header**: Funciona via proxy, nunca usa URL stale do DB
- [ ] **Avatar no contact sidebar**: Foto grande (80x80) clicável para ver em tamanho completo
- [ ] **Fallback melhorado**: Gradiente baseado no hash do nome (em vez de 8 cores fixas)

#### 8.3 — Envio de Mídia (Upload UX)

- [x] **Drag & Drop**: Arrastar arquivo para a área de chat abre preview
  - Overlay visual "Solte o arquivo aqui" com ícone Paperclip
  - Suportar múltiplos arquivos (enviar em sequência)
- [x] **Paste de imagem**: Ctrl+V / Cmd+V cola imagem do clipboard
  - Detectar `clipboardData.items` com tipo `image/*`
  - Gerar preview instantâneo e abrir barra de confirmação
- [x] **Preview antes de enviar**: Barra de preview com thumbnail + nome + tamanho + botão cancelar
  - Imagem: preview 48x48 com thumbnail
  - Documento: ícone FileText + nome + tamanho em KB
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

- [x] **Lazy loading de mídia**: Só buscar base64 quando bubble entra no viewport
  - IntersectionObserver com 200px rootMargin no MediaBubble, hasTriggered ref para single-fire
  - Placeholder skeleton enquanto carrega
- [ ] **Cache de mídia no client**: IndexedDB para armazenar base64 de mídia já carregada
  - Evita re-fetch ao rolar para cima e voltar
  - Limite de 100MB com LRU eviction
- [x] **Skeleton loading na conversa**: Ao trocar de contato, mostrar skeleton do chat (não flash branco)
  - Já implementado: 5 skeleton bubbles alternados durante loading
- [x] **Otimização de re-renders**: Memo nos message bubbles, evitar re-render da lista inteira
  - react-virtuoso com `data` array + `useMemo` para messageItems pré-computados
- [ ] **PWA Push notifications**: Notificar no desktop quando mensagem chega
  - Pusher → Service Worker → Notification API

---

### Fase 9 — Bugfixes de Produção ✅ DONE

Correções de bugs encontrados em produção após deploy completo.

- [x] **Proxy de fotos de perfil**: URLs `pps.whatsapp.net` expiram — `/api/whatsapp/profile-pic` agora faz proxy da imagem e nunca retorna URLs diretas do CDN do WhatsApp
- [x] **Sync route 500**: `/connections/[id]/sync` chamava Evolution API para instâncias whatsmeow → 404. Corrigido para no-op (history sync é automático via webhook)
- [x] **Media route 500**: `/whatsapp/media` chamava Evolution API para instâncias whatsmeow. Corrigido para dual-provider (whatsmeow usa `downloadMedia` do gateway)
- [x] **Media inline no webhook**: Gateway Go agora baixa midia (`whatsmeow.Client.Download`) e inclui `mediaBase64` no payload do webhook — CRM salva direto no `mediaUrl`
- [x] **Filtro de LIDs**: JIDs com >15 dígitos (WhatsApp internal IDs) filtrados em `handleMessage` e `handleHistorySync`
- [x] **Phantom contacts**: 1.412 contatos LID removidos da produção via SQL cleanup
- [x] **N+1 queries**: Substituído `Promise.all(contacts.map(count))` por `groupBy` em 3 rotas (unread counts)
- [x] **Connection pool exhaustion**: `connection_limit=3` no `DATABASE_URL` para Vercel serverless
- [x] **Sync automático no connectionReady**: Para whatsmeow é best-effort (não falha com 500 se gateway não disponível)

---

## Status

**Fases 0-9 completas.** Gateway whatsmeow e integração CRM production-ready.

### Fase 8 — Itens pendentes (baixa prioridade):
- Player de áudio customizado (waveform visual)
- Galeria de mídia por conversa (tab "Mídia" no sidebar)
- Progress bar de upload real
- Compressão de imagem client-side
- IndexedDB cache de mídia
- PWA Push notifications
- Link preview para URLs em mensagens
- Mensagens de localização (mini-mapa)
- Contatos compartilhados (vCard)
- Gradiente de avatar baseado em hash do nome

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
| 8 | Refinamentos Chat & Mídia | 🔧 em andamento |
| 9 | Bugfixes de Produção | ✅ |

## Referências

- [whatsmeow](https://github.com/tulir/whatsmeow) — Lib Go (5.7k stars, MPL-2.0)
- [whatsmeow godoc](https://pkg.go.dev/go.mau.fi/whatsmeow) — Documentação completa
- [whatsmeow events](https://pkg.go.dev/go.mau.fi/whatsmeow/types/events) — 80+ eventos
