import { Metadata } from "next"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { prismaWa } from "@/lib/prisma-wa"
import { canUseFeature } from "@/lib/entitlements"
import { ChatInterface } from "@/components/chat/chat-interface"
import { EmptyState } from "@/components/ui/empty-state"
import { MessageSquare } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Chat Center - WhatsApp",
  description: "Central de atendimento WhatsApp"
}

export const dynamic = 'force-dynamic'

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string }>
}) {
  const { phone: initialPhone } = await searchParams
  const session = await getSession()

  if (!session?.user) {
    return <div>Não autorizado. Faça login novamente.</div>
  }

  let user
  try {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        organizationId: true,
        organization: {
          select: {
            tier: true,
            whatsappInstances: true,
          }
        }
      }
    })
  } catch (err: any) {
    console.error("[CHAT_PAGE] Falha ao buscar usuário:", err.message)
    return <div>Erro ao buscar usuário: {err.message}</div>
  }

  if (!user?.organizationId || !user.organization) {
    return <div>Usuário não pertence a uma organização.</div>
  }

  const canUseChat = canUseFeature(user.organization.tier, 'can_use_chat_interface')

  if (!canUseChat) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <EmptyState
          icon={MessageSquare}
          title="Chat Center disponível no plano PRO"
          description="Faça upgrade para acessar o Chat Center e gerenciar seus atendimentos WhatsApp em um só lugar."
          action={
            <Link href="/dashboard/billing">
              <Button>Fazer Upgrade para PRO</Button>
            </Link>
          }
        />
      </div>
    )
  }

  let connections: any[] = []

  try {
    connections = await prismaWa.whatsAppConnection.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
    })
  } catch (err: any) {
    console.error("[CHAT_PAGE] Falha ao buscar conexões:", err.message)
    return <div>Erro ao buscar conexões: {err.message}</div>
  }

  // Filter only active connections — prevents mixing messages from old/disconnected instances
  const activeConnections = connections.filter((c: any) => c.status === 'CONNECTED')
  const connectionIds = activeConnections.map((c: any) => c.id)
  const messageFilter = connectionIds.length > 0
    ? { connectionId: { in: connectionIds } }
    : null

  let contacts: any[] = []
  try {
    // No active connections — nothing to show
    if (!messageFilter) {
      contacts = []
    } else {
      // 1. Get distinct contactIds with messages from WA DB
      const contactIdsWithMessages = await prismaWa.whatsAppMessage.findMany({
        where: {
          organizationId: user.organizationId,
          ...messageFilter,
        },
        distinct: ['contactId'],
        select: { contactId: true },
      })

      const contactIds = contactIdsWithMessages
        .map(m => m.contactId)
        .filter((id): id is string => id !== null)

      if (contactIds.length > 0) {
        // 2. Fetch contacts from CRM DB
        const rawContacts = await prisma.contact.findMany({
          where: {
            id: { in: contactIds },
            organizationId: user.organizationId,
          },
          orderBy: { updatedAt: 'desc' },
        })

        // 3. Fetch last message per contact from WA DB
        // distinct + orderBy on different fields causes INSUFFICIENT_PATH — dedupe in JS instead
        const lastMessagesRaw = await prismaWa.whatsAppMessage.findMany({
          where: {
            organizationId: user.organizationId,
            contactId: { in: contactIds },
            ...messageFilter,
          },
          orderBy: { sentAt: 'desc' },
        })

        const lastMessageMap = new Map<string, typeof lastMessagesRaw[0]>()
        for (const msg of lastMessagesRaw) {
          if (msg.contactId && !lastMessageMap.has(msg.contactId)) {
            lastMessageMap.set(msg.contactId, msg)
          }
        }

        // 4. Fetch unread counts from WA DB
        const unreadCounts = await prismaWa.whatsAppMessage.groupBy({
          by: ['contactId'],
          where: {
            organizationId: user.organizationId,
            contactId: { in: contactIds },
            direction: 'INBOUND',
            isRead: false,
            ...messageFilter,
          },
          _count: { id: true },
        })

        const unreadMap = new Map(
          unreadCounts.map(u => [u.contactId, u._count.id])
        )

        // 5. Fetch total inbound counts from WA DB
        const totalCounts = await prismaWa.whatsAppMessage.groupBy({
          by: ['contactId'],
          where: {
            organizationId: user.organizationId,
            contactId: { in: contactIds },
            direction: 'INBOUND',
            ...messageFilter,
          },
          _count: { id: true },
        })

        const totalCountMap = new Map(
          totalCounts.map(u => [u.contactId, u._count.id])
        )

        // 6. Merge CRM contacts with WA data
        contacts = rawContacts.map(contact => {
          const lastMsg = lastMessageMap.get(contact.id)
          return {
            ...contact,
            whatsappMessages: lastMsg ? [lastMsg] : [],
            _count: {
              whatsappMessages: totalCountMap.get(contact.id) || 0,
              unreadMessages: unreadMap.get(contact.id) || 0,
            },
          }
        })

        // Sort by latest message time to match WhatsApp ordering
        contacts.sort((a: any, b: any) => {
          const aTime = a.whatsappMessages[0]?.sentAt?.getTime() ?? 0
          const bTime = b.whatsappMessages[0]?.sentAt?.getTime() ?? 0
          return bTime - aTime
        })
      }
    }
  } catch (err: any) {
    console.error("[CHAT_PAGE] Falha ao buscar contatos:", err.message)
    return <div>Erro ao buscar contatos: {err.message}</div>
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)]">
      <ChatInterface
        connections={connections}
        contacts={contacts}
        userId={user.id}
        userName={user.name || 'Usuário'}
        organizationId={user.organizationId}
        maxInstances={user.organization.whatsappInstances || 1}
        initialPhone={initialPhone}
      />
    </div>
  )
}
