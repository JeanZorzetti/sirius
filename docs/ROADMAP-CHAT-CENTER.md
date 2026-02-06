# Sirius CRM - Chat Center Roadmap
## WhatsApp Integrated Chat Center - Plano de Melhoria Completo

> Baseado em pesquisa extensiva de: WhatsApp Web, Intercom, Chatwoot, Crisp, Trengo, Zendesk, HubSpot, Freshworks, GetStream, CometChat

---

## Estado Atual (Baseline)

### O que existe hoje:
- Layout dois paineis: ConversationList (340px) + MessageArea (flex)
- Polling a cada 2-3s para mensagens e conexoes
- WhatsApp via Evolution API v2 (POST endpoints)
- Envio/recebimento com status (sent/delivered/read)
- Media lazy-load (imagem, video, audio, documento, sticker) via getBase64FromMediaMessage
- Bolhas agrupadas estilo iMessage (border-radius variavel)
- Separadores de data, busca na sidebar, formatacao BR de telefone
- Prisma com WhatsAppMessage, Contact, WhatsAppConnection

### O que falta (roadmap abaixo):
- Layout 3 paineis (sidebar de contato)
- Badges de nao-lido com contagem
- WebSocket/SSE para tempo real verdadeiro
- Responder/citar mensagens
- Respostas rapidas (canned responses)
- Busca dentro da conversa
- Atribuicao de agente
- Labels/tags de conversa
- Typing indicator
- Reacoes com emoji
- Dark mode completo
- Virtualizacao de mensagens
- Notificacoes push/browser

---

## Fase 1 - Experiencia Core do Chat (Semanas 1-2)
> Foco: Tornar o chat funcional e profissional para uso diario

### 1.1 Badges de Nao-Lido + Notificacoes
| Atributo | Valor |
|----------|-------|
| Prioridade | MUST-HAVE |
| Complexidade | Baixa |
| Impacto | Alto |

**O que fazer:**
- Badge verde com contagem em cada conversa na sidebar
- Nome e preview em negrito para conversas nao-lidas
- Contagem total no tab "Conversas" (ja parcialmente implementado)
- Titulo do browser muda: "Chat Center (3)" com nao-lidos
- Push notification com nome do contato e preview da mensagem

**Como implementar:**
1. Adicionar campo `isRead Boolean @default(false)` ao modelo WhatsAppMessage
2. Adicionar indice `@@index([contactId, isRead, direction])`
3. Marcar como lido quando agente abre a conversa: `PUT /api/whatsapp/messages/mark-read`
4. Modificar query de conversas para incluir `_count` de mensagens nao-lidas INBOUND
5. Push notifications via `web-push` (infra ja existe no projeto)
6. `document.title` update no ChatInterface com total de nao-lidos

**Componentes:**
```
components/chat/unread-badge.tsx       (novo)
components/chat/conversation-list.tsx  (modificar - adicionar badge + negrito)
components/chat/chat-interface.tsx     (modificar - titulo do browser)
app/api/whatsapp/messages/mark-read/route.ts (novo)
```

**Schema Prisma:**
```prisma
// Adicionar ao WhatsAppMessage:
isRead  Boolean @default(false)
@@index([contactId, isRead, direction])
```

**Design do Badge:**
```tsx
function UnreadBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="inline-flex items-center justify-center min-w-[20px] h-5
      px-1.5 text-xs font-bold text-white bg-[#25d366] rounded-full tabular-nums">
      {count > 99 ? '99+' : count}
    </span>
  )
}
```

**Estilo da conversa nao-lida:**
```tsx
// Conversa nao-lida vs lida
<div className={cn(
  "flex items-center gap-3 px-3 py-[10px]",
  hasUnread ? "bg-[#f0f2f5]/50" : "",
)}>
  {/* Nome em bold quando nao-lido */}
  <span className={cn("text-[15px] truncate",
    hasUnread ? "font-bold text-[#111b21]" : "font-medium text-[#111b21]"
  )}>{name}</span>
  {/* Timestamp verde quando nao-lido */}
  <span className={cn("text-[11px]",
    hasUnread ? "text-[#25d366] font-semibold" : "text-[#667781]"
  )}>{time}</span>
</div>
```

