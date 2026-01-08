import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'
import logger from '@/lib/logger'

export async function POST(request: Request) {
    try {
        // Autenticar usuário
        const session = await getSession()
        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { organization: true }
        })

        if (!user || !user.organization) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
        }

        // Verificar plano PRO
        if (user.organization.plan !== 'PRO') {
            return NextResponse.json(
                { error: 'Integração WhatsApp disponível apenas no plano PRO' },
                { status: 403 }
            )
        }

        // Parse do body
        const { organizationId, enabled, baseUrl, apiKey, instanceName } = await request.json()

        // Validar ownership da organização
        if (organizationId !== user.organizationId) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        // Validar campos obrigatórios quando ativado
        if (enabled && (!baseUrl || !apiKey || !instanceName)) {
            return NextResponse.json(
                { error: 'URL Base, API Key e Nome da Instância são obrigatórios quando WhatsApp está ativado' },
                { status: 400 }
            )
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
            updateData.evolutionApiKey = encrypt(apiKey)
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
            instanceName
        }, 'WhatsApp settings updated')

        return NextResponse.json({ success: true })

    } catch (error: any) {
        logger.error({ error }, 'Error updating WhatsApp settings')
        return NextResponse.json(
            { error: 'Erro ao salvar configurações' },
            { status: 500 }
        )
    }
}
