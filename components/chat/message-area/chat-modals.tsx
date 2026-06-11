'use client'

import { LocationModal } from '../location-modal'
import { ForwardModal } from '../forward-modal'
import { ButtonsComposerModal } from '../buttons-composer-modal'
import { TemplatePickerModal } from '../template-picker-modal'
import type { WhatsAppMessage } from './types'

export interface ChatModalsProps {
  contactId: string
  showLocationModal: boolean
  onLocationOpenChange: (open: boolean) => void
  showButtonsModal: boolean
  onButtonsOpenChange: (open: boolean) => void
  showTemplateModal: boolean
  onTemplateOpenChange: (open: boolean) => void
  forwardingMessage: WhatsAppMessage | null
  onCloseForward: () => void
  onSent: (msg: WhatsAppMessage) => void
}

/** Location / forward / interactive-buttons / template modals of the chat. */
export function ChatModals({
  contactId,
  showLocationModal, onLocationOpenChange,
  showButtonsModal, onButtonsOpenChange,
  showTemplateModal, onTemplateOpenChange,
  forwardingMessage, onCloseForward,
  onSent,
}: ChatModalsProps) {
  return (
    <>
      <LocationModal
        open={showLocationModal}
        onOpenChange={onLocationOpenChange}
        contactId={contactId}
        onSent={onSent}
      />

      <ForwardModal
        open={!!forwardingMessage}
        onOpenChange={(o) => { if (!o) onCloseForward() }}
        sourceMessageId={forwardingMessage?.id ?? null}
        sourceText={forwardingMessage?.text ?? null}
        excludeContactId={contactId}
      />

      <ButtonsComposerModal
        open={showButtonsModal}
        onOpenChange={onButtonsOpenChange}
        contactId={contactId}
        onSent={onSent}
      />

      <TemplatePickerModal
        open={showTemplateModal}
        onOpenChange={onTemplateOpenChange}
        contactId={contactId}
        onSent={onSent}
      />
    </>
  )
}
