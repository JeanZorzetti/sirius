'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePusher } from '@/hooks/use-pusher'
import type { MessageNewEvent, MessageSentEvent, ConnectionReadyEvent } from '@/hooks/use-pusher'
import { ConnectionManager } from './connection-manager'
import { ConversationList } from './conversation-list'
import { MessageArea } from './message-area'
import { EmptyState } from '@/components/ui/empty-state'
import {
  MessageSquare,
  RefreshCw,
  Download,
  Loader2,
  Wifi,
  WifiOff,
  Settings2,
  MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Connection {
  id: string
  instanceName: string
  status: string
  phoneNumber: string | null
  connectedAt: Date | null
  createdAt: Date
}

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
  maxInstances: number
  initialPhone?: string
}

const POLL_INTERVAL = 3000 // 3s para tempo real

export function ChatInterface({
  connections: initialConnections,
  contacts: initialContacts,
  userId,
  userName,
  organizationId,
  maxInstances,
  initialPhone,
}: ChatInterfaceProps) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [activeView, setActiveView] = useState<'chat' | 'connections'>('chat')
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [connections, setConnections] = useState<Connection[]>(initialConnections)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected')
  const [messageRefreshTrigger, setMessageRefreshTrigger] = useState(0)
  // New message pushed directly to MessageArea without full refetch
  const [pendingNewMessage, setPendingNewMessage] = useState<MessageNewEvent['message'] | null>(null)

  // Keep a ref so Pusher callbacks always see current contacts (no stale closure)
  const contactsRef = useRef(contacts)
  contactsRef.current = contacts

  const activeConnections = connections.filter(c => c.status === 'CONNECTED')
  const totalUnread = contacts.reduce((sum, contact) => sum + (contact._count.unreadMessages || 0), 0)

  // Auto-select contact when arriving from a WhatsApp button click (via ?phone=...)
  useEffect(() => {
    if (!initialPhone || contacts.length === 0) return
    const normalized = initialPhone.replace(/\D/g, '')
    const match = contacts.find(c => c.phone?.replace(/\D/g, '') === normalized)
    if (match) setSelectedContact(match)
  }, [initialPhone, contacts])

  // Ref para selectedContact — evita que fetchConversations mude de referência
  // a cada seleção, o que causaria reconexão do Pusher
  const selectedContactRef = useRef(selectedContact)
  selectedContactRef.current = selectedContact

  // Reset pending message when user switches conversations
  useEffect(() => { setPendingNewMessage(null) }, [selectedContact?.id])

  const fetchConversations = useCallback(async (showLoading = false) => {
    if (showLoading) setIsRefreshing(true)
    try {
      const res = await fetch('/api/whatsapp/conversations')
      if (res.ok) {
        const data = await res.json()
        setContacts(data)
        const current = selectedContactRef.current
        if (current) {
          const updated = data.find((c: Contact) => c.id === current.id)
          if (updated) setSelectedContact(updated)
        }
      }
    } catch (error) {
      console.error('[CHAT_INTERFACE] [ERRO] fetchConversations:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/connections')
      if (res.ok) {
        const data = await res.json()
        setConnections(data)
      }
    } catch (error) {
      console.error('[CHAT_INTERFACE] [ERRO] fetchConnections:', error)
    }
  }, [])

  const syncConversations = async () => {
    if (activeConnections.length === 0) {
      toast.error('Nenhuma conexão ativa para sincronizar')
      return
    }

    setIsSyncing(true)
    toast.info('Importando conversas do WhatsApp...')

    let totalContacts = 0
    let totalMessages = 0

    try {
      for (const conn of activeConnections) {
        try {
          const res = await fetch(`/api/whatsapp/connections/${conn.id}/sync`, {
            method: 'POST',
          })
          if (res.ok) {
            const data = await res.json()
            totalContacts += data.syncedContacts || 0
            totalMessages += data.syncedMessages || 0
          }
        } catch (err) {
          console.error('[CHAT_INTERFACE] [ERRO] sync request failed:', err)
        }
      }

      if (totalMessages > 0 || totalContacts > 0) {
        toast.success(`Importado: ${totalContacts} contatos, ${totalMessages} mensagens`)
      } else {
        toast.info('Nenhuma conversa nova encontrada')
      }

      await fetchConversations(true)
    } catch (error) {
      toast.error('Erro ao importar conversas')
    } finally {
      setIsSyncing(false)
    }
  }

  // Real-time via shared Pusher hook (singleton, ref-based callbacks)
  const { connectionStatus: pusherStatus } = usePusher({
    organizationId,
    onMessageNew: useCallback((data: MessageNewEvent) => {
      const { contactId, message } = data
      const known = contactsRef.current.some(c => c.id === contactId)

      if (known) {
        // Update local state — no API call needed
        setContacts(prev => {
          const idx = prev.findIndex(c => c.id === contactId)
          if (idx === -1) return prev
          const isSelected = selectedContactRef.current?.id === contactId
          const existing = prev[idx]
          const updated: Contact = {
            ...existing,
            whatsappMessages: [{
              id: message.id, text: message.text,
              direction: message.direction, sentAt: new Date(message.sentAt),
            }],
            _count: {
              ...existing._count,
              unreadMessages: isSelected
                ? (existing._count.unreadMessages || 0)
                : (existing._count.unreadMessages || 0) + 1,
            },
          }
          return [updated, ...prev.filter(c => c.id !== contactId)]
        })
        // Push directly into the open conversation
        if (selectedContactRef.current?.id === contactId) {
          setPendingNewMessage(message)
        }
      } else {
        // Unknown contact (new conversation) — full fetch required
        fetchConversations()
      }
    }, [fetchConversations]),
    onMessageSent: useCallback(() => {
      fetchConversations()
      setMessageRefreshTrigger(prev => prev + 1)
    }, [fetchConversations]),
    onMessageStatus: useCallback(() => {
      setMessageRefreshTrigger(prev => prev + 1)
    }, []),
    onConnectionReady: useCallback(async (data: ConnectionReadyEvent) => {
      fetchConnections()
      try {
        const res = await fetch(`/api/whatsapp/connections/${data.connectionId}/sync`, {
          method: 'POST',
        })
        if (res.ok) {
          const result = await res.json()
          if (result.syncedMessages > 0 || result.syncedContacts > 0) {
            toast.success(`Historico importado: ${result.syncedContacts} contatos, ${result.syncedMessages} mensagens`)
          }
          fetchConversations()
        }
      } catch (err) {
        console.error('[CHAT] Auto-sync failed:', err)
      }
    }, [fetchConnections, fetchConversations]),
  })

  // Sync pusher status to local state
  useEffect(() => {
    setConnectionStatus(pusherStatus)
  }, [pusherStatus])

  // Poll connections less frequently (60s safety net)
  useEffect(() => {
    const interval = setInterval(fetchConnections, 60000)
    return () => clearInterval(interval)
  }, [fetchConnections])

  // Update document title with unread count
  useEffect(() => {
    const totalUnread = contacts.reduce((sum, contact) => sum + (contact._count.unreadMessages || 0), 0)
    document.title = totalUnread > 0 ? `Chat Center (${totalUnread})` : 'Chat Center'
    return () => { document.title = 'Chat Center' }
  }, [contacts])

  // No connections at all
  if (connections.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <EmptyState
          icon={MessageSquare}
          title="Nenhuma conexão WhatsApp"
          description="Conecte seu WhatsApp para começar a atender seus clientes em tempo real."
          action={
            <ConnectionManager
              connections={connections}
              maxInstances={maxInstances}
            />
          }
        />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Top bar */}
      <div className="h-12 border-b bg-white dark:bg-zinc-950 flex items-center justify-between px-4 flex-shrink-0">
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
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-[#25d366] rounded-full tabular-nums">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </button>

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
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800">
            <div className={cn(
              'h-2 w-2 rounded-full transition-colors',
              connectionStatus === 'connected' ? 'bg-emerald-500' :
              connectionStatus === 'connecting' ? 'bg-amber-500 animate-pulse' :
              'bg-red-500'
            )} />
            <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
              {connectionStatus === 'connected' ? 'Conectado' :
               connectionStatus === 'connecting' ? 'Conectando...' :
               'Desconectado'}
            </span>
          </div>

          {activeConnections.length > 0 && activeView === 'chat' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={syncConversations}
              disabled={isSyncing}
              className="h-8 text-xs gap-1.5"
            >
              {isSyncing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {isSyncing ? 'Importando...' : 'Importar'}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {activeView === 'connections' ? (
        <div className="flex-1 overflow-auto p-4">
          <ConnectionManager
            connections={connections}
            maxInstances={maxInstances}
          />
        </div>
      ) : (
        <>
          {activeConnections.length === 0 ? (
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
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <MessageSquare className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Nenhuma conversa ainda</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Importe suas conversas existentes do WhatsApp ou aguarde novas mensagens
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    onClick={syncConversations}
                    disabled={isSyncing}
                    size="sm"
                  >
                    {isSyncing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    {isSyncing ? 'Importando...' : 'Importar Conversas'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchConversations(true)}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} />
                    Atualizar
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden chat-layout">
              <div className={cn(
                'w-full md:w-[340px] lg:w-[340px] flex-shrink-0 border-r',
                selectedContact ? 'hidden md:block' : 'block'
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
                !selectedContact ? 'hidden md:flex' : 'flex'
              )}>
                {selectedContact ? (
                  <MessageArea
                    contact={selectedContact}
                    connections={activeConnections}
                    organizationId={organizationId}
                    userId={userId}
                    userName={userName}
                    onContactUpdate={() => fetchConversations()}
                    onBack={() => setSelectedContact(null)}
                    refreshTrigger={messageRefreshTrigger}
                    newInboundMessage={pendingNewMessage}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-[#efeae2] dark:bg-zinc-900">
                    <div className="text-center space-y-3 max-w-xs">
                      <div className="w-20 h-20 rounded-full bg-white/60 dark:bg-zinc-800/60 backdrop-blur flex items-center justify-center mx-auto">
                        <MessageSquare className="h-9 w-9 text-muted-foreground/50" />
                      </div>
                      <div>
                        <h3 className="font-medium text-muted-foreground">Sirius Chat</h3>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          Selecione uma conversa para ver as mensagens
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
