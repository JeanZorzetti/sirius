import { Text, Heading, Button, Section } from '@react-email/components'
import { BaseLayout } from '../layouts/base'
import emailsEn from '@/messages/en/emails.json'
import emailsPtBr from '@/messages/pt-BR/emails.json'

type Locale = 'pt-BR' | 'en'

interface FollowUpEmailProps {
  userName: string
  dealTitle: string
  dealValue?: number
  contactName?: string
  stageName: string
  daysSinceUpdate: number
  dealUrl: string
  locale?: Locale
}

export function FollowUpEmail({
  userName,
  dealTitle,
  dealValue,
  contactName,
  stageName,
  daysSinceUpdate,
  dealUrl,
  locale = 'pt-BR',
}: FollowUpEmailProps) {
  const s = locale === 'en' ? emailsEn.emails.followUp : emailsPtBr.emails.followUp

  const formattedValue = dealValue
    ? new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'pt-BR', {
        style: 'currency',
        currency: locale === 'en' ? 'USD' : 'BRL',
      }).format(dealValue)
    : null

  const urgencyLevel = daysSinceUpdate >= 14 ? 'high' : daysSinceUpdate >= 7 ? 'medium' : 'low'
  const urgencyColor = urgencyLevel === 'high' ? '#dc2626' : urgencyLevel === 'medium' ? '#f59e0b' : '#3b82f6'
  const urgencyEmoji = urgencyLevel === 'high' ? '🚨' : urgencyLevel === 'medium' ? '⚠️' : '📌'

  const preview = s.preview
    .replace('{dealTitle}', dealTitle)
    .replace('{daysSinceUpdate}', String(daysSinceUpdate))

  const intro = s.intro
    .replace('{dealTitle}', dealTitle)
    .replace('{daysSinceUpdate}', String(daysSinceUpdate))
    .replace('{stageName}', stageName)

  const labelNoUpdate = s.labelNoUpdate.replace('{daysSinceUpdate}', String(daysSinceUpdate))
  const action1 = s.action1.replace('{contactName}', contactName || (locale === 'en' ? 'the contact' : 'o contato'))

  return (
    <BaseLayout preview={`${urgencyEmoji} ${preview}`} locale={locale}>
      <Heading style={styles.heading}>
        {urgencyEmoji} {s.title}
      </Heading>

      <Text style={styles.text}>{locale === 'en' ? `Hi ${userName},` : `Olá ${userName},`}</Text>

      <Text style={styles.text}>
        {intro.split(dealTitle).map((part, i, arr) =>
          i < arr.length - 1 ? (
            <span key={i}>
              {part}
              <strong>{dealTitle}</strong>
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </Text>

      <Section style={{ ...styles.dealCard, borderColor: urgencyColor }}>
        <Text style={styles.dealTitle}>{dealTitle}</Text>
        <Section style={styles.dealDetails}>
          {formattedValue && (
            <Text style={styles.detailRow}>
              💰 <strong>{s.labelValue}</strong> {formattedValue}
            </Text>
          )}
          <Text style={styles.detailRow}>
            📋 <strong>{s.labelStage}</strong> {stageName}
          </Text>
          {contactName && (
            <Text style={styles.detailRow}>
              👤 <strong>{s.labelContact}</strong> {contactName}
            </Text>
          )}
          <Text style={{ ...styles.detailRow, color: urgencyColor, fontWeight: 'bold' }}>
            ⏱️ {labelNoUpdate}
          </Text>
        </Section>
      </Section>

      <Text style={styles.text}>
        <strong>{s.actionsTitle}</strong>
      </Text>

      <Section style={styles.suggestions}>
        <Text style={styles.suggestion}>• {action1}</Text>
        <Text style={styles.suggestion}>• {s.action2}</Text>
        <Text style={styles.suggestion}>• {s.action3}</Text>
        {daysSinceUpdate >= 14 && (
          <Text style={{ ...styles.suggestion, color: '#dc2626' }}>
            • ⚠️ {s.action4Critical}
          </Text>
        )}
      </Section>

      <Section style={styles.ctaSection}>
        <Button href={dealUrl} style={{ ...styles.button, backgroundColor: urgencyColor }}>
          {s.cta}
        </Button>
      </Section>

      <Text style={styles.signature}>
        {s.signature.split('\n').map((line, i, arr) => (
          <span key={i}>
            {line}
            {i < arr.length - 1 && <br />}
          </span>
        ))}
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
  text: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#404040',
    margin: '16px 0',
  },
  dealCard: {
    margin: '24px 0',
    padding: '20px',
    backgroundColor: '#f8fafc',
    border: '2px solid #3b82f6',
    borderRadius: '8px',
  },
  dealTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    margin: '0 0 16px',
  },
  dealDetails: {
    margin: '0',
  },
  detailRow: {
    fontSize: '15px',
    lineHeight: '24px',
    color: '#404040',
    margin: '8px 0',
  },
  suggestions: {
    margin: '16px 0',
    paddingLeft: '16px',
  },
  suggestion: {
    fontSize: '15px',
    lineHeight: '24px',
    color: '#404040',
    margin: '8px 0',
  },
  ctaSection: {
    textAlign: 'center' as const,
    margin: '32px 0',
  },
  button: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    padding: '12px 32px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '16px',
    display: 'inline-block',
  },
  signature: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#404040',
    margin: '32px 0 0',
  },
}

export default FollowUpEmail
