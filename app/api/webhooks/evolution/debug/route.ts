/**
 * Debug endpoint para verificar configuração do webhook Evolution API
 * GET /api/webhooks/evolution/debug
 *
 * Acessar pelo browser para verificar se:
 * - O endpoint é acessível
 * - As variáveis de ambiente estão configuradas
 * - As conexões existem no banco
 * - A Evolution API responde corretamente
 * - Os chats são retornados
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EvolutionAPIClient } from '@/lib/evolution-api-client'

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
                lastSyncAt: true,
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

        // Buscar contatos com mensagens
        const contactsWithMessages = await prisma.contact.findMany({
            where: {
                whatsappMessages: {
                    some: {},
                },
            },
            select: {
                id: true,
                name: true,
                phone: true,
                _count: { select: { whatsappMessages: true } },
            },
            take: 10,
        })

        // ===== TESTE DIRETO NA EVOLUTION API =====
        let evolutionTest: any = { status: 'skipped' }

        if (evolutionUrl && evolutionKey && connections.length > 0) {
            const client = new EvolutionAPIClient(evolutionUrl, evolutionKey)
            const connectedInstances = connections.filter(c => c.status === 'CONNECTED')

            if (connectedInstances.length > 0) {
                const instance = connectedInstances[0]
                const instanceName = instance.instanceName

                evolutionTest = {
                    instanceName,
                    connectionState: null,
                    chatsRaw: null,
                    chatsCount: 0,
                    chatsFirstItems: [],
                    messagesTest: null,
                    errors: [] as string[],
                }

                // 1. Testar estado da conexão
                try {
                    const state = await client.getConnectionState(instanceName)
                    evolutionTest.connectionState = state
                } catch (err: any) {
                    evolutionTest.errors.push(`getConnectionState: ${err.message}`)
                }

                // 2. Testar busca de chats
                try {
                    const chats = await client.getChats(instanceName)
                    evolutionTest.chatsCount = Array.isArray(chats) ? chats.length : 'NOT_ARRAY'
                    evolutionTest.chatsRawType = typeof chats
                    evolutionTest.chatsIsArray = Array.isArray(chats)
                    // Mostrar primeiros 3 chats com todos os campos
                    if (Array.isArray(chats)) {
                        evolutionTest.chatsFirstItems = chats.slice(0, 5).map((chat: any) => ({
                            _allKeys: Object.keys(chat),
                            ...chat,
                        }))
                        // Filtrar individuais - v2 tem id=null, remoteJid está em lastMessage.key.remoteJid
                        const individual = chats.filter((c: any) => {
                            const cid = c.id || c.remoteJid || c.lastMessage?.key?.remoteJid || ''
                            return cid.includes('@s.whatsapp.net')
                        })
                        evolutionTest.individualChatsCount = individual.length
                        evolutionTest.individualChatsFirstItems = individual.slice(0, 3).map((chat: any) => ({
                            _allKeys: Object.keys(chat),
                            ...chat,
                        }))
                    } else {
                        // Se não é array, mostrar o valor bruto
                        evolutionTest.chatsRawValue = JSON.stringify(chats).substring(0, 500)
                    }
                } catch (err: any) {
                    evolutionTest.errors.push(`getChats: ${err.message}`)
                }

                // 3. Testar busca de contatos
                try {
                    const contacts = await client.getContacts(instanceName)
                    evolutionTest.contactsCount = Array.isArray(contacts) ? contacts.length : 'NOT_ARRAY'
                    if (Array.isArray(contacts)) {
                        evolutionTest.contactsFirstItems = contacts.slice(0, 3).map((c: any) => ({
                            _allKeys: Object.keys(c),
                            ...c,
                        }))
                    }
                } catch (err: any) {
                    evolutionTest.errors.push(`getContacts: ${err.message}`)
                }

                // 4. Testar fetch direto (raw HTTP) para comparar
                try {
                    const rawResponse = await fetch(`${evolutionUrl.replace(/\/$/, '')}/chat/findChats/${instanceName}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': evolutionKey,
                        },
                        body: JSON.stringify({ where: {} }),
                    })
                    evolutionTest.rawFetchStatus = rawResponse.status
                    evolutionTest.rawFetchStatusText = rawResponse.statusText
                    const rawText = await rawResponse.text()
                    evolutionTest.rawFetchBodyLength = rawText.length
                    evolutionTest.rawFetchBodyPreview = rawText.substring(0, 500)
                    try {
                        const parsed = JSON.parse(rawText)
                        evolutionTest.rawFetchIsArray = Array.isArray(parsed)
                        evolutionTest.rawFetchItemCount = Array.isArray(parsed) ? parsed.length : 'not_array'
                    } catch {
                        evolutionTest.rawFetchParseError = 'Not valid JSON'
                    }
                } catch (err: any) {
                    evolutionTest.errors.push(`rawFetch: ${err.message}`)
                }
            } else {
                evolutionTest = { status: 'no_connected_instances' }
            }
        }

        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            webhookUrl: `${appUrl || '???'}/api/webhooks/evolution`,
            config: {
                EVOLUTION_API_URL: evolutionUrl ? `${evolutionUrl.substring(0, 50)}...` : '❌ NOT SET',
                EVOLUTION_API_KEY: evolutionKey ? `${evolutionKey.substring(0, 10)}...` : '❌ NOT SET',
                NEXT_PUBLIC_APP_URL: appUrl || '❌ NOT SET',
            },
            connections: connections.map(c => ({
                ...c,
                expectedWebhookInstance: c.instanceName,
            })),
            database: {
                totalMessages: messageCount,
                recentMessages,
                contactsWithMessages,
            },
            evolutionApiTest: evolutionTest,
            tips: [
                'Verifique evolutionApiTest.errors para erros na comunicação com Evolution API',
                'evolutionApiTest.chatsCount mostra quantos chats a Evolution API retornou',
                'evolutionApiTest.individualChatsCount mostra quantos são conversas individuais (não grupos)',
                'Se rawFetchStatus é 404, o instanceName pode estar errado na Evolution API',
                'Se chatsCount é 0, a instância pode não ter histórico ainda',
                'Se errors contém getChats, o endpoint POST /chat/findChats pode não existir nesta versão',
            ],
        })
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            error: error.message,
            stack: error.stack,
        }, { status: 500 })
    }
}
