import logger from '@/lib/logger'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { triggerAgentsForContactCreated } from '@/lib/agaas-agent-trigger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, phone, email } = body

        if (!name) {
            return NextResponse.json(
                { error: 'Nome é obrigatório' },
                { status: 400 }
            )
        }

        // CRITICAL FIX: Get authenticated user from session
        const session = await getSession()
        if (!session || !session.user || !session.user.email) {
            return await apiError(ERR.UNAUTHORIZED, 401)
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { organizationId: true }
        })

        if (!user?.organizationId) {
            return await apiError(ERR.ORG_NOT_FOUND, 404)
        }

        const contact = await prisma.contact.create({
            data: {
                name,
                phone: phone || null,
                email: email || null,
                organizationId: user.organizationId
            }
        })

        triggerAgentsForContactCreated({
            organizationId: user.organizationId,
            contactId: contact.id,
            contactName: name,
            contactPhone: phone || undefined,
            contactEmail: email || undefined,
        }).catch(err => logger.error({ err }, 'ContactEnricher trigger failed'))

        return NextResponse.json(contact)
    } catch (error) {
        logger.error({ err: error }, 'Error creating contact')
        return await apiError(ERR.INTERNAL_ERROR, 500)
    }
}
