'use client'

import { useCallback, useEffect, useState } from 'react'
import { Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import { MessageSearch } from '../message-search'
import { ContactSidebar } from '../contact-sidebar'
import { MediaLightbox } from '../media-lightbox'
import { AIDraftCard } from '../ai-draft-card'
import { ContextMenu } from '../context-menu'
import { ChatModals } from './chat-modals'
import type { Contact, MessageAreaProps, User, WhatsAppMessage } from './types'
import { colorHash, getInitials, getName, getSub } from './utils'
import { ChatHeader, MobileActionBar } from './chat-header'
import { MessageList } from './message-list'
import { Composer } from './composer'
import { MessageBubble, buildMessageMenuItems } from './message-bubble'
import { WindowBanners, type WindowStatus } from './window-banners'
import { useChatMessages } from './use-chat-messages'
import { useSendMessage } from './use-send-message'
import { useAudioRecording } from './use-audio-recording'
import { useAIDraft } from './use-ai-draft'

export type { MessageAreaProps }
export { MessageBubble }

// `userId` stays in MessageAreaProps for the existing callers but isn't
// consumed here (it never was — kept to avoid touching the call sites)
export function MessageArea({ contact, connections, organizationId, userName, onContactUpdate, onBack, wabaEnabled = false }: MessageAreaProps) {
  const [text, setText] = useState('')
  const [conn, setConn] = useState(connections[0]?.id||'')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [replyingTo, setReplyingTo] = useState<WhatsAppMessage | null>(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [contactData, setContactData] = useState<Contact | null>(null)
  // Modals
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showButtonsModal, setShowButtonsModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [forwardingMessage, setForwardingMessage] = useState<WhatsAppMessage | null>(null)
  // 24h window status
  const [windowStatus, setWindowStatus] = useState<WindowStatus | null>(null)
  // Context menus
  const [msgMenu, setMsgMenu] = useState<{ msg: WhatsAppMessage; x: number; y: number } | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingFilePreview, setPendingFilePreview] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [showReactionBar, setShowReactionBar] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<{ src: string; type: 'image' | 'video' } | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const {
    messages, setMessages, messageItems, loading, fetchMsgs,
    isTyping, highlightedMessageId,
    virtuosoRef, atBottom, newMsgCount, handleAtBottomChange,
    scrollToBottom, scrollToMessage,
  } = useChatMessages({ contactId: contact.id, contactPhone: contact.phone, organizationId })

  const { sending, sendText, sendMedia, sendAudio } = useSendMessage({
    contactId: contact.id, conn, wabaEnabled, setMessages, scrollToBottom,
  })

  const { isRecording, recordingTime, startRecording, cancelRecording, sendRecording } =
    useAudioRecording(sendAudio)

  const { aiDraft, setAiDraft, aiDraftLoading, coPilotEnabled, toggleCoPilot, requestAIDraft } =
    useAIDraft(contact.id, messages)

  const openLightbox = useCallback((src: string, type: 'image' | 'video') => {
    setLightbox({ src, type })
  }, [])

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

  // Fetch 24h window status — only relevant for WABA
  useEffect(() => {
    if (!wabaEnabled) {
      setWindowStatus(null)
      return
    }
    let cancelled = false
    async function fetchStatus() {
      try {
        const res = await fetch(`/api/whatsapp/window-status?contactId=${contact.id}`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setWindowStatus({ open: data.open, minutesRemaining: data.minutesRemaining })
      } catch {}
    }
    fetchStatus()
    // Re-check every 2 minutes; the moment a new inbound arrives, polling
    // of messages will reset the window anyway.
    const interval = setInterval(fetchStatus, 120_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [contact.id, wabaEnabled, messages.length])

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

  // Fetch profile picture via proxy (WhatsApp CDN URLs expire)
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null)
  useEffect(() => {
    setProfilePicUrl(null)
    if (contact.phone && !contact.phone.includes('@g.us')) {
      fetch(`/api/whatsapp/profile-pic?contactId=${contact.id}`)
        .then(r => r.json())
        .then(data => {
          if (data.profilePicUrl) setProfilePicUrl(data.profilePicUrl)
        })
        .catch(() => {})
    }
  }, [contact.id, contact.phone])

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const r = await fetch(`/api/whatsapp/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      })
      if (!r.ok) throw new Error('Failed to react')

      // Refresh messages to get updated reactions
      fetchMsgs()
      setShowReactionBar(null)
    } catch (error) {
      console.error('Error reacting:', error)
      toast.error('Erro ao reagir à mensagem')
    }
  }

  // ── Send handlers ───────────────────────────────────────────
  const handleSend = async () => {
    if (!text.trim()) return
    if (!wabaEnabled && !conn) return
    const messageText = text.trim()
    const replyingToMsg = replyingTo
    setText('')
    setReplyingTo(null)
    await sendText(messageText, replyingToMsg)
  }

  const sendDraft = useCallback(async (finalText: string) => {
    const messageText = finalText.trim()
    if (!messageText) return
    setAiDraft(null)
    await sendText(messageText)
  }, [sendText])

  const setFile = (file: File) => {
    setPendingFile(file)
    if (file.type.startsWith('image/')) {
      setPendingFilePreview(URL.createObjectURL(file))
    } else {
      setPendingFilePreview(null)
    }
  }

  const cancelFile = () => {
    setPendingFile(null)
    if (pendingFilePreview) {
      URL.revokeObjectURL(pendingFilePreview)
      setPendingFilePreview(null)
    }
  }

  const handleSendMedia = async () => {
    if (!pendingFile || (!wabaEnabled && !conn)) return
    const caption = text.trim()
    // Kick off the send first (optimistic bubble is added synchronously
    // inside), then clear the composer — same ordering as before
    const sendPromise = sendMedia(pendingFile, caption, pendingFilePreview)
    setText('')
    cancelFile()
    await sendPromise
  }

  const handleSendRecording = async () => {
    if (!wabaEnabled && !conn) return
    await sendRecording()
  }

  const name = getName(contact)
  const sub = getSub(contact)
  const isGrp = contact.phone?.includes('@g.us')??false
  const clr = colorHash(name)
  const initials = getInitials(contact)

  return (
    <div
      className="flex-1 flex min-w-0 overflow-hidden relative"
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragOver(false)
        const file = e.dataTransfer.files?.[0]
        if (file) {
          if (file.size > 16 * 1024 * 1024) {
            toast.error('Arquivo muito grande (máx 16MB)')
            return
          }
          setFile(file)
        }
      }}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-40 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-zinc-800 rounded-xl px-6 py-4 shadow-lg flex items-center gap-3">
            <Paperclip className="h-6 w-6 text-primary" />
            <span className="text-lg font-medium text-foreground">Solte o arquivo aqui</span>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <MediaLightbox
          src={lightbox.src}
          type={lightbox.type}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Main message area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Search bar (conditionally rendered) */}
        {isSearchOpen && (
          <MessageSearch
            messages={messages.map(m => ({ id: m.id, text: m.text }))}
            onClose={() => setIsSearchOpen(false)}
            onNavigate={scrollToMessage}
            containerRef={{ current: null }}
          />
        )}

        {/* Header — hidden on mobile (app bar contextual already shows name + back) */}
        <ChatHeader
          contact={contact}
          name={name}
          sub={sub}
          isGroup={isGrp}
          avatarColor={clr}
          initials={initials}
          profilePicUrl={profilePicUrl}
          isTyping={isTyping}
          coPilotEnabled={coPilotEnabled}
          onToggleCoPilot={toggleCoPilot}
          users={users}
          onContactUpdate={onContactUpdate}
          showSidebar={showSidebar}
          onToggleSidebar={toggleSidebar}
          isSearchOpen={isSearchOpen}
          onToggleSearch={() => setIsSearchOpen(!isSearchOpen)}
          connections={connections}
          conn={conn}
          onConnChange={setConn}
          onBack={onBack}
        />

        {/* Mobile action bar — shown only on mobile (header is hidden there) */}
        <MobileActionBar
          contact={contact}
          name={name}
          sub={sub}
          isGroup={isGrp}
          avatarColor={clr}
          initials={initials}
          profilePicUrl={profilePicUrl}
          users={users}
          onContactUpdate={onContactUpdate}
          showSidebar={showSidebar}
          onToggleSidebar={toggleSidebar}
          onToggleSearch={() => setIsSearchOpen(!isSearchOpen)}
        />

        {/* Messages area */}
        <MessageList
          messageItems={messageItems}
          loading={loading}
          isTyping={isTyping}
          virtuosoRef={virtuosoRef}
          atBottom={atBottom}
          newMsgCount={newMsgCount}
          onAtBottomChange={handleAtBottomChange}
          onScrollToBottom={() => scrollToBottom()}
          contactName={name}
          highlightedMessageId={highlightedMessageId}
          reactionBarMsgId={showReactionBar}
          onHoverChange={setShowReactionBar}
          onContextMenu={(msg, x, y) => setMsgMenu({ msg, x, y })}
          onReply={setReplyingTo}
          onForward={setForwardingMessage}
          onReact={handleReaction}
          onScrollToMessage={scrollToMessage}
          onOpenLightbox={openLightbox}
        />

        {/* 24h WABA window banners (closed / closing soon) */}
        {wabaEnabled && (
          <WindowBanners
            windowStatus={windowStatus}
            onOpenTemplate={() => setShowTemplateModal(true)}
          />
        )}

        {/* AI Draft card */}
        {(aiDraft || aiDraftLoading) && (
          <AIDraftCard
            draft={aiDraft?.text ?? ''}
            agentName={aiDraft?.agentName ?? 'SiriusAssistant'}
            usedRag={aiDraft?.usedRag}
            loading={aiDraftLoading}
            onSend={sendDraft}
            onRegenerate={() => requestAIDraft('default', '')}
            onDismiss={() => setAiDraft(null)}
          />
        )}

        {/* Reply/file preview bars + input area */}
        <Composer
          text={text}
          onTextChange={setText}
          sending={sending}
          contact={contact}
          contactName={name}
          userName={userName}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          pendingFile={pendingFile}
          pendingFilePreview={pendingFilePreview}
          onFileSelected={setFile}
          onCancelFile={cancelFile}
          onSend={handleSend}
          onSendMedia={handleSendMedia}
          wabaEnabled={wabaEnabled}
          aiDraftLoading={aiDraftLoading}
          onRequestAIDraft={() => requestAIDraft('default', '')}
          onOpenLocation={() => setShowLocationModal(true)}
          onOpenButtons={() => setShowButtonsModal(true)}
          onOpenTemplate={() => setShowTemplateModal(true)}
          isRecording={isRecording}
          recordingTime={recordingTime}
          onStartRecording={startRecording}
          onCancelRecording={cancelRecording}
          onSendRecording={handleSendRecording}
        />
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
          onChatCleared={() => { setMessages([]); fetchContactData() }}
        />
      )}

      <ChatModals
        contactId={contact.id}
        showLocationModal={showLocationModal}
        onLocationOpenChange={setShowLocationModal}
        showButtonsModal={showButtonsModal}
        onButtonsOpenChange={setShowButtonsModal}
        showTemplateModal={showTemplateModal}
        onTemplateOpenChange={setShowTemplateModal}
        forwardingMessage={forwardingMessage}
        onCloseForward={() => setForwardingMessage(null)}
        onSent={(msg) => setMessages(prev => [...prev, msg])}
      />

      {/* Message context menu */}
      {msgMenu && (
        <ContextMenu
          x={msgMenu.x}
          y={msgMenu.y}
          onClose={() => setMsgMenu(null)}
          items={buildMessageMenuItems(msgMenu.msg, {
            onReply: () => setReplyingTo(msgMenu.msg),
            onForward: () => setForwardingMessage(msgMenu.msg),
            onCopy: () => {
              const text = msgMenu.msg.text.replace(/^\[btn:[^\]]+\]\s*/, '')
              navigator.clipboard.writeText(text).then(
                () => toast.success('Copiado'),
                () => toast.error('Não foi possível copiar')
              )
            },
            onScrollToOriginal: msgMenu.msg.replyToId
              ? () => scrollToMessage(msgMenu.msg.replyToId!)
              : null,
          })}
        />
      )}
    </div>
  )
}
