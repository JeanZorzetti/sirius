import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { AnalyticsProClient } from './client'

export const metadata = {
  title: 'Analytics PRO | Sirius CRM',
  description: 'Analytics avançado para otimizar suas vendas',
}

export default async function AnalyticsProPage() {
  const session = await getSession()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { organization: true },
  })

  if (!user || !user.organization) {
    redirect('/login')
  }

  // Feature gate: PRO and BUSINESS
  const allowedPlans = ['PRO', 'BUSINESS']
  if (!allowedPlans.includes(user.organization.tier)) {
    return (
      <div className="container mx-auto max-w-4xl py-12">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-900 dark:bg-yellow-950">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
              <svg
                className="h-5 w-5 text-yellow-600 dark:text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                Analytics Avançado é exclusivo para o Plano PRO
              </h3>
              <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                Desbloqueie insights poderosos sobre suas vendas com métricas avançadas:
              </p>
              <ul className="mt-3 space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 text-yellow-600 dark:text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Conversion Rate e Win Rate detalhados
                </li>
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 text-yellow-600 dark:text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Ciclo de vendas e velocidade do pipeline
                </li>
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 text-yellow-600 dark:text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Gráficos de tendência e funil de conversão
                </li>
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 text-yellow-600 dark:text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Análise por pipeline e período customizável
                </li>
              </ul>
              <div className="mt-6">
                <a
                  href="/dashboard/billing"
                  className="inline-flex items-center rounded-md bg-yellow-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-400"
                >
                  Fazer Upgrade para PRO
                  <svg
                    className="ml-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Buscar pipelines da organização
  const pipelines = await prisma.pipeline.findMany({
    where: {
      organizationId: user.organization.id,
    },
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      id: true,
      name: true,
      isDefault: true,
    },
  })

  return <AnalyticsProClient pipelines={pipelines} />
}
