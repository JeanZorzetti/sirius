import { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Mail, Phone, Building2, Users, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Solicitar Proposta Comercial | Sirius CRM',
  description: 'Solicite uma proposta comercial personalizada para sua empresa. Nossa equipe entrará em contato em até 24h para apresentar a melhor solução em CRM.',
  keywords: ['proposta comercial', 'plano customizado', 'enterprise', 'vendas', 'sirius crm'],
  alternates: { canonical: 'https://siriuscrm.com.br/proposta' },
  openGraph: {
    title: 'Solicitar Proposta Comercial | Sirius CRM',
    description: 'Solicite uma proposta personalizada. Nossa equipe entrará em contato em até 24h.',
    url: 'https://siriuscrm.com.br/proposta',
    images: [{
      url: 'https://siriuscrm.com.br/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Sirius CRM - CRM Inteligente para Vendedores Brasileiros',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Solicitar Proposta Comercial | Sirius CRM',
    description: 'Proposta personalizada para sua empresa. Resposta em até 24h.',
  },
}

export default function PropostaPage() {
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
        "name": "Proposta",
        "item": "https://siriuscrm.com.br/proposta"
      }
    ]
  }

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Commercial Proposal",
    "provider": {
      "@type": "Organization",
      "name": "Sirius CRM",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "Sales",
        "email": "vendas@siriuscrm.com.br",
        "availableLanguage": "Portuguese"
      }
    },
    "description": "Proposta comercial personalizada para empresas. Resposta em até 24 horas.",
    "areaServed": {
      "@type": "Country",
      "name": "Brasil"
    }
  }

  return (
    <>
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="service-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-5xl py-12 px-6">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Home
          </Button>
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <FileText className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Solicitar Proposta Comercial
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Preencha o formulário abaixo e nossa equipe entrará em contato em até 24h com uma proposta personalizada
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Formulário */}
          <Card>
            <CardHeader>
              <CardTitle>Dados da Empresa</CardTitle>
              <CardDescription>
                Preencha os dados para receber uma proposta personalizada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form action="https://formspree.io/f/YOUR_FORM_ID" method="POST" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Nome da Empresa *</Label>
                  <Input id="company" name="company" required placeholder="Sua Empresa Ltda" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Seu Nome *</Label>
                  <Input id="name" name="name" required placeholder="João Silva" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Corporativo *</Label>
                  <Input id="email" name="email" type="email" required placeholder="joao@empresa.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input id="phone" name="phone" type="tel" required placeholder="(11) 99999-9999" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team_size">Tamanho da Equipe de Vendas</Label>
                  <select
                    id="team_size"
                    name="team_size"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Selecione...</option>
                    <option value="1-5">1-5 vendedores</option>
                    <option value="6-15">6-15 vendedores</option>
                    <option value="16-50">16-50 vendedores</option>
                    <option value="51+">Mais de 50 vendedores</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem / Necessidades Específicas</Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={4}
                    placeholder="Conte-nos mais sobre suas necessidades..."
                  />
                </div>

                <Button type="submit" size="lg" className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Solicitar Proposta
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Informações Adicionais */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>O que acontece depois?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Análise da Sua Necessidade</h3>
                    <p className="text-sm text-muted-foreground">
                      Nossa equipe analisa seu perfil e necessidades específicas
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Proposta Personalizada</h3>
                    <p className="text-sm text-muted-foreground">
                      Montamos uma proposta adequada ao tamanho da sua operação
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Apresentação e Alinhamento</h3>
                    <p className="text-sm text-muted-foreground">
                      Marcamos uma reunião para apresentar a proposta e tirar dúvidas
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Onboarding Dedicado</h3>
                    <p className="text-sm text-muted-foreground">
                      Após aprovação, iniciamos a implementação com suporte total
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground">
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-4">Ou fale diretamente com vendas:</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5" />
                    <span>vendas@siriuscrm.com.br</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5" />
                    <span>(11) 99999-9999</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
