'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Send, Users, Loader2, Check, CheckCheck, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

interface Contact { id: string; name: string | null; phone: string | null }
interface Connection { id: string; instanceName: string; phoneNumber: string | null }
interface WhatsAppMessage {
  id: string; text: string; direction: string; sentAt: Date
  deliveredAt: Date | null; readAt: Date | null; status: string
}
interface MessageAreaProps {
  contact: Contact; connections: Connection[]
  organizationId: string; userId: string
}

const POLL = 3000

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
function color(n: string) { let h=0; for(let i=0;i<n.length;i++) h=n.charCodeAt(i)+((h<<5)-h); return COLORS[Math.abs(h)%COLORS.length] }

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
  // [top-left, top-right, bottom-right, bottom-left]
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

// ── Component ───────────────────────────────────────────────

export function MessageArea({ contact, connections, organizationId, userId }: MessageAreaProps) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [text, setText] = useState('')
  const [conn, setConn] = useState(connections[0]?.id||'')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const firstLoad = useRef(true)

  const scroll = () => endRef.current?.scrollIntoView({ behavior: 'smooth' })

  const fetchMsgs = useCallback(async (show=false) => {
    if (show) setLoading(true)
    try {
      const r = await fetch(`/api/contact/${contact.id}/interactions?type=WHATSAPP`)
      if (!r.ok) throw new Error()
      const d = await r.json()
      setMessages(prev => { if (d.length>prev.length) setTimeout(scroll,100); return d })
    } catch { if (show) toast.error('Erro ao carregar mensagens') }
    finally { setLoading(false) }
  }, [contact.id])

  useEffect(() => { firstLoad.current=true; fetchMsgs(true) }, [contact.id, fetchMsgs])
  useEffect(() => { const i=setInterval(()=>fetchMsgs(),POLL); return ()=>clearInterval(i) }, [fetchMsgs])

  // Auto-resize textarea
  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = 'auto'
      taRef.current.style.height = Math.min(taRef.current.scrollHeight, 120) + 'px'
    }
  }, [text])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !conn) return
    setSending(true)
    try {
      const r = await fetch('/api/whatsapp/send-message', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ connectionId:conn, contactId:contact.id, message:text.trim() }),
      })
      if (!r.ok) { const d=await r.json(); throw new Error(d.error) }
      const msg = await r.json()
      setMessages(prev=>[...prev,msg])
      setText('')
      setTimeout(scroll,100)
    } catch(err:any) { toast.error(err.message||'Erro ao enviar') }
    finally { setSending(false) }
  }

  const fmtTime = (d: Date) => new Date(d).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})

  const name = getName(contact)
  const sub = getSub(contact)
  const isGrp = contact.phone?.includes('@g.us')??false
  const clr = color(name)

  const initials = () => {
    if (contact.name && !contact.name.includes('@'))
      return contact.name.split(' ').filter(Boolean).map(w=>w[0]).join('').toUpperCase().slice(0,2)
    return '??'
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
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
            {sub && <p className="text-[12px] text-[#667781] leading-tight mt-0.5">{sub}</p>}
          </div>
        </div>
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

      {/* Messages area */}
      <div
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
                      'flex animate-in fade-in-0 slide-in-from-bottom-2 duration-200',
                      out ? 'justify-end' : 'justify-start',
                      isGroupedWithPrev ? 'mt-[2px]' : 'mt-2'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[65%] px-[9px] pt-[6px] pb-[7px] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] relative',
                        bubbleRadius(pos, out),
                        out
                          ? 'bg-[#d9fdd3] dark:bg-emerald-900/60'
                          : 'bg-white dark:bg-zinc-800'
                      )}
                    >
                      <p className="text-[14.2px] leading-[1.46] text-[#111b21] dark:text-zinc-100 whitespace-pre-wrap break-words">
                        {msg.text}
                        {/* Invisible spacer for timestamp */}
                        <span className="inline-block w-[70px]" />
                      </p>
                      <span className="float-right flex items-center gap-1 -mt-4 ml-2 relative">
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
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="px-3 py-2 bg-[#f0f2f5] dark:bg-zinc-950 border-t border-[#e9edef] flex items-end gap-2">
        <div className="flex-1 relative">
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
  )
}
