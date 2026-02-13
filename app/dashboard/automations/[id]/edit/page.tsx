'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// ============================================================================
// Types
// ============================================================================

type TriggerType = 'DEAL_CREATED' | 'DEAL_MOVED' | 'DEAL_WON' | 'DEAL_LOST' | 'DEAL_IDLE'

interface Stage {
  id: string
  name: string
  order: number
}

interface Pipeline {
  id: string
  name: string
  stages: Stage[]
}

interface Condition {
  field: string
  operator: string
  value: string
}

type ActionType = 'SEND_EMAIL' | 'NOTIFY_USER' | 'CREATE_TASK' | 'ADD_TAG' | 'SEND_WEBHOOK'

interface Action {
  type: ActionType
  config: Record<string, string>
}

// ============================================================================
// Constants
// ============================================================================

const TRIGGER_OPTIONS: { value: TriggerType; label: string }[] = [
  { value: 'DEAL_CREATED', label: 'Negócio criado' },
  { value: 'DEAL_MOVED', label: 'Negócio movido de etapa' },
  { value: 'DEAL_WON', label: 'Negócio ganho' },
  { value: 'DEAL_LOST', label: 'Negócio perdido' },
  { value: 'DEAL_IDLE', label: 'Negócio parado (sem atividade)' }
]

const CONDITION_FIELDS = [
  { value: 'value', label: 'Valor do negócio' },
  { value: 'stageId', label: 'Etapa atual' },
  { value: 'pipelineId', label: 'Pipeline' },
  { value: 'title', label: 'Título do negócio' }
]

const CONDITION_OPERATORS = [
  { value: 'equals', label: 'igual a' },
  { value: 'not_equals', label: 'diferente de' },
  { value: 'greater_than', label: 'maior que' },
  { value: 'less_than', label: 'menor que' },
  { value: 'contains', label: 'contém' }
]

const ACTION_OPTIONS: { value: ActionType; label: string }[] = [
  { value: 'SEND_EMAIL', label: 'Enviar email' },
  { value: 'NOTIFY_USER', label: 'Notificar usuário' },
  { value: 'CREATE_TASK', label: 'Criar tarefa' },
  { value: 'ADD_TAG', label: 'Adicionar tag' },
  { value: 'SEND_WEBHOOK', label: 'Enviar webhook' }
]

// ============================================================================
// Main Component
// ============================================================================

