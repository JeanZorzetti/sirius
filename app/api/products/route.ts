import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  price: z.number().min(0, 'Preço inválido'),
  stock: z.number().int().optional().nullable(),
  category: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
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

export async function GET() {
  try {
    const organizationId = await getOrganizationId()
    if (!organizationId) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const products = await (prisma as any).product.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(products)
  } catch (error: any) {
    console.error('[PRODUCTS_GET]', error?.message || error)
    return await apiError(ERR.FAILED_FETCH, 500)
  }
}

export async function POST(req: Request) {
  try {
    const organizationId = await getOrganizationId()
    if (!organizationId) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const body = await req.json()
    const data = productSchema.parse(body)

    const product = await (prisma as any).product.create({
      data: {
        name: data.name,
        description: data.description || null,
        sku: data.sku || null,
        price: data.price,
        stock: data.stock ?? null,
        category: data.category || null,
        isActive: data.isActive,
        organizationId,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    console.error('[PRODUCTS_POST]', error?.message || error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors?.[0]?.message ?? 'Dados inválidos' }, { status: 400 })
    }
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 })
  }
}
