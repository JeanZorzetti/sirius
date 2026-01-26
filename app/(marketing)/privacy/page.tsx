import Link from 'next/link'
import Script from 'next/script'
import { Shield, Lock, Eye, Server, UserCheck, FileText } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade | Sirius CRM',
  description: 'Política de privacidade do Sirius CRM. Como coletamos, usamos e protegemos seus dados. Transparência total sobre o tratamento de informações.',
  openGraph: {
    title: 'Política de Privacidade | Sirius CRM',
    description: 'Como coletamos, usamos e protegemos seus dados no Sirius CRM.',
    url: 'https://sirius.roilabs.com.br/privacy',
  },
}

export default function PrivacyPage() {
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
        "name": "Privacidade",
        "item": "https://sirius.roilabs.com.br/privacy"
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
                  <Shield className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Política de Privacidade
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Última atualização: 1 de janeiro de 2026
              </p>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                Sua privacidade é fundamental para nós. Esta política explica como coletamos, usamos e protegemos seus dados.
              </p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">

              {/* 1. Informações que Coletamos */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground m-0">1. Informações que Coletamos</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Informações de Cadastro:</strong> Nome, email, senha (criptografada), nome da organização.
                  </p>
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Dados de Uso:</strong> Páginas visitadas, funcionalidades utilizadas, tempo de sessão.
                  </p>
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Dados de CRM:</strong> Contatos, negócios, pipelines e outras informações que você insere no sistema.
                  </p>
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Informações de Pagamento:</strong> Processadas exclusivamente pelo Mercado Pago. Não armazenamos dados de cartão de crédito.
                  </p>
                </div>
              </div>

              {/* 2. Como Usamos Seus Dados */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Eye className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground m-0">2. Como Usamos Seus Dados</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <ul className="list-disc list-inside space-y-2 text-base leading-7">
                    <li><strong className="text-foreground">Fornecer o Serviço:</strong> Gerenciar sua conta, processar pagamentos, enviar notificações.</li>
                    <li><strong className="text-foreground">Melhorar o Produto:</strong> Analisar uso agregado para identificar melhorias e bugs.</li>
                    <li><strong className="text-foreground">Comunicação:</strong> Enviar emails transacionais (confirmação de conta, faturas) e marketing (com opt-out).</li>
                    <li><strong className="text-foreground">Segurança:</strong> Detectar e prevenir fraudes, abusos e ataques.</li>
                  </ul>
                  <p className="text-base leading-7 font-semibold text-foreground">
                    Nunca vendemos seus dados para terceiros.
                  </p>
                </div>
              </div>

              {/* 3. Isolamento Multi-Tenant */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground m-0">3. Isolamento de Dados (Multi-Tenant)</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7">
                    Cada organização tem seus dados completamente isolados. Usuários da <strong className="text-foreground">Organização A</strong> nunca
                    conseguem ver ou acessar dados da <strong className="text-foreground">Organização B</strong>.
                  </p>
                  <p className="text-base leading-7">
                    Todas as queries de banco de dados incluem filtro por <code className="bg-muted px-1.5 py-0.5 rounded text-sm">organizationId</code> para
                    garantir isolamento absoluto.
                  </p>
                </div>
              </div>

              {/* 4. Segurança */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground m-0">4. Medidas de Segurança</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <ul className="list-disc list-inside space-y-2 text-base leading-7">
                    <li><strong className="text-foreground">Criptografia:</strong> Senhas com bcrypt, dados em trânsito via HTTPS/TLS.</li>
                    <li><strong className="text-foreground">Autenticação:</strong> JWT tokens com expiração, cookies HttpOnly e SameSite.</li>
                    <li><strong className="text-foreground">Banco de Dados:</strong> PostgreSQL hospedado em servidores seguros com backups diários.</li>
                    <li><strong className="text-foreground">Monitoramento:</strong> Logs de acesso e monitoramento de erros via Sentry.</li>
                  </ul>
                </div>
              </div>

              {/* 5. Cookies e Rastreamento */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Server className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground m-0">5. Cookies e Rastreamento</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Cookies Essenciais:</strong> Necessários para autenticação e funcionamento do sistema.
                  </p>
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Google Analytics:</strong> Usamos GA4 para análise agregada de uso (anonimizada).
                  </p>
                  <p className="text-base leading-7">
                    Você pode desabilitar cookies não essenciais nas configurações do seu navegador.
                  </p>
                </div>
              </div>

              {/* 6. Compartilhamento de Dados */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <UserCheck className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground m-0">6. Compartilhamento de Dados</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7">
                    Compartilhamos dados apenas com:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-base leading-7">
                    <li><strong className="text-foreground">Mercado Pago:</strong> Para processamento de pagamentos (PCI-DSS compliant).</li>
                    <li><strong className="text-foreground">Resend:</strong> Para envio de emails transacionais e marketing.</li>
                    <li><strong className="text-foreground">Vercel:</strong> Hospedagem da aplicação (SOC 2 Type II certified).</li>
                    <li><strong className="text-foreground">Sentry:</strong> Monitoramento de erros (dados anonimizados).</li>
                  </ul>
                  <p className="text-base leading-7 font-semibold text-foreground">
                    Todos os parceiros assinam DPAs (Data Processing Agreements) em conformidade com LGPD.
                  </p>
                </div>
              </div>

              {/* 7. Seus Direitos (LGPD) */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground m-0">7. Seus Direitos (LGPD)</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7">
                    Conforme a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-base leading-7">
                    <li><strong className="text-foreground">Acesso:</strong> Solicitar cópia de todos os seus dados.</li>
                    <li><strong className="text-foreground">Correção:</strong> Atualizar dados incorretos.</li>
                    <li><strong className="text-foreground">Exclusão:</strong> Deletar sua conta e todos os dados associados.</li>
                    <li><strong className="text-foreground">Portabilidade:</strong> Exportar seus dados em formato legível.</li>
                    <li><strong className="text-foreground">Revogação:</strong> Retirar consentimento para marketing a qualquer momento.</li>
                  </ul>
                  <p className="text-base leading-7">
                    Para exercer seus direitos, envie email para: <a href="mailto:privacidade@roilabs.com.br" className="text-primary hover:underline">privacidade@roilabs.com.br</a>
                  </p>
                </div>
              </div>

              {/* 8. Retenção de Dados */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Server className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground m-0">8. Retenção de Dados</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Conta Ativa:</strong> Mantemos seus dados enquanto sua conta estiver ativa.
                  </p>
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Após Cancelamento:</strong> Dados são retidos por 90 dias para recuperação, depois deletados permanentemente.
                  </p>
                  <p className="text-base leading-7">
                    <strong className="text-foreground">Logs de Acesso:</strong> Mantidos por 1 ano para fins de segurança.
                  </p>
                </div>
              </div>

              {/* 9. Alterações na Política */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground m-0">9. Alterações nesta Política</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7">
                    Podemos atualizar esta política periodicamente. Mudanças significativas serão comunicadas por email com 30 dias de antecedência.
                  </p>
                  <p className="text-base leading-7">
                    Recomendamos revisar esta página regularmente.
                  </p>
                </div>
              </div>

              {/* 10. Contato */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <UserCheck className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground m-0">10. Contato</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7">
                    Para dúvidas sobre privacidade, entre em contato:
                  </p>
                  <ul className="list-none space-y-2 text-base leading-7">
                    <li><strong className="text-foreground">Email:</strong> <a href="mailto:privacidade@roilabs.com.br" className="text-primary hover:underline">privacidade@roilabs.com.br</a></li>
                    <li><strong className="text-foreground">Empresa:</strong> ROI Labs</li>
                    <li><strong className="text-foreground">Encarregado de Dados (DPO):</strong> privacidade@roilabs.com.br</li>
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
                Tem dúvidas sobre privacidade?
              </h2>
              <p className="text-muted-foreground mb-6">
                Nossa equipe está disponível para esclarecer qualquer questão sobre como tratamos seus dados.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="mailto:privacidade@roilabs.com.br"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                >
                  Falar com DPO
                </Link>
                <Link
                  href="/terms"
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-semibold hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Ver Termos de Uso
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
