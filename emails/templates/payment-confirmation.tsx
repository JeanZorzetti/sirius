import { Text, Heading, Button, Section, Hr } from '@react-email/components'
import { BaseLayout } from '../layouts/base'

interface PaymentConfirmationEmailProps {
  userName: string
  organizationName: string
  paymentId: string
  paymentType: string
  amount: number
  nextBillingDate: string
  dashboardUrl?: string
}

export function PaymentConfirmationEmail({
  userName,
  organizationName,
  paymentId,
  paymentType,
  amount,
  nextBillingDate,
  dashboardUrl = 'https://sirius.roilabs.com.br/dashboard',
}: PaymentConfirmationEmailProps) {
  const formatPaymentType = (type: string) => {
    const types: Record<string, string> = {
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'pix': 'PIX',
      'boleto': 'Boleto Bancário'
    }
    return types[type] || type
  }

  return (
    <BaseLayout preview={`Bem-vindo ao Sirius Pro! Pagamento confirmado 🎉`}>
      <Heading style={styles.heading}>Pagamento Confirmado! 🎉</Heading>

      <Text style={styles.text}>Olá {userName},</Text>

      <Text style={styles.text}>
        Recebemos seu pagamento com sucesso e a <strong>{organizationName}</strong> foi
        atualizada para o <strong style={{ color: '#8b5cf6' }}>Plano Pro</strong>!
      </Text>

      <Section style={styles.successCard}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successText}>
          Pagamento Aprovado
        </Text>
      </Section>

      <Hr style={styles.divider} />

      <Heading style={styles.subheading}>Detalhes do Pagamento</Heading>

      <Section style={styles.detailsCard}>
        <div style={styles.detailRow}>
          <Text style={styles.detailLabel}>ID da Transação:</Text>
          <Text style={styles.detailValue}>{paymentId}</Text>
        </div>
        <div style={styles.detailRow}>
          <Text style={styles.detailLabel}>Método de Pagamento:</Text>
          <Text style={styles.detailValue}>{formatPaymentType(paymentType)}</Text>
        </div>
        <div style={styles.detailRow}>
          <Text style={styles.detailLabel}>Valor Pago:</Text>
          <Text style={styles.detailValue}>
            R$ {amount.toFixed(2).replace('.', ',')}
          </Text>
        </div>
        <div style={styles.detailRow}>
          <Text style={styles.detailLabel}>Próximo Vencimento:</Text>
          <Text style={styles.detailValue}>{nextBillingDate}</Text>
        </div>
      </Section>

      <Hr style={styles.divider} />

      <Heading style={styles.subheading}>Agora você tem acesso a:</Heading>

      <Section style={styles.features}>
        <Text style={styles.feature}>✨ Negócios Ilimitados</Text>
        <Text style={styles.feature}>✨ Múltiplos Pipelines Personalizados</Text>
        <Text style={styles.feature}>✨ Analytics Avançado</Text>
        <Text style={styles.feature}>✨ Automações de Email</Text>
        <Text style={styles.feature}>✨ Suporte Prioritário</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Button href={dashboardUrl} style={styles.button}>
          Explorar Recursos Pro
        </Button>
      </Section>

      <Text style={styles.tip}>
        💡 <strong>Dica:</strong> Explore os múltiplos pipelines para organizar diferentes
        etapas do seu processo de vendas.
      </Text>

      <Hr style={styles.divider} />

      <Text style={styles.small}>
        <strong>Precisa de ajuda?</strong> Entre em contato com nosso suporte
        prioritário em suporte@roilabs.com.br ou através do chat no dashboard.
      </Text>

      <Text style={styles.small}>
        <strong>Quer cancelar?</strong> Você pode cancelar a qualquer momento através
        do painel de configurações. Não fazemos perguntas e não há multa.
      </Text>

      <Text style={styles.signature}>
        Obrigado por escolher o Sirius CRM!
        <br />
        Equipe Sirius
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
