/**
 * API Route: /api/whatsapp/debug/groups
 * 
 * Endpoint para debug - retorna os grupos diretamente da Evolution API
 * para verificar o formato da resposta
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOrgEvolutionClient } from '@/lib/evolution-api-client'
import logger from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Authentication
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // 2. Get user with organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 404 }
      )
    }

    // 3. Get connection
    const connection = await prisma.whatsAppConnection.findFirst({
      where: {
        organizationId: user.organizationId,
        status: 'CONNECTED',
      },
    })

    if (!connection) {
      return NextResponse.json(
        { error: 'No active connection found' },
        { status: 404 }
      )
    }

    // 4. Get Evolution API client
    const evolutionClient = await getOrgEvolutionClient(user.organizationId)
    if (!evolutionClient) {
      return NextResponse.json(
        { error: 'Evolution API não está configurada.' },
        { status: 400 }
      )
    }

    // 5. Fetch groups
    let groups: any[] = []
    let rawResponse: any = null
    try {
      groups = await evolutionClient.getGroups(connection.instanceName)
      rawResponse = groups
      
      logger.info({
        instanceName: connection.instanceName,
        groupsCount: groups?.length || 0,
        firstGroup: groups?.[0] ? {
          id: groups[0].id,
          subject: groups[0].subject,
          allKeys: Object.keys(groups[0]),
          fullObject: JSON.stringify(groups[0]).substring(0, 500)
        } : null
      }, 'Debug: Fetched groups from Evolution API')
    } catch (err: any) {
      logger.error({ error: err.message, stack: err.stack }, 'Debug: Failed to fetch groups')
      return NextResponse.json({
        error: 'Failed to fetch groups',
        details: err.message,
        instanceName: connection.instanceName,
      }, { status: 500 })
    }

    // 6. Process groups like the sync does
    const processedGroups = groups.map((g: any) => ({
      id: g.id || g.groupJid,
      subject: g.subject,
      name: g.name,
      groupName: g.groupName,
      description: g.description,
      allKeys: Object.keys(g),
    }))

    return NextResponse.json({
      success: true,
      instanceName: connection.instanceName,
      groupsCount: groups.length,
      groups: processedGroups.slice(0, 10), // Primeiros 10 grupos
      rawSample: rawResponse?.[0] || null, // Grupo raw completo
    })

  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack }, 'Debug: Error in groups debug endpoint')
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}
