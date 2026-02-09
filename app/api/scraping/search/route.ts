import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { searchGoogleMaps, isOutscraperConfigured } from '@/lib/scraping/outscraper-client'
import logger from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    if (!isOutscraperConfigured()) {
      return NextResponse.json(
        { error: 'Scraping service not configured' },
        { status: 503 }
      )
    }

    const { query, limit = 50 } = await req.json()

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Check credits
    const credits = await prisma.scrapingCredit.findUnique({
      where: { organizationId: user.organizationId },
    })

    const availableCredits = credits?.balance || 0

    if (availableCredits < limit) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          available: availableCredits,
          required: limit,
        },
        { status: 402 }
      )
    }
    
    // Create job
    const job = await prisma.scrapingJob.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        provider: 'OUTSCRAPER',
        source: 'GOOGLE_MAPS',
        query,
        filters: { limit },
        status: 'PENDING',
      },
    })

    // Start search
    const outscraperJob = await searchGoogleMaps({ query, limit })

    // Update job
    await prisma.scrapingJob.update({
      where: { id: job.id },
      data: {
        status: outscraperJob.status === 'completed' ? 'COMPLETED' : 'RUNNING',
        startedAt: new Date(),
      },
    })

    // If completed immediately
    if (outscraperJob.status === 'completed' && outscraperJob.results) {
      const leads = await processLeads(
        outscraperJob.results,
        user.organizationId
      )

      // Deduct credits
      await prisma.scrapingCredit.update({
        where: { organizationId: user.organizationId },
        data: {
          balance: { decrement: leads.length },
          usedThisMonth: { increment: leads.length },
        },
      })

      await prisma.scrapingJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          resultsCount: leads.length,
          creditsUsed: leads.length,
          completedAt: new Date(),
        },
      })

      return NextResponse.json({
        jobId: job.id,
        status: 'COMPLETED',
        leadsFound: leads.length,
        leads,
      })
    }

    return NextResponse.json({
      jobId: job.id,
      status: 'RUNNING',
      message: 'Search started',
    })

  } catch (error: any) {
    logger.error({ error: error.message }, 'Scraping search error')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processLeads(results: any[], organizationId: string) {
  const leads = []

  for (const result of results) {
    try {
      if (!result.phone) continue

      // Check duplicates
      const existing = await prisma.contact.findFirst({
        where: {
          organizationId,
          OR: [
            { phone: result.phone },
            { name: { equals: result.name, mode: 'insensitive' } },
          ],
        },
      })

      if (existing) continue

      // Create contact
      const contact = await prisma.contact.create({
        data: {
          organizationId,
          name: result.name,
          phone: result.phone,
          email: result.email,
          company: result.name,
        },
      })

      leads.push(contact)
    } catch (error) {
      logger.error({ error, result }, 'Error processing lead')
    }
  }

  return leads
}
