import Link from 'next/link'
import Script from 'next/script'
import { Badge } from '@/components/ui/badge'
import { GitBranch, Sparkles, Bug, Zap, Shield, Users, Smartphone, Bell } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Changelog | Sirius CRM',
  description: 'Acompanhe todas as novidades, melhorias e correções do Sirius CRM. Fique por dentro das atualizações mais recentes da plataforma.',
  openGraph: {
    title: 'Changelog | Sirius CRM',
    description: 'Acompanhe todas as novidades e atualizações do Sirius CRM.',
    url: 'https://sirius.roilabs.com.br/changelog',
  },
}

const changelog = [
  {
    version: 'v1.4.0',
    date: '2026-01-09',
    type: 'major',
    items: [
      {
        type: 'feature',
        icon: Smartphone,
        title: 'Progressive Web App (PWA)',
        description: 'Instale o Sirius como aplicativo nativo no seu celular ou desktop com suporte offline completo.',
      },
      {
        type: 'feature',
        icon: Bell,
        title: 'Web Push Notifications',
        description: 'Receba notificações em tempo real sobre novos deals, mensagens WhatsApp e lembretes de calendário.',
      },
      {
        type: 'feature',
        icon: Zap,
        title: 'Background Sync Offline',
        description: 'Crie deals e contatos mesmo sem internet - tudo será sincronizado automaticamente quando voltar online.',
      },
      {
        type: 'feature',
        icon: Bell,
        title: 'Preferências de Notificação',
        description: 'Controle granular de quais notificações você deseja receber: deals, WhatsApp, calendário e muito mais.',
      },
      {
        type: 'feature',
        icon: Sparkles,
        title: 'Dashboard de Métricas PWA',
        description: 'Admin pode monitorar taxa de instalação, conversão de push notifications e uso offline no /admin/pwa-metrics.',
      },
    ],
  },
  {
    version: 'v1.3.0',
    date: '2026-01-05',
    type: 'major',
    items: [
      {
        type: 'feature',
        icon: Sparkles,
        title: 'Testes E2E Completos',
        description: 'Implementados 118 testes E2E com Playwright cobrindo autenticação, pipelines e deals em 3 browsers.',
      },
      {
        type: 'feature',
        icon: Users,
        title: 'Google OAuth Login',
        description: 'Agora você pode fazer login com sua conta Google de forma rápida e segura.',
      },
    ],
  },
  {
    version: 'v1.2.0',
    date: '2026-01-02',
    type: 'major',
    items: [
      {
        type: 'feature',
        icon: Sparkles,
        title: 'Múltiplos Pipelines (PRO)',
        description: 'Usuários PRO agora podem criar pipelines ilimitados para diferentes processos de vendas.',
      },
      {
        type: 'feature',
        icon: Sparkles,
        title: 'Pipeline Selector',
        description: 'Novo seletor visual de pipeline com contador de deals e persistência no localStorage.',
      },
      {
        type: 'improvement',
        icon: Zap,
        title: 'Gerenciamento de Pipelines',
        description: 'Nova página dedicada para criar, editar e deletar pipelines com validações inteligentes.',
      },
    ],
  },
  {
    version: 'v1.1.0',
    date: '2026-01-01',
    type: 'major',
    items: [
      {
        type: 'feature',
        icon: Sparkles,
        title: 'Automações de Email',
        description: 'Configure automações personalizadas: Welcome Email, Deal Created, Stage Changed e Upgrade Nudge.',
      },
      {
        type: 'feature',
        icon: Sparkles,
        title: 'Editor de Templates',
        description: 'Editor visual para personalizar assunto e corpo dos emails com preview em tempo real.',
      },
      {
        type: 'feature',
        icon: Sparkles,
        title: 'Histórico de Emails',
        description: 'Acompanhe todos os emails enviados com status de entrega, abertura e cliques (PRO).',
      },
      {
        type: 'improvement',
        icon: Shield,
        title: 'Testes de Segurança',
        description: 'Implementados 50+ testes unitários cobrindo autenticação, isolamento multi-tenant e pagamentos.',
      },
    ],
  },
  {
    version: 'v1.0.0',
    date: '2025-12-29',
    type: 'major',
    items: [
      {
        type: 'feature',
        icon: Sparkles,
        title: 'Lançamento Oficial',
        description: 'Primeira versão estável do Sirius CRM com todas as funcionalidades core.',
      },
      {
        type: 'feature',
        icon: GitBranch,
        title: 'Pipeline Kanban',
        description: 'Gestão visual de negócios com drag & drop entre etapas personalizáveis.',
      },
      {
        type: 'feature',
        icon: Users,
        title: 'Gestão de Contatos',
        description: 'CRUD completo de contatos com integração WhatsApp de 1 clique.',
      },
      {
        type: 'feature',
        icon: Zap,
        title: 'Analytics Dashboard',
        description: 'Métricas em tempo real: taxa de conversão, ticket médio e previsão de fechamento.',
      },
      {
        type: 'feature',
        icon: Shield,
        title: 'Autenticação Segura',
        description: 'Sistema de login/registro com JWT, bcrypt e proteção contra ataques comuns.',
      },
      {
        type: 'feature',
        icon: Shield,
        title: 'Isolamento Multi-Tenant',
        description: 'Dados de cada organização completamente isolados com validações em todas as queries.',
      },
    ],
  },
  {
    version: 'v0.9.0',
    date: '2025-12-20',
    type: 'beta',
    items: [
      {
        type: 'feature',
        icon: Sparkles,
        title: 'Mercado Pago Integration',
        description: 'Integração completa com Mercado Pago para pagamentos recorrentes e upgrade PRO.',
      },
      {
        type: 'feature',
        icon: Zap,
        title: 'Feature Gates',
        description: 'Sistema de limites por plano: 10 deals para Free, ilimitado para PRO.',
      },
      {
        type: 'improvement',
        icon: Shield,
        title: 'Sentry Monitoring',
        description: 'Captura e rastreamento de erros em produção com source maps.',
      },
      {
        type: 'improvement',
        icon: Zap,
        title: 'Structured Logging',
        description: 'Sistema de logs estruturado com Pino para melhor debugging.',
      },
    ],
  },
]

