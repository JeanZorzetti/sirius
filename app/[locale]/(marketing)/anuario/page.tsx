import { Metadata } from 'next'
import Script from 'next/script'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { buildLocaleAlternates, DEFAULT_OG_IMAGES } from '@/lib/seo/canonical'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketing.anuario.meta' })
  const alternates = buildLocaleAlternates(locale, '/anuario', '/yearbook')
  return {
    title: t('title'),
    description: t('description'),
    alternates,
    openGraph: {
      images: DEFAULT_OG_IMAGES,
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

const datasetSchema = {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  name: 'Anuário do Vendedor B2B Brasileiro 2026',
  description: 'Dados sobre ciclo de venda, conversão e produtividade de +127 empresas B2B brasileiras que utilizam o Sirius CRM',
  url: 'https://siriuscrm.com.br/anuario',
  creator: {
    '@type': 'Organization',
    name: 'Sirius CRM / ROI Labs',
    url: 'https://siriuscrm.com.br',
  },
  datePublished: '2026-03-21',
  dateModified: '2026-03-21',
  license: 'https://creativecommons.org/licenses/by/4.0/',
  keywords: ['vendas B2B', 'CRM', 'representante comercial', 'taxa de conversão', 'ciclo de venda', 'Brasil', '2026'],
  spatialCoverage: 'Brasil',
  temporalCoverage: '2025/2026',
  measurementTechnique: 'Dados anonimizados de usuários Sirius CRM',
  variableMeasured: ['taxa de conversão', 'ciclo médio de venda', 'produtividade'],
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Início',
      item: 'https://siriuscrm.com.br',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Anuário 2026',
      item: 'https://siriuscrm.com.br/anuario',
    },
  ],
}

