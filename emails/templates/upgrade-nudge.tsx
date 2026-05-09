import { Text, Heading, Button, Section } from '@react-email/components'
import { BaseLayout } from '../layouts/base'
import emailsEn from '@/messages/en/emails.json'
import emailsPtBr from '@/messages/pt-BR/emails.json'

type Locale = 'pt-BR' | 'en'

interface UpgradeNudgeEmailProps {
  userName: string
  currentDeals: number
  maxDeals: number
  upgradeUrl?: string
  locale?: Locale
}

export function UpgradeNudgeEmail({
  userName,
  currentDeals,
  maxDeals,
  upgradeUrl = 'https://siriuscrm.com.br/dashboard/billing',
  locale = 'pt-BR',
}: UpgradeNudgeEmailProps) {
  const s = locale === 'en' ? emailsEn.emails.upgradeNudge : emailsPtBr.emails.upgradeNudge

  const percentUsed = Math.round((currentDeals / maxDeals) * 100)
  const remaining = maxDeals - currentDeals

  const intro = s.intro.replace('{currentDeals}', String(currentDeals))
  const progressText = s.progressText
    .replace('{currentDeals}', String(currentDeals))
    .replace('{maxDeals}', String(maxDeals))
    .replace('{percentUsed}', String(percentUsed))
  const warningText = s.warningText.replace('{remaining}', String(remaining))
  const limitWarning = s.limitWarning.replace('{maxDeals}', String(maxDeals))

  return (
    <BaseLayout preview={s.preview} locale={locale}>
      <Heading style={styles.heading}>{s.title} 🚀</Heading>

      <Text style={styles.text}>{locale === 'en' ? `Hi ${userName},` : `Olá ${userName},`}</Text>

      <Text style={styles.text}>{intro}</Text>

      <Section style={styles.progressCard}>
        <Text style={styles.progressText}>{progressText}</Text>
        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${percentUsed}%`,
            }}
          />
        </div>
        <Text style={styles.warningText}>⚠️ {warningText}</Text>
      </Section>

      <Text style={styles.text}>{limitWarning}</Text>

      <Heading style={styles.subheading}>{s.whyUpgradeTitle}</Heading>

      <Section style={styles.benefits}>
        <Text style={styles.benefit}>✅ {s.benefit1}</Text>
        <Text style={styles.benefit}>✅ {s.benefit2}</Text>
        <Text style={styles.benefit}>✅ {s.benefit3}</Text>
        <Text style={styles.benefit}>✅ {s.benefit4}</Text>
        <Text style={styles.benefit}>✅ {s.benefit5}</Text>
      </Section>

      <Section style={styles.pricingCard}>
        <Text style={styles.pricingText}>
          <span style={styles.price}>{locale === 'en' ? '$67' : 'R$ 67'}</span>
          <span style={styles.period}>{locale === 'en' ? '/mo' : '/mês'}</span>
        </Text>
        <Text style={styles.pricingSubtext}>{s.pricingSubtext}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Button href={upgradeUrl} style={styles.button}>
          {s.cta}
        </Button>
      </Section>

      <Text style={styles.footnote}>{s.footnote}</Text>

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
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    margin: '32px 0 16px',
  },
  text: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#404040',
    margin: '16px 0',
  },
  progressCard: {
    margin: '24px 0',
    padding: '20px',
    backgroundColor: '#fef3c7',
    borderRadius: '8px',
  },
  progressText: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center' as const,
    margin: '0 0 12px',
  },
  progressBar: {
    height: '12px',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    overflow: 'hidden',
    margin: '12px 0',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    transition: 'width 0.3s ease',
  },
  warningText: {
    fontSize: '14px',
    color: '#92400e',
    textAlign: 'center' as const,
    margin: '12px 0 0',
  },
  benefits: {
    margin: '16px 0',
    padding: '16px',
    backgroundColor: '#f0f9ff',
    borderRadius: '6px',
  },
  benefit: {
    fontSize: '15px',
    lineHeight: '28px',
    color: '#1e40af',
    margin: '4px 0',
  },
  pricingCard: {
    textAlign: 'center' as const,
    margin: '32px 0',
    padding: '24px',
    backgroundColor: '#f8fafc',
    border: '2px solid #3b82f6',
    borderRadius: '8px',
  },
  pricingText: {
    margin: '0 0 8px',
  },
  price: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  period: {
    fontSize: '18px',
    color: '#666666',
  },
  pricingSubtext: {
    fontSize: '14px',
    color: '#666666',
    margin: '0',
  },
  ctaSection: {
    textAlign: 'center' as const,
    margin: '32px 0',
  },
  button: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    padding: '14px 40px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '18px',
    display: 'inline-block',
  },
  footnote: {
    fontSize: '14px',
    lineHeight: '20px',
    color: '#666666',
    fontStyle: 'italic',
    textAlign: 'center' as const,
    margin: '24px 0',
  },
  signature: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#404040',
    margin: '32px 0 0',
  },
}

export default UpgradeNudgeEmail
