import {
  Button,
  Heading,
  Hr,
  Section,
  Text,
} from '@react-email/components'
import { BaseLayout } from '../layouts/base'

interface DealStageChangedEmailProps {
  dealTitle: string
  dealValue: number
  oldStage: string
  newStage: string
  assigneeName: string
  dealUrl: string
}

const styles = {
  heading: {
    color: '#1e293b',
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '24px',
  },
  text: {
    color: '#475569',
    fontSize: '16px',
    lineHeight: '24px',
    marginBottom: '16px',
  },
  dealCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '24px',
    marginTop: '24px',
    marginBottom: '24px',
  },
  dealTitle: {
    color: '#1e293b',
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '16px',
  },
  dealInfo: {
    color: '#64748b',
    fontSize: '14px',
    lineHeight: '20px',
    marginBottom: '8px',
  },
  stageTransition: {
    backgroundColor: '#fff',
    borderRadius: '6px',
    padding: '16px',
    marginTop: '16px',
    marginBottom: '16px',
    border: '1px solid #e2e8f0',
  },
  stageLabel: {
    color: '#64748b',
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    fontWeight: '600',
    marginBottom: '8px',
  },
  stageValue: {
    color: '#1e293b',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  arrow: {
    color: '#3b82f6',
    fontSize: '24px',
    textAlign: 'center' as const,
    margin: '8px 0',
  },
  newStageHighlight: {
    backgroundColor: '#eff6ff',
    borderRadius: '6px',
    padding: '16px',
    border: '2px solid #3b82f6',
  },
  valueText: {
    color: '#059669',
    fontSize: '18px',
    fontWeight: 'bold',
    marginTop: '12px',
  },
  nextSteps: {
    backgroundColor: '#fefce8',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '24px',
    marginBottom: '24px',
    border: '1px solid #fde047',
  },
  nextStepsTitle: {
    color: '#854d0e',
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '12px',
  },
  nextStepsText: {
    color: '#713f12',
    fontSize: '14px',
    lineHeight: '20px',
    marginBottom: '8px',
  },
  ctaSection: {
    textAlign: 'center' as const,
    marginTop: '32px',
  },
  button: {
    backgroundColor: '#3b82f6',
    color: '#fff',
    padding: '14px 32px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '16px',
    display: 'inline-block',
  },
}

export function DealStageChangedEmail({
  dealTitle,
  dealValue,
  oldStage,
  newStage,
  assigneeName,
  dealUrl,
}: DealStageChangedEmailProps) {
  const formattedValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(dealValue)

  return (
    <BaseLayout preview={`${dealTitle} mudou para ${newStage}`}>
      <Heading style={styles.heading}>Negócio Atualizado! 🎯</Heading>

      <Text style={styles.text}>Olá {assigneeName},</Text>

      <Text style={styles.text}>
        O negócio <strong>{dealTitle}</strong> avançou no pipeline!
      </Text>

      <Section style={styles.dealCard}>
        <Text style={styles.dealTitle}>{dealTitle}</Text>
        <Text style={styles.valueText}>{formattedValue}</Text>

        <div style={styles.stageTransition}>
          <div>
            <Text style={styles.stageLabel}>Etapa Anterior</Text>
            <Text style={styles.stageValue}>{oldStage}</Text>
          </div>

          <Text style={styles.arrow}>↓</Text>

          <div style={styles.newStageHighlight}>
            <Text style={styles.stageLabel}>Nova Etapa</Text>
            <Text style={styles.stageValue}>{newStage}</Text>
          </div>
        </div>
      </Section>

      <Section style={styles.nextSteps}>
        <Text style={styles.nextStepsTitle}>💡 Próximas ações sugeridas:</Text>
        <Text style={styles.nextStepsText}>
          • Agende uma reunião de follow-up com o cliente
        </Text>
        <Text style={styles.nextStepsText}>
          • Atualize as notas do negócio com informações recentes
        </Text>
        <Text style={styles.nextStepsText}>
          • Configure lembretes para as próximas etapas do processo
        </Text>
        <Text style={styles.nextStepsText}>
          • Verifique se todos os documentos necessários estão em ordem
        </Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Button href={dealUrl} style={styles.button}>
          Ver Detalhes do Negócio
        </Button>
      </Section>

      <Hr style={{ margin: '32px 0', borderColor: '#e2e8f0' }} />

      <Text style={styles.text}>
        Continue trabalhando para levar este negócio até o fechamento! 💪
      </Text>
    </BaseLayout>
  )
}

export default DealStageChangedEmail