const typeColors = {
  major: 'bg-primary text-primary-foreground',
  beta: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
}

const itemTypeConfig = {
  feature: {
    icon: Sparkles,
    label: 'Novo',
    color: 'bg-green-500/10 text-green-700 dark:text-green-400',
  },
  improvement: {
    icon: Zap,
    label: 'Melhoria',
    color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  },
  fix: {
    icon: Bug,
    label: 'Correção',
    color: 'bg-red-500/10 text-red-700 dark:text-red-400',
  },
  security: {
    icon: Shield,
    label: 'Segurança',
    color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  },
}

export default function ChangelogPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://sirius.roilabs.com.br"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Changelog",
        "item": "https://sirius.roilabs.com.br/changelog"
      }
    ]
  }

  return (
    <>
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="bg-background">
        {/* Hero Section */}
        <section className="py-20 sm:py-32">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <GitBranch className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Changelog
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Acompanhe todas as novidades, melhorias e correções do Sirius CRM.
                Estamos sempre evoluindo para oferecer a melhor experiência.
              </p>
            </div>
          </div>
        </section>

        {/* Changelog Timeline */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <div className="space-y-12">
              {changelog.map((release, idx) => (
                <div key={release.version} className="relative">
                  {/* Timeline line */}
                  {idx !== changelog.length - 1 && (
                    <div className="absolute left-8 top-16 -bottom-12 w-px bg-border" />
                  )}

                  <div className="relative flex gap-6">
                    {/* Version Badge */}
                    <div className="flex-shrink-0">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-8 ring-background">
                        <GitBranch className="h-6 w-6 text-primary" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-8">
                      <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-2xl font-bold text-foreground">
                          {release.version}
                        </h2>
                        <Badge className={typeColors[release.type as keyof typeof typeColors]}>
                          {release.type === 'major' ? 'Release' : 'Beta'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(release.date).toLocaleDateString('pt-BR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="space-y-4">
                        {release.items.map((item, itemIdx) => {
                          const config = itemTypeConfig[item.type as keyof typeof itemTypeConfig]
                          const Icon = item.icon

                          return (
                            <div
                              key={itemIdx}
                              className="flex gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                            >
                              <div className="flex-shrink-0">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.color}`}>
                                  <Icon className="h-5 w-5" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-foreground">
                                    {item.title}
                                  </h3>
                                  <Badge variant="outline" className="text-xs">
                                    {config.label}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Subscribe CTA */}
        <section className="py-16 bg-muted/50">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <div className="text-center bg-background border rounded-2xl p-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Quer receber notificações de atualizações?
              </h2>
              <p className="text-muted-foreground mb-6">
                Crie uma conta gratuita e receba emails quando lançarmos novas funcionalidades.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                >
                  Começar Grátis
                </Link>
                <Link
                  href="/blog"
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-semibold hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Ler Blog
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap Teaser */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Próximas Funcionalidades
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Estamos trabalhando em recursos incríveis para os próximos meses:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 border rounded-lg text-left">
                  <h3 className="font-semibold text-foreground mb-2">Integrações N8N</h3>
                  <p className="text-sm text-muted-foreground">
                    Automação avançada de workflows com webhooks bidirecionais.
                  </p>
                </div>
                <div className="p-6 border rounded-lg text-left">
                  <h3 className="font-semibold text-foreground mb-2">WhatsApp Evolution</h3>
                  <p className="text-sm text-muted-foreground">
                    Integração completa: enviar, receber e automatizar mensagens.
                  </p>
                </div>
                <div className="p-6 border rounded-lg text-left">
                  <h3 className="font-semibold text-foreground mb-2">Google Calendar Sync</h3>
                  <p className="text-sm text-muted-foreground">
                    Sincronização bidirecional de eventos e lembretes automáticos.
                  </p>
                </div>
                <div className="p-6 border rounded-lg text-left">
                  <h3 className="font-semibold text-foreground mb-2">AI Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    Sugestões inteligentes de próximas ações baseadas em IA.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
