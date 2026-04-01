'use client'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  Search,
  Users,
  CheckCheck,
  Check,
  Image,
  Mic,
  Video,
  FileText,
  MapPin,
  Sticker,
  Pin,
  Archive,
} from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { UnreadBadge } from './unread-badge'
import { ConversationFilters } from './conversation-filters'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Tag {
  id: string
  name: string
  color: string
}

interface User {
  id: string
  name: string | null
  email: string
}

interface ChatConversation {
  id: string
  assignedUserId: string | null
  assignedUser: User | null
  status: string
  priority: string
  isPinned?: boolean
  isArchived?: boolean
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
  tags?: Tag[]
  chatConversation?: ChatConversation | null
  _count: {
    whatsappMessages: number
    unreadMessages?: number
  }
}

interface ConversationListProps {
  contacts: Contact[]
  selectedContact: Contact | null
  onSelectContact: (contact: Contact) => void
  currentUserId: string
  onConversationUpdate?: () => void
}

// ── Helpers ──────────────────────────────────────────────────

function formatPhone(phone: string | null): string {
  if (!phone) return ''
  if (phone.includes('@')) return ''
  const d = phone.replace(/\D/g, '')
  if (d.startsWith('55') && d.length === 13)
    return `(${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`
  if (d.startsWith('55') && d.length === 12)
    return `(${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`
  if (d.length === 11)
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return phone
}

function displayName(c: Contact): string {
  if (c.name && !c.name.includes('@g.us') && !c.name.includes('@s.whatsapp.net'))
    return c.name
  const f = formatPhone(c.phone)
  if (f) return f
  if (c.phone)
    return c.phone.replace('@s.whatsapp.net', '').replace('@g.us', '')
  return 'Sem nome'
}

function previewText(text: string): { icon: any; label: string } | null {
  const map: [string, any, string][] = [
    ['[Imagem]', Image, 'Foto'],
    ['[Áudio]', Mic, 'Áudio'],
    ['[Vídeo]', Video, 'Vídeo'],
    ['[Documento]', FileText, 'Documento'],
    ['[Localiza', MapPin, 'Localização'],
    ['[Figurinha]', Sticker, 'Figurinha'],
  ]
  for (const [prefix, icon, label] of map) {
    if (text.startsWith(prefix)) return { icon, label }
  }
  return null
}

function cleanPreview(text: string): string {
  return text
    .replace(/^\[Imagem\]\s*/, 'Foto')
    .replace(/^\[Áudio\]\s*/, 'Áudio')
    .replace(/^\[Vídeo\]\s*/, 'Vídeo')
    .replace(/^\[Documento\]\s*/, 'Documento')
    .replace(/^\[Localiza[^\]]*\]\s*/, 'Localização')
    .replace(/^\[Figurinha\]\s*/, 'Figurinha')
    .replace(/^\[Contato\]\s*/, 'Contato')
    .replace(/^\[Enquete\]\s*/, 'Enquete')
    .replace(/^\[Visualiza[^\]]*\]\s*/, 'Visualização única')
    .replace(/^\[Mensagem[^\]]*\]\s*/, 'Mensagem')
}

const COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-pink-500', 'bg-teal-500',
  'bg-indigo-500', 'bg-orange-500', 'bg-lime-600', 'bg-fuchsia-500',
]

function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return COLORS[Math.abs(h) % COLORS.length]
}

// ── Component ───────────────────────────────────────────────

