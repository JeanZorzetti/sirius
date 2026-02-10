/**
 * Backfill Snapshots
 *
 * Popula snapshots históricos para Analytics PRO.
 * Útil para:
 * 1. Primeira configuração (gerar dados históricos)
 * 2. Corrigir gaps em snapshots
 * 3. Demonstração/testes
 *
 * Uso:
 * POST /api/analytics/backfill-snapshots
 * Body: { "days": 90 } (opcional, padrão 90)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createDailyDealSnapshot } from '@/lib/analytics-jobs'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutos

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Buscar usuário e organização
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    })

    if (!user?.organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Verificar se é plano PRO ou BUSINESS
    if (!['PRO', 'BUSINESS'].includes(user.organization.plan)) {
      return NextResponse.json(
        { error: 'Analytics PRO requires PRO plan' },
        { status: 403 }
      )
    }

    // Ler número de dias do body
    const body = await request.json().catch(() => ({}))
    const days = body.days || 90

    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Days must be between 1 and 365' },
        { status: 400 }
      )
    }

    console.log(`[BACKFILL] Starting backfill for org ${user.organization.id} (${days} days)`)

    const results = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Criar snapshots para cada dia (do mais antigo para o mais recente)
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      try {
        const snapshot = await createDailyDealSnapshot(user.organization.id, date)
        results.push({
          date: date.toISOString().split('T')[0],
          success: true,
          totalDeals: snapshot.totalDeals,
        })
      } catch (error) {
        console.error(`[BACKFILL] Error creating snapshot for ${date}:`, error)
        results.push({
          date: date.toISOString().split('T')[0],
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    console.log(`[BACKFILL] Completed: ${successful} successful, ${failed} failed`)

    return NextResponse.json({
      success: true,
      message: `Backfill completed for ${days} days`,
      stats: {
        total: days,
        successful,
        failed,
      },
      results,
    })
  } catch (error) {
    console.error('[BACKFILL] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