export default function EditAutomationPage() {
  const router = useRouter()
  const params = useParams()
  const automationId = params.id as string

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [name, setName] = useState('')
  const [triggerType, setTriggerType] = useState<TriggerType>('DEAL_CREATED')
  const [toStageId, setToStageId] = useState('')
  const [idleDays, setIdleDays] = useState('3')
  const [conditions, setConditions] = useState<Condition[]>([])
  const [actions, setActions] = useState<Action[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load existing automation data
  useEffect(() => {
    fetch(`/api/automations/${automationId}`)
      .then(r => r.json())
      .then(data => {
        if (data.automation) {
          const a = data.automation
          setName(a.name || '')
          setTriggerType(a.triggerType || 'DEAL_CREATED')

          const config = a.triggerConfig || {}
          if (config.toStageId) setToStageId(config.toStageId)
          if (config.idleDays) setIdleDays(String(config.idleDays))

          setConditions((a.conditions || []).map((c: any) => ({
            field: c.field || 'value',
            operator: c.operator || 'equals',
            value: String(c.value || '')
          })))

          setActions((a.actions || []).map((ac: any) => ({
            type: ac.type as ActionType,
            config: Object.fromEntries(
              Object.entries(ac.config || {}).map(([k, v]) => [k, String(v)])
            )
          })))
        }
        setIsFetching(false)
      })
      .catch(() => {
        setError('Falha ao carregar automação')
        setIsFetching(false)
      })

    fetch('/api/automations/stages')
      .then(r => r.json())
      .then(data => {
        if (data.pipelines) setPipelines(data.pipelines)
      })
      .catch(() => {})
  }, [automationId])

  // --------------------------------------------------------
  // Conditions helpers
  // --------------------------------------------------------
  function addCondition() {
    setConditions(prev => [...prev, { field: 'value', operator: 'greater_than', value: '' }])
  }

  function updateCondition(index: number, key: keyof Condition, val: string) {
    setConditions(prev => prev.map((c, i) => (i === index ? { ...c, [key]: val } : c)))
  }

  function removeCondition(index: number) {
    setConditions(prev => prev.filter((_, i) => i !== index))
  }

  // --------------------------------------------------------
  // Actions helpers
  // --------------------------------------------------------
  function addAction() {
    setActions(prev => [...prev, { type: 'SEND_EMAIL', config: { subject: '', body: '' } }])
  }

  function updateActionType(index: number, type: ActionType) {
    const defaultConfigs: Record<ActionType, Record<string, string>> = {
      SEND_EMAIL: { subject: '', body: '' },
      NOTIFY_USER: { message: '' },
      CREATE_TASK: { taskTitle: '' },
      ADD_TAG: { tagName: '' },
      SEND_WEBHOOK: { webhookUrl: '' }
    }
    setActions(prev =>
      prev.map((a, i) => (i === index ? { type, config: defaultConfigs[type] } : a))
    )
  }

  function updateActionConfig(index: number, key: string, val: string) {
    setActions(prev =>
      prev.map((a, i) => (i === index ? { ...a, config: { ...a.config, [key]: val } } : a))
    )
  }

  function removeAction(index: number) {
    setActions(prev => prev.filter((_, i) => i !== index))
  }

  // --------------------------------------------------------
  // Save
  // --------------------------------------------------------
  async function handleSave() {
    if (!name.trim()) {
      setError('O nome da automação é obrigatório.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const triggerConfig: Record<string, unknown> = {}
      if (triggerType === 'DEAL_MOVED' && toStageId) {
        triggerConfig.toStageId = toStageId
      }
      if (triggerType === 'DEAL_IDLE') {
        triggerConfig.idleDays = parseInt(idleDays, 10) || 3
      }

      const response = await fetch(`/api/automations/${automationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          triggerType,
          triggerConfig,
          conditions,
          actions
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar automação')
      }

      router.push('/dashboard/automations')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }

  // --------------------------------------------------------
  // Step indicator
  // --------------------------------------------------------
  function StepIndicator() {
    const steps = [
      { num: 1, label: 'Gatilho' },
      { num: 2, label: 'Condições' },
      { num: 3, label: 'Ações' }
    ]
    return (
      <div className="flex items-center gap-2 mb-6">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <button
              type="button"
              onClick={() => setStep(s.num as 1 | 2 | 3)}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                step === s.num
                  ? 'bg-primary text-primary-foreground'
                  : step > s.num
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {s.num}
            </button>
            <span className="ml-2 text-sm text-muted-foreground hidden sm:inline">{s.label}</span>
            {i < steps.length - 1 && (
              <div className="w-8 h-px bg-border mx-2" />
            )}
          </div>
        ))}
      </div>
    )
  }

  // ============================================================
  // Render
  // ============================================================

  if (isFetching) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Carregando automação...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Automação</h1>
        <p className="text-muted-foreground mt-1">
          Atualize a configuração da automação.
        </p>
      </div>

      <StepIndicator />

      {/* ---- STEP 1: Trigger ---- */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Passo 1 — Gatilho</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trigger">Quando isso acontecer:</Label>
              <select
                id="trigger"
                value={triggerType}
                onChange={e => setTriggerType(e.target.value as TriggerType)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {TRIGGER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {triggerType === 'DEAL_MOVED' && (
              <div className="space-y-2">
                <Label htmlFor="toStageId">Para qual etapa? (opcional — vazio = qualquer etapa)</Label>
                <select
                  id="toStageId"
                  value={toStageId}
                  onChange={e => setToStageId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Qualquer etapa</option>
                  {pipelines.map(pipeline =>
                    pipeline.stages.map(stage => (
                      <option key={stage.id} value={stage.id}>
                        {pipeline.name} — {stage.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            {triggerType === 'DEAL_IDLE' && (
              <div className="space-y-2">
                <Label htmlFor="idleDays">Após quantos dias sem atividade?</Label>
                <Input
                  id="idleDays"
                  type="number"
                  min="1"
                  value={idleDays}
                  onChange={e => setIdleDays(e.target.value)}
                  className="w-32"
                />
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)}>Continuar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---- STEP 2: Conditions ---- */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Passo 2 — Condições (opcional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Adicione filtros para que a automação só execute quando as condições forem atendidas.
            </p>

            {conditions.map((condition, i) => (
              <div key={i} className="flex items-center gap-2 flex-wrap">
                <select
                  value={condition.field}
                  onChange={e => updateCondition(i, 'field', e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {CONDITION_FIELDS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>

                <select
                  value={condition.operator}
                  onChange={e => updateCondition(i, 'operator', e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {CONDITION_OPERATORS.map(op => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>

                <Input
                  placeholder="Valor"
                  value={condition.value}
                  onChange={e => updateCondition(i, 'value', e.target.value)}
                  className="w-40"
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeCondition(i)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remover
                </Button>
              </div>
            ))}

            <Button type="button" variant="outline" size="sm" onClick={addCondition}>
              + Adicionar condição
            </Button>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
              <Button onClick={() => setStep(3)}>Continuar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---- STEP 3: Actions + Name + Save ---- */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Passo 3 — Ações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Defina o que deve acontecer quando o gatilho for ativado.
              Variáveis disponíveis: <code className="text-xs bg-muted px-1 rounded">{'{{dealTitle}}'}</code>{' '}
              <code className="text-xs bg-muted px-1 rounded">{'{{dealValue}}'}</code>{' '}
              <code className="text-xs bg-muted px-1 rounded">{'{{dealId}}'}</code>
            </p>

            {actions.map((action, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <select
                    value={action.type}
                    onChange={e => updateActionType(i, e.target.value as ActionType)}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {ACTION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeAction(i)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remover
                  </Button>
                </div>

                {action.type === 'SEND_EMAIL' && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Assunto do email"
                      value={action.config.subject || ''}
                      onChange={e => updateActionConfig(i, 'subject', e.target.value)}
                    />
                    <textarea
                      placeholder="Corpo do email"
                      value={action.config.body || ''}
                      onChange={e => updateActionConfig(i, 'body', e.target.value)}
                      rows={4}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>
                )}

                {action.type === 'NOTIFY_USER' && (
                  <Input
                    placeholder="Mensagem da notificação"
                    value={action.config.message || ''}
                    onChange={e => updateActionConfig(i, 'message', e.target.value)}
                  />
                )}

                {action.type === 'CREATE_TASK' && (
                  <Input
                    placeholder="Título da tarefa"
                    value={action.config.taskTitle || ''}
                    onChange={e => updateActionConfig(i, 'taskTitle', e.target.value)}
                  />
                )}

                {action.type === 'ADD_TAG' && (
                  <Input
                    placeholder="Nome da tag"
                    value={action.config.tagName || ''}
                    onChange={e => updateActionConfig(i, 'tagName', e.target.value)}
                  />
                )}

                {action.type === 'SEND_WEBHOOK' && (
                  <Input
                    placeholder="URL do webhook (https://...)"
                    type="url"
                    value={action.config.webhookUrl || ''}
                    onChange={e => updateActionConfig(i, 'webhookUrl', e.target.value)}
                  />
                )}
              </div>
            ))}

            <Button type="button" variant="outline" size="sm" onClick={addAction}>
              + Adicionar ação
            </Button>

            <div className="space-y-2 pt-2">
              <Label htmlFor="name">Nome da automação *</Label>
              <Input
                id="name"
                placeholder="Ex: Notificar quando negócio for ganho"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
