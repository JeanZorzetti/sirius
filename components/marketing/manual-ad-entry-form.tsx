'use client'

/**
 * ✅ FASE 17: Formulário de entrada manual de gasto em ads
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const SOURCES = [
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'facebook_ads', label: 'Meta Ads (Facebook/Instagram)' },
  { value: 'manual', label: 'Outro (manual)' },
]

export function ManualAdEntryForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({
    source: 'google_ads',
    date: new Date().toISOString().split('T')[0],
    campaignName: '',
    spend: '',
    impressions: '',
    clicks: '',
    conversions: '',
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.spend || parseFloat(form.spend) < 0) {
      toast.error('Informe um valor de gasto válido')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch('/api/ads/manual-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: form.source,
          date: form.date,
          campaignName: form.campaignName || form.source,
          spend: parseFloat(form.spend),
          impressions: parseInt(form.impressions || '0', 10),
          clicks: parseInt(form.clicks || '0', 10),
          conversions: parseInt(form.conversions || '0', 10),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao salvar')
      }

      toast.success('Gasto registrado!')
      setForm({
        source: 'google_ads',
        date: new Date().toISOString().split('T')[0],
        campaignName: '',
        spend: '',
        impressions: '',
        clicks: '',
        conversions: '',
      })
      setIsOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Registrar Gasto Manual</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Registre gastos em ads sem necessidade de conectar APIs
            </CardDescription>
          </div>
          <Button
            variant={isOpen ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setIsOpen(v => !v)}
            className="gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            {isOpen ? 'Fechar' : 'Novo Registro'}
          </Button>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <select
                  value={form.source}
                  onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  {SOURCES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entry-date">Data</Label>
                <Input
                  id="entry-date"
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-name">Nome da Campanha</Label>
              <Input
                id="campaign-name"
                placeholder="Ex: Black Friday 2026"
                value={form.campaignName}
                onChange={e => setForm(f => ({ ...f, campaignName: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spend">Gasto (R$) *</Label>
                <Input
                  id="spend"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={form.spend}
                  onChange={e => setForm(f => ({ ...f, spend: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="impressions">Impressões</Label>
                <Input
                  id="impressions"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.impressions}
                  onChange={e => setForm(f => ({ ...f, impressions: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clicks">Cliques</Label>
                <Input
                  id="clicks"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.clicks}
                  onChange={e => setForm(f => ({ ...f, clicks: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conversions">Conversões</Label>
                <Input
                  id="conversions"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.conversions}
                  onChange={e => setForm(f => ({ ...f, conversions: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      )}
    </Card>
  )
}