export function ConversationList({ contacts, selectedContact, onSelectContact, currentUserId, onConversationUpdate }: ConversationListProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [profilePics, setProfilePics] = useState<Record<string, string>>({})
  const fetchedRef = useRef<Set<string>>(new Set())

  // Fetch profile pictures for contacts that don't have one cached
  const fetchProfilePic = useCallback(async (contactId: string) => {
    if (fetchedRef.current.has(contactId)) return
    fetchedRef.current.add(contactId)
    try {
      const res = await fetch(`/api/whatsapp/profile-pic?contactId=${contactId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.profilePicUrl) {
          setProfilePics(prev => ({ ...prev, [contactId]: data.profilePicUrl }))
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    // Fetch profile pics for visible contacts (non-groups only)
    // Always fetch via proxy since WhatsApp CDN URLs expire
    const toFetch = contacts.filter(c =>
      !c.phone?.includes('@g.us') &&
      !fetchedRef.current.has(c.id)
    )
    // Stagger requests to avoid overwhelming the API
    toFetch.slice(0, 10).forEach((c, i) => {
      setTimeout(() => fetchProfilePic(c.id), i * 200)
    })
  }, [contacts, fetchProfilePic])

  const handlePin = async (contactId: string, isPinned: boolean, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/whatsapp/conversations/${contactId}/pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !isPinned }),
      })
      if (!res.ok) throw new Error()
      toast.success(isPinned ? 'Conversa desafixada' : 'Conversa fixada')
      onConversationUpdate?.()
    } catch {
      toast.error('Erro ao fixar conversa')
    }
  }

  const handleArchive = async (contactId: string, isArchived: boolean, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/whatsapp/conversations/${contactId}/archive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !isArchived }),
      })
      if (!res.ok) throw new Error()
      toast.success(isArchived ? 'Conversa desarquivada' : 'Conversa arquivada')
      onConversationUpdate?.()
    } catch {
      toast.error('Erro ao arquivar conversa')
    }
  }

  const filtered = contacts
    .filter(c => {
      // Filter out archived conversations by default
      if (c.chatConversation?.isArchived) return false

      // Search filter
      const q = query.toLowerCase()
      const matchesSearch = displayName(c).toLowerCase().includes(q) || (c.phone || '').includes(q)
      if (!matchesSearch) return false

      // Agent filter
      if (filter === 'all') return true
      if (filter === 'my') return c.chatConversation?.assignedUserId === currentUserId
      if (filter === 'unassigned') return !c.chatConversation?.assignedUserId
      return c.chatConversation?.assignedUserId === filter
    })
    .sort((a, b) => {
      // Sort: pinned first, then by last message time
      const aPinned = a.chatConversation?.isPinned ?? false
      const bPinned = b.chatConversation?.isPinned ?? false

      if (aPinned && !bPinned) return -1
      if (!aPinned && bPinned) return 1

      // Both pinned or both not pinned - sort by last message
      const aTime = a.whatsappMessages[0]?.sentAt ? new Date(a.whatsappMessages[0].sentAt).getTime() : 0
      const bTime = b.whatsappMessages[0]?.sentAt ? new Date(b.whatsappMessages[0].sentAt).getTime() : 0
      return bTime - aTime
    })

  const initials = (c: Contact) => {
    if (c.name && !c.name.includes('@'))
      return c.name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
    const d = (c.phone || '').replace(/\D/g, '')
    return d ? d.slice(-2) : '??'
  }

  const fmtTime = (date: Date) => {
    const now = new Date()
    const d = new Date(date)
    const days = Math.floor((now.getTime() - d.getTime()) / 86400000)
    if (days === 0) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    if (days === 1) return 'Ontem'
    if (days < 7) return d.toLocaleDateString('pt-BR', { weekday: 'short' })
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  const isGroup = (c: Contact) => c.phone?.includes('@g.us') ?? false

  return (
    <div className="w-full h-full border-r flex flex-col bg-white whatsapp-header">
      {/* Search */}
      <div className="px-3 py-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8696a0]" />
          <Input
            placeholder="Buscar ou iniciar conversa"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-9 h-[34px] bg-[#f0f2f5] whatsapp-input border-0 rounded-lg text-[13px] placeholder:text-[#8696a0] focus-visible:ring-1 focus-visible:ring-[#00a884] whatsapp-text-primary"
          />
        </div>
      </div>

      {/* Filters (Fase 3.1) */}
      <div className="px-3 pb-2">
        <ConversationFilters
          currentUserId={currentUserId}
          onFilterChange={setFilter}
        />
      </div>

      {/* List */}
      <div
        className="flex-1 overflow-y-auto custom-scrollbar"
        role="list"
        aria-label="Lista de conversas"
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-sm text-[#8696a0] gap-1">
            <Search className="h-5 w-5 opacity-40" />
            <span>Nenhuma conversa encontrada</span>
          </div>
        ) : (
          filtered.map(contact => {
            const last = contact.whatsappMessages[0]
            const selected = selectedContact?.id === contact.id
            const group = isGroup(contact)
            const name = displayName(contact)
            const color = avatarColor(name)
            const media = last ? previewText(last.text) : null
            const preview = last ? cleanPreview(last.text) : null
            const unreadCount = contact._count.unreadMessages || 0
            const hasUnread = unreadCount > 0
            const isPinned = contact.chatConversation?.isPinned ?? false
            const isArchived = contact.chatConversation?.isArchived ?? false

            return (
              <div
                key={contact.id}
                className="relative group"
              >
                <button
                  onClick={() => onSelectContact(contact)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectContact(contact)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Conversa com ${name}${hasUnread ? `, ${unreadCount} mensagens não lidas` : ''}`}
                  aria-current={selected ? 'true' : 'false'}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-[10px] transition-colors duration-150 relative',
                    'focus-visible:ring-2 focus-visible:ring-[#00a884] focus-visible:ring-inset focus-visible:outline-none',
                    hasUnread && !selected && 'bg-[#f0f2f5]/50 dark:bg-[#202C33]/50',
                    selected
                      ? 'bg-[#f0f2f5] whatsapp-bubble-incoming'
                      : 'hover:bg-[#f5f6f6] dark:hover:bg-[#202C33]/30'
                  )}
                >
                {/* Active bar */}
                {selected && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-10 bg-[#00a884] rounded-r-full" />
                )}

                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <Avatar className="h-[48px] w-[48px]">
                    {profilePics[contact.id] && (
                      <AvatarImage src={profilePics[contact.id]} alt={name} />
                    )}
                    <AvatarFallback className={cn('text-sm font-semibold text-white', color)}>
                      {group ? <Users className="h-5 w-5" /> : initials(contact)}
                    </AvatarFallback>
                  </Avatar>
                  {/* WhatsApp channel badge */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-[#25d366] border-2 border-white dark:border-zinc-950 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-[10px] h-[10px] text-white fill-current">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    </svg>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-left border-b border-[#f0f2f5] dark:border-zinc-800 pb-[10px]">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                      'text-[15px] truncate text-[#111b21] dark:text-zinc-100',
                      hasUnread ? 'font-bold' : 'font-medium',
                      selected && 'text-[#111b21]'
                    )}>
                      {name}
                    </p>
                    {last && (
                      <span className={cn(
                        'text-[11px] flex-shrink-0 tabular-nums',
                        hasUnread ? 'text-[#25d366] font-semibold' : 'text-[#667781]'
                      )}>
                        {fmtTime(last.sentAt)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <div className="flex items-center gap-1 min-w-0">
                      {last && (
                        <>
                          {last.direction === 'OUTBOUND' && (
                            <CheckCheck className="h-[16px] w-[16px] flex-shrink-0 text-[#53bdeb]" />
                          )}
                          {media && <media.icon className="h-[14px] w-[14px] flex-shrink-0 text-[#667781]" />}
                          <p className={cn(
                            'text-[13px] truncate leading-tight',
                            hasUnread ? 'text-[#111b21] font-semibold' : 'text-[#667781]'
                          )}>
                            {last.direction === 'OUTBOUND' && !media && 'Você: '}
                            {preview || 'Mensagem'}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {contact.chatConversation?.assignedUser && (
                        <div
                          className="w-5 h-5 rounded-full bg-[#00a884]/20 flex items-center justify-center"
                          title={`Atribuído a ${contact.chatConversation.assignedUser.name || contact.chatConversation.assignedUser.email}`}
                        >
                          <span className="text-[9px] font-semibold text-[#00a884]">
                            {contact.chatConversation.assignedUser.name?.charAt(0).toUpperCase() ||
                             contact.chatConversation.assignedUser.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <UnreadBadge count={unreadCount} />
                    </div>
                  </div>

                  {/* Tags */}
                  {contact.tags && contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {contact.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{
                            backgroundColor: `${tag.color}20`,
                            color: tag.color,
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                      {contact.tags.length > 3 && (
                        <span className="text-[10px] text-[#667781]">
                          +{contact.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>

              {/* Quick actions - hover only */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white dark:bg-zinc-800 rounded-md shadow-md p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-7 w-7 p-0 quick-action-btn',
                    isPinned && 'text-[#00a884]'
                  )}
                  onClick={(e) => handlePin(contact.id, isPinned, e)}
                  title={isPinned ? 'Desafixar conversa' : 'Fixar conversa'}
                >
                  <Pin className={cn('h-3.5 w-3.5', isPinned && 'fill-current')} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 quick-action-btn"
                  onClick={(e) => handleArchive(contact.id, isArchived, e)}
                  title="Arquivar conversa"
                >
                  <Archive className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            )
          })
        )}
      </div>
    </div>
  )
}
