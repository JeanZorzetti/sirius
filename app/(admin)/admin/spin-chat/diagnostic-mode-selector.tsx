'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap, Target, Microscope, Clock, MessageSquare, TrendingUp } from 'lucide-react'

export type DiagnosticMode = 'express' | 'complete' | 'deep'

interface DiagnosticModeSelectorProps {
  onSelectMode: (mode: DiagnosticMode) => void
}

export function DiagnosticModeSelector({ onSelectMode }: DiagnosticModeSelectorProps) {
  const modes: Array<{
    id: DiagnosticMode
    icon: React.ElementType
    iconColor: string
    title: string
    subtitle: string
    duration: string
    questions: string
    description: string
    features: string[]
    recommended?: boolean
  }> = [
    {
      id: 'express',
      icon: Zap,
      iconColor: 'text-yellow-600',
      title: 'Diagnóstico Express',
      subtitle: 'Rápido e direto ao ponto',
      duration: '~3 min',
      questions: '5-7 perguntas',
      description: 'Ideal para quem quer uma avaliação rápida e insights imediatos',
      features: [
        'Conversação casual e objetiva',
        'Foco nos problemas principais',
        'Recomendações rápidas',
        'Menor fricção',
      ],
    },
    {
      id: 'complete',
      icon: Target,
      iconColor: 'text-indigo-600',
      title: 'Diagnóstico Completo',
      subtitle: 'Balance entre profundidade e agilidade',
      duration: '~10 min',
      questions: '10-15 perguntas',
      description: 'Análise detalhada com diagnóstico completo e plano de ação',
      features: [
        'Tom profissional mas conversacional',
        'Análise de problemas e impactos',
        'Relatório estruturado',
        'Qualificação balanceada',
      ],
      recommended: true,
    },
    {
      id: 'deep',
      icon: Microscope,
      iconColor: 'text-purple-600',
      title: 'Diagnóstico Profundo',
      subtitle: 'Análise empresarial completa',
      duration: '~20 min',
      questions: '20+ perguntas',
      description: 'Diagnóstico empresarial completo com análise detalhada de todos os aspectos',
      features: [
        'Consultoria especializada',
        'Mapeamento completo de processos',
        'Relatório executivo detalhado',
        'Máxima profundidade',
      ],
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Diagnóstico Comercial AGI
        </h2>
        <p className="text-lg text-slate-600">
          Escolha o nível de profundidade da análise
        </p>
      </div>

      {/* Mode Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {modes.map((mode) => {
          const Icon = mode.icon
          return (
            <Card
              key={mode.id}
              className={`relative transition-all hover:shadow-lg ${
                mode.recommended ? 'border-indigo-200 shadow-md' : ''
              }`}
            >
              {mode.recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-indigo-600 text-white px-4">Recomendado</Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`h-8 w-8 ${mode.iconColor}`} />
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <Clock className="h-3 w-3" />
                      {mode.duration}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <MessageSquare className="h-3 w-3" />
                      {mode.questions}
                    </div>
                  </div>
                </div>

                <CardTitle className="text-xl">{mode.title}</CardTitle>
                <CardDescription>{mode.subtitle}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-slate-700">{mode.description}</p>

                <div className="space-y-2">
                  {mode.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                      <TrendingUp className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => onSelectMode(mode.id)}
                  className="w-full"
                  variant={mode.recommended ? 'default' : 'outline'}
                >
                  Iniciar {mode.title.split(' ')[1]}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Info Footer */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="py-4">
          <p className="text-sm text-slate-600 text-center">
            💡 <strong>Dica:</strong> Quanto mais profundo o diagnóstico, mais preciso será o
            relatório final e as recomendações. O modo Express é ideal para primeiras conversas,
            enquanto o modo Profundo gera um relatório executivo completo.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
