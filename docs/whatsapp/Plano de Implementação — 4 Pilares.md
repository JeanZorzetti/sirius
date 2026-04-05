# Plano de Implementacao — 4 Pilares da Arquitetura WhatsApp

> Baseado no estudo "Arquitetura e Sincronizacao de Banco de Dados para Integracao de Mensageria em Plataformas CRM"
> Data: 2026-04-05
> **Status: CONCLUIDO (2026-04-05)**

---

## Status de Implementacao

| Pilar | Status | Commits Gateway | Commits CRM |
|-------|--------|-----------------|-------------|
| 1 - Connection Pooling | PRODUCAO | `fce2a84` | N/A |
| 2 - Redis Buffer | PRODUCAO | `c781b74`, `63519dc` | `987ff97` |
| 3 - Snowflake ID | PRODUCAO | `fce2a84` | `bccf460` |
| 4 - LID Resolution | PRODUCAO | `fce2a84` | N/A |

### Infraestrutura Provisionada
- **Redis 7 Alpine** — `dados/redis-sirius` (EasyPanel, porta externa 6380)
- **WA DB separado** — `dados/wpp_sirius` (PostgreSQL, porta externa 5433)

### Observacoes de Producao
- **LID Resolution**: 3375 mapeamentos LID→PN no session DB. LIDs nao mapeados sao salvos como fallback e resolvidos gradualmente conforme o WhatsApp envia novos mapeamentos.
- **Redis Buffer**: `OfflineSyncCompleted` chega antes dos history blobs — corrigido com delayed flush (15s + polling de estado por ate 3 min).
- **Snowflake IDs**: Mensagens novas tem `snowflakeId` preenchido. Mensagens antigas (migradas) tem `snowflakeId = null` — ordenacao usa `sentAt` como fallback.
- **Fallback graceful**: Se Redis estiver indisponivel, gateway volta ao comportamento antigo (webhook direto).

---

## Contexto

O gateway `sirius_whats` (Go/whatsmeow) apresenta 3 anomalias criticas:

1. **Pulo de mensagens**: eventHandler do whatsmeow faz webhook sincrono — bloqueia WebSocket, causa timeout, perde pacotes
2. **Ordem errada**: CRM usa `sentAt` (timestamp de insercao) em vez de `messageTimestamp` do protobuf. iOS envia ordem crescente, Android decrescente — SERIAL autoincremental gera timeline caotica
3. **Nomes perdidos**: LIDs (`@lid`) nao resolvidos para PN (`@s.whatsapp.net`) antes de persistir no CRM

## Estado Atual do Gateway

```
Repositorio: C:\Users\jeanz\OneDrive\Desktop\ROI Labs\CRM\whatsmeow-gateway
Deploy:      EasyPanel → ia/sirius_whats
Stack:       Go 1.25 + Gin + whatsmeow + PostgreSQL 17
LOC:         ~2000 (client.go ~1200, handlers.go ~400, webhook ~230, db ~190)
```

### Arquitetura Atual (Simplificada)

```
WhatsApp Server
     |
     | WebSocket (Signal Protocol)
     v
+-------------------+
| sirius_whats (Go) |
| - whatsmeow       |
| - Session DB (PG) |  <-- chaves Signal, LID map, device store
+-------------------+
     |
     | HTTP Webhook (sincrono)
     v
+-------------------+
| Sirius CRM (Next) |
| - CRM DB (PG)     |  <-- contatos, deals, org, users
| - WA DB (PG)      |  <-- mensagens, connections, reactions
+-------------------+
```

### Gaps Identificados

| Gap | Arquivo | Impacto |
|-----|---------|---------|
| Sem connection pooling | `internal/store/db.go:21` | Exaustao de conexoes sob carga |
| Sem `OfflineSyncPreview` | `internal/whatsapp/client.go:383-435` | Nao pre-aloca recursos para sync |
| Sem `OfflineSyncCompleted` | idem | Nao sabe quando sync terminou |
| Sem LID resolution | `internal/whatsapp/client.go:518-576` | Contatos @lid sem nome |
| Sem Redis buffer | N/A | Webhook sincrono bloqueia eventHandler |
| Sem Snowflake ID | N/A | ORDER BY caótico |
| History sync via webhook direto | `internal/whatsapp/client.go:438-516` | Centenas de webhooks durante sync |

