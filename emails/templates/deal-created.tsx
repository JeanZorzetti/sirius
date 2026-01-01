import { Text, Heading, Button, Section } from '@react-email/components'
import { BaseLayout } from '../layouts/base'

interface DealCreatedEmailProps {
  userName: string
  dealTitle: string
  dealValue: number
  dealStage: string
  contactName?: string
  dealUrl: string
}

export function DealCreatedEmail({
  userName,
  dealTitle,
  dealValue,
  dealStage,
  contactName,
  dealUrl,
}: DealCreatedEmailProps) {
  const formattedValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(dealValue)

  return (
    <BaseLayout preview={`Novo negócio criado: ${dealTitle}`}>
      <Heading style={styles.heading}>Novo negócio criado! 💼</Heading>

      <Text style={styles.text}>Olá {userName},</Text>

      <Text style={styles.text}>
        Um novo negócio foi adicionado ao seu pipeline:
      </Text>

      <Section style={styles.dealCard}>
        <Text style={styles.dealTitle}>{dealTitle}</Text>

        <Section style={styles.dealDetails}>
          <Text style={styles.detailRow}>
            <strong>Valor:</strong> {formattedValue}
          </Text>
          <Text style={styles.detailRow}>
            <strong>Etapa:</strong> {dealStage}
          </Text>
          {contactName && (
            <Text style={styles.detailRow}>
              <strong>Contato:</strong> {contactName}
            </Text>
          )}
        </Section>
      </Section>

      <Text style={styles.text}>
        <strong>Próximos passos sugeridos:</strong>
      </Text>

      <Section style={styles.suggestions}>
        <Text style={styles.suggestion}>
          • Agende um follow-up com o cliente
        </Text>
        <Text style={styles.suggestion}>
          • Adicione notas sobre a reunião inicial
        </Text>
        <Text style={styles.suggestion}>
          • Configure lembretes para acompanhamento
        </Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Button href={dealUrl} style={styles.button}>
          Ver Negócio
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

export default DealCreatedEmail
