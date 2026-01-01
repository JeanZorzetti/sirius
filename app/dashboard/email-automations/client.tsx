'use client'

import { useState } from 'react'
import { EmailAutomationType } from '@prisma/client'
import { AutomationCard } from '@/components/email-automations/automation-card'
import { EmailHistoryTable } from '@/components/email-automations/email-history-table'
import { TemplateEditor } from '@/components/email-automations/template-editor'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Mail, BarChart3, Settings, Lock } from 'lucide-react'

interface EmailAutomation {
  id: string
  type: EmailAutomationType
  enabled: boolean
  customSubject: string | null
  customBody: string | null
  sendDelayMinutes: number
  triggerConditions: any
}

interface DefaultTemplates {
  [key: string]: {
    subject: string
    body: string
  }
}

interface EmailAutomationsClientProps {
  settings: EmailAutomation[]
  emailHistory: any[]
  analytics: any
  isPro: boolean
  defaultTemplates: DefaultTemplates
}

export function EmailAutomationsClient({
  settings,
  emailHistory,
  analytics,
  isPro,
  defaultTemplates
}: EmailAutomationsClientProps) {
  const [editingAutomation, setEditingAutomation] = useState<EmailAutomation | null>(null)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automações de Email</h1>
          <p className="text-muted-foreground">
            Configure e gerencie os emails automáticos do seu CRM
          </p>
        </div>
        {isPro && (
          <Badge variant="default" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            PRO - Analytics Habilitado
          </Badge>
        )}
      </div>

      <Tabs defaultValue="automations" className="w-full">
        <TabsList>
          <TabsTrigger value="automations" className="gap-2">
            <Settings className="h-4 w-4" />
            Automações
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Mail className="h-4 w-4" />
            Histórico de Envios
          </TabsTrigger>
          {isPro && (
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="automations" className="space-y-4">
          <div className="grid gap-4">
            {settings.map((automation) => (
              <AutomationCard
                key={automation.id}
                id={automation.id}
                type={automation.type}
                enabled={automation.enabled}
                customSubject={automation.customSubject}
                customBody={automation.customBody}
                sendDelayMinutes={automation.sendDelayMinutes}
                onEditClick={() => setEditingAutomation(automation)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Emails Enviados</CardTitle>
              <CardDescription>
                Últimos 50 emails enviados automaticamente pelo sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmailHistoryTable logs={emailHistory} isPro={isPro} />
            </CardContent>
          </Card>
        </TabsContent>

        {isPro ? (
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Enviados
                  </CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.totalSent || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Últimos 50 emails
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Taxa de Entrega
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.deliveryRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    Emails entregues com sucesso
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Taxa de Abertura
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.openRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    Emails abertos pelos destinatários
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Taxa de Cliques
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.clickRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    Links clicados nos emails
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Desempenho de Email</CardTitle>
                <CardDescription>
                  Analytics detalhados do engajamento com seus emails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Taxa de Falha</span>
                    <span className="text-sm font-semibold">{analytics?.failureRate}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Dados baseados nos últimos 50 emails enviados. Para análises mais detalhadas,
                    considere integrar com ferramentas de email marketing especializadas.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ) : (
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-muted rounded-full w-fit">
                  <Lock className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle>Analytics de Email - PRO</CardTitle>
                <CardDescription>
                  Faça upgrade para o plano PRO e desbloqueie analytics detalhados de email
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Com o plano PRO você terá acesso a:
                </p>
                <ul className="text-sm space-y-2 mb-6">
                  <li>✅ Taxa de entrega e abertura</li>
                  <li>✅ Taxa de cliques em links</li>
                  <li>✅ Tracking detalhado de cada email</li>
                  <li>✅ Análise de engajamento</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {editingAutomation && (
        <TemplateEditor
          automationId={editingAutomation.id}
          type={editingAutomation.type}
          currentSubject={editingAutomation.customSubject}
          currentBody={editingAutomation.customBody}
          defaultSubject={defaultTemplates[editingAutomation.type]?.subject || ''}
          defaultBody={defaultTemplates[editingAutomation.type]?.body || ''}
          open={!!editingAutomation}
          onOpenChange={(open) => !open && setEditingAutomation(null)}
        />
      )}
    </div>
  )
}
