import * as React from 'react'

interface Props {
  ticket: {
    id: string
    subject: string
    description: string
    priority: string
    category: string
    organization: { name: string }
    createdByUser: { name?: string | null; email: string }
  }
  userEmail: string
}

export default function NewTicketStaffEmail({ ticket, userEmail }: Props) {
  const ticketUrl = `https://siriuscrm.com.br/admin/support/${ticket.id}`
  const shortId = ticket.id.slice(0, 8).toUpperCase()

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 600, margin: '0 auto', color: '#1a1a1a' }}>
      <div style={{ background: '#4f46e5', padding: '24px', borderRadius: '8px 8px 0 0' }}>
        <h1 style={{ color: '#fff', margin: 0, fontSize: 20 }}>🎫 Novo Ticket de Suporte</h1>
      </div>
      <div style={{ background: '#f9f9f9', padding: 24, borderRadius: '0 0 8px 8px', border: '1px solid #e5e7eb' }}>
        <p style={{ margin: '0 0 16px' }}>
          <strong>{ticket.createdByUser.name || ticket.createdByUser.email}</strong> da organização{' '}
          <strong>{ticket.organization.name}</strong> abriu um novo ticket.
        </p>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px', background: '#fff', border: '1px solid #e5e7eb', fontWeight: 'bold', width: 120 }}>ID</td>
              <td style={{ padding: '8px', background: '#fff', border: '1px solid #e5e7eb' }}>#{shortId}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', background: '#f3f4f6', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>Assunto</td>
              <td style={{ padding: '8px', background: '#f3f4f6', border: '1px solid #e5e7eb' }}>{ticket.subject}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', background: '#fff', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>Categoria</td>
              <td style={{ padding: '8px', background: '#fff', border: '1px solid #e5e7eb' }}>{ticket.category}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', background: '#f3f4f6', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>Prioridade</td>
              <td style={{ padding: '8px', background: '#f3f4f6', border: '1px solid #e5e7eb' }}>{ticket.priority}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, padding: 16, marginBottom: 16 }}>
          <p style={{ margin: 0, fontWeight: 'bold', marginBottom: 8 }}>Descrição:</p>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
        </div>

        <a
          href={ticketUrl}
          style={{
            display: 'inline-block',
            background: '#4f46e5',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 'bold',
          }}
        >
          Ver Ticket no Admin
        </a>
      </div>
    </div>
  )
}