---

### 1.2 Labels/Tags de Conversa
| Atributo | Valor |
|----------|-------|
| Prioridade | MUST-HAVE |
| Complexidade | Baixa |
| Impacto | Alto |

**O que fazer:**
- Chips coloridos abaixo do nome na lista de conversas
- No header da mensagem, tags como chips clicaveis com botao "+"
- Dropdown com tags existentes + "Criar nova tag"
- Tags padrao: "Lead Quente", "Follow Up", "Suporte", "VIP", "Spam"
- Filtrar conversas por tag na lista
- Tags visiveis tambem no sidebar de contato (Fase 2)

**Como implementar:**
1. Reutilizar modelo `Tag` existente (ja tem `id`, `name`, `color`, `organizationId`)
2. Adicionar relacao many-to-many `Tag <-> Contact`: `contacts Contact[]` no Tag, `tags Tag[]` no Contact
3. API routes: `POST/DELETE /api/whatsapp/conversations/[id]/tags`
4. Renderizar tag chips no ConversationList abaixo do preview
5. Dropdown de filtro por tag no topo da lista

**Schema Prisma (modificar Tag existente):**
```prisma
model Tag {
  id             String @id @default(uuid())
  name           String
  color          String
  organizationId String
  organization   Organization @relation(...)
  deals          Deal[]
  contacts       Contact[]   // NOVO: many-to-many
}

// No Contact, adicionar:
tags  Tag[]
```

---

### 1.3 Busca Dentro da Conversa
| Atributo | Valor |
|----------|-------|
| Prioridade | MUST-HAVE |
| Complexidade | Media |
| Impacto | Alto |

**O que fazer:**
- Icone de busca no header da area de mensagens
- Barra de busca desliza abaixo do header ao clicar
- Resultados destacados em amarelo dentro das bolhas
- Setas cima/baixo para navegar entre matches
- Contagem: "3 de 15 resultados"
- Escape ou X fecha a busca
- Filtro opcional: periodo, tipo de midia

**Como implementar:**
1. Busca client-side para mensagens ja carregadas: `messages.filter(m => m.text.toLowerCase().includes(query))`
2. Para busca profunda, adicionar `?search=term` ao endpoint de interactions
3. Highlight com `<mark>` tag wrapper
4. `scrollIntoView({ behavior: 'smooth' })` para navegar
5. Debounce de 300ms no input

**Componentes:**
```
components/chat/message-search.tsx  (novo)
  - Estado: query, matchIndices[], currentMatchIndex
  - Renderiza: input + contagem + setas + botao fechar
```

**Prisma query para busca profunda:**
```typescript
prisma.whatsAppMessage.findMany({
  where: {
    contactId,
    organizationId,
    text: { contains: searchTerm, mode: 'insensitive' }
  },
  orderBy: { sentAt: 'asc' },
  take: 50,
})
```

---

## Fase 2 - Produtividade do Agente (Semanas 3-4)
> Foco: Ferramentas que aceleram o tempo de resposta

### 2.1 Respostas Rapidas (Canned Responses)
| Atributo | Valor |
|----------|-------|
| Prioridade | MUST-HAVE |
| Complexidade | Media |
| Impacto | Alto |

**O que fazer:**
- Digitar `/` no input abre autocomplete acima do textarea
- Cada template mostra: atalho (`/saudacao`), texto preview, categoria
- Filtro por digitacao apos `/`
- Clicar insere o texto resolvido (placeholders substituidos)
- Pagina de configuracao para gerenciar templates
- Navegacao por teclado: setas + Enter + Escape

