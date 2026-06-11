import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { prismaWa } from "@/lib/prisma-wa"
import { canUseFeature } from "@/lib/entitlements"
import { ChatInterface } from "@/components/chat/chat-interface"
import { EmptyState } from "@/components/ui/empty-state"
import { MessageSquare } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getTranslations } from "next-intl/server"

export const metadata = {
  title: "Chat Center - WhatsApp",
  description: "Central de atendimento WhatsApp"
}

export const dynamic = 'force-dynamic'

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
  } catch (err: any) {
    console.error("[CHAT_PAGE] Falha ao buscar usuário:", err.message)
    return <div>{t('errors.fetchUser')}</div>
  }

  if (!user?.organizationId || !user.organization) {
    return <div>{t('errors.userNoOrg')}</div>
  }

  const canUseChat = canUseFeature(user.organization.tier, 'can_use_chat_interface')

  if (!canUseChat) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-lg w-full space-y-6">
          {/* Aviso sobre banimentos Meta */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex gap-3">
              <span className="text-2xl flex-shrink-0">⚠️</span>
              <div className="space-y-2">
                <p className="font-semibold text-amber-900 text-sm">
                  Por que o WhatsApp mudou?
                </p>
                <p className="text-amber-800 text-sm leading-relaxed">
                  A Meta está banindo números que utilizam APIs não oficiais do WhatsApp (como Evolution API, Baileys e similares). Para proteger seu negócio, o Sirius CRM migrou para a <strong>API Oficial do WhatsApp Business (Meta Cloud API)</strong> — a única integração permitida pelos Termos de Uso da Meta.
                </p>
                <a
                  href="https://faq.whatsapp.com/5957850900902049"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-amber-700 underline underline-offset-2 hover:text-amber-900 transition-colors"
                >
                  Fonte oficial: WhatsApp Help Center →
                </a>
              </div>
            </div>
          </div>

          {/* CTA upgrade */}
          <div className="rounded-xl border bg-card p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <div className="space-y-1">
              <h2 className="font-semibold text-foreground">WhatsApp Oficial disponível no plano Business</h2>
              <p className="text-sm text-muted-foreground">
                Conecte seu número via API Oficial Meta, sem risco de banimento, com suporte a templates, mídia e status em tempo real.
              </p>
            </div>
            <Link href="/dashboard/billing/plans">
              <Button className="w-full">Fazer Upgrade para Business</Button>
            </Link>
          </div>
        </div>
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
    return <div>{t('errors.fetchUser')}</div>
  }

  // O gateway QR (whatsmeow) foi descontinuado — o status das conexões legadas
  // é o que está no DB; o caminho vivo é a API Oficial Meta (wabaEnabled).

  // Filter only active connections — prevents mixing messages from old/disconnected instances
  const activeConnections = connections.filter((c: any) => c.status === 'CONNECTED')
  const connectionIds = activeConnections.map((c: any) => c.id)
  const wabaEnabled = user.organization.wabaEnabled === true && !!user.organization.wabaPhoneNumberId
  const hasEvolutionConnections = connectionIds.length > 0

  let contacts: any[] = []
  try {
    // No active Evolution connections and WABA not active — nothing to show
    if (!hasEvolutionConnections && !wabaEnabled) {
      contacts = []
    } else {
      // 1. Get org's contacts from CRM DB first (source of truth),
      // then intersect with WA DB to avoid cross-org orphaned messages
      const orgContacts = await prisma.contact.findMany({
        where: { organizationId: user.organizationId },
        select: { id: true },
      })
      const orgContactIds = orgContacts.map(c => c.id)

      let rows: { contact_id: string }[] = []
      if (orgContactIds.length > 0) {
        if (hasEvolutionConnections && wabaEnabled) {
          rows = await prismaWa.$queryRaw<{ contact_id: string }[]>`
            SELECT DISTINCT "contactId" AS contact_id
            FROM "WhatsAppMessage"
            WHERE "organizationId" = ${user.organizationId}
              AND "contactId" = ANY(${orgContactIds}::text[])
              AND ("connectionId" = ANY(${connectionIds}::text[]) OR "connectionId" IS NULL)
          `
        } else if (hasEvolutionConnections) {
          rows = await prismaWa.$queryRaw<{ contact_id: string }[]>`
            SELECT DISTINCT "contactId" AS contact_id
            FROM "WhatsAppMessage"
            WHERE "organizationId" = ${user.organizationId}
              AND "contactId" = ANY(${orgContactIds}::text[])
              AND "connectionId" = ANY(${connectionIds}::text[])
          `
        } else {
          // WABA only — intersect with org's contacts to avoid orphaned messages
          rows = await prismaWa.$queryRaw<{ contact_id: string }[]>`
            SELECT DISTINCT "contactId" AS contact_id
            FROM "WhatsAppMessage"
            WHERE "organizationId" = ${user.organizationId}
              AND "contactId" = ANY(${orgContactIds}::text[])
              AND "connectionId" IS NULL
          `
        }
      }

      const contactIds = rows.map(r => r.contact_id)

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
        const lastMsgWhere: any = {
          organizationId: user.organizationId,
          contactId: { in: contactIds },
        }
        if (hasEvolutionConnections && wabaEnabled) {
          lastMsgWhere.OR = [{ connectionId: { in: connectionIds } }, { connectionId: null }]
        } else if (hasEvolutionConnections) {
          lastMsgWhere.connectionId = { in: connectionIds }
        } else {
          lastMsgWhere.connectionId = null
        }

        const lastMessagesRaw = await prismaWa.whatsAppMessage.findMany({
          where: lastMsgWhere,
          orderBy: { sentAt: 'desc' },
        })

        const lastMessageMap = new Map<string, typeof lastMessagesRaw[0]>()
        for (const msg of lastMessagesRaw) {
          if (msg.contactId && !lastMessageMap.has(msg.contactId)) {
            lastMessageMap.set(msg.contactId, msg)
          }
        }

        // 4. Fetch unread counts from WA DB
        let unreadRows: { contact_id: string; cnt: bigint }[]
        let totalRows: { contact_id: string; cnt: bigint }[]

        if (hasEvolutionConnections && wabaEnabled) {
          unreadRows = await prismaWa.$queryRaw<{ contact_id: string; cnt: bigint }[]>`
            SELECT "contactId" AS contact_id, COUNT(id)::bigint AS cnt
            FROM "WhatsAppMessage"
            WHERE "organizationId" = ${user.organizationId}
              AND "contactId" = ANY(${contactIds}::text[])
              AND ("connectionId" = ANY(${connectionIds}::text[]) OR "connectionId" IS NULL)
              AND direction = 'INBOUND'
              AND "isRead" = false
            GROUP BY "contactId"
          `
          totalRows = await prismaWa.$queryRaw<{ contact_id: string; cnt: bigint }[]>`
            SELECT "contactId" AS contact_id, COUNT(id)::bigint AS cnt
            FROM "WhatsAppMessage"
            WHERE "organizationId" = ${user.organizationId}
              AND "contactId" = ANY(${contactIds}::text[])
              AND ("connectionId" = ANY(${connectionIds}::text[]) OR "connectionId" IS NULL)
              AND direction = 'INBOUND'
            GROUP BY "contactId"
          `
        } else if (hasEvolutionConnections) {
          unreadRows = await prismaWa.$queryRaw<{ contact_id: string; cnt: bigint }[]>`
            SELECT "contactId" AS contact_id, COUNT(id)::bigint AS cnt
            FROM "WhatsAppMessage"
            WHERE "organizationId" = ${user.organizationId}
              AND "contactId" = ANY(${contactIds}::text[])
              AND "connectionId" = ANY(${connectionIds}::text[])
              AND direction = 'INBOUND'
              AND "isRead" = false
            GROUP BY "contactId"
          `
          totalRows = await prismaWa.$queryRaw<{ contact_id: string; cnt: bigint }[]>`
            SELECT "contactId" AS contact_id, COUNT(id)::bigint AS cnt
            FROM "WhatsAppMessage"
            WHERE "organizationId" = ${user.organizationId}
              AND "contactId" = ANY(${contactIds}::text[])
              AND "connectionId" = ANY(${connectionIds}::text[])
              AND direction = 'INBOUND'
            GROUP BY "contactId"
          `
        } else {
          // WABA only
          unreadRows = await prismaWa.$queryRaw<{ contact_id: string; cnt: bigint }[]>`
            SELECT "contactId" AS contact_id, COUNT(id)::bigint AS cnt
            FROM "WhatsAppMessage"
            WHERE "organizationId" = ${user.organizationId}
              AND "contactId" = ANY(${contactIds}::text[])
              AND "connectionId" IS NULL
              AND direction = 'INBOUND'
              AND "isRead" = false
            GROUP BY "contactId"
          `
          totalRows = await prismaWa.$queryRaw<{ contact_id: string; cnt: bigint }[]>`
            SELECT "contactId" AS contact_id, COUNT(id)::bigint AS cnt
            FROM "WhatsAppMessage"
            WHERE "organizationId" = ${user.organizationId}
              AND "contactId" = ANY(${contactIds}::text[])
              AND "connectionId" IS NULL
              AND direction = 'INBOUND'
            GROUP BY "contactId"
          `
        }

        const unreadMap = new Map(unreadRows.map(r => [r.contact_id, Number(r.cnt)]))
        const totalCountMap = new Map(totalRows.map(r => [r.contact_id, Number(r.cnt)]))

        // 5. Merge CRM contacts with WA data
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
        wabaEnabled={wabaEnabled}
      />
    </div>
  )
}
