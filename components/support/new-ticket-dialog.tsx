'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

const CATEGORIES = [
  { value: 'QUESTION', label: 'Dúvida' },
  { value: 'BUG', label: 'Bug / Problema' },
  { value: 'FEATURE_REQUEST', label: 'Sugestão de melhoria' },
  { value: 'BILLING', label: 'Financeiro / Cobrança' },
  { value: 'ONBOARDING', label: 'Onboarding / Configuração' },
  { value: 'OTHER', label: 'Outro' },
]

const PRIORITIES = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'LOW', label: 'Baixa' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
]

export function NewTicketDialog() {
  const tCommon = useTranslations('common')
  const t = useTranslations('components.support')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    subject: '',
    description: '',
    category: 'QUESTION',
    priority: 'NORMAL',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (form.subject.trim().length < 5) {
      toast.error('Assunto deve ter pelo menos 5 caracteres')
      return
    }
    if (form.description.trim().length < 10) {
      toast.error('Descrição deve ter pelo menos 10 caracteres')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Erro ao criar ticket')
        return
      }

      toast.success(t('createSuccess'))
      setOpen(false)
      setForm({ subject: '', description: '', category: 'QUESTION', priority: 'NORMAL' })
      router.push(`/dashboard/support/${data.ticket.id}`)
    } catch {
      toast.error('Erro ao criar ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          {t('newTicket')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Abrir Ticket de Suporte</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              placeholder="Ex: Não consigo importar contatos do CSV"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              maxLength={200}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              placeholder="Descreva o problema em detalhes. Inclua passos para reproduzir, comportamento esperado vs atual, e qualquer mensagem de erro."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={5}
              maxLength={5000}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground text-right">
              {form.description.length}/5000
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              {tCommon('buttons.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('createTicket')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