**Placeholders suportados:**
- `{contato.nome}` - Nome do contato
- `{contato.telefone}` - Telefone formatado
- `{negocio.titulo}` - Titulo do deal
- `{usuario.nome}` - Nome do agente logado
- `{data}` - Data atual formatada

**Schema Prisma:**
```prisma
model QuickReply {
  id             String   @id @default(uuid())
  shortcut       String   // "/saudacao", "/followup"
  title          String
  content        String   @db.Text
  category       String?  // "saudacao", "fechamento", "followup"
  organizationId String
  organization   Organization @relation(...)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  @@unique([organizationId, shortcut])
  @@index([organizationId])
}
```

**Componentes:**
```
components/chat/quick-reply-picker.tsx              (novo)
app/api/whatsapp/quick-replies/route.ts             (novo - CRUD)
app/api/whatsapp/quick-replies/[id]/route.ts        (novo - PUT/DELETE)
app/dashboard/settings/quick-replies/page.tsx        (novo - UI de gerenciamento)
```

**Templates padrao iniciais:**
```
/saudacao  -> "Ola {contato.nome}! Tudo bem? Como posso te ajudar?"
/obrigado  -> "Obrigado pelo contato, {contato.nome}! Qualquer duvida, estou a disposicao."
/followup  -> "Oi {contato.nome}, passando para dar continuidade ao nosso assunto. Conseguiu analisar?"
/horario   -> "Nosso horario de atendimento e de segunda a sexta, das 9h as 18h."
/pix       -> "Segue nossos dados para pagamento via PIX..."
```

---

### 2.2 Responder/Citar Mensagens (Reply/Quote)
| Atributo | Valor |
|----------|-------|
| Prioridade | MUST-HAVE |
| Complexidade | Media |
| Impacto | Alto |

**O que fazer:**
- Swipe direita (mobile) ou icone de reply no hover para citar
- Barra de preview acima do input mostrando mensagem citada
- X na barra cancela a citacao
- Na bolha, mensagem citada aparece como bloco menor no topo com borda colorida esquerda
- Clicar na citacao faz scroll ate a mensagem original com highlight

**Como implementar:**
1. Adicionar `replyToId` e `replyToText` ao WhatsAppMessage
2. Ao enviar via Evolution API v2, usar parametro `quoted` com o `messageId` original
3. Estado `replyingTo` no MessageArea
4. Componente `QuotedMessage` renderizado dentro da bolha
5. Mapa de refs `messageId -> HTMLElement` para scroll-to-original

**Schema Prisma:**
```prisma
// Adicionar ao WhatsAppMessage:
replyToId   String?
replyTo     WhatsAppMessage? @relation("MessageReplies", fields: [replyToId], references: [id])
replies     WhatsAppMessage[] @relation("MessageReplies")
replyToText String?  // Cache para performance de exibicao
```

**Evolution API v2 - Enviar com citacao:**
```typescript
// POST /message/sendText/{instance}
{
  number: remoteJid,
  text: messageText,
  quoted: { key: { remoteJid, id: originalMessageId } }
}
```

**Visual da citacao na bolha:**
```tsx
function QuotedMessage({ text, senderName }: Props) {
  return (
    <div className="bg-black/5 rounded-md px-2.5 py-1.5 mb-1 border-l-4 border-[#00a884] cursor-pointer hover:bg-black/8">
      <p className="text-[11px] font-semibold text-[#00a884] leading-tight">{senderName}</p>
      <p className="text-[12px] text-[#667781] line-clamp-2 leading-tight">{text}</p>
    </div>
  )
}
```

---

### 2.3 Painel Lateral de Contato (Contact Sidebar)
| Atributo | Valor |
|----------|-------|
| Prioridade | MUST-HAVE |
| Complexidade | Media |
| Impacto | Alto |

