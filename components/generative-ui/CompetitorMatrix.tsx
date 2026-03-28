'use client'

/**
 * CompetitorMatrix - Sirius vs Competitors Comparison
 *
 * Displays comparison matrix with:
 * - Feature comparison
 * - Pricing comparison
 * - Highlight of Sirius advantages
 */

import { motion } from 'framer-motion'
import type { CompetitorMatrixProps } from '@/lib/generative-ui/schemas'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Check,
  X,
  Minus,
  Trophy,
  Sparkles,
  Crown
} from 'lucide-react'

interface CompetitorMatrixComponentProps extends CompetitorMatrixProps {
  onInteraction?: (action: string, component: string, data: Record<string, unknown>) => void
}

// Competitor data
const COMPETITORS = {
  pipedrive: { name: 'Pipedrive', price: 'US$ 14.90', color: 'bg-green-100 dark:bg-green-950/30' },
  rdstation: { name: 'RD Station CRM', price: 'R$ 69', color: 'bg-blue-100 dark:bg-blue-950/30' },
  hubspot: { name: 'HubSpot', price: 'US$ 45', color: 'bg-orange-100 dark:bg-orange-950/30' },
  salesforce: { name: 'Salesforce', price: 'US$ 25', color: 'bg-blue-100 dark:bg-blue-950/30' },
  zoho: { name: 'Zoho CRM', price: 'US$ 14', color: 'bg-red-100 dark:bg-red-950/30' },
}

// Feature comparison data
const FEATURES = [
  {
    id: 'ai_assistant',
    name: 'Assistente IA Nativo',
    sirius: 'full',
    pipedrive: 'partial',
    rdstation: 'none',
    hubspot: 'partial',
    salesforce: 'partial',
    zoho: 'none',
  },
  {
    id: 'spin_methodology',
    name: 'Metodologia SPIN',
    sirius: 'full',
    pipedrive: 'none',
    rdstation: 'none',
    hubspot: 'none',
    salesforce: 'none',
    zoho: 'none',
  },
  {
    id: 'brazilian_support',
    name: 'Suporte BR Nativo',
    sirius: 'full',
    pipedrive: 'partial',
    rdstation: 'full',
    hubspot: 'partial',
    salesforce: 'partial',
    zoho: 'partial',
  },
  {
    id: 'whatsapp_integration',
    name: 'Integração WhatsApp',
    sirius: 'full',
    pipedrive: 'partial',
    rdstation: 'partial',
    hubspot: 'partial',
    salesforce: 'partial',
    zoho: 'partial',
  },
  {
    id: 'pricing_brl',
    name: 'Preço em Reais',
    sirius: 'full',
    pipedrive: 'none',
    rdstation: 'full',
    hubspot: 'none',
    salesforce: 'none',
    zoho: 'none',
  },
  {
    id: 'unlimited_contacts',
    name: 'Contatos Ilimitados',
    sirius: 'full',
    pipedrive: 'partial',
    rdstation: 'partial',
    hubspot: 'partial',
    salesforce: 'partial',
    zoho: 'partial',
  },
  {
    id: 'script_generator',
    name: 'Gerador de Scripts',
    sirius: 'full',
    pipedrive: 'none',
    rdstation: 'none',
    hubspot: 'none',
    salesforce: 'none',
    zoho: 'none',
  },
  {
    id: 'ease_of_use',
    name: 'Facilidade de Uso',
    sirius: 'full',
    pipedrive: 'full',
    rdstation: 'partial',
    hubspot: 'partial',
    salesforce: 'none',
    zoho: 'partial',
  },
]

export function CompetitorMatrix({
  competitors,
  focusFeatures = [],
  showPricing = true,
  onInteraction
}: CompetitorMatrixComponentProps) {

  const renderFeatureValue = (value: 'full' | 'partial' | 'none') => {
    switch (value) {
      case 'full':
        return <Check className="h-5 w-5 text-green-600" />
      case 'partial':
        return <Minus className="h-5 w-5 text-yellow-600" />
      case 'none':
        return <X className="h-5 w-5 text-red-400" />
    }
  }

  const selectedCompetitors = competitors.map(id => ({
    id,
    ...COMPETITORS[id]
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-testid="competitor-matrix"
    >
      <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Comparativo de CRMs</CardTitle>
              <CardDescription>
                Sirius vs {selectedCompetitors.map(c => c.name).join(', ')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Header Row */}
          <div className={`grid grid-cols-${competitors.length + 2} border-b`} style={{
            gridTemplateColumns: `2fr repeat(${competitors.length + 1}, 1fr)`
          }}>
            <div className="p-3 font-medium text-muted-foreground">
              Recurso
            </div>
            <div className="p-3 text-center bg-primary/10 border-x">
              <div className="flex items-center justify-center gap-1 font-bold">
                <Crown className="h-4 w-4 text-primary" />
                Sirius
              </div>
              {showPricing && (
                <Badge variant="default" className="mt-1">A partir de R$ 67/mês</Badge>
              )}
            </div>
            {selectedCompetitors.map((comp) => (
              <div key={comp.id} className={`p-3 text-center ${comp.color}`}>
                <span className="font-medium text-sm">{comp.name}</span>
                {showPricing && (
                  <p className="text-xs text-muted-foreground mt-1">{comp.price}/mês</p>
                )}
              </div>
            ))}
          </div>

          {/* Feature Rows */}
          <div className="divide-y">
            {FEATURES.map((feature) => {
              const isHighlighted = focusFeatures.includes(feature.id)

              return (
                <motion.div
                  key={feature.id}
                  className={`grid ${isHighlighted ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}`}
                  style={{
                    gridTemplateColumns: `2fr repeat(${competitors.length + 1}, 1fr)`
                  }}
                  initial={isHighlighted ? { x: -5 } : {}}
                  animate={isHighlighted ? { x: 0 } : {}}
                >
                  <div className="p-3 flex items-center gap-2">
                    {isHighlighted && (
                      <Sparkles className="h-4 w-4 text-yellow-600" />
                    )}
                    <span className={isHighlighted ? 'font-medium' : 'text-sm'}>
                      {feature.name}
                    </span>
                  </div>
                  <div className="p-3 flex items-center justify-center bg-primary/5 border-x">
                    {renderFeatureValue(feature.sirius as 'full' | 'partial' | 'none')}
                  </div>
                  {selectedCompetitors.map((comp) => (
                    <div key={comp.id} className="p-3 flex items-center justify-center">
                      {renderFeatureValue(feature[comp.id as keyof typeof feature] as 'full' | 'partial' | 'none')}
                    </div>
                  ))}
                </motion.div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="p-4 border-t bg-muted/30">
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4 text-green-600" /> Completo
              </span>
              <span className="flex items-center gap-1">
                <Minus className="h-4 w-4 text-yellow-600" /> Parcial
              </span>
              <span className="flex items-center gap-1">
                <X className="h-4 w-4 text-red-400" /> Não disponível
              </span>
            </div>
          </div>

          {/* Sirius Advantage */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="p-4 bg-primary/5 border-t"
          >
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-medium">Vantagem Sirius:</span>
              <span className="text-muted-foreground">
                Único CRM brasileiro com AGI de vendas nativa e metodologia SPIN integrada.
              </span>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default CompetitorMatrix
