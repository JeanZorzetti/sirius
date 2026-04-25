import { Text, Heading, Button, Section, Hr } from '@react-email/components'
import { BaseLayout } from '../layouts/base'

interface WeeklyNewsletterProps {
  userName: string
  weekLabel: string // ex: "10–16 de Fevereiro de 2026"
  stats: {
    newDeals: number
    wonDeals: number
    lostDeals: number
    newContacts: number
    conversionRate: number
  }
  tip: {
    title: string
    body: string
  }
  dashboardUrl?: string
}

export function WeeklyNewsletter({
  userName,
  weekLabel,
  stats,
  tip,
  dashboardUrl = 'https://siriuscrm.com.br/dashboard',
}: WeeklyNewsletterProps) {
  return (
    <BaseLayout preview={`📊 Seu resumo da semana (${weekLabel}) – Sirius CRM`}>
      <Heading style={styles.heading}>📊 Resumo da Semana</Heading>

      <Text style={styles.text}>Olá {userName},</Text>

      <Text style={styles.text}>
        Confira um resumo das atividades da sua equipe na semana de <strong>{weekLabel}</strong>.
      </Text>

      {/* Stats */}
      <Section style={styles.statsGrid}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={styles.statCell}>
                <Text style={styles.statValue}>{stats.newDeals}</Text>
                <Text style={styles.statLabel}>Novos Negócios</Text>
              </td>
              <td style={styles.statCell}>
                <Text style={{ ...styles.statValue, color: '#16a34a' }}>{stats.wonDeals}</Text>
                <Text style={styles.statLabel}>Ganhos 🎉</Text>
              </td>
            </tr>
            <tr>
              <td style={styles.statCell}>
                <Text style={{ ...styles.statValue, color: '#dc2626' }}>{stats.lostDeals}</Text>
                <Text style={styles.statLabel}>Perdidos</Text>
              </td>
              <td style={styles.statCell}>
                <Text style={styles.statValue}>{stats.newContacts}</Text>
                <Text style={styles.statLabel}>Novos Contatos</Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      {stats.conversionRate > 0 && (
        <Section style={styles.conversionBar}>
          <Text style={styles.conversionText}>
            Taxa de conversão: <strong style={{ color: '#8b5cf6' }}>{stats.conversionRate.toFixed(1)}%</strong>
          </Text>
        </Section>
      )}

      <Hr style={styles.divider} />

      {/* Dica da semana */}
      <Heading style={styles.subheading}>💡 Dica da Semana</Heading>

      <Section style={styles.tipCard}>
        <Text style={styles.tipTitle}>{tip.title}</Text>
        <Text style={styles.tipBody}>{tip.body}</Text>
      </Section>

      <Hr style={styles.divider} />

      <Section style={styles.ctaSection}>
        <Button href={dashboardUrl} style={styles.button}>
          Ver Meu Dashboard
        </Button>
      </Section>

      <Text style={styles.small}>
        Você recebe este email porque possui uma conta ativa no Sirius CRM.
        Para parar de receber, acesse Configurações → Notificações no dashboard.
      </Text>

      <Text style={styles.signature}>
        Boas vendas! 🚀
        <br />
        Equipe Sirius CRM
      </Text>
    </BaseLayout>
  )
}

const styles = {
  heading: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    margin: '0 0 24px',
  },
  subheading: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    margin: '0 0 16px',
  },
  text: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#404040',
    margin: '16px 0',
  },
  statsGrid: {
    margin: '24px 0',
    padding: '0',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  statCell: {
    padding: '16px 24px',
    textAlign: 'center' as const,
    borderRight: '1px solid #e2e8f0',
    borderBottom: '1px solid #e2e8f0',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    margin: '0 0 4px',
  },
  statLabel: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '0',
  },
  conversionBar: {
    backgroundColor: '#f5f3ff',
    borderRadius: '8px',
    padding: '12px 20px',
    margin: '16px 0',
    border: '1px solid #ddd6fe',
  },
  conversionText: {
    fontSize: '15px',
    color: '#4a4a4a',
    margin: '0',
    textAlign: 'center' as const,
  },
  divider: {
    margin: '32px 0',
    borderColor: '#e5e5e5',
  },
  tipCard: {
    backgroundColor: '#fef9c3',
    border: '1px solid #fde047',
    borderRadius: '8px',
    padding: '20px',
    margin: '16px 0',
  },
  tipTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#713f12',
    margin: '0 0 8px',
  },
  tipBody: {
    fontSize: '15px',
    lineHeight: '22px',
    color: '#78350f',
    margin: '0',
  },
  ctaSection: {
    textAlign: 'center' as const,
    margin: '32px 0',
  },
  button: {
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
    padding: '12px 32px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '16px',
    display: 'inline-block',
  },
  small: {
    fontSize: '12px',
    lineHeight: '18px',
    color: '#9ca3af',
    margin: '8px 0',
  },
  signature: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#404040',
    margin: '32px 0 0',
  },
}

export default WeeklyNewsletter
