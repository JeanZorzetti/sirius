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

interface BaseLayoutProps {
  children: React.ReactNode
  preview?: string
}

export function BaseLayout({ children, preview }: BaseLayoutProps) {
  return (
    <Html>
      <Head />
      {preview && <Text style={{ display: 'none' }}>{preview}</Text>}
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Text style={styles.logo}>⭐ Sirius CRM</Text>
          </Section>

          {/* Content */}
          <Section style={styles.content}>{children}</Section>

          {/* Footer */}
          <Hr style={styles.hr} />
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} ROI Labs. Todos os direitos reservados.
            </Text>
            <Text style={styles.footerText}>
              <Link href="https://sirius.roilabs.com.br" style={styles.link}>
                sirius.roilabs.com.br
              </Link>
              {' • '}
              <Link href="https://sirius.roilabs.com.br/privacy" style={styles.link}>
                Privacidade
              </Link>
              {' • '}
              <Link href="https://sirius.roilabs.com.br/terms" style={styles.link}>
                Termos
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
