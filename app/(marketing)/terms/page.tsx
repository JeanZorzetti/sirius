import Link from 'next/link'
import Script from 'next/script'
import { FileText, Scale, CreditCard, AlertTriangle, UserX, Shield } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso | Sirius CRM',
  description: 'Termos e condições de uso do Sirius CRM. Direitos, responsabilidades e regras de utilização da plataforma.',
  openGraph: {
    title: 'Termos de Uso | Sirius CRM',
    description: 'Termos e condições de uso do Sirius CRM. Direitos e responsabilidades dos usuários.',
    url: 'https://sirius.roilabs.com.br/terms',
  },
}

export default function TermsPage() {
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
        "name": "Termos de Uso",
        "item": "https://sirius.roilabs.com.br/terms"
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
                  <Scale className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Termos de Uso
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Última atualização: 1 de janeiro de 2026
              </p>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                Leia atentamente estes termos antes de usar o Sirius CRM. Ao criar uma conta, você concorda com estas condições.
              </p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">

              {/* 1. Aceitação dos Termos */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground m-0">1. Aceitação dos Termos</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7">
                    Ao acessar e usar o Sirius CRM ("<strong className="text-foreground">Serviço</strong>"), você concorda em estar vinculado a estes
                    Termos de Uso ("<strong className="text-foreground">Termos</strong>"). Se você não concordar com qualquer parte destes termos,
                    não use o Serviço.
                  </p>
                  <p className="text-base leading-7">
                    O Sirius CRM é operado pela <strong className="text-foreground">ROI Labs</strong> ("<strong className="text-foreground">nós</strong>",
                    "<strong className="text-foreground">nosso</strong>" ou "<strong className="text-foreground">empresa</strong>").
                  </p>
                </div>
              </div>

              {/* 2. Descrição do Serviço */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground m-0">2. Descrição do Serviço</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7">
                    O Sirius CRM é uma plataforma de gestão de relacionamento com clientes (CRM) baseada em nuvem que oferece:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-base leading-7">
                    <li>Gestão de pipeline de vendas (Kanban)</li>
                    <li>Gerenciamento de contatos</li>
                    <li>Analytics e relatórios</li>
                    <li>Automações de email (plano PRO)</li>
                    <li>Múltiplos pipelines (plano PRO)</li>
                  </ul>
                  <p className="text-base leading-7">
                    Reservamos o direito de modificar, suspender ou descontinuar qualquer parte do Serviço a qualquer momento, com ou sem aviso prévio.
                  </p>
                </div>
              </div>

              {/* 3. Cadastro e Conta */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground m-0">3. Cadastro e Conta</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Elegibilidade:</strong> Você deve ter pelo menos 18 anos para criar uma conta.
                  </p>
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Informações Precisas:</strong> Você concorda em fornecer informações verdadeiras, precisas e completas durante o cadastro.
                  </p>
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Segurança da Conta:</strong> Você é responsável por manter a confidencialidade de sua senha e por todas as atividades em sua conta.
                  </p>
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Notificação de Uso Não Autorizado:</strong> Notifique-nos imediatamente sobre qualquer uso não autorizado de sua conta.
                  </p>
                </div>
              </div>

              {/* 4. Planos e Pagamentos */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground m-0">4. Planos e Pagamentos</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Plano Free:</strong> Até 10 negócios ativos, 1 pipeline, funcionalidades básicas. Gratuito permanentemente.
                  </p>
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Plano PRO:</strong> R$ 97/mês. Negócios ilimitados, múltiplos pipelines, automações e analytics avançado.
                  </p>
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Faturamento:</strong> Cobranças recorrentes mensais processadas via Stripe. Você será cobrado na data de assinatura a cada mês.
                  </p>
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Cancelamento:</strong> Você pode cancelar a qualquer momento. Não há reembolso proporcional para cancelamentos no meio do ciclo.
                  </p>
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Aumento de Preço:</strong> Podemos alterar preços com aviso prévio de 30 dias por email.
                  </p>
                </div>
              </div>

              {/* 5. Uso Aceitável */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground m-0">5. Uso Aceitável</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7">
                    Você concorda em <strong className="text-foreground">NÃO</strong>:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-base leading-7">
                    <li>Usar o Serviço para fins ilegais ou fraudulentos</li>
                    <li>Enviar spam, phishing ou conteúdo malicioso</li>
                    <li>Tentar acessar contas de outros usuários sem autorização</li>
                    <li>Sobrecarregar ou prejudicar a infraestrutura do Serviço</li>
                    <li>Fazer engenharia reversa, copiar ou modificar o código-fonte</li>
                    <li>Revender ou sublicenciar o Serviço sem permissão explícita</li>
                    <li>Coletar dados de outros usuários sem consentimento</li>
                  </ul>
                  <p className="text-base leading-7 font-semibold text-foreground">
                    Violações podem resultar em suspensão ou encerramento imediato da conta, sem reembolso.
                  </p>
                </div>
              </div>

              {/* 6. Propriedade Intelectual */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Scale className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground m-0">6. Propriedade Intelectual</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Nosso Conteúdo:</strong> Todo o código, design, logos, marca "Sirius CRM" e conteúdo do site são propriedade da ROI Labs.
                  </p>
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Seus Dados:</strong> Você mantém todos os direitos sobre os dados que insere no sistema (contatos, negócios, etc.).
                    Concede-nos licença limitada para processar esses dados a fim de fornecer o Serviço.
                  </p>
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Licença de Uso:</strong> Concedemos a você uma licença não exclusiva, intransferível e revogável para usar o Sirius CRM
                    conforme estes Termos.
                  </p>
                </div>
              </div>

              {/* 7. Garantias e Limitação de Responsabilidade */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground m-0">7. Garantias e Limitação de Responsabilidade</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Disponibilidade:</strong> Buscamos manter 99.9% de uptime, mas não garantimos disponibilidade ininterrupta.
                    Podemos realizar manutenções programadas com aviso prévio.
                  </p>
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Como Está:</strong> O Serviço é fornecido "como está" sem garantias de qualquer tipo, expressas ou implícitas.
                  </p>
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Limitação de Responsabilidade:</strong> Em nenhuma circunstância seremos responsáveis por danos indiretos, incidentais,
                    especiais ou consequenciais, incluindo perda de lucros, dados ou oportunidades de negócio.
                  </p>
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Valor Máximo:</strong> Nossa responsabilidade total está limitada ao valor pago nos últimos 12 meses.
                  </p>
                </div>
              </div>

              {/* 8. Privacidade e Dados */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground m-0">8. Privacidade e Dados</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7">
                    Nossa <Link href="/privacy" className="text-primary hover:underline">Política de Privacidade</Link> explica como coletamos, usamos e protegemos seus dados.
                  </p>
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Backups:</strong> Realizamos backups diários, mas você é responsável por manter cópias próprias de dados críticos.
                  </p>
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Exportação:</strong> Você pode exportar seus dados a qualquer momento através do dashboard.
                  </p>
                </div>
              </div>

              {/* 9. Rescisão */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <UserX className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground m-0">9. Rescisão</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Por Você:</strong> Pode cancelar sua conta a qualquer momento através das Configurações.
                  </p>
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Por Nós:</strong> Podemos suspender ou encerrar sua conta se você violar estes Termos ou por inatividade prolongada (12+ meses).
                  </p>
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Após Cancelamento:</strong> Seus dados serão retidos por 90 dias para recuperação, depois deletados permanentemente.
                    Não há reembolso para cancelamentos.
                  </p>
                </div>
              </div>

              {/* 10. Alterações nos Termos */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground m-0">10. Alterações nos Termos</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7">
                    Podemos atualizar estes Termos a qualquer momento. Mudanças significativas serão comunicadas por email com 30 dias de antecedência.
                  </p>
                  <p className="text-base leading-7">
                    O uso continuado do Serviço após alterações constitui aceitação dos novos Termos.
                  </p>
                </div>
              </div>

              {/* 11. Lei Aplicável */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Scale className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground m-0">11. Lei Aplicável</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7">
                    Estes Termos são regidos pelas leis do Brasil. Disputas serão resolvidas nos tribunais competentes do Brasil.
                  </p>
                </div>
              </div>

              {/* 12. Contato */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground m-0">12. Contato</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7">
                    Para dúvidas sobre estes Termos, entre em contato:
                  </p>
                  <ul className="list-none space-y-2 text-base leading-7">
                    <li><strong className="text-foreground">Email:</strong> <a href="mailto:legal@roilabs.com.br" className="text-primary hover:underline">legal@roilabs.com.br</a></li>
                    <li><strong className="text-foreground">Empresa:</strong> ROI Labs</li>
                    <li><strong className="text-foreground">Site:</strong> <a href="https://sirius.roilabs.com.br" className="text-primary hover:underline">sirius.roilabs.com.br</a></li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-muted/50">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Pronto para começar?
              </h2>
              <p className="text-muted-foreground mb-6">
                Ao criar sua conta, você concorda com estes Termos de Uso e nossa Política de Privacidade.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                >
                  Criar Conta Gratuita
                </Link>
                <Link
                  href="/privacy"
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-semibold hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Ver Política de Privacidade
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
