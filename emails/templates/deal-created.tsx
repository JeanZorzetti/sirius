import { Text, Heading, Button, Section } from '@react-email/components'
import { BaseLayout } from '../layouts/base'
import emailsEn from '@/messages/en/emails.json'
import emailsPtBr from '@/messages/pt-BR/emails.json'

type Locale = 'pt-BR' | 'en'

interface DealCreatedEmailProps {
  userName: string
  dealTitle: string
  dealValue: number
  dealStage: string
  contactName?: string
  dealUrl: string
  locale?: Locale
}

export function DealCreatedEmail({
  userName,
  dealTitle,
  dealValue,
  dealStage,
  contactName,
  dealUrl,
  locale = 'pt-BR',
}: DealCreatedEmailProps) {
  const s = locale === 'en' ? emailsEn.emails.dealCreated : emailsPtBr.emails.dealCreated

  const formattedValue = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'pt-BR', {
    style: 'currency',
    currency: locale === 'en' ? 'USD' : 'BRL',
  }).format(dealValue)

  const preview = s.preview.replace('{dealTitle}', dealTitle)

  return (
    <BaseLayout preview={preview} locale={locale}>
      <Heading style={styles.heading}>{s.title}</Heading>

      <Text style={styles.text}>{locale === 'en' ? `Hi ${userName},` : `Olá ${userName},`}</Text>

      <Text style={styles.text}>{s.intro}</Text>

      <Section style={styles.dealCard}>
        <Text style={styles.dealTitle}>{dealTitle}</Text>

        <Section style={styles.dealDetails}>
          <Text style={styles.detailRow}>
            <strong>{s.labelValue}</strong> {formattedValue}
          </Text>
          <Text style={styles.detailRow}>
            <strong>{s.labelStage}</strong> {dealStage}
          </Text>
          {contactName && (
            <Text style={styles.detailRow}>
              <strong>{s.labelContact}</strong> {contactName}
            </Text>
          )}
        </Section>
      </Section>

      <Text style={styles.text}>
        <strong>{s.nextStepsTitle}</strong>
      </Text>

      <Section style={styles.suggestions}>
        <Text style={styles.suggestion}>• {s.step1}</Text>
        <Text style={styles.suggestion}>• {s.step2}</Text>
        <Text style={styles.suggestion}>• {s.step3}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Button href={dealUrl} style={styles.button}>
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

export default DealCreatedEmail
