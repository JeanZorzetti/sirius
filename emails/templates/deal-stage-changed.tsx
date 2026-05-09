import {
  Button,
  Heading,
  Hr,
  Section,
  Text,
} from '@react-email/components'
import { BaseLayout } from '../layouts/base'
import emailsEn from '@/messages/en/emails.json'
import emailsPtBr from '@/messages/pt-BR/emails.json'

type Locale = 'pt-BR' | 'en'

interface DealStageChangedEmailProps {
  dealTitle: string
  dealValue: number
  oldStage: string
  newStage: string
  assigneeName: string
  dealUrl: string
  locale?: Locale
}

export function DealStageChangedEmail({
  dealTitle,
  dealValue,
  oldStage,
  newStage,
  assigneeName,
  dealUrl,
  locale = 'pt-BR',
}: DealStageChangedEmailProps) {
  const s = locale === 'en' ? emailsEn.emails.dealStageChanged : emailsPtBr.emails.dealStageChanged

  const formattedValue = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'pt-BR', {
    style: 'currency',
    currency: locale === 'en' ? 'USD' : 'BRL',
  }).format(dealValue)

  const preview = s.preview.replace('{dealTitle}', dealTitle).replace('{newStage}', newStage)
  const intro = s.intro.replace('{dealTitle}', dealTitle)

  return (
    <BaseLayout preview={preview} locale={locale}>
      <Heading style={styles.heading}>{s.title}</Heading>

      <Text style={styles.text}>{locale === 'en' ? `Hi ${assigneeName},` : `Olá ${assigneeName},`}</Text>

      <Text style={styles.text}>
        <strong>{dealTitle}</strong> — {intro}
      </Text>

      <Section style={styles.dealCard}>
        <Text style={styles.dealTitle}>{dealTitle}</Text>
        <Text style={styles.valueText}>{formattedValue}</Text>

        <div style={styles.stageTransition}>
          <div>
            <Text style={styles.stageLabel}>{s.labelPreviousStage}</Text>
            <Text style={styles.stageValue}>{oldStage}</Text>
          </div>

          <Text style={styles.arrow}>&#8595;</Text>

          <div style={styles.newStageHighlight}>
            <Text style={styles.stageLabel}>{s.labelNewStage}</Text>
            <Text style={styles.stageValue}>{newStage}</Text>
          </div>
        </div>
      </Section>

      <Section style={styles.nextSteps}>
        <Text style={styles.nextStepsTitle}>{s.nextStepsTitle}</Text>
        <Text style={styles.nextStepsText}>• {s.nextStep1}</Text>
        <Text style={styles.nextStepsText}>• {s.nextStep2}</Text>
        <Text style={styles.nextStepsText}>• {s.nextStep3}</Text>
        <Text style={styles.nextStepsText}>• {s.nextStep4}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Button href={dealUrl} style={styles.button}>
          {s.cta}
        </Button>
      </Section>

      <Hr style={{ margin: '32px 0', borderColor: '#e2e8f0' }} />

      <Text style={styles.text}>{s.closing}</Text>
    </BaseLayout>
  )
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

export default DealStageChangedEmail
