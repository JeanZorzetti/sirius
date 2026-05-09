import { Text, Heading, Button, Section, Hr } from '@react-email/components'
import { BaseLayout } from '../layouts/base'
import emailsEn from '@/messages/en/emails.json'
import emailsPtBr from '@/messages/pt-BR/emails.json'

type Locale = 'pt-BR' | 'en'

interface PaymentFailureEmailProps {
  userName: string
  organizationName: string
  planName: string
  attemptNumber: number
  maxAttempts: number
  updateCardUrl: string
  isFinal?: boolean
  locale?: Locale
}

export function PaymentFailureEmail({
  userName,
  organizationName,
  planName,
  attemptNumber,
  maxAttempts,
  updateCardUrl,
  isFinal = false,
  locale = 'pt-BR',
}: PaymentFailureEmailProps) {
  const s = locale === 'en' ? emailsEn.emails.paymentFailure : emailsPtBr.emails.paymentFailure

  const attemptsRemaining = maxAttempts - attemptNumber

  const preview = isFinal
    ? s.previewFinal.replace('{organizationName}', organizationName)
    : s.previewRetry
        .replace('{attemptNumber}', String(attemptNumber))
        .replace('{maxAttempts}', String(maxAttempts))
        .replace('{organizationName}', organizationName)

  const introFinal = s.introFinal
    .replace('{maxAttempts}', String(maxAttempts))
    .replace('{planName}', planName)
    .replace('{organizationName}', organizationName)

  const introRetry = s.introRetry
    .replace('{planName}', planName)
    .replace('{organizationName}', organizationName)
    .replace('{attemptNumber}', String(attemptNumber))
    .replace('{maxAttempts}', String(maxAttempts))

  const warningRetryTitle = attemptsRemaining === 1
    ? s.warningRetryTitle.replace('{attemptsRemaining}', String(attemptsRemaining))
    : s.warningRetryTitlePlural.replace('{attemptsRemaining}', String(attemptsRemaining))

  const warningRetryText = s.warningRetryText.replace('{planName}', planName)

  return (
    <BaseLayout
      preview={isFinal ? `⚠️ ${preview}` : `❌ ${preview}`}
      locale={locale}
    >
      <Heading style={styles.heading}>
        {isFinal ? `⚠️ ${s.titleFinal}` : `❌ ${s.titleRetry}`}
      </Heading>

      <Text style={styles.text}>{locale === 'en' ? `Hi ${userName},` : `Olá ${userName},`}</Text>

      {isFinal ? (
        <>
          <Text style={styles.text}>{introFinal}</Text>

          <Section style={styles.warningCard}>
            <Text style={styles.warningTitle}>{s.warningFinalTitle}</Text>
            <Text style={styles.warningItem}>• {s.warningFinalItem1}</Text>
            <Text style={styles.warningItem}>• {s.warningFinalItem2}</Text>
            <Text style={styles.warningItem}>• {s.warningFinalItem3}</Text>
          </Section>
        </>
      ) : (
        <>
          <Text style={styles.text}>{introRetry}</Text>

          <Section style={{ ...styles.warningCard, borderColor: '#f59e0b', backgroundColor: '#fffbeb' }}>
            <Text style={{ ...styles.warningTitle, color: '#92400e' }}>
              ⏱️ {warningRetryTitle}
            </Text>
            <Text style={{ ...styles.warningItem, color: '#78350f' }}>
              {warningRetryText}
            </Text>
          </Section>
        </>
      )}

      <Hr style={styles.divider} />

      <Section style={styles.ctaSection}>
        <Button href={updateCardUrl} style={isFinal ? styles.buttonPrimary : styles.buttonWarning}>
          {isFinal ? s.ctaFinal : s.ctaRetry}
        </Button>
      </Section>

      <Text style={styles.small}>{s.helpText}</Text>

      <Text style={styles.signature}>{s.signature}</Text>
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
  warningCard: {
    margin: '24px 0',
    padding: '20px',
    backgroundColor: '#fef2f2',
    border: '2px solid #fca5a5',
    borderRadius: '8px',
  },
  warningTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#991b1b',
    margin: '0 0 12px',
  },
  warningItem: {
    fontSize: '15px',
    lineHeight: '24px',
    color: '#7f1d1d',
    margin: '6px 0',
  },
  divider: {
    margin: '32px 0',
    borderColor: '#e5e5e5',
  },
  ctaSection: {
    textAlign: 'center' as const,
    margin: '32px 0',
  },
  buttonWarning: {
    backgroundColor: '#f59e0b',
    color: '#ffffff',
    padding: '12px 32px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '16px',
    display: 'inline-block',
  },
  buttonPrimary: {
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
    fontSize: '13px',
    lineHeight: '18px',
    color: '#6b7280',
    margin: '8px 0',
  },
  signature: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#404040',
    margin: '32px 0 0',
  },
}

export default PaymentFailureEmail
