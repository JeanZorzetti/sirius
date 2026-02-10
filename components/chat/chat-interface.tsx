'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { motion, AnimatePresence } from 'framer-motion'

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
}

const POLL_INTERVAL = 3000 // 3s para tempo real

// Animation variants
const tabIndicatorVariants = {
  initial: { scaleX: 0, opacity: 0 },
  animate: { 
    scaleX: 1, 
    opacity: 1,
    transition: { type: "spring", stiffness: 500, damping: 30 }
  },
  exit: { 
    scaleX: 0, 
    opacity: 0,
    transition: { duration: 0.15 }
  }
}

const contentVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: { duration: 0.2 }
  }
}

const connectionStatusVariants = {
  connected: { 
    backgroundColor: "#10b981",
    scale: [1, 1.2, 1],
    transition: { 
      scale: { duration: 2, repeat: Infinity, repeatDelay: 1 }
    }
  },
  connecting: { 
    backgroundColor: "#f59e0b",
    scale: [1, 1.1, 1],
    transition: { duration: 1, repeat: Infinity }
  },
  disconnected: { 
    backgroundColor: "#ef4444",
    scale: 1
  }
}

export function ChatInterface({
  connections: initialConnections,
  contacts: initialContacts,
  userId,
  userName,
  organizationId,
  maxInstances
}: ChatInterfaceProps) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [activeView, setActiveView] = useState<'chat' | 'connections'>('chat')
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [connections, setConnections] = useState<Connection[]>(initialConnections)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected')
  const [messageRefreshTrigger, setMessageRefreshTrigger] = useState(0)

  const activeConnections = connections.filter(c => c.status === 'CONNECTED')
  const totalUnread = contacts.reduce((sum, contact) => sum + (contact._count.unreadMessages || 0), 0)

  const fetchConversations = useCallback(async (showLoading = false) => {
    if (showLoading) setIsRefreshing(true)
    try {
      const res = await fetch('/api/whatsapp/conversations')
      if (res.ok) {
        const data = await res.json()
        setContacts(data)
        if (selectedContact) {
          const updated = data.find((c: Contact) => c.id === selectedContact.id)
          if (updated) setSelectedContact(updated)
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [selectedContact])

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/connections')
      if (res.ok) {
        const data = await res.json()
        setConnections(data)
      }
    } catch (error) {
      console.error('Error fetching connections:', error)
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
          } else {
            const errData = await res.json()
            console.error('Sync error:', errData)
          }
        } catch (err) {
          console.error('Sync request failed:', err)
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

  // SSE connection for real-time updates (Fase 3.2)
  useEffect(() => {
    let eventSource: EventSource | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null

    const connect = () => {
      setConnectionStatus('connecting')
      eventSource = new EventSource('/api/whatsapp/stream')

      eventSource.onopen = () => {
        console.log('[SSE] Connected to WhatsApp stream')
        setConnectionStatus('connected')
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          switch (data.type) {
            case 'connected':
              console.log('[SSE] Connection established')
              break

            case 'conversation.updated':
              // Refresh conversations when a message arrives
              fetchConversations()
              // Trigger message area refresh for current contact
              if (data.contactId) {
                setMessageRefreshTrigger(prev => prev + 1)
              }
              break

            case 'message.new':
              // Refresh conversations to show new message
              fetchConversations()
              // Trigger message area refresh for current contact
              setMessageRefreshTrigger(prev => prev + 1)
              break

            case 'message.status':
              // Refresh messages to update status indicators
              setMessageRefreshTrigger(prev => prev + 1)
              break

            case 'heartbeat':
              // Keep-alive, no action needed
              break

            default:
              console.log('[SSE] Unknown event type:', data.type)
          }
        } catch (error) {
          console.error('[SSE] Error parsing message:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('[SSE] Connection error:', error)
        setConnectionStatus('disconnected')
        eventSource?.close()

        // Reconnect after 5 seconds
        reconnectTimeout = setTimeout(() => {
          console.log('[SSE] Reconnecting...')
          connect()
        }, 5000)
      }
    }

    // Start connection
    connect()

    // Poll connections status separately (less frequently)
    const connectionInterval = setInterval(fetchConnections, 10000) // 10s

    return () => {
      if (eventSource) {
        eventSource.close()
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      clearInterval(connectionInterval)
    }
  }, [fetchConversations, fetchConnections])

  // Atualizar título do navegador com contagem de não-lidos
  useEffect(() => {
    const totalUnread = contacts.reduce((sum, contact) => sum + (contact._count.unreadMessages || 0), 0)

    if (totalUnread > 0) {
      document.title = `Chat Center (${totalUnread})`
    } else {
      document.title = 'Chat Center'
    }

    return () => {
      document.title = 'Chat Center'
    }
  }, [contacts])

  // No connections at all
  if (connections.length === 0) {
    return (
      <motion.div 
        className="flex-1 flex items-center justify-center p-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" as const }}
      >
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
      </motion.div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Top bar */}
      <div className="h-12 border-b bg-white dark:bg-zinc-950 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-1">
          {/* Chat tab */}
          <motion.button
            onClick={() => setActiveView('chat')}
            className={cn(
              'relative flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              activeView === 'chat'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <MessageCircle className="h-4 w-4" />
            Conversas
            {totalUnread > 0 && (
              <motion.span 
                className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-[#25d366] rounded-full tabular-nums"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
              >
                {totalUnread > 99 ? '99+' : totalUnread}
              </motion.span>
            )}
            {activeView === 'chat' && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                layoutId="activeTab"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>

          {/* Connections tab */}
          <motion.button
            onClick={() => setActiveView('connections')}
            className={cn(
              'relative flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              activeView === 'connections'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Settings2 className="h-4 w-4" />
            Conexões
            <motion.span 
              className={cn(
                'flex items-center gap-1 text-xs',
                activeConnections.length > 0 ? 'text-emerald-600' : 'text-zinc-400'
              )}
              animate={activeConnections.length > 0 ? {
                scale: [1, 1.1, 1],
              } : {}}
              transition={{ duration: 2, repeat: activeConnections.length > 0 ? Infinity : 0 }}
            >
              {activeConnections.length > 0 ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              {activeConnections.length}/{connections.length}
            </motion.span>
            {activeView === 'connections' && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                layoutId="activeTab"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* SSE Connection Status (Fase 3.2) */}
          <motion.div 
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className="h-2 w-2 rounded-full"
              variants={connectionStatusVariants}
              animate={connectionStatus}
            />
            <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
              {connectionStatus === 'connected' ? 'Conectado' :
               connectionStatus === 'connecting' ? 'Conectando...' :
               'Desconectado'}
            </span>
          </motion.div>

          {activeConnections.length > 0 && activeView === 'chat' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={syncConversations}
                disabled={isSyncing}
                className="h-8 text-xs gap-1.5"
              >
                <motion.span
                  animate={isSyncing ? { rotate: 360 } : { rotate: 0 }}
                  transition={isSyncing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
                >
                  {isSyncing ? (
                    <Loader2 className="h-3.5 w-3.5" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                </motion.span>
                {isSyncing ? 'Importando...' : 'Importar'}
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeView === 'connections' ? (
          <motion.div 
            key="connections"
            className="flex-1 overflow-auto p-4"
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <ConnectionManager
              connections={connections}
              maxInstances={maxInstances}
            />
          </motion.div>
        ) : (
          <motion.div 
            key="chat"
            className="flex-1 flex flex-col overflow-hidden"
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {activeConnections.length === 0 ? (
              <motion.div 
                className="flex-1 flex items-center justify-center p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
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
              </motion.div>
            ) : contacts.length === 0 ? (
              <motion.div 
                className="flex-1 flex items-center justify-center p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="text-center space-y-4">
                  <motion.div 
                    className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto"
                    animate={{ 
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" as const }}
                  >
                    <MessageSquare className="h-7 w-7 text-primary" />
                  </motion.div>
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
              </motion.div>
            ) : (
              <div className="flex-1 flex overflow-hidden chat-layout">
                {/* Mobile: hide conversation list when a contact is selected */}
                <motion.div 
                  className={cn(
                    'w-full md:w-[340px] lg:w-[340px] flex-shrink-0 border-r',
                    selectedContact ? 'hidden md:block' : 'block'
                  )}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <ConversationList
                    contacts={contacts}
                    selectedContact={selectedContact}
                    onSelectContact={setSelectedContact}
                    currentUserId={userId}
                    onConversationUpdate={() => fetchConversations()}
                  />
                </motion.div>

                {/* Message area (hidden on mobile when no contact selected) */}
                <motion.div 
                  className={cn(
                    'flex-1 min-w-0',
                    !selectedContact ? 'hidden md:flex' : 'flex'
                  )}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <AnimatePresence mode="wait">
                    {selectedContact ? (
                      <MessageArea
                        key={selectedContact.id}
                        contact={selectedContact}
                        connections={activeConnections}
                        organizationId={organizationId}
                        userId={userId}
                        userName={userName}
                        onContactUpdate={() => fetchConversations()}
                        onBack={() => setSelectedContact(null)}
                        refreshTrigger={messageRefreshTrigger}
                      />
                    ) : (
                      <motion.div 
                        className="flex-1 flex items-center justify-center bg-[#efeae2] dark:bg-zinc-900"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <motion.div 
                          className="text-center space-y-3 max-w-xs"
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <motion.div 
                            className="w-20 h-20 rounded-full bg-white/60 dark:bg-zinc-800/60 backdrop-blur flex items-center justify-center mx-auto"
                            animate={{ 
                              y: [0, -5, 0],
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" as const }}
                          >
                            <MessageSquare className="h-9 w-9 text-muted-foreground/50" />
                          </motion.div>
                          <div>
                            <h3 className="font-medium text-muted-foreground">Sirius Chat</h3>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              Selecione uma conversa para ver as mensagens
                            </p>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