---

## Pilar 1: Session DB Isolation + Connection Pooling

**Complexidade:** Baixa (~30 min)
**Impacto:** Previne exaustao de conexoes e crashes silenciosos

### O que mudar

**Arquivo:** `internal/store/db.go`

```go
// ANTES (linha 21)
db, err := sql.Open("postgres", databaseURL)

// DEPOIS
db, err := sql.Open("postgres", databaseURL)
if err != nil {
    return nil, nil, fmt.Errorf("failed to open database: %w", err)
}

// Connection pooling otimizado para whatsmeow
db.SetMaxOpenConns(20)      // Maximo de conexoes abertas
db.SetMaxIdleConns(5)       // Conexoes idle mantidas
db.SetConnMaxLifetime(30 * time.Minute) // Reciclagem
db.SetConnMaxIdleTime(5 * time.Minute)  // Timeout idle
```

### Por que esses valores

- `MaxOpenConns(20)`: whatsmeow usa ~2-3 conexoes por instancia. Com MAX_INSTANCES_PER_ORG=5, 20 e suficiente
- `MaxIdleConns(5)`: evita overhead de reconexao constante
- `ConnMaxLifetime(30min)`: evita conexoes stale no PostgreSQL
- `ConnMaxIdleTime(5min)`: libera recursos nao usados

### Validacao

- Monitorar `db.Stats()` no endpoint `/metrics`
- Verificar que nao ha `too many connections` nos logs do Postgres

---

## Pilar 2: Redis Buffer + Batch Processing

**Complexidade:** Alta (~2-3 dias)
**Impacto:** Elimina pulo de mensagens, desacopla rede de persistencia

### Infraestrutura

**EasyPanel — Novo servico no projeto `dados`:**

```yaml
# Redis 7 Alpine
Nome: redis-sirius
Imagem: redis:7-alpine
Porta interna: 6379
Volume: redis_data:/data
Comando: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy noeviction
```

**Env var no gateway:**
```
REDIS_URL=redis://redis-sirius:6379/0
```

### Arquitetura Alvo

```
WhatsApp Server
     |
     | WebSocket
     v
+-------------------+
| sirius_whats (Go) |
|                   |
| eventHandler ──┐  |
|                |  |
|   Redis Stream <  |  <-- sub-ms, nunca bloqueia WebSocket
|                |  |
|   Worker ──────┘  |  <-- consome stream, batch 500-1000 msgs
|                   |
| Session DB (PG)   |
+-------------------+
     |
     | HTTP Webhook (batch, apos OfflineSyncCompleted)
     v
+-------------------+
| Sirius CRM (Next) |
+-------------------+
```

### Implementacao no Gateway

#### 2.1 Dependencia Redis

```bash
cd whatsmeow-gateway
go get github.com/redis/go-redis/v9
```

#### 2.2 Novo arquivo: `internal/store/redis.go`

```go
package store

import (
    "context"
    "fmt"
    "github.com/redis/go-redis/v9"
)

func NewRedisClient(redisURL string) (*redis.Client, error) {
    opts, err := redis.ParseURL(redisURL)
    if err != nil {
        return nil, fmt.Errorf("invalid REDIS_URL: %w", err)
    }
    client := redis.NewClient(opts)
    if err := client.Ping(context.Background()).Err(); err != nil {
        return nil, fmt.Errorf("redis ping failed: %w", err)
    }
    return client, nil
}
```

#### 2.3 Modificar event handlers em `internal/whatsapp/client.go`

**Eventos novos a implementar:**

