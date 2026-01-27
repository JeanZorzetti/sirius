import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { seedDemoData } from '@/lib/seed-demo-data'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user from database to get id and organizationId
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        organizationId: true
      }
    })

    if (!user || !user.organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 400 }
      )
    }

    const userId = user.id
    const organizationId = user.organizationId

    // Seed demo data
    const result = await seedDemoData(userId, organizationId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to seed demo data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Demo data loaded successfully',
      data: result.data
    })
  } catch (error) {
    console.error('Error in seed-demo endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
