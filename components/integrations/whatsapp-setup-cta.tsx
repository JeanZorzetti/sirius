'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageSquare, Wrench, CheckCircle2, Loader2, ExternalLink } from 'lucide-react'

interface WhatsAppSetupCtaProps {
  variant: 'top' | 'bottom'
  whatsappUrl: string
  setupPaid?: boolean
}

export function WhatsAppSetupCta({ variant, whatsappUrl, setupPaid }: WhatsAppSetupCtaProps) {
  const [loading, setLoading] = useState(false)

  async function handleCheckout() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'WHATSAPP_SETUP' }),
      })
      const data = await res.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch {
      setLoading(false)
    }
  }

  // Pós-pagamento: exibe painel de sucesso com link WhatsApp
  if (setupPaid) {
    return (
      <div className="max-w-2xl rounded-xl border border-green-300 dark:border-green-500/30 bg-green-50 dark:bg-green-500/5 p-6">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm font-semibold text-green-900 dark:text-green-300">
                Pagamento confirmado! Próximo passo: enviar suas informações
              </p>
              <p className="text-xs text-green-700/80 dark:text-green-400/80 mt-1 leading-relaxed">
                Clique no botão abaixo para abrir o WhatsApp com um formulário pré-preenchido. Nossa equipe entrará em contato em até 1 dia útil.
              </p>
            </div>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-2 shadow-sm">
                <MessageSquare className="h-4 w-4" />
                Enviar informações pelo WhatsApp
                <ExternalLink className="h-3 w-3 opacity-70" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'top') {
    return (
      <div className="max-w-2xl rounded-xl border border-green-200 dark:border-green-500/20 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-500/5 dark:to-emerald-500/5 p-5">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-green-500/15 flex items-center justify-center shrink-0">
            <Wrench className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-900 dark:text-green-300">
              Prefere que a gente configure para você?
            </p>
            <p className="text-xs text-green-700/80 dark:text-green-400/80 mt-1 leading-relaxed">
              A configuração da API Oficial envolve Meta Business Manager, Facebook Developers e tokens de sistema — pode ser complexo. Nossa equipe faz tudo por <strong>R$ 297</strong>, uma única vez.
            </p>
            <div className="mt-3">
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white gap-2 shadow-sm"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                {loading ? 'Aguarde...' : 'Contratar implantação — R$ 297'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const directWhatsappUrl = `https://wa.me/5562998015884?text=${encodeURIComponent('Olá! Tenho interesse na implantação do WhatsApp Oficial pelo Sirius CRM. Vi o guia de configuração e prefiro contratar o serviço — pode me passar os detalhes?')}`

  return (
    <div className="max-w-2xl rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02] p-5">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-white/5 flex items-center justify-center shrink-0">
          <Wrench className="h-5 w-5 text-zinc-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Ficou com dúvida ou não quer fazer sozinho?
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
            Nossa equipe assume a configuração completa. Você precisará de um <strong>chip de celular virgem</strong> (nunca conectado ao WhatsApp) e acesso ao Facebook da sua empresa. Cuidamos do resto.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <a href={directWhatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button
                size="sm"
                variant="outline"
                className="gap-2 border-zinc-300 dark:border-white/10 hover:border-green-500 hover:text-green-600 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                Falar com a equipe
              </Button>
            </a>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                Chip virgem nunca conectado ao WhatsApp
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                Acesso ao Facebook / Meta Business Manager
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                Pagamento único — sem mensalidade extra
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
