'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, Pencil, Trash2, Search, CheckCircle2, XCircle, MoreHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CreateProductButton, ProductDialog } from './product-dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

type Product = {
  id: string
  name: string
  description?: string | null
  sku?: string | null
  price: number
  stock?: number | null
  category?: string | null
  isActive: boolean
  createdAt: string
}

export function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const tCommon = useTranslations('common')
  const t = useTranslations('components.products')
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [query, setQuery] = useState('')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const res = await fetch('/api/products')
    if (res.ok) setProducts(await res.json())
  }, [])

  const handleDelete = async () => {
    if (!deletingId) return
    const res = await fetch(`/api/products/${deletingId}`, { method: 'DELETE' })
    if (res.ok) {
      setProducts(prev => prev.filter(p => p.id !== deletingId))
      toast.success(t('deleteSuccess'))
    } else {
      toast.error(tCommon('toasts.failedDelete'))
    }
    setDeletingId(null)
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.sku?.toLowerCase().includes(query.toLowerCase()) ||
    p.category?.toLowerCase().includes(query.toLowerCase())
  )

  const formatPrice = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, SKU ou categoria..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <CreateProductButton onSuccess={refresh} />
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-24 rounded-2xl border-2 border-dashed border-border/50 text-center">
          <div className="rounded-full bg-muted p-5">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground/80">Nenhum produto encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              {query ? 'Tente buscar por outro termo.' : 'Crie seu primeiro produto para começar.'}
            </p>
          </div>
          {!query && <CreateProductButton onSuccess={refresh} />}
        </div>
      )}

      {/* Products Grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className={cn(
                  'group relative flex flex-col rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300',
                  'hover:shadow-md hover:border-primary/30',
                  'dark:bg-zinc-900/80 dark:border-white/10 dark:hover:bg-zinc-800/90',
                  !product.isActive && 'opacity-60'
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground/90 truncate">{product.name}</p>
                    {product.sku && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{product.sku}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingProduct(product)}>
                        <Pencil className="w-3.5 h-3.5 mr-2" /> {tCommon('buttons.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-500 focus:text-red-500"
                        onClick={() => setDeletingId(product.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> {tCommon('buttons.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Body */}
                {product.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
                    {product.description}
                  </p>
                )}

                {/* Price */}
                <div className="mt-auto space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary tracking-tight">
                      {formatPrice(Number(product.price))}
                    </span>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {product.category && (
                      <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full font-medium">
                        {product.category}
                      </Badge>
                    )}
                    {product.stock != null && (
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full font-medium gap-1">
                        <Package className="h-2.5 w-2.5" />
                        {product.stock} em estoque
                      </Badge>
                    )}
                  </div>

                  {/* Active indicator */}
                  <div className="flex items-center gap-1.5">
                    {product.isActive ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className="text-[11px] text-muted-foreground">
                      {product.isActive ? t('active') : t('inactive')}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Edit dialog */}
      <ProductDialog
        open={!!editingProduct}
        onOpenChange={open => !open && setEditingProduct(null)}
        product={editingProduct}
        onSuccess={refresh}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={open => !open && setDeletingId(null)}
        title={t('deleteProduct')}
        description={t('deleteConfirm')}
        confirmLabel={tCommon('buttons.delete')}
        onConfirm={handleDelete}
      />
    </div>
  )
}
