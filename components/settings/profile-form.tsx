'use client'

import { useState } from 'react'
import { updateProfile } from '@/app/dashboard/settings/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertCircle, Save } from 'lucide-react'

interface ProfileFormProps {
  initialData: {
    name: string
    email: string
  }
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setAlert(null)

    const formData = new FormData(e.currentTarget)
    const result = await updateProfile(formData)

    setLoading(false)

    if (result.success) {
      setAlert({ type: 'success', message: 'Perfil atualizado com sucesso!' })
      // Auto-dismiss after 3s
      setTimeout(() => setAlert(null), 3000)
    } else {
      setAlert({ type: 'error', message: result.error || 'Erro ao atualizar perfil' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {alert && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium ${alert.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
            }`}
        >
          {alert.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {alert.message}
        </div>
      )}

      <div className="grid gap-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-zinc-700 dark:text-zinc-300">Nome Completo</Label>
          <Input
            id="name"
            name="name"
            type="text"
            defaultValue={initialData.name}
            required
            disabled={loading}
            className="bg-white dark:bg-black/20 border-zinc-200 dark:border-white/10 focus:ring-indigo-500/20"
            placeholder="Seu nome"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={initialData.email}
            required
            disabled={loading}
            className="bg-white dark:bg-black/20 border-zinc-200 dark:border-white/10 focus:ring-indigo-500/20"
            placeholder="seu@email.com"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
        >
          {loading ? (
            <>Salvando...</>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              <span>Salvar Alterações</span>
            </div>
          )}
        </Button>
      </div>
    </form>
  )
}
