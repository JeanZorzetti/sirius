'use client'

import { useState, useRef } from 'react'
import { EmailAutomationType } from '@prisma/client'
import { AutomationCard } from '@/components/email-automations/automation-card'
import { EmailHistoryTable } from '@/components/email-automations/email-history-table'
import { TemplateEditor } from '@/components/email-automations/template-editor'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mail, BarChart3, Settings, Lock, Send, AlertTriangle, CheckCircle, XCircle, Loader2, Eye, ExternalLink } from 'lucide-react'

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
  isAdmin?: boolean
}

type BroadcastStatus = 'idle' | 'loading-preview' | 'ready' | 'sending' | 'done' | 'error'

interface BroadcastResult {
  orgId: string
  orgName: string
  email: string
  status: 'sent' | 'skipped' | 'error'
  error?: string
}

export function EmailAutomationsClient({
  settings,
  emailHistory,
  analytics,
  isPro,
  defaultTemplates,
  isAdmin = false,
}: EmailAutomationsClientProps) {
  const [editingAutomation, setEditingAutomation] = useState<EmailAutomation | null>(null)
  const [broadcastStatus, setBroadcastStatus] = useState<BroadcastStatus>('idle')
  const [broadcastPreview, setBroadcastPreview] = useState<{ count: number; orgs: any[] } | null>(null)
  const [broadcastResults, setBroadcastResults] = useState<{ sent: number; errors: number; results: BroadcastResult[] } | null>(null)

  async function loadBroadcastPreview() {
    setBroadcastStatus('loading-preview')
    try {
      const res = await fetch('/api/admin/email-broadcast')
      if (!res.ok) throw new Error('Forbidden')
      const data = await res.json()
      setBroadcastPreview(data)
      setBroadcastStatus('ready')
    } catch {
      setBroadcastStatus('error')
    }
  }

  async function sendBroadcast(dryRun: boolean) {
    setBroadcastStatus('sending')
    try {
      const res = await fetch('/api/admin/email-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun }),
      })
      const data = await res.json()
      setBroadcastResults(data)
      setBroadcastStatus('done')
    } catch {
      setBroadcastStatus('error')
    }
  }

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
          {isAdmin && (
            <TabsTrigger value="broadcast" className="gap-2">
              <Send className="h-4 w-4" />
              Envio Manual
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
        {isAdmin && (
          <TabsContent value="broadcast" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center ring-1 ring-amber-500/20">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle>Aviso de Migração WhatsApp</CardTitle>
                    <CardDescription>
                      Envia email explicando a mudança para API Oficial Meta a todos os clientes ativos (Starter/Pro/Business)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Links rápidos */}
                <div className="flex flex-wrap gap-2">
                  <a
                    href="/api/admin/email-preview/whatsapp-migration"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-white/10 rounded-md px-3 py-1.5 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview do email
                  </a>
                  <a
                    href="/dashboard/settings/integrations/whatsapp-official/upgrade?preview=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-white/10 rounded-md px-3 py-1.5 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ver página comercial
                  </a>
                </div>
                {broadcastStatus === 'idle' && (
                  <div className="rounded-xl border border-dashed p-8 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                      <Send className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-sm">Pronto para disparar</p>
                      <p className="text-xs text-muted-foreground">
                        Clique em "Carregar Preview" para ver quantas organizações serão afetadas antes de enviar
                      </p>
                    </div>
                    <Button variant="outline" onClick={loadBroadcastPreview}>
                      Carregar Preview
                    </Button>
                  </div>
                )}

                {broadcastStatus === 'loading-preview' && (
                  <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Carregando dados...</span>
                  </div>
                )}

                {(broadcastStatus === 'ready' || broadcastStatus === 'sending') && broadcastPreview && (
                  <div className="space-y-4">
                    {(() => {
                      const pending = broadcastPreview.orgs.filter((o: any) => !o.alreadySent)
                      const done = broadcastPreview.orgs.filter((o: any) => o.alreadySent)
                      return (
                        <>
                          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-amber-900">
                                {pending.length} pendente{pending.length !== 1 ? 's' : ''} de {broadcastPreview.count} org{broadcastPreview.count !== 1 ? 's' : ''}
                              </p>
                              <p className="text-xs text-amber-700 mt-0.5">
                                {done.length > 0 ? `${done.length} já receberam — serão puladas automaticamente` : 'Nenhum envio anterior detectado'}
                              </p>
                            </div>
                            {done.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-2.5 py-1 shrink-0">
                                <CheckCircle className="h-3.5 w-3.5" />
                                {done.length} já enviado{done.length !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>

                          <div className="rounded-lg border divide-y max-h-64 overflow-y-auto text-sm">
                            {broadcastPreview.orgs.map((org: any) => (
                              <div key={org.id} className={`flex items-center justify-between px-4 py-2.5 ${org.alreadySent ? 'opacity-40' : 'hover:bg-muted/40'}`}>
                                <span className="font-medium truncate max-w-[200px]">{org.name}</span>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Badge variant="outline" className="text-xs">{org.tier}</Badge>
                                  <span className="text-muted-foreground text-xs truncate max-w-[160px]">{org.adminEmail ?? 'sem email'}</span>
                                  {org.alreadySent && <Badge className="text-xs bg-green-100 text-green-700 border-green-200">Enviado</Badge>}
                                </div>
                              </div>
                            ))}
                            {broadcastPreview.orgs.length === 0 && (
                              <p className="px-4 py-6 text-center text-xs text-muted-foreground">Nenhuma organização encontrada</p>
                            )}
                          </div>

                          <div className="flex gap-3 pt-2">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => sendBroadcast(true)}
                              disabled={broadcastStatus === 'sending'}
                            >
                              {broadcastStatus === 'sending' ? (
                                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Simulando...</>
                              ) : 'Simulação (Dry Run)'}
                            </Button>
                            <Button
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => sendBroadcast(false)}
                              disabled={broadcastStatus === 'sending' || pending.length === 0}
                            >
                              {broadcastStatus === 'sending' ? (
                                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Enviando...</>
                              ) : (
                                <><Send className="h-4 w-4 mr-2" />Enviar para {pending.length} org{pending.length !== 1 ? 's' : ''}</>
                              )}
                            </Button>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                )}

                {broadcastStatus === 'done' && broadcastResults && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-green-700 font-bold text-2xl">
                          <CheckCircle className="h-6 w-6" />
                          {broadcastResults.sent}
                        </div>
                        <p className="text-xs text-green-600 mt-1">enviados</p>
                      </div>
                      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-red-700 font-bold text-2xl">
                          <XCircle className="h-6 w-6" />
                          {broadcastResults.errors}
                        </div>
                        <p className="text-xs text-red-600 mt-1">erros</p>
                      </div>
                    </div>

                    <div className="rounded-lg border divide-y max-h-72 overflow-y-auto text-sm">
                      {broadcastResults.results.map((r, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-2.5">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{r.orgName}</p>
                            <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                          </div>
                          <div className="shrink-0 ml-3">
                            {r.status === 'sent' && <Badge className="bg-green-100 text-green-700 border-green-200">Enviado</Badge>}
                            {r.status === 'skipped' && <Badge variant="outline" className="text-muted-foreground">Simulado</Badge>}
                            {r.status === 'error' && (
                              <Badge className="bg-red-100 text-red-700 border-red-200" title={r.error}>Erro</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button variant="outline" className="w-full" onClick={() => { setBroadcastStatus('idle'); setBroadcastPreview(null); setBroadcastResults(null) }}>
                      Novo Envio
                    </Button>
                  </div>
                )}

                {broadcastStatus === 'error' && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-6 text-center space-y-2">
                    <XCircle className="h-8 w-8 text-red-500 mx-auto" />
                    <p className="text-sm font-medium text-red-700">Erro ao carregar dados</p>
                    <Button variant="outline" size="sm" onClick={() => setBroadcastStatus('idle')}>Tentar novamente</Button>
                  </div>
                )}
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
