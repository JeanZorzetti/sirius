/**
 * Email Marketing Integration
 *
 * Integração com Resend para captura de leads da calculadora ROI.
 *
 * ✅ FASE 14: Resend ativado, lead capture funcional
 */

import { Resend } from 'resend'
import logger from '@/lib/logger'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY não configurada')
    }
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

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
 * ✅ FASE 14: Captura lead da calculadora e envia emails
 */
export async function captureLeadFromCalculator(data: LeadCalculadoraData) {
  const resend = getResend()

  // 1. Adicionar na lista de email marketing (Resend Audience)
  if (process.env.RESEND_AUDIENCE_ID) {
    try {
      await resend.contacts.create({
        email: data.email,
        firstName: data.nome?.split(' ')[0],
        lastName: data.nome?.split(' ').slice(1).join(' '),
        unsubscribed: false,
        audienceId: process.env.RESEND_AUDIENCE_ID,
      })
    } catch (err) {
      // Contato já existe — não fatal
      logger.warn({ email: data.email }, '[EMAIL MARKETING] Contact already exists in audience')
    }
  }

  // 2. Enviar email de boas-vindas com resultado da calculadora
  await sendWelcomeEmail(data)

  // 3. Notificar time comercial sobre novo lead quente
  await notifyCommercialTeam(data)

  return { success: true }
}

/**
 * ✅ FASE 14: Envia email de boas-vindas com o resultado da calculadora
 */
async function sendWelcomeEmail(data: LeadCalculadoraData) {
  const resend = getResend()
  const nicho = getNichoFromOrigem(data.origem)

  try {
    await resend.emails.send({
      from: 'Sirius CRM <contato@siriuscrm.com.br>',
      to: data.email,
      subject: `${data.nome ? data.nome.split(' ')[0] + ', você' : 'Você'} está perdendo R$ ${formatCurrency(data.perdaMensal)}/mês 💸`,
      html: getWelcomeEmailTemplate(data, nicho),
    })
    logger.info({ email: data.email }, '[EMAIL MARKETING] Welcome email sent')
  } catch (err) {
    logger.error({ err, email: data.email }, '[EMAIL MARKETING] Failed to send welcome email')
  }
}

/**
 * ✅ FASE 14: Notifica time comercial sobre novo lead qualificado
 */
async function notifyCommercialTeam(data: LeadCalculadoraData) {
  const resend = getResend()
  const isHotLead = data.perdaMensal > 10000

  if (!isHotLead) return

  const notifyEmail = process.env.COMMERCIAL_TEAM_EMAIL || 'comercial@roilabs.com.br'

  try {
    await resend.emails.send({
      from: 'Sirius Leads <leads@siriuscrm.com.br>',
      to: notifyEmail,
      subject: `🔥 Lead QUENTE: ${data.email} (perde R$ ${formatCurrency(data.perdaMensal)}/mês)`,
      html: `
        <h2>Novo lead qualificado da calculadora</h2>
        <ul>
          <li><strong>Email:</strong> ${data.email}</li>
          <li><strong>Nome:</strong> ${data.nome || 'Não informado'}</li>
          <li><strong>Empresa:</strong> ${data.empresa || 'Não informado'}</li>
          <li><strong>Origem:</strong> ${data.origem}</li>
          <li><strong>Volume de leads/mês:</strong> ${data.volumeLeads}</li>
          <li><strong>Ticket médio:</strong> R$ ${formatCurrency(data.ticketMedio)}</li>
          <li><strong>Perda mensal estimada:</strong> <span style="color: red; font-size: 18px;">R$ ${formatCurrency(data.perdaMensal)}</span></li>
        </ul>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background:#6366f1;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;">Ver no CRM</a></p>
      `,
    })
    logger.info({ email: data.email, perdaMensal: data.perdaMensal }, '[EMAIL MARKETING] HOT LEAD notification sent')
  } catch (err) {
    logger.error({ err }, '[EMAIL MARKETING] Failed to notify commercial team')
  }
}

function getNichoFromOrigem(origem: string): string {
  const nichos: Record<string, string> = {
    'calculadora-corretores': 'Corretores de imóveis',
    'calculadora-energia-solar': 'Vendedores de energia solar',
    'calculadora-agencias': 'Agências de marketing',
    'calculadora-consultores': 'Consultores',
    'calculadora-representantes': 'Representantes comerciais',
  }
  return nichos[origem] || 'Profissionais de vendas'
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function getWelcomeEmailTemplate(data: LeadCalculadoraData, nicho: string): string {
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
              <h3 style="margin-top:0;">💸 Você está perdendo:</h3>
              <p style="font-size:32px;font-weight:bold;color:#dc2626;margin:10px 0;">
                R$ ${formatCurrency(data.perdaMensal)}/mês
              </p>
              <p style="margin-bottom:0;">
                Isso representa <strong>R$ ${formatCurrency(data.perdaMensal * 12)}/ano</strong> deixados na mesa.
              </p>
            </div>
            <h3>Como recuperar esse dinheiro?</h3>
            <p>${nicho} que organizam suas vendas com um CRM aumentam a conversão em até 34%.</p>
            <ul>
              <li>Pipeline visual para acompanhar cada negociação</li>
              <li>Follow-ups automáticos para nunca perder um cliente</li>
              <li>Histórico completo de todas as interações</li>
              <li>Relatórios que mostram exatamente onde você está perdendo dinheiro</li>
            </ul>
            <div style="text-align:center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/vendas-automaticas?origem=${data.origem}&email=${encodeURIComponent(data.email)}" class="cta">
                Recuperar esse dinheiro agora
              </a>
              <p style="color:#6b7280;font-size:14px;">Comece grátis • Sem cartão • Sem limite de tempo</p>
            </div>
          </div>
          <div class="footer">
            <p>© 2026 Sirius CRM · ROI Labs · <a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy">Política de Privacidade</a></p>
          </div>
        </div>
      </body>
    </html>
  `
}
