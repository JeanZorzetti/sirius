'use client'

import { useCallback, useState, type Dispatch, type SetStateAction } from 'react'
import { toast } from 'sonner'
import type { WhatsAppMessage } from './types'
import { fmtDuration } from './utils'

interface UseSendMessageArgs {
  contactId: string
  conn: string
  wabaEnabled: boolean
  setMessages: Dispatch<SetStateAction<WhatsAppMessage[]>>
  scrollToBottom: () => void
}

function makeOptimistic(tempId: string, text: string, overrides: Partial<WhatsAppMessage> = {}): WhatsAppMessage {
  return {
    id: tempId,
    text,
    direction: 'OUTBOUND',
    sentAt: new Date(),
    deliveredAt: null,
    readAt: null,
    status: 'SENDING',
    mediaUrl: null,
    mediaType: null,
    messageId: undefined,
    replyToId: null,
    replyToText: null,
    reactions: [],
    ...overrides,
  }
}

/**
 * Optimistic send pipeline shared by text / media / audio:
 * insert temp bubble → POST → replace with the server-confirmed message,
 * or remove the temp bubble and toast on failure.
 */
export function useSendMessage({ contactId, conn, wabaEnabled, setMessages, scrollToBottom }: UseSendMessageArgs) {
  const [sending, setSending] = useState(false)

  const runOptimistic = useCallback(async (
    optimisticMsg: WhatsAppMessage,
    doRequest: () => Promise<Response>,
    options?: { errorFallback?: string; transformConfirmed?: (msg: WhatsAppMessage) => WhatsAppMessage; onSettled?: () => void }
  ) => {
    const tempId = optimisticMsg.id
    setMessages(prev => [...prev, optimisticMsg])
    setTimeout(() => scrollToBottom(), 50)

    setSending(true)
    try {
      const r = await doRequest()
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        throw new Error(d.error || options?.errorFallback || 'Erro')
      }
      const confirmedMsg: WhatsAppMessage = await r.json()
      const finalMsg = options?.transformConfirmed ? options.transformConfirmed(confirmedMsg) : confirmedMsg
      setMessages(prev => prev.map(m => m.id === tempId ? finalMsg : m))
      setTimeout(() => scrollToBottom(), 100)
    } catch (err: unknown) {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      toast.error(err instanceof Error && err.message ? err.message : (options?.errorFallback || 'Erro ao enviar'))
    } finally {
      options?.onSettled?.()
      setSending(false)
    }
  }, [setMessages, scrollToBottom])

  const sendText = useCallback(async (messageText: string, replyTo?: WhatsAppMessage | null) => {
    if (!messageText.trim()) return
    if (!wabaEnabled && !conn) return

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const optimisticMsg = makeOptimistic(tempId, messageText, {
      replyToId: replyTo?.id || null,
      replyToText: replyTo?.text || null,
    })

    await runOptimistic(optimisticMsg, () => {
      const url = wabaEnabled ? '/api/whatsapp/send-waba' : '/api/whatsapp/send-message'
      const payload: Record<string, string> = wabaEnabled
        ? { contactId, message: messageText }
        : { connectionId: conn, contactId, message: messageText }
      if (replyTo) payload.replyToId = replyTo.id
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    })
  }, [wabaEnabled, conn, contactId, runOptimistic])

  const sendMedia = useCallback(async (file: File, caption: string, previewUrl: string | null) => {
    if (!wabaEnabled && !conn) return

    const tempId = `temp-media-${Date.now()}`
    const mediaLabel = file.type.startsWith('image/') ? '[Imagem]'
      : file.type.startsWith('video/') ? '[Vídeo]'
      : file.type.startsWith('audio/') ? '[Áudio]'
      : `[Documento] ${file.name}`
    const messageText = caption ? `${mediaLabel} ${caption}` : mediaLabel

    const optimisticMsg = makeOptimistic(tempId, messageText, {
      mediaUrl: previewUrl,
      mediaType: file.type.startsWith('image/') ? 'image'
        : file.type.startsWith('video/') ? 'video'
        : file.type.startsWith('audio/') ? 'audio' : 'document',
    })

    await runOptimistic(optimisticMsg, () => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('contactId', contactId)
      if (caption) formData.append('caption', caption)
      if (!wabaEnabled && conn) formData.append('connectionId', conn)

      const endpoint = wabaEnabled ? '/api/whatsapp/send-waba-media' : '/api/whatsapp/send-media'
      return fetch(endpoint, { method: 'POST', body: formData })
    }, { errorFallback: 'Erro ao enviar mídia' })
  }, [wabaEnabled, conn, contactId, runOptimistic])

  const sendAudio = useCallback(async (audioBlob: Blob, duration: number, mimeType: string) => {
    if (!wabaEnabled && !conn) return

    const localUrl = URL.createObjectURL(audioBlob)
    const tempId = `temp-audio-${Date.now()}`
    const optimisticMsg = makeOptimistic(tempId, `[Áudio ${fmtDuration(duration)}]`, {
      mediaUrl: localUrl,
      mediaType: 'audio',
    })

    await runOptimistic(optimisticMsg, () => {
      // Pick file extension based on actual mime type
      const ext = mimeType.includes('ogg') ? 'ogg' : 'webm'
      const formData = new FormData()
      formData.append('file', audioBlob, `audio.${ext}`)
      formData.append('contactId', contactId)
      formData.append('ptt', 'true')
      formData.append('duration', String(duration))
      if (!wabaEnabled) formData.append('connectionId', conn)

      const endpoint = wabaEnabled ? '/api/whatsapp/send-waba-media' : '/api/whatsapp/send-media'
      return fetch(endpoint, { method: 'POST', body: formData })
    }, {
      errorFallback: 'Erro ao enviar áudio',
      // Preserve the duration text from the optimistic message
      transformConfirmed: (msg) => ({ ...msg, text: `[Áudio ${fmtDuration(duration)}]` }),
      onSettled: () => URL.revokeObjectURL(localUrl),
    })
  }, [wabaEnabled, conn, contactId, runOptimistic])

  return { sending, sendText, sendMedia, sendAudio }
}
