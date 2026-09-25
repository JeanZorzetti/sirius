'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, RotateCcw, ChevronDown, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AgentOverride } from '@/lib/agaas-types'
import { toast } from 'sonner'

interface AgentEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agentId: string
  agentName: string
  agentDescription?: string
  defaultPrompt: string
  agentGradient?: string
  currentOverride?: AgentOverride
  onSaved: (agentId: string, override: AgentOverride | null) => void
}

export function AgentEditModal({
  open,
  onOpenChange,
  agentId,
  agentName,
  agentDescription,
  defaultPrompt,
  agentGradient = 'from-cyan-500 to-blue-500',
  currentOverride,
  onSaved,
}: AgentEditModalProps) {
  const tCommon = useTranslations('common')
  const [displayName, setDisplayName] = useState(currentOverride?.displayName ?? agentName)
  const [systemPrompt, setSystemPrompt] = useState(currentOverride?.systemPrompt ?? defaultPrompt)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [showDefaultPrompt, setShowDefaultPrompt] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const override: AgentOverride = {}
      const trimmedName = displayName.trim()
      const trimmedPrompt = systemPrompt.trim()
      if (trimmedName && trimmedName !== agentName) override.displayName = trimmedName
      if (trimmedPrompt && trimmedPrompt !== defaultPrompt) override.systemPrompt = trimmedPrompt

      const res = await fetch('/api/ia/agent-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, override }),
      })

      if (!res.ok) throw new Error()

      onSaved(agentId, override)
      onOpenChange(false)
      toast.success('Configurações salvas')
    } catch {
      toast.error('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    setResetting(true)
    try {
      const res = await fetch('/api/ia/agent-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, override: null }),
      })

      if (!res.ok) throw new Error()

      setDisplayName(agentName)
      setSystemPrompt(defaultPrompt)
      onSaved(agentId, null)
      onOpenChange(false)
      toast('Configurações restauradas ao padrão')
    } catch {
      toast.error('Erro ao restaurar. Tente novamente.')
    } finally {
      setResetting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-lg">
        <DialogHeader>
          {/* Gradient accent strip */}
          <div className={cn('h-1 w-full rounded-full bg-gradient-to-r mb-3', agentGradient)} />
          <DialogTitle className="text-zinc-100">{agentName}</DialogTitle>
          {agentDescription && (
            <DialogDescription className="text-zinc-500 text-xs mt-0.5">
              {agentDescription}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Display name */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Nome de exibição</Label>
            <Input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={agentName}
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-cyan-500"
            />
          </div>

          {/* System prompt */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Prompt do sistema</Label>
            <Textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              placeholder={defaultPrompt}
              rows={4}
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-cyan-500 resize-none text-sm"
            />

            {/* Default prompt toggle */}
            <button
              type="button"
              onClick={() => setShowDefaultPrompt(v => !v)}
              className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <ChevronDown className={cn('h-3 w-3 transition-transform duration-200', showDefaultPrompt && 'rotate-180')} />
              Ver prompt padrão
            </button>

            {showDefaultPrompt && (
              <pre className="text-xs text-zinc-500 bg-zinc-800/60 border border-zinc-700/30 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
                {defaultPrompt}
              </pre>
            )}
          </div>

          <p className="flex items-start gap-1.5 text-[11px] text-zinc-500">
            <Info className="h-3 w-3 mt-0.5 shrink-0" aria-hidden="true" />
            Toda ação deste agente passa pela sua aprovação no feed antes de sair ou de gravar no CRM.
          </p>
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={resetting || saving}
            className="text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 gap-1.5"
          >
            {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
            {tCommon('buttons.restore')}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="text-zinc-400 hover:bg-zinc-800"
            >
              {tCommon('buttons.cancel')}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold gap-1.5"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {tCommon('buttons.save')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
