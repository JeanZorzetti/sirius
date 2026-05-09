import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { scrapingRateLimit } from '@/lib/ratelimit'
import { searchLeads, isAnyProviderConfigured } from '@/lib/scraping/providers'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs' // Necessário para Crawlee

export async function POST(req: NextRequest) {
  const blocked = await scrapingRateLimit(req)
  if (blocked) return blocked

  try {
    const session = await getSession()
    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    if (!isAnyProviderConfigured()) {
      return NextResponse.json(
        { 
          error: 'Nenhum serviço de prospecção configurado',
          message: 'Configure GOOGLE_PLACES_API_KEY no painel da Vercel ou entre em contato com o suporte.',
        },
        { status: 503 }
      )
    }

    const { query, city, state, category, limit = 50 } = await req.json()

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Check credits
    const credits = await prisma.scrapingCredit.findUnique({
      where: { organizationId: user.organizationId },
    })

    const availableCredits = credits?.balance || 0

    if (availableCredits < 1) {
      return NextResponse.json(
        { 
          error: 'Créditos insuficientes',
          available: availableCredits,
          message: 'Compre mais créditos em Configurações > Add-ons',
        },
        { status: 402 }
      )
    }

    // Create job
    const job = await prisma.scrapingJob.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        provider: 'CUSTOM',
        source: 'CUSTOM',
        query,
        filters: { city, state, category, limit },
        status: 'RUNNING',
        startedAt: new Date(),
      },
    })

    // Execute search
    const result = await searchLeads({
      query,
      city,
      state,
      category,
      limit: Math.min(limit, availableCredits),
    })

    // Process leads - create contacts
    const leads = await processLeads(result.leads, user.organizationId)

    // Deduct credits
    const creditsToDeduct = Math.min(leads.length, availableCredits)
    if (creditsToDeduct > 0) {
      await prisma.scrapingCredit.update({
        where: { organizationId: user.organizationId },
        data: {
          balance: { decrement: creditsToDeduct },
          usedThisMonth: { increment: creditsToDeduct },
        },
      })
    }

    // Update job
    await prisma.scrapingJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        resultsCount: leads.length,
        creditsUsed: creditsToDeduct,
        completedAt: new Date(),
        results: leads,
      },
    })

    return NextResponse.json({
      jobId: job.id,
      status: 'COMPLETED',
      provider: result.provider,
      leadsFound: leads.length,
      creditsUsed: creditsToDeduct,
      leads,
    })

  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack }, 'Scraping search error')
    
    // Erro: Scraper não configurado
    if (error.message?.includes('SIRIUS_SCRAPER_URL not configured')) {
      return NextResponse.json(
        { 
          error: 'Scraper não configurado',
          code: 'SCRAPER_NOT_CONFIGURED',
          message: 'O servidor de scraping não está configurado. Configure a variável SIRIUS_SCRAPER_URL no Vercel.',
        },
        { status: 503 }
      )
    }
    
    // Erro: Scraper não conecta
    if (error.message?.includes('Não foi possível conectar ao scraper')) {
      return NextResponse.json(
        { 
          error: 'Scraper indisponível',
          code: 'SCRAPER_CONNECTION_ERROR',
          message: error.message,
        },
        { status: 503 }
      )
    }
    
    // Erro especial: Google Places API necessária
    if (error.message?.includes('GOOGLE_PLACES_API_REQUIRED')) {
      return NextResponse.json(
        { 
          error: 'Serviço temporariamente indisponível',
          code: 'GOOGLE_PLACES_API_REQUIRED',
          message: 'O Google bloqueou temporariamente as buscas. Para melhores resultados, configure a Google Places API (gratuito até $200/mês). Entre em contato com o suporte.',
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processLeads(leads: any[], organizationId: string) {
  const created = []

  for (const lead of leads) {
    try {
      if (!lead.phone && !lead.email) continue

      // Check duplicates by phone
      if (lead.phone) {
        const existing = await prisma.contact.findFirst({
          where: {
            organizationId,
            phone: lead.phone,
          },
        })
        if (existing) continue
      }

      // Create contact
      const contact = await prisma.contact.create({
        data: {
          organizationId,
          name: lead.name || 'Sem nome',
          phone: lead.phone,
          email: lead.email,
          company: lead.name,
        },
      })

      created.push({
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        source: lead.source,
      })
    } catch (error) {
      logger.error({ error, lead }, 'Error processing lead')
    }
  }

  return created
}
