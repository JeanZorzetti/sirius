/**
 * Debug endpoint para verificar configuração do webhook Evolution API
 * GET /api/webhooks/evolution/debug
 *
 * Acessar pelo browser para verificar se:
 * - O endpoint é acessível
 * - As variáveis de ambiente estão configuradas
 * - As conexões existem no banco
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const evolutionUrl = process.env.EVOLUTION_API_URL
        const evolutionKey = process.env.EVOLUTION_API_KEY
        const appUrl = process.env.NEXT_PUBLIC_APP_URL

        // Buscar todas as conexões
        const connections = await prisma.whatsAppConnection.findMany({
            select: {
                id: true,
                instanceName: true,
                status: true,
                phoneNumber: true,
                connectedAt: true,
                organizationId: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        })

        // Buscar contagem de mensagens
        const messageCount = await prisma.whatsAppMessage.count()

        // Buscar últimas 5 mensagens
        const recentMessages = await prisma.whatsAppMessage.findMany({
            orderBy: { sentAt: 'desc' },
            take: 5,
            select: {
                id: true,
                direction: true,
                text: true,
                remoteJid: true,
                sentAt: true,
                contactId: true,
                organizationId: true,
            },
        })

        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            webhookUrl: `${appUrl || '???'}/api/webhooks/evolution`,
            config: {
                EVOLUTION_API_URL: evolutionUrl ? `${evolutionUrl.substring(0, 30)}...` : '❌ NOT SET',
                EVOLUTION_API_KEY: evolutionKey ? `${evolutionKey.substring(0, 10)}...` : '❌ NOT SET',
                NEXT_PUBLIC_APP_URL: appUrl || '❌ NOT SET',
            },
            connections: connections.map(c => ({
                ...c,
                expectedWebhookInstance: c.instanceName,
            })),
            messages: {
                total: messageCount,
                recent: recentMessages,
            },
            tips: [
                'Se connections está vazio, crie uma conexão via Chat Center',
                'Se messages.total é 0, o webhook não está recebendo mensagens',
                'Verifique se EVOLUTION_API_KEY aqui bate com a API key da Evolution API',
                'O instanceName na connection DEVE bater com o campo "instance" que Evolution envia no webhook',
                'Envie uma mensagem WhatsApp para o número conectado e veja se messages.total aumenta',
            ],
        })
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            error: error.message,
        }, { status: 500 })
    }
}
