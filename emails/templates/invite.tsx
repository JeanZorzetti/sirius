import { Text, Heading, Button, Section } from '@react-email/components'
import { BaseLayout } from '../layouts/base'

interface InviteEmailProps {
  inviterName: string
  organizationName: string
  inviteUrl: string
}

export function InviteEmail({
  inviterName,
  organizationName,
  inviteUrl,
}: InviteEmailProps) {
  return (
    <BaseLayout preview={`${inviterName} convidou você para o ${organizationName} no Sirius CRM`}>
      <Heading style={styles.heading}>Você foi convidado!</Heading>

      <Text style={styles.text}>Olá,</Text>

      <Text style={styles.text}>
        <strong>{inviterName}</strong> convidou você para fazer parte da equipe{' '}
        <strong>{organizationName}</strong> no Sirius CRM.
      </Text>

      <Text style={styles.text}>
        Clique no botão abaixo para criar sua conta e começar a colaborar com o time:
      </Text>

      <Section style={styles.ctaSection}>
        <Button href={inviteUrl} style={styles.button}>
          Aceitar Convite
        </Button>
      </Section>

      <Text style={styles.note}>
        Este link é válido por <strong>7 dias</strong> e pode ser usado apenas uma vez.
        Se você não esperava este convite, pode ignorar este e-mail.
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
  ctaSection: {
    textAlign: 'center' as const,
    margin: '32px 0',
  },
  button: {
    backgroundColor: '#6366f1',
    color: '#ffffff',
    padding: '12px 32px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '16px',
    display: 'inline-block',
  },
  note: {
    fontSize: '14px',
    lineHeight: '20px',
    color: '#666666',
    padding: '12px 16px',
    backgroundColor: '#f1f5f9',
    borderLeft: '3px solid #94a3b8',
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

export default InviteEmail