**O que fazer:**
- Painel deslizante a direita (300-360px) ao clicar no nome/avatar do contato no header
- Secao superior: avatar grande, nome, telefone, email, empresa
- Secao media: acordeoes para "Negocios" (cards do pipeline), "Tags", "Notas"
- Secao inferior: botoes de acao rapida - "Criar Negocio", "Adicionar Tag", "Ver Perfil Completo"
- Botao fechar (X) no topo; clicar no header alterna o painel

**Layout CSS - 3 paineis:**
```css
.chat-center {
  display: grid;
  grid-template-columns: 340px 1fr 360px;
  height: 100%;
}

/* Sem sidebar: */
.chat-center.no-sidebar {
  grid-template-columns: 340px 1fr;
}

/* Responsivo: colapsa sidebar < 1200px */
@media (max-width: 1200px) {
  .chat-center { grid-template-columns: 280px 1fr; }
}

/* Mobile: overlay */
@media (max-width: 768px) {
  .chat-center { grid-template-columns: 1fr; }
}
```

**Componentes:**
```
components/chat/contact-sidebar.tsx  (novo)
  - ContactHeader (avatar grande 80px, nome, telefone)
  - ContactDetails (email, empresa, endereco)
  - DealsList (cards dos negocios vinculados)
  - TagsList (chips das tags)
  - NotesList (ultimas 3-5 notas)
  - QuickActions (botoes de acao)
```

**Query Prisma:**
```typescript
prisma.contact.findUnique({
  where: { id: contactId },
  include: {
    deals: {
      include: { stage: true, pipeline: true },
      take: 5,
      orderBy: { updatedAt: 'desc' }
    },
    tags: true,
    notes: { take: 5, orderBy: { createdAt: 'desc' } },
    _count: { select: { whatsappMessages: true } },
  }
})
```

---

## Fase 3 - Colaboracao em Equipe (Semanas 5-6)
> Foco: Multiplos agentes trabalhando juntos

### 3.1 Atribuicao de Agente / Transferencia ✅
| Atributo | Valor |
|----------|-------|
| Prioridade | MUST-HAVE |
| Complexidade | Alta |
| Impacto | Alto |

**O que fazer:**
- No header da mensagem, mostrar avatar/nome do agente atribuido
- Botao "Atribuir" abre dropdown com membros da equipe (com status online)
- Ao transferir, opcionalmente adicionar nota interna
- Lista de conversas mostra badge do agente atribuido
- Filtros: "Minhas conversas", "Nao atribuidas", "Todas"
- Mensagem de sistema no chat: "Conversa transferida de Agente A para Agente B"

**Modelo ChatConversation (central para esta feature):**
```prisma
model ChatConversation {
  id              String   @id @default(uuid())
  contactId       String
  contact         Contact  @relation(...)
  organizationId  String
  organization    Organization @relation(...)
  assignedUserId  String?
  assignedUser    User?    @relation(...)
  status          ConversationStatus @default(OPEN)
  priority        ConversationPriority @default(NORMAL)
  lastMessageAt   DateTime?
  resolvedAt      DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  @@unique([contactId, organizationId])
  @@index([organizationId, status])
  @@index([assignedUserId])
}

enum ConversationStatus {
  OPEN
  PENDING
  RESOLVED
  CLOSED
}

enum ConversationPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}
```

**API Routes:**
```
POST /api/whatsapp/conversations/[id]/assign    (atribuir agente)
POST /api/whatsapp/conversations/[id]/transfer   (transferir com nota)
PUT  /api/whatsapp/conversations/[id]/status      (abrir/resolver/fechar)
```

**Auto-assignment:** Integrar com `LeadDistributionRule` existente (ROUND_ROBIN, LEAST_BUSY)

---

### 3.2 Tempo Real via SSE (Substituir Polling) ✅
| Atributo | Valor |
|----------|-------|
| Prioridade | MUST-HAVE |
| Complexidade | Alta |
| Impacto | Alto |