```go
case *events.OfflineSyncPreview:
    // Pre-alocacao: informa volume que vira
    log.Info().
        Int("messages", evt.Messages).
        Int("receipts", evt.Receipts).
        Int("notifications", evt.Notifications).
        Msg("offline sync preview — preparing buffer")
    inst.SyncStats.InProgress = true
    inst.SyncStats.ExpectedMessages = evt.Messages

case *events.OfflineSyncCompleted:
    // Sinal: todo historico foi recebido
    log.Info().Msg("offline sync completed — flushing buffer to CRM")
    inst.SyncStats.InProgress = false
    // Dispara flush do Redis Stream para o CRM
    go m.flushSyncBuffer(inst)
```

**Modificar `events.HistorySync` (linhas 438-516):**

```go
case *events.HistorySync:
    // ANTES: construia payload e enviava webhook direto
    // DEPOIS: push para Redis Stream

    for _, conv := range evt.Data.GetConversations() {
        msgs := conv.GetMessages()
        for _, msg := range msgs {
            payload := m.buildMessagePayload(inst, msg, conv)
            m.pushToRedisStream(inst.ID, "history_sync", payload)
        }
    }
```

**Modificar `events.Message` (linhas 518-576):**

```go
case *events.Message:
    // Mensagens em tempo real: push para Redis + webhook imediato
    // (tempo real nao deve esperar batch)
    payload := m.buildRealtimePayload(inst, evt)

    // Push para Redis (backup/ordenacao)
    m.pushToRedisStream(inst.ID, "realtime", payload)

    // Webhook imediato para tempo real
    m.webhook.Send(webhook.Event{
        Type:       "message",
        InstanceID: inst.ID,
        Timestamp:  time.Now().Unix(),
        Data:       payload,
    })
```

#### 2.4 Novo arquivo: `internal/whatsapp/buffer.go`

```go
package whatsapp

import (
    "context"
    "encoding/json"
    "fmt"
    "time"

    "github.com/redis/go-redis/v9"
)

const (
    streamPrefix = "wa:messages:"
    batchSize    = 500
    flushTimeout = 30 * time.Second
)

// pushToRedisStream enfileira msg no Redis Stream (sub-ms)
func (m *Manager) pushToRedisStream(instanceID, eventType string, payload any) {
    ctx := context.Background()
    data, _ := json.Marshal(payload)

    m.redis.XAdd(ctx, &redis.XAddArgs{
        Stream: streamPrefix + instanceID,
        Values: map[string]interface{}{
            "type":    eventType,
            "payload": string(data),
            "ts":      time.Now().UnixMilli(),
        },
    })
}

// flushSyncBuffer consome o Redis Stream em batches e envia para o CRM
func (m *Manager) flushSyncBuffer(inst *Instance) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
    defer cancel()

    stream := streamPrefix + inst.ID
    lastID := "0-0"
    totalFlushed := 0

    for {
        results, err := m.redis.XRange(ctx, stream, lastID, "+", int64(batchSize)).Result()
        if err != nil || len(results) == 0 {
            break
        }

        batch := make([]map[string]interface{}, 0, len(results))
        for _, r := range results {
            var payload map[string]interface{}
            json.Unmarshal([]byte(r.Values["payload"].(string)), &payload)
            batch = append(batch, payload)
            lastID = r.ID
        }

        // Enviar batch para CRM via webhook
        m.webhook.Send(webhook.Event{
            Type:       "history.sync.batch",
            InstanceID: inst.ID,
            Timestamp:  time.Now().Unix(),
            Data: map[string]interface{}{
                "messages": batch,
                "count":    len(batch),
                "isFinal":  len(results) < batchSize,
            },
        })

        // Remover mensagens processadas do stream
        ids := make([]string, len(results))
        for i, r := range results {
            ids[i] = r.ID
        }
        m.redis.XDel(ctx, stream, ids...)

        totalFlushed += len(results)
    }

    log.Info().
        Int("totalFlushed", totalFlushed).
        Str("instanceId", inst.ID).
        Msg("sync buffer flushed to CRM")
}
```

#### 2.5 CRM: Novo endpoint para batch

**Arquivo:** `app/api/webhooks/whatsmeow/route.ts`

Adicionar handler para `history.sync.batch`:

