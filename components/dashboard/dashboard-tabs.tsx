'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreateDealDialog } from '@/components/deals/create-deal-dialog'
import { PipelineSelector } from '@/components/pipelines/pipeline-selector'
import { toast } from 'sonner'
import { Layout, Loader2 } from 'lucide-react'

// Dynamic import do KanbanBoard (carrega apenas quando necessário)
const KanbanBoard = dynamic(
  () => import('@/components/kanban-board').then(m => ({ default: m.KanbanBoard })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
    ssr: false,
  }
)

interface DashboardTabsProps {
  pipelines: any[]
  stages: any[]
  contacts: any[]
  userId: string
  userName: string
  organizationId: string
}

export function DashboardTabs({
  pipelines,
  stages,
  contacts,
  userId,
  userName,
  organizationId
}: DashboardTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('pipeline')

  // Pipeline selector state — persist via URL ?pipeline=ID
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(() => {
    const fromUrl = searchParams.get('pipeline')
    if (fromUrl && pipelines.some((p: any) => p.id === fromUrl)) return fromUrl
    const defaultPipeline = pipelines.find((p: any) => p.isDefault)
    return defaultPipeline ? defaultPipeline.id : (pipelines[0]?.id || '')
  })

  // Sync selected pipeline to URL
  const handlePipelineChange = useCallback((id: string) => {
    setSelectedPipelineId(id)
    const params = new URLSearchParams(searchParams.toString())
    params.set('pipeline', id)
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  // Filter stages by selected pipeline
  const filteredStages = useMemo(() => {
    if (!selectedPipelineId) return stages
    return stages.filter((stage: any) => stage.pipelineId === selectedPipelineId)
  }, [stages, selectedPipelineId])

  const syncWithServer = useCallback(() => {
    router.refresh()
  }, [router])


  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <TabsList className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-100/80 dark:bg-zinc-800/80 p-1 text-muted-foreground backdrop-blur-sm border border-black/5 dark:border-white/5">
          <TabsTrigger 
            value="pipeline" 
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm gap-2"
          >
            <Layout className="h-4 w-4" />
            Pipeline
          </TabsTrigger>
        </TabsList>

        {activeTab === 'pipeline' && (
          <div className="flex items-center gap-2">
            <PipelineSelector
              pipelines={pipelines}
              onPipelineChange={handlePipelineChange}
            />
            <CreateDealDialog
              stages={filteredStages}
              contacts={contacts}
              onSuccess={syncWithServer}
            />
          </div>
        )}
      </div>

      <TabsContent value="pipeline" className="flex-1 m-0 data-[state=inactive]:hidden">
        <KanbanBoard
          stages={filteredStages as any}
          contacts={contacts}
          pipelineId={selectedPipelineId}
        />
      </TabsContent>

    </Tabs>
  )
}
