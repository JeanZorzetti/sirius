import * as React from 'react'
import emailsEn from '@/messages/en/emails.json'
import emailsPtBr from '@/messages/pt-BR/emails.json'

type Locale = 'pt-BR' | 'en'

interface Props {
  ticket: { id: string; subject: string }
  message: { content: string; authorName: string }
  locale?: Locale
}

export default function NewMessageStaffEmail({ ticket, message, locale = 'pt-BR' }: Props) {
  const s = locale === 'en' ? emailsEn.emails.support.newMessageStaff : emailsPtBr.emails.support.newMessageStaff
  const ticketUrl = `https://siriuscrm.com.br/admin/support/${ticket.id}`

  const intro = s.intro
    .replace('{authorName}', message.authorName)
    .replace('{subject}', ticket.subject)

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 600, margin: '0 auto', color: '#1a1a1a' }}>
      <div style={{ background: '#dc2626', padding: '24px', borderRadius: '8px 8px 0 0' }}>
        <h1 style={{ color: '#fff', margin: 0, fontSize: 20 }}>📩 {s.title}</h1>
      </div>
      <div style={{ background: '#f9f9f9', padding: 24, borderRadius: '0 0 8px 8px', border: '1px solid #e5e7eb' }}>
        <p style={{ margin: '0 0 8px' }}>
          {intro.split(ticket.subject).map((part, i, arr) =>
            i < arr.length - 1 ? (
              <React.Fragment key={i}>
                {part}
                <strong>{ticket.subject}</strong>
              </React.Fragment>
            ) : (
              <React.Fragment key={i}>{part}</React.Fragment>
            )
          )}
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
          {s.cta}
        </a>
      </div>
    </div>
  )
}
