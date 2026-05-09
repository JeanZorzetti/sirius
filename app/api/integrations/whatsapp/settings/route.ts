import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function POST(request: Request) {
    try {
        // Autenticar usuário
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

        // Verificar plano STARTER, PRO ou BUSINESS
        if (!['STARTER', 'PRO', 'BUSINESS'].includes(user.organization.tier)) {
            return NextResponse.json(
                { error: 'Integração WhatsApp disponível a partir do plano Starter' },
                { status: 403 }
            )
        }

        // Parse do body
        const { organizationId, enabled, baseUrl, apiKey, instanceName } = await request.json()

        // Validar ownership da organização
        if (organizationId !== user.organizationId) {
            return await apiError(ERR.FORBIDDEN, 403)
        }

        // Validar campos obrigatórios quando ativado
        if (enabled) {
            // Check if this is a first-time setup (no existing config)
            const existingApiKey = user.organization.evolutionApiKey

            if (!baseUrl) {
                return NextResponse.json(
                    { error: 'URL Base é obrigatória quando WhatsApp está ativado' },
                    { status: 400 }
                )
            }

            if (!instanceName) {
                return NextResponse.json(
                    { error: 'Nome da Instância é obrigatório quando WhatsApp está ativado' },
                    { status: 400 }
                )
            }

            // API Key is required only if not previously configured
            if (!existingApiKey && !apiKey) {
                return NextResponse.json(
                    { error: 'API Key é obrigatória ao configurar a integração pela primeira vez' },
                    { status: 400 }
                )
            }
        }

        // Validar formato da URL
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

        // Preparar dados para atualização
        const updateData: any = {
            evolutionEnabled: enabled,
            evolutionBaseUrl: baseUrl || null,
            evolutionInstance: instanceName || null
        }

        // Criptografar e atualizar API key apenas se fornecida
        if (apiKey) {
            try {
                updateData.evolutionApiKey = encrypt(apiKey)
                logger.info({ organizationId }, 'API Key encrypted successfully')
            } catch (encryptError) {
                logger.error({ error: encryptError, organizationId }, 'Failed to encrypt API Key')
                return await apiError(ERR.ENCRYPT_API_KEY, 500)
            }
        }

        // Atualizar organização
        await prisma.organization.update({
            where: { id: organizationId },
            data: updateData
        })

        // Log da atividade
        logger.info({
            organizationId,
            enabled,
            baseUrl,
            instanceName,
            apiKeyUpdated: !!apiKey
        }, 'WhatsApp settings updated')

        return NextResponse.json({ success: true })

    } catch (error: any) {
        logger.error({ error }, 'Error updating WhatsApp settings')
        return await apiError(ERR.INTERNAL_ERROR, 500)
    }
}
