import { Metadata } from 'next'
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

export const metadata: Metadata = {
  title: 'Funcionalidades Sirius CRM 2026 [12+ Ferramentas de IA] — WhatsApp, Pipeline, Prospecção e Mais',
  description: 'Descubra como a IA Nativa do Sirius qualifica seus leads automaticamente com BANT e MEDDIC, integra WhatsApp, prospecta no Google Maps e automatiza follow-ups. Pipeline Kanban visual. Teste grátis 7 dias.',
  keywords: [
    'crm funcionalidades 2026', 'ia comercial nativa', 'pipeline kanban', 'whatsapp crm',
    'automação de vendas ia', 'prospecção google maps', 'analytics crm', 'crm brasil 2026',
    'crm online 2026', 'evolution api', 'bant meddic ia', 'crm ia qualificação leads',
  ],
  alternates: { canonical: 'https://sirius.roilabs.com.br/features' },
  openGraph: {
    title: 'Funcionalidades Sirius CRM 2026 [12+ Ferramentas de IA] — WhatsApp e Pipeline',
    description: 'IA que qualifica leads automaticamente, WhatsApp integrado, pipeline Kanban, prospecção Google Maps, automações e analytics PRO. Tudo em um só CRM.',
    url: 'https://sirius.roilabs.com.br/features',
    images: [{ url: 'https://sirius.roilabs.com.br/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Funcionalidades Sirius CRM 2026 [12+ Ferramentas de IA] — WhatsApp e Pipeline',
    description: 'IA que qualifica leads com BANT e MEDDIC, WhatsApp integrado, pipeline Kanban, prospecção Google Maps e automações. Teste grátis.',
  },
}

// ─── Feature Categories ────────────────────────────────────────────────────────

const heroFeatures = [
  {
    name: 'Pipeline Kanban',
    description: 'Visualize negócios em estágios claros com drag-and-drop. Crie múltiplos pipelines personalizados por produto, região ou equipe. Veja valor total por estágio e previsão de fechamento em tempo real.',
    icon: Kanban,
    badge: 'Core',
  },
  {
    name: 'WhatsApp Integrado',
    description: 'Conecte seu WhatsApp via Evolution API com pareamento por QR Code. Envie e receba mensagens direto do CRM. Inbox unificado com tags, respostas rápidas, atribuição de conversas e mídia (fotos, áudios, documentos).',
    icon: MessageSquare,
    badge: 'Starter+',
  },
  {
    name: 'AGI Sirius — IA Comercial',
    description: 'Inteligência Artificial que analisa seus deals, gera scripts de venda personalizados, faz diagnóstico de saúde do negócio, enriquece contatos e recomenda próximas ações. Baseada em Knowledge Graph com RAG.',
    icon: Brain,
    badge: 'Pro+',
  },
  {
    name: 'Prospecção Google Maps',
    description: 'Encontre leads automaticamente pelo Google Maps. Busque por segmento e localização, e o Sirius extrai nome, telefone, email, site e endereço. Créditos mensais por plano — de 75 a 1.500 leads/mês.',
    icon: Search,
    badge: 'Starter+',
  },
  {
    name: 'Automações de Deals',
    description: 'Crie automações por gatilhos: deal criado, movido de estágio, ganho, perdido ou parado há X dias. Ações: enviar email, enviar WhatsApp, criar tarefa ou atualizar campo. Logs completos de execução.',
    icon: Zap,
    badge: 'Starter+',
  },
  {
    name: 'Analytics PRO',
    description: 'Dashboards avançados com win rate, ciclo de vendas, velocidade de pipeline, análise de deals perdidos e tendências. Filtros por período e comparação temporal. Previsão de receita por data de fechamento.',
    icon: BarChart3,
    badge: 'Pro+',
  },
]

const crmFeatures = [
  {
    name: 'Gestão de Contatos',
    description: 'CRUD completo com importação e exportação CSV. Histórico de interações, associação com empresas, tags personalizáveis e timeline de atividades. Até contatos ilimitados no plano Business.',
    icon: Users,
  },
  {
    name: 'Negócios (Deals)',
    description: 'Controle valor, data de fechamento, responsável e estágio. Notas, atividades e comentários vinculados. Drag-and-drop no Kanban. Exportação de dados.',
    icon: Target,
  },
  {
    name: 'Múltiplos Pipelines',
    description: 'Crie pipelines separados por produto, região ou equipe. Configure estágios customizados, defina pipeline padrão e vincule automações específicas por pipeline.',
    icon: LayoutGrid,
  },
  {
    name: 'Atividades e Tarefas',
    description: 'Crie tarefas vinculadas a deals e contatos. Defina responsáveis, prazos e lembretes. Sincronize com Google Calendar automaticamente.',
    icon: Calendar,
  },
]

const communicationFeatures = [
  {
    name: 'Inbox Unificado (WhatsApp)',
    description: 'Todas as conversas WhatsApp em um só lugar. Filtre por tags, busque por nome, fixe chats importantes, arquive conversas antigas. Atribua conversas a membros da equipe.',
    icon: MessageSquare,
  },
  {
    name: 'Respostas Rápidas',
    description: 'Crie templates de respostas rápidas para agilizar o atendimento no WhatsApp. Acesse com um clique direto do chat.',
    icon: FileText,
  },
  {
    name: 'Automações de Email',
    description: 'Campanhas automáticas de e-mail: boas-vindas, deal criado, troca de estágio, nudge de upgrade. Templates com variáveis dinâmicas (nome, valor, empresa). Analytics de abertura e cliques.',
    icon: Mail,
  },
  {
    name: 'Notificações em Tempo Real',
    description: 'Push notifications (PWA) para novos deals, deals ganhos, mensagens WhatsApp e lembretes de calendário. Streaming SSE para atualizações instantâneas no navegador.',
    icon: Bell,
  },
]

const aiFeatures = [
  {
    name: 'Análise de Deals com IA',
    description: 'A AGI Sirius analisa cada negócio e gera um score de probabilidade de fechamento, identifica riscos e sugere ações para aumentar a conversão.',
    icon: Brain,
  },
  {
    name: 'Gerador de Scripts de Venda',
    description: 'IA gera scripts de ligação e abordagem personalizados com base no perfil do contato, estágio do deal e histórico de interações.',
    icon: Bot,
  },
  {
    name: 'Enriquecimento de Contatos',
    description: 'A IA complementa dados dos seus contatos automaticamente: cargo, empresa, rede social e informações relevantes para sua abordagem comercial.',
    icon: Users,
  },
  {
    name: 'Knowledge Graph + RAG',
    description: 'Sistema de conhecimento baseado em grafos que extrai entidades e relacionamentos dos seus dados e blog. Consultas semânticas via Retrieval-Augmented Generation.',
    icon: BookOpen,
  },
  {
    name: 'Insights e Recomendações',
    description: 'Receba insights automáticos sobre seu pipeline: gargalos, oportunidades, tendências e recomendações de próximos passos baseadas em dados históricos.',
    icon: TrendingUp,
  },
]

const prospectingFeatures = [
  {
    name: 'Busca por Google Maps',
    description: 'Digite o segmento (ex: "pizzarias") e a cidade. O Sirius busca automaticamente no Google Maps e retorna: nome, telefone, email, site, endereço e avaliação.',
    icon: MapPin,
  },
  {
    name: 'Sistema de Créditos',
    description: 'Cada plano inclui créditos mensais de prospecção: Starter 75, Pro 300, Business 1.500. Compre pacotes extras de 100 ou 500 leads quando precisar.',
    icon: Target,
  },
  {
    name: 'Conversão Automática em Contato',
    description: 'Leads encontrados podem ser convertidos em contatos do CRM com um clique. Histórico de buscas salvo para consulta futura.',
    icon: Users,
  },
]

const analyticsFeatures = [
  {
    name: 'Dashboard de Vendas',
    description: 'Valor total do pipeline, taxa de conversão, ticket médio, previsão de fechamento e deals por estágio. Visão consolidada de toda a operação comercial.',
    icon: BarChart3,
  },
  {
    name: 'Analytics Avançado',
    description: 'Win rate, ciclo médio de vendas, velocidade de pipeline, tendências ao longo do tempo. Filtros por período personalizado e comparação entre períodos.',
    icon: TrendingUp,
  },
  {
    name: 'Análise de Deals Perdidos',
    description: 'Entenda por que deals são perdidos. Categorize motivos, identifique padrões e ajuste seu processo comercial com dados.',
    icon: Target,
  },
  {
    name: 'Marketing & CAC',
    description: 'Integre com Google Ads e Meta Ads para calcular CAC automaticamente. Acompanhe ROI de campanhas, LTV/CAC ratio e custo por lead com entrada manual ou automática.',
    icon: Megaphone,
  },
]

const integrationFeatures = [
  {
    name: 'WhatsApp (Evolution API)',
    description: 'Integração nativa com Evolution API. Multi-instância no Business (até 5). QR Code para pareamento, envio/recebimento de mensagens, mídia e status em tempo real.',
    icon: MessageSquare,
  },
  {
    name: 'Google Calendar',
    description: 'Sincronize atividades e reuniões com Google Calendar via OAuth. Crie eventos automaticamente a partir de deals. Receba lembretes de compromissos.',
    icon: Calendar,
  },
  {
    name: 'Google Ads & Meta Ads',
    description: 'Conecte suas contas de anúncios para importar métricas de campanhas, gastos e conversões. Calcule CAC e ROI automaticamente.',
    icon: Megaphone,
  },
  {
    name: 'n8n',
    description: 'Integre com n8n para criar workflows avançados de automação. Conecte o Sirius a centenas de ferramentas via nodes customizados.',
    icon: Blocks,
  },
  {
    name: 'Webhooks',
    description: 'Configure webhooks para receber eventos em tempo real: deal criado, contato atualizado, negócio ganho/perdido. Signing secrets para segurança. Logs de execução com retry automático.',
    icon: Webhook,
  },
  {
    name: 'API REST v1',
    description: 'API pública documentada para desenvolvedores. Gerencie contatos, deals, pipelines e webhooks programaticamente. Chaves de API com permissões configuráveis.',
    icon: Plug,
  },
]

const teamFeatures = [
  {
    name: 'Gestão de Equipe',
    description: 'Convide membros por email, gerencie papéis (Owner/Member) e controle permissões. Veja convites pendentes e atividade da equipe.',
    icon: Users,
  },
  {
    name: 'Round-Robin de Leads',
    description: 'Distribua novos leads automaticamente entre vendedores em rodízio. Pule usuários offline, notifique sobre novas atribuições e garanta distribuição equilibrada.',
    icon: Shuffle,
  },
  {
    name: 'Atribuição de Conversas',
    description: 'No chat WhatsApp, atribua conversas a membros específicos da equipe. Cada vendedor vê apenas seus chats atribuídos.',
    icon: MessageSquare,
  },
]

const mobileFeatures = [
  {
    name: 'PWA (Progressive Web App)',
    description: 'Instale o Sirius na tela inicial do celular como um app nativo. Funciona offline para consultas básicas. Push notifications mesmo com o app fechado.',
    icon: Smartphone,
  },
  {
    name: 'Check-in com GPS',
    description: 'Para vendedores de campo: faça check-in em visitas com localização GPS. Histórico de visitas com mapa, horários e anotações. Interface otimizada para mobile.',
    icon: MapPin,
  },
  {
    name: 'Sync Offline',
    description: 'Seus dados ficam disponíveis mesmo sem internet. Quando a conexão voltar, tudo sincroniza automaticamente.',
    icon: Globe,
  },
]

const securityFeatures = [
  {
    name: 'Criptografia de Dados',
    description: 'Todos os dados são criptografados em trânsito (TLS) e em repouso. Seus dados ficam isolados por organização.',
    icon: Shield,
  },
  {
    name: 'SSO & Audit Log',
    description: 'Single Sign-On para login corporativo e log de auditoria completo de todas as ações na plataforma. Plano Business.',
    icon: Shield,
  },
  {
    name: 'API Keys com Permissões',
    description: 'Crie chaves de API com escopo definido. Revogue a qualquer momento. Webhook signing secrets para validar origem das requisições.',
    icon: Settings,
  },
]

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

// ─── Quick Nav ─────────────────────────────────────────────────────────────────

const sections = [
  { id: 'crm', label: 'CRM Core' },
  { id: 'comunicacao', label: 'Comunicacao' },
  { id: 'ia', label: 'IA & AGI' },
  { id: 'prospeccao', label: 'Prospeccao' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'integracoes', label: 'Integracoes' },
  { id: 'equipe', label: 'Equipe' },
  { id: 'mobile', label: 'Mobile' },
  { id: 'seguranca', label: 'Seguranca' },
]

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function FeaturesPage() {
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
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://sirius.roilabs.com.br" },
      { "@type": "ListItem", "position": 2, "name": "Funcionalidades", "item": "https://sirius.roilabs.com.br/features" }
    ]
  };

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
  };

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
                +50 funcionalidades
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Tudo para vender mais,{' '}
                <span className="text-primary">sem complexidade</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Pipeline Kanban, WhatsApp integrado, IA comercial, prospecção automática, automações
                de deals e email, analytics avançado, API pública e muito mais.
                Desenhamos cada recurso pensando na produtividade do vendedor brasileiro.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/register">
                    Testar Gratis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/pricing">Ver Planos e Precos</Link>
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
                <p className="font-bold text-amber-900 text-lg">Programa de Fundadores — 41% OFF vitalicio!</p>
                <p className="text-sm text-amber-700">
                  Starter R$39 · Pro R$87 · Business R$234/mes para sempre. Vagas limitadas.
                </p>
              </div>
            </div>
            <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white shrink-0">
              <Link href="/fundadores">
                <Star className="w-4 h-4 mr-2 fill-white" />
                Ver oferta
              </Link>
            </Button>
          </div>
        </div>

        {/* Hero Features (top 6) */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Destaques</h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
              As funcionalidades que fazem o Sirius se destacar de qualquer outro CRM
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
            title="CRM Core"
            subtitle="A base do seu processo comercial: contatos, deals, pipelines e atividades"
            features={crmFeatures}
            columns={2}
          />

          <FeatureSection
            id="comunicacao"
            title="Comunicacao Multi-canal"
            subtitle="WhatsApp, email e notificacoes — tudo integrado sem sair do CRM"
            features={communicationFeatures}
            columns={2}
          />

          <FeatureSection
            id="ia"
            title="Inteligencia Artificial (AGI Sirius)"
            subtitle="IA comercial que analisa, sugere e enriquece seus dados automaticamente"
            features={aiFeatures}
          />

          <FeatureSection
            id="prospeccao"
            title="Prospeccao Automatica"
            subtitle="Encontre novos clientes sem esforco com busca automatica pelo Google Maps"
            features={prospectingFeatures}
          />

          <FeatureSection
            id="analytics"
            title="Analytics e BI"
            subtitle="Dashboards que mostram a saude real da sua operacao comercial"
            features={analyticsFeatures}
            columns={2}
          />

          <FeatureSection
            id="integracoes"
            title="Integracoes"
            subtitle="Conecte o Sirius a todo o seu ecossistema de ferramentas"
            features={integrationFeatures}
          />

          <FeatureSection
            id="equipe"
            title="Gestao de Equipe"
            subtitle="Ferramentas para times comerciais trabalharem juntos de forma eficiente"
            features={teamFeatures}
          />

          <FeatureSection
            id="mobile"
            title="Mobile e Campo"
            subtitle="Feche negocios de qualquer lugar com a experiencia mobile completa"
            features={mobileFeatures}
          />

          <FeatureSection
            id="seguranca"
            title="Seguranca e Compliance"
            subtitle="Seus dados protegidos com os mais altos padroes de seguranca"
            features={securityFeatures}
          />
        </div>

        {/* Plan Comparison Summary */}
        <div className="bg-muted/30 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Funcionalidades por Plano</h2>
              <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
                Veja o que cada plano inclui. Comece gratis e escale conforme seu time cresce.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-3 px-4 font-semibold w-1/3">Recurso</th>
                    <th className="text-center py-3 px-4 font-semibold">Gratuito</th>
                    <th className="text-center py-3 px-4 font-semibold">Starter<br /><span className="text-xs text-muted-foreground font-normal">R$67/mes</span></th>
                    <th className="text-center py-3 px-4 font-semibold">Pro<br /><span className="text-xs text-muted-foreground font-normal">R$147/mes</span></th>
                    <th className="text-center py-3 px-4 font-semibold">Business<br /><span className="text-xs text-muted-foreground font-normal">R$397/mes</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <PlanRow label="Contatos" free="250" starter="1.000" pro="5.000" business="Ilimitado" />
                  <PlanRow label="Negocios (Deals)" free="100" starter="500" pro="2.500" business="Ilimitado" />
                  <PlanRow label="Pipelines" free="1" starter="5" pro="15" business="50" />
                  <PlanRow label="Usuarios" free="2" starter="5" pro="15" business="50" />
                  <PlanRow label="WhatsApp" free={false} starter="1 instancia" pro="3 instancias" business="5 instancias" />
                  <PlanRow label="Prospeccao mensal" free={false} starter="75 leads" pro="300 leads" business="1.500 leads" />
                  <PlanRow label="Automacoes de email" free={false} starter="3" pro="10" business="50" />
                  <PlanRow label="Automacoes de deals" free={false} starter="3" pro="10" business="50" />
                  <PlanRow label="AGI Sirius (IA)" free={false} starter={false} pro={true} business={true} />
                  <PlanRow label="Analytics avancado" free={false} starter={false} pro={true} business={true} />
                  <PlanRow label="Relatorios customizados" free={false} starter={false} pro={false} business={true} />
                  <PlanRow label="API publica + Webhooks" free={false} starter={false} pro={true} business={true} />
                  <PlanRow label="Google Calendar" free={false} starter={true} pro={true} business={true} />
                  <PlanRow label="Google Ads / Meta Ads" free={false} starter={false} pro={true} business={true} />
                  <PlanRow label="n8n" free={false} starter={true} pro={true} business={true} />
                  <PlanRow label="Round-Robin" free={false} starter={false} pro={false} business={true} />
                  <PlanRow label="SSO + Audit Log" free={false} starter={false} pro={false} business={true} />
                  <PlanRow label="Check-in GPS" free={true} starter={true} pro={true} business={true} />
                  <PlanRow label="PWA + Push" free={true} starter={true} pro={true} business={true} />
                  <PlanRow label="Suporte" free="Comunidade" starter="Email" pro="Prioritario" business="Dedicado" />
                </tbody>
              </table>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/pricing">Ver Planos Detalhados</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                <Link href="/fundadores">
                  <Star className="w-4 h-4 mr-2 fill-amber-400 text-amber-500" />
                  Fundadores — 41% OFF
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="py-24">
          <div className="mx-auto max-w-3xl px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Pronto para transformar suas vendas?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Comece gratis agora. Sem cartao, sem compromisso. Upgrade quando quiser.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/register">
                  Criar Conta Gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/pricing">Comparar Planos</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
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
