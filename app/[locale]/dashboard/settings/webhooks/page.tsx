'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Webhook, Plus, Trash2, Edit, Eye, EyeOff, Copy, Check, AlertTriangle, BarChart3, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface WebhookType {
  id: string
  url: string
  description: string | null
  enabled: boolean
  events: string[]
  createdAt: string
  updatedAt: string
  _count: {
    logs: number
  }
}

const WEBHOOK_EVENT_CATEGORIES = [
  {
    category: 'Deals',
    events: [
      { value: 'deal.created', label: 'Deal Created' },
      { value: 'deal.updated', label: 'Deal Updated' },
      { value: 'deal.deleted', label: 'Deal Deleted' },
      { value: 'deal.stage_changed', label: 'Deal Stage Changed' },
      { value: 'deal.value_changed', label: 'Deal Value Changed' },
      { value: 'deal.note_added', label: 'Note Added to Deal' }
    ]
  },
  {
    category: 'Contacts',
    events: [
      { value: 'contact.created', label: 'Contact Created' },
      { value: 'contact.updated', label: 'Contact Updated' },
      { value: 'contact.deleted', label: 'Contact Deleted' }
    ]
  },
  {
    category: 'Organization',
    events: [
      { value: 'organization.upgraded', label: 'Organization Upgraded' },
      { value: 'organization.downgraded', label: 'Organization Downgraded' }
    ]
  }
]

