import * as React from 'react'
import emailsEn from '@/messages/en/emails.json'
import emailsPtBr from '@/messages/pt-BR/emails.json'

type Locale = 'pt-BR' | 'en'

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
  locale?: Locale
}

export default function NewTicketStaffEmail({ ticket, userEmail, locale = 'pt-BR' }: Props) {
  const s = locale === 'en' ? emailsEn.emails.support.newTicketStaff : emailsPtBr.emails.support.newTicketStaff
  const ticketUrl = `https://siriuscrm.com.br/admin/support/${ticket.id}`
  const shortId = ticket.id.slice(0, 8).toUpperCase()

  const userName = ticket.createdByUser.name || ticket.createdByUser.email
  const intro = s.intro
    .replace('{userName}', userName)
    .replace('{organizationName}', ticket.organization.name)

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 600, margin: '0 auto', color: '#1a1a1a' }}>
      <div style={{ background: '#4f46e5', padding: '24px', borderRadius: '8px 8px 0 0' }}>
        <h1 style={{ color: '#fff', margin: 0, fontSize: 20 }}>🎫 {s.title}</h1>
      </div>
      <div style={{ background: '#f9f9f9', padding: 24, borderRadius: '0 0 8px 8px', border: '1px solid #e5e7eb' }}>
        <p style={{ margin: '0 0 16px' }}>
          {intro.split(ticket.organization.name).map((part, i, arr) =>
            i < arr.length - 1 ? (
              <React.Fragment key={i}>
                {part}
                <strong>{ticket.organization.name}</strong>
              </React.Fragment>
            ) : (
              <React.Fragment key={i}>{part}</React.Fragment>
            )
          )}
        </p>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px', background: '#fff', border: '1px solid #e5e7eb', fontWeight: 'bold', width: 120 }}>{s.labelId}</td>
              <td style={{ padding: '8px', background: '#fff', border: '1px solid #e5e7eb' }}>#{shortId}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', background: '#f3f4f6', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>{s.labelSubject}</td>
              <td style={{ padding: '8px', background: '#f3f4f6', border: '1px solid #e5e7eb' }}>{ticket.subject}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', background: '#fff', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>{s.labelCategory}</td>
              <td style={{ padding: '8px', background: '#fff', border: '1px solid #e5e7eb' }}>{ticket.category}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', background: '#f3f4f6', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>{s.labelPriority}</td>
              <td style={{ padding: '8px', background: '#f3f4f6', border: '1px solid #e5e7eb' }}>{ticket.priority}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, padding: 16, marginBottom: 16 }}>
          <p style={{ margin: 0, fontWeight: 'bold', marginBottom: 8 }}>{s.labelDescription}</p>
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
          {s.cta}
        </a>
      </div>
    </div>
  )
}
