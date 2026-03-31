import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft, Calendar, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GoogleCalendarConnectButton } from '@/components/integrations/google-calendar-connect-button'

export const metadata = { title: "Google Calendar | Sirius CRM" }

export default async function GoogleCalendarIntegrationPage({
  searchParams
}: {
  searchParams: { success?: string; error?: string }
}) {
  const session = await getSession()
  if (!session || !session.user || !session.user.email) {
    return <div>Não autorizado. Faça login novamente.</div>
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      organization: {
        select: {
          id: true,
          plan: true,
          googleCalendarEnabled: true,
          googleCalendarEmail: true
        }
      }
    }
  })

  if (!user || !user.organization) {
    return <div>Usuário não encontrado.</div>
  }

  const isConnected = user.organization.googleCalendarEnabled
  const connectedEmail = user.organization.googleCalendarEmail

  // Handle OAuth callback messages
  const showSuccess = searchParams.success === 'true'
  const errorType = searchParams.error

  const getErrorMessage = () => {
    switch (errorType) {
      case 'access_denied':
        return 'Você negou o acesso ao Google Calendar. Tente novamente.'
      case 'invalid_request':
        return 'Solicitação inválida. Tente novamente.'
      case 'invalid_state':
        return 'Erro de segurança. Por favor, tente conectar novamente.'
      case 'connection_failed':
        return 'Falha ao conectar com Google Calendar. Verifique as configurações e tente novamente.'
      default:
        return 'Ocorreu um erro. Tente novamente.'
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/settings/integrations">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between space-y-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 ring-1 ring-white/5 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
              <Calendar className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              INTEGRAÇÃO GOOGLE CALENDAR
            </h2>
          </div>
          <p className="text-sm text-zinc-500 ml-13">
            Sincronize eventos do calendário com seus deals automaticamente
          </p>
        </div>
      </div>

      {/* Success message */}
      {showSuccess && (
        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                Conectado com sucesso!
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Sua integração com Google Calendar está ativa e funcionando.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {errorType && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                Erro na conexão
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {getErrorMessage()}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 max-w-2xl">
        <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Status da Conexão
            </CardTitle>
            <CardDescription className="text-zinc-500 text-xs">
              {isConnected
                ? 'Sua conta Google Calendar está conectada'
                : 'Conecte sua conta Google Calendar para ativar a sincronização automática'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isConnected ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      Conectado como:
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-mono">
                      {connectedEmail}
                    </p>
                  </div>
                </div>

                <GoogleCalendarConnectButton
                  organizationId={user.organization.id}
                  isConnected={true}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Clique no botão abaixo para conectar sua conta Google Calendar.
                  Você será redirecionado para o Google para autorizar o acesso.
                </p>

                <GoogleCalendarConnectButton
                  organizationId={user.organization.id}
                  isConnected={false}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              📘 Como funciona
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-blue-600 dark:text-blue-400 space-y-3">
            <div>
              <p className="font-medium mb-1">1. Automação de Eventos</p>
              <p className="text-blue-600/80 dark:text-blue-400/80">
                Quando você fecha um deal (ganha), um evento é criado automaticamente
                no Google Calendar com os detalhes do cliente.
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">2. Lembretes de Follow-up</p>
              <p className="text-blue-600/80 dark:text-blue-400/80">
                Crie lembretes no calendário para acompanhamento de deals importantes.
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">3. Sincronização Bidirecional</p>
              <p className="text-blue-600/80 dark:text-blue-400/80">
                Reuniões criadas no Google Calendar podem ser automaticamente
                vinculadas a deals no CRM.
              </p>
            </div>
            <div className="pt-2 border-t border-blue-200 dark:border-blue-500/20">
              <p className="font-medium mb-1">Recursos disponíveis:</p>
              <ul className="list-disc list-inside text-blue-600/80 dark:text-blue-400/80 space-y-1">
                <li>Criar eventos automaticamente ao fechar deals</li>
                <li>Configurar lembretes personalizados</li>
                <li>Sincronizar reuniões com o CRM</li>
                <li>Gerenciar eventos direto do dashboard</li>
              </ul>
            </div>
            <div className="pt-2 border-t border-blue-200 dark:border-blue-500/20">
              <p className="font-medium mb-1">🔒 Segurança:</p>
              <p className="text-blue-600/80 dark:text-blue-400/80">
                Seus tokens de acesso são criptografados e armazenados com segurança.
                Você pode desconectar a qualquer momento.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
