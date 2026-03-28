import { Text, Heading, Button, Section } from '@react-email/components'
import { BaseLayout } from '../layouts/base'

interface UpgradeNudgeEmailProps {
  userName: string
  currentDeals: number
  maxDeals: number
  upgradeUrl?: string
}

export function UpgradeNudgeEmail({
  userName,
  currentDeals,
  maxDeals,
  upgradeUrl = 'https://sirius.roilabs.com.br/dashboard/billing',
}: UpgradeNudgeEmailProps) {
  const percentUsed = Math.round((currentDeals / maxDeals) * 100)

  return (
    <BaseLayout preview="Você está perto do limite do plano Gratuito">
      <Heading style={styles.heading}>Você está crescendo! 🚀</Heading>

      <Text style={styles.text}>Olá {userName},</Text>

      <Text style={styles.text}>
        Parabéns! Você já tem <strong>{currentDeals} negócios</strong> no seu
        pipeline.
      </Text>

      <Section style={styles.progressCard}>
        <Text style={styles.progressText}>
          {currentDeals} de {maxDeals} negócios ({percentUsed}%)
        </Text>
        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${percentUsed}%`,
            }}
          />
        </div>
        <Text style={styles.warningText}>
          ⚠️ Faltam apenas {maxDeals - currentDeals} negócios para atingir o
          limite
        </Text>
      </Section>

      <Text style={styles.text}>
        Quando você atingir o limite de <strong>{maxDeals} negócios</strong>,
        não poderá criar novos até fazer upgrade para o plano Pro.
      </Text>

      <Heading style={styles.subheading}>Por que fazer upgrade agora?</Heading>

      <Section style={styles.benefits}>
        <Text style={styles.benefit}>✅ Negócios ilimitados</Text>
        <Text style={styles.benefit}>✅ Múltiplos pipelines personalizados</Text>
        <Text style={styles.benefit}>✅ Analytics avançado</Text>
        <Text style={styles.benefit}>✅ Automações de email</Text>
        <Text style={styles.benefit}>✅ Suporte prioritário</Text>
      </Section>

      <Section style={styles.pricingCard}>
        <Text style={styles.pricingText}>
          <span style={styles.price}>R$ 67</span>
          <span style={styles.period}>/mês</span>
        </Text>
        <Text style={styles.pricingSubtext}>
          Sem taxas de setup • Cancele quando quiser
        </Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Button href={upgradeUrl} style={styles.button}>
          Fazer Upgrade Agora
        </Button>
      </Section>

      <Text style={styles.footnote}>
        Continue usando o plano Gratuito pelo tempo que quiser. Você pode fazer
        upgrade a qualquer momento! 😊
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
  heading: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    margin: '0 0 24px',
  },
  subheading: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    margin: '32px 0 16px',
  },
  text: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#404040',
    margin: '16px 0',
  },
  progressCard: {
    margin: '24px 0',
    padding: '20px',
    backgroundColor: '#fef3c7',
    borderRadius: '8px',
  },
  progressText: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center' as const,
    margin: '0 0 12px',
  },
  progressBar: {
    height: '12px',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    overflow: 'hidden',
    margin: '12px 0',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    transition: 'width 0.3s ease',
  },
  warningText: {
    fontSize: '14px',
    color: '#92400e',
    textAlign: 'center' as const,
    margin: '12px 0 0',
  },
  benefits: {
    margin: '16px 0',
    padding: '16px',
    backgroundColor: '#f0f9ff',
    borderRadius: '6px',
  },
  benefit: {
    fontSize: '15px',
    lineHeight: '28px',
    color: '#1e40af',
    margin: '4px 0',
  },
  pricingCard: {
    textAlign: 'center' as const,
    margin: '32px 0',
    padding: '24px',
    backgroundColor: '#f8fafc',
    border: '2px solid #3b82f6',
    borderRadius: '8px',
  },
  pricingText: {
    margin: '0 0 8px',
  },
  price: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  period: {
    fontSize: '18px',
    color: '#666666',
  },
  pricingSubtext: {
    fontSize: '14px',
    color: '#666666',
    margin: '0',
  },
  ctaSection: {
    textAlign: 'center' as const,
    margin: '32px 0',
  },
  button: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    padding: '14px 40px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '18px',
    display: 'inline-block',
  },
  footnote: {
    fontSize: '14px',
    lineHeight: '20px',
    color: '#666666',
    fontStyle: 'italic',
    textAlign: 'center' as const,
    margin: '24px 0',
  },
  signature: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#404040',
    margin: '32px 0 0',
  },
}

export default UpgradeNudgeEmail
