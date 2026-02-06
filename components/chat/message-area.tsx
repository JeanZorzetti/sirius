'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Send, Users, Loader2, Check, CheckCheck, Mic,
  Image as ImageIcon, Video, FileText, Download, Play, Pause,
  File, Search, Reply, X, Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ConversationTags } from './conversation-tags'
import { MessageSearch } from './message-search'
import { QuickReplyPicker } from './quick-reply-picker'
import { QuotedMessage } from './quoted-message'
import { ContactSidebar } from './contact-sidebar'
import { AgentAssignment } from './agent-assignment'
import { TypingIndicator } from './typing-indicator'

interface Tag { id: string; name: string; color: string }
interface Deal {
  id: string
  title: string
  value: number | null
  stage: { name: string }
  pipeline: { name: string }
  updatedAt: Date
}
interface Note {
  id: string
  content: string
  createdAt: Date
  user: { name: string | null }
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
}
interface Contact {
  id: string
  name: string | null
  phone: string | null
  email?: string | null
  company?: string | null
  tags?: Tag[]
  deals?: Deal[]
  notes?: Note[]
  chatConversation?: ChatConversation | null
  _count?: { whatsappMessages: number }
}
interface Connection { id: string; instanceName: string; phoneNumber: string | null }
interface WhatsAppMessage {
  id: string; text: string; direction: string; sentAt: Date
  deliveredAt: Date | null; readAt: Date | null; status: string
  mediaUrl: string | null; mediaType: string | null; messageId?: string
  replyToId?: string | null; replyToText?: string | null
}
interface MessageAreaProps {
  contact: Contact; connections: Connection[]
  organizationId: string; userId: string; userName: string
  onContactUpdate?: () => void
}

const POLL = 2000 // 2s para tempo real

// ── Helpers ──────────────────────────────────────────────────

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

function getName(c: Contact): string {
  if (c.name && !c.name.includes('@g.us') && !c.name.includes('@s.whatsapp.net')) return c.name
  return formatPhone(c.phone) || c.phone?.replace(/@.+/,'') || 'Sem nome'
}

function getSub(c: Contact): string {
  if (c.phone?.includes('@g.us')) return 'Grupo'
  return formatPhone(c.phone) || ''
}

const COLORS = ['bg-blue-500','bg-emerald-500','bg-violet-500','bg-amber-500','bg-rose-500','bg-cyan-500','bg-pink-500','bg-teal-500']
function colorHash(n: string) { let h=0; for(let i=0;i<n.length;i++) h=n.charCodeAt(i)+((h<<5)-h); return COLORS[Math.abs(h)%COLORS.length] }

function fmtDate(d: Date): string {
  const now = new Date(), msg = new Date(d)
  const days = Math.floor((now.getTime()-msg.getTime())/86400000)
  if (days===0) return 'Hoje'
  if (days===1) return 'Ontem'
  return msg.toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})
}

function needsDateSep(cur: WhatsAppMessage, prev: WhatsAppMessage|null): boolean {
  if (!prev) return true
  return new Date(cur.sentAt).toDateString() !== new Date(prev.sentAt).toDateString()
}

// Grouped bubble border-radius (Messenger/iMessage pattern)
type BubblePos = 'single' | 'first' | 'middle' | 'last'
function getBubblePos(msgs: WhatsAppMessage[], i: number): BubblePos {
  const cur = msgs[i]
  const prev = i > 0 ? msgs[i-1] : null
  const next = i < msgs.length-1 ? msgs[i+1] : null
  const sameAsPrev = prev && prev.direction === cur.direction &&
    new Date(cur.sentAt).getTime() - new Date(prev.sentAt).getTime() < 60000
  const sameAsNext = next && next.direction === cur.direction &&
    new Date(next.sentAt).getTime() - new Date(cur.sentAt).getTime() < 60000
  if (sameAsPrev && sameAsNext) return 'middle'
  if (sameAsPrev) return 'last'
  if (sameAsNext) return 'first'
  return 'single'
}

