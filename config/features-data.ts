import {
  Kanban,
  Users,
  Target,
  LayoutGrid,
  Calendar,
  MessageSquare,
  FileText,
  Mail,
  Bell,
  Brain,
  Bot,
  BookOpen,
  TrendingUp,
  MapPin,
  Search,
  BarChart3,
  Megaphone,
  Plug,
  Webhook,
  Blocks,
  Shuffle,
  Smartphone,
  Globe,
  Shield,
  Settings,
} from 'lucide-react'

export type FeatureItem = {
  slug: string
  sectionKey: string    // key in sections.{section}
  featureKey: string    // key in sections.{section}.{feature}
  icon: typeof Kanban
}

export type FeatureCategory = {
  menuKey: string       // key in nav.features_menu
  sections: {
    sectionKey: string  // key in sections.{section} and features.nav.{section}
    features: FeatureItem[]
  }[]
}

// All features organized by mega menu category
export const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    menuKey: 'vendas',
    sections: [
      {
        sectionKey: 'crm',
        features: [
          { slug: 'gestao-contatos', sectionKey: 'crm', featureKey: 'contacts', icon: Users },
          { slug: 'negocios-deals', sectionKey: 'crm', featureKey: 'deals', icon: Target },
          { slug: 'multiplos-pipelines', sectionKey: 'crm', featureKey: 'pipelines', icon: LayoutGrid },
          { slug: 'atividades-tarefas', sectionKey: 'crm', featureKey: 'tasks', icon: Calendar },
        ],
      },
      {
        sectionKey: 'prospeccao',
        features: [
          { slug: 'busca-google-maps', sectionKey: 'prospeccao', featureKey: 'search', icon: MapPin },
          { slug: 'sistema-creditos', sectionKey: 'prospeccao', featureKey: 'credits', icon: Target },
          { slug: 'conversao-contato', sectionKey: 'prospeccao', featureKey: 'conversion', icon: Users },
        ],
      },
      {
        sectionKey: 'analytics',
        features: [
          { slug: 'dashboard-vendas', sectionKey: 'analytics', featureKey: 'dashboard', icon: BarChart3 },
          { slug: 'analytics-avancado', sectionKey: 'analytics', featureKey: 'advanced', icon: TrendingUp },
          { slug: 'deals-perdidos', sectionKey: 'analytics', featureKey: 'lostDeals', icon: Target },
          { slug: 'marketing-cac', sectionKey: 'analytics', featureKey: 'marketing', icon: Megaphone },
        ],
      },
    ],
  },
  {
    menuKey: 'comunicacao_ia',
    sections: [
      {
        sectionKey: 'comunicacao',
        features: [
          { slug: 'inbox-whatsapp', sectionKey: 'comunicacao', featureKey: 'inbox', icon: MessageSquare },
          { slug: 'respostas-rapidas', sectionKey: 'comunicacao', featureKey: 'quickReplies', icon: FileText },
          { slug: 'automacoes-email', sectionKey: 'comunicacao', featureKey: 'emailAutomations', icon: Mail },
          { slug: 'notificacoes-tempo-real', sectionKey: 'comunicacao', featureKey: 'notifications', icon: Bell },
        ],
      },
      {
        sectionKey: 'ia',
        features: [
          { slug: 'analise-deals-ia', sectionKey: 'ia', featureKey: 'dealAnalysis', icon: Brain },
          { slug: 'gerador-scripts-venda', sectionKey: 'ia', featureKey: 'scripts', icon: Bot },
          { slug: 'enriquecimento-contatos', sectionKey: 'ia', featureKey: 'enrichment', icon: Users },
          { slug: 'knowledge-graph-rag', sectionKey: 'ia', featureKey: 'rag', icon: BookOpen },
          { slug: 'insights-recomendacoes', sectionKey: 'ia', featureKey: 'insights', icon: TrendingUp },
        ],
      },
    ],
  },
  {
    menuKey: 'plataforma',
    sections: [
      {
        sectionKey: 'integracoes',
        features: [
          { slug: 'whatsapp-evolution-api', sectionKey: 'integracoes', featureKey: 'whatsapp', icon: MessageSquare },
          { slug: 'google-calendar', sectionKey: 'integracoes', featureKey: 'calendar', icon: Calendar },
          { slug: 'google-meta-ads', sectionKey: 'integracoes', featureKey: 'ads', icon: Megaphone },
          { slug: 'n8n-automacao', sectionKey: 'integracoes', featureKey: 'n8n', icon: Blocks },
          { slug: 'webhooks', sectionKey: 'integracoes', featureKey: 'webhooks', icon: Webhook },
          { slug: 'api-rest', sectionKey: 'integracoes', featureKey: 'api', icon: Plug },
        ],
      },
      {
        sectionKey: 'equipe',
        features: [
          { slug: 'gestao-equipe', sectionKey: 'equipe', featureKey: 'management', icon: Users },
          { slug: 'round-robin', sectionKey: 'equipe', featureKey: 'roundRobin', icon: Shuffle },
          { slug: 'atribuicao-conversas', sectionKey: 'equipe', featureKey: 'assignment', icon: MessageSquare },
        ],
      },
      {
        sectionKey: 'mobile',
        features: [
          { slug: 'pwa', sectionKey: 'mobile', featureKey: 'pwa', icon: Smartphone },
          { slug: 'checkin-gps', sectionKey: 'mobile', featureKey: 'gps', icon: MapPin },
          { slug: 'sync-offline', sectionKey: 'mobile', featureKey: 'offline', icon: Globe },
        ],
      },
      {
        sectionKey: 'seguranca',
        features: [
          { slug: 'criptografia', sectionKey: 'seguranca', featureKey: 'encryption', icon: Shield },
          { slug: 'sso-audit-log', sectionKey: 'seguranca', featureKey: 'sso', icon: Shield },
          { slug: 'api-keys', sectionKey: 'seguranca', featureKey: 'apiKeys', icon: Settings },
        ],
      },
    ],
  },
]

// Flat list of all features for lookup by slug
export const ALL_FEATURES = FEATURE_CATEGORIES.flatMap((cat) =>
  cat.sections.flatMap((sec) => sec.features)
)

export function getFeatureBySlug(slug: string): FeatureItem | undefined {
  return ALL_FEATURES.find((f) => f.slug === slug)
}
