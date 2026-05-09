'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface NewConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewConnectionDialog({ open, onOpenChange }: NewConnectionDialogProps) {
  const tCommon = useTranslations('common')
  const t = useTranslations('components.chat')
  const router = useRouter()
  const [instanceName, setInstanceName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!instanceName.trim()) {
      toast.error('Digite um nome para a conexão')
      return
    }

    // Validar formato (apenas letras, números e hífen)
    if (!/^[a-zA-Z0-9-]+$/.test(instanceName)) {
      toast.error('Use apenas letras, números e hífen no nome')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/whatsapp/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName: instanceName.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 403 && data.requiredTier) {
          toast.error('Faça upgrade para o plano PRO para usar o Chat Center')
          return
        }
        throw new Error(data.error || 'Erro ao criar conexão')
      }

      toast.success('Conexão criada! Escaneie o QR Code para conectar.')
      setInstanceName('')
      onOpenChange(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar conexão')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Conexão WhatsApp</DialogTitle>
          <DialogDescription>
            Crie uma nova conexão para conectar um número de WhatsApp ao CRM.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instanceName">Nome da Conexão</Label>
            <Input
              id="instanceName"
              placeholder="ex: vendas-01"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              disabled={isLoading}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              Use apenas letras, números e hífen. Exemplo: vendas-01, suporte-principal
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {tCommon('buttons.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Conexão
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
