import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/admin/add-closings-permission?token=sirius-migrate-2024
// Adds canViewDealClosings column to User table if it doesn't exist
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token || token !== 'sirius-migrate-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await prisma.$executeRaw`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "canViewDealClosings" BOOLEAN NOT NULL DEFAULT true
    `
    return NextResponse.json({ success: true, message: 'Column canViewDealClosings added (or already existed)' })
  } catch (error) {
    console.error('[add-closings-permission]', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
