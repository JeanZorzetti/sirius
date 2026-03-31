import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { IANavbar } from '@/components/ia/ia-navbar'

export const metadata = {
  title: 'Sirius IA | Modo Agêntico',
  description: 'CRM operado por agentes autônomos. Supervisione, aprove e controle.',
}

export default async function IALayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session?.user?.email) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      organizationId: true,
      organization: {
        select: { id: true, name: true, tier: true }
      }
    }
  })

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="dark min-h-screen bg-zinc-950 text-zinc-100 font-[family-name:var(--font-geist-sans)]">
      {/* Ambient glow effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-[128px]" />
      </div>

      {/* Top navigation */}
      <IANavbar user={{ name: user.name, email: user.email }} organizationName={user.organization.name} />

      {/* Page content */}
      <main className="relative pt-16">
        {children}
      </main>
    </div>
  )
}
