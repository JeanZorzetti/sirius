import Link from 'next/link'
import Script from 'next/script'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  MessageCircle,
  Mail,
  FileText,
  Play,
  HelpCircle,
  Zap,
  Users,
  BarChart3,
  Kanban
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Central de Ajuda | Sirius CRM',
  description: 'Encontre respostas para suas dúvidas sobre o Sirius CRM. Tutoriais, guias e suporte para aproveitar ao máximo sua ferramenta de vendas.',
  openGraph: {
    title: 'Central de Ajuda | Sirius CRM',
    description: 'Encontre respostas para suas dúvidas sobre o Sirius CRM. Tutoriais, guias e suporte.',
    url: 'https://sirius.roilabs.com.br/help',
  },
}

const faqItems = [
  {
    question: 'Como criar meu primeiro negócio?',
    answer: 'Após fazer login, clique no botão "Novo Deal" no dashboard. Preencha o título, valor e selecione um contato. O negócio será criado na primeira etapa do seu pipeline.',
    icon: Kanban,
  },
  {
    question: 'Como funciona o Pipeline Kanban?',
    answer: 'O pipeline é dividido em etapas (colunas). Arraste os cards de negócios entre as colunas para indicar progresso. Personalize as etapas em Configurações > Pipelines.',
    icon: Kanban,
  },
  {
    question: 'Como adicionar contatos?',
    answer: 'Vá em Contatos > Novo Contato. Preencha nome, email e telefone. Você também pode criar contatos diretamente ao criar um negócio.',
    icon: Users,
  },
  {
    question: 'Como usar o WhatsApp integrado?',
    answer: 'Clique no botão verde (ícone do WhatsApp) em qualquer card de negócio que tenha um contato com telefone cadastrado. O WhatsApp Web abrirá automaticamente.',
    icon: MessageCircle,
  },
  {
    question: 'Qual a diferença entre Plano Free e Pro?',
    answer: 'O Plano Free permite até 10 negócios ativos e 1 pipeline. O Pro remove limites, adiciona múltiplos pipelines, analytics avançado e automações de email.',
    icon: Zap,
  },
  {
    question: 'Como interpretar o dashboard de Analytics?',
    answer: 'O Analytics mostra taxa de conversão (% de negócios fechados), ticket médio (valor médio dos deals) e previsão de fechamento (receita esperada para o mês).',
    icon: BarChart3,
  },
  {
    question: 'Meus dados estão seguros?',
    answer: 'Sim. Usamos criptografia de ponta a ponta, isolamento multi-tenant e backups diários. Seus dados nunca são compartilhados com outras organizações.',
    icon: HelpCircle,
  },
  {
    question: 'Como convidar minha equipe?',
    answer: 'Vá em Configurações > Membros da Equipe. Clique em "Convidar Membro", insira o email e defina a permissão (Owner ou Member).',
    icon: Users,
  },
]

const supportChannels = [
  {
    title: 'Email',
    description: 'Envie suas dúvidas para nosso time de suporte',
    icon: Mail,
    action: 'Enviar Email',
    href: 'mailto:suporte@roilabs.com.br',
  },
  {
    title: 'Blog & Tutoriais',
    description: 'Artigos e guias para dominar o Sirius CRM',
    icon: BookOpen,
    action: 'Ver Blog',
    href: '/blog',
  },
  {
    title: 'Documentação',
    description: 'Guias técnicos e referências completas',
    icon: FileText,
    action: 'Acessar Docs',
    href: '/features',
  },
]

export default function HelpPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  }

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
        "name": "Ajuda",
        "item": "https://sirius.roilabs.com.br/help"
      }
    ]
  }

  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="bg-background">
        {/* Hero Section */}
        <section className="py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                Como podemos ajudar?
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Encontre respostas rápidas para suas dúvidas ou entre em contato com nosso time de suporte.
              </p>
            </div>
          </div>
        </section>

        {/* Support Channels */}
        <section className="py-16 bg-muted/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground text-center mb-12">
              Canais de Suporte
            </h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {supportChannels.map((channel) => (
                <div key={channel.title} className="flex flex-col items-center text-center p-6 bg-background border rounded-lg">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary mb-4">
                    <channel.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{channel.title}</h3>
                  <p className="text-muted-foreground mb-4 flex-1">{channel.description}</p>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={channel.href}>{channel.action}</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground text-center mb-12">
              Perguntas Frequentes
            </h2>
            <div className="space-y-6">
              {faqItems.map((item, index) => (
                <div key={index} className="border rounded-lg p-6 bg-card hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {item.question}
                      </h3>
                      <p className="text-muted-foreground leading-7">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Video Tutorial CTA */}
        <section className="py-16 bg-muted/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <div className="flex justify-center mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                  <Play className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
                Prefere aprender assistindo?
              </h2>
              <p className="text-lg leading-8 text-muted-foreground mb-8">
                Acesse nosso blog com tutoriais em vídeo e guias passo a passo para dominar o Sirius CRM.
              </p>
              <Button asChild size="lg">
                <Link href="/blog">Ver Tutoriais</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Still Need Help CTA */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center bg-primary/5 border border-primary/20 rounded-2xl p-12">
              <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
                Ainda precisa de ajuda?
              </h2>
              <p className="text-muted-foreground mb-6">
                Nossa equipe está pronta para responder suas dúvidas e ajudar você a aproveitar ao máximo o Sirius CRM.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="mailto:suporte@roilabs.com.br">Falar com Suporte</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/register">Começar Grátis</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
