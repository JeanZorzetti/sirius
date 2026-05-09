import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  price: z.number().min(0).optional(),
  stock: z.number().int().optional().nullable(),
  category: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  imageUrl: z.string().url().optional().nullable(),
})

async function getOrganizationId() {
  const session = await getSession()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { organizationId: true },
  })
  return user?.organizationId ?? null
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const organizationId = await getOrganizationId()
    if (!organizationId) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const { id } = await params
    const body = await req.json()
    const data = updateSchema.parse(body)

    const product = await (prisma as any).product.update({
      where: { id, organizationId },
      data,
    })

    return NextResponse.json(product)
  } catch (error: any) {
    console.error('[PRODUCTS_PATCH]', error?.message || error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors?.[0]?.message ?? 'Dados inválidos' }, { status: 400 })
    }
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const organizationId = await getOrganizationId()
    if (!organizationId) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const { id } = await params
    await (prisma as any).product.delete({ where: { id, organizationId } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[PRODUCTS_DELETE]', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 })
  }
}
