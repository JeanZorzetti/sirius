'use client'

import { Check, ChevronDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

type Pipeline = {
  id: string
  name: string
  isDefault: boolean
  _count: {
    stages: number
    deals: number
  }
}

type PipelineSelectorProps = {
  pipelines: Pipeline[]
  selectedPipelineId?: string
  onPipelineChange?: (pipelineId: string) => void
}

export function PipelineSelector({ pipelines, selectedPipelineId: controlledId, onPipelineChange }: PipelineSelectorProps) {
  const router = useRouter()

  const selectedPipelineId = controlledId ?? pipelines.find(p => p.isDefault)?.id ?? pipelines[0]?.id ?? ''

  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId)

  const handlePipelineSelect = (pipelineId: string) => {
    if (onPipelineChange) {
      onPipelineChange(pipelineId)
    }
  }

  const handleCreatePipeline = () => {
    router.push('/dashboard/pipelines')
  }

  if (pipelines.length === 0) {
    return (
      <Button onClick={handleCreatePipeline} variant="outline" size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Criar Pipeline
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          data-testid="pipeline-selector"
          aria-label={`Funil: ${selectedPipeline?.name ?? 'nenhum'}. Trocar de funil`}
          className="-ml-2 h-auto max-w-[520px] justify-start gap-2 px-2 py-1 hover:bg-muted"
        >
          <span className="truncate text-[26px] font-bold leading-tight tracking-tight">
            {selectedPipeline?.name || 'Selecione um pipeline'}
          </span>
          {selectedPipeline?.isDefault && (
            <Badge variant="outline" className="flex-shrink-0 font-normal text-muted-foreground">
              Padrão
            </Badge>
          )}
          <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[280px]" align="start">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Pipelines disponíveis
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {pipelines.map((pipeline) => (
          <DropdownMenuItem
            key={pipeline.id}
            onClick={() => handlePipelineSelect(pipeline.id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2 flex-1 overflow-hidden">
              <span className="truncate">{pipeline.name}</span>
              {pipeline.isDefault && (
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  Padrão
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {pipeline._count.deals} {pipeline._count.deals === 1 ? 'deal' : 'deals'}
              </span>
              {pipeline.id === selectedPipelineId && (
                <Check className="h-4 w-4 text-foreground flex-shrink-0" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCreatePipeline} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          Gerenciar Pipelines
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
