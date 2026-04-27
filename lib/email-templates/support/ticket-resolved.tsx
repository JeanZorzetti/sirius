import * as React from 'react'

interface Props {
  ticket: { id: string; subject: string }
  staffName: string
}

export default function TicketResolvedEmail({ ticket, staffName }: Props) {
  const ticketUrl = `https://siriuscrm.com.br/dashboard/support/${ticket.id}`

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 600, margin: '0 auto', color: '#1a1a1a' }}>
      <div style={{ background: '#16a34a', padding: '24px', borderRadius: '8px 8px 0 0' }}>
        <h1 style={{ color: '#fff', margin: 0, fontSize: 20 }}>✅ Ticket Resolvido</h1>
      </div>
      <div style={{ background: '#f9f9f9', padding: 24, borderRadius: '0 0 8px 8px', border: '1px solid #e5e7eb' }}>
        <p style={{ margin: '0 0 16px' }}>
          Seu ticket <strong>"{ticket.subject}"</strong> foi marcado como resolvido por{' '}
          <strong>{staffName}</strong>.
        </p>

        <p style={{ margin: '0 0 16px', color: '#374151' }}>
          Se o problema persistir ou você tiver mais dúvidas, pode reabrir o ticket ou criar um novo
          diretamente no portal de suporte.
        </p>

        <a
          href={ticketUrl}
          style={{
            display: 'inline-block',
            background: '#16a34a',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 'bold',
            marginRight: 12,
          }}
        >
          Ver Ticket
        </a>

        <p style={{ margin: '16px 0 0', fontSize: 12, color: '#9ca3af' }}>
          Obrigado por usar o Sirius CRM. Estamos sempre aqui para ajudar!
        </p>
      </div>
    </div>
  )
}
