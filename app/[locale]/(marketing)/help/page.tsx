import Link from 'next/link'
import Script from 'next/script'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  BookOpen,
  MessageCircle,
  Mail,
  HelpCircle,
  Search,
  Zap,
  Users,
  BarChart3,
  Kanban,
  Settings,
  ChevronRight,
  ExternalLink,
  Clock,
  LifeBuoy,
} from 'lucide-react'
import type { Metadata } from 'next'
import { getAllCategories } from '@/lib/help-articles'

export const metadata: Metadata = {
  title: 'Central de Ajuda | Sirius CRM',
  description: 'Encontre respostas para suas dúvidas sobre o Sirius CRM. Tutoriais, guias e suporte para aproveitar ao máximo sua ferramenta de vendas.',
  alternates: { canonical: 'https://siriuscrm.com.br/help' },
  openGraph: {
    title: 'Central de Ajuda | Sirius CRM',
    description: 'Encontre respostas para suas dúvidas sobre o Sirius CRM. Tutoriais, guias e suporte.',
    url: 'https://siriuscrm.com.br/help',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Central de Ajuda | Sirius CRM',
    description: 'Tutoriais, guias e suporte para aproveitar ao máximo o Sirius CRM.',
  },
}

const categories = [
  {
    icon: Zap,
    title: "Primeiros Passos",
    description: "Setup inicial e conceitos básicos do Sirius CRM",
    slug: "primeiros-passos",
  },
  {
    icon: Kanban,
    title: "Pipeline e Negócios",
    description: "Kanban, stages, múltiplos pipelines e gestão de deals",
    slug: "pipeline-negocios",
  },
  {
    icon: Users,
    title: "Contatos",
    description: "Gestão de contatos e importação de dados",
    slug: "contatos",
  },
  {
    icon: Zap,
    title: "Automações",
    description: "Email automations e workflows inteligentes",
    slug: "automacoes",
  },
  {
    icon: BarChart3,
    title: "Analytics e Relatórios",
    description: "Métricas, forecasting e exportação de dados",
    slug: "analytics",
  },
  {
    icon: Settings,
    title: "Integrações",
    description: "WhatsApp, Google Calendar, N8N e API",
    slug: "integracoes",
  },
  {
    icon: Users,
    title: "Equipe e Configurações",
    description: "Permissões, perfil e notificações",
    slug: "equipe",
  },
  {
    icon: HelpCircle,
    title: "Planos e Billing",
    description: "FREE vs PRO, assinatura e pagamentos",
    slug: "planos",
  },
]

const articlesByCategory = {
  "primeiros-passos": [
    { title: "Como criar seu primeiro negócio", slug: "criar-primeiro-negocio" },
    { title: "Atalhos de teclado do Sirius CRM", slug: "atalhos-teclado" },
    { title: "Melhores práticas de gestão de vendas", slug: "melhores-praticas-vendas" },
    { title: "Troubleshooting: problemas comuns", slug: "troubleshooting" },
  ],
  "pipeline-negocios": [
    { title: "Entendendo o Pipeline Kanban", slug: "entendendo-pipeline-kanban" },
    { title: "Criando múltiplos pipelines", slug: "multiplos-pipelines" },
    { title: "Usando filtros e busca avançada", slug: "filtros-busca" },
    { title: "Marcando deals como perdidos", slug: "deals-perdidos" },
    { title: "Personalizando etapas do pipeline", slug: "personalizar-etapas" },
    { title: "Adicionando tags e custom fields", slug: "tags-custom-fields" },
  ],
  "contatos": [
    { title: "Como cadastrar e gerenciar contatos", slug: "cadastrar-contatos" },
    { title: "Importando contatos via CSV", slug: "importar-contatos-csv" },
  ],
  "automacoes": [
    { title: "Configurando automações de email", slug: "automacoes-email" },
  ],
  "analytics": [
    { title: "Entendendo o Analytics básico", slug: "analytics-basico" },
    { title: "Analytics PRO: Forecasting de vendas", slug: "forecasting-vendas" },
    { title: "Exportando dados para análise", slug: "exportar-dados" },
  ],
  "integracoes": [
    { title: "Integração com WhatsApp", slug: "integracao-whatsapp" },
    { title: "Sincronizando com Google Calendar", slug: "google-calendar" },
    { title: "Usando a API do Sirius CRM", slug: "usando-api" },
    { title: "Integrando com N8N", slug: "integracao-n8n" },
  ],
  "equipe": [
    { title: "Gerenciando permissões de equipe", slug: "permissoes-equipe" },
    { title: "Configurando notificações", slug: "configurar-notificacoes" },
    { title: "Configurando seu perfil", slug: "configurar-perfil" },
  ],
  "planos": [
    { title: "Diferenças entre FREE e PRO", slug: "free-vs-pro" },
    { title: "Gerenciando assinatura e pagamentos", slug: "gerenciar-assinatura" },
  ],
}