**O que fazer:**
- Substituir polling de 2-3s por Server-Sent Events (SSE)
- Mensagens aparecem instantaneamente
- Indicador de conexao: verde = conectado, amarelo = reconectando, vermelho = desconectado
- Sem mais estados de loading entre polls

**Arquitetura:**
```
Evolution API Webhook
       |
       v
  Redis Pub/Sub
   (canal: chat:{orgId})
       |
       v
  SSE Endpoint (/api/whatsapp/stream)
       |
       v
  EventSource no Client
       |
       v
  React State Update
```

**Implementar:**
1. Criar `app/api/whatsapp/stream/route.ts` (SSE endpoint)
   - Ja existe pattern similar em `app/api/notifications/stream/route.ts`
2. Modificar webhook para publicar eventos no Redis alem de salvar no DB
3. Cliente usa `EventSource` para se inscrever
4. Eventos: `message.new`, `message.status`, `typing.start`, `typing.stop`
5. Fallback para polling se SSE cair (degradacao gracil)

**Redis Pub/Sub pattern:**
```
Canal: chat:{orgId}
Evento: { type: "message.new", contactId, message: { ... } }
```

**Cliente SSE:**
```tsx
useEffect(() => {
  const es = new EventSource('/api/whatsapp/stream')

  es.onmessage = (event) => {
    const data = JSON.parse(event.data)
    switch (data.type) {
      case 'message.new':
        setMessages(prev => [...prev, data.message])
        break
      case 'message.status':
        // Atualizar status da mensagem
        break
      case 'typing':
        setTyping(data.contactId, data.isTyping)
        break
    }
  }

  es.onerror = () => {
    // Fallback para polling
    startPolling()
  }

  return () => es.close()
}, [])
```

---

## Fase 4 - Polish & Engagement (Semana 7+)
> Foco: Detalhes que fazem a diferenca

### 4.1 Typing Indicator ✅
| Atributo | Valor |
|----------|-------|
| Prioridade | Nice-to-have |
| Complexidade | Baixa |
| Impacto | Medio |

**O que fazer:**
- 3 pontos animados dentro de uma bolha pequena (posicao inbound)
- Texto "digitando..." no header abaixo do nome do contato
- Na lista, "digitando..." substitui o preview da ultima mensagem
- Auto-dismiss apos 5s sem evento

**CSS da animacao:**
```css
.typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #667781;
  animation: typing-bounce 1.4s ease-in-out infinite;
}
.typing-dot:nth-child(2) { animation-delay: 0.15s; }
.typing-dot:nth-child(3) { animation-delay: 0.3s; }

@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
}
```

**Implementar:**
- Evolution API envia `presence.update` no webhook
- Armazenar estado em Redis com TTL de 5s: `typing:{orgId}:{remoteJid}`
- Novo endpoint ou incluir no stream SSE

---

### 4.2 Reacoes com Emoji ✅
| Atributo | Valor |
|----------|-------|
| Prioridade | Nice-to-have |
| Complexidade | Media |
| Impacto | Medio |

**O que fazer:**
- Hover/long-press mostra barra com 6 emoji (like, coracao, risos, surpreso, triste, reze)
- "+" abre emoji picker completo
- Reacoes aparecem abaixo da bolha como pills: `[emoji] [count]`
- Clicar na pill adiciona/remove reacao do usuario

**Schema:**
```prisma
model MessageReaction {
  id        String   @id @default(uuid())
  emoji     String
  messageId String
  message   WhatsAppMessage @relation(...)
  userId    String
  createdAt DateTime @default(now())
  @@unique([messageId, userId, emoji])
  @@index([messageId])
}
```

---

### 4.3 Virtualizacao de Mensagens ✅
| Atributo | Valor |
|----------|-------|
| Prioridade | Nice-to-have |
| Complexidade | Media |
| Impacto | Medio |

