'use client'

import { useState } from 'react'
import { ConnectionManager } from './connection-manager'
import { ConversationList } from './conversation-list'
import { MessageArea } from './message-area'
import { EmptyState } from '@/components/ui/empty-state'
import { MessageSquare } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
  phone: string
  whatsappPhone: string | null
  interactions: Array<{
    id: string
    content: string | null
    direction: string
    occurredAt: Date
  }>
  _count: {
    interactions: number
  }
}

interface ChatInterfaceProps {
  connections: Connection[]
  contacts: Contact[]
  userId: string
  organizationId: string
  maxInstances: number
}

export function ChatInterface({
  connections,
  contacts,
  userId,
  organizationId,
  maxInstances
}: ChatInterfaceProps) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [activeTab, setActiveTab] = useState<'chat' | 'connections'>('chat')

  // Filtrar apenas conexões conectadas
  const activeConnections = connections.filter(c => c.status === 'CONNECTED')

  // Se não tiver nenhuma conexão, mostrar gerenciador
  if (connections.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <EmptyState
          icon={MessageSquare}
          title="Nenhuma conexão WhatsApp"
          description="Conecte seu WhatsApp para começar a atender seus clientes em tempo real."
        >
          <ConnectionManager
            connections={connections}
            maxInstances={maxInstances}
          />
        </EmptyState>
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
              <EmptyState
                icon={MessageSquare}
                title="Nenhuma conversa ainda"
                description="Quando alguém enviar uma mensagem, ela aparecerá aqui."
              />
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
