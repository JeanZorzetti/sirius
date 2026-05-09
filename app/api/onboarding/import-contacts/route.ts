/**
 * ✅ FASE 15: Endpoint de importação de contatos via CSV/Excel
 *
 * POST /api/onboarding/import-contacts
 * Body: { contacts: Array<{ name, email?, phone?, company?, notes? }> }
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

interface ImportContact {
  name: string
  email?: string
  phone?: string
  company?: string
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req: request })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true },
    })

    if (!user) {
      return await apiError(ERR.USER_NOT_FOUND, 404, { req: request })
    }

    const body = await request.json()
    const contacts: ImportContact[] = body.contacts ?? []

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: 'Nenhum contato para importar' }, { status: 400 })
    }

    // Limitar a 500 contatos por import (segurança)
    const limited = contacts.slice(0, 500)

    // Buscar emails já existentes na org para evitar duplicatas
    const existingEmails = await prisma.contact.findMany({
      where: {
        organizationId: user.organizationId,
        email: { in: limited.filter(c => c.email).map(c => c.email!) },
      },
      select: { email: true },
    })

    const existingEmailSet = new Set(existingEmails.map(c => c.email?.toLowerCase()))

    const toCreate = limited.filter(c => {
      if (!c.email) return true // Sem email: sempre importar
      return !existingEmailSet.has(c.email.toLowerCase())
    })

    const skipped = limited.length - toCreate.length

    // Criar em batch
    if (toCreate.length > 0) {
      await prisma.contact.createMany({
        data: toCreate.map(c => ({
          name: c.name,
          email: c.email || null,
          phone: c.phone || null,
          company: c.company || null,
          notes: c.notes || null,
          organizationId: user.organizationId,
          userId: user.id,
        })),
        skipDuplicates: true,
      })
    }

    // Marcar onboarding como completo se ainda não estiver
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/onboarding/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') || '' },
      body: JSON.stringify({ status: 'COMPLETED' }),
    }).catch(() => {}) // não fatal

    logger.info({
      organizationId: user.organizationId,
      imported: toCreate.length,
      skipped,
    }, '[IMPORT] Contacts imported')

    return NextResponse.json({
      success: true,
      imported: toCreate.length,
      skipped,
    })
  } catch (error) {
    logger.error({ error }, '[IMPORT] Failed to import contacts')
    return await apiError(ERR.INTERNAL_ERROR, 500, { req: request })
  }
}