**O que fazer:**
- Usar `react-virtuoso` para renderizar apenas mensagens visiveis no DOM
- Critico para conversas com 1000+ mensagens
- Scroll infinito para cima (carregar mensagens antigas)

**Implementar:**
```tsx
import { Virtuoso } from 'react-virtuoso'

<Virtuoso
  data={messages}
  initialTopMostItemIndex={messages.length - 1}
  followOutput="smooth"
  itemContent={(index, message) => (
    <MemoizedChatBubble key={message.id} message={message} />
  )}
/>
```

---

### 4.4 Dark Mode Completo ✅
| Atributo | Valor |
|----------|-------|
| Prioridade | Nice-to-have |
| Complexidade | Media |
| Impacto | Medio |

**Paleta dark mode do WhatsApp:**
| Elemento | Hex |
|----------|-----|
| Background | `#12181C` |
| Outgoing Bubble | `#005C4B` |
| Incoming Bubble | `#202C33` |
| Header/Panel | `#1F2C34` |
| Input Area | `#1E2A30` |
| Text Primary | `#E9EDEF` |
| Text Secondary | `#8696A0` |

---

## Fase 5 - UI/UX Premium (Semana 8+)
> Foco: Micro-interacoes e polish visual de nivel Intercom

### 5.1 Micro-Animacoes
- Bolha entrada: `animate-in fade-in-0 slide-in-from-bottom-2 duration-200` (ja existe, refinar)
- Scroll suave ao fundo com `scrollIntoView({ behavior: 'smooth' })`
- Typing indicator bounce (CSS keyframes)
- Send button morph: Send <-> Mic com scale transition
- Skeleton shimmer no loading (gradiente animado L->R)
- Hover em conversas: escala sutil 1.005x
- Badge de nao-lido: pulse animation ao receber

### 5.2 Optimistic Updates
```tsx
// Mensagem aparece instantaneamente como "enviando"
const [optimistic, addOptimistic] = useOptimistic(messages, (state, newMsg) =>
  [...state, { ...newMsg, status: 'sending' }]
)

async function sendMessage(text: string) {
  const temp = { id: uuid(), text, status: 'sending', sentAt: new Date() }
  addOptimistic(temp)  // UI instantanea
  const confirmed = await api.send(text)
  dispatch({ type: 'CONFIRM', tempId: temp.id, confirmed })
}
```

### 5.3 Layout 3 Paineis Responsivo
```css
/* Desktop: 3 paineis */
.chat-layout {
  display: grid;
  grid-template-columns: 340px 1fr 360px;
  height: 100%;
}

/* Tablet: 2 paineis */
@media (max-width: 1200px) {
  .chat-layout { grid-template-columns: 280px 1fr; }
  .contact-sidebar { position: absolute; right: 0; z-index: 50; }
}

/* Mobile: 1 painel */
@media (max-width: 768px) {
  .chat-layout { grid-template-columns: 1fr; }
  .conversation-list { display: none; } /* quando conversa selecionada */
}
```

### 5.4 Acoes Rapidas na Lista de Conversas
- Hover mostra botoes: marcar como lido, fixar, arquivar
- Swipe (mobile): esquerda = arquivar, direita = fixar
- Conversas fixadas ficam no topo (max 15)

### 5.5 Acessibilidade
- `aria-live="polite"` no container de mensagens
- Navegacao por teclado completa
- Focus visivel em todos os elementos interativos
- Screen reader: anunciar novas mensagens

---

## Resumo Visual do Roadmap

```
Fase 1 (Sem 1-2)     Fase 2 (Sem 3-4)     Fase 3 (Sem 5-6)     Fase 4-5 (Sem 7+)
[Core]                [Produtividade]       [Equipe]              [Polish]

- Badges nao-lido     - Quick Replies       - Atribuicao agente   - Typing indicator
- Tags/Labels         - Reply/Quote         - SSE Real-time       - Reacoes emoji
- Busca na conversa   - Sidebar contato     - Status conversa     - Virtualizacao
                                            - Auto-assignment     - Dark mode
                                                                  - Micro-animacoes
                                                                  - Optimistic UI
                                                                  - Responsivo
                                                                  - Acessibilidade
```

