/**
 * Integration Alerting System
 *
 * Sends email alerts to organization owners when:
 * - Integration fails after max retries (3 attempts)
 * - More than 10 failures in 1 hour
 * - Health status drops below 80%
 */

import { sendHtmlEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

interface IntegrationFailureAlertParams {
  organizationName: string
  ownerEmail: string
  ownerName: string
  integrationType: string
  action: string
  errorMessage: string
  attemptCount: number
  logId: string
}

/**
 * Send alert email when integration fails after max retries
 */
export async function sendIntegrationFailureAlert(params: IntegrationFailureAlertParams): Promise<boolean> {
  try {
    const {
      organizationName,
      ownerEmail,
      ownerName,
      integrationType,
      action,
      errorMessage,
      attemptCount,
      logId
    } = params

    const subject = `🚨 Falha na Integração ${integrationType} - ${organizationName}`

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .alert-box {
      background: white;
      border-left: 4px solid #ef4444;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-label {
      font-weight: 600;
      color: #6b7280;
    }
    .info-value {
      color: #111827;
    }
    .error-box {
      background: #fee2e2;
      border: 1px solid #fecaca;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
      font-family: monospace;
      font-size: 13px;
      color: #991b1b;
      word-break: break-word;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: #2563eb;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 500;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚨 Falha na Integração</h1>
  </div>
  <div class="content">
    <p>Olá, <strong>${ownerName}</strong>!</p>

    <div class="alert-box">
      <p><strong>A integração ${integrationType} falhou após ${attemptCount} tentativas automáticas.</strong></p>
      <p>O sistema tentou reprocessar automaticamente, mas não obteve sucesso. Sua atenção é necessária para resolver o problema.</p>
    </div>

    <div class="info-row">
      <span class="info-label">Organização:</span>
      <span class="info-value">${organizationName}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Tipo de Integração:</span>
      <span class="info-value">${integrationType}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Ação:</span>
      <span class="info-value">${action}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Tentativas:</span>
      <span class="info-value">${attemptCount} de 3</span>
    </div>

    <p><strong>Mensagem de Erro:</strong></p>
    <div class="error-box">${errorMessage}</div>

    <p><strong>O que fazer agora?</strong></p>
    <ol>
      <li>Verifique as configurações da integração no painel</li>
      <li>Confirme se as credenciais estão corretas</li>
      <li>Verifique se o serviço externo está operacional</li>
      <li>Entre em contato com o suporte se precisar de ajuda</li>
    </ol>

    <center>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/integrations" class="button">
        Ver Configurações de Integrações
      </a>
    </center>

    <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
      Log ID: <code>${logId}</code>
    </p>
  </div>
  <div class="footer">
    <p>Este é um alerta automático do sistema de monitoramento de integrações.</p>
    <p>© ${new Date().getFullYear()} CRM - Todos os direitos reservados</p>
  </div>
</body>
</html>
    `

    await sendHtmlEmail({
      to: ownerEmail,
      subject,
      html
    })

    logger.info({
      organizationName,
      ownerEmail,
      integrationType,
      logId
    }, 'Integration failure alert sent')

    return true
  } catch (error: any) {
    logger.error({ error, params }, 'Error sending integration failure alert')
    return false
  }
}

/**
 * Check for multiple failures in short time and send alert
 */
export async function checkAndAlertHighFailureRate(organizationId: string): Promise<boolean> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const failureCount = await prisma.integrationLog.count({
      where: {
        organizationId,
        status: 'FAILED',
        createdAt: { gte: oneHourAgo }
      }
    })

    // Alert if more than 10 failures in 1 hour
    if (failureCount >= 10) {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          name: true,
          users: {
            where: { orgRole: 'OWNER' },
            select: { email: true, name: true }
          }
        }
      })

      if (!organization || organization.users.length === 0) {
        return false
      }

      const owner = organization.users[0]

      const subject = `⚠️ Taxa Alta de Falhas nas Integrações - ${organization.name}`

      const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .warning-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .stat {
      background: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 15px 0;
    }
    .stat-number {
      font-size: 48px;
      font-weight: bold;
      color: #f59e0b;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: #2563eb;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚠️ Taxa Alta de Falhas Detectada</h1>
  </div>
  <div class="content">
    <p>Olá, <strong>${owner.name || 'Admin'}</strong>!</p>

    <div class="warning-box">
      <p><strong>Detectamos um número elevado de falhas nas suas integrações na última hora.</strong></p>
      <p>Isso pode indicar um problema com as configurações ou com os serviços externos.</p>
    </div>

    <div class="stat">
      <div class="stat-number">${failureCount}</div>
      <p>Falhas na última hora</p>
    </div>

    <p><strong>Recomendações:</strong></p>
    <ul>
      <li>Verifique o status dos serviços externos (N8N, WhatsApp, Google Calendar)</li>
      <li>Revise as configurações das integrações</li>
      <li>Verifique os logs detalhados no painel</li>
      <li>Considere desabilitar temporariamente integrações com problemas</li>
    </ul>

    <center>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/integrations/logs" class="button">
        Ver Logs Detalhados
      </a>
    </center>
  </div>
</body>
</html>
      `

      await sendHtmlEmail({
        to: owner.email,
        subject,
        html
      })

      logger.info({
        organizationId,
        failureCount,
        ownerEmail: owner.email
      }, 'High failure rate alert sent')

      return true
    }

    return false
  } catch (error: any) {
    logger.error({ error, organizationId }, 'Error checking high failure rate')
    return false
  }
}

/**
 * Send health status alert when success rate drops below threshold
 */
export async function checkAndAlertHealthStatus(organizationId: string): Promise<boolean> {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const [totalLogs, successLogs] = await Promise.all([
      prisma.integrationLog.count({
        where: {
          organizationId,
          createdAt: { gte: last24Hours }
        }
      }),
      prisma.integrationLog.count({
        where: {
          organizationId,
          status: 'SUCCESS',
          createdAt: { gte: last24Hours }
        }
      })
    ])

    if (totalLogs === 0) return false

    const successRate = Math.round((successLogs / totalLogs) * 100)

    // Alert if success rate < 80%
    if (successRate < 80) {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          name: true,
          users: {
            where: { orgRole: 'OWNER' },
            select: { email: true, name: true }
          }
        }
      })

      if (!organization || organization.users.length === 0) {
        return false
      }

      const owner = organization.users[0]

      const subject = `⚠️ Health Status das Integrações Baixo - ${organization.name}`

      const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .metrics {
      display: flex;
      gap: 15px;
      margin: 20px 0;
    }
    .metric {
      flex: 1;
      background: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .metric-value {
      font-size: 32px;
      font-weight: bold;
      color: ${successRate < 50 ? '#ef4444' : '#f59e0b'};
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: #2563eb;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚠️ Health Status Baixo</h1>
  </div>
  <div class="content">
    <p>Olá, <strong>${owner.name || 'Admin'}</strong>!</p>

    <p>O health status das suas integrações está abaixo do normal nas últimas 24 horas.</p>

    <div class="metrics">
      <div class="metric">
        <div class="metric-value">${successRate}%</div>
        <p>Taxa de Sucesso</p>
      </div>
      <div class="metric">
        <div class="metric-value">${totalLogs}</div>
        <p>Total de Eventos</p>
      </div>
    </div>

    <p><strong>Ações Recomendadas:</strong></p>
    <ul>
      <li>Revise os logs de erro no painel</li>
      <li>Verifique as configurações das integrações</li>
      <li>Teste as conexões manualmente</li>
      <li>Entre em contato com o suporte se o problema persistir</li>
    </ul>

    <center>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/integrations" class="button">
        Ir para Integrações
      </a>
    </center>
  </div>
</body>
</html>
      `

      await sendHtmlEmail({
        to: owner.email,
        subject,
        html
      })

      logger.info({
        organizationId,
        successRate,
        totalLogs,
        ownerEmail: owner.email
      }, 'Health status alert sent')

      return true
    }

    return false
  } catch (error: any) {
    logger.error({ error, organizationId }, 'Error checking health status')
    return false
  }
}
