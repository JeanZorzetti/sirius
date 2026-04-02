import { Metadata } from "next"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
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
  let activeConnection = null
  let messageFilter = {}

  try {
    connections = await prisma.whatsAppConnection.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
    })

    // Localizar a conexão ativa
    activeConnection = connections.find((c: any) => c.status === 'CONNECTED' || c.status === 'CONNECTING')
    if (activeConnection) {
      messageFilter = { OR: [{ connectionId: activeConnection.id }, { connectionId: null }] }
    }
  } catch (err: any) {
    console.error("[CHAT_PAGE] Falha ao buscar conexões:", err.message)
    return <div>Erro ao buscar conexões: {err.message}</div>
  }

  let contacts: any[] = []
  try {
    const rawContacts = await prisma.contact.findMany({
      where: {
        organizationId: user.organizationId,
        whatsappMessages: {
          some: messageFilter
        }
      },
      include: {
        whatsappMessages: {
          where: messageFilter,
          orderBy: { sentAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            whatsappMessages: {
              where: {
                ...messageFilter,
                direction: 'INBOUND',
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Single aggregated query instead of N+1 count() per contact
    const contactIds = rawContacts.map(c => c.id)
    const unreadCounts = contactIds.length > 0
      ? await prisma.whatsAppMessage.groupBy({
          by: ['contactId'],
          where: {
            ...messageFilter,
            contactId: { in: contactIds },
            direction: 'INBOUND',
            isRead: false,
          },
          _count: { id: true },
        })
      : []

    const unreadMap = new Map(
      unreadCounts.map(u => [u.contactId, u._count.id])
    )

    contacts = rawContacts.map(contact => ({
      ...contact,
      _count: {
        ...contact._count,
        unreadMessages: unreadMap.get(contact.id) || 0,
      }
    }))
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
