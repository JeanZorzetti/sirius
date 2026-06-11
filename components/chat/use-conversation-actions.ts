'use client'

import { toast } from 'sonner'

/**
 * Conversation list actions (pin / archive / mark read / clear messages).
 * Each one toasts the outcome and triggers `onConversationUpdate` on success.
 */
export function useConversationActions(onConversationUpdate?: () => void) {
  const togglePin = async (contactId: string, isPinned: boolean) => {
    try {
      const res = await fetch(`/api/whatsapp/conversations/${contactId}/pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !isPinned }),
      })
      if (!res.ok) throw new Error()
      toast.success(isPinned ? 'Conversa desafixada' : 'Conversa fixada')
      onConversationUpdate?.()
    } catch {
      toast.error('Erro ao fixar conversa')
    }
  }

  const toggleArchive = async (contactId: string, isArchived: boolean) => {
    try {
      const res = await fetch(`/api/whatsapp/conversations/${contactId}/archive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !isArchived }),
      })
      if (!res.ok) throw new Error()
      toast.success(isArchived ? 'Conversa desarquivada' : 'Conversa arquivada')
      onConversationUpdate?.()
    } catch {
      toast.error('Erro ao arquivar conversa')
    }
  }

  const markAllAsRead = async (contactId: string) => {
    try {
      const res = await fetch('/api/whatsapp/messages/mark-read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId }),
      })
      if (!res.ok) throw new Error()
      toast.success('Marcado como lido')
      onConversationUpdate?.()
    } catch {
      toast.error('Erro ao marcar como lido')
    }
  }

  const clearMessages = async (contactId: string, contactName: string) => {
    if (!window.confirm(`Limpar todas as mensagens com ${contactName}? Esta ação não pode ser desfeita.`)) return
    try {
      const res = await fetch('/api/whatsapp/messages/clear', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId }),
      })
      if (!res.ok) throw new Error()
      toast.success('Mensagens removidas')
      onConversationUpdate?.()
    } catch {
      toast.error('Erro ao limpar mensagens')
    }
  }

  return { togglePin, toggleArchive, markAllAsRead, clearMessages }
}
