'use client'

import { useEffect, useRef, useState } from 'react'
import {
  FileText, FileText as FileTextIcon, ListChecks, Loader2, MapPin, Mic,
  Paperclip, Reply, Send, Sparkles, Trash2, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { QuickReplyPicker } from '../quick-reply-picker'
import type { Contact, WhatsAppMessage } from './types'
import { fmtDuration } from './utils'

export interface ComposerProps {
  text: string
  onTextChange: (text: string) => void
  sending: boolean
  contact: Contact
  contactName: string
  userName: string
  replyingTo: WhatsAppMessage | null
  onCancelReply: () => void
  pendingFile: File | null
  pendingFilePreview: string | null
  onFileSelected: (file: File) => void
  onCancelFile: () => void
  onSend: () => void
  onSendMedia: () => void
  wabaEnabled: boolean
  aiDraftLoading: boolean
  onRequestAIDraft: () => void
  onOpenLocation: () => void
  onOpenButtons: () => void
  onOpenTemplate: () => void
  isRecording: boolean
  recordingTime: number
  onStartRecording: () => void
  onCancelRecording: () => void
  onSendRecording: () => void
}

export function Composer({
  text, onTextChange, sending, contact, contactName, userName,
  replyingTo, onCancelReply,
  pendingFile, pendingFilePreview, onFileSelected, onCancelFile,
  onSend, onSendMedia,
  wabaEnabled, aiDraftLoading, onRequestAIDraft,
  onOpenLocation, onOpenButtons, onOpenTemplate,
  isRecording, recordingTime, onStartRecording, onCancelRecording, onSendRecording,
}: ComposerProps) {
  const tCommon = useTranslations('common')
  const taRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Quick Reply: derived from the last word of `text` ("/" prefix triggers
  // the picker); `quickReplyDismissed` lets the user close it until they type
  const [quickReplyDismissed, setQuickReplyDismissed] = useState(false)
  const lastWord = text.split(/\s/).pop() ?? ''
  const showQuickReply = lastWord.startsWith('/') && !quickReplyDismissed
  const quickReplyQuery = lastWord.startsWith('/') ? lastWord.slice(1) : ''
  // Mirrors the textarea height in state so the QuickReplyPicker can be
  // positioned during render without reading the ref (react-hooks/refs)
  const [taHeight, setTaHeight] = useState(42)

  // Auto-resize textarea
  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = 'auto'
      const h = Math.min(taRef.current.scrollHeight, 120)
      taRef.current.style.height = h + 'px'
      setTaHeight(taRef.current.offsetHeight)
    }
  }, [text])

  const handleTextChange = (value: string) => {
    setQuickReplyDismissed(false)
    onTextChange(value)
  }

  const handleQuickReplySelect = (content: string) => {
    // Substituir o "/" + query pelo conteúdo da resposta rápida
    const words = text.split(/\s/)
    words[words.length - 1] = content
    onTextChange(words.join(' '))
    setQuickReplyDismissed(true)
    // Focus no textarea
    taRef.current?.focus()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 16 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 16MB.')
      return
    }
    onFileSelected(file)
  }

  // pendingFile lives in the parent; whenever it's cleared (cancel OR after
  // sending), reset the native input so picking the same file fires onChange
  useEffect(() => {
    if (!pendingFile && fileInputRef.current) fileInputRef.current.value = ''
  }, [pendingFile])

  return (
    <>
      {/* Reply preview bar */}
      {replyingTo && (
        <div className="px-4 py-2 bg-white whatsapp-header border-t border-[#e9edef] dark:border-zinc-700 flex items-center gap-2">
          <Reply className="h-4 w-4 text-[#00a884] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#00a884] leading-tight">
              Respondendo a {replyingTo.direction === 'INBOUND' ? contactName : 'Você'}
            </p>
            <p className="text-[12px] text-[#667781] truncate leading-tight">
              {replyingTo.text}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 rounded-full hover:bg-black/5 transition-colors flex-shrink-0"
            title="Cancelar resposta"
          >
            <X className="h-4 w-4 text-[#667781]" />
          </button>
        </div>
      )}

      {/* File preview bar */}
      {pendingFile && (
        <div className="px-3 py-2 bg-[#e2f7cb] dark:bg-emerald-900/30 border-t border-[#e9edef] dark:border-zinc-700 flex items-center gap-3">
          {pendingFilePreview ? (
            <img src={pendingFilePreview} alt="Preview" className="h-12 w-12 rounded object-cover" />
          ) : (
            <div className="h-12 w-12 rounded bg-white/50 dark:bg-white/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-[#54656f]" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-[#111b21] dark:text-white">{pendingFile.name}</p>
            <p className="text-xs text-[#667781]">{(pendingFile.size / 1024).toFixed(0)} KB</p>
          </div>
          <button onClick={onCancelFile} className="p-1 rounded-full hover:bg-black/5" title={tCommon('buttons.cancel')}>
            <X className="h-4 w-4 text-[#667781]" />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="px-3 py-2 bg-[#f0f2f5] whatsapp-header border-t border-[#e9edef] dark:border-zinc-700 flex items-end gap-2">
        {isRecording ? (
          /* Recording UI — replaces the normal input */
          <>
            <button
              type="button"
              onClick={onCancelRecording}
              aria-label="Cancelar gravação"
              className="h-[42px] w-[42px] rounded-full flex items-center justify-center flex-shrink-0 text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-5 w-5" />
            </button>

            <div className="flex-1 flex items-center gap-3 bg-white dark:bg-zinc-800 rounded-lg px-4 py-2 min-h-[42px] shadow-[0_1px_1px_rgba(11,20,26,0.06)]">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              <span className="text-sm font-medium text-[#111b21] dark:text-zinc-100 tabular-nums">
                {fmtDuration(recordingTime)}
              </span>
              <div className="flex-1 flex items-center gap-[2px] overflow-hidden">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-[3px] rounded-full bg-[#00a884]/60"
                    style={{
                      // deterministic jitter (render must stay pure — no Math.random)
                      height: `${8 + Math.sin((recordingTime * 3 + i) * 0.5) * 8 + ((recordingTime * 7 + i * 13) % 6)}px`,
                      transition: 'height 0.15s ease',
                    }}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onSendRecording}
              disabled={sending}
              aria-label="Enviar áudio"
              className="h-[42px] w-[42px] rounded-full flex items-center justify-center flex-shrink-0 bg-[#00a884] hover:bg-[#008f72] text-white transition-all duration-200 active:scale-90"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </>
        ) : (
          /* Normal input */
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={handleFileSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              aria-label="Anexar arquivo"
              className="h-[42px] w-[42px] rounded-full flex items-center justify-center flex-shrink-0 text-[#54656f] hover:text-[#3b4a54] hover:bg-black/5 transition-colors"
            >
              <Paperclip className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={onRequestAIDraft}
              disabled={sending || aiDraftLoading}
              aria-label="Pedir rascunho para IA"
              title="Pedir rascunho para IA"
              className={cn(
                'h-[42px] w-[42px] rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                aiDraftLoading
                  ? 'text-violet-600 bg-violet-100/60 animate-pulse'
                  : 'text-violet-600 hover:text-violet-700 hover:bg-violet-100/50'
              )}
            >
              {aiDraftLoading
                ? <Loader2 className="h-5 w-5 animate-spin" />
                : <Sparkles className="h-5 w-5" />}
            </button>

            {wabaEnabled && (
              <>
                <button
                  type="button"
                  onClick={onOpenLocation}
                  disabled={sending}
                  aria-label="Enviar localização"
                  title="Enviar localização"
                  className="h-[42px] w-[42px] rounded-full flex items-center justify-center flex-shrink-0 text-[#54656f] hover:text-[#3b4a54] hover:bg-black/5 transition-colors"
                >
                  <MapPin className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={onOpenButtons}
                  disabled={sending}
                  aria-label="Enviar mensagem com botões"
                  title="Enviar mensagem com botões"
                  className="h-[42px] w-[42px] rounded-full flex items-center justify-center flex-shrink-0 text-[#54656f] hover:text-[#3b4a54] hover:bg-black/5 transition-colors"
                >
                  <ListChecks className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={onOpenTemplate}
                  disabled={sending}
                  aria-label="Enviar template"
                  title="Enviar template aprovado"
                  className="h-[42px] w-[42px] rounded-full flex items-center justify-center flex-shrink-0 text-[#54656f] hover:text-[#3b4a54] hover:bg-black/5 transition-colors"
                >
                  <FileTextIcon className="h-5 w-5" />
                </button>
              </>
            )}

            <div className="flex-1 relative">
              {showQuickReply && (
                <QuickReplyPicker
                  query={quickReplyQuery}
                  onSelect={handleQuickReplySelect}
                  onClose={() => setQuickReplyDismissed(true)}
                  position={{
                    top: taHeight,
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
                onChange={e => handleTextChange(e.target.value)}
                disabled={sending}
                rows={1}
                aria-label="Campo de mensagem"
                aria-describedby="message-help-text"
                className={cn(
                  'w-full resize-none rounded-lg border-0',
                  'bg-white whatsapp-input px-3 py-[9px] text-[14px] leading-[1.46]',
                  'placeholder:text-[#8696a0]',
                  'focus:outline-none focus:ring-1 focus:ring-[#00a884]/40',
                  'disabled:opacity-50',
                  'min-h-[42px] max-h-[120px]',
                  'shadow-[0_1px_1px_rgba(11,20,26,0.06)]',
                  'whatsapp-text-primary'
                )}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() }
                }}
                onPaste={e => {
                  const items = e.clipboardData?.items
                  if (!items) return
                  for (const item of Array.from(items)) {
                    if (item.type.startsWith('image/')) {
                      e.preventDefault()
                      const file = item.getAsFile()
                      if (file) {
                        onFileSelected(file)
                      }
                      break
                    }
                  }
                }}
              />
              <span id="message-help-text" className="sr-only">
                Pressione Enter para enviar, Shift+Enter para nova linha
              </span>
            </div>

            {(text.trim() || pendingFile) ? (
              <button
                type="button"
                onClick={pendingFile ? onSendMedia : onSend}
                disabled={sending}
                aria-label={pendingFile ? 'Enviar arquivo' : 'Enviar mensagem'}
                className="h-[42px] w-[42px] rounded-full flex items-center justify-center flex-shrink-0 bg-[#00a884] hover:bg-[#008f72] text-white transition-all duration-200 active:scale-90 focus-visible:ring-2 focus-visible:ring-[#00a884] focus-visible:ring-offset-2"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onStartRecording}
                disabled={sending}
                aria-label="Gravar áudio"
                className="h-[42px] w-[42px] rounded-full flex items-center justify-center flex-shrink-0 bg-[#00a884] hover:bg-[#008f72] text-white transition-all duration-200 active:scale-90 focus-visible:ring-2 focus-visible:ring-[#00a884] focus-visible:ring-offset-2"
              >
                <Mic className="h-5 w-5" />
              </button>
            )}
          </>
        )}
      </div>
    </>
  )
}
