import { Text, Heading, Button, Section } from '@react-email/components'
import { BaseLayout } from '../layouts/base'
import emailsEn from '@/messages/en/emails.json'
import emailsPtBr from '@/messages/pt-BR/emails.json'

type Locale = 'pt-BR' | 'en'

interface InviteEmailProps {
  inviterName: string
  organizationName: string
  inviteUrl: string
  locale?: Locale
}

export function InviteEmail({
  inviterName,
  organizationName,
  inviteUrl,
  locale = 'pt-BR',
}: InviteEmailProps) {
  const s = locale === 'en' ? emailsEn.emails.invite : emailsPtBr.emails.invite

  const preview = s.preview
    .replace('{inviterName}', inviterName)
    .replace('{organizationName}', organizationName)

  const intro = s.intro
    .replace('{inviterName}', inviterName)
    .replace('{organizationName}', organizationName)

  return (
    <BaseLayout preview={preview} locale={locale}>
      <Heading style={styles.heading}>{s.title}</Heading>

      <Text style={styles.text}>{locale === 'en' ? 'Hi,' : 'Olá,'}</Text>

      <Text style={styles.text}>{intro}</Text>

      <Text style={styles.text}>{s.body}</Text>

      <Section style={styles.ctaSection}>
        <Button href={inviteUrl} style={styles.button}>
          {s.cta}
        </Button>
      </Section>

      <Text style={styles.note}>{s.note}</Text>

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
  ctaSection: {
    textAlign: 'center' as const,
    margin: '32px 0',
  },
  button: {
    backgroundColor: '#6366f1',
    color: '#ffffff',
    padding: '12px 32px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '16px',
    display: 'inline-block',
  },
  note: {
    fontSize: '14px',
    lineHeight: '20px',
    color: '#666666',
    padding: '12px 16px',
    backgroundColor: '#f1f5f9',
    borderLeft: '3px solid #94a3b8',
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

export default InviteEmail
