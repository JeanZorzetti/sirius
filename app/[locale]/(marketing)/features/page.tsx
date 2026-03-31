import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Kanban,
  BarChart3,
  Users,
  Zap,
  Shield,
  Smartphone,
  MessageSquare,
  Mail,
  Search,
  Brain,
  Globe,
  Calendar,
  Bell,
  Settings,
  Target,
  TrendingUp,
  FileText,
  MapPin,
  Plug,
  Star,
  Webhook,
  Bot,
  LayoutGrid,
  ArrowRight,
  Check,
  BookOpen,
  Megaphone,
  Shuffle,
  Blocks,
} from 'lucide-react'

// ─── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('marketing.features.meta')
  return {
    title: t('title'),
    description: t('description'),
    keywords: [
      'crm funcionalidades 2026', 'ia comercial nativa', 'pipeline kanban', 'whatsapp crm',
      'automação de vendas ia', 'prospecção google maps', 'analytics crm', 'crm brasil 2026',
      'crm online 2026', 'evolution api', 'bant meddic ia', 'crm ia qualificação leads',
    ],
    alternates: { canonical: 'https://sirius.roilabs.com.br/features' },
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: 'https://sirius.roilabs.com.br/features',
      images: [{ url: 'https://sirius.roilabs.com.br/og-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('twitterTitle'),
      description: t('twitterDescription'),
    },
  }
}

// ─── Feature Section Component ─────────────────────────────────────────────────

