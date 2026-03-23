import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().min(0, 'Preço inválido'),
  stock: z.number().int().optional().nullable(),
  category: z.string().optional(),
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
  const organizationId = await getOrganizationId()
  if (!organizationId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const products = await prisma.product.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(products)
}

export async function POST(req: Request) {
  const organizationId = await getOrganizationId()
  if (!organizationId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = productSchema.parse(body)

    const product = await prisma.product.create({
      data: {
        ...data,
        price: data.price,
        organizationId,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
