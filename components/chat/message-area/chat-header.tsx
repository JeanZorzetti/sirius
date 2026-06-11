'use client'

import { ArrowLeft, Info, Search, Sparkles, Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ConversationTags } from '../conversation-tags'
import { AgentAssignment } from '../agent-assignment'
import { TypingIndicator } from '../typing-indicator'
import { AgentActionsBadge } from '../agent-actions-badge'
import type { Connection, Contact, User } from './types'

export interface ChatHeaderProps {
  contact: Contact
  name: string
  sub: string
  isGroup: boolean
  avatarColor: string
  initials: string
  profilePicUrl: string | null
  isTyping: boolean
  coPilotEnabled: boolean
  onToggleCoPilot: () => void
  users: User[]
  onContactUpdate?: () => void
  showSidebar: boolean
  onToggleSidebar: () => void
  isSearchOpen: boolean
  onToggleSearch: () => void
  connections: Connection[]
  conn: string
  onConnChange: (id: string) => void
  onBack?: () => void
}

export function ChatHeader({
  contact, name, sub, isGroup, avatarColor, initials, profilePicUrl, isTyping,
  coPilotEnabled, onToggleCoPilot, users, onContactUpdate,
  showSidebar, onToggleSidebar, isSearchOpen, onToggleSearch,
  connections, conn, onConnChange, onBack,
}: ChatHeaderProps) {
  return (
    <div className="hidden lg:flex h-[60px] px-4 border-b items-center justify-between bg-[#f0f2f5] whatsapp-header flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile back button */}
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 w-8 p-0 md:hidden"
            title="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Avatar className="h-10 w-10">
          {profilePicUrl && (
            <AvatarImage src={profilePicUrl} alt={name} />
          )}
          <AvatarFallback className={cn('text-xs font-semibold text-white', avatarColor)}>
            {isGroup ? <Users className="h-4 w-4" /> : initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-[15px] text-[#111b21] dark:text-zinc-100 leading-tight">{name}</p>
            <AgentActionsBadge contactId={contact.id} />
          </div>
          {isTyping ? (
            <TypingIndicator variant="inline" className="mt-0.5" />
          ) : (
            sub && <p className="text-[12px] text-[#667781] leading-tight mt-0.5">{sub}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Co-pilot toggle */}
        <button
          onClick={onToggleCoPilot}
          title={coPilotEnabled ? 'Co-pilot IA ativado — clique para desativar' : 'Ativar Co-pilot IA (auto-rascunho em novas mensagens)'}
          className={cn(
            'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-semibold transition-all',
            coPilotEnabled
              ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm'
              : 'border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          )}
        >
          <Sparkles className="h-3 w-3" />
          Co-pilot {coPilotEnabled ? 'ON' : 'OFF'}
        </button>
        {/* Agent Assignment (Fase 3.1) */}
        {users.length > 0 && (
          <AgentAssignment
            contactId={contact.id}
            assignedUserId={contact.chatConversation?.assignedUserId || null}
            users={users}
            onAssignmentChange={onContactUpdate}
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          aria-label="Informações do contato"
          aria-pressed={showSidebar}
          className={cn(
            'h-8 w-8 p-0',
            showSidebar && 'bg-[#00a884]/10 text-[#00a884]'
          )}
          title="Informações do contato"
        >
          <Info className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSearch}
          aria-label="Buscar na conversa"
          aria-pressed={isSearchOpen}
          className="h-8 w-8 p-0"
          title="Buscar na conversa"
        >
          <Search className="h-4 w-4" />
        </Button>
        <ConversationTags
          contactId={contact.id}
          contactTags={contact.tags || []}
          onTagsUpdate={onContactUpdate}
        />
        {connections.length > 1 && (
          <Select value={conn} onValueChange={onConnChange}>
            <SelectTrigger className="w-auto max-w-[180px] h-8 text-xs border-[#e9edef]">
              <SelectValue placeholder="Conexão" />
            </SelectTrigger>
            <SelectContent>
              {connections.map(c => (
                <SelectItem key={c.id} value={c.id} className="text-xs">
                  {c.displayName || c.phoneNumber || c.instanceName.split('-').pop()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}

export interface MobileActionBarProps {
  contact: Contact
  name: string
  sub: string
  isGroup: boolean
  avatarColor: string
  initials: string
  profilePicUrl: string | null
  users: User[]
  onContactUpdate?: () => void
  showSidebar: boolean
  onToggleSidebar: () => void
  onToggleSearch: () => void
}

export function MobileActionBar({
  contact, name, sub, isGroup, avatarColor, initials, profilePicUrl,
  users, onContactUpdate, showSidebar, onToggleSidebar, onToggleSearch,
}: MobileActionBarProps) {
  return (
    <div className="lg:hidden flex items-center gap-1 px-3 py-1.5 border-b bg-[#f0f2f5] dark:bg-zinc-900 flex-shrink-0">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0 flex-1">
        <Avatar className="h-6 w-6 shrink-0">
          {profilePicUrl && <AvatarImage src={profilePicUrl} alt={name} />}
          <AvatarFallback className={cn('text-[9px] font-semibold text-white', avatarColor)}>
            {isGroup ? <Users className="h-3 w-3" /> : initials}
          </AvatarFallback>
        </Avatar>
        {sub && <span className="truncate">{sub}</span>}
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        {users.length > 0 && (
          <AgentAssignment
            contactId={contact.id}
            assignedUserId={contact.chatConversation?.assignedUserId || null}
            users={users}
            onAssignmentChange={onContactUpdate}
          />
        )}
        <Button variant="ghost" size="sm" onClick={onToggleSearch}
          className="h-8 w-8 p-0" aria-label="Buscar">
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onToggleSidebar}
          className={cn('h-8 w-8 p-0', showSidebar && 'bg-[#00a884]/10 text-[#00a884]')}
          aria-label="Informações do contato">
          <Info className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
