'use client'

import { useState } from 'react'
import { updateProfile } from '@/app/dashboard/settings/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

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
    } else {
      setAlert({ type: 'error', message: result.error || 'Erro ao atualizar perfil' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {alert && (
        <div
          className={`p-4 rounded-md ${
            alert.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {alert.message}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={initialData.name}
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={initialData.email}
          required
          disabled={loading}
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar Alterações'}
      </Button>
    </form>
  )
}
