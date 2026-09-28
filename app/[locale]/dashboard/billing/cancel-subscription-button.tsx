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
  /** Spec 013: within 7 days of the first charge, cancelling is a withdrawal with a full refund (CDC art. 49). */
  emArrependimento: boolean
  /** End of the paid period (ISO), when known. */
  fimDoPeriodo: string | null
}

const dataBR = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
const reais = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function CancelSubscriptionButton({ planName, emArrependimento, fimDoPeriodo }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/cancel', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Não conseguimos cancelar agora. Tente de novo em instantes.')
        return
      }

      if (data.refunded != null) {
        toast.success(`Desistência registrada. Estornamos ${reais(data.refunded)} no seu meio de pagamento.`)
      } else if (data.accessUntil) {
        toast.success(`Cancelamento agendado. Seu plano ${planName} continua até ${dataBR(data.accessUntil)}.`)
      } else {
        toast.success('Assinatura cancelada.')
      }
      router.refresh()
    } catch {
      toast.error('Não conseguimos cancelar agora. Tente de novo em instantes.')
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
          <AlertDialogTitle>Cancelar o plano {planName}?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            {emArrependimento ? (
              <>
                <span className="block">
                  Você está nos 7 dias de arrependimento. Devolvemos <strong>todo o valor pago</strong> e o plano {planName} termina agora.
                </span>
                <span className="block text-sm">
                  A conta passa para somente leitura: você vê seus dados, mas não cria nem edita. Nada é apagado.
                </span>
              </>
            ) : (
              <>
                <span className="block">
                  Seu plano {planName} continua ativo{fimDoPeriodo ? <> até <strong>{dataBR(fimDoPeriodo)}</strong></> : ' até o fim do período pago'}, e não haverá nova cobrança.
                </span>
                <span className="block text-sm">
                  Depois dessa data, a conta passa para somente leitura: você vê seus dados, mas não cria nem edita. Nada é apagado.
                </span>
                <span className="block text-sm">Até lá, você pode manter a assinatura com um clique.</span>
              </>
            )}
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
            {emArrependimento ? 'Desistir e receber o reembolso' : 'Cancelar assinatura'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Undoes a cancellation scheduled for the end of the period. */
export function KeepSubscriptionButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleKeep = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/cancel', { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Não conseguimos manter a assinatura agora. Tente de novo em instantes.')
        return
      }
      toast.success('Assinatura mantida. A renovação continua normalmente.')
      router.refresh()
    } catch {
      toast.error('Não conseguimos manter a assinatura agora. Tente de novo em instantes.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button size="sm" onClick={handleKeep} disabled={loading}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
      Manter assinatura
    </Button>
  )
}