export default function AnuarioPage() {
  return (
    <>
      <Script
        id="dataset-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main className="min-h-screen">

        {/* Breadcrumb */}
        <div className="border-b border-border bg-muted">
          <div className="mx-auto max-w-5xl px-4 py-3">
            <nav aria-label="Navegação" className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">Início</Link>
              <span>/</span>
              <span className="text-foreground">Anuário 2026</span>
            </nav>
          </div>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 opacity-80" />
          <div className="relative mx-auto max-w-5xl px-4 py-20 text-center">
            <div className="inline-flex items-center gap-2 rounded border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground mb-6">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Dados proprietários — atualizado em março de 2026
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl mb-6">
              Anuário do Vendedor<br />
              <span className="    ">
                B2B Brasileiro 2026
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-4">
              Dados proprietários de <strong className="text-foreground">+127 empresas</strong> que usam o Sirius CRM — ciclo médio de venda, taxa de conversão, impacto da IA e benchmarks por setor no Brasil.
            </p>
            <p className="text-sm text-muted-foreground">
              Período de coleta: janeiro 2025 a março 2026 · Dados anonimizados · Licença CC BY 4.0
            </p>
          </div>
        </section>

        {/* Destaques rápidos */}
        <section className="border-b border-border bg-muted">
          <div className="mx-auto max-w-5xl px-4 py-10">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-muted p-5 text-center">
                <p className="text-3xl font-extrabold text-muted-foreground">-26%</p>
                <p className="mt-1 text-sm text-muted-foreground">Ciclo de venda<br />com Sirius CRM</p>
              </div>
              <div className="rounded-xl border border-border bg-muted p-5 text-center">
                <p className="text-3xl font-extrabold text-muted-foreground">+75%</p>
                <p className="mt-1 text-sm text-muted-foreground">Taxa de conversão<br />lead → cliente</p>
              </div>
              <div className="rounded-xl border border-border bg-muted p-5 text-center">
                <p className="text-3xl font-extrabold text-muted-foreground">-62%</p>
                <p className="mt-1 text-sm text-muted-foreground">Horas/semana<br />em tarefas admin</p>
              </div>
              <div className="rounded-xl border border-border bg-muted p-5 text-center">
                <p className="text-3xl font-extrabold text-muted-foreground">+43%</p>
                <p className="mt-1 text-sm text-muted-foreground">Leads qualificados<br />por hora (com IA)</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 py-12 space-y-16">

          {/* Seção 1: Benchmarks Gerais */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-2">Benchmarks Gerais: Mercado vs Sirius CRM</h2>
            <p className="text-muted-foreground mb-6">
              Comparativo entre a média do mercado B2B brasileiro e os resultados medidos em empresas que utilizam o Sirius CRM. Dados coletados de janeiro de 2025 a março de 2026.
            </p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted text-muted-foreground">
                    <th className="px-5 py-3.5 text-left font-semibold border-b border-border">Métrica</th>
                    <th className="px-5 py-3.5 text-center font-semibold border-b border-border">Média do Mercado</th>
                    <th className="px-5 py-3.5 text-center font-semibold border-b border-border">Com Sirius CRM</th>
                    <th className="px-5 py-3.5 text-center font-semibold border-b border-border">Melhoria</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border bg-muted hover:bg-muted transition-colors">
                    <td className="px-5 py-4 font-medium text-foreground">Ciclo médio de venda</td>
                    <td className="px-5 py-4 text-center text-muted-foreground">23 dias</td>
                    <td className="px-5 py-4 text-center text-muted-foreground font-semibold">17 dias</td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center rounded bg-muted border border-border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">-26%</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted transition-colors">
                    <td className="px-5 py-4 font-medium text-foreground">Taxa de conversão lead → cliente</td>
                    <td className="px-5 py-4 text-center text-muted-foreground">8%</td>
                    <td className="px-5 py-4 text-center text-muted-foreground font-semibold">14%</td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center rounded bg-muted border border-border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">+75%</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border bg-muted hover:bg-muted transition-colors">
                    <td className="px-5 py-4 font-medium text-foreground">Horas/semana em tarefas administrativas</td>
                    <td className="px-5 py-4 text-center text-muted-foreground">8h</td>
                    <td className="px-5 py-4 text-center text-muted-foreground font-semibold">3h</td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center rounded bg-muted border border-border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">-62%</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted transition-colors">
                    <td className="px-5 py-4 font-medium text-foreground">Follow-ups até fechamento</td>
                    <td className="px-5 py-4 text-center text-muted-foreground">5 tentativas</td>
                    <td className="px-5 py-4 text-center text-muted-foreground font-semibold">3 tentativas</td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center rounded bg-muted border border-border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">-40%</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted transition-colors">
                    <td className="px-5 py-4 font-medium text-foreground">Taxa de abandono de funil</td>
                    <td className="px-5 py-4 text-center text-muted-foreground">67%</td>
                    <td className="px-5 py-4 text-center text-muted-foreground font-semibold">48%</td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center rounded bg-muted border border-border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">-28%</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Fonte: Sirius CRM / ROI Labs — análise de +127 empresas B2B brasileiras. Período: jan/2025–mar/2026. Dados anonimizados.
            </p>
          </section>

          {/* Seção 2: Benchmarks por Setor */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-2">Benchmarks por Setor no Brasil</h2>
            <p className="text-muted-foreground mb-6">
              Taxa de fechamento, ciclo médio de venda e deal size médio segmentados por setor de atuação das empresas participantes da pesquisa.
            </p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted text-muted-foreground">
                    <th className="px-5 py-3.5 text-left font-semibold border-b border-border">Setor</th>
                    <th className="px-5 py-3.5 text-center font-semibold border-b border-border">Taxa de Fechamento</th>
                    <th className="px-5 py-3.5 text-center font-semibold border-b border-border">Ciclo Médio</th>
                    <th className="px-5 py-3.5 text-center font-semibold border-b border-border">Deal Size Médio</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border bg-muted hover:bg-muted transition-colors">
                    <td className="px-5 py-4 font-medium text-foreground">Representação Comercial</td>
                    <td className="px-5 py-4 text-center text-muted-foreground font-semibold">18%</td>
                    <td className="px-5 py-4 text-center text-muted-foreground">19 dias</td>
                    <td className="px-5 py-4 text-center text-muted-foreground">R$ 4.200</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted transition-colors">
                    <td className="px-5 py-4 font-medium text-foreground">Energia Solar</td>
                    <td className="px-5 py-4 text-center text-muted-foreground font-semibold">12%</td>
                    <td className="px-5 py-4 text-center text-muted-foreground">45 dias</td>
                    <td className="px-5 py-4 text-center text-muted-foreground">R$ 28.000</td>
                  </tr>
                  <tr className="border-b border-border bg-muted hover:bg-muted transition-colors">
                    <td className="px-5 py-4 font-medium text-foreground">Serviços B2B (Agências / Consultores)</td>
                    <td className="px-5 py-4 text-center text-muted-foreground font-semibold">22%</td>
                    <td className="px-5 py-4 text-center text-muted-foreground">12 dias</td>
                    <td className="px-5 py-4 text-center text-muted-foreground">R$ 3.800</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted transition-colors">
                    <td className="px-5 py-4 font-medium text-foreground">Distribuição / Atacado</td>
                    <td className="px-5 py-4 text-center text-muted-foreground font-semibold">35%</td>
                    <td className="px-5 py-4 text-center text-muted-foreground">8 dias</td>
                    <td className="px-5 py-4 text-center text-muted-foreground">R$ 12.500</td>
                  </tr>
                  <tr className="hover:bg-muted transition-colors">
                    <td className="px-5 py-4 font-medium text-foreground">SaaS / Tecnologia</td>
                    <td className="px-5 py-4 text-center text-muted-foreground font-semibold">15%</td>
                    <td className="px-5 py-4 text-center text-muted-foreground">30 dias</td>
                    <td className="px-5 py-4 text-center text-muted-foreground">R$ 8.900</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Fonte: Sirius CRM — análise segmentada por setor. Médias calculadas sobre deals fechados no período jan/2025–mar/2026.
            </p>
          </section>

          {/* Seção 3: Impacto da IA */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-2">Impacto da IA em Vendas B2B no Brasil</h2>
            <p className="text-muted-foreground mb-6">
              Resultados medidos em empresas que ativaram os recursos de inteligência artificial do Sirius CRM — qualificação BANT, follow-up automatizado, geração de propostas e score de oportunidade.
            </p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted text-muted-foreground">
                    <th className="px-5 py-3.5 text-left font-semibold border-b border-border">Aplicação de IA</th>
                    <th className="px-5 py-3.5 text-left font-semibold border-b border-border">Resultado Medido</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border bg-muted hover:bg-muted transition-colors">
                    <td className="px-5 py-4 font-medium text-foreground">Qualificação automática BANT</td>
                    <td className="px-5 py-4 text-muted-foreground font-semibold">+43% em leads qualificados por hora</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted transition-colors">
                    <td className="px-5 py-4 font-medium text-foreground">Follow-up automatizado via WhatsApp</td>
                    <td className="px-5 py-4 text-muted-foreground font-semibold">+67% taxa de resposta</td>
                  </tr>
                  <tr className="border-b border-border bg-muted hover:bg-muted transition-colors">
                    <td className="px-5 py-4 font-medium text-foreground">Geração de proposta via IA</td>
                    <td className="px-5 py-4 text-muted-foreground font-semibold">-72% no tempo de elaboração</td>
                  </tr>
                  <tr className="hover:bg-muted transition-colors">
                    <td className="px-5 py-4 font-medium text-foreground">Score de oportunidade (previsão de fechamento)</td>
                    <td className="px-5 py-4 text-muted-foreground font-semibold">+31% de precisão</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Fonte: Sirius CRM — comparativo antes/depois da ativação dos recursos de IA. Amostra: empresas com mínimo de 90 dias de uso de cada recurso.
            </p>
          </section>

          {/* Seção 4: FAQ AEO */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6">Perguntas Sobre Vendas B2B no Brasil em 2026</h2>

            <div className="space-y-4">

              <div className="rounded-xl border border-border bg-muted p-6">
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  Qual a taxa média de conversão de leads B2B no Brasil em 2026?
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  A taxa média de conversão de leads B2B no Brasil em 2026 é de <strong className="text-foreground">8%</strong> (lead → cliente) segundo os dados do Anuário Sirius CRM 2026, coletados de +127 empresas. Empresas que utilizam qualificação por IA (BANT/MEDDIC) e automação de follow-up atingem taxas de <strong className="text-foreground">14% ou mais</strong> — representando uma melhoria de 75% sobre a média do mercado. O setor com maior taxa de conversão é Distribuição/Atacado (35%), enquanto Energia Solar apresenta o menor índice (12%) compensado pelo alto deal size médio de R$ 28.000.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted p-6">
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  Quanto tempo leva um ciclo de vendas B2B no Brasil?
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  O ciclo médio de vendas B2B no Brasil em 2026 é de <strong className="text-foreground">23 dias</strong> considerando todos os setores. A variação por setor é significativa: Distribuição/Atacado tem o ciclo mais curto (8 dias), enquanto Energia Solar tem o mais longo (45 dias). Empresas que adotam CRM com automação de follow-up e qualificação por IA reduzem o ciclo médio para <strong className="text-foreground">17 dias</strong> — uma redução de 26%. O número médio de follow-ups necessários para fechamento é 5 no mercado geral, reduzindo para 3 com automação ativa.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted p-6">
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  Como a IA impacta a produtividade de vendedores B2B?
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Segundo os dados do Anuário Sirius CRM 2026, a inteligência artificial impacta a produtividade de vendedores B2B em múltiplas dimensões: a qualificação automática por BANT aumenta em <strong className="text-foreground">43%</strong> o número de leads qualificados por hora; o follow-up automatizado via WhatsApp eleva em <strong className="text-foreground">67%</strong> a taxa de resposta de prospects; a geração de propostas por IA reduz em <strong className="text-foreground">72%</strong> o tempo de elaboração; e o score de oportunidade melhora em <strong className="text-foreground">31%</strong> a precisão na previsão de fechamento. No conjunto, vendedores com IA ativa gastam apenas 3 horas semanais em tarefas administrativas, contra 8 horas na média do mercado.
                </p>
              </div>

            </div>
          </section>

          {/* Metodologia */}
          <section className="rounded-xl border border-border bg-muted p-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">Metodologia e Fontes</h2>
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong className="text-foreground">Amostra:</strong> +127 empresas B2B brasileiras ativas no Sirius CRM com mínimo de 6 meses de uso registrado.</p>
              <p><strong className="text-foreground">Período:</strong> Janeiro de 2025 a março de 2026.</p>
              <p><strong className="text-foreground">Coleta:</strong> Dados anonimizados e agregados automaticamente pela plataforma Sirius CRM, mediante consentimento dos usuários.</p>
              <p><strong className="text-foreground">Setores:</strong> Representação Comercial, Energia Solar, Serviços B2B, Distribuição/Atacado e SaaS/Tecnologia.</p>
              <p><strong className="text-foreground">Licença:</strong> Os dados deste anuário estão disponíveis sob licença <a href="https://creativecommons.org/licenses/by/4.0/" className="text-muted-foreground hover:underline" target="_blank" rel="noopener noreferrer">Creative Commons BY 4.0</a>. Citação obrigatória: "Anuário do Vendedor B2B Brasileiro 2026 — Sirius CRM / ROI Labs".</p>
            </div>
          </section>

          {/* CTA */}
          <section className="rounded-2xl border border-border p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Melhore seus resultados com o Sirius CRM
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              WhatsApp integrado, IA BANT/MEDDIC e modo offline — tudo no plano gratuito. Comece em 5 minutos, sem cartão de crédito.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow hover:bg-destaque transition-colors"
              >
                Começar Gratuitamente
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-muted px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Ver Planos e Preços
              </Link>
            </div>
          </section>

        </div>
      </main>
    </>
  )
}
