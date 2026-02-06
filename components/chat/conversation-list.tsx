'use client'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Users, Check, CheckCheck, Image, Mic, Video, FileText, MapPin, Sticker } from 'lucide-react'
import { useState } from 'react'

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

interface ConversationListProps {
  contacts: Contact[]
  selectedContact: Contact | null
  onSelectContact: (contact: Contact) => void
}

function formatPhoneDisplay(phone: string | null): string {
  if (!phone) return ''
  // Se for grupo, não formatar
  if (phone.includes('@g.us') || phone.includes('@')) return ''
  // Limpar
  const cleaned = phone.replace(/\D/g, '')
  // Formato brasileiro: +55 (62) 93265-1713
  if (cleaned.startsWith('55') && cleaned.length === 13) {
    return `(${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`
  }
  if (cleaned.startsWith('55') && cleaned.length === 12) {
    return `(${cleaned.slice(2, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`
  }
  // Sem código do país
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

function getDisplayName(contact: Contact): string {
  if (contact.name && !contact.name.includes('@g.us') && !contact.name.includes('@s.whatsapp.net')) {
    return contact.name
  }
  const formatted = formatPhoneDisplay(contact.phone)
  if (formatted) return formatted
  // Último recurso: limpar o identificador
  if (contact.phone) {
    return contact.phone
      .replace('@s.whatsapp.net', '')
      .replace('@g.us', '')
      .replace(/(\d{12,})/, (m) => formatPhoneDisplay(m) || m)
  }
  return 'Sem nome'
}

function getMessagePreviewIcon(text: string) {
  if (text.startsWith('[Imagem]')) return <Image className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
  if (text.startsWith('[Audio]') || text === '[Audio]') return <Mic className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
  if (text.startsWith('[Video]') || text === '[Video]') return <Video className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
  if (text.startsWith('[Documento]')) return <FileText className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
  if (text.startsWith('[Localiza')) return <MapPin className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
  if (text.startsWith('[Figurinha]')) return <Sticker className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
  return null
}

function getCleanPreview(text: string): string {
  // Remove prefixos de tipo de mídia para preview mais limpo
  return text
    .replace(/^\[Imagem\]\s*/, 'Foto')
    .replace(/^\[Audio\]\s*/, 'Mensagem de voz')
    .replace(/^\[Video\]\s*/, 'Vídeo')
    .replace(/^\[Documento\]\s*/, 'Documento')
    .replace(/^\[Localiza[^\]]*\]\s*/, 'Localização')
    .replace(/^\[Figurinha\]\s*/, 'Figurinha')
    .replace(/^\[Contato\]\s*/, 'Contato')
    .replace(/^\[Enquete\]\s*/, 'Enquete')
    .replace(/^\[Visualiza[^\]]*\]\s*/, 'Visualização única')
    .replace(/^\[Mensagem\]\s*/, 'Mensagem')
    .replace(/^\[Mensagem recebida\]\s*/, 'Mensagem')
}

// Cores de avatar baseadas no nome (consistentes)
const avatarColors = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-pink-500', 'bg-teal-500',
  'bg-indigo-500', 'bg-orange-500', 'bg-lime-600', 'bg-fuchsia-500',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

export function ConversationList({
  contacts,
  selectedContact,
  onSelectContact
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredContacts = contacts.filter(contact => {
    const displayName = getDisplayName(contact)
    const phone = contact.phone || ''
    const query = searchQuery.toLowerCase()
    return displayName.toLowerCase().includes(query) || phone.includes(query)
  })

  const getInitials = (contact: Contact) => {
    const name = contact.name
    if (name && !name.includes('@')) {
      return name
        .split(' ')
        .filter(n => n.length > 0)
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    const phone = contact.phone || ''
    const cleaned = phone.replace(/\D/g, '')
    return cleaned ? cleaned.slice(-2) : '??'
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const msgDate = new Date(date)
    const diff = now.getTime() - msgDate.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return msgDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else if (days === 1) {
      return 'Ontem'
    } else if (days < 7) {
      return msgDate.toLocaleDateString('pt-BR', { weekday: 'short' })
    } else {
      return msgDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      })
    }
  }

  const isGroup = (contact: Contact) => contact.phone?.includes('@g.us') ?? false

  return (
    <div className="w-80 border-r flex flex-col bg-white dark:bg-zinc-950">
      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-zinc-100 dark:bg-zinc-900 border-0 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-sm text-muted-foreground gap-1">
            <Search className="h-5 w-5 opacity-40" />
            <span>Nenhuma conversa encontrada</span>
          </div>
        ) : (
          <div>
            {filteredContacts.map((contact) => {
              const lastMessage = contact.whatsappMessages[0]
              const isSelected = selectedContact?.id === contact.id
              const group = isGroup(contact)
              const displayName = getDisplayName(contact)
              const avatarColor = getAvatarColor(displayName)
              const previewIcon = lastMessage ? getMessagePreviewIcon(lastMessage.text) : null
              const previewText = lastMessage ? getCleanPreview(lastMessage.text) : null

              return (
                <button
                  key={contact.id}
                  onClick={() => onSelectContact(contact)}
                  className={cn(
                    'w-full px-3 py-3 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors relative',
                    isSelected && 'bg-zinc-100 dark:bg-zinc-800/70'
                  )}
                >
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-primary rounded-r-full" />
                  )}

                  {/* Avatar */}
                  <Avatar className="h-11 w-11 flex-shrink-0">
                    <AvatarFallback className={cn('text-xs font-semibold text-white', avatarColor)}>
                      {group ? <Users className="h-5 w-5" /> : getInitials(contact)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn(
                        'font-medium text-[13px] truncate',
                        isSelected && 'text-primary'
                      )}>
                        {displayName}
                      </p>
                      {lastMessage && (
                        <span className="text-[11px] text-muted-foreground flex-shrink-0 tabular-nums">
                          {formatTime(lastMessage.sentAt)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 mt-0.5">
                      {lastMessage && (
                        <>
                          {lastMessage.direction === 'OUTBOUND' && (
                            <CheckCheck className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
                          )}
                          {previewIcon}
                          <p className="text-xs text-muted-foreground truncate leading-tight">
                            {lastMessage.direction === 'OUTBOUND' && !previewIcon && 'Você: '}
                            {previewText || '[Mensagem]'}
                          </p>
                        </>
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