---

## Arvore de Arquivos (Novos + Modificados)

```
crm-project/
  prisma/
    schema.prisma                               # MODIFICAR: novos modelos e campos

  components/chat/
    chat-interface.tsx                           # MODIFICAR: layout 3 paineis, SSE
    conversation-list.tsx                        # MODIFICAR: badges, tags, filtros
    message-area.tsx                             # MODIFICAR: reply, reactions, search
    contact-sidebar.tsx                          # NOVO: painel lateral de contato
    typing-indicator.tsx                         # NOVO: 3 pontos animados
    reaction-bar.tsx                             # NOVO: barra de emoji picker
    reaction-chips.tsx                           # NOVO: pills de reacao
    quoted-message.tsx                           # NOVO: bloco de citacao
    message-search.tsx                           # NOVO: busca na conversa
    quick-reply-picker.tsx                       # NOVO: autocomplete de templates
    unread-badge.tsx                             # NOVO: badge de contagem
    agent-assignment.tsx                         # NOVO: dropdown de atribuicao
    conversation-filters.tsx                     # NOVO: filtros por tag/status/agente

  app/api/whatsapp/
    quick-replies/route.ts                       # NOVO: CRUD templates
    quick-replies/[id]/route.ts                  # NOVO: PUT/DELETE template
    conversations/[id]/assign/route.ts           # NOVO: atribuir agente
    conversations/[id]/transfer/route.ts         # NOVO: transferir conversa
    conversations/[id]/tags/route.ts             # NOVO: gerenciar tags
    conversations/[id]/status/route.ts           # NOVO: mudar status
    messages/mark-read/route.ts                  # NOVO: marcar como lido
    messages/[id]/reactions/route.ts              # NOVO: reacoes
    stream/route.ts                              # NOVO: SSE endpoint
    media/route.ts                               # JA EXISTE

  app/dashboard/settings/
    quick-replies/page.tsx                       # NOVO: gerenciamento de templates
```

---

## Metricas de Sucesso

| Metrica | Baseline | Meta |
|---------|----------|------|
| Tempo medio de resposta | N/A (sem metricas) | < 2 minutos |
| Latencia de mensagem | 2-3s (polling) | < 500ms (SSE) |
| Conversas/agente/dia | N/A | Rastrear via ChatConversation |
| Taxa de resolucao | N/A | > 80% resolvidas em 24h |
| Mensagens com midia renderizada | 0% | 100% (imagem, video, audio, doc) |
| Conversas nao-lidas identificadas | Nao | Sim, com contagem |
| Tempo para encontrar conversa | ~10s (scroll) | < 3s (busca + filtros) |

---

## Referencias

- [WhatsApp Web UI patterns](https://mobbin.com/colors/brand/whatsapp)
- [Intercom Messenger](https://developers.intercom.com/installing-intercom/web/customization)
- [Chatwoot Open Source](https://www.chatwoot.com/hc/user-guide)
- [Crisp Live Chat](https://crisp.chat/en/livechat/)
- [Trengo Multichannel](https://trengo.com)
- [Zendesk Sidebar Guidelines](https://developer.zendesk.com/documentation/apps/app-design-guidelines/chat/sidebar-apps-chat/)
- [Carbon Design System - Empty States](https://carbondesignsystem.com/patterns/empty-states-pattern/)
- [Flowbite Chat Bubble](https://flowbite.com/docs/components/chat-bubble/)
- [React Virtuoso](https://virtuoso.dev/)
- [GetStream Chat SDK](https://getstream.io/chat/docs/react/)
- [Evolution API v2 Docs](https://doc.evolution-api.com/v2/)