```typescript
case 'history.sync.batch': {
    const { messages, count, isFinal } = data
    // Batch insert de ate 1000 msgs com Snowflake ID
    await prismaWa.whatsAppMessage.createMany({
        data: messages.map(msg => ({
            // ... campos mapeados com sourceTimestamp
        })),
        skipDuplicates: true,
    })
    break
}
```

---

## Pilar 3: Snowflake ID / messageTimestamp

**Complexidade:** Media (~1 dia)
**Impacto:** Ordenacao cronologica 100% precisa, imune a iOS/Android

### Conceito

```
Snowflake ID (64 bits / BigInt):
|-- 41 bits: timestamp (ms desde epoch) --|-- 10 bits: node --|-- 12 bits: seq --|

Exemplo:
  messageTimestamp = 1712345678123 (ms)
  nodeId = 1 (instancia do gateway)
  sequence = 0

  snowflakeId = (1712345678123 << 22) | (1 << 12) | 0
             = 7183519...  (BigInt ordenavel)
```

### Vantagem

- `ORDER BY id ASC` = ordem cronologica real do WhatsApp
- Independe de quando a msg foi inserida no DB
- Sem indice extra — PK ja e o indice

### Implementacao no Gateway

**Novo arquivo:** `internal/whatsapp/snowflake.go`

```go
package whatsapp

import (
    "sync"
    "time"
)

const (
    epoch       = int64(1704067200000) // 2024-01-01T00:00:00Z em ms
    nodeBits    = 10
    seqBits     = 12
    nodeShift   = seqBits
    tsShift     = nodeBits + seqBits
    seqMask     = (1 << seqBits) - 1
)

type SnowflakeGen struct {
    mu       sync.Mutex
    nodeID   int64
    lastTS   int64
    sequence int64
}

func NewSnowflakeGen(nodeID int64) *SnowflakeGen {
    return &SnowflakeGen{nodeID: nodeID & ((1 << nodeBits) - 1)}
}

// Generate cria Snowflake ID a partir do messageTimestamp original
func (s *SnowflakeGen) Generate(messageTimestampMs int64) int64 {
    s.mu.Lock()
    defer s.mu.Unlock()

    ts := messageTimestampMs - epoch
    if ts == s.lastTS {
        s.sequence = (s.sequence + 1) & int64(seqMask)
        if s.sequence == 0 {
            ts++ // overflow: incrementa timestamp
        }
    } else {
        s.sequence = 0
    }
    s.lastTS = ts

    return (ts << tsShift) | (s.nodeID << nodeShift) | s.sequence
}

// FromTimestamp converte timestamp Unix (segundos) para ms
func FromTimestamp(unixSeconds uint64) int64 {
    return int64(unixSeconds) * 1000
}
```

**Uso no event handler:**

```go
// No message handler
snowflakeID := m.snowflake.Generate(FromTimestamp(evt.Info.Timestamp.Unix()))

payload["snowflakeId"] = fmt.Sprintf("%d", snowflakeID)
payload["sourceTimestamp"] = evt.Info.Timestamp.UnixMilli()
```

**No history sync handler:**

```go
// messageTimestamp vem do protobuf
msgTs := msg.GetMessage().GetMessageTimestamp()
snowflakeID := m.snowflake.Generate(FromTimestamp(msgTs))

payload["snowflakeId"] = fmt.Sprintf("%d", snowflakeID)
payload["sourceTimestamp"] = int64(msgTs) * 1000
```

### Implementacao no CRM

**Migration no WA schema (`prisma/whatsapp.prisma`):**

```prisma
model WhatsAppMessage {
  id                String    @id @default(uuid())
  snowflakeId       BigInt?   @unique  // Snowflake ID para ordenacao
  sourceTimestamp   DateTime? // Timestamp original do WhatsApp

  // ... campos existentes ...

  @@index([contactId, snowflakeId])  // Indice para queries de chat
}
```

**Ajuste nas queries de ordenacao:**

```typescript
// ANTES
orderBy: { sentAt: 'desc' }

// DEPOIS
orderBy: { snowflakeId: 'desc' }
// Fallback para msgs antigas sem snowflakeId:
orderBy: [{ snowflakeId: 'desc' }, { sentAt: 'desc' }]
```

