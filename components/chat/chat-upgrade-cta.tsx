import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** Shown when the org's plan doesn't include the chat interface (server-renderable). */
export function ChatUpgradeCta() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-lg w-full space-y-6">
        {/* Aviso sobre banimentos Meta */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex gap-3">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div className="space-y-2">
              <p className="font-semibold text-amber-900 text-sm">
                Por que o WhatsApp mudou?
              </p>
              <p className="text-amber-800 text-sm leading-relaxed">
                A Meta está banindo números que utilizam APIs não oficiais do WhatsApp (como Evolution API, Baileys e similares). Para proteger seu negócio, o Sirius CRM migrou para a <strong>API Oficial do WhatsApp Business (Meta Cloud API)</strong> — a única integração permitida pelos Termos de Uso da Meta.
              </p>
              <a
                href="https://faq.whatsapp.com/5957850900902049"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-amber-700 underline underline-offset-2 hover:text-amber-900 transition-colors"
              >
                Fonte oficial: WhatsApp Help Center →
              </a>
            </div>
          </div>
        </div>

        {/* CTA upgrade */}
        <div className="rounded-xl border bg-card p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <MessageSquare className="h-6 w-6 text-green-600" />
          </div>
          <div className="space-y-1">
            <h2 className="font-semibold text-foreground">WhatsApp Oficial disponível no plano Business</h2>
            <p className="text-sm text-muted-foreground">
              Conecte seu número via API Oficial Meta, sem risco de banimento, com suporte a templates, mídia e status em tempo real.
            </p>
          </div>
          <Link href="/dashboard/billing/plans">
            <Button className="w-full">Fazer Upgrade para Business</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
