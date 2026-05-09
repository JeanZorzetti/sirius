'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Shield, Sliders, Clock, MessageSquare, Save, Loader2, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { toast } from 'sonner'

interface QuotaInfo {
  tier: string
  quota: number
  used: number
  remaining: number
  agentLimit: number
  resetsAt: string | null
}

const TIER_LABELS: Record<string, string> = {
  FREE: 'Free',
  STARTER: 'Starter',
  PRO: 'Pro',
  BUSINESS: 'Business',
}

export function IASettings() {
  const tCommon = useTranslations('common')
  const [confidenceThreshold, setConfidenceThreshold] = useState(70)
  const [maxActionsPerDay, setMaxActionsPerDay] = useState(100)
  const [operatingHoursStart, setOperatingHoursStart] = useState('09:00')
  const [operatingHoursEnd, setOperatingHoursEnd] = useState('18:00')
  const [weekendsEnabled, setWeekendsEnabled] = useState(false)
  const [whatsappEnabled, setWhatsappEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [calendarEnabled, setCalendarEnabled] = useState(true)
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  // Keep a ref to the full config so we can merge on save without a second GET
  const existingConfigRef = useRef<Record<string, unknown>>({})

  // Load config + quota from API
  useEffect(() => {
    Promise.all([
      fetch('/api/ia/settings').then(r => r.json()),
      fetch('/api/ia/quota').then(r => r.json()),
    ])
      .then(([settingsData, quotaData]) => {
        const config = settingsData.config || {}
        existingConfigRef.current = config
        if (config.confidenceThreshold !== undefined) setConfidenceThreshold(config.confidenceThreshold)
        if (config.maxActionsPerDay !== undefined) setMaxActionsPerDay(config.maxActionsPerDay)
        if (config.operatingHoursStart) setOperatingHoursStart(config.operatingHoursStart)
        if (config.operatingHoursEnd) setOperatingHoursEnd(config.operatingHoursEnd)
        if (config.weekendsEnabled !== undefined) setWeekendsEnabled(config.weekendsEnabled)
        if (config.whatsappEnabled !== undefined) setWhatsappEnabled(config.whatsappEnabled)
        if (config.emailEnabled !== undefined) setEmailEnabled(config.emailEnabled)
        if (config.calendarEnabled !== undefined) setCalendarEnabled(config.calendarEnabled)
        setQuotaInfo(quotaData)
      })
      .catch(() => {
        toast.error('Erro ao carregar configurações.')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/ia/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            ...existingConfigRef.current,
            confidenceThreshold,
            maxActionsPerDay,
            operatingHoursStart,
            operatingHoursEnd,
            weekendsEnabled,
            whatsappEnabled,
            emailEnabled,
            calendarEnabled,
          }
        })
      })
      if (!res.ok) throw new Error()
      existingConfigRef.current = {
        ...existingConfigRef.current,
        confidenceThreshold,
        maxActionsPerDay,
        operatingHoursStart,
        operatingHoursEnd,
        weekendsEnabled,
        whatsappEnabled,
        emailEnabled,
        calendarEnabled,
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      toast.success('Configurações salvas')
    } catch {
      toast.error('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 text-zinc-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Configurações</h1>
          <p className="text-sm text-zinc-500 mt-1">Controle como os agentes operam</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            saved
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 disabled:opacity-50'
          )}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saved ? tCommon('toasts.saved') : saving ? tCommon('buttons.saving') : tCommon('buttons.save')}
        </button>
      </div>

      <div className="space-y-6">
        {/* Usage badge */}
        {quotaInfo && quotaInfo.quota !== 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-zinc-200">Uso Mensal</h3>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-400">
                <span className="text-zinc-200 font-semibold">{TIER_LABELS[quotaInfo.tier]}</span>
                {quotaInfo.quota === -1
                  ? ` — ${quotaInfo.used} ações este mês — Ilimitado`
                  : ` — ${quotaInfo.used} / ${quotaInfo.quota} ações este mês`
                }
              </span>
              {quotaInfo.resetsAt && quotaInfo.quota !== -1 && (
                <span className="text-[10px] text-zinc-600">
                  Renova em {Math.max(0, Math.ceil((new Date(quotaInfo.resetsAt).getTime() - Date.now()) / 86400000))} dias
                </span>
              )}
            </div>
            {quotaInfo.quota !== -1 && (
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    quotaInfo.used / quotaInfo.quota > 0.9
                      ? 'bg-red-500'
                      : quotaInfo.used / quotaInfo.quota > 0.7
                        ? 'bg-amber-500'
                        : 'bg-cyan-500'
                  )}
                  style={{ width: `${Math.min(100, (quotaInfo.used / quotaInfo.quota) * 100)}%` }}
                />
              </div>
            )}
            {quotaInfo.quota !== -1 && quotaInfo.used >= quotaInfo.quota && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-red-400">Cota esgotada. Agentes pausados até renovação.</span>
                <Link
                  href="/dashboard/billing/plans"
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                >
                  Upgrade
                </Link>
              </div>
            )}
          </motion.div>
        )}

        {/* Approval threshold */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-zinc-200">Threshold de Confiança</h3>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            Ações com confiança abaixo deste valor requerem aprovação humana antes de serem executadas.
          </p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={30}
              max={95}
              step={5}
              value={confidenceThreshold}
              onChange={e => setConfidenceThreshold(Number(e.target.value))}
              className="flex-1 h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-amber-400"
            />
            <span className={cn(
              'text-lg font-bold font-mono tabular-nums w-14 text-right',
              confidenceThreshold >= 80 ? 'text-emerald-400' :
              confidenceThreshold >= 60 ? 'text-amber-400' :
              'text-red-400'
            )}>
              {confidenceThreshold}%
            </span>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-zinc-600">Mais autônomo</span>
            <span className="text-[10px] text-zinc-600">Mais supervisão</span>
          </div>
        </motion.div>

        {/* Daily limits */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-zinc-200">Limites Diários</h3>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            Número máximo de ações autônomas que os agentes podem executar por dia.
          </p>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min={10}
              max={1000}
              step={10}
              value={maxActionsPerDay}
              onChange={e => setMaxActionsPerDay(Number(e.target.value))}
              className="w-24 rounded-lg border border-zinc-700/50 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-200 font-mono text-center focus:outline-none focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/20"
            />
            <span className="text-xs text-zinc-500">ações / dia</span>
          </div>
        </motion.div>

        {/* Operating hours */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-zinc-200">Horário de Operação</h3>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            Os agentes só executam ações autônomas durante este horário.
          </p>
          <div className="flex items-center gap-3 mb-3">
            <input
              type="time"
              value={operatingHoursStart}
              onChange={e => setOperatingHoursStart(e.target.value)}
              className="rounded-lg border border-zinc-700/50 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-200 font-mono focus:outline-none focus:border-violet-500/30 focus:ring-1 focus:ring-violet-500/20"
            />
            <span className="text-xs text-zinc-500">até</span>
            <input
              type="time"
              value={operatingHoursEnd}
              onChange={e => setOperatingHoursEnd(e.target.value)}
              className="rounded-lg border border-zinc-700/50 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-200 font-mono focus:outline-none focus:border-violet-500/30 focus:ring-1 focus:ring-violet-500/20"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={weekendsEnabled}
              onChange={e => setWeekendsEnabled(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-800 text-violet-500 focus:ring-violet-500/20"
            />
            <span className="text-xs text-zinc-400">Operar nos finais de semana</span>
          </label>
        </motion.div>

        {/* Channels */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-200">Canais Permitidos</h3>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            Selecione quais canais os agentes podem usar para executar ações.
          </p>
          <div className="space-y-2">
            {[
              { key: 'whatsapp', label: 'WhatsApp', value: whatsappEnabled, set: setWhatsappEnabled },
              { key: 'email', label: 'Email', value: emailEnabled, set: setEmailEnabled },
              { key: 'calendar', label: 'Google Calendar', value: calendarEnabled, set: setCalendarEnabled },
            ].map(ch => (
              <label key={ch.key} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-800/30 cursor-pointer transition-colors">
                <span className="text-sm text-zinc-300">{ch.label}</span>
                <input
                  type="checkbox"
                  checked={ch.value}
                  onChange={e => ch.set(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500/20"
                />
              </label>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
