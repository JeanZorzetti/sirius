import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProductsClient } from '@/components/products/products-client'
import { Package } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export const metadata = {
  title: 'Produtos - CRM',
}

export const dynamic = 'force-dynamic'

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard' })
  const session = await getSession()
  if (!session?.user?.email) {
    return <div>{t('errors.unauthorized')}</div>
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { organizationId: true },
  })

  if (!user?.organizationId) {
    return <div>{t('errors.userNoOrg')}</div>
  }

  const rawProducts = await (prisma as any).product.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: 'desc' },
  })

  // Serialize Decimal to number for client component
  const products = rawProducts.map((p: any) => ({
    ...p,
    price: Number(p.price),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground/90">Produtos</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie o catálogo de produtos e serviços da sua equipe de vendas.
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total de Produtos', value: products.length },
          { label: 'Produtos Ativos', value: products.filter((p: any) => p.isActive).length },
          {
            label: 'Valor Médio',
            value: products.length
              ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                  .format(products.reduce((s: number, p: any) => s + p.price, 0) / products.length)
              : 'R$ 0,00',
          },
          {
            label: 'Categorias',
            value: new Set(products.map((p: any) => p.category).filter(Boolean)).size,
          },
        ].map(stat => (
          <div
            key={stat.label}
            className="rounded-xl border border-border/50 bg-muted/30 px-4 py-3 backdrop-blur-sm"
          >
            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-foreground/90">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main content */}
      <ProductsClient initialProducts={products} />
    </div>
  )
}
