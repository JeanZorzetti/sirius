'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Zap, MessageSquare, Check } from 'lucide-react'

interface Addon {
  id: string
  type: string
  name: string
  quantity: number
  status: string
  purchasedAt: string
}

const ADDON_PRODUCTS = [
  {
    id: 'scraping_100',
    name: '+100 Leads',
    description: 'Pacote de 100 créditos para prospecção',
    price: 29.90,
    icon: Zap,
    color: 'text-yellow-500',
    features: ['100 leads no Google Maps', 'Nunca expira', 'Adicionado imediatamente'],
  },
  {
    id: 'scraping_500',
    name: '+500 Leads',
    description: 'Pacote de 500 créditos para prospecção',
    price: 99.90,
    icon: Zap,
    color: 'text-yellow-500',
    popular: true,
    features: ['500 leads no Google Maps', 'Economia de 33%', 'Nunca expira'],
  },
  {
    id: 'whatsapp_extra',
    name: 'WhatsApp Extra',
    description: 'Instância adicional do WhatsApp',
    price: 29.90,
    recurring: true,
    icon: MessageSquare,
    color: 'text-green-500',
    features: ['1 instância extra', 'Mensalidade recorrente', 'Conecte mais números'],
  },
]

export default function AddonsPage() {
  const [activeAddons, setActiveAddons] = useState<Addon[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchAddons()
  }, [])

  const fetchAddons = async () => {
    try {
      const res = await fetch('/api/addons')
      if (res.ok) {
        setActiveAddons(await res.json())
      }
    } catch (error) {
      console.error('Error fetching addons:', error)
    } finally {
      setLoading(false)
    }
  }

  const purchaseAddon = async (addonId: string) => {
    setProcessing(addonId)
    try {
      const res = await fetch('/api/addons/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addonId }),
      })

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else if (data.success) {
        toast.success('Add-on adquirido!')
        fetchAddons()
      } else {
        toast.error(data.error || 'Erro ao processar')
      }
    } catch (error) {
      toast.error('Erro ao processar compra')
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add-ons</h1>
        <p className="text-muted-foreground">
          Amplie seu plano com créditos extras e recursos adicionais
        </p>
      </div>

      {/* Add-ons Ativos */}
      {activeAddons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Seus Add-ons Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeAddons.map((addon) => (
                <div
                  key={addon.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{addon.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {addon.quantity} {addon.type.includes('SCRAPING') ? 'créditos' : 'instância'}
                      {' · '}
                      {new Date(addon.purchasedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Badge variant="secondary">{addon.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Produtos Disponíveis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ADDON_PRODUCTS.map((product) => (
          <Card key={product.id} className={product.popular ? 'border-primary' : ''}>
            {product.popular && (
              <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                Mais Popular
              </Badge>
            )}
            <CardHeader>
              <div className={`${product.color} mb-2`}>
                <product.icon className="h-8 w-8" />
              </div>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">
                  R$ {product.price.toFixed(2)}
                </span>
                {product.recurring && (
                  <span className="text-muted-foreground">/mês</span>
                )}
              </div>

              <ul className="space-y-2">
                {product.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                onClick={() => purchaseAddon(product.id)}
                disabled={processing === product.id}
              >
                {processing === product.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Comprar'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info */}
      <Card className="bg-muted">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Nota:</strong> Os créditos de prospecção não expiram e são adicionados 
            imediatamente após o pagamento. As instâncias extras do WhatsApp são cobradas 
            mensalmente.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
