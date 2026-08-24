'use client'

import { cn } from '@/lib/utils'
import { formatPhone } from '@/lib/format'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Archive, CheckCheck, FileText, Image, MapPin, Mic, Pin, Sticker, Users, Video,
  type LucideIcon,
} from 'lucide-react'
import { UnreadBadge } from './unread-badge'

// ── Types (shape served by /api/whatsapp/conversations) ──────

export interface ConversationTag {
  id: string
  name: string
  color: string
}

export interface ConversationUser {
  id: string
  name: string | null
  email: string
}

export interface ConversationMeta {
  id: string
  assignedUserId: string | null
  assignedUser: ConversationUser | null
  status: string
  priority: string
  isPinned?: boolean
  isArchived?: boolean
}

export interface ConversationContact {
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
  tags?: ConversationTag[]
  chatConversation?: ConversationMeta | null
  _count: {
    whatsappMessages: number
    unreadMessages?: number
  }
}

export function displayName(c: ConversationContact): string {
  if (c.name && !c.name.includes('@g.us') && !c.name.includes('@s.whatsapp.net'))
    return c.name
  const f = formatPhone(c.phone)
  if (f) return f
  if (c.phone)
    return c.phone.replace('@s.whatsapp.net', '').replace('@g.us', '')
  return 'Sem nome'
}

function previewText(text: string): { icon: LucideIcon; label: string } | null {
  const map: [string, LucideIcon, string][] = [
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

function initials(c: ConversationContact) {
  if (c.name && !c.name.includes('@'))
    return c.name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const d = (c.phone || '').replace(/\D/g, '')
  return d ? d.slice(-2) : '??'
}

function fmtTime(date: Date) {
  const now = new Date()
  const d = new Date(date)
  const days = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (days === 0) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (days === 1) return 'Ontem'
  if (days < 7) return d.toLocaleDateString('pt-BR', { weekday: 'short' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

// ── Item ─────────────────────────────────────────────────────

export interface ConversationItemProps {
  contact: ConversationContact
  selected: boolean
  profilePicUrl?: string
  onSelect: (contact: ConversationContact) => void
  onContextMenu: (contact: ConversationContact, x: number, y: number) => void
  onTogglePin: (contactId: string, isPinned: boolean) => void
  onToggleArchive: (contactId: string, isArchived: boolean) => void
}

export function ConversationItem({
  contact, selected, profilePicUrl, onSelect, onContextMenu, onTogglePin, onToggleArchive,
}: ConversationItemProps) {
  const last = contact.whatsappMessages[0]
  const group = contact.phone?.includes('@g.us') ?? false
  const name = displayName(contact)
  const color = avatarColor(name)
  const media = last ? previewText(last.text) : null
  const preview = last ? cleanPreview(last.text) : null
  const unreadCount = contact._count.unreadMessages || 0
  const hasUnread = unreadCount > 0
  const isPinned = contact.chatConversation?.isPinned ?? false
  const isArchived = contact.chatConversation?.isArchived ?? false

  return (
    <div className="relative group">
      <button
        onClick={() => onSelect(contact)}
        onContextMenu={(e) => {
          e.preventDefault()
          onContextMenu(contact, e.clientX, e.clientY)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect(contact)
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
            {profilePicUrl && (
              <AvatarImage src={profilePicUrl} alt={name} />
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
          onClick={(e) => { e.stopPropagation(); onTogglePin(contact.id, isPinned) }}
          title={isPinned ? 'Desafixar conversa' : 'Fixar conversa'}
        >
          <Pin className={cn('h-3.5 w-3.5', isPinned && 'fill-current')} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 quick-action-btn"
          onClick={(e) => { e.stopPropagation(); onToggleArchive(contact.id, isArchived) }}
          title="Arquivar conversa"
        >
          <Archive className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
