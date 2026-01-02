'use client'

import { useEffect, useState } from 'react'
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
  onPipelineChange?: (pipelineId: string) => void
}

export function PipelineSelector({ pipelines, onPipelineChange }: PipelineSelectorProps) {
  const router = useRouter()
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('')

  // Initialize selected pipeline from localStorage or use default
  useEffect(() => {
    const storedPipelineId = localStorage.getItem('selectedPipelineId')

    if (storedPipelineId && pipelines.find(p => p.id === storedPipelineId)) {
      setSelectedPipelineId(storedPipelineId)
    } else {
      // Use default pipeline
      const defaultPipeline = pipelines.find(p => p.isDefault)
      if (defaultPipeline) {
        setSelectedPipelineId(defaultPipeline.id)
      } else if (pipelines.length > 0) {
        setSelectedPipelineId(pipelines[0].id)
      }
    }
  }, [pipelines])

  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId)

  const handlePipelineSelect = (pipelineId: string) => {
    setSelectedPipelineId(pipelineId)
    localStorage.setItem('selectedPipelineId', pipelineId)

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
        <Button variant="outline" className="w-[280px] justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
            <span className="truncate">{selectedPipeline?.name || 'Selecione um pipeline'}</span>
            {selectedPipeline?.isDefault && (
              <Badge variant="secondary" className="ml-1 flex-shrink-0">
                Padrão
              </Badge>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
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
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  pipeline.id === selectedPipelineId ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
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
                <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />
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
