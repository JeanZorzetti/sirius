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
    <BaseLayout preview="Importante: mudança no WhatsApp do Sirius CRM">
      <Section style={styles.warningBanner}>
        <Text style={styles.warningIcon}>⚠️</Text>
        <Text style={styles.warningTitle}>Aviso Importante sobre o WhatsApp</Text>
      </Section>

      <Text style={styles.greeting}>Olá {userName},</Text>

      <Text style={styles.text}>
        Estamos entrando em contato com uma atualização importante sobre a integração WhatsApp no <strong>{organizationName}</strong>.
      </Text>

      <Section style={styles.alertBox}>
        <Text style={styles.alertTitle}>A Meta está banindo contas que usam APIs não oficiais</Text>
        <Text style={styles.alertText}>
          A Meta começou a bloquear e banir números de WhatsApp que utilizam integrações não oficiais como Evolution API, Baileys, Whatsmeow e similares. Isso afeta diretamente qualquer CRM que use essas tecnologias — incluindo a versão anterior do Sirius CRM.
        </Text>
        <Link href="https://faq.whatsapp.com/5957850900902049" style={styles.sourceLink}>
          Fonte oficial: WhatsApp Help Center →
        </Link>
      </Section>

      <Text style={styles.text}>
        Para proteger o número da sua empresa, o <strong>Sirius CRM migrou para a API Oficial do WhatsApp Business (Meta Cloud API)</strong> — a única integração permitida pelos Termos de Uso da Meta.
      </Text>

      <Heading style={styles.subheading}>O que muda para você?</Heading>

      <Section style={styles.changesList}>
        <Text style={styles.changeItem}>❌ <strong>Integração anterior:</strong> Descontinuada (risco de banimento)</Text>
        <Text style={styles.changeItem}>✅ <strong>Nova integração:</strong> API Oficial Meta — zero risco de banimento</Text>
        <Text style={styles.changeItem}>✅ <strong>Suporte a templates</strong> de mensagem aprovados pela Meta</Text>
        <Text style={styles.changeItem}>✅ <strong>Status em tempo real:</strong> entregue, lido, respondido</Text>
        <Text style={styles.changeItem}>✅ <strong>Conformidade total</strong> com os Termos de Uso do WhatsApp</Text>
      </Section>

      <Section style={styles.planBox}>
        <Text style={styles.planLabel}>Disponível exclusivamente no plano</Text>
        <Text style={styles.planName}>Business — R$ 397/mês</Text>
        <Text style={styles.planSubtext}>
          Inclui: 5 instâncias WhatsApp Oficial + contatos ilimitados + 50 usuários + suporte dedicado
        </Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Button href={upgradeUrl} style={styles.button}>
          Fazer Upgrade para Business
        </Button>
      </Section>

      <Text style={styles.footnote}>
        Se tiver dúvidas, responda este email ou acesse{' '}
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
  alertBox: {
    backgroundColor: '#fff7ed',
    border: '1px solid #fed7aa',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
  },
  alertTitle: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#9a3412',
    margin: '0 0 10px',
  },
  alertText: {
    fontSize: '14px',
    lineHeight: '22px',
    color: '#7c2d12',
    margin: '0 0 12px',
  },
  sourceLink: {
    fontSize: '13px',
    color: '#c2410c',
    textDecoration: 'underline',
  },
  subheading: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    margin: '32px 0 16px',
  },
  changesList: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    padding: '16px 20px',
    margin: '16px 0',
  },
  changeItem: {
    fontSize: '14px',
    lineHeight: '26px',
    color: '#166534',
    margin: '2px 0',
  },
  planBox: {
    backgroundColor: '#f8fafc',
    border: '2px solid #22c55e',
    borderRadius: '10px',
    padding: '24px',
    margin: '32px 0',
    textAlign: 'center' as const,
  },
  planLabel: {
    fontSize: '13px',
    color: '#666666',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    margin: '0 0 4px',
  },
  planName: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#15803d',
    margin: '0 0 8px',
  },
  planSubtext: {
    fontSize: '13px',
    color: '#4b5563',
    margin: 0,
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
