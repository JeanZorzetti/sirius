'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ConnectionManager } from './connection-manager'
import { ConversationList } from './conversation-list'
import { MessageArea } from './message-area'
import { EmptyState } from '@/components/ui/empty-state'
import { ChatBrandPlaceholder, EmptyConversationsPanel, WabaWaitingState } from './chat-empty-states'
import {
  MessageSquare,
  Wifi,
  WifiOff,
  Settings2,
  MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { usePusher } from '@/hooks/use-pusher'
import type { MessageNewEvent, ConnectionReadyEvent } from '@/hooks/use-pusher'
import { useAppBar } from '@/components/mobile/app-bar-context'
import { AudioPlayerProvider } from '@/hooks/use-audio-player'
import { KeyboardShortcutsModal } from './keyboard-shortcuts-modal'
import { ROTULO_ESTADO, desde, nomeDaConexao, nomeDoIntegrador, semCredencial, type ConexaoPublica } from './conexao-ui'

type Connection = ConexaoPublica

interface Contact {
  id: string
  name: string | null
  phone: string | null
  profilePicUrl?: string | null
  whatsappMessages: Array<{
    id: string
    text: string
    direction: string
    sentAt: Date
    connectionId?: string | null
  }>
  _count: {
    whatsappMessages: number
    unreadMessages?: number
  }
}

interface ChatInterfaceProps {
  connections: Connection[]
  contacts: Contact[]
  userId: string
  userName: string
  organizationId: string
  limite: number
  usadas: number
  podeGerenciar: boolean
  initialPhone?: string
  wabaEnabled?: boolean
}

export function ChatInterface(props: ChatInterfaceProps) {
  return (
    <AudioPlayerProvider>
      <ChatInterfaceInner {...props} />
    </AudioPlayerProvider>
  )
}

function ChatInterfaceInner({
  connections: initialConnections,
  contacts: initialContacts,
  userId,
  userName,
  organizationId,
  limite: limiteInicial,
  usadas: usadasIniciais,
  podeGerenciar,
  initialPhone,
  wabaEnabled = false,
}: ChatInterfaceProps) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [activeView, setActiveView] = useState<'chat' | 'connections'>('chat')
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [connections, setConnections] = useState<Connection[]>(initialConnections)
  const [plano, setPlano] = useState({ limite: limiteInicial, usadas: usadasIniciais })
  const [isRefreshing, setIsRefreshing] = useState(false)
  // Integrator messages arrive by notice; there is no history sync to wait for
  const [isSyncing, setIsSyncing] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Global keyboard shortcuts (Ctrl+/ opens shortcuts modal)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMod = e.ctrlKey || e.metaKey
      if (isMod && e.key === '/') {
        e.preventDefault()
        setShowShortcuts(s => !s)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const activeConnections = connections.filter(c => c.status === 'CONNECTED')
  // Every connection out of the air, except the ones the owner disconnected on purpose (US3, T069)
  const foraDoAr = connections.filter(c => c.status !== 'CONNECTED' && !semCredencial(c))
  const totalUnread = contacts.reduce((sum, contact) => sum + (contact._count.unreadMessages || 0), 0)

  // Auto-select contact when arriving from a WhatsApp button click (via ?phone=...)
  useEffect(() => {
    if (!initialPhone || contacts.length === 0) return
    const normalized = initialPhone.replace(/\D/g, '')
    const match = contacts.find(c => c.phone?.replace(/\D/g, '') === normalized)
    if (match) setSelectedContact(match)
  }, [initialPhone, contacts])

  const selectedContactRef = useRef(selectedContact)
  selectedContactRef.current = selectedContact

  const fetchConversations = useCallback(async (showLoading = false) => {
    if (showLoading) setIsRefreshing(true)
    try {
      const res = await fetch('/api/whatsapp/conversations')
      if (res.ok) {
        const data = await res.json()
        setContacts(data)
        setIsSyncing(false)
        const current = selectedContactRef.current
        if (current) {
          const updated = data.find((c: Contact) => c.id === current.id)
          if (updated) setSelectedContact(updated)
        }
      }
    } catch (error) {
      console.error('[CHAT] fetchConversations error:', error)
      setIsSyncing(false)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/connections')
      if (res.ok) {
        const data = await res.json()
        setConnections(data.conexoes)
        setPlano({ limite: data.limite, usadas: data.usadas })
      }
    } catch (error) {
      console.error('[CHAT] fetchConnections error:', error)
    }
  }, [])

  // Real-time: Pusher events update conversation list immediately
  usePusher({
    organizationId,
    onMessageNew: useCallback((_data: MessageNewEvent) => {
      fetchConversations()
    }, [fetchConversations]),
    onMessageSent: useCallback(() => {
      fetchConversations()
    }, [fetchConversations]),
    onConnectionReady: useCallback(async (_data: ConnectionReadyEvent) => {
      await fetchConnections()
      fetchConversations()
    }, [fetchConversations, fetchConnections]),
  })

  // Polling: conversas a cada 5s, conexões a cada 10s
  // Connections poll at 10s (down from 30s) to detect multi-device status changes faster.
  useEffect(() => {
    const convInterval = setInterval(() => fetchConversations(), 5000)
    const connInterval = setInterval(fetchConnections, 10000)
    return () => { clearInterval(convInterval); clearInterval(connInterval) }
  }, [fetchConversations, fetchConnections])

  // Update document title with unread count
  useEffect(() => {
    const unread = contacts.reduce((sum, contact) => sum + (contact._count.unreadMessages || 0), 0)
    document.title = unread > 0 ? `Chat Center (${unread})` : 'Chat Center'
    return () => { document.title = 'Chat Center' }
  }, [contacts])

  const { setConfig } = useAppBar()

  useEffect(() => {
    if (selectedContact) {
      setConfig({
        title: selectedContact.name ?? 'Conversa',
        showBack: true,
        onBack: () => setSelectedContact(null),
      })
    } else {
      const unread = contacts.reduce((sum, c) => sum + (c._count.unreadMessages || 0), 0)
      setConfig({
        title: 'Chat',
        subtitle: unread > 0 ? `${unread} não lidas` : undefined,
        showSearch: false,
      })
    }
    return () => setConfig(null)
  }, [selectedContact, contacts])

  // No Evolution API connections — but WABA (Official API) may be configured
  if (connections.length === 0) {
    // WABA with no conversations yet → show waiting state
    if (wabaEnabled && contacts.length === 0) {
      return <WabaWaitingState />
    }

    // No WABA and no Evolution connections → prompt to connect
    if (!wabaEnabled) {
      return (
        <div className="flex-1 flex items-center justify-center p-8">
          <EmptyState
            icon={MessageSquare}
            title="Nenhuma conexão WhatsApp"
            description="Conecte seu WhatsApp para começar a atender seus clientes em tempo real."
            action={
              <ConnectionManager
                conexoes={connections}
                limite={plano.limite}
                usadas={plano.usadas}
                podeGerenciar={podeGerenciar}
                onMudou={fetchConnections}
              />
            }
          />
        </div>
      )
    }

    // WABA with conversations — fall through to render the chat UI below
  }

  return (
    <div className="flex-1 flex flex-col" style={{ height: '100%' }}>
      {/* Top bar — hidden on mobile when a conversation is selected (app bar covers it) */}
      <div className={cn(
        'h-12 border-b bg-white dark:bg-zinc-950 flex items-center justify-between px-4 flex-shrink-0',
        selectedContact && 'hidden lg:flex'
      )}>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveView('chat')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              activeView === 'chat'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}
          >
            <MessageCircle className="h-4 w-4" />
            Conversas
            {totalUnread > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-primary-foreground bg-primary rounded-full tabular-nums">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </button>

          {(podeGerenciar || connections.length > 0 || !wabaEnabled) && (
            <button
              onClick={() => setActiveView('connections')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                activeView === 'connections'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800'
              )}
            >
              <Settings2 className="h-4 w-4" />
              Conexões
              <span className={cn(
                'flex items-center gap-1 text-xs',
                activeConnections.length > 0 ? 'text-emerald-600' : 'text-zinc-400'
              )}>
                {activeConnections.length > 0 ? (
                  <Wifi className="h-3 w-3" />
                ) : (
                  <WifiOff className="h-3 w-3" />
                )}
                {activeConnections.length}/{connections.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* A banner per connection out of the air (US3, T069); the connections poll every 10 s keeps it current */}
      {foraDoAr.length > 0 && activeView === 'chat' && (
        <ul className="border-b border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30">
          {foraDoAr.map(c => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-2">
              <WifiOff className="h-4 w-4 flex-shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
              <p className="flex-1 text-sm text-amber-900 dark:text-amber-200">
                WhatsApp ({nomeDoIntegrador(c)}) {nomeDaConexao(c)}: {ROTULO_ESTADO[c.status].toLowerCase()}
                {desde(c.statusMudouEm) ? ` ${desde(c.statusMudouEm)}` : ''}
                {c.statusMotivo ? ` · ${c.statusMotivo}` : ''}. Mensagens desse número não chegam até reconectar.
              </p>
              {podeGerenciar && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 flex-shrink-0 border-amber-300 text-xs text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-900/40"
                  onClick={() => setActiveView('connections')}
                >
                  Reconectar
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Content */}
      {activeView === 'connections' ? (
        <div className="flex-1 overflow-auto p-4">
          <ConnectionManager
            conexoes={connections}
            limite={plano.limite}
            usadas={plano.usadas}
            podeGerenciar={podeGerenciar}
            onMudou={fetchConnections}
          />
        </div>
      ) : (
        <>
          {activeConnections.length === 0 && !wabaEnabled && contacts.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <EmptyState
                icon={WifiOff}
                title="Nenhuma conexão ativa"
                description="Conecte pelo menos um WhatsApp para começar a conversar."
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveView('connections')}
                  >
                    <Settings2 className="mr-2 h-4 w-4" />
                    Gerenciar Conexões
                  </Button>
                }
              />
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex-1 flex overflow-hidden chat-layout">
              {/* Left panel: skeleton or empty state */}
              <div className="w-full lg:w-[340px] flex-shrink-0 border-r flex flex-col">
                <EmptyConversationsPanel
                  isSyncing={isSyncing}
                  isRefreshing={isRefreshing}
                  onRefresh={() => fetchConversations(true)}
                />
              </div>

              {/* Right panel: empty */}
              <ChatBrandPlaceholder />
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden chat-layout">
              <div className={cn(
                'w-full lg:w-[340px] flex-shrink-0 border-r',
                selectedContact ? 'hidden lg:block' : 'block'
              )}>
                <ConversationList
                  contacts={contacts}
                  selectedContact={selectedContact}
                  onSelectContact={setSelectedContact}
                  currentUserId={userId}
                  onConversationUpdate={() => fetchConversations()}
                />
              </div>

              <div className={cn(
                'flex-1 min-w-0',
                !selectedContact ? 'hidden lg:flex' : 'flex'
              )}>
                {selectedContact ? (
                  <MessageArea
                    contact={selectedContact}
                    connections={connections}
                    organizationId={organizationId}
                    userId={userId}
                    userName={userName}
                    onContactUpdate={() => fetchConversations()}
                    onBack={() => setSelectedContact(null)}
                    wabaEnabled={wabaEnabled}
                  />
                ) : (
                  <ChatBrandPlaceholder withHint />
                )}
              </div>
            </div>
          )}
        </>
      )}

      <KeyboardShortcutsModal open={showShortcuts} onOpenChange={setShowShortcuts} />
    </div>
  )
}
