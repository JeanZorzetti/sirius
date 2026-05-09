import { Text, Heading, Button, Section, Hr } from '@react-email/components'
import { BaseLayout } from '../layouts/base'
import emailsEn from '@/messages/en/emails.json'
import emailsPtBr from '@/messages/pt-BR/emails.json'

type Locale = 'pt-BR' | 'en'

interface WeeklyNewsletterProps {
  userName: string
  weekLabel: string
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
  locale?: Locale
}

export function WeeklyNewsletter({
  userName,
  weekLabel,
  stats,
  tip,
  dashboardUrl = 'https://siriuscrm.com.br/dashboard',
  locale = 'pt-BR',
}: WeeklyNewsletterProps) {
  const s = locale === 'en' ? emailsEn.emails.weeklyNewsletter : emailsPtBr.emails.weeklyNewsletter

  const preview = s.preview.replace('{weekLabel}', weekLabel)
  const intro = s.intro.replace('{weekLabel}', weekLabel)
  const conversionRate = s.conversionRate.replace('{rate}', stats.conversionRate.toFixed(1))

  return (
    <BaseLayout preview={`📊 ${preview}`} locale={locale}>
      <Heading style={styles.heading}>📊 {s.title}</Heading>

      <Text style={styles.text}>{locale === 'en' ? `Hi ${userName},` : `Olá ${userName},`}</Text>

      <Text style={styles.text}>
        {intro.split(weekLabel).map((part, i, arr) =>
          i < arr.length - 1 ? (
            <span key={i}>
              {part}
              <strong>{weekLabel}</strong>
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </Text>

      {/* Stats */}
      <Section style={styles.statsGrid}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={styles.statCell}>
                <Text style={styles.statValue}>{stats.newDeals}</Text>
                <Text style={styles.statLabel}>{s.statNewDeals}</Text>
              </td>
              <td style={styles.statCell}>
                <Text style={{ ...styles.statValue, color: '#16a34a' }}>{stats.wonDeals}</Text>
                <Text style={styles.statLabel}>{s.statWonDeals} 🎉</Text>
              </td>
            </tr>
            <tr>
              <td style={styles.statCell}>
                <Text style={{ ...styles.statValue, color: '#dc2626' }}>{stats.lostDeals}</Text>
                <Text style={styles.statLabel}>{s.statLostDeals}</Text>
              </td>
              <td style={styles.statCell}>
                <Text style={styles.statValue}>{stats.newContacts}</Text>
                <Text style={styles.statLabel}>{s.statNewContacts}</Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      {stats.conversionRate > 0 && (
        <Section style={styles.conversionBar}>
          <Text style={styles.conversionText}>
            <strong style={{ color: '#8b5cf6' }}>{conversionRate}</strong>
          </Text>
        </Section>
      )}

      <Hr style={styles.divider} />

      {/* Tip of the week */}
      <Heading style={styles.subheading}>💡 {s.tipTitle}</Heading>

      <Section style={styles.tipCard}>
        <Text style={styles.tipTitle}>{tip.title}</Text>
        <Text style={styles.tipBody}>{tip.body}</Text>
      </Section>

      <Hr style={styles.divider} />

      <Section style={styles.ctaSection}>
        <Button href={dashboardUrl} style={styles.button}>
          {s.cta}
        </Button>
      </Section>

      <Text style={styles.small}>{s.unsubscribeText}</Text>

      <Text style={styles.signature}>
        {s.signature.split('\n').map((line, i, arr) => (
          <span key={i}>
            {line}
            {i < arr.length - 1 && <br />}
          </span>
        ))}
        {' '}🚀
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
