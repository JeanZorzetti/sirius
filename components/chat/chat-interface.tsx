'use client'

import { useState, useEffect, useCallback } from 'react'
import { ConnectionManager } from './connection-manager'
import { ConversationList } from './conversation-list'
import { MessageArea } from './message-area'
import { EmptyState } from '@/components/ui/empty-state'
import { MessageSquare, RefreshCw } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'

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
  whatsappMessages: Array<{
    id: string
    text: string
    direction: string
    sentAt: Date
  }>
  _count: {
    whatsappMessages: number
  }
}

interface ChatInterfaceProps {
  connections: Connection[]
  contacts: Contact[]
  userId: string
  organizationId: string
  maxInstances: number
}

const POLL_INTERVAL = 5000 // 5 seconds

export function ChatInterface({
  connections: initialConnections,
  contacts: initialContacts,
  userId,
  organizationId,
  maxInstances
}: ChatInterfaceProps) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [activeTab, setActiveTab] = useState<'chat' | 'connections'>('chat')
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [connections, setConnections] = useState<Connection[]>(initialConnections)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filtrar apenas conexões conectadas
  const activeConnections = connections.filter(c => c.status === 'CONNECTED')

  // Polling para novas conversas
  const fetchConversations = useCallback(async (showLoading = false) => {
    if (showLoading) setIsRefreshing(true)
    try {
      const res = await fetch('/api/whatsapp/conversations')
      if (res.ok) {
        const data = await res.json()
        setContacts(data)

        // Atualizar o contato selecionado se ele mudou
        if (selectedContact) {
          const updated = data.find((c: Contact) => c.id === selectedContact.id)
          if (updated) {
            setSelectedContact(updated)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [selectedContact])

  // Polling para status de conexões
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

  // Auto-polling a cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations()
      fetchConnections()
    }, POLL_INTERVAL)

    return () => clearInterval(interval)
  }, [fetchConversations, fetchConnections])

  // Se não tiver nenhuma conexão, mostrar gerenciador
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
    <div className="flex-1 flex flex-col">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="chat">
              Conversas
              {contacts.length > 0 && (
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {contacts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="connections">
              Conexões
              <span className="ml-2 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
                {activeConnections.length}/{connections.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chat" className="flex-1 flex m-0">
          {activeConnections.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <EmptyState
                icon={MessageSquare}
                title="Nenhuma conexão ativa"
                description="Conecte pelo menos um WhatsApp para começar a conversar."
              />
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-4">
                <EmptyState
                  icon={MessageSquare}
                  title="Nenhuma conversa ainda"
                  description="Quando alguém enviar uma mensagem para seu WhatsApp, ela aparecerá aqui automaticamente. Você também pode enviar a primeira mensagem."
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchConversations(true)}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden">
              {/* Lista de conversas */}
              <ConversationList
                contacts={contacts}
                selectedContact={selectedContact}
                onSelectContact={setSelectedContact}
              />

              {/* Área de mensagens */}
              {selectedContact ? (
                <MessageArea
                  contact={selectedContact}
                  connections={activeConnections}
                  organizationId={organizationId}
                  userId={userId}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-900">
                  <EmptyState
                    icon={MessageSquare}
                    title="Selecione uma conversa"
                    description="Escolha um contato da lista para ver as mensagens."
                  />
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="connections" className="flex-1 m-0 p-4">
          <ConnectionManager
            connections={connections}
            maxInstances={maxInstances}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
