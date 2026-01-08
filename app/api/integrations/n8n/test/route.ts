import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { N8NClient } from '@/lib/integrations/n8n-client'
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
    try {
        // Authenticate user
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

        // Check PRO plan requirement
        if (user.organization.plan !== 'PRO') {
            return NextResponse.json(
                { error: 'Integração N8N disponível apenas no plano PRO' },
                { status: 403 }
            )
        }

        // Parse request body
        const { organizationId, baseUrl, apiKey } = await request.json()

        // Validate organization ownership
        if (organizationId !== user.organizationId) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        // Validate required fields
        if (!baseUrl || !apiKey) {
            return NextResponse.json(
                { error: 'URL Base e API Key são obrigatórios' },
                { status: 400 }
            )
        }

        // Validate URL format
        try {
            new URL(baseUrl)
        } catch {
            return NextResponse.json(
                { error: 'URL Base inválida' },
                { status: 400 }
            )
        }

        // Create N8N client with provided credentials
        const client = new N8NClient(baseUrl, apiKey)

        // Test connection
        const result = await client.testConnection()

        if (result.success) {
            logger.info({ organizationId, baseUrl }, 'N8N connection test successful')
            return NextResponse.json({
                success: true,
                message: 'Conexão estabelecida com sucesso'
            })
        } else {
            logger.warn({ organizationId, baseUrl, error: result.error }, 'N8N connection test failed')
            return NextResponse.json({
                success: false,
                error: result.error || 'Falha ao conectar com N8N'
            }, { status: 400 })
        }

    } catch (error: any) {
        logger.error({ error }, 'Error testing N8N connection')
        return NextResponse.json({
            success: false,
            error: 'Erro ao testar conexão. Verifique a URL e a API Key.'
        }, { status: 500 })
    }
}
