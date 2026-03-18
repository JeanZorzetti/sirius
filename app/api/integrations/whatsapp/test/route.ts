import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EvolutionClient } from '@/lib/integrations/evolution-client'
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

        // Verificar plano PRO ou BUSINESS
        if (!['PRO', 'BUSINESS'].includes(user.organization.tier)) {
            return NextResponse.json(
                { error: 'Integração WhatsApp disponível apenas no plano PRO' },
                { status: 403 }
            )
        }

        // Parse do body
        const { organizationId, baseUrl, apiKey, instanceName } = await request.json()

        // Validar ownership da organização
        if (organizationId !== user.organizationId) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        // Validar campos obrigatórios
        if (!baseUrl || !apiKey || !instanceName) {
            return NextResponse.json(
                { error: 'URL Base, API Key e Nome da Instância são obrigatórios' },
                { status: 400 }
            )
        }

        // Validar formato da URL
        try {
            new URL(baseUrl)
        } catch {
            return NextResponse.json(
                { error: 'URL Base inválida' },
                { status: 400 }
            )
        }

        // Criar cliente Evolution com credenciais fornecidas
        const client = new EvolutionClient(baseUrl, apiKey, instanceName)

        // Testar conexão
        const result = await client.testConnection()

        if (result.success) {
            logger.info({ organizationId, baseUrl, instanceName }, 'Evolution API connection test successful')
            return NextResponse.json({
                success: true,
                message: 'Conexão estabelecida com sucesso'
            })
        } else {
            logger.warn({ organizationId, baseUrl, instanceName, error: result.error }, 'Evolution API connection test failed')
            return NextResponse.json({
                success: false,
                error: result.error || 'Falha ao conectar com Evolution API'
            }, { status: 400 })
        }

    } catch (error: any) {
        logger.error({ error }, 'Error testing Evolution API connection')
        return NextResponse.json({
            success: false,
            error: 'Erro ao testar conexão. Verifique a URL, API Key e nome da instância.'
        }, { status: 500 })
    }
}
