'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Sliders, Clock, MessageSquare, Save, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function IASettings() {
  const [confidenceThreshold, setConfidenceThreshold] = useState(70)
  const [maxActionsPerDay, setMaxActionsPerDay] = useState(100)
  const [operatingHoursStart, setOperatingHoursStart] = useState('09:00')
  const [operatingHoursEnd, setOperatingHoursEnd] = useState('18:00')
  const [weekendsEnabled, setWeekendsEnabled] = useState(false)
  const [whatsappEnabled, setWhatsappEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [calendarEnabled, setCalendarEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load config from API
  useEffect(() => {
    fetch('/api/ia/settings')
      .then(r => r.json())
      .then(data => {
        const config = data.config || {}
        if (config.confidenceThreshold !== undefined) setConfidenceThreshold(config.confidenceThreshold)
        if (config.maxActionsPerDay !== undefined) setMaxActionsPerDay(config.maxActionsPerDay)
        if (config.operatingHoursStart) setOperatingHoursStart(config.operatingHoursStart)
        if (config.operatingHoursEnd) setOperatingHoursEnd(config.operatingHoursEnd)
        if (config.weekendsEnabled !== undefined) setWeekendsEnabled(config.weekendsEnabled)
        if (config.whatsappEnabled !== undefined) setWhatsappEnabled(config.whatsappEnabled)
        if (config.emailEnabled !== undefined) setEmailEnabled(config.emailEnabled)
        if (config.calendarEnabled !== undefined) setCalendarEnabled(config.calendarEnabled)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      // Load existing config to merge (preserve enabledAgents etc.)
      const res = await fetch('/api/ia/settings')
      const data = await res.json()
      const existingConfig = data.config || {}

      await fetch('/api/ia/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            ...existingConfig,
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
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // Silently fail
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
          {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <div className="space-y-6">
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