---

## Pilar 4: LID Resolution Middleware

**Complexidade:** Media (~4-6 horas)
**Impacto:** Resolve 100% dos nomes perdidos por LID

### O que e LID

```
PN (Phone Number):  5511987654321@s.whatsapp.net  → nome resolvivel
LID (Linked ID):    186599266643969@lid            → opaco, sem nome

O WhatsApp usa LID em:
- Dispositivos secundarios (whatsmeow e um deles)
- Anuncios Click-to-WhatsApp
- Canais de privacidade avancada
```

### Estrategia de Resolucao (3 camadas)

```
Mensagem recebida com JID
        |
        v
   JID contem "@lid"?
   /            \
  NAO            SIM
  |               |
  v               v
Usar PN      1. Verificar SenderAlt/RecipientAlt no protobuf
direto          |
                v
             Encontrou PN?
             /          \
            SIM          NAO
            |             |
            v             v
         Usar PN    2. client.Store.LIDs.GetPNForLID()
                       |
                       v
                    Encontrou PN?
                    /          \
                   SIM          NAO
                   |             |
                   v             v
                Usar PN    3. Salvar LID como fallback
                               (marcar para resolucao futura)
```

### Implementacao no Gateway

**Novo arquivo:** `internal/whatsapp/lid_resolver.go`

```go
package whatsapp

import (
    "context"
    "strings"

    "go.mau.fi/whatsmeow"
    "go.mau.fi/whatsmeow/types"
)

// ResolveLID tenta converter um LID para o PN canonico
func ResolveLID(client *whatsmeow.Client, jid types.JID) types.JID {
    // Ja e PN — retorna direto
    if jid.Server != "lid" {
        return jid
    }

    // Camada 1: GetPNForLID via store interno do whatsmeow
    pn, err := client.Store.LIDs.GetPNForLID(context.Background(), jid)
    if err == nil && !pn.IsEmpty() {
        return pn
    }

    // Nao resolvido — retorna LID original (sera salvo para resolucao futura)
    return jid
}

// ResolveMessageSender resolve o remetente usando metadados do protobuf
func ResolveMessageSender(client *whatsmeow.Client, evt *events.Message) (resolved types.JID, pushName string) {
    sender := evt.Info.Sender
    pushName = evt.Info.PushName

    // Se nao e LID, retorna direto
    if sender.Server != "lid" {
        return sender, pushName
    }

    // Camada 1: Verificar campos alternativos no protobuf
    if sourceMsg := evt.Message.GetDeviceSentMessage(); sourceMsg != nil {
        // DeviceSentMessage pode conter o destinatario real
        destJID := sourceMsg.GetDestinationJid()
        if destJID != "" && !strings.Contains(destJID, "@lid") {
            parsed, _ := types.ParseJID(destJID)
            if !parsed.IsEmpty() {
                return parsed, pushName
            }
        }
    }

    // Camada 2: GetPNForLID via store
    resolved = ResolveLID(client, sender)
    if resolved.Server != "lid" {
        // Tentar pegar pushName do contato resolvido
        contact, err := client.Store.Contacts.GetContact(context.Background(), resolved)
        if err == nil && contact.PushName != "" {
            pushName = contact.PushName
        }
    }

    return resolved, pushName
}

// IsLID verifica se um JID e um Linked Device ID
func IsLID(jid string) bool {
    return strings.HasSuffix(jid, "@lid")
}

// NormalizeJID garante formato canonico @s.whatsapp.net
func NormalizeJID(jid types.JID) string {
    if jid.Server == "lid" {
        return jid.String() // Manter LID se nao resolvido
    }
    return jid.User + "@s.whatsapp.net"
}
```

**Integrar no message handler (`internal/whatsapp/client.go` linhas 518-576):**

```go
case *events.Message:
    // ANTES:
    // sender := evt.Info.Sender.String()
    // pushName := evt.Info.PushName

    // DEPOIS:
    resolvedSender, pushName := ResolveMessageSender(inst.Client, evt)
    sender := NormalizeJID(resolvedSender)

    // Resto do handler usa sender e pushName resolvidos
```

