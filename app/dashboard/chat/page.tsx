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
  console.log("[CHAT_PAGE] [1] Iniciando renderização...")
  
  // 1. Autenticação
  const session = await getSession()
  console.log(`[CHAT_PAGE] [2] Sessão obtida: ${session?.user?.id || 'null'}`)
  
  if (!session?.user) {
    console.log("[CHAT_PAGE] [ERRO] Usuário não autenticado")
    return <div>Não autorizado. Faça login novamente.</div>
  }

  // 2. Buscar usuário com organização
  console.log("[CHAT_PAGE] [3] Buscando usuário no banco...")
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
    console.log(`[CHAT_PAGE] [4] Usuário encontrado: ${user?.id}, org: ${user?.organizationId}`)
  } catch (err: any) {
    console.error("[CHAT_PAGE] [ERRO] Falha ao buscar usuário:", err.message)
    return <div>Erro ao buscar usuário: {err.message}</div>
  }

  if (!user?.organizationId || !user.organization) {
    console.log("[CHAT_PAGE] [ERRO] Usuário sem organização")
    return <div>Usuário não pertence a uma organização.</div>
  }

  // 3. Verificar entitlement
  console.log("[CHAT_PAGE] [5] Verificando entitlement...")
  const canUseChat = canUseFeature(user.organization.tier, 'can_use_chat_interface')
  console.log(`[CHAT_PAGE] [6] Pode usar chat: ${canUseChat}, tier: ${user.organization.tier}`)

  if (!canUseChat) {
    console.log("[CHAT_PAGE] [7] Usuário não tem permissão para usar chat")
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
  console.log("[CHAT_PAGE] [8] Buscando conexões WhatsApp...")
  let connections
  try {
    connections = await prisma.whatsAppConnection.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
    })
    console.log(`[CHAT_PAGE] [9] Conexões encontradas: ${connections.length}`)
  } catch (err: any) {
    console.error("[CHAT_PAGE] [ERRO] Falha ao buscar conexões:", err.message)
    return <div>Erro ao buscar conexões: {err.message}</div>
  }

  // 5. Buscar contatos com mensagens WhatsApp
  console.log("[CHAT_PAGE] [10] Buscando contatos...")
  let contacts
  try {
    contacts = await prisma.contact.findMany({
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
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
    console.log(`[CHAT_PAGE] [11] Contatos encontrados: ${contacts.length}`)
  } catch (err: any) {
    console.error("[CHAT_PAGE] [ERRO] Falha ao buscar contatos:", err.message)
    return <div>Erro ao buscar contatos: {err.message}</div>
  }

  console.log("[CHAT_PAGE] [12] Renderizando ChatInterface...")
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
