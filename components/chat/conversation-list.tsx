'use client'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useState } from 'react'

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

interface ConversationListProps {
  contacts: Contact[]
  selectedContact: Contact | null
  onSelectContact: (contact: Contact) => void
}

export function ConversationList({
  contacts,
  selectedContact,
  onSelectContact
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredContacts = contacts.filter(contact => {
    const name = contact.name || contact.phone
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const getInitials = (name: string | null, phone: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return phone.slice(-2)
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return new Date(date).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else if (days === 1) {
      return 'Ontem'
    } else if (days < 7) {
      return `${days}d atrás`
    } else {
      return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      })
    }
  }

  return (
    <div className="w-80 border-r flex flex-col bg-white dark:bg-zinc-950">
      {/* Busca */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Lista de conversas */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            Nenhuma conversa encontrada
          </div>
        ) : (
          <div>
            {filteredContacts.map((contact) => {
              const lastInteraction = contact.interactions[0]
              const isSelected = selectedContact?.id === contact.id
              const unreadCount = 0 // TODO: Implementar contagem de não lidas

              return (
                <button
                  key={contact.id}
                  onClick={() => onSelectContact(contact)}
                  className={cn(
                    'w-full p-3 flex items-start gap-3 border-b hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors',
                    isSelected && 'bg-zinc-100 dark:bg-zinc-900'
                  )}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {getInitials(contact.name, contact.phone)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-medium text-sm truncate">
                        {contact.name || contact.phone}
                      </p>
                      {lastInteraction && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatTime(lastInteraction.occurredAt)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      {lastInteraction && (
                        <p className="text-xs text-muted-foreground truncate">
                          {lastInteraction.direction === 'OUTBOUND' && 'Você: '}
                          {lastInteraction.content || '[Mídia]'}
                        </p>
                      )}
                      {unreadCount > 0 && (
                        <Badge className="h-5 min-w-[20px] flex items-center justify-center px-1 rounded-full bg-green-500">
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
