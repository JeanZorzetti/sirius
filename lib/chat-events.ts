import { EventEmitter } from 'events'

/**
 * Global EventEmitter for real-time chat events
 *
 * Events:
 * - message.new: New message received
 * - message.status: Message status updated (sent/delivered/read)
 * - conversation.updated: Conversation metadata updated
 */
class ChatEventEmitter extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(100) // Support up to 100 concurrent SSE connections
  }

  emitNewMessage(organizationId: string, contactId: string, message: any) {
    this.emit(`message:${organizationId}`, {
      type: 'message.new',
      contactId,
      message,
    })
  }

  emitMessageStatus(organizationId: string, messageId: string, status: string) {
    this.emit(`message:${organizationId}`, {
      type: 'message.status',
      messageId,
      status,
    })
  }

  emitConversationUpdate(organizationId: string, contactId: string) {
    this.emit(`message:${organizationId}`, {
      type: 'conversation.updated',
      contactId,
    })
  }
}

// Global singleton instance
export const chatEvents = new ChatEventEmitter()
