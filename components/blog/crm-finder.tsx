'use client'

import { useState } from 'react'

const options = [
  {
    id: 'rep',
    label: '🏢 Representante Comercial / Distribuidor',
    title: 'Sirius CRM para Representantes Comerciais',
    desc: 'Alerta de ciclo de recompra, gestão de carteira, roteiro de visitas otimizado e app mobile completo.',
    url: '/solucoes/representantes-comerciais',
    btnColor: 'bg-blue-600 hover:bg-blue-700 text-white',
    borderColor: 'border-l-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    titleColor: 'text-blue-700 dark:text-blue-400',
  },
  {
    id: 'agencia',
    label: '📱 Agência de Marketing / Publicidade',
    title: 'Sirius CRM para Agências de Marketing',
    desc: 'Multi-pipeline por linha de serviço, colaboração em equipe, métricas de conversão por origem e proposta automatizada.',
    url: '/solucoes/agencias-de-marketing',
    btnColor: 'bg-violet-600 hover:bg-violet-700 text-white',
    borderColor: 'border-l-violet-500',
    bg: 'bg-violet-50 dark:bg-violet-950/20',
    titleColor: 'text-violet-700 dark:text-violet-400',
  },
  {
    id: 'imoveis',
    label: '🏠 Corretor de Imóveis / Imobiliária',
    title: 'Sirius CRM para Corretores de Imóveis',
    desc: 'Acompanhamento de interessados, histórico de visitas, projeção de comissões e follow-up no timing do ciclo imobiliário.',
    url: '/solucoes/corretores-de-imoveis',
    btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    borderColor: 'border-l-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    titleColor: 'text-emerald-700 dark:text-emerald-400',
  },
  {
    id: 'solar',
    label: '☀️ Empresa de Energia Solar',
    title: 'Sirius CRM para Energia Solar',
    desc: 'Follow-up automático de propostas, pipeline visual, alertas de deals esfriando e integração WhatsApp.',
    url: '/solucoes/empresas-de-energia-solar',
    btnColor: 'bg-amber-500 hover:bg-amber-600 text-white',
    borderColor: 'border-l-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    titleColor: 'text-amber-700 dark:text-amber-400',
  },
  {
    id: 'consultor',
    label: '💼 Consultor / Prestador de Serviços',
    title: 'Sirius CRM para Consultores',
    desc: 'Gestão de projetos e honorários, pipeline de propostas, histórico de diagnósticos e receita recorrente previsível.',
    url: '/solucoes/consultores-empresariais',
    btnColor: 'bg-red-600 hover:bg-red-700 text-white',
    borderColor: 'border-l-red-500',
    bg: 'bg-red-50 dark:bg-red-950/20',
    titleColor: 'text-red-700 dark:text-red-400',
  },
]

export function CRMFinder() {
  const [selected, setSelected] = useState<string | null>(null)
  const result = options.find((o) => o.id === selected)

  return (
    <div className="border-2 border-border rounded-xl p-6 my-8 bg-card not-prose">
      <h3 className="text-xl font-bold mb-2 text-foreground">🔍 CRM Finder: Qual Sistema é Ideal para Você?</h3>
      <p className="text-muted-foreground mb-6">
        Selecione seu tipo de negócio e descubra a solução certa.
      </p>

      {!result ? (
        <div className="space-y-3">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              className="w-full text-left bg-background border-2 border-border hover:border-primary px-4 py-3 rounded-lg transition-colors font-medium text-foreground"
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : (
        <div className={`border-l-4 ${result.borderColor} ${result.bg} p-5 rounded-r-xl`}>
          <p className={`font-bold text-lg mb-2 ${result.titleColor}`}>
            ✅ Recomendação: {result.title}
          </p>
          <p className="text-zinc-700 dark:text-zinc-300 mb-4">{result.desc}</p>
          <div className="flex gap-3 flex-wrap items-center">
            <a
              href={result.url}
              className={`inline-block ${result.btnColor} px-5 py-2.5 rounded-lg font-semibold text-sm no-underline transition-colors`}
            >
              Ver solução completa →
            </a>
            <a
              href="/register"
              className="inline-block bg-background border-2 border-border hover:border-primary px-5 py-2.5 rounded-lg font-semibold text-sm no-underline text-foreground transition-colors"
            >
              Começar grátis →
            </a>
            <button
              onClick={() => setSelected(null)}
              className="text-sm text-muted-foreground hover:text-foreground underline bg-transparent border-none cursor-pointer p-0"
            >
              ← Refazer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
