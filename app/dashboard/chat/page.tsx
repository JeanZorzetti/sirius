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

export default async function ChatPage() {
  // 1. Autenticação
  const session = await getSession()
  if (!session?.user) {
    return <div>Não autorizado. Faça login novamente.</div>
  }

  // 2. Buscar usuário com organização
  const user = await prisma.user.findUnique({
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

  if (!user?.organizationId || !user.organization) {
    return <div>Usuário não pertence a uma organização.</div>
  }

  // 3. Verificar entitlement
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

  // 4. Buscar conexões WhatsApp
  const connections = await prisma.whatsAppConnection.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: 'desc' },
  })

  // 5. Buscar contatos com mensagens WhatsApp
  const contacts = await prisma.contact.findMany({
    where: {
      organizationId: user.organizationId,
      whatsappMessages: {
        some: {}
      }
    },
    include: {
      whatsappMessages: {
        orderBy: { sentAt: 'desc' },
        take: 1,
      },
      _count: {
        select: {
          whatsappMessages: {
            where: {
              direction: 'INBOUND',
              // TODO: Add "unread" flag
            }
          }
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)]">
      <ChatInterface
        connections={connections}
        contacts={contacts}
        userId={user.id}
        userName={user.name || 'Usuário'}
        organizationId={user.organizationId}
        maxInstances={user.organization.whatsappInstances || 1}
      />
    </div>
  )
}
