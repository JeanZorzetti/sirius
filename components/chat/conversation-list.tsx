'use client'

import { Input } from '@/components/ui/input'
import {
  Search, Pin, PinOff, Eye, EyeOff, Archive as ArchiveIcon, ArchiveRestore,
  Trash2, ExternalLink,
} from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { ConversationFilters } from './conversation-filters'
import { ContextMenu, type ContextMenuItem } from './context-menu'
import { ConversationItem, displayName, type ConversationContact } from './conversation-item'
import { useConversationActions } from './use-conversation-actions'

interface ConversationListProps {
  contacts: ConversationContact[]
  selectedContact: ConversationContact | null
  onSelectContact: (contact: ConversationContact) => void
  currentUserId: string
  onConversationUpdate?: () => void
}

export function ConversationList({ contacts, selectedContact, onSelectContact, currentUserId, onConversationUpdate }: ConversationListProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [profilePics, setProfilePics] = useState<Record<string, string>>({})
  const [contextMenu, setContextMenu] = useState<{ contact: ConversationContact; x: number; y: number } | null>(null)
  const fetchedRef = useRef<Set<string>>(new Set())
  const searchInputRef = useRef<HTMLInputElement>(null)

  const { togglePin, toggleArchive, markAllAsRead, clearMessages } =
    useConversationActions(onConversationUpdate)

  // Ctrl+K / Cmd+K focuses the search field
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMod = e.ctrlKey || e.metaKey
      if (isMod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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

  const filtered = contacts
    .filter(c => {
      // Filter out archived conversations by default
      if (c.chatConversation?.isArchived) return false

      // Search filter — name, phone, or last message preview
      const q = query.trim().toLowerCase()
      if (q) {
        const lastText = (c.whatsappMessages[0]?.text || '').toLowerCase()
        const matchesSearch =
          displayName(c).toLowerCase().includes(q) ||
          (c.phone || '').toLowerCase().includes(q) ||
          lastText.includes(q)
        if (!matchesSearch) return false
      }

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

  return (
    <div className="w-full h-full border-r flex flex-col bg-white whatsapp-header">
      {/* Search */}
      <div className="px-3 py-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8696a0]" />
          <Input
            ref={searchInputRef}
            placeholder="Buscar conversa, telefone ou mensagem"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') { setQuery(''); e.currentTarget.blur() } }}
            className="pl-9 pr-12 h-[34px] bg-[#f0f2f5] whatsapp-input border-0 rounded-lg text-[13px] placeholder:text-[#8696a0] focus-visible:ring-1 focus-visible:ring-[#00a884] whatsapp-text-primary"
          />
          <kbd className="hidden sm:inline-flex absolute right-2 top-1/2 -translate-y-1/2 items-center gap-0.5 px-1.5 h-5 rounded border border-[#d1d7db] bg-white text-[10px] font-mono text-[#8696a0] pointer-events-none">
            <span className="text-[9px]">⌘</span>K
          </kbd>
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
          filtered.map(contact => (
            <ConversationItem
              key={contact.id}
              contact={contact}
              selected={selectedContact?.id === contact.id}
              profilePicUrl={profilePics[contact.id]}
              onSelect={onSelectContact}
              onContextMenu={(c, x, y) => setContextMenu({ contact: c, x, y })}
              onTogglePin={togglePin}
              onToggleArchive={toggleArchive}
            />
          ))
        )}
      </div>

      {contextMenu && (() => {
        const c = contextMenu.contact
        const isPinned = c.chatConversation?.isPinned ?? false
        const isArchived = c.chatConversation?.isArchived ?? false
        const hasUnread = (c._count.unreadMessages || 0) > 0
        const cName = displayName(c)
        const items: ContextMenuItem[] = [
          {
            id: 'open',
            label: 'Abrir conversa',
            icon: ExternalLink,
            onSelect: () => onSelectContact(c),
          },
          { id: 'sep1', label: '', onSelect: () => {}, separator: true },
          {
            id: 'pin',
            label: isPinned ? 'Desafixar' : 'Fixar no topo',
            icon: isPinned ? PinOff : Pin,
            onSelect: () => togglePin(c.id, isPinned),
          },
          {
            id: 'read',
            label: hasUnread ? 'Marcar como lido' : 'Já está lido',
            icon: hasUnread ? Eye : EyeOff,
            disabled: !hasUnread,
            onSelect: () => markAllAsRead(c.id),
          },
          {
            id: 'archive',
            label: isArchived ? 'Desarquivar' : 'Arquivar',
            icon: isArchived ? ArchiveRestore : ArchiveIcon,
            onSelect: () => toggleArchive(c.id, isArchived),
          },
          { id: 'sep2', label: '', onSelect: () => {}, separator: true },
          {
            id: 'clear',
            label: 'Limpar mensagens',
            icon: Trash2,
            variant: 'danger',
            onSelect: () => clearMessages(c.id, cName),
          },
        ]
        return (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={items}
            onClose={() => setContextMenu(null)}
          />
        )
      })()}
    </div>
  )
}
