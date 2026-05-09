'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  X, Users, Phone, Mail, Building2, ChevronDown, ChevronUp,
  Plus, DollarSign, Calendar, StickyNote, Tag as TagIcon, ExternalLink,
  Trash2, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface Tag {
  id: string
  name: string
  color: string
}

interface Deal {
  id: string
  title: string
  value: number | null
  stage: {
    name: string
  }
  pipeline: {
    name: string
  }
  updatedAt: Date
}

interface Note {
  id: string
  content: string
  createdAt: Date
  user: {
    name: string | null
  }
}

interface ContactData {
  id: string
  name: string | null
  phone: string | null
  email?: string | null
  company?: string | null
  tags: Tag[]
  deals: Deal[]
  notes: Note[]
  _count: {
    whatsappMessages: number
  }
}

interface ContactSidebarProps {
  contact: ContactData
  onClose: () => void
  onChatCleared?: () => void
}

const COLORS = ['bg-blue-500','bg-emerald-500','bg-violet-500','bg-amber-500','bg-rose-500','bg-cyan-500','bg-pink-500','bg-teal-500']

function colorHash(n: string) {
  let h=0
  for(let i=0;i<n.length;i++) h=n.charCodeAt(i)+((h<<5)-h)
  return COLORS[Math.abs(h)%COLORS.length]
}

function formatPhone(p: string | null): string {
  if (!p || p.includes('@')) return ''
  const d = p.replace(/\D/g, '')
  if (d.startsWith('55') && d.length === 13)
    return `+55 (${d.slice(2,4)}) ${d.slice(4,9)}-${d.slice(9)}`
  if (d.startsWith('55') && d.length === 12)
    return `+55 (${d.slice(2,4)}) ${d.slice(4,8)}-${d.slice(8)}`
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  return p
}

