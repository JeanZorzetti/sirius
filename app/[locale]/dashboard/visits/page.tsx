/**
 * Dashboard de Visitas (Check-ins)
 * /dashboard/visits
 * Lista de visitas com localização, contato e data
 */

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Clock, Users, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { CheckinButton } from '@/components/mobile/checkin-button'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Visitas & Check-ins | Sirius CRM' }

export default async function VisitsPage() {
  const session = await getSession()
  if (!session?.user?.email) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, organizationId: true },
  })

  if (!user?.organizationId) redirect('/dashboard')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [visits, totalVisits, uniqueContacts] = await Promise.all([
    prisma.visitLog.findMany({
      where: {
        organizationId: user.organizationId,
        visitedAt: { gte: thirtyDaysAgo },
      },
      include: {
        contact: { select: { id: true, name: true, company: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { visitedAt: 'desc' },
      take: 50,
    }),
    prisma.visitLog.count({
      where: {
        organizationId: user.organizationId,
        visitedAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.visitLog.findMany({
      where: {
        organizationId: user.organizationId,
        visitedAt: { gte: thirtyDaysAgo },
        contactId: { not: null },
      },
      select: { contactId: true },
    }),
  ])

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            Visitas & Check-ins
          </h1>
          <p className="text-muted-foreground mt-1">
            Historico de visitas a clientes - ultimos 30 dias
          </p>
        </div>
        <CheckinButton variant="default" size="default" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Visitas (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalVisits}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clientes Visitados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{uniqueContacts.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Media / Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(totalVisits / 4.3).toFixed(1)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Visit List */}
      {visits.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historico de Visitas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {visits.map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {visit.contact ? (
                          <Link
                            href={`/dashboard/contacts/${visit.contact.id}`}
                            className="font-medium hover:underline"
                          >
                            {visit.contact.name}
                          </Link>
                        ) : (
                          <span className="font-medium text-muted-foreground">Visita sem contato</span>
                        )}
                        {visit.contact?.company && (
                          <p className="text-xs text-muted-foreground">{visit.contact.company}</p>
                        )}
                        {visit.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{visit.notes}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(visit.visitedAt), { addSuffix: true, locale: ptBR })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {visit.user.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {visit.latitude.toFixed(4)}, {visit.longitude.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-medium">Nenhuma visita registrada ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              Use o botao "Check-in" para registrar visitas a clientes com localizacao automatica
            </p>
            <div className="flex justify-center mt-4">
              <CheckinButton variant="default" size="default" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Instructions */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                App Nativo disponivel em breve
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                O app iOS/Android do Sirius CRM esta em desenvolvimento. Enquanto isso, o check-in
                funciona direto pelo navegador do celular usando GPS.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