**Integrar no history sync handler (linhas 438-516):**

```go
// Para cada mensagem do history sync:
rawJID := msg.GetMessage().GetKey().GetRemoteJid()
if IsLID(rawJID) {
    parsed, _ := types.ParseJID(rawJID)
    resolved := ResolveLID(inst.Client, parsed)
    rawJID = NormalizeJID(resolved)
}
```

---

## Ordem de Execucao (Realizada em 2026-04-05)

```
Dia 1 (2026-04-05) — Tudo implementado em uma sessao:
  [x] Pilar 1 — Connection Pooling (30 min)
  [x] Pilar 4 — LID Resolution (1h)
  [x] Pilar 3 — Snowflake ID no gateway + CRM (2h)
  [x] Pilar 2 — Provisionar Redis no EasyPanel (10 min)
  [x] Pilar 2 — Redis Stream + buffer + delayed flush (2h)
  [x] Pilar 2 — OfflineSyncPreview/Completed handlers (30 min)
  [x] Pilar 2 — Batch endpoint no CRM (1h)
  [x] Deploy + testes end-to-end (1h)
  [x] Fix: race condition OfflineSyncCompleted vs HistorySync (30 min)
  [x] Fix: nil pointer guard em BuildHistorySyncRequest (10 min)
```

## Arquitetura Final

```
WhatsApp Server
     |
     | WebSocket (Signal Protocol / PFS)
     v
+────────────────────────────────────────────+
| sirius_whats (Go)                          |
|                                            |
| eventHandler                               |
|   ├─ LID Resolver ──> normaliza @lid → PN  |
|   ├─ Snowflake Gen ──> ID temporal 64-bit  |
|   └─ Redis Stream ──> buffer sub-ms        |
|                                            |
| OfflineSyncPreview  → pre-aloca recursos   |
| OfflineSyncCompleted → flush buffer        |
|                                            |
| Worker (goroutine)                         |
|   └─ Redis Consumer ──> batch 500 msgs     |
|       └─ Webhook batch → CRM              |
|                                            |
| Session DB (PG)                            |
|   ├─ MaxOpenConns: 20                      |
|   ├─ MaxIdleConns: 5                       |
|   └─ Signal keys, LID map, device store    |
+────────────────────────────────────────────+
     |
     | HTTP Webhook (batch ou realtime)
     v
+────────────────────────────────────────────+
| Sirius CRM (Next.js)                       |
|                                            |
| /api/webhooks/whatsmeow                    |
|   ├─ message → insert com snowflakeId      |
|   ├─ history.sync.batch → createMany       |
|   └─ contact.update → LID→PN enrichment   |
|                                            |
| CRM DB (PG) ── contatos, deals, org       |
| WA DB (PG)  ── mensagens, connections     |
|   └─ ORDER BY snowflakeId DESC             |
|                                            |
| Redis ── buffer, cache (futuro)            |
+────────────────────────────────────────────+
```

## Metricas de Sucesso

| Metrica | Antes | Depois |
|---------|-------|--------|
| Mensagens puladas por sync | ~5-15% | 0% |
| Contatos sem nome (LID) | ~20-30% | <1% |
| Ordenacao correta do chat | ~80% | 100% |
| Tempo de history sync (10k msgs) | timeout/crash | <30s |
| Webhook failures durante sync | frequente | raro (Redis absorve) |

## Riscos e Mitigacoes

| Risco | Mitigacao |
|-------|-----------|
| Redis cai durante sync | Fallback: webhook direto (comportamento atual) |
| LID sem mapeamento no store | Salvar com LID, resolver em background job |
| Snowflake ID collision | 12 bits de sequence = 4096 msgs/ms — impossivel colidir |
| Migration de msgs antigas sem snowflakeId | Backfill script: gerar snowflakeId a partir de sentAt existente |
| EasyPanel network entre projetos | Usar IP externo (ja resolvido) |