function FeatureSection({
  id,
  title,
  subtitle,
  features,
  columns = 3,
}: {
  id: string
  title: string
  subtitle: string
  features: { name: string; description: string; icon: React.ElementType; badge?: string }[]
  columns?: 2 | 3 | 4
}) {
  const gridCols = {
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
  }

  return (
    <section id={id} className="scroll-mt-20">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
      </div>
      <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols[columns]} gap-6`}>
        {features.map((feature) => (
          <Card key={feature.name} className="group hover:border-primary/30 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{feature.name}</CardTitle>
                </div>
                {feature.badge && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {feature.badge}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

// ─── Plan Row Helper ───────────────────────────────────────────────────────────

function PlanRow({
  label,
  free,
  starter,
  pro,
  business,
}: {
  label: string
  free: string | boolean
  starter: string | boolean
  pro: string | boolean
  business: string | boolean
}) {
  return (
    <tr>
      <td className="py-3 px-4 font-medium">{label}</td>
      <td className="text-center py-3 px-4"><CellValue value={free} /></td>
      <td className="text-center py-3 px-4"><CellValue value={starter} /></td>
      <td className="text-center py-3 px-4"><CellValue value={pro} /></td>
      <td className="text-center py-3 px-4"><CellValue value={business} /></td>
    </tr>
  )
}

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="h-4 w-4 text-green-500 mx-auto" />
  if (value === false) return <span className="text-muted-foreground">—</span>
  return <span className="text-muted-foreground">{value}</span>
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function FeaturesPage() {
  const t = await getTranslations('marketing.features')

  // ─── Feature data (built from translations) ────────────────────────────────

  const heroFeatures = [
    { name: t('heroFeatures.kanban.name'), description: t('heroFeatures.kanban.description'), icon: Kanban, badge: t('heroFeatures.kanban.badge') },
    { name: t('heroFeatures.whatsapp.name'), description: t('heroFeatures.whatsapp.description'), icon: MessageSquare, badge: t('heroFeatures.whatsapp.badge') },
    { name: t('heroFeatures.agi.name'), description: t('heroFeatures.agi.description'), icon: Brain, badge: t('heroFeatures.agi.badge') },
    { name: t('heroFeatures.maps.name'), description: t('heroFeatures.maps.description'), icon: Search, badge: t('heroFeatures.maps.badge') },
    { name: t('heroFeatures.automations.name'), description: t('heroFeatures.automations.description'), icon: Zap, badge: t('heroFeatures.automations.badge') },
    { name: t('heroFeatures.analytics.name'), description: t('heroFeatures.analytics.description'), icon: BarChart3, badge: t('heroFeatures.analytics.badge') },
  ]

  const crmFeatures = [
    { name: t('sections.crm.contacts.name'), description: t('sections.crm.contacts.description'), icon: Users },
    { name: t('sections.crm.deals.name'), description: t('sections.crm.deals.description'), icon: Target },
    { name: t('sections.crm.pipelines.name'), description: t('sections.crm.pipelines.description'), icon: LayoutGrid },
    { name: t('sections.crm.tasks.name'), description: t('sections.crm.tasks.description'), icon: Calendar },
  ]

  const communicationFeatures = [
    { name: t('sections.comunicacao.inbox.name'), description: t('sections.comunicacao.inbox.description'), icon: MessageSquare },
    { name: t('sections.comunicacao.quickReplies.name'), description: t('sections.comunicacao.quickReplies.description'), icon: FileText },
    { name: t('sections.comunicacao.emailAutomations.name'), description: t('sections.comunicacao.emailAutomations.description'), icon: Mail },
    { name: t('sections.comunicacao.notifications.name'), description: t('sections.comunicacao.notifications.description'), icon: Bell },
  ]

  const aiFeatures = [
    { name: t('sections.ia.dealAnalysis.name'), description: t('sections.ia.dealAnalysis.description'), icon: Brain },
    { name: t('sections.ia.scripts.name'), description: t('sections.ia.scripts.description'), icon: Bot },
    { name: t('sections.ia.enrichment.name'), description: t('sections.ia.enrichment.description'), icon: Users },
    { name: t('sections.ia.rag.name'), description: t('sections.ia.rag.description'), icon: BookOpen },
    { name: t('sections.ia.insights.name'), description: t('sections.ia.insights.description'), icon: TrendingUp },
  ]

  const prospectingFeatures = [
    { name: t('sections.prospeccao.search.name'), description: t('sections.prospeccao.search.description'), icon: MapPin },
    { name: t('sections.prospeccao.credits.name'), description: t('sections.prospeccao.credits.description'), icon: Target },
    { name: t('sections.prospeccao.conversion.name'), description: t('sections.prospeccao.conversion.description'), icon: Users },
  ]

  const analyticsFeatures = [
    { name: t('sections.analytics.dashboard.name'), description: t('sections.analytics.dashboard.description'), icon: BarChart3 },
    { name: t('sections.analytics.advanced.name'), description: t('sections.analytics.advanced.description'), icon: TrendingUp },
    { name: t('sections.analytics.lostDeals.name'), description: t('sections.analytics.lostDeals.description'), icon: Target },
    { name: t('sections.analytics.marketing.name'), description: t('sections.analytics.marketing.description'), icon: Megaphone },
  ]

  const integrationFeatures = [
    { name: t('sections.integracoes.whatsapp.name'), description: t('sections.integracoes.whatsapp.description'), icon: MessageSquare },
    { name: t('sections.integracoes.calendar.name'), description: t('sections.integracoes.calendar.description'), icon: Calendar },
    { name: t('sections.integracoes.ads.name'), description: t('sections.integracoes.ads.description'), icon: Megaphone },
    { name: t('sections.integracoes.n8n.name'), description: t('sections.integracoes.n8n.description'), icon: Blocks },
    { name: t('sections.integracoes.webhooks.name'), description: t('sections.integracoes.webhooks.description'), icon: Webhook },
    { name: t('sections.integracoes.api.name'), description: t('sections.integracoes.api.description'), icon: Plug },
  ]

  const teamFeatures = [
    { name: t('sections.equipe.management.name'), description: t('sections.equipe.management.description'), icon: Users },
    { name: t('sections.equipe.roundRobin.name'), description: t('sections.equipe.roundRobin.description'), icon: Shuffle },
    { name: t('sections.equipe.assignment.name'), description: t('sections.equipe.assignment.description'), icon: MessageSquare },
  ]

  const mobileFeatures = [
    { name: t('sections.mobile.pwa.name'), description: t('sections.mobile.pwa.description'), icon: Smartphone },
    { name: t('sections.mobile.gps.name'), description: t('sections.mobile.gps.description'), icon: MapPin },
    { name: t('sections.mobile.offline.name'), description: t('sections.mobile.offline.description'), icon: Globe },
  ]

  const securityFeatures = [
    { name: t('sections.seguranca.encryption.name'), description: t('sections.seguranca.encryption.description'), icon: Shield },
    { name: t('sections.seguranca.sso.name'), description: t('sections.seguranca.sso.description'), icon: Shield },
    { name: t('sections.seguranca.apiKeys.name'), description: t('sections.seguranca.apiKeys.description'), icon: Settings },
  ]

  const sections = [
    { id: 'crm', label: t('nav.crm') },
    { id: 'comunicacao', label: t('nav.comunicacao') },
    { id: 'ia', label: t('nav.ia') },
    { id: 'prospeccao', label: t('nav.prospeccao') },
    { id: 'analytics', label: t('nav.analytics') },
    { id: 'integracoes', label: t('nav.integracoes') },
    { id: 'equipe', label: t('nav.equipe') },
    { id: 'mobile', label: t('nav.mobile') },
    { id: 'seguranca', label: t('nav.seguranca') },
  ]

  // plan comparison helpers — typed accessors
  const pr = {
    contacts: t('planComparison.rows.contacts'),
    deals: t('planComparison.rows.deals'),
    pipelines: t('planComparison.rows.pipelines'),
    users: t('planComparison.rows.users'),
    whatsapp: t('planComparison.rows.whatsapp'),
    prospecting: t('planComparison.rows.prospecting'),
    emailAutomations: t('planComparison.rows.emailAutomations'),
    dealAutomations: t('planComparison.rows.dealAutomations'),
    agi: t('planComparison.rows.agi'),
    advancedAnalytics: t('planComparison.rows.advancedAnalytics'),
    customReports: t('planComparison.rows.customReports'),
    api: t('planComparison.rows.api'),
    googleCalendar: t('planComparison.rows.googleCalendar'),
    ads: t('planComparison.rows.ads'),
    n8n: t('planComparison.rows.n8n'),
    roundRobin: t('planComparison.rows.roundRobin'),
    sso: t('planComparison.rows.sso'),
    gpsCheckin: t('planComparison.rows.gpsCheckin'),
    pwa: t('planComparison.rows.pwa'),
    support: t('planComparison.rows.support'),
  }
  const pv = {
    contacts_free: t('planComparison.values.contacts_free'),
    contacts_starter: t('planComparison.values.contacts_starter'),
    contacts_pro: t('planComparison.values.contacts_pro'),
    contacts_business: t('planComparison.values.contacts_business'),
    deals_free: t('planComparison.values.deals_free'),
    deals_starter: t('planComparison.values.deals_starter'),
    deals_pro: t('planComparison.values.deals_pro'),
    deals_business: t('planComparison.values.deals_business'),
    pipelines_free: t('planComparison.values.pipelines_free'),
    pipelines_starter: t('planComparison.values.pipelines_starter'),
    pipelines_pro: t('planComparison.values.pipelines_pro'),
    pipelines_business: t('planComparison.values.pipelines_business'),
    users_free: t('planComparison.values.users_free'),
    users_starter: t('planComparison.values.users_starter'),
    users_pro: t('planComparison.values.users_pro'),
    users_business: t('planComparison.values.users_business'),
    whatsapp_starter: t('planComparison.values.whatsapp_starter'),
    whatsapp_pro: t('planComparison.values.whatsapp_pro'),
    whatsapp_business: t('planComparison.values.whatsapp_business'),
    prospecting_starter: t('planComparison.values.prospecting_starter'),
    prospecting_pro: t('planComparison.values.prospecting_pro'),
    prospecting_business: t('planComparison.values.prospecting_business'),
    emailAutomations_starter: t('planComparison.values.emailAutomations_starter'),
    emailAutomations_pro: t('planComparison.values.emailAutomations_pro'),
    emailAutomations_business: t('planComparison.values.emailAutomations_business'),
    dealAutomations_starter: t('planComparison.values.dealAutomations_starter'),
    dealAutomations_pro: t('planComparison.values.dealAutomations_pro'),
    dealAutomations_business: t('planComparison.values.dealAutomations_business'),
    support_free: t('planComparison.values.support_free'),
    support_starter: t('planComparison.values.support_starter'),
    support_pro: t('planComparison.values.support_pro'),
    support_business: t('planComparison.values.support_business'),
  }

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "Como usar o Sirius CRM para aumentar suas vendas",
    "description": "Guia completo de como usar o Sirius CRM para gerenciar pipeline, prospectar leads, automatizar processos e fechar mais negócios.",
    "step": [
      {
        "@type": "HowToStep",
        "name": "Configure seu Pipeline Kanban",
        "text": "Crie as etapas do seu funil de vendas com drag-and-drop. Personalize estágios conforme seu processo comercial. Crie múltiplos pipelines por produto ou equipe."
      },
      {
        "@type": "HowToStep",
        "name": "Conecte seu WhatsApp",
        "text": "Integre o WhatsApp Business via Evolution API com QR Code. Envie e receba mensagens direto do CRM. Use o inbox unificado com tags e respostas rápidas."
      },
      {
        "@type": "HowToStep",
        "name": "Prospecte leads pelo Google Maps",
        "text": "Busque leads automaticamente por segmento e localidade. O Sirius extrai telefone, email, site e endereço. Converta em contatos com um clique."
      },
      {
        "@type": "HowToStep",
        "name": "Configure automações",
        "text": "Crie automações por gatilhos: deal criado, movido, ganho, perdido ou parado. Ações: enviar email, WhatsApp, criar tarefa ou atualizar campo."
      },
      {
        "@type": "HowToStep",
        "name": "Acompanhe com Analytics",
        "text": "Use dashboards em tempo real para ver win rate, ciclo de vendas, previsão de receita, CAC e ROI de campanhas."
      }
    ],
    "totalTime": "PT20M"
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://sirius.roilabs.com.br" },
      { "@type": "ListItem", "position": 2, "name": "Funcionalidades", "item": "https://sirius.roilabs.com.br/features" }
    ]
  }

  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Sirius CRM",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web, iOS, Android",
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "BRL",
      "lowPrice": "0",
      "highPrice": "397",
      "offerCount": "4"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "12"
    },
    "description": "CRM visual com pipeline Kanban, WhatsApp integrado via Evolution API, IA comercial, prospecção Google Maps, automações de deals e email, analytics avançado e API pública para vendedores brasileiros.",
    "featureList": [
      "Pipeline Kanban Visual",
      "WhatsApp Integrado (Evolution API)",
      "AGI Sirius — IA Comercial",
      "Prospecção Google Maps",
      "Automações de Deals e Email",
      "Analytics PRO com Previsão",
      "API REST v1 + Webhooks",
      "Round-Robin de Leads",
      "Check-in GPS para Campo",
      "PWA com Push Notifications"
    ],
    "screenshot": "https://sirius.roilabs.com.br/og-image.png"
  }

  return (
    <>
      <Script
        id="howto-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="software-app-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />

      <div className="bg-background">
        {/* Hero Section */}
        <div className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="outline" className="mb-4 text-primary border-primary/30">
                {t('hero.badge')}
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                {t('hero.title')}{' '}
                <span className="text-primary">{t('hero.titleHighlight')}</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                {t('hero.subtitle')}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/register">
                    {t('hero.ctaPrimary')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/pricing">{t('hero.ctaSecondary')}</Link>
                </Button>
              </div>
            </div>

            {/* Quick Nav */}
            <div className="mt-16 flex flex-wrap justify-center gap-2">
              {sections.map((section) => (
                <Button
                  key={section.id}
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary"
                >
                  <a href={`#${section.id}`}>{section.label}</a>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Founders Banner */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-16">
          <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Star className="w-7 h-7 text-amber-500 fill-amber-400 shrink-0" />
              <div>
                <p className="font-bold text-amber-900 text-lg">{t('founders.badge')}</p>
                <p className="text-sm text-amber-700">{t('founders.pricing')}</p>
              </div>
            </div>
            <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white shrink-0">
              <Link href="/fundadores">
                <Star className="w-4 h-4 mr-2 fill-white" />
                {t('founders.cta')}
              </Link>
            </Button>
          </div>
        </div>

        {/* Hero Features (top 6) */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('highlights.title')}</h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('highlights.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {heroFeatures.map((feature) => (
              <Card key={feature.name} className="group hover:border-primary/30 transition-colors relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 group-hover:bg-primary/10 transition-colors" />
                <CardHeader className="pb-3 relative">
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <Badge variant="secondary" className="text-xs">{feature.badge}</Badge>
                  </div>
                  <CardTitle className="text-lg mt-3">{feature.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-24 pb-24">

          <FeatureSection
            id="crm"
            title={t('sections.crm.title')}
            subtitle={t('sections.crm.subtitle')}
            features={crmFeatures}
            columns={2}
          />

          <FeatureSection
            id="comunicacao"
            title={t('sections.comunicacao.title')}
            subtitle={t('sections.comunicacao.subtitle')}
            features={communicationFeatures}
            columns={2}
          />

          <FeatureSection
            id="ia"
            title={t('sections.ia.title')}
            subtitle={t('sections.ia.subtitle')}
            features={aiFeatures}
          />

          <FeatureSection
            id="prospeccao"
            title={t('sections.prospeccao.title')}
            subtitle={t('sections.prospeccao.subtitle')}
            features={prospectingFeatures}
          />

          <FeatureSection
            id="analytics"
            title={t('sections.analytics.title')}
            subtitle={t('sections.analytics.subtitle')}
            features={analyticsFeatures}
            columns={2}
          />

          <FeatureSection
            id="integracoes"
            title={t('sections.integracoes.title')}
            subtitle={t('sections.integracoes.subtitle')}
            features={integrationFeatures}
          />

          <FeatureSection
            id="equipe"
            title={t('sections.equipe.title')}
            subtitle={t('sections.equipe.subtitle')}
            features={teamFeatures}
          />

          <FeatureSection
            id="mobile"
            title={t('sections.mobile.title')}
            subtitle={t('sections.mobile.subtitle')}
            features={mobileFeatures}
          />

          <FeatureSection
            id="seguranca"
            title={t('sections.seguranca.title')}
            subtitle={t('sections.seguranca.subtitle')}
            features={securityFeatures}
          />
        </div>

        {/* Plan Comparison Summary */}
        <div className="bg-muted/30 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('planComparison.title')}</h2>
              <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('planComparison.subtitle')}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-3 px-4 font-semibold w-1/3">{t('planComparison.col_feature')}</th>
                    <th className="text-center py-3 px-4 font-semibold">{t('planComparison.col_free')}</th>
                    <th className="text-center py-3 px-4 font-semibold">{t('planComparison.col_starter')}<br /><span className="text-xs text-muted-foreground font-normal">{t('planComparison.starter_price')}</span></th>
                    <th className="text-center py-3 px-4 font-semibold">{t('planComparison.col_pro')}<br /><span className="text-xs text-muted-foreground font-normal">{t('planComparison.pro_price')}</span></th>
                    <th className="text-center py-3 px-4 font-semibold">{t('planComparison.col_business')}<br /><span className="text-xs text-muted-foreground font-normal">{t('planComparison.business_price')}</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <PlanRow label={pr.contacts} free={pv.contacts_free} starter={pv.contacts_starter} pro={pv.contacts_pro} business={pv.contacts_business} />
                  <PlanRow label={pr.deals} free={pv.deals_free} starter={pv.deals_starter} pro={pv.deals_pro} business={pv.deals_business} />
                  <PlanRow label={pr.pipelines} free={pv.pipelines_free} starter={pv.pipelines_starter} pro={pv.pipelines_pro} business={pv.pipelines_business} />
                  <PlanRow label={pr.users} free={pv.users_free} starter={pv.users_starter} pro={pv.users_pro} business={pv.users_business} />
                  <PlanRow label={pr.whatsapp} free={false} starter={pv.whatsapp_starter} pro={pv.whatsapp_pro} business={pv.whatsapp_business} />
                  <PlanRow label={pr.prospecting} free={false} starter={pv.prospecting_starter} pro={pv.prospecting_pro} business={pv.prospecting_business} />
                  <PlanRow label={pr.emailAutomations} free={false} starter={pv.emailAutomations_starter} pro={pv.emailAutomations_pro} business={pv.emailAutomations_business} />
                  <PlanRow label={pr.dealAutomations} free={false} starter={pv.dealAutomations_starter} pro={pv.dealAutomations_pro} business={pv.dealAutomations_business} />
                  <PlanRow label={pr.agi} free={false} starter={false} pro={true} business={true} />
                  <PlanRow label={pr.advancedAnalytics} free={false} starter={false} pro={true} business={true} />
                  <PlanRow label={pr.customReports} free={false} starter={false} pro={false} business={true} />
                  <PlanRow label={pr.api} free={false} starter={false} pro={true} business={true} />
                  <PlanRow label={pr.googleCalendar} free={false} starter={true} pro={true} business={true} />
                  <PlanRow label={pr.ads} free={false} starter={false} pro={true} business={true} />
                  <PlanRow label={pr.n8n} free={false} starter={true} pro={true} business={true} />
                  <PlanRow label={pr.roundRobin} free={false} starter={false} pro={false} business={true} />
                  <PlanRow label={pr.sso} free={false} starter={false} pro={false} business={true} />
                  <PlanRow label={pr.gpsCheckin} free={true} starter={true} pro={true} business={true} />
                  <PlanRow label={pr.pwa} free={true} starter={true} pro={true} business={true} />
                  <PlanRow label={pr.support} free={pv.support_free} starter={pv.support_starter} pro={pv.support_pro} business={pv.support_business} />
                </tbody>
              </table>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/pricing">{t('planComparison.ctaPrimary')}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                <Link href="/fundadores">
                  <Star className="w-4 h-4 mr-2 fill-amber-400 text-amber-500" />
                  {t('planComparison.ctaSecondary')}
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="py-24">
          <div className="mx-auto max-w-3xl px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t('cta.title')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('cta.subtitle')}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/register">
                  {t('cta.ctaPrimary')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/pricing">{t('cta.ctaSecondary')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
