import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { prismaWa } from "@/lib/prisma-wa"
import { canUseFeature } from "@/lib/entitlements"
import { getChatConversations, type ChatConversation } from "@/lib/chat/queries"
import { ChatInterface } from "@/components/chat/chat-interface"
import { ChatUpgradeCta } from "@/components/chat/chat-upgrade-cta"
import { getTranslations } from "next-intl/server"

export const metadata = {
  title: "Chat Center - WhatsApp",
  description: "Central de atendimento WhatsApp"
}

export const dynamic = 'force-dynamic'

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ phone?: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard' })
  const { phone: initialPhone } = await searchParams
  const session = await getSession()

  if (!session?.user?.email) {
    return <div>{t('errors.unauthorized')}</div>
  }

  let user
  try {
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        organizationId: true,
        organization: {
          select: {
            tier: true,
            whatsappInstances: true,
            wabaEnabled: true,
            wabaPhoneNumberId: true,
          }
        }
      }
    })
  } catch (err) {
    console.error("[CHAT_PAGE] Falha ao buscar usuário:", errMessage(err))
    return <div>{t('errors.fetchUser')}</div>
  }

  if (!user?.organizationId || !user.organization) {
    return <div>{t('errors.userNoOrg')}</div>
  }

  const canUseChat = canUseFeature(user.organization.tier, 'can_use_chat_interface')
  if (!canUseChat) {
    return <ChatUpgradeCta />
  }

  // O gateway QR (whatsmeow) foi descontinuado — o status das conexões legadas
  // é o que está no DB; o caminho vivo é a API Oficial Meta (wabaEnabled).
  let connections
  try {
    connections = await prismaWa.whatsAppConnection.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
    })
  } catch (err) {
    console.error("[CHAT_PAGE] Falha ao buscar conexões:", errMessage(err))
    return <div>{t('errors.fetchUser')}</div>
  }

  // Only active connections count — prevents mixing messages from
  // old/disconnected instances
  const scope = {
    connectionIds: connections.filter(c => c.status === 'CONNECTED').map(c => c.id),
    wabaEnabled: user.organization.wabaEnabled === true && !!user.organization.wabaPhoneNumberId,
  }

  let contacts: ChatConversation[]
  try {
    contacts = await getChatConversations(user.organizationId, scope)
  } catch (err) {
    console.error("[CHAT_PAGE] Falha ao buscar contatos:", errMessage(err))
    return <div>{t('errors.fetchUser')}</div>
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100svh-var(--app-bar-height)-3.5rem-env(safe-area-inset-bottom))] lg:h-[calc(100vh-4rem)]">
      <ChatInterface
        connections={connections}
        contacts={contacts}
        userId={user.id}
        userName={user.name || 'Usuário'}
        organizationId={user.organizationId}
        maxInstances={user.organization.whatsappInstances || 1}
        initialPhone={initialPhone}
        wabaEnabled={scope.wabaEnabled}
      />
    </div>
  )
}
