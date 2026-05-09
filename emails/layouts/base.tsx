import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from '@react-email/components'

type Locale = 'pt-BR' | 'en'

interface BaseLayoutProps {
  children: React.ReactNode
  preview?: string
  locale?: Locale
}

// Inline dictionaries — React Email runs outside Next.js request context,
// so getTranslations/useTranslations are NOT available here.
const FOOTER_STRINGS: Record<Locale, { rights: string; privacy: string; terms: string }> = {
  'pt-BR': {
    rights: 'Todos os direitos reservados.',
    privacy: 'Privacidade',
    terms: 'Termos',
  },
  en: {
    rights: 'All rights reserved.',
    privacy: 'Privacy',
    terms: 'Terms',
  },
}

export function BaseLayout({ children, preview, locale = 'pt-BR' }: BaseLayoutProps) {
  const footer = FOOTER_STRINGS[locale] ?? FOOTER_STRINGS['pt-BR']

  return (
    <Html lang={locale}>
      <Head />
      {preview && <Text style={{ display: 'none' }}>{preview}</Text>}
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Text style={styles.logo}>Sirius CRM</Text>
          </Section>

          {/* Content */}
          <Section style={styles.content}>{children}</Section>

          {/* Footer */}
          <Hr style={styles.hr} />
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              &copy; {new Date().getFullYear()} ROI Labs. {footer.rights}
            </Text>
            <Text style={styles.footerText}>
              <Link href="https://siriuscrm.com.br" style={styles.link}>
                siriuscrm.com.br
              </Link>
              {' • '}
              <Link href="https://siriuscrm.com.br/privacy" style={styles.link}>
                {footer.privacy}
              </Link>
              {' • '}
              <Link href="https://siriuscrm.com.br/terms" style={styles.link}>
                {footer.terms}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const styles = {
  body: {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  },
  container: {
    margin: '0 auto',
    padding: '20px 0 48px',
    maxWidth: '600px',
  },
  header: {
    padding: '24px 0',
    textAlign: 'center' as const,
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    margin: 0,
  },
  content: {
    backgroundColor: '#ffffff',
    border: '1px solid #e6e6e6',
    borderRadius: '8px',
    padding: '32px',
  },
  footer: {
    paddingTop: '24px',
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: '12px',
    color: '#666666',
    margin: '4px 0',
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'none',
  },
  hr: {
    borderColor: '#e6e6e6',
    margin: '24px 0',
  },
}
