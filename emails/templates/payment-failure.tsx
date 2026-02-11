import { Text, Heading, Button, Section, Hr } from '@react-email/components'
import { BaseLayout } from '../layouts/base'

interface PaymentFailureEmailProps {
  userName: string
  organizationName: string
  planName: string
  attemptNumber: number
  maxAttempts: number
  updateCardUrl: string
  isFinal?: boolean
}

export function PaymentFailureEmail({
  userName,
  organizationName,
  planName,
  attemptNumber,
  maxAttempts,
  updateCardUrl,
  isFinal = false,
}: PaymentFailureEmailProps) {
  const attemptsRemaining = maxAttempts - attemptNumber

  return (
    <BaseLayout
      preview={
        isFinal
          ? `⚠️ Assinatura cancelada – ${organizationName}`
          : `❌ Falha no pagamento (${attemptNumber}/${maxAttempts}) – ${organizationName}`
      }
    >
      <Heading style={styles.heading}>
        {isFinal ? '⚠️ Assinatura Cancelada' : '❌ Falha no Pagamento'}
      </Heading>

      <Text style={styles.text}>Olá {userName},</Text>

      {isFinal ? (
        <>
          <Text style={styles.text}>
            Após <strong>{maxAttempts} tentativas</strong> de cobrança sem sucesso, a assinatura{' '}
            <strong>{planName}</strong> da <strong>{organizationName}</strong> foi cancelada e o plano foi
            revertido para o plano <strong>Gratuito</strong>.
          </Text>

          <Section style={styles.warningCard}>
            <Text style={styles.warningTitle}>O que acontece agora?</Text>
            <Text style={styles.warningItem}>• Seus dados estão seguros e permanecem no sistema</Text>
            <Text style={styles.warningItem}>• Funcionalidades premium foram desativadas</Text>
            <Text style={styles.warningItem}>• Você pode reativar a assinatura a qualquer momento</Text>
          </Section>
        </>
      ) : (
        <>
          <Text style={styles.text}>
            Não conseguimos processar o pagamento da sua assinatura <strong>{planName}</strong>{' '}
            da <strong>{organizationName}</strong>. Esta é a tentativa{' '}
            <strong style={{ color: '#dc2626' }}>{attemptNumber} de {maxAttempts}</strong>.
          </Text>

          <Section style={{ ...styles.warningCard, borderColor: '#f59e0b', backgroundColor: '#fffbeb' }}>
            <Text style={{ ...styles.warningTitle, color: '#92400e' }}>
              ⏱️ Ação necessária: {attemptsRemaining} tentativa{attemptsRemaining !== 1 ? 's' : ''} restante{attemptsRemaining !== 1 ? 's' : ''}
            </Text>
            <Text style={{ ...styles.warningItem, color: '#78350f' }}>
              Atualize seu cartão para evitar a perda do plano {planName}.
            </Text>
          </Section>
        </>
      )}

      <Hr style={styles.divider} />

      <Section style={styles.ctaSection}>
        <Button href={updateCardUrl} style={isFinal ? styles.buttonPrimary : styles.buttonWarning}>
          {isFinal ? 'Reativar Assinatura' : 'Atualizar Forma de Pagamento'}
        </Button>
      </Section>

      <Text style={styles.small}>
        Caso precise de ajuda, entre em contato com nosso suporte em{' '}
        <strong>suporte@roilabs.com.br</strong>.
      </Text>

      <Text style={styles.signature}>
        Equipe Sirius CRM
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
  warningCard: {
    margin: '24px 0',
    padding: '20px',
    backgroundColor: '#fef2f2',
    border: '2px solid #fca5a5',
    borderRadius: '8px',
  },
  warningTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#991b1b',
    margin: '0 0 12px',
  },
  warningItem: {
    fontSize: '15px',
    lineHeight: '24px',
    color: '#7f1d1d',
    margin: '6px 0',
  },
  divider: {
    margin: '32px 0',
    borderColor: '#e5e5e5',
  },
  ctaSection: {
    textAlign: 'center' as const,
    margin: '32px 0',
  },
  buttonWarning: {
    backgroundColor: '#f59e0b',
    color: '#ffffff',
    padding: '12px 32px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '16px',
    display: 'inline-block',
  },
  buttonPrimary: {
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
    padding: '12px 32px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '16px',
    display: 'inline-block',
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
    color: '#404040',
    margin: '32px 0 0',
  },
}

export default PaymentFailureEmail