function bubbleRadius(pos: BubblePos, outbound: boolean): string {
  if (outbound) {
    switch(pos) {
      case 'single': return 'rounded-[18px]'
      case 'first':  return 'rounded-tl-[18px] rounded-tr-[18px] rounded-br-[4px] rounded-bl-[18px]'
      case 'middle': return 'rounded-tl-[18px] rounded-tr-[4px] rounded-br-[4px] rounded-bl-[18px]'
      case 'last':   return 'rounded-tl-[18px] rounded-tr-[4px] rounded-br-[18px] rounded-bl-[18px]'
    }
  } else {
    switch(pos) {
      case 'single': return 'rounded-[18px]'
      case 'first':  return 'rounded-tl-[18px] rounded-tr-[18px] rounded-br-[18px] rounded-bl-[4px]'
      case 'middle': return 'rounded-tl-[4px] rounded-tr-[18px] rounded-br-[18px] rounded-bl-[4px]'
      case 'last':   return 'rounded-tl-[4px] rounded-tr-[18px] rounded-br-[18px] rounded-bl-[18px]'
    }
  }
}

// ── Media detection from text ──────────────────────────────

function getMediaTypeFromText(text: string): string | null {
  if (text.startsWith('[Imagem]')) return 'image'
  if (text.startsWith('[Vídeo]')) return 'video'
  if (text.startsWith('[Documento]')) return 'document'
  if (text.startsWith('[Áudio]')) return 'audio'
  if (text.startsWith('[Figurinha]')) return 'sticker'
  return null
}

function getMediaCaption(text: string): string {
  return text
    .replace(/^\[Imagem\]\s*/, '')
    .replace(/^\[Vídeo\]\s*/, '')
    .replace(/^\[Documento\]\s*/, '')
    .replace(/^\[Áudio\]\s*/, '')
    .replace(/^\[Figurinha\]\s*/, '')
    .replace(/^\[Localiza[^\]]*\]\s*/, '')
    .replace(/^\[Contato\]\s*/, '')
    .replace(/^\[Enquete\]\s*/, '')
    .replace(/^\[Visualiza[^\]]*\]\s*/, '')
    .replace(/^\[Mensagem[^\]]*\]\s*/, '')
    .trim()
}

// ── Media Component ─────────────────────────────────────────

