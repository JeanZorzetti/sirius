import { Metadata } from 'next'
import Script from 'next/script'
import { CalculadoraROI } from '@/components/calculadora-roi'
import { getTranslations } from 'next-intl/server'
import { buildLocaleAlternates } from '@/lib/seo/canonical'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketing.ferramentas.calculadoraRoi.meta' })
  const alternates = buildLocaleAlternates(locale, '/ferramentas/calculadora-roi', '/tools/roi-calculator')
  return {
    title: t('title'),
    description: t('description'),
    alternates,
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: alternates.canonical,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('ogTitle'),
      description: t('ogDescription'),
    },
  }
}

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Início", "item": "https://siriuscrm.com.br" },
    { "@type": "ListItem", "position": 2, "name": "Ferramentas", "item": "https://siriuscrm.com.br/ferramentas" },
    { "@type": "ListItem", "position": 3, "name": "Calculadora de ROI", "item": "https://siriuscrm.com.br/ferramentas/calculadora-roi" },
  ]
}

export default function CalculadoraROIPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <Script id="breadcrumb-calculadora-roi" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-24">
        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 dark:from-white dark:via-zinc-100 dark:to-white bg-clip-text text-transparent">
            Quanto dinheiro você está{' '}
            <span className="text-red-600 dark:text-red-500">
              perdendo
            </span>{' '}
            todos os meses?
          </h1>
          <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Vendas desorganizadas custam caro. Nossa calculadora revela o{' '}
            <strong className="text-zinc-900 dark:text-white font-semibold">
              impacto financeiro real
            </strong>{' '}
            de leads perdidos no seu funil.
          </p>
        </div>

        {/* Calculadora */}
        <CalculadoraROI
          ctaText="Ver Como Organizar por R$ 67/mês"
          ctaHref="/vendas-automaticas"
        />

        {/* Social Proof / Trust Section */}
        <div className="max-w-4xl mx-auto mt-16 sm:mt-20">
          <div className="grid gap-8 sm:grid-cols-3 text-center">
            <div className="space-y-2">
              <div className="text-3xl sm:text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                +50
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Empresas organizando vendas
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl sm:text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                20%
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Aumento médio em conversão
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl sm:text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                R$ 67
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Investimento mensal
              </p>
            </div>
          </div>
        </div>

        {/* Benefits / Why This Matters */}
        <div className="max-w-3xl mx-auto mt-16 sm:mt-24">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-zinc-900 dark:text-white">
            Por que você está perdendo vendas?
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="p-6 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-zinc-900 dark:text-white">
                Leads esquecidos
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Sem acompanhamento, leads esfriam. Um CRM organizado garante que nenhum contato seja esquecido.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center mb-4">
                <span className="text-2xl">⏰</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-zinc-900 dark:text-white">
                Follow-up atrasado
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                A cada dia de atraso, sua chance de fechar negócio cai 80%. Automação é essencial.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-zinc-900 dark:text-white">
                Informações dispersas
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Planilhas, cadernos, WhatsApp... Quando os dados estão espalhados, a venda não acontece.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-zinc-900 dark:text-white">
                Falta de visibilidade
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Você não sabe onde estão seus gargalos. Com dados claros, você toma decisões melhores.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Preview */}
        <div className="max-w-2xl mx-auto mt-16 sm:mt-24 p-6 sm:p-8 rounded-2xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-xl font-bold mb-4 text-zinc-900 dark:text-white">
            Como funciona a calculadora?
          </h3>
          <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
            <p>
              <strong className="text-zinc-900 dark:text-white">1. Você informa seus dados atuais:</strong>{' '}
              volume de leads, ticket médio e taxa de conversão.
            </p>
            <p>
              <strong className="text-zinc-900 dark:text-white">2. Calculamos o cenário otimizado:</strong>{' '}
              Simulamos uma melhoria de 20% na sua taxa de conversão (resultado comum ao organizar vendas com um CRM).
            </p>
            <p>
              <strong className="text-zinc-900 dark:text-white">3. Mostramos a perda:</strong>{' '}
              A diferença entre o que você fatura hoje e o que poderia faturar é o dinheiro que está "vazando".
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
