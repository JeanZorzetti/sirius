'use client'

import { useState, useEffect, useCallback } from 'react'
import { ConnectionManager } from './connection-manager'
import { ConversationList } from './conversation-list'
import { MessageArea } from './message-area'
import { EmptyState } from '@/components/ui/empty-state'
import { MessageSquare, RefreshCw, Download, Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

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
  const [isSyncing, setIsSyncing] = useState(false)

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

  // Importar conversas existentes do WhatsApp
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
      // Sync cada conexão ativa
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
        toast.info('Nenhuma conversa nova encontrada para importar')
      }

      // Recarregar conversas
      await fetchConversations(true)
    } catch (error) {
      toast.error('Erro ao importar conversas')
      console.error('Sync error:', error)
    } finally {
      setIsSyncing(false)
    }
  }

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
        <div className="border-b px-4 flex items-center justify-between">
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

          {/* Botão de importar conversas */}
          {activeConnections.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={syncConversations}
              disabled={isSyncing}
              className="ml-4 flex-shrink-0"
            >
              {isSyncing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isSyncing ? 'Importando...' : 'Importar Conversas'}
            </Button>
          )}
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
                  description="Clique em 'Importar Conversas' para trazer seu histórico do WhatsApp, ou aguarde novas mensagens."
                />
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={syncConversations}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    {isSyncing ? 'Importando...' : 'Importar Conversas do WhatsApp'}
                  </Button>
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