function MediaBubble({ msg, outbound }: { msg: WhatsAppMessage; outbound: boolean }) {
  const [mediaData, setMediaData] = useState<string | null>(msg.mediaUrl || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const mType = msg.mediaType || getMediaTypeFromText(msg.text)
  const caption = getMediaCaption(msg.text)

  const fetchMedia = useCallback(async () => {
    if (mediaData?.startsWith('data:') || loading) return // already loaded base64
    if (!msg.messageId) return
    setLoading(true)
    try {
      const r = await fetch(`/api/whatsapp/media?messageId=${msg.messageId}`)
      if (r.ok) {
        const data = await r.json()
        if (data.base64) {
          setMediaData(data.base64)
        }
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [msg.messageId, mediaData, loading])

  // Image
  if (mType === 'image' || mType === 'sticker') {
    return (
      <div className="space-y-1">
        {mediaData?.startsWith('data:') ? (
          <img
            src={mediaData}
            alt="Imagem"
            className="rounded-lg max-w-[280px] max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => {
              const w = window.open('')
              if (w) { w.document.write(`<img src="${mediaData}" style="max-width:100%;max-height:100vh;object-fit:contain;margin:auto;display:block;background:#000;" />`); w.document.title = 'Imagem' }
            }}
          />
        ) : (
          <button
            onClick={fetchMedia}
            disabled={loading}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-6 w-[200px] justify-center transition-colors',
              outbound ? 'bg-[#c4edc0] hover:bg-[#b8e6b4]' : 'bg-gray-100 hover:bg-gray-200'
            )}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-[#667781]" />
            ) : error ? (
              <span className="text-xs text-[#667781]">Imagem não disponível</span>
            ) : (
              <>
                <ImageIcon className="h-5 w-5 text-[#667781]" />
                <span className="text-xs text-[#667781]">Carregar imagem</span>
              </>
            )}
          </button>
        )}
        {caption && (
          <p className="text-[14.2px] leading-[1.46] text-[#111b21] dark:text-zinc-100">{caption}</p>
        )}
      </div>
    )
  }

  // Video
  if (mType === 'video') {
    return (
      <div className="space-y-1">
        {mediaData?.startsWith('data:') ? (
          <video
            src={mediaData}
            controls
            className="rounded-lg max-w-[280px] max-h-[300px]"
          />
        ) : (
          <button
            onClick={fetchMedia}
            disabled={loading}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-6 w-[200px] justify-center transition-colors',
              outbound ? 'bg-[#c4edc0] hover:bg-[#b8e6b4]' : 'bg-gray-100 hover:bg-gray-200'
            )}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-[#667781]" />
            ) : (
              <>
                <Video className="h-5 w-5 text-[#667781]" />
                <span className="text-xs text-[#667781]">Carregar vídeo</span>
              </>
            )}
          </button>
        )}
        {caption && (
          <p className="text-[14.2px] leading-[1.46] text-[#111b21] dark:text-zinc-100">{caption}</p>
        )}
      </div>
    )
  }

  // Audio
  if (mType === 'audio') {
    return (
      <div className="space-y-1">
        {mediaData?.startsWith('data:') ? (
          <audio src={mediaData} controls className="max-w-[260px] h-[36px]" />
        ) : (
          <button
            onClick={fetchMedia}
            disabled={loading}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-3 min-w-[180px] justify-center transition-colors',
              outbound ? 'bg-[#c4edc0] hover:bg-[#b8e6b4]' : 'bg-gray-100 hover:bg-gray-200'
            )}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#667781]" />
            ) : (
              <>
                <Play className="h-4 w-4 text-[#00a884] fill-[#00a884]" />
                <div className="flex-1 h-[4px] bg-[#8696a0]/30 rounded-full mx-1 min-w-[80px]">
                  <div className="h-full w-0 bg-[#00a884] rounded-full" />
                </div>
                <span className="text-[10px] text-[#667781]">0:00</span>
              </>
            )}
          </button>
        )}
      </div>
    )
  }

  // Document
  if (mType === 'document') {
    const fileName = caption || 'Documento'
    return (
      <div className="space-y-1">
        <div className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 min-w-[200px] max-w-[280px]',
          outbound ? 'bg-[#c4edc0]' : 'bg-gray-100'
        )}>
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#00a884]/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-[#00a884]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-[#111b21] dark:text-zinc-100 font-medium truncate leading-tight">
              {fileName}
            </p>
            <p className="text-[11px] text-[#667781] mt-0.5">Documento</p>
          </div>
          {mediaData?.startsWith('data:') ? (
            <a
              href={mediaData}
              download={fileName}
              className="flex-shrink-0 p-1.5 rounded-full hover:bg-black/5 transition-colors"
            >
              <Download className="h-4 w-4 text-[#667781]" />
            </a>
          ) : (
            <button
              onClick={fetchMedia}
              disabled={loading}
              className="flex-shrink-0 p-1.5 rounded-full hover:bg-black/5 transition-colors"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#667781]" />
              ) : (
                <Download className="h-4 w-4 text-[#667781]" />
              )}
            </button>
          )}
        </div>
      </div>
    )
  }

  return null
}

// ── Component ───────────────────────────────────────────────

