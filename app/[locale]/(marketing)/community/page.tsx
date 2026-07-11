import Link from 'next/link'
import Script from 'next/script'
import { Button } from '@/components/ui/button'
import { Users, MessageCircle, BookOpen, Github, Lightbulb, Trophy, Heart } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { buildLocaleAlternates } from '@/lib/seo/canonical'
import { ORG_SAME_AS } from '@/lib/geo/entity'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketing.community.meta' })
  const alternates = buildLocaleAlternates(locale, '/comunidade', '/community')
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

const communityChannels = [
  {
    title: 'Fórum de Discussões',
    description: 'Tire dúvidas, compartilhe dicas e discuta melhores práticas de vendas com outros usuários.',
    icon: MessageCircle,
    action: 'Em breve',
    href: '#',
    comingSoon: true,
  },
  {
    title: 'Blog & Tutoriais',
    description: 'Aprenda com artigos detalhados, guias passo a passo e estudos de caso reais.',
    icon: BookOpen,
    action: 'Acessar Blog',
    href: '/blog',
    comingSoon: false,
  },
  {
    title: 'GitHub Discussions',
    description: 'Reporte bugs, solicite funcionalidades e acompanhe o roadmap público do produto.',
    icon: Github,
    action: 'Em breve',
    href: '#',
    comingSoon: true,
  },
]

const benefits = [
  {
    title: 'Aprenda com Especialistas',
    description: 'Acesse conteúdo exclusivo criado por profissionais de vendas experientes.',
    icon: Lightbulb,
  },
  {
    title: 'Networking',
    description: 'Conecte-se com empreendedores, vendedores e gestores comerciais de todo o Brasil.',
    icon: Users,
  },
  {
    title: 'Influencie o Produto',
    description: 'Suas sugestões e feedback moldam as próximas funcionalidades do Sirius CRM.',
    icon: Trophy,
  },
  {
    title: 'Suporte da Comunidade',
    description: 'Obtenha ajuda rápida de outros usuários que já passaram pelos mesmos desafios.',
    icon: Heart,
  },
]

const stats = [
  { value: '500+', label: 'Usuários Ativos' },
  { value: '50+', label: 'Empresas Usando' },
  { value: '1000+', label: 'Negócios Criados' },
  { value: '95%', label: 'Satisfação' },
]

export default function CommunityPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://siriuscrm.com.br"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Comunidade",
        "item": "https://siriuscrm.com.br/community"
      }
    ]
  }

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ROI Labs",
    "url": "https://roilabs.com.br",
    "logo": "https://siriuscrm.com.br/logo.png",
    "telephone": "+55-62-98344-3919",
    "email": "roilabs.ia@gmail.com",
    "areaServed": {
      "@type": "Country",
      "name": "Brasil"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+55-62-98344-3919",
      "email": "roilabs.ia@gmail.com",
      "contactType": "customer support",
      "availableLanguage": "Portuguese"
    },
    "sameAs": ORG_SAME_AS
  }

  return (
    <>
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      <div className="bg-background">
        {/* Hero Section */}
        <section className="py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <div className="flex justify-center mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                Comunidade Sirius CRM
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Junte-se a centenas de profissionais de vendas que estão transformando seus resultados comerciais.
                Compartilhe conhecimento, aprenda e cresça junto com a comunidade.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Button asChild size="lg">
                  <Link href="/register">Fazer Parte da Comunidade</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/blog">Ver Conteúdos</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-muted/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center">
                  <div className="text-4xl font-bold text-primary">{stat.value}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground text-center mb-12">
              Por que fazer parte?
            </h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex flex-col items-center text-center p-6 border rounded-lg bg-card">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Channels Section */}
        <section className="py-16 bg-muted/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground text-center mb-4">
              Canais da Comunidade
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Participe das conversas, faça perguntas e contribua para o crescimento coletivo.
            </p>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {communityChannels.map((channel) => (
                <div key={channel.title} className="flex flex-col p-6 bg-background border rounded-lg">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <channel.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{channel.title}</h3>
                  <p className="text-muted-foreground mb-4 flex-1">{channel.description}</p>
                  {channel.comingSoon ? (
                    <Button variant="outline" className="w-full" disabled>
                      {channel.action}
                    </Button>
                  ) : (
                    <Button asChild variant="outline" className="w-full">
                      <Link href={channel.href}>{channel.action}</Link>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Content */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground text-center mb-12">
              Conteúdo em Destaque
            </h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="border rounded-lg overflow-hidden bg-card hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-primary" />
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-2">Guia Completo: Pipeline de Vendas</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Aprenda a estruturar seu funil de vendas do zero e aumentar sua taxa de conversão.
                  </p>
                  <Button asChild variant="link" className="p-0">
                    <Link href="/blog">Ler Artigo →</Link>
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden bg-card hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center">
                  <Trophy className="h-16 w-16 text-blue-600" />
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-2">Casos de Sucesso</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Descubra como empresas estão usando o Sirius CRM para fechar mais negócios.
                  </p>
                  <Button asChild variant="link" className="p-0">
                    <Link href="/blog">Ver Casos →</Link>
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden bg-card hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center">
                  <Lightbulb className="h-16 w-16 text-green-600" />
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-2">Dicas de Vendas</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Técnicas práticas e comprovadas para melhorar seu processo comercial.
                  </p>
                  <Button asChild variant="link" className="p-0">
                    <Link href="/blog">Ver Dicas →</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contribute Section */}
        <section className="py-16 bg-muted/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground mb-6">
                Contribua com a Comunidade
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Tem uma história de sucesso para compartilhar? Uma dúvida que pode ajudar outros?
                Sugestões de novas funcionalidades? Sua voz importa!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/blog">Ler o Blog</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="mailto:comunidade@roilabs.com.br">Entrar em Contato</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center bg-primary/5 border border-primary/20 rounded-2xl p-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Ainda não faz parte?
              </h2>
              <p className="text-muted-foreground mb-6">
                Crie sua conta gratuita e comece a fazer parte de uma comunidade que está transformando vendas no Brasil.
              </p>
              <Button asChild size="lg">
                <Link href="/register">Começar Grátis Agora</Link>
              </Button>
              <p className="mt-4 text-sm text-muted-foreground">
                Sem cartão de crédito. Sem compromisso. 100% gratuito para sempre.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
