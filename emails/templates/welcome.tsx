import { Text, Heading, Button, Section } from '@react-email/components'
import { BaseLayout } from '../layouts/base'

interface WelcomeEmailProps {
  userName: string
  organizationName: string
  dashboardUrl?: string
}

export function WelcomeEmail({
  userName,
  organizationName,
  dashboardUrl = 'https://sirius.roilabs.com.br/dashboard',
}: WelcomeEmailProps) {
  return (
    <BaseLayout preview={`Bem-vindo ao Sirius CRM, ${userName}!`}>
      <Heading style={styles.heading}>Bem-vindo ao Sirius CRM! 🎉</Heading>

      <Text style={styles.text}>Olá {userName},</Text>

      <Text style={styles.text}>
        Ficamos muito felizes em ter você e a{' '}
        <strong>{organizationName}</strong> como parte da família Sirius!
      </Text>

      <Text style={styles.text}>
        Você agora tem acesso ao CRM mais intuitivo do mercado brasileiro.
        Aqui estão seus próximos passos:
      </Text>

      <Section style={styles.steps}>
        <Text style={styles.step}>
          <strong>1. Crie seu primeiro negócio</strong>
          <br />
          Comece adicionando suas oportunidades ao pipeline visual
        </Text>

        <Text style={styles.step}>
          <strong>2. Adicione seus contatos</strong>
          <br />
          Importe ou crie manualmente os contatos dos seus clientes
        </Text>

        <Text style={styles.step}>
          <strong>3. Convide sua equipe</strong>
          <br />
          Trabalhe em colaboração com todo o time de vendas
        </Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Button href={dashboardUrl} style={styles.button}>
          Acessar meu Dashboard
        </Button>
      </Section>

      <Text style={styles.tip}>
        💡 <strong>Dica:</strong> No plano Gratuito você tem até 10 negócios.
        Faça upgrade para Pro e tenha acesso ilimitado!
      </Text>

      <Text style={styles.text}>
        Se tiver qualquer dúvida, estamos aqui para ajudar.
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
  text: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#404040',
    margin: '16px 0',
  },
  steps: {
    margin: '24px 0',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
  },
  step: {
    fontSize: '15px',
    lineHeight: '22px',
    color: '#404040',
    margin: '12px 0',
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
  tip: {
    fontSize: '14px',
    lineHeight: '20px',
    color: '#666666',
    padding: '12px 16px',
    backgroundColor: '#fef3c7',
    borderLeft: '3px solid #f59e0b',
    borderRadius: '4px',
    margin: '24px 0',
  },
  signature: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#404040',
    margin: '32px 0 0',
  },
}

export default WelcomeEmail