export function MessageArea({ contact, connections, organizationId, userId, userName, onContactUpdate }: MessageAreaProps) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [text, setText] = useState('')
  const [conn, setConn] = useState(connections[0]?.id||'')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
  const [showQuickReply, setShowQuickReply] = useState(false)
  const [quickReplyQuery, setQuickReplyQuery] = useState('')
  const [replyingTo, setReplyingTo] = useState<WhatsAppMessage | null>(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [contactData, setContactData] = useState<Contact | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevMsgCount = useRef(0)
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    endRef.current?.scrollIntoView({ behavior })
  }, [])

  const scrollToMessage = useCallback((messageId: string) => {
    const element = messageRefs.current.get(messageId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightedMessageId(messageId)
      // Remover highlight após 2s
      setTimeout(() => setHighlightedMessageId(null), 2000)
    }
  }, [])

  const fetchMsgs = useCallback(async (show=false) => {
    if (show) setLoading(true)
    try {
      const r = await fetch(`/api/contact/${contact.id}/interactions?type=WHATSAPP`)
      if (!r.ok) throw new Error()
      const d: WhatsAppMessage[] = await r.json()
      setMessages(prev => {
        // Só fazer scroll se há mensagens novas
        if (d.length > prev.length) {
          setTimeout(() => scrollToBottom(), 100)
        }
        return d
      })
    } catch { if (show) toast.error('Erro ao carregar mensagens') }
    finally { setLoading(false) }
  }, [contact.id, scrollToBottom])

  const fetchContactData = useCallback(async () => {
    try {
      const r = await fetch(`/api/contact/${contact.id}`)
      if (r.ok) {
        const data = await r.json()
        setContactData(data)
      }
    } catch (error) {
      console.error('Error fetching contact data:', error)
    }
  }, [contact.id])

  const toggleSidebar = () => {
    if (!showSidebar && !contactData) {
      fetchContactData()
    }
    setShowSidebar(!showSidebar)
  }

  useEffect(() => { fetchMsgs(true) }, [contact.id, fetchMsgs])

  // SSE subscription for real-time message updates (Fase 3.2)
  // Note: SSE is handled at chat-interface level, this component will refresh via onContactUpdate
  // But we keep a short polling as fallback
  useEffect(() => {
    const i = setInterval(() => fetchMsgs(), 30000) // 30s fallback polling (much less frequent)
    return () => clearInterval(i)
  }, [fetchMsgs])

  // Buscar usuários da organização
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/whatsapp/users')
        if (res.ok) {
          const data = await res.json()
          setUsers(data)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      }
    }
    fetchUsers()
  }, [])

  // Marcar mensagens como lidas quando a conversa é aberta
  useEffect(() => {
    const markAsRead = async () => {
      try {
        await fetch('/api/whatsapp/messages/mark-read', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactId: contact.id }),
        })
      } catch (error) {
        console.error('Error marking messages as read:', error)
      }
    }
    markAsRead()
  }, [contact.id])

  // Auto-resize textarea
  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = 'auto'
      taRef.current.style.height = Math.min(taRef.current.scrollHeight, 120) + 'px'
    }
  }, [text])

  // Quick Reply detection: "/" triggers autocomplete
  useEffect(() => {
    const lastChar = text[text.length - 1]
    const words = text.split(/\s/)
    const lastWord = words[words.length - 1]

    if (lastWord.startsWith('/') && lastWord.length > 1) {
      setShowQuickReply(true)
      setQuickReplyQuery(lastWord.slice(1)) // Remove "/" prefix
    } else if (lastWord === '/') {
      setShowQuickReply(true)
      setQuickReplyQuery('')
    } else {
      setShowQuickReply(false)
      setQuickReplyQuery('')
    }
  }, [text])

  // Scroll to bottom on first load
  useEffect(() => {
    if (messages.length > 0 && prevMsgCount.current === 0) {
      setTimeout(() => scrollToBottom('instant'), 50)
    }
    prevMsgCount.current = messages.length
  }, [messages.length, scrollToBottom])

  const handleQuickReplySelect = (content: string) => {
    // Substituir o "/" + query pelo conteúdo da resposta rápida
    const words = text.split(/\s/)
    words[words.length - 1] = content
    setText(words.join(' '))
    setShowQuickReply(false)
    setQuickReplyQuery('')
    // Focus no textarea
    taRef.current?.focus()
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !conn) return
    setSending(true)
    try {
      const payload: any = {
        connectionId: conn,
        contactId: contact.id,
        message: text.trim(),
      }

      if (replyingTo) {
        payload.replyToId = replyingTo.id
      }

      const r = await fetch('/api/whatsapp/send-message', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload),
      })
      if (!r.ok) { const d=await r.json(); throw new Error(d.error) }
      const msg = await r.json()
      setMessages(prev=>[...prev,msg])
      setText('')
      setReplyingTo(null)
      setTimeout(() => scrollToBottom(), 100)
    } catch(err:any) { toast.error(err.message||'Erro ao enviar') }
    finally { setSending(false) }
  }

  const fmtTime = (d: Date) => new Date(d).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})

  const name = getName(contact)
  const sub = getSub(contact)
  const isGrp = contact.phone?.includes('@g.us')??false
  const clr = colorHash(name)

  const initials = () => {
    if (contact.name && !contact.name.includes('@'))
      return contact.name.split(' ').filter(Boolean).map(w=>w[0]).join('').toUpperCase().slice(0,2)
    return '??'
  }

  // Check if message has media
  const hasMedia = (msg: WhatsAppMessage): boolean => {
    if (msg.mediaType) return true
    return !!getMediaTypeFromText(msg.text)
  }

  // Get display text (remove media prefix for pure media messages)
  const getDisplayText = (msg: WhatsAppMessage): string | null => {
    const caption = getMediaCaption(msg.text)
    // If the text is just a tag like [Imagem], [Áudio], etc., show nothing (media handles it)
    if (!caption || caption === msg.text) {
      // Check if it's a plain text message
      const mType = msg.mediaType || getMediaTypeFromText(msg.text)
      if (mType) return caption || null // media message - return caption or nothing
      return msg.text // plain text
    }
    return null // caption is handled by MediaBubble
  }

  return (
    <div className="flex-1 flex min-w-0">
      {/* Main message area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search bar (conditionally rendered) */}
        {isSearchOpen && (
        <MessageSearch
          messages={messages.map(m => ({ id: m.id, text: m.text }))}
          onClose={() => setIsSearchOpen(false)}
          onNavigate={scrollToMessage}
          containerRef={containerRef}
        />
      )}

      {/* Header */}
      <div className="h-[60px] px-4 border-b flex items-center justify-between bg-[#f0f2f5] dark:bg-zinc-950 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className={cn('text-xs font-semibold text-white', clr)}>
              {isGrp ? <Users className="h-4 w-4" /> : initials()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-[15px] text-[#111b21] dark:text-zinc-100 leading-tight">{name}</p>
            {isTyping ? (
              <TypingIndicator variant="inline" className="mt-0.5" />
            ) : (
              sub && <p className="text-[12px] text-[#667781] leading-tight mt-0.5">{sub}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
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
            onClick={toggleSidebar}
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
            onClick={() => setIsSearchOpen(!isSearchOpen)}
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
            <Select value={conn} onValueChange={setConn}>
              <SelectTrigger className="w-auto max-w-[180px] h-8 text-xs border-[#e9edef]">
                <SelectValue placeholder="Conexão" />
              </SelectTrigger>
              <SelectContent>
                {connections.map(c => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {c.phoneNumber || c.instanceName.split('-').pop()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-2 md:px-[12%]"
        style={{
          backgroundColor: '#efeae2',
          backgroundImage: 'radial-gradient(circle, #d1d7db 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            {/* Skeleton loading */}
            <div className="w-full max-w-md space-y-3">
              {[...Array(5)].map((_,i) => (
                <div key={i} className={cn('flex', i%2===0?'justify-start':'justify-end')}>
                  <div className={cn(
                    'h-10 rounded-[18px] animate-pulse',
                    i%2===0 ? 'bg-white/60 w-[55%]' : 'bg-[#d9fdd3]/60 w-[45%]'
                  )} />
                </div>
              ))}
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur rounded-xl px-6 py-5 text-center shadow-[0_1px_3px_rgba(11,20,26,0.08)] max-w-[280px]">
              <div className="w-14 h-14 rounded-full bg-[#00a884]/10 flex items-center justify-center mx-auto mb-3">
                <Send className="h-6 w-6 text-[#00a884]" />
              </div>
              <p className="text-sm font-semibold text-[#111b21] dark:text-zinc-100">Nenhuma mensagem</p>
              <p className="text-xs text-[#667781] mt-1">
                Envie a primeira mensagem para iniciar a conversa
              </p>
            </div>
          </div>
        ) : (
          <div className="py-2">
            {messages.map((msg, i) => {
              const out = msg.direction === 'OUTBOUND'
              const prev = i>0 ? messages[i-1] : null
              const showDate = needsDateSep(msg, prev)
              const pos = getBubblePos(messages, i)
              const isGroupedWithPrev = pos === 'middle' || pos === 'last'
              const media = hasMedia(msg)
              const displayText = getDisplayText(msg)

              return (
                <div key={msg.id}>
                  {/* Date separator - sticky */}
                  {showDate && (
                    <div className="sticky top-0 z-10 flex justify-center py-2 my-1">
                      <span className="bg-white/90 dark:bg-zinc-800/90 backdrop-blur text-[12.5px] text-[#54656f] px-3 py-1 rounded-lg shadow-[0_1px_1px_rgba(11,20,26,0.13)] font-medium select-none">
                        {fmtDate(msg.sentAt)}
                      </span>
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={cn(
                      'flex animate-in fade-in-0 slide-in-from-bottom-2 duration-200 group',
                      out ? 'justify-end' : 'justify-start',
                      isGroupedWithPrev ? 'mt-[2px]' : 'mt-2'
                    )}
                  >
                    {/* Reply button (shows on hover) */}
                    {!out && (
                      <button
                        onClick={() => setReplyingTo(msg)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity mr-2 self-end mb-1 p-1.5 rounded-full hover:bg-black/5"
                        title="Responder"
                      >
                        <Reply className="h-4 w-4 text-[#667781]" />
                      </button>
                    )}

                    <div
                      ref={(el) => {
                        if (el) messageRefs.current.set(msg.id, el)
                      }}
                      className={cn(
                        'max-w-[65%] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] relative overflow-hidden transition-colors',
                        media ? 'p-[3px]' : 'px-[9px] pt-[6px] pb-[7px]',
                        bubbleRadius(pos, out),
                        highlightedMessageId === msg.id
                          ? 'ring-2 ring-[#f59e0b] bg-[#fef3c7]'
                          : out
                            ? 'bg-[#d9fdd3] dark:bg-emerald-900/60'
                            : 'bg-white dark:bg-zinc-800'
                      )}
                    >
                      {/* Quoted message (if replying) */}
                      {msg.replyToId && msg.replyToText && (
                        <div className="mb-1">
                          <QuotedMessage
                            text={msg.replyToText}
                            senderName={msg.direction === 'INBOUND' ? name : 'Você'}
                            outbound={out}
                            onClick={() => {
                              if (msg.replyToId) {
                                scrollToMessage(msg.replyToId)
                              }
                            }}
                          />
                        </div>
                      )}

                      {/* Media content */}
                      {media && (
                        <div className="mb-0.5">
                          <MediaBubble msg={msg} outbound={out} />
                        </div>
                      )}

                      {/* Text content */}
                      {(!media || displayText) && (
                        <div className={cn(media && 'px-[6px] pb-[4px] pt-[2px]')}>
                          <p className="text-[14.2px] leading-[1.46] text-[#111b21] dark:text-zinc-100 whitespace-pre-wrap break-words">
                            {media ? (displayText || '') : msg.text}
                            {/* Invisible spacer for timestamp */}
                            <span className="inline-block w-[70px]" />
                          </p>
                        </div>
                      )}

                      {/* Timestamp + status */}
                      <span className={cn(
                        'float-right flex items-center gap-1 ml-2 relative',
                        media && !displayText ? 'px-[6px] pb-[4px] -mt-1' : '-mt-4',
                      )}>
                        <span className="text-[10.5px] text-[#667781] leading-none tabular-nums">
                          {fmtTime(msg.sentAt)}
                        </span>
                        {out && (
                          msg.status === 'READ'
                            ? <CheckCheck className="h-[16px] w-[16px] text-[#53bdeb]" />
                            : msg.status === 'DELIVERED'
                              ? <CheckCheck className="h-[16px] w-[16px] text-[#8696a0]" />
                              : <Check className="h-[16px] w-[16px] text-[#8696a0]" />
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Typing indicator bubble */}
            {isTyping && (
              <TypingIndicator variant="bubble" className="mt-2" />
            )}

            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Reply preview bar */}
      {replyingTo && (
        <div className="px-4 py-2 bg-white dark:bg-zinc-900 border-t border-[#e9edef] flex items-center gap-2">
          <Reply className="h-4 w-4 text-[#00a884] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#00a884] leading-tight">
              Respondendo a {replyingTo.direction === 'INBOUND' ? name : 'Você'}
            </p>
            <p className="text-[12px] text-[#667781] truncate leading-tight">
              {replyingTo.text}
            </p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded-full hover:bg-black/5 transition-colors flex-shrink-0"
            title="Cancelar resposta"
          >
            <X className="h-4 w-4 text-[#667781]" />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="px-3 py-2 bg-[#f0f2f5] dark:bg-zinc-950 border-t border-[#e9edef] flex items-end gap-2">
        <div className="flex-1 relative">
          {/* Quick Reply Picker */}
          {showQuickReply && taRef.current && (
            <QuickReplyPicker
              query={quickReplyQuery}
              onSelect={handleQuickReplySelect}
              onClose={() => {
                setShowQuickReply(false)
                setQuickReplyQuery('')
              }}
              position={{
                top: taRef.current.offsetHeight,
                left: 0,
              }}
              contact={contact}
              userName={userName}
            />
          )}

          <textarea
            ref={taRef}
            placeholder="Mensagem"
            value={text}
            onChange={e => setText(e.target.value)}
            disabled={sending}
            rows={1}
            className={cn(
              'w-full resize-none rounded-lg border-0',
              'bg-white dark:bg-zinc-900 px-3 py-[9px] text-[14px] leading-[1.46]',
              'placeholder:text-[#8696a0]',
              'focus:outline-none focus:ring-1 focus:ring-[#00a884]/40',
              'disabled:opacity-50',
              'min-h-[42px] max-h-[120px]',
              'shadow-[0_1px_1px_rgba(11,20,26,0.06)]'
            )}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e) }
            }}
          />
        </div>
        <button
          type="button"
          onClick={send}
          disabled={sending}
          className={cn(
            'h-[42px] w-[42px] rounded-full flex items-center justify-center flex-shrink-0',
            'transition-all duration-200 active:scale-90',
            text.trim()
              ? 'bg-[#00a884] hover:bg-[#008f72] text-white'
              : 'bg-transparent text-[#54656f] hover:text-[#3b4a54]'
          )}
        >
          {sending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : text.trim() ? (
            <Send className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </button>
      </div>
      </div>

      {/* Contact Sidebar */}
      {showSidebar && contactData && contactData.tags && contactData.deals && contactData.notes && contactData._count && (
        <ContactSidebar
          contact={{
            ...contactData,
            tags: contactData.tags,
            deals: contactData.deals,
            notes: contactData.notes,
            _count: contactData._count,
          }}
          onClose={() => setShowSidebar(false)}
        />
      )}
    </div>
  )
}
