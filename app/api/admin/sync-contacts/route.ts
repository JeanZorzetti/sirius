/**
 * Admin: POST /api/admin/sync-contacts
 *
 * 410 Gone — a sincronização de contatos dependia do gateway whatsmeow
 * (conexões QR), que foi descontinuado.
 */

import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Sincronização via gateway QR foi descontinuada (whatsmeow removido).' },
    { status: 410 }
  )
}
