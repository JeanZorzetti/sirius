import * as React from 'react'

interface Props {
  ticket: { id: string; subject: string }
  message: { content: string; authorName: string }
}

export default function NewMessageStaffEmail({ ticket, message }: Props) {
  const ticketUrl = `https://siriuscrm.com.br/admin/support/${ticket.id}`

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 600, margin: '0 auto', color: '#1a1a1a' }}>
      <div style={{ background: '#dc2626', padding: '24px', borderRadius: '8px 8px 0 0' }}>
        <h1 style={{ color: '#fff', margin: 0, fontSize: 20 }}>📩 Cliente respondeu no ticket</h1>
      </div>
      <div style={{ background: '#f9f9f9', padding: 24, borderRadius: '0 0 8px 8px', border: '1px solid #e5e7eb' }}>
        <p style={{ margin: '0 0 8px' }}>
          <strong>{message.authorName}</strong> respondeu ao ticket:{' '}
          <strong>{ticket.subject}</strong>
        </p>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, padding: 16, margin: '16px 0' }}>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message.content}</p>
        </div>

        <a
          href={ticketUrl}
          style={{
            display: 'inline-block',
            background: '#dc2626',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 'bold',
          }}
        >
          Ver no Admin
        </a>
      </div>
    </div>
  )
}
