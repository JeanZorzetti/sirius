import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { seedDemoData } from '@/lib/seed-demo-data'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const organizationId = session.user.organizationId

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 400 }
      )
    }

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
