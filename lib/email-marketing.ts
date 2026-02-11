/**
 * Email Marketing Integration
 *
 * Integração com Resend para captura de leads da calculadora ROI.
 *
 * Setup:
 * 1. npm install resend
 * 2. Adicione RESEND_API_KEY no .env
 * 3. Configure o domínio no Resend Dashboard
 *
 * Exemplo de uso:
 * ```ts
 * import { captureLeadFromCalculator } from '@/lib/email-marketing'
 *
 * await captureLeadFromCalculator({
 *   email: 'usuario@email.com',
 *   nome: 'João Silva',
 *   empresa: 'Empresa XYZ',
 *   volumeLeads: 100,
 *   ticketMedio: 500,
 *   perdaMensal: 12500,
 *   origem: 'calculadora-corretores'
 * })
 * ```
 */

// Descomente quando instalar o Resend
// import { Resend } from 'resend'

import logger from '@/lib/logger'

export interface LeadCalculadoraData {
  email: string
  nome?: string
  empresa?: string
  volumeLeads: number
  ticketMedio: number
  perdaMensal: number
  origem: string // calculadora-corretores, calculadora-energia-solar, calculadora-agencias
}

/**
 * Captura lead da calculadora e envia para email marketing
 */
export async function captureLeadFromCalculator(data: LeadCalculadoraData) {
  // TODO: Instalar Resend
  // const resend = new Resend(process.env.RESEND_API_KEY)

  // 1. Salvar lead no banco de dados
  // await prisma.lead.create({
  //   data: {
  //     email: data.email,
  //     name: data.nome,
  //     company: data.empresa,
  //     source: data.origem,
  //     metadata: {
  //       volumeLeads: data.volumeLeads,
  //       ticketMedio: data.ticketMedio,
  //       perdaMensal: data.perdaMensal,
  //     }
  //   }
  // })

  // 2. Adicionar na lista de email marketing
  // await resend.contacts.create({
  //   email: data.email,
  //   firstName: data.nome?.split(' ')[0],
  //   lastName: data.nome?.split(' ').slice(1).join(' '),
  //   unsubscribed: false,
  //   audienceId: process.env.RESEND_AUDIENCE_ID
  // })

  // 3. Enviar email de boas-vindas com resultado da calculadora
  await sendWelcomeEmail(data)

  // 4. Notificar time comercial sobre novo lead quente
  await notifyCommercialTeam(data)

  return { success: true }
}

/**
 * Envia email de boas-vindas com o resultado da calculadora
 */
async function sendWelcomeEmail(data: LeadCalculadoraData) {
  // const resend = new Resend(process.env.RESEND_API_KEY)

  const nicho = getNichoFromOrigem(data.origem)

  // await resend.emails.send({
  //   from: 'Sirius CRM <contato@sirius.roilabs.com.br>',
  //   to: data.email,
  //   subject: `${data.nome ? data.nome + ', ' : ''}você está perdendo R$ ${formatCurrency(data.perdaMensal)}/mês 💸`,
  //   html: getWelcomeEmailTemplate(data, nicho)
  // })

  logger.info({ email: data.email }, 'Welcome email would be sent to:')
}

/**
 * Notifica time comercial sobre novo lead qualificado
 */
async function notifyCommercialTeam(data: LeadCalculadoraData) {
  // const resend = new Resend(process.env.RESEND_API_KEY)

  const isHotLead = data.perdaMensal > 10000 // Lead quente se perda > R$ 10k/mês

  if (isHotLead) {
    // await resend.emails.send({
    //   from: 'Sirius Leads <leads@sirius.roilabs.com.br>',
    //   to: 'comercial@roilabs.com.br',
    //   subject: `🔥 Lead QUENTE: ${data.email} (perde R$ ${formatCurrency(data.perdaMensal)}/mês)`,
    //   html: `
    //     <h2>Novo lead qualificado da calculadora</h2>
    //     <ul>
    //       <li><strong>Email:</strong> ${data.email}</li>
    //       <li><strong>Nome:</strong> ${data.nome || 'Não informado'}</li>
    //       <li><strong>Empresa:</strong> ${data.empresa || 'Não informado'}</li>
    //       <li><strong>Origem:</strong> ${data.origem}</li>
    //       <li><strong>Volume de leads/mês:</strong> ${data.volumeLeads}</li>
    //       <li><strong>Ticket médio:</strong> R$ ${formatCurrency(data.ticketMedio)}</li>
    //       <li><strong>Perda mensal estimada:</strong> <span style="color: red; font-size: 18px;">R$ ${formatCurrency(data.perdaMensal)}</span></li>
    //     </ul>
    //     <p><a href="https://sirius.roilabs.com.br/dashboard" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Ver no CRM</a></p>
    //   `
    // })

    logger.info({ email: data.email, perdaMensal: data.perdaMensal }, 'HOT LEAD notification would be sent')
  }
}

