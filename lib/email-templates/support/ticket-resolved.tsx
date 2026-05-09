import * as React from 'react'
import emailsEn from '@/messages/en/emails.json'
import emailsPtBr from '@/messages/pt-BR/emails.json'

type Locale = 'pt-BR' | 'en'

interface Props {
  ticket: { id: string; subject: string }
  staffName: string
  locale?: Locale
}

export default function TicketResolvedEmail({ ticket, staffName, locale = 'pt-BR' }: Props) {
  const s = locale === 'en' ? emailsEn.emails.support.ticketResolved : emailsPtBr.emails.support.ticketResolved
  const ticketUrl = `https://siriuscrm.com.br/dashboard/support/${ticket.id}`

  const intro = s.intro
    .replace('{subject}', ticket.subject)
    .replace('{staffName}', staffName)

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 600, margin: '0 auto', color: '#1a1a1a' }}>
      <div style={{ background: '#16a34a', padding: '24px', borderRadius: '8px 8px 0 0' }}>
        <h1 style={{ color: '#fff', margin: 0, fontSize: 20 }}>✅ {s.title}</h1>
      </div>
      <div style={{ background: '#f9f9f9', padding: 24, borderRadius: '0 0 8px 8px', border: '1px solid #e5e7eb' }}>
        <p style={{ margin: '0 0 16px' }}>
          {intro.split(`"${ticket.subject}"`).length > 1 ? (
            <>
              {intro.split(`"${ticket.subject}"`)[0]}
              <strong>&quot;{ticket.subject}&quot;</strong>
              {intro.split(`"${ticket.subject}"`)[1]}
            </>
          ) : (
            intro
          )}
        </p>

        <p style={{ margin: '0 0 16px', color: '#374151' }}>{s.body}</p>

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
          {s.cta}
        </a>

        <p style={{ margin: '16px 0 0', fontSize: 12, color: '#9ca3af' }}>{s.footer}</p>
      </div>
    </div>
  )
}
