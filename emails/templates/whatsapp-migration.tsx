import { Text, Heading, Button, Section, Link } from '@react-email/components'
import { BaseLayout } from '../layouts/base'

interface WhatsAppMigrationEmailProps {
  userName: string
  organizationName: string
  upgradeUrl?: string
}

export function WhatsAppMigrationEmail({
  userName,
  organizationName,
  upgradeUrl = 'https://siriuscrm.com.br/dashboard/billing/plans',
}: WhatsAppMigrationEmailProps) {
  return (
    <BaseLayout preview="Atualização importante: WhatsApp Oficial no Sirius CRM">
      <Section style={styles.warningBanner}>
        <Text style={styles.warningIcon}>⚠️</Text>
        <Text style={styles.warningTitle}>Atualização importante sobre o WhatsApp</Text>
      </Section>

      <Text style={styles.greeting}>Olá {userName},</Text>

      <Text style={styles.text}>
        Temos uma atualização importante sobre a integração WhatsApp da <strong>{organizationName}</strong> no Sirius CRM.
      </Text>

      {/* Main hook */}
      <Section style={styles.hookBox}>
        <Text style={styles.hookTitle}>Nunca mais tenha o WhatsApp bloqueado.</Text>
        <Text style={styles.hookText}>
          A Meta está banindo números que usam integrações não oficiais (Evolution API, Baileys, Whatsmeow e similares).
          Por isso, migramos para a <strong>API Oficial do WhatsApp Business (Meta Cloud API)</strong> — a única integração
          permitida pelos Termos de Uso do WhatsApp.
        </Text>
        <Link href="https://faq.whatsapp.com/5957850900902049" style={styles.sourceLink}>
          Fonte oficial: WhatsApp Help Center →
        </Link>
      </Section>

      {/* Good news */}
      <Section style={styles.goodNewsBox}>
        <Text style={styles.goodNewsTitle}>✅ Sua conta está protegida</Text>
        <Text style={styles.goodNewsText}>
          Por ser cliente do Sirius CRM antes dessa mudança, você mantém acesso ao WhatsApp Oficial
          no seu plano atual — <strong>sem precisar fazer upgrade</strong>.
        </Text>
      </Section>

      <Heading style={styles.subheading}>O que muda para você?</Heading>

      <Section style={styles.changesList}>
        <Text style={styles.changeItem}>❌ <strong>Integração anterior:</strong> desativada (risco de banimento)</Text>
        <Text style={styles.changeItem}>✅ <strong>Nova integração:</strong> API Oficial Meta — zero risco de banimento</Text>
        <Text style={styles.changeItem}>✅ <strong>Status em tempo real:</strong> entregue, lido, respondido</Text>
        <Text style={styles.changeItem}>✅ <strong>Uptime 24/7:</strong> não depende de celular conectado</Text>
        <Text style={styles.changeItem}>✅ <strong>Conformidade total</strong> com os Termos de Uso do WhatsApp</Text>
      </Section>

      <Text style={styles.text}>
        Para ativar, acesse <strong>Configurações → Integrações → WhatsApp Oficial</strong> e siga o guia de configuração.
        Nossa equipe também pode fazer a configuração completa por você por uma taxa única de <strong>R$ 297</strong>.
      </Text>

      <Section style={styles.ctaSection}>
        <Button href="https://siriuscrm.com.br/dashboard/settings/integrations/whatsapp-official" style={styles.button}>
          Configurar WhatsApp Oficial
        </Button>
      </Section>

      <Text style={styles.footnote}>
        Dúvidas? Responda este email ou acesse{' '}
        <Link href="https://siriuscrm.com.br" style={styles.inlineLink}>siriuscrm.com.br</Link>.
        Estamos aqui para ajudar na transição.
      </Text>

      <Text style={styles.signature}>
        Atenciosamente,
        <br />
        Equipe Sirius CRM
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
