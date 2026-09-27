import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** Shown when the account has no paid plan: the chat is on every paid plan, from Starter (spec 012, US1-7). */
export function ChatUpgradeCta() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-lg w-full rounded-xl border bg-card p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <MessageSquare className="h-6 w-6 text-green-700" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h2 className="font-semibold text-foreground">Converse com seus clientes pelo WhatsApp, dentro do Sirius</h2>
          <p className="text-sm text-muted-foreground">
            As mensagens chegam no inbox, ficam ligadas ao contato e ao negócio, e a equipe responde do mesmo lugar.
            Conecte o número pelo integrador que você já usa (Z-API, uazapi ou Evolution API).
          </p>
          <p className="text-sm text-muted-foreground">
            Está nos planos pagos a partir do Starter: 1 número no Starter, 2 no Pro e 5 no Business, que também tem a API oficial da Meta.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/dashboard/billing/plans">Ver planos</Link>
        </Button>
      </div>
    </div>
  )
}
