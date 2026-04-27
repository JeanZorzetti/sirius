import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { render } from '@react-email/render'
import { WhatsAppMigrationEmail } from '@/emails/templates/whatsapp-migration'
import React from 'react'

const ADMIN_EMAIL = 'jeanzorzetti@gmail.com'

export async function GET() {
  const session = await getSession()
  if (session?.user?.email !== ADMIN_EMAIL) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const html = await render(
    React.createElement(WhatsAppMigrationEmail, {
      userName: 'João Silva',
      organizationName: 'Empresa Exemplo Ltda',
    })
  )

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
