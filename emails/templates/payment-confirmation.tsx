import { Text, Heading, Button, Section, Hr } from '@react-email/components'
import { BaseLayout } from '../layouts/base'
import emailsEn from '@/messages/en/emails.json'
import emailsPtBr from '@/messages/pt-BR/emails.json'

type Locale = 'pt-BR' | 'en'

interface PaymentConfirmationEmailProps {
  userName: string
  organizationName: string
  paymentId: string
  paymentType: string
  amount: number
  nextBillingDate: string
  dashboardUrl?: string
  locale?: Locale
}

export function PaymentConfirmationEmail({
  userName,
  organizationName,
  paymentId,
  paymentType,
  amount,
  nextBillingDate,
  dashboardUrl = 'https://siriuscrm.com.br/dashboard',
  locale = 'pt-BR',
}: PaymentConfirmationEmailProps) {
  const s = locale === 'en' ? emailsEn.emails.paymentConfirmation : emailsPtBr.emails.paymentConfirmation

  const formatPaymentType = (type: string) => {
    const types: Record<string, string> = {
      'credit_card': s.paymentMethodCreditCard,
      'debit_card': s.paymentMethodDebitCard,
      'pix': s.paymentMethodPix,
      'boleto': s.paymentMethodBoleto,
    }
    return types[type] || type
  }

  const intro = s.intro.replace('{organizationName}', organizationName)
  const formattedAmount = locale === 'en'
    ? `$${amount.toFixed(2)}`
    : `R$ ${amount.toFixed(2).replace('.', ',')}`

  return (
    <BaseLayout preview={s.preview} locale={locale}>
      <Heading style={styles.heading}>{s.title} 🎉</Heading>

      <Text style={styles.text}>{locale === 'en' ? `Hi ${userName},` : `Olá ${userName},`}</Text>

      <Text style={styles.text}>
        {intro.split(organizationName).map((part, i, arr) =>
          i < arr.length - 1 ? (
            <span key={i}>
              {part}
              <strong>{organizationName}</strong>
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </Text>

      <Section style={styles.successCard}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successText}>{s.successBadge}</Text>
      </Section>

      <Hr style={styles.divider} />

      <Heading style={styles.subheading}>{s.detailsTitle}</Heading>

      <Section style={styles.detailsCard}>
        <div style={styles.detailRow}>
          <Text style={styles.detailLabel}>{s.labelTransactionId}</Text>
          <Text style={styles.detailValue}>{paymentId}</Text>
        </div>
        <div style={styles.detailRow}>
          <Text style={styles.detailLabel}>{s.labelPaymentMethod}</Text>
          <Text style={styles.detailValue}>{formatPaymentType(paymentType)}</Text>
        </div>
        <div style={styles.detailRow}>
          <Text style={styles.detailLabel}>{s.labelAmount}</Text>
          <Text style={styles.detailValue}>{formattedAmount}</Text>
        </div>
        <div style={styles.detailRow}>
          <Text style={styles.detailLabel}>{s.labelNextBilling}</Text>
          <Text style={styles.detailValue}>{nextBillingDate}</Text>
        </div>
      </Section>

      <Hr style={styles.divider} />

      <Heading style={styles.subheading}>{s.featuresTitle}</Heading>

      <Section style={styles.features}>
        <Text style={styles.feature}>✨ {s.feature1}</Text>
        <Text style={styles.feature}>✨ {s.feature2}</Text>
        <Text style={styles.feature}>✨ {s.feature3}</Text>
        <Text style={styles.feature}>✨ {s.feature4}</Text>
        <Text style={styles.feature}>✨ {s.feature5}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Button href={dashboardUrl} style={styles.button}>
          {s.cta}
        </Button>
      </Section>

      <Text style={styles.tip}>
        💡 <strong>{locale === 'en' ? 'Tip:' : 'Dica:'}</strong> {s.tip}
      </Text>

      <Hr style={styles.divider} />

      <Text style={styles.small}>{s.helpText}</Text>

      <Text style={styles.small}>{s.cancelText}</Text>

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
  subheading: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    margin: '24px 0 16px',
  },
  text: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#4a4a4a',
    margin: '0 0 16px',
  },
  successCard: {
    backgroundColor: '#f0fdf4',
    border: '2px solid #86efac',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center' as const,
    margin: '24px 0',
  },
  successIcon: {
    fontSize: '48px',
    color: '#16a34a',
    margin: '0 0 8px',
  },
  successText: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#16a34a',
    margin: '0',
  },
  divider: {
    margin: '32px 0',
    borderColor: '#e5e5e5',
  },
  detailsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '20px',
    margin: '16px 0',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  detailLabel: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0',
  },
  detailValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: '0',
  },
  features: {
    margin: '16px 0',
  },
  feature: {
    fontSize: '16px',
    lineHeight: '28px',
    color: '#4a4a4a',
    margin: '8px 0',
  },
  ctaSection: {
    textAlign: 'center' as const,
    margin: '32px 0',
  },
  button: {
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '14px 32px',
    borderRadius: '8px',
  },
  tip: {
    fontSize: '14px',
    lineHeight: '20px',
    color: '#6b7280',
    backgroundColor: '#fef3c7',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #fbbf24',
    margin: '24px 0',
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
    color: '#4a4a4a',
    margin: '24px 0 0',
  },
}
