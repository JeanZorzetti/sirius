'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePusher } from '@/hooks/use-pusher'
import type { MessageNewEvent, ConnectionReadyEvent } from '@/hooks/use-pusher'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConversationList } from './conversation-list'
import { MessageArea } from './message-area'
import { toast } from 'sonner'

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

interface Connection {
  id: string
  instanceName: string
  status: string
  phoneNumber: string | null
  connectedAt: Date | null
  createdAt: Date
}

interface ChatDrawerProps {
  userId: string
  userName: string
  organizationId: string
}

export function ChatDrawer({ userId, userName, organizationId }: ChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(false)
  const [sseStatus, setSseStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected')

  const totalUnread = contacts.reduce((sum, contact) => sum + (contact._count.unreadMessages || 0), 0)
  const activeConnections = connections.filter(c => c.status === 'CONNECTED')

  const fetchData = useCallback(async () => {
    try {
      const [contactsRes, connectionsRes] = await Promise.all([
        fetch('/api/whatsapp/conversations'),
        fetch('/api/whatsapp/connections')
      ])

      if (contactsRes.ok) {
        const contactsData = await contactsRes.json()
        setContacts(contactsData)
      }

      if (connectionsRes.ok) {
        const connectionsData = await connectionsRes.json()
        setConnections(connectionsData)
      }
    } catch (error) {
      console.error('Error fetching chat data:', error)
    }
  }, [])

  // Fetch data when drawer opens
  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen, fetchData])

  // Real-time via shared Pusher hook
  const { connectionStatus } = usePusher({
    organizationId,
    enabled: isOpen,
    onMessageNew: useCallback((data: MessageNewEvent) => {
      fetchData()
      if (data.message?.direction === 'INBOUND') {
        toast.info(`Nova mensagem de ${data.contactName || 'desconhecido'}`, {
          description: data.message?.text?.substring(0, 50) + '...',
        })
      }
    }, [fetchData]),
    onMessageSent: useCallback(() => fetchData(), [fetchData]),
    onConnectionReady: useCallback(async (data: ConnectionReadyEvent) => {
      try {
        await fetch(`/api/whatsapp/connections/${data.connectionId}/sync`, { method: 'POST' })
        fetchData()
      } catch {}
    }, [fetchData]),
  })

  // Sync connection status
  useEffect(() => {
    setSseStatus(connectionStatus === 'connected' ? 'connected' : connectionStatus === 'disconnected' ? 'disconnected' : 'disconnected')
  }, [connectionStatus])

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact)
    // On mobile, expand when selecting a contact
    if (window.innerWidth < 768) {
      setIsExpanded(true)
    }
  }

  const handleBack = () => {
    setSelectedContact(null)
    setIsExpanded(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-lg z-50",
            "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700",
            "border-0 text-white transition-all duration-300 hover:scale-110",
            totalUnread > 0 && "animate-pulse"
          )}
        >
          <MessageCircle className="h-6 w-6" />
          {totalUnread > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs"
            >
              {totalUnread > 99 ? '99+' : totalUnread}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        side="right" 
        className={cn(
          "p-0 transition-all duration-300",
          isExpanded ? "w-full sm:w-[900px]" : "w-full sm:w-[500px]"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="px-4 py-3 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-600" />
                WhatsApp
                {activeConnections.length > 0 && (
                  <span className="text-xs font-normal text-muted-foreground">
                    ({activeConnections.length} conectado{activeConnections.length > 1 ? 's' : ''})
                  </span>
                )}
                {/* SSE Status Indicator */}
                <span className={cn(
                  "w-2 h-2 rounded-full ml-2",
                  sseStatus === 'connected' ? "bg-green-500" : 
                  sseStatus === 'error' ? "bg-red-500" : "bg-gray-300"
                )} title={sseStatus === 'connected' ? 'Tempo real ativo' : 'Tempo real desconectado'} />
              </SheetTitle>
              <div className="flex items-center gap-2">
                {/* Toggle expand/collapse */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hidden sm:flex"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "Reduzir" : "Expandir"}
                >
                  {isExpanded ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                {/* O botão de fechar (X) já vem do SheetContent do shadcn */}
              </div>
            </div>
          </SheetHeader>

          {/* Chat Content */}
          <div className="flex-1 flex overflow-hidden">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
              </div>
            ) : activeConnections.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Nenhuma conexão ativa</h3>
                <p className="text-sm text-muted-foreground">
                  Conecte seu WhatsApp em Configurações {'>'} Integrações
                </p>
              </div>
            ) : contacts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Nenhuma conversa</h3>
                <p className="text-sm text-muted-foreground">
                  Importe suas conversas ou aguarde novas mensagens
                </p>
              </div>
            ) : (
              <>
                {/* Conversation List - Hidden on mobile when contact selected */}
                <div className={cn(
                  "flex-shrink-0 border-r",
                  selectedContact && isExpanded ? "hidden md:block md:w-[320px]" : "w-full md:w-full"
                )}>
                  <ConversationList
                    contacts={contacts}
                    selectedContact={selectedContact}
                    onSelectContact={handleSelectContact}
                    currentUserId={userId}
                    onConversationUpdate={fetchData}
                  />
                </div>

                {/* Message Area - Shown when contact selected */}
                {selectedContact && (
                  <div className="flex-1 min-w-0">
                    <MessageArea
                      contact={selectedContact}
                      connections={activeConnections}
                      organizationId={organizationId}
                      userId={userId}
                      userName={userName}
                      onContactUpdate={fetchData}
                      onBack={handleBack}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
