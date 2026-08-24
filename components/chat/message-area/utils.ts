import type { BubblePos, Contact, WhatsAppMessage } from './types'
import { formatPhone } from '@/lib/format'

// ── Contact display helpers ──────────────────────────────────

export function getName(c: Contact): string {
  if (c.name && !c.name.includes('@g.us') && !c.name.includes('@s.whatsapp.net')) return c.name
  return formatPhone(c.phone) || c.phone?.replace(/@.+/,'') || 'Sem nome'
}

export function getSub(c: Contact): string {
  if (c.phone?.includes('@g.us')) return 'Grupo'
  return formatPhone(c.phone) || ''
}

const COLORS = ['bg-blue-500','bg-emerald-500','bg-violet-500','bg-amber-500','bg-rose-500','bg-cyan-500','bg-pink-500','bg-teal-500']
export function colorHash(n: string) { let h=0; for(let i=0;i<n.length;i++) h=n.charCodeAt(i)+((h<<5)-h); return COLORS[Math.abs(h)%COLORS.length] }

export function getInitials(contact: Contact): string {
  if (contact.name && !contact.name.includes('@'))
    return contact.name.split(' ').filter(Boolean).map(w=>w[0]).join('').toUpperCase().slice(0,2)
  return '??'
}

// ── Date/time formatting ─────────────────────────────────────

export function fmtDate(d: Date): string {
  const now = new Date(), msg = new Date(d)
  const days = Math.floor((now.getTime()-msg.getTime())/86400000)
  if (days===0) return 'Hoje'
  if (days===1) return 'Ontem'
  return msg.toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})
}

export function fmtTime(d: Date): string {
  return new Date(d).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
}

export function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function fmtAudioTime(s: number): string {
  if (!isFinite(s) || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// ── Bubble grouping ──────────────────────────────────────────

export function needsDateSep(cur: WhatsAppMessage, prev: WhatsAppMessage|null): boolean {
  if (!prev) return true
  return new Date(cur.sentAt).toDateString() !== new Date(prev.sentAt).toDateString()
}

export function getBubblePos(msgs: WhatsAppMessage[], i: number): BubblePos {
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

export function bubbleRadius(pos: BubblePos, outbound: boolean): string {
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

// ── Media detection from text ────────────────────────────────

export function getMediaTypeFromText(text: string): string | null {
  if (text.startsWith('[Imagem]')) return 'image'
  if (text.startsWith('[Vídeo]')) return 'video'
  if (text.startsWith('[Documento]')) return 'document'
  if (text.startsWith('[Áudio]')) return 'audio'
  if (text.startsWith('[Figurinha]')) return 'sticker'
  return null
}

export function getMediaCaption(text: string): string {
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

export function isMediaLoaded(data: string | null): boolean {
  return !!data && (data.startsWith('data:') || data.startsWith('http'))
}

export function hasMedia(msg: WhatsAppMessage): boolean {
  if (msg.mediaType) return true
  return !!getMediaTypeFromText(msg.text)
}

// Get display text (remove media prefix for pure media messages)
export function getDisplayText(msg: WhatsAppMessage): string | null {
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

// Parse [btn:ID] prefix from interactive button replies so we can render a pill
export function parseInteractiveReply(text: string): { btnId: string; label: string } | null {
  const m = text.match(/^\[btn:([^\]]+)\]\s*([\s\S]*)$/)
  if (!m) return null
  return { btnId: m[1], label: m[2] }
}
