'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  planName: string
}

export function CancelSubscriptionButton({ planName }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/cancel', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Erro ao cancelar assinatura')
        return
      }

      toast.success('Assinatura cancelada. Seu plano foi revertido para Gratuito.')
      router.refresh()
    } catch {
      toast.error('Erro ao cancelar assinatura')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <XCircle className="w-4 h-4 mr-2" />
          Cancelar assinatura
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar plano {planName}?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              Ao confirmar, sua assinatura será cancelada imediatamente e o plano revertido para <strong>Gratuito</strong>.
            </span>
            <span className="block text-sm">
              Você perderá acesso a todos os recursos do plano {planName}: contatos extras, pipelines, automações e agentes IA.
            </span>
            <span className="block text-sm font-medium text-destructive">
              Esta ação não pode ser desfeita.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Manter assinatura</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Sim, cancelar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
