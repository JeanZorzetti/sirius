'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calculator, TrendingUp, TrendingDown } from 'lucide-react'

export function FunnelCalculator() {
  const [visitors, setVisitors] = useState<number>(1000)
  const [leads, setLeads] = useState<number>(100)
  const [qualified, setQualified] = useState<number>(40)
  const [proposals, setProposals] = useState<number>(20)
  const [sales, setSales] = useState<number>(5)

  const calculateConversion = (from: number, to: number): string => {
    if (from === 0) return '0.0'
    return ((to / from) * 100).toFixed(1)
  }

  const overallConversion = calculateConversion(visitors, sales)

  const leadConversion = parseFloat(calculateConversion(visitors, leads))
  const qualifiedConversion = parseFloat(calculateConversion(leads, qualified))
  const proposalConversion = parseFloat(calculateConversion(qualified, proposals))
  const saleConversion = parseFloat(calculateConversion(proposals, sales))

  const getHealthStatus = (rate: number, stage: string) => {
    const benchmarks: Record<string, number> = {
      lead: 10,        // 10% visitantes viram leads
      qualified: 40,   // 40% leads são qualificados
      proposal: 50,    // 50% qualificados pedem proposta
      sale: 30         // 30% propostas fecham
    }

    return rate >= benchmarks[stage] ? 'healthy' : 'needs-attention'
  }

  const renderHealthIcon = (rate: number, stage: string) => {
    const status = getHealthStatus(rate, stage)
    return status === 'healthy' ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-amber-500" />
    )
  }

  return (
    <Card className="my-8 border-2 border-primary/20 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Calculator className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Calculadora Interativa de Funil</CardTitle>
            <CardDescription className="text-base mt-1">
              Descubra suas taxas de conversão e identifique gargalos
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="visitors" className="text-base font-semibold flex items-center gap-2">
                🎯 Visitantes do site
              </Label>
              <Input
                id="visitors"
                type="number"
                value={visitors}
                onChange={(e) => setVisitors(parseInt(e.target.value) || 0)}
                className="text-lg h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="leads" className="text-base font-semibold flex items-center gap-2">
                📧 Leads gerados
              </Label>
              <Input
                id="leads"
                type="number"
                value={leads}
                onChange={(e) => setLeads(parseInt(e.target.value) || 0)}
                className="text-lg h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qualified" className="text-base font-semibold flex items-center gap-2">
                ✅ Leads qualificados
              </Label>
              <Input
                id="qualified"
                type="number"
                value={qualified}
                onChange={(e) => setQualified(parseInt(e.target.value) || 0)}
                className="text-lg h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposals" className="text-base font-semibold flex items-center gap-2">
                📄 Propostas enviadas
              </Label>
              <Input
                id="proposals"
                type="number"
                value={proposals}
                onChange={(e) => setProposals(parseInt(e.target.value) || 0)}
                className="text-lg h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sales" className="text-base font-semibold flex items-center gap-2">
                💰 Vendas fechadas
              </Label>
              <Input
                id="sales"
                type="number"
                value={sales}
                onChange={(e) => setSales(parseInt(e.target.value) || 0)}
                className="text-lg h-12"
              />
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-xl border-2 border-primary/30">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                TAXA DE CONVERSÃO GERAL
              </h3>
              <p className="text-5xl font-black text-primary mb-1">
                {overallConversion}%
              </p>
              <p className="text-sm text-muted-foreground">
                de {visitors.toLocaleString()} visitantes para {sales} vendas
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-base">Conversão por Etapa:</h4>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Visitante → Lead</span>
                <div className="flex items-center gap-2">
                  {renderHealthIcon(leadConversion, 'lead')}
                  <span className="font-bold text-lg">{leadConversion}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Lead → Qualificado</span>
                <div className="flex items-center gap-2">
                  {renderHealthIcon(qualifiedConversion, 'qualified')}
                  <span className="font-bold text-lg">{qualifiedConversion}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Qualificado → Proposta</span>
                <div className="flex items-center gap-2">
                  {renderHealthIcon(proposalConversion, 'proposal')}
                  <span className="font-bold text-lg">{proposalConversion}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Proposta → Venda</span>
                <div className="flex items-center gap-2">
                  {renderHealthIcon(saleConversion, 'sale')}
                  <span className="font-bold text-lg">{saleConversion}%</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <p className="font-semibold mb-1">💡 Benchmarks de Mercado:</p>
              <ul className="space-y-0.5 ml-4">
                <li>• Visitante → Lead: ≥10%</li>
                <li>• Lead → Qualificado: ≥40%</li>
                <li>• Qualificado → Proposta: ≥50%</li>
                <li>• Proposta → Venda: ≥30%</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
