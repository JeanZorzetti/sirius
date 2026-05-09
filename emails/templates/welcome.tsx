import { Text, Heading, Button, Section } from '@react-email/components'
import { BaseLayout } from '../layouts/base'
import emailsEn from '@/messages/en/emails.json'
import emailsPtBr from '@/messages/pt-BR/emails.json'

type Locale = 'pt-BR' | 'en'

interface WelcomeEmailProps {
  userName: string
  organizationName: string
  dashboardUrl?: string
  locale?: Locale
}

export function WelcomeEmail({
  userName,
  organizationName,
  dashboardUrl = 'https://siriuscrm.com.br/dashboard',
  locale = 'pt-BR',
}: WelcomeEmailProps) {
  const s = locale === 'en' ? emailsEn.emails.welcome : emailsPtBr.emails.welcome

  const preview = s.preview.replace('{userName}', userName)
  const intro = s.intro.replace('{organizationName}', organizationName)

  return (
    <BaseLayout preview={preview} locale={locale}>
      <Heading style={styles.heading}>{s.title}</Heading>

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

      <Text style={styles.text}>{s.body}</Text>

      <Section style={styles.steps}>
        <Text style={styles.step}>
          <strong>{s.step1Title}</strong>
          <br />
          {s.step1Body}
        </Text>

        <Text style={styles.step}>
          <strong>{s.step2Title}</strong>
          <br />
          {s.step2Body}
        </Text>

        <Text style={styles.step}>
          <strong>{s.step3Title}</strong>
          <br />
          {s.step3Body}
        </Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Button href={dashboardUrl} style={styles.button}>
          {s.cta}
        </Button>
      </Section>

      <Text style={styles.tip}>
        <strong>{locale === 'en' ? 'Tip:' : 'Dica:'}</strong> {s.tip}
      </Text>

      <Text style={styles.text}>{s.helpText}</Text>

      <Text style={styles.signature}>
        {s.signature.split('\n').map((line, i) => (
          <span key={i}>
            {line}
            {i < s.signature.split('\n').length - 1 && <br />}
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
  steps: {
    margin: '24px 0',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
  },
  step: {
    fontSize: '15px',
    lineHeight: '22px',
    color: '#404040',
    margin: '12px 0',
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
  tip: {
    fontSize: '14px',
    lineHeight: '20px',
    color: '#666666',
    padding: '12px 16px',
    backgroundColor: '#fef3c7',
    borderLeft: '3px solid #f59e0b',
    borderRadius: '4px',
    margin: '24px 0',
  },
  signature: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#404040',
    margin: '32px 0 0',
  },
}

export default WelcomeEmail
