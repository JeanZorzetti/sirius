'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ConnectionManager } from './connection-manager'
import { ConversationList } from './conversation-list'
import { MessageArea } from './message-area'
import { EmptyState } from '@/components/ui/empty-state'
import {
  MessageSquare,
  RefreshCw,
  Wifi,
  WifiOff,
  Settings2,
  MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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

  const activeConnections = connections.filter(c => c.status === 'CONNECTED')
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
        const current = selectedContactRef.current
        if (current) {
          const updated = data.find((c: Contact) => c.id === current.id)
          if (updated) setSelectedContact(updated)
        }
      }
    } catch (error) {
      console.error('[CHAT] fetchConversations error:', error)
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
      console.error('[CHAT] fetchConnections error:', error)
    }
  }, [])

  // Auto-sync: ao montar, dispara sync da conexão ativa (background)
  const hasSyncedRef = useRef(false)
  useEffect(() => {
    if (hasSyncedRef.current) return
    const active = connections.find(c => c.status === 'CONNECTED')
    if (!active) return
    hasSyncedRef.current = true
    fetch(`/api/whatsapp/connections/${active.id}/sync`, { method: 'POST' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.syncedMessages > 0 || data?.syncedContacts > 0) {
          fetchConversations()
        }
      })
      .catch(() => {})
  }, [connections, fetchConversations])

  // Polling: conversas a cada 5s, conexões a cada 30s
  useEffect(() => {
    const convInterval = setInterval(() => fetchConversations(), 5000)
    const connInterval = setInterval(fetchConnections, 30000)
    return () => { clearInterval(convInterval); clearInterval(connInterval) }
  }, [fetchConversations, fetchConnections])

  // Update document title with unread count
  useEffect(() => {
    const unread = contacts.reduce((sum, contact) => sum + (contact._count.unreadMessages || 0), 0)
    document.title = unread > 0 ? `Chat Center (${unread})` : 'Chat Center'
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
                    Suas conversas aparecem automaticamente ao receber ou enviar mensagens
                  </p>
                </div>
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