export default function WebhooksManagementPage() {
  const [webhooks, setWebhooks] = useState<WebhookType[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showSecretDialog, setShowSecretDialog] = useState(false)
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null)
  const [webhookSecret, setWebhookSecret] = useState('')
  const [copied, setCopied] = useState(false)

  // Form state
  const [formUrl, setFormUrl] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formEvents, setFormEvents] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; url: string } | null>(null)

  useEffect(() => {
    loadWebhooks()
  }, [])

  async function loadWebhooks() {
    try {
      const response = await fetch('/api/v1/webhooks')
      if (response.ok) {
        const data = await response.json()
        setWebhooks(data.webhooks || [])
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao carregar webhooks')
      }
    } catch (error) {
      toast.error('Erro ao carregar webhooks')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateWebhook() {
    if (!formUrl.trim()) {
      toast.error('URL é obrigatória')
      return
    }

    if (formEvents.length === 0) {
      toast.error('Selecione pelo menos um evento')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/v1/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: formUrl.trim(),
          description: formDescription.trim() || undefined,
          events: formEvents
        })
      })

      if (response.ok) {
        toast.success('Webhook criado com sucesso')
        setShowCreateDialog(false)
        resetForm()
        loadWebhooks()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao criar webhook')
      }
    } catch (error) {
      toast.error('Erro ao criar webhook')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteWebhook(id: string, url: string) {
    try {
      const response = await fetch(`/api/v1/webhooks/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Webhook deletado com sucesso')
        loadWebhooks()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao deletar webhook')
      }
    } catch (error) {
      toast.error('Erro ao deletar webhook')
    }
  }

  async function handleToggleWebhook(id: string, enabled: boolean) {
    try {
      const response = await fetch(`/api/v1/webhooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled })
      })

      if (response.ok) {
        toast.success(enabled ? 'Webhook desabilitado' : 'Webhook habilitado')
        loadWebhooks()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao atualizar webhook')
      }
    } catch (error) {
      toast.error('Erro ao atualizar webhook')
    }
  }

  async function handleViewSecret(id: string) {
    try {
      const response = await fetch(`/api/v1/webhooks/${id}`)
      if (response.ok) {
        const data = await response.json()
        setWebhookSecret(data.webhook.secret || 'Secret não disponível')
        setSelectedWebhook(id)
        setShowSecretDialog(true)
      } else {
        toast.error('Erro ao buscar secret')
      }
    } catch (error) {
      toast.error('Erro ao buscar secret')
    }
  }

  function toggleEvent(event: string) {
    setFormEvents(prev =>
      prev.includes(event)
        ? prev.filter(e => e !== event)
        : [...prev, event]
    )
  }

  function selectAllInCategory(events: { value: string }[]) {
    const eventValues = events.map(e => e.value)
    const allSelected = eventValues.every(e => formEvents.includes(e))

    if (allSelected) {
      setFormEvents(prev => prev.filter(e => !eventValues.includes(e)))
    } else {
      setFormEvents(prev => [...new Set([...prev, ...eventValues])])
    }
  }

  function resetForm() {
    setFormUrl('')
    setFormDescription('')
    setFormEvents([])
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copiado para área de transferência!')
    setTimeout(() => setCopied(false), 2000)
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString('pt-BR')
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/settings">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>
      <div className="flex items-center justify-between space-y-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">WEBHOOKS</h2>
          <p className="text-sm text-zinc-500">Gerencie webhooks para receber eventos em tempo real</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : (
        <div className="grid gap-6 max-w-5xl">
          <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500 ring-1 ring-white/5">
                  <Webhook className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Webhooks Configurados</CardTitle>
                  <CardDescription className="text-xs">Funcionalidade PRO</CardDescription>
                </div>
              </div>
              <Button onClick={() => setShowCreateDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Webhook
              </Button>
            </CardHeader>
            <CardContent>
              {webhooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                    <Webhook className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium">Nenhum webhook configurado</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Crie um webhook para receber eventos em tempo real no seu servidor.
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)} className="mt-4" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Webhook
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {webhooks.map((webhook) => (
                    <div
                      key={webhook.id}
                      className="flex items-start justify-between p-4 border border-zinc-200 dark:border-white/10 rounded-lg"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100 font-mono">
                            {webhook.url}
                          </span>
                          <Badge variant={webhook.enabled ? 'default' : 'secondary'}>
                            {webhook.enabled ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        {webhook.description && (
                          <p className="text-xs text-zinc-500">{webhook.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.map(event => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-4 mt-2 text-xs text-zinc-500">
                          <span>Criado: {formatDate(webhook.createdAt)}</span>
                          <span>Logs: {webhook._count.logs}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewSecret(webhook.id)}
                          title="Ver signing secret"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={webhook.enabled}
                          onCheckedChange={() => handleToggleWebhook(webhook.id, webhook.enabled)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget({ id: webhook.id, url: webhook.url })}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Como Usar Webhooks
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2">
              <p>• Configure um endpoint HTTPS em seu servidor para receber webhooks</p>
              <p>• Selecione os eventos que deseja receber (deals, contacts, etc.)</p>
              <p>• Use o signing secret para verificar a autenticidade das requisições</p>
              <p>• Webhooks são enviados automaticamente quando os eventos ocorrem</p>
              <p>• O sistema faz retry automático em caso de falha</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Webhook Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Webhook</DialogTitle>
            <DialogDescription>
              Configure um endpoint para receber eventos em tempo real
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="url">URL do Webhook *</Label>
              <Input
                id="url"
                placeholder="https://seu-servidor.com/webhooks"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Ex: Webhook de produção"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <Label>Eventos * (selecione pelo menos um)</Label>
              <div className="mt-2 space-y-4">
                {WEBHOOK_EVENT_CATEGORIES.map(category => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{category.category}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectAllInCategory(category.events)}
                      >
                        {category.events.every(e => formEvents.includes(e.value))
                          ? 'Desmarcar Todos'
                          : 'Selecionar Todos'}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {category.events.map(event => (
                        <label
                          key={event.value}
                          className="flex items-center space-x-2 text-sm cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formEvents.includes(event.value)}
                            onChange={() => toggleEvent(event.value)}
                            className="rounded"
                          />
                          <span>{event.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateWebhook} disabled={submitting}>
              {submitting ? 'Criando...' : 'Criar Webhook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Secret Dialog */}
      <Dialog open={showSecretDialog} onOpenChange={setShowSecretDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Webhook Signing Secret</DialogTitle>
            <DialogDescription>
              Use este secret para verificar a autenticidade das requisições
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <code className="text-sm font-mono break-all flex-1">{webhookSecret}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(webhookSecret)}
                  className="ml-2"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-3">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                Mantenha este secret seguro. Não compartilhe publicamente.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSecretDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Deletar webhook"
        description={`Tem certeza que deseja deletar o webhook para "${deleteTarget?.url}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Deletar"
        onConfirm={() => {
          if (deleteTarget) {
            handleDeleteWebhook(deleteTarget.id, deleteTarget.url)
            setDeleteTarget(null)
          }
        }}
      />
    </div>
  )
}
