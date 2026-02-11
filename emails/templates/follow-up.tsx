import { Text, Heading, Button, Section } from '@react-email/components'
import { BaseLayout } from '../layouts/base'

interface FollowUpEmailProps {
  userName: string
  dealTitle: string
  dealValue?: number
  contactName?: string
  stageName: string
  daysSinceUpdate: number
  dealUrl: string
}

export function FollowUpEmail({
  userName,
  dealTitle,
  dealValue,
  contactName,
  stageName,
  daysSinceUpdate,
  dealUrl,
}: FollowUpEmailProps) {
  const formattedValue = dealValue
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dealValue)
    : null

  const urgencyLevel = daysSinceUpdate >= 14 ? 'alto' : daysSinceUpdate >= 7 ? 'médio' : 'baixo'
  const urgencyColor = urgencyLevel === 'alto' ? '#dc2626' : urgencyLevel === 'médio' ? '#f59e0b' : '#3b82f6'
  const urgencyEmoji = urgencyLevel === 'alto' ? '🚨' : urgencyLevel === 'médio' ? '⚠️' : '📌'

  return (
    <BaseLayout preview={`${urgencyEmoji} Follow-up necessário: ${dealTitle} (${daysSinceUpdate} dias sem atualização)`}>
      <Heading style={styles.heading}>
        {urgencyEmoji} Negócio precisando de atenção
      </Heading>

      <Text style={styles.text}>Olá {userName},</Text>

      <Text style={styles.text}>
        O negócio <strong>{dealTitle}</strong> está parado há <strong style={{ color: urgencyColor }}>{daysSinceUpdate} dias</strong> na etapa <strong>{stageName}</strong>.
      </Text>

      <Section style={{ ...styles.dealCard, borderColor: urgencyColor }}>
        <Text style={styles.dealTitle}>{dealTitle}</Text>
        <Section style={styles.dealDetails}>
          {formattedValue && (
            <Text style={styles.detailRow}>
              💰 <strong>Valor:</strong> {formattedValue}
            </Text>
          )}
          <Text style={styles.detailRow}>
            📋 <strong>Etapa atual:</strong> {stageName}
          </Text>
          {contactName && (
            <Text style={styles.detailRow}>
              👤 <strong>Contato:</strong> {contactName}
            </Text>
          )}
          <Text style={{ ...styles.detailRow, color: urgencyColor, fontWeight: 'bold' }}>
            ⏱️ Sem atualização há: {daysSinceUpdate} dias
          </Text>
        </Section>
      </Section>

      <Text style={styles.text}>
        <strong>Ações recomendadas:</strong>
      </Text>

      <Section style={styles.suggestions}>
        <Text style={styles.suggestion}>• Ligue ou mande mensagem para {contactName || 'o contato'}</Text>
        <Text style={styles.suggestion}>• Atualize o status do negócio no pipeline</Text>
        <Text style={styles.suggestion}>• Adicione uma nota sobre a situação atual</Text>
        {daysSinceUpdate >= 14 && (
          <Text style={{ ...styles.suggestion, color: '#dc2626' }}>
            • ⚠️ Considere marcar como perdido se não houver resposta
          </Text>
        )}
      </Section>

      <Section style={styles.ctaSection}>
        <Button href={dealUrl} style={{ ...styles.button, backgroundColor: urgencyColor }}>
          Atualizar Negócio Agora
        </Button>
      </Section>

      <Text style={styles.signature}>
        Boas vendas!
        <br />
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
  dealCard: {
    margin: '24px 0',
    padding: '20px',
    backgroundColor: '#f8fafc',
    border: '2px solid #3b82f6',
    borderRadius: '8px',
  },
  dealTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    margin: '0 0 16px',
  },
  dealDetails: {
    margin: '0',
  },
  detailRow: {
    fontSize: '15px',
    lineHeight: '24px',
    color: '#404040',
    margin: '8px 0',
  },
  suggestions: {
    margin: '16px 0',
    paddingLeft: '16px',
  },
  suggestion: {
    fontSize: '15px',
    lineHeight: '24px',
    color: '#404040',
    margin: '8px 0',
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
  signature: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#404040',
    margin: '32px 0 0',
  },
}

export default FollowUpEmail
