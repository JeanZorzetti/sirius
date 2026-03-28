import { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Scale, Shield, AlertTriangle, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Termos de Uso | Sirius CRM',
  description: 'Termos e condições de uso da plataforma Sirius CRM. Conheça seus direitos e responsabilid ades ao utilizar nosso sistema de gestão de vendas.',
  openGraph: {
    title: 'Termos de Uso | Sirius CRM',
    description: 'Termos e condições de uso da plataforma Sirius CRM.',
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

      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-4xl py-12 px-6">
          <Link href="/">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Home
            </Button>
          </Link>

          <div className="prose prose-zinc dark:prose-invert max-w-none">
            <div className="flex items-center gap-4 mb-8">
              <FileText className="h-12 w-12 text-primary" />
              <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">Termos de Uso</h1>
                <p className="text-muted-foreground">Última atualização: 02 de fevereiro de 2026</p>
              </div>
            </div>

            {/* 1. Aceutação */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Scale className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">1. Aceitação dos Termos</h2>
              </div>
              <div className="space-y-4 ml-13">
                <p>
                  Ao acessar e usar a plataforma <strong>Sirius CRM</strong> ("Plataforma", "Serviço"), desenvolvida pela <strong>ROI Labs</strong>, você concorda com estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deve utilizar nossos serviços.
                </p>
                <p>
                  Ao criar uma conta, você declara ter lido, compreendido e aceitado integralmente estes Termos, bem como nossa <Link href="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>.
                </p>
              </div>
            </div>

            {/* 2. Descrição do Serviço */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">2. Descrição do Serviço</h2>
              <div className="space-y-4">
                <p>
                  O Sirius CRM é uma plataforma SaaS (Software as a Service) de gestão de relacionamento com clientes, que oferece:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Pipeline Kanban para gestão visual de negócios</li>
                  <li>Gestão de contatos e organizações</li>
                  <li>Automações de email e workflows</li>
                  <li>Analytics e relatórios de vendas</li>
                  <li>Integrações com WhatsApp, Google Calendar e outras ferramentas</li>
                  <li>API para integrações personalizadas</li>
                </ul>
                <p>
                  Reservamo-nos o direito de modificar, suspender ou descontinuar qualquer funcionalidade a qualquer momento, com aviso prévio de 30 dias para mudanças significativas.
                </p>
              </div>
            </div>

            {/* 3. Planos e Pagamento */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">3. Planos e Pagamento</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">3.1. Planos Disponíveis</h3>
                <p>
                  Oferecemos dois planos principais:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Plano FREE:</strong> Gratuito para sempre, com limites de uso (1 pipeline, 100 deals, 2 usuários)</li>
                  <li><strong>Plano PRO:</strong> R$ 147/mês, sem limites de pipelines, deals ou usuários</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6">3.2. Pagamentos</h3>
                <p>
                  Pagamentos são processados via <strong>Mercado Pago</strong> e renovam automaticamente até cancelamento.
                  Não armazenamos dados de cartão de crédito.
                </p>

                <h3 className="text-xl font-semibold mt-6">3.3. Cancelamento</h3>
                <p>
                  Você pode cancelar sua assinatura PRO a qualquer momento através das Configurações da conta.
                  Cancelamentos terão efeito imediato, mas você mantém acesso ao PRO até o fim do período pago.
                  <strong> Não há reembolso proporcional.</strong>
                </p>

                <h3 className="text-xl font-semibold mt-6">3.4. Inadimplência</h3>
                <p>
                  Em caso de falha de pagamento, sua conta será automaticamente rebaixada ao Plano FREE.
                  Dados em excesso aos limites do FREE serão arquivados, mas não deletados.
                </p>
              </div>
            </div>

            {/* 4. Cadastro e Conta */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">4. Cadastro e Responsabilidades do Usuário</h2>
              <div className="space-y-4">
                <p>
                  Ao criar uma conta, você se compromete a:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Fornecer informações verdadeiras, atualizadas e completas</li>
                  <li>Manter a segurança de sua senha e não compartilhá-la com terceiros</li>
                  <li>Notificar-nos imediatamente em caso de uso não autorizado da sua conta</li>
                  <li>Usar o serviço em conformidade com leis locais e estes Termos</li>
                </ul>

                <p className="font-semibold text-foreground">
                  <AlertTriangle className="inline h-5 w-5 text-yellow-600 mr-2" />
                  Você é integralmente responsável por todas as atividades realizadas sob sua conta.
                </p>
              </div>
            </div>

            {/* 5. Uso Proibido */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">5. Uso Proibido</h2>
              </div>
              <div className="space-y-4 ml-13">
                <p>
                  É expressamente proibido usar o Sirius CRM para:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Enviar spam, phishing ou comunicações não solicitadas em massa</li>
                  <li>Violar direitos de propriedade intelectual de terceiros</li>
                  <li>Distribuir malware, vírus ou código malicioso</li>
                  <li>Realizar engenharia reversa, descompilar ou modificar o software</li>
                  <li>Tentar acessar dados de outras organizações (violação multi-tenant)</li>
                  <li>Sobrecarregar nossa infraestrutura com uso abusivo da API</li>
                  <li>Revender ou sublicenciar o serviço sem autorização expressa</li>
                </ul>
                <p className="font-semibold text-red-600 dark:text-red-400">
                  Violações resultarão em suspensão imediata da conta, sem reembolso.
                </p>
              </div>
            </div>

            {/* 6. Propriedade Intelectual */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">6. Propriedade Intelectual</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">6.1. Propriedade da ROI Labs</h3>
                <p>
                  Todo o código, design, marca, interfaces e funcionalidades do Sirius CRM são de propriedade exclusiva da ROI Labs
                  e protegidos por leis de direitos autorais e propriedade intelectual.
                </p>

                <h3 className="text-xl font-semibold mt-6">6.2. Seus Dados</h3>
                <p>
                  Você mantém todos os direitos sobre os dados que insere no sistema (contatos, deals, pipelines, etc.).
                  Concedemos a nós apenas uma licença limitada para processar esses dados exclusivamente para fornecer o serviço.
                </p>

                <h3 className="text-xl font-semibold mt-6">6.3. Feedback e Sugestões</h3>
                <p>
                  Ao enviar sugestões, ideias ou feedback, você concede à ROI Labs o direito de usar, implementar e comercializar
                  essas ideias sem compensação ou atribuição.
                </p>
              </div>
            </div>

            {/* 7. Limitação de Responsabilidade */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                  <Shield className="h-5 w-5 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">7. Limitação de Responsabilidade</h2>
              </div>
              <div className="space-y-4 ml-13">
                <p>
                  O Sirius CRM é fornecido "como está" e "conforme disponível", sem garantias de qualquer tipo.
                </p>
                <p>
                  <strong>Não garantimos:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Disponibilidade ininterrupta do serviço (meta de 99,5% de uptime)</li>
                  <li>Ausência de erros ou bugs</li>
                  <li>Resultados específicos de vendas ou conversão</li>
                  <li>Compatibilidade com todos os browsers ou dispositivos</li>
                </ul>

                <p className="font-semibold text-foreground">
                  Nossa responsabilidade total por danos está limitada ao valor pago nos últimos 3 meses.
                </p>

                <p>
                  Não nos responsabilizamos por:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Perda de dados causada por ação do usuário</li>
                  <li>Falhas de integrações de terceiros (Mercado Pago, WhatsApp, etc.)</li>
                  <li>Danos indiretos, lucros cessantes ou perda de oportunidades</li>
                </ul>
              </div>
            </div>

            {/* 8. Rescisão */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">8. Rescisão de Conta</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">8.1. Por Você</h3>
                <p>
                  Você pode deletar sua conta a qualquer momento através das Configurações.
                  Dados serão retidos por 90 dias para recuperação e depois permanentemente deletados.
                </p>

                <h3 className="text-xl font-semibold mt-6">8.2. Por Nós</h3>
                <p>
                  Reservamo-nos o direito de suspender ou encerrar contas que:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Violem estes Termos de Uso</li>
                  <li>Estejam envolvidas em atividades ilegais ou fraudulentas</li>
                  <li>Representem risco à segurança ou estabilidade da plataforma</li>
                </ul>
                <p>
                  Notificaremos por email com 7 dias de antecedência, exceto em casos de violação grave.
                </p>
              </div>
            </div>

            {/* 9. Modificações nos Termos */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">9. Alterações nestes Termos</h2>
              <p>
                Podemos atualizar estes Termos periodicamente. Mudanças significativas serão comunicadas por email
                com <strong>30 dias de antecedência</strong>.
              </p>
              <p>
                O uso continuado do serviço após mudanças constitui aceitação dos novos termos.
                Se discordar, você deve descontinuar o uso e deletar sua conta.
              </p>
            </div>

            {/* 10. Lei Aplicável */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">10. Lei Aplicável e Foro</h2>
              <p>
                Estes Termos são regidos pelas leis da República Federativa do Brasil,
                especificamente pela Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018)
                e Código de Defesa do Consumidor.
              </p>
              <p>
                Fica eleito o foro da Comarca de <strong>São Paulo/SP</strong> para dirimir
                quaisquer controvérsias decorrentes destes Termos.
              </p>
            </div>

            {/* 11. Contato */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">11. Contato</h2>
              </div>
              <div className="space-y-4 ml-13">
                <p>
                  Para dúvidas sobre estes Termos de Uso, entre em contato:
                </p>
                <ul className="list-none space-y-2">
                  <li><strong>Email:</strong> <a href="mailto:juridico@roilabs.com.br" className="text-primary hover:underline">juridico@roilabs.com.br</a></li>
                  <li><strong>Empresa:</strong> ROI Labs</li>
                  <li><strong>Produto:</strong> Sirius CRM</li>
                </ul>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-12 p-6 bg-muted/50 rounded-lg border">
              <h3 className="text-xl font-semibold mb-4">Leia também:</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/privacy"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                >
                  Política de Privacidade
                </Link>
                <Link
                  href="/help"
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-semibold hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Central de Ajuda
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
