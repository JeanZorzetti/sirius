import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { WhatsAppTemplates } from '@/components/dashboard/whatsapp-templates'

export const metadata = {
  title: 'Templates WhatsApp - Sirius CRM',
  description: 'Gerencie templates aprovados pela Meta para iniciar conversas fora da janela de 24h.',
}

export const dynamic = 'force-dynamic'

export default async function TemplatesPage() {
  const session = await getSession()
  if (!session?.user?.email) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      organizationId: true,
      organization: { select: { wabaEnabled: true, plan: true } },
    },
  })

  if (!user) redirect('/login')

  // Templates dashboard requires WABA + PRO/BUSINESS plan
  if (!user.organization.wabaEnabled) {
    return (
      <div className="container mx-auto px-6 py-10 max-w-3xl">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
            Templates WhatsApp
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Este painel é exclusivo para organizações com WhatsApp Business API (WABA) habilitado.
            Configure a integração da Meta para acessar seus templates aprovados.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <WhatsAppTemplates />
    </div>
  )
}