function getName(c: ContactData): string {
  if (c.name && !c.name.includes('@g.us') && !c.name.includes('@s.whatsapp.net')) return c.name
  return formatPhone(c.phone) || c.phone?.replace(/@.+/,'') || 'Sem nome'
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

function formatCurrency(value: number | null): string {
  if (!value) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function ContactSidebar({ contact, onClose, onChatCleared }: ContactSidebarProps) {
  const tCommon = useTranslations('common')
  const t = useTranslations('components.chat')
  const [dealsOpen, setDealsOpen] = useState(true)
  const [tagsOpen, setTagsOpen] = useState(true)
  const [notesOpen, setNotesOpen] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const handleClearChat = async () => {
    if (!confirmClear) {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 4000)
      return
    }
    setClearing(true)
    try {
      const r = await fetch(`/api/whatsapp/messages/clear`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: contact.id }),
      })
      if (!r.ok) {
        const d = await r.json()
        throw new Error(d.error || 'Erro ao limpar')
      }
      const data = await r.json()
      toast.success(`${data.deleted} mensagens removidas`)
      setConfirmClear(false)
      onChatCleared?.()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao limpar histórico')
    } finally {
      setClearing(false)
    }
  }

  const name = getName(contact)
  const phone = formatPhone(contact.phone)
  const isGroup = contact.phone?.includes('@g.us') ?? false
  const clr = colorHash(name)

  const initials = () => {
    if (contact.name && !contact.name.includes('@'))
      return contact.name.split(' ').filter(Boolean).map(w=>w[0]).join('').toUpperCase().slice(0,2)
    return '??'
  }

  return (
    <div className="w-[360px] border-l border-[#e9edef] bg-white dark:bg-zinc-950 flex flex-col h-full flex-shrink-0">
      {/* Header */}
      <div className="h-[60px] px-4 border-b flex items-center justify-between bg-[#f0f2f5] dark:bg-zinc-900 flex-shrink-0">
        <h3 className="font-semibold text-[15px] text-[#111b21] dark:text-zinc-100">
          Informações de Contato
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          title="Fechar"
        >
          <X className="h-5 w-5 text-[#667781]" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Contact header */}
        <div className="px-6 py-6 text-center border-b border-[#e9edef]">
          <Avatar className="h-20 w-20 mx-auto mb-3">
            <AvatarFallback className={cn('text-xl font-semibold text-white', clr)}>
              {isGroup ? <Users className="h-8 w-8" /> : initials()}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-[17px] font-semibold text-[#111b21] dark:text-zinc-100 mb-1">
            {name}
          </h2>
          {phone && (
            <p className="text-[13px] text-[#667781] mb-2">{phone}</p>
          )}
          <p className="text-[12px] text-[#667781]">
            {contact._count.whatsappMessages} {contact._count.whatsappMessages === 1 ? 'mensagem' : 'mensagens'}
          </p>
        </div>

        {/* Contact details */}
        <div className="px-4 py-3 space-y-2 border-b border-[#e9edef]">
          {contact.email && (
            <div className="flex items-center gap-3 text-[13px]">
              <Mail className="h-4 w-4 text-[#667781] flex-shrink-0" />
              <span className="text-[#111b21] dark:text-zinc-100 truncate">{contact.email}</span>
            </div>
          )}
          {contact.company && (
            <div className="flex items-center gap-3 text-[13px]">
              <Building2 className="h-4 w-4 text-[#667781] flex-shrink-0" />
              <span className="text-[#111b21] dark:text-zinc-100 truncate">{contact.company}</span>
            </div>
          )}
          {!contact.email && !contact.company && (
            <p className="text-[12px] text-[#667781] italic">Nenhum dado adicional</p>
          )}
        </div>

        {/* Deals section */}
        <div className="border-b border-[#e9edef]">
          <button
            onClick={() => setDealsOpen(!dealsOpen)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#f0f2f5] dark:hover:bg-zinc-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-[#667781]" />
              <span className="text-[14px] font-semibold text-[#111b21] dark:text-zinc-100">
                Negócios ({contact.deals.length})
              </span>
            </div>
            {dealsOpen ? (
              <ChevronUp className="h-4 w-4 text-[#667781]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#667781]" />
            )}
          </button>
          {dealsOpen && (
            <div className="px-4 pb-3 space-y-2">
              {contact.deals.length === 0 ? (
                <p className="text-[12px] text-[#667781] italic">Nenhum negócio</p>
              ) : (
                contact.deals.map(deal => (
                  <Link
                    key={deal.id}
                    href={`/dashboard/deals/${deal.id}`}
                    className="block p-3 rounded-lg bg-[#f0f2f5] dark:bg-zinc-900 hover:bg-[#e9edef] dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-[13px] font-medium text-[#111b21] dark:text-zinc-100 leading-tight flex-1 truncate">
                        {deal.title}
                      </p>
                      <ExternalLink className="h-3 w-3 text-[#667781] flex-shrink-0 ml-2" />
                    </div>
                    <p className="text-[12px] text-[#00a884] font-semibold mb-1">
                      {formatCurrency(deal.value)}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-[#667781]">
                        {deal.stage.name}
                      </span>
                      <span className="text-[10px] text-[#667781]">
                        {formatDate(deal.updatedAt)}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        {/* Tags section */}
        <div className="border-b border-[#e9edef]">
          <button
            onClick={() => setTagsOpen(!tagsOpen)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#f0f2f5] dark:hover:bg-zinc-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <TagIcon className="h-4 w-4 text-[#667781]" />
              <span className="text-[14px] font-semibold text-[#111b21] dark:text-zinc-100">
                Tags ({contact.tags.length})
              </span>
            </div>
            {tagsOpen ? (
              <ChevronUp className="h-4 w-4 text-[#667781]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#667781]" />
            )}
          </button>
          {tagsOpen && (
            <div className="px-4 pb-3">
              {contact.tags.length === 0 ? (
                <p className="text-[12px] text-[#667781] italic">Nenhuma tag</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {contact.tags.map(tag => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notes section */}
        <div className="border-b border-[#e9edef]">
          <button
            onClick={() => setNotesOpen(!notesOpen)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#f0f2f5] dark:hover:bg-zinc-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-[#667781]" />
              <span className="text-[14px] font-semibold text-[#111b21] dark:text-zinc-100">
                Notas ({contact.notes.length})
              </span>
            </div>
            {notesOpen ? (
              <ChevronUp className="h-4 w-4 text-[#667781]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#667781]" />
            )}
          </button>
          {notesOpen && (
            <div className="px-4 pb-3 space-y-2">
              {contact.notes.length === 0 ? (
                <p className="text-[12px] text-[#667781] italic">Nenhuma nota</p>
              ) : (
                contact.notes.slice(0, 5).map(note => (
                  <div
                    key={note.id}
                    className="p-3 rounded-lg bg-[#f0f2f5] dark:bg-zinc-900"
                  >
                    <p className="text-[12px] text-[#111b21] dark:text-zinc-100 leading-relaxed mb-2">
                      {note.content}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-[#667781]">
                      <span>{note.user.name || 'Usuário'}</span>
                      <span>{formatDate(note.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="p-4 border-t border-[#e9edef] space-y-2 flex-shrink-0 bg-[#f0f2f5] dark:bg-zinc-900">
        <Link href={`/dashboard/contacts/${contact.id}`}>
          <Button variant="outline" size="sm" className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver Perfil Completo
          </Button>
        </Link>
        <Button
          variant={confirmClear ? 'destructive' : 'outline'}
          size="sm"
          className="w-full"
          onClick={handleClearChat}
          disabled={clearing}
        >
          {clearing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          {confirmClear ? `${tCommon('buttons.confirm')}? Clique novamente` : 'Limpar Histórico'}
        </Button>
      </div>
    </div>
  )
}