const popularArticles = [
  {
    title: "Como criar seu primeiro negócio",
    category: "Primeiros Passos",
    categorySlug: "primeiros-passos",
    slug: "criar-primeiro-negocio",
  },
  {
    title: "Entendendo o Pipeline Kanban",
    category: "Pipeline e Negócios",
    categorySlug: "pipeline-negocios",
    slug: "entendendo-pipeline-kanban",
  },
  {
    title: "Integração com WhatsApp",
    category: "Integrações",
    categorySlug: "integracoes",
    slug: "integracao-whatsapp",
  },
  {
    title: "Diferenças entre FREE e PRO",
    category: "Planos",
    categorySlug: "planos",
    slug: "free-vs-pro",
  },
  {
    title: "Configurando automações de email",
    category: "Automações",
    categorySlug: "automacoes",
    slug: "automacoes-email",
  },
  {
    title: "Entendendo o Analytics básico",
    category: "Analytics",
    categorySlug: "analytics",
    slug: "analytics-basico",
  },
]

const faqItems = [
  {
    question: 'Como criar meu primeiro negócio?',
    answer: 'Após fazer login, clique no botão "Novo Deal" no dashboard. Preencha o título, valor e selecione um contato. O negócio será criado na primeira etapa do seu pipeline.',
  },
  {
    question: 'Como funciona o Pipeline Kanban?',
    answer: 'O pipeline é dividido em etapas (colunas). Arraste os cards de negócios entre as colunas para indicar progresso. Personalize as etapas em Configurações > Pipelines.',
  },
  {
    question: 'Qual a diferença entre Plano Free e Pro?',
    answer: 'O Plano Free permite até 1 pipeline e 1 usuário. O Pro remove limites, adiciona múltiplos pipelines, analytics avançado, automações de email e gestão de equipe.',
  },
  {
    question: 'Como adicionar membros à equipe?',
    answer: 'Vá em Configurações > Membros da Equipe. Clique em "Convidar Membro", insira o email e defina a permissão (Owner, Admin ou Member).',
  },
  {
    question: 'Meus dados estão seguros?',
    answer: 'Sim. Usamos criptografia de ponta a ponta, isolamento multi-tenant e backups diários. Seus dados nunca são compartilhados com outras organizações.',
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

  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-4">
              <HelpCircle className="w-3 h-3 mr-1" />
              Central de Ajuda
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Como podemos{" "}
              <span className="bg-gradient-to-r from-primary to-purple-600 text-transparent bg-clip-text">
                ajudar?
              </span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Encontre respostas, tutoriais e guias para aproveitar o máximo do Sirius CRM.
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar na central de ajuda..."
                  className="pl-12 h-14 text-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-8 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <Link href="#faq">
                <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Perguntas Frequentes</h3>
                    <p className="text-sm text-muted-foreground">Respostas rápidas</p>
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/support">
                <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <LifeBuoy className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Abrir Ticket de Suporte</h3>
                    <p className="text-sm text-muted-foreground">Atendimento rastreável</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Popular Articles */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Artigos Populares</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularArticles.map((article, index) => (
                <Link key={index} href={`/help/${article.categorySlug}/${article.slug}`}>
                  <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors">
                    <BookOpen className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm truncate">{article.title}</h3>
                      <span className="text-xs text-muted-foreground">{article.category}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Articles by Category */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-2xl font-bold mb-8 text-center">
              Guias Completos por Categoria
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {categories.map((category, catIndex) => {
                const categoryArticles = articlesByCategory[category.slug as keyof typeof articlesByCategory] || [];
                return (
                  <div
                    key={catIndex}
                    className="bg-card border border-border rounded-xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <category.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{category.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {categoryArticles.length} artigos disponíveis
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {categoryArticles.map((article, artIndex) => (
                        <Link
                          key={artIndex}
                          href={`/help/${category.slug}/${article.slug}`}
                        >
                          <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                            <span className="text-sm group-hover:text-primary transition-colors">
                              {article.title}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Perguntas Frequentes
            </h2>
            <div className="space-y-4">
              {faqItems.map((faq, index) => (
                <div
                  key={index}
                  className="bg-card border border-border rounded-xl p-5"
                >
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Support */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-card border border-border rounded-2xl p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-3">
                  Não encontrou o que procura?
                </h2>
                <p className="text-muted-foreground">
                  Nossa equipe de suporte está pronta para ajudar você.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <LifeBuoy className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">Tickets</h3>
                  <p className="text-sm text-muted-foreground">
                    Histórico e rastreamento
                  </p>
                </div>

                <div className="text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">Chat em tempo real</h3>
                  <p className="text-sm text-muted-foreground">
                    Resposta dentro do ticket
                  </p>
                </div>

                <div className="text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">Horário</h3>
                  <p className="text-sm text-muted-foreground">
                    Seg-Sex, 08h-18h
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <Button size="lg" asChild>
                  <Link href="/dashboard/support">
                    Abrir Ticket de Suporte
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="https://wa.me/5562998015884?text=Olá! Preciso de ajuda com o Sirius CRM." target="_blank" rel="noopener noreferrer">
                    Urgente? WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
