'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { usePusher } from '@/hooks/use-pusher'
import type { MessageNewEvent, ConnectionReadyEvent } from '@/hooks/use-pusher'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Minimize2, Maximize2 } from 'lucide-react'
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

interface ResizableDrawerProps {
  userId: string
  userName: string
  organizationId: string
}

export function ResizableDrawer({ userId, userName, organizationId }: ResizableDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  // Loading é gerenciado pelo isPending do useTransition
  const [sseStatus, setSseStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected')
  
  // Resizable state
  const [width, setWidth] = useState(1200)
  const [isResizing, setIsResizing] = useState(false)
  const minWidth = 600
  const maxWidth = 1400

  const totalUnread = contacts.reduce((sum, contact) => sum + (contact._count.unreadMessages || 0), 0)
  const activeConnections = connections.filter(c => c.status === 'CONNECTED')

  const [isPending, startTransition] = useTransition()

  const fetchData = useCallback(async () => {
    startTransition(async () => {
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
    })
  }, [startTransition])

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
    setSseStatus(connectionStatus === 'connected' ? 'connected' : 'disconnected')
  }, [connectionStatus])

  // Resize handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return
    const newWidth = window.innerWidth - e.clientX
    setWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)))
  }, [isResizing])

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact)
  }

  const handleBack = () => {
    setSelectedContact(null)
  }

  const toggleMaximize = () => {
    setWidth(width >= 1200 ? 800 : 1200)
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
        style={{ width: `${width}px`, maxWidth: 'none' }}
        className={cn(
          "p-0 transition-none",
          isResizing && "pointer-events-none"
        )}
      >
        {/* Resize Handle */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-4 cursor-ew-resize z-50",
            "hover:bg-green-500/10 active:bg-green-500/20",
            "flex items-center justify-center group"
          )}
          onMouseDown={handleMouseDown}
        >
          {/* Visual indicator */}
          <div className={cn(
            "w-1 h-12 rounded-full bg-gray-300 group-hover:bg-green-500",
            "transition-colors duration-200"
          )} />
        </div>

        <div className="flex flex-col h-full pl-4">
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
                  onClick={toggleMaximize}
                  title={width >= 900 ? "Reduzir" : "Expandir"}
                >
                  {width >= 900 ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </SheetHeader>

          {/* Chat Content */}
          <div className="flex-1 flex overflow-hidden">
            {isPending ? (
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
                {/* Conversation List */}
                <div className={cn(
                  "flex-shrink-0 border-r",
                  selectedContact ? "hidden md:block md:w-[320px]" : "w-full"
                )}>
                  <ConversationList
                    contacts={contacts}
                    selectedContact={selectedContact}
                    onSelectContact={handleSelectContact}
                    currentUserId={userId}
                    onConversationUpdate={fetchData}
                  />
                </div>

                {/* Message Area */}
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
