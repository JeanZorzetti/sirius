import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { prismaWa } from "@/lib/prisma-wa"
import { canUseFeature, checkWhatsAppInstanceLimit, getEffectiveTier } from "@/lib/entitlements"
import { podeVerTudo } from "@/lib/visibilidade"
import { SELECT_PUBLICO, paraPublica } from "@/lib/whatsapp/integradores/conexao"
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
        orgRole: true,
        organization: {
          select: {
            tier: true,
            trialEndsAt: true,
            trialStatus: true,
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

  // The effective plan, so the 7-day trial gets the chat too (spec 012, research R9)
  const canUseChat = canUseFeature(getEffectiveTier(user.organization), 'can_use_chat_interface')
  if (!canUseChat) {
    return <ChatUpgradeCta />
  }

  // Only the public fields reach the client component (FR-005): no credentials, secret or hash
  const carregado = await Promise.all([
    prismaWa.whatsAppConnection.findMany({
      where: { organizationId: user.organizationId },
      select: SELECT_PUBLICO,
      orderBy: { createdAt: 'desc' },
    }),
    checkWhatsAppInstanceLimit(user.organizationId),
  ]).catch((err) => {
    console.error("[CHAT_PAGE] Falha ao buscar conexões:", errMessage(err))
    return null
  })
  if (!carregado) return <div>{t('errors.fetchUser')}</div>
  const [linhas, limite] = carregado

  // Connections in any state, like /api/whatsapp/conversations: a dropped connection keeps its conversations visible
  const scope = {
    connectionIds: linhas.map(c => c.id),
    wabaEnabled: user.organization.wabaEnabled === true && !!user.organization.wabaPhoneNumberId,
  }
  // Legacy gateway rows (no provider) are discontinued: their history stays in the inbox, the row leaves the screen
  const connections = linhas.filter(c => c.provider).map(paraPublica)

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
        limite={limite.limite}
        usadas={limite.usadas}
        podeGerenciar={podeVerTudo(user)}
        initialPhone={initialPhone}
        wabaEnabled={scope.wabaEnabled}
      />
    </div>
  )
}
