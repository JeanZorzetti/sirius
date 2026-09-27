'use client'

import { useCallback, useState, type Dispatch, type SetStateAction } from 'react'
import type { WhatsAppMessage } from './types'
import { fmtDuration } from './utils'

interface UseSendMessageArgs {
  contactId: string
  /**
   * Where the reply goes out (FR-018): 'oficial' for the official API, a connection id for an integrator, '' while
   * the seller has not picked a number for a contact who never wrote.
   */
  rota: string
  setMessages: Dispatch<SetStateAction<WhatsAppMessage[]>>
  scrollToBottom: () => void
}

export const ROTA_OFICIAL = 'oficial'

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
 * insert temp bubble → POST → replace with the server-confirmed message. On failure the bubble stays as
 * "não enviada" with the reason, so the text is never lost (spec 012, T055).
 */
export function useSendMessage({ contactId, rota, setMessages, scrollToBottom }: UseSendMessageArgs) {
  const oficial = rota === ROTA_OFICIAL
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
        const erro: string = d.error || options?.errorFallback || 'não foi possível enviar'
        // 502: the server kept the message as FAILED and returns it; 409/413/415: nothing was saved
        const falha: WhatsAppMessage = d.mensagem ?? { ...optimisticMsg, status: 'FAILED', erro }
        setMessages(prev => prev.map(m => m.id === tempId ? falha : m))
        return
      }
      const confirmedMsg: WhatsAppMessage = await r.json()
      const finalMsg = options?.transformConfirmed ? options.transformConfirmed(confirmedMsg) : confirmedMsg
      setMessages(prev => prev.map(m => m.id === tempId ? finalMsg : m))
      setTimeout(() => scrollToBottom(), 100)
    } catch {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...optimisticMsg, status: 'FAILED', erro: 'sem resposta do Sirius; confira sua internet' } : m))
    } finally {
      options?.onSettled?.()
      setSending(false)
    }
  }, [setMessages, scrollToBottom])

  const sendText = useCallback(async (messageText: string, replyTo?: WhatsAppMessage | null) => {
    if (!messageText.trim() || !rota) return

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const optimisticMsg = makeOptimistic(tempId, messageText, {
      replyToId: replyTo?.id || null,
      replyToText: replyTo?.text || null,
    })

    await runOptimistic(optimisticMsg, () => {
      const url = oficial ? '/api/whatsapp/send-waba' : '/api/whatsapp/send-message'
      const payload: Record<string, string> = oficial
        ? { contactId, message: messageText }
        : { connectionId: rota, contactId, message: messageText }
      if (replyTo) payload.replyToId = replyTo.id
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    })
  }, [oficial, rota, contactId, runOptimistic])

  const sendMedia = useCallback(async (file: File, caption: string, previewUrl: string | null) => {
    if (!rota) return

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
      if (!oficial) formData.append('connectionId', rota)

      const endpoint = oficial ? '/api/whatsapp/send-waba-media' : '/api/whatsapp/send-media'
      return fetch(endpoint, { method: 'POST', body: formData })
    }, { errorFallback: 'não foi possível enviar a mídia' })
  }, [oficial, rota, contactId, runOptimistic])

  const sendAudio = useCallback(async (audioBlob: Blob, duration: number, mimeType: string) => {
    if (!rota) return

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
      if (!oficial) formData.append('connectionId', rota)

      const endpoint = oficial ? '/api/whatsapp/send-waba-media' : '/api/whatsapp/send-media'
      return fetch(endpoint, { method: 'POST', body: formData })
    }, {
      errorFallback: 'não foi possível enviar o áudio',
      // Preserve the duration text from the optimistic message
      transformConfirmed: (msg) => ({ ...msg, text: `[Áudio ${fmtDuration(duration)}]` }),
      onSettled: () => URL.revokeObjectURL(localUrl),
    })
  }, [oficial, rota, contactId, runOptimistic])

  return { sending, sendText, sendMedia, sendAudio }
}
