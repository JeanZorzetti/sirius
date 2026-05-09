import { Text, Heading, Button, Section, Link } from '@react-email/components'
import { BaseLayout } from '../layouts/base'
import emailsEn from '@/messages/en/emails.json'
import emailsPtBr from '@/messages/pt-BR/emails.json'

type Locale = 'pt-BR' | 'en'

interface WhatsAppMigrationEmailProps {
  userName: string
  organizationName: string
  upgradeUrl?: string
  locale?: Locale
}

export function WhatsAppMigrationEmail({
  userName,
  organizationName,
  upgradeUrl = 'https://siriuscrm.com.br/dashboard/billing/plans',
  locale = 'pt-BR',
}: WhatsAppMigrationEmailProps) {
  const s = locale === 'en' ? emailsEn.emails.whatsappMigration : emailsPtBr.emails.whatsappMigration

  const intro = s.intro.replace('{organizationName}', organizationName)

  return (
    <BaseLayout preview={s.preview} locale={locale}>
      <Section style={styles.warningBanner}>
        <Text style={styles.warningIcon}>⚠️</Text>
        <Text style={styles.warningTitle}>{s.warningBannerTitle}</Text>
      </Section>

      <Text style={styles.greeting}>{locale === 'en' ? `Hi ${userName},` : `Olá ${userName},`}</Text>

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

      {/* Main hook */}
      <Section style={styles.hookBox}>
        <Text style={styles.hookTitle}>{s.hookTitle}</Text>
        <Text style={styles.hookText}>{s.hookText}</Text>
        <Link href="https://faq.whatsapp.com/5957850900902049" style={styles.sourceLink}>
          {s.sourceLink}
        </Link>
      </Section>

      {/* Good news */}
      <Section style={styles.goodNewsBox}>
        <Text style={styles.goodNewsTitle}>✅ {s.goodNewsTitle}</Text>
        <Text style={styles.goodNewsText}>{s.goodNewsText}</Text>
      </Section>

      <Heading style={styles.subheading}>{s.changesTitle}</Heading>

      <Section style={styles.changesList}>
        <Text style={styles.changeItem}>❌ <strong>{s.change1.split(':')[0]}:</strong>{s.change1.includes(':') ? s.change1.slice(s.change1.indexOf(':') + 1) : ''}</Text>
        <Text style={styles.changeItem}>✅ <strong>{s.change2.split(':')[0]}:</strong>{s.change2.includes(':') ? s.change2.slice(s.change2.indexOf(':') + 1) : ''}</Text>
        <Text style={styles.changeItem}>✅ <strong>{s.change3.split(':')[0]}:</strong>{s.change3.includes(':') ? s.change3.slice(s.change3.indexOf(':') + 1) : ''}</Text>
        <Text style={styles.changeItem}>✅ <strong>{s.change4.split(':')[0]}:</strong>{s.change4.includes(':') ? s.change4.slice(s.change4.indexOf(':') + 1) : ''}</Text>
        <Text style={styles.changeItem}>✅ {s.change5}</Text>
      </Section>

      <Text style={styles.text}>{s.instructionText}</Text>

      <Section style={styles.ctaSection}>
        <Button href="https://siriuscrm.com.br/dashboard/settings/integrations/whatsapp-official" style={styles.button}>
          {s.cta}
        </Button>
      </Section>

      <Text style={styles.footnote}>
        {s.footnote.includes('siriuscrm.com.br') ? (
          <>
            {s.footnote.split('siriuscrm.com.br')[0]}
            <Link href="https://siriuscrm.com.br" style={styles.inlineLink}>siriuscrm.com.br</Link>
            {s.footnote.split('siriuscrm.com.br')[1]}
          </>
        ) : s.footnote}
      </Text>

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
  warningBanner: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fcd34d',
    borderRadius: '8px',
    padding: '16px 20px',
    marginBottom: '24px',
    textAlign: 'center' as const,
  },
  warningIcon: {
    fontSize: '28px',
    margin: '0 0 4px',
  },
  warningTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#92400e',
    margin: 0,
  },
  greeting: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#404040',
    margin: '0 0 16px',
  },
  text: {
    fontSize: '16px',
    lineHeight: '26px',
    color: '#404040',
    margin: '16px 0',
  },
  hookBox: {
    backgroundColor: '#18181b',
    borderRadius: '10px',
    padding: '24px',
    margin: '24px 0',
  },
  hookTitle: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#4ade80',
    margin: '0 0 10px',
    lineHeight: '1.3',
  },
  hookText: {
    fontSize: '14px',
    lineHeight: '22px',
    color: '#a1a1aa',
    margin: '0 0 12px',
  },
  sourceLink: {
    fontSize: '13px',
    color: '#86efac',
    textDecoration: 'underline',
  },
  goodNewsBox: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
  },
  goodNewsTitle: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#15803d',
    margin: '0 0 8px',
  },
  goodNewsText: {
    fontSize: '14px',
    lineHeight: '22px',
    color: '#166534',
    margin: 0,
  },
  subheading: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    margin: '32px 0 12px',
  },
  changesList: {
    backgroundColor: '#fafafa',
    border: '1px solid #e4e4e7',
    borderRadius: '8px',
    padding: '16px 20px',
    margin: '0 0 24px',
  },
  changeItem: {
    fontSize: '14px',
    lineHeight: '26px',
    color: '#3f3f46',
    margin: '2px 0',
  },
  ctaSection: {
    textAlign: 'center' as const,
    margin: '32px 0',
  },
  button: {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    padding: '14px 40px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '16px',
    display: 'inline-block',
  },
  footnote: {
    fontSize: '14px',
    lineHeight: '22px',
    color: '#666666',
    fontStyle: 'italic',
    textAlign: 'center' as const,
    margin: '24px 0',
  },
  inlineLink: {
    color: '#3b82f6',
    textDecoration: 'none',
  },
  signature: {
    fontSize: '15px',
    lineHeight: '24px',
    color: '#404040',
    margin: '32px 0 0',
  },
}

export default WhatsAppMigrationEmail