/**
 * Template do email de boas-vindas
 */
function getWelcomeEmailTemplate(data: LeadCalculadoraData, nicho: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .highlight { background: #fef3c7; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0; }
          .cta { background: #6366f1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Resultado da Sua Calculadora</h1>
            <p>${data.nome ? `Olá, ${data.nome.split(' ')[0]}!` : 'Olá!'}</p>
          </div>

          <div class="content">
            <h2>Você está perdendo dinheiro por desorganização</h2>

            <p>Com base nos dados que você informou:</p>
            <ul>
              <li><strong>${data.volumeLeads} leads por mês</strong></li>
              <li><strong>Ticket médio de R$ ${formatCurrency(data.ticketMedio)}</strong></li>
            </ul>

            <div class="highlight">
              <h3 style="margin-top: 0;">💸 Você está perdendo:</h3>
              <p style="font-size: 32px; font-weight: bold; color: #dc2626; margin: 10px 0;">
                R$ ${formatCurrency(data.perdaMensal)}/mês
              </p>
              <p style="margin-bottom: 0;">
                Isso representa <strong>R$ ${formatCurrency(data.perdaMensal * 12)}/ano</strong> deixados na mesa.
              </p>
            </div>

            <h3>Como recuperar esse dinheiro?</h3>
            <p>
              ${nicho} que organizam suas vendas com um CRM aumentam a conversão em até 34%.
              Isso significa transformar leads perdidos em clientes reais.
            </p>

            <p>
              <strong>O Sirius CRM</strong> foi feito especialmente para ${nicho.toLowerCase()}:
            </p>
            <ul>
              <li>Pipeline visual para acompanhar cada negociação</li>
              <li>Follow-ups automáticos para nunca perder um cliente</li>
              <li>Histórico completo de todas as interações</li>
              <li>Relatórios que mostram exatamente onde você está perdendo dinheiro</li>
            </ul>

            <div style="text-align: center;">
              <a href="https://sirius.roilabs.com.br/vendas-automaticas?origem=${data.origem}&email=${data.email}" class="cta">
                Recuperar esse dinheiro agora
              </a>
              <p style="color: #6b7280; font-size: 14px;">
                Comece grátis • Sem cartão • Sem limite de tempo
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="font-size: 14px; color: #6b7280;">
              <strong>P.S.:</strong> Cada dia que passa sem organização é mais dinheiro perdido.
              Leva apenas 3 minutos para criar sua conta e começar a recuperar essas vendas.
            </p>
          </div>

          <div class="footer">
            <p>© 2025 Sirius CRM - ROI Labs</p>
            <p>
              <a href="https://sirius.roilabs.com.br" style="color: #6366f1;">sirius.roilabs.com.br</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}

/**
 * Determina o nicho baseado na origem
 */
function getNichoFromOrigem(origem: string): string {
  const nichos: Record<string, string> = {
    'calculadora-corretores': 'Corretores de imóveis',
    'calculadora-energia-solar': 'Empresas de energia solar',
    'calculadora-agencias': 'Agências de marketing',
  }
  return nichos[origem] || 'Empresas'
}

/**
 * Formata número como moeda brasileira
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

/**
 * Sequência de emails automatizada (drip campaign)
 *
 * Dia 0: Email de boas-vindas com resultado
 * Dia 2: Case de sucesso do nicho específico
 * Dia 4: Convite para demonstração gratuita
 * Dia 7: Oferta especial (se ainda não converteu)
 */
export async function setupDripCampaign(leadId: string) {
  // TODO: Implementar com ferramentas de automação
  // Opções: Resend + cron jobs, n8n, Make.com, etc.

  logger.info({ leadId }, 'Drip campaign would be set up for lead')
}
