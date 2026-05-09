'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

type Product = {
  id: string
  name: string
  description?: string | null
  sku?: string | null
  price: number
  stock?: number | null
  category?: string | null
  isActive: boolean
}

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  onSuccess: () => void
}

export function ProductDialog({ open, onOpenChange, product, onSuccess }: ProductDialogProps) {
  const tCommon = useTranslations('common')
  const t = useTranslations('components.products')
  const isEdit = !!product

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    sku: '',
    price: '',
    stock: '',
    category: '',
    isActive: true,
  })

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description ?? '',
        sku: product.sku ?? '',
        price: String(product.price),
        stock: product.stock != null ? String(product.stock) : '',
        category: product.category ?? '',
        isActive: product.isActive,
      })
    } else {
      setForm({ name: '', description: '', sku: '', price: '', stock: '', category: '', isActive: true })
    }
  }, [product, open])

  function set(key: keyof typeof form, value: string | boolean) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    const price = parseFloat(form.price)
    if (isNaN(price) || price < 0) {
      toast.error('Informe um preço válido.')
      return
    }

    setLoading(true)
    const payload = {
      name: form.name.trim(),
      description: form.description || null,
      sku: form.sku || null,
      price,
      stock: form.stock !== '' ? parseInt(form.stock, 10) : null,
      category: form.category || null,
      isActive: form.isActive,
    }

    const url = isEdit ? `/api/products/${product!.id}` : '/api/products'
    const method = isEdit ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setLoading(false)
    if (res.ok) {
      toast.success(isEdit ? t('updateSuccess') : t('createSuccess'))
      onOpenChange(false)
      onSuccess()
    } else {
      const { error } = await res.json()
      toast.error(error || 'Erro ao salvar produto')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {isEdit ? t('editProduct') : t('addProduct')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome do Produto <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              placeholder="Ex: Software CRM Pro"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva o produto..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Price + SKU */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">Preço (R$) <span className="text-red-500">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0,00"
                  value={form.price}
                  onChange={e => set('price', e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU / Código</Label>
              <Input
                id="sku"
                placeholder="Ex: PROD-001"
                value={form.sku}
                onChange={e => set('sku', e.target.value)}
              />
            </div>
          </div>

          {/* Stock + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="stock">Estoque</Label>
              <Input
                id="stock"
                type="number"
                min={0}
                step={1}
                placeholder="Qtd. disponível"
                value={form.stock}
                onChange={e => set('stock', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                placeholder="Ex: Software, Serviço..."
                value={form.category}
                onChange={e => set('category', e.target.value)}
              />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Produto Ativo</p>
              <p className="text-xs text-muted-foreground">Produtos inativos não aparecem para a equipe de vendas.</p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={v => set('isActive', v)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon('buttons.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? tCommon('buttons.saving') : isEdit ? tCommon('buttons.save') : tCommon('buttons.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CreateProductButton({ onSuccess }: { onSuccess: () => void }) {
  const t = useTranslations('components.products')
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        {t('addProduct')}
      </Button>
      <ProductDialog open={open} onOpenChange={setOpen} onSuccess={onSuccess} />
    </>
  )
}
