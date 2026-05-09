import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function POST(request: Request) {
    try {
        // Authenticate user
        const session = await getSession()
        if (!session || !session.user || !session.user.email) {
            return await apiError(ERR.UNAUTHORIZED, 401)
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { organization: true }
        })

        if (!user || !user.organization) {
            return await apiError(ERR.USER_NOT_FOUND, 404)
        }

        // Check PRO or BUSINESS plan requirement
        if (!['PRO', 'BUSINESS'].includes(user.organization.tier)) {
            return NextResponse.json(
                { error: 'Integração N8N disponível apenas no plano PRO' },
                { status: 403 }
            )
        }

        // Parse request body
        const { organizationId, enabled, baseUrl, apiKey, webhookUrl } = await request.json()

        // Validate organization ownership
        if (organizationId !== user.organizationId) {
            return await apiError(ERR.FORBIDDEN, 403)
        }

        // Validate required fields if enabling
        if (enabled && (!baseUrl || !apiKey)) {
            return NextResponse.json(
                { error: 'URL Base e API Key são obrigatórios quando N8N está ativado' },
                { status: 400 }
            )
        }

        // Validate URL formats
        if (baseUrl) {
            try {
                new URL(baseUrl)
            } catch {
                return NextResponse.json(
                    { error: 'URL Base inválida' },
                    { status: 400 }
                )
            }
        }

        if (webhookUrl) {
            try {
                new URL(webhookUrl)
            } catch {
                return NextResponse.json(
                    { error: 'Webhook URL inválida' },
                    { status: 400 }
                )
            }
        }

        // Prepare update data
        const updateData: any = {
            n8nEnabled: enabled,
            n8nBaseUrl: baseUrl || null,
            n8nWebhookUrl: webhookUrl || null
        }

        // Encrypt and update API key only if provided
        if (apiKey) {
            updateData.n8nApiKey = encrypt(apiKey)
        }

        // Update organization
        await prisma.organization.update({
            where: { id: organizationId },
            data: updateData
        })

        // Log activity
        logger.info({
            organizationId,
            enabled,
            baseUrl,
            webhookUrl: !!webhookUrl
        }, 'N8N settings updated')

        return NextResponse.json({ success: true })

    } catch (error: any) {
        logger.error({ error }, 'Error updating N8N settings')
        return await apiError(ERR.INTERNAL_ERROR, 500)
    }
}
