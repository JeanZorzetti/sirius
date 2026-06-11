export interface Tag { id: string; name: string; color: string }

export interface Deal {
  id: string
  title: string
  value: number | null
  stage: { name: string }
  pipeline: { name: string }
  updatedAt: Date
}

export interface Note {
  id: string
  content: string
  createdAt: Date
  user: { name: string | null }
}

export interface User {
  id: string
  name: string | null
  email: string
}

export interface ChatConversation {
  id: string
  assignedUserId: string | null
  assignedUser: User | null
  status: string
  priority: string
}

export interface Contact {
  id: string
  name: string | null
  phone: string | null
  email?: string | null
  company?: string | null
  profilePicUrl?: string | null
  tags?: Tag[]
  deals?: Deal[]
  notes?: Note[]
  chatConversation?: ChatConversation | null
  _count?: { whatsappMessages: number }
}

export interface Connection {
  id: string
  instanceName: string
  displayName?: string | null
  phoneNumber: string | null
}

export interface Reaction {
  emoji: string
  count: number
  userReacted: boolean
}

export interface WhatsAppMessage {
  id: string; text: string; direction: string; sentAt: Date
  deliveredAt: Date | null; readAt: Date | null; status: string
  mediaUrl: string | null; mediaType: string | null; messageId?: string
  replyToId?: string | null; replyToText?: string | null
  reactions?: Reaction[]
}

export interface MessageAreaProps {
  contact: Contact; connections: Connection[]
  organizationId: string; userId: string; userName: string
  onContactUpdate?: () => void
  onBack?: () => void
  wabaEnabled?: boolean
}

// Grouped bubble border-radius (Messenger/iMessage pattern)
export type BubblePos = 'single' | 'first' | 'middle' | 'last'

export type MessageItem = {
  msg: WhatsAppMessage
  showDate: boolean
  pos: BubblePos
}
