'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreateDealDialog } from '@/components/deals/create-deal-dialog'
import { EditDealDialog } from '@/components/deals/edit-deal-dialog'
import { PipelineSelector } from '@/components/pipelines/pipeline-selector'
import { ExportButtons } from '@/components/ui/export-buttons'
import { toast } from 'sonner'
import { Layout, Loader2, Plus } from 'lucide-react'
import { MobilePipelineList } from './mobile-pipeline-list'
import { useAppBar } from '@/components/mobile/app-bar-context'
import type {
  PipelineContact,
  PipelineDeal,
  PipelineStageWithDeals,
  PipelineSummary,
} from '@/lib/types/pipeline'

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
  pipelines: PipelineSummary[]
  stages: PipelineStageWithDeals[]
  contacts: PipelineContact[]
  userId: string
  userName: string
  organizationId: string
  canViewClosings?: boolean
}

export function DashboardTabs({
  pipelines,
  stages,
  contacts,
  userId,
  userName,
  organizationId,
  canViewClosings = true,
}: DashboardTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('pipeline')

  // Pipeline selector state — persist via URL ?pipeline=ID
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(() => {
    const fromUrl = searchParams.get('pipeline')
    if (fromUrl && pipelines.some((p) => p.id === fromUrl)) return fromUrl
    const defaultPipeline = pipelines.find((p) => p.isDefault)
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
    return stages.filter((stage) => stage.pipelineId === selectedPipelineId)
  }, [stages, selectedPipelineId])

  const syncWithServer = useCallback(() => {
    router.refresh()
  }, [router])

  const { setConfig } = useAppBar()

  const totalDeals = filteredStages.reduce((sum, s) => sum + (s.deals?.length ?? 0), 0)
  // Exportação baixa TODOS os deals do usuário (ignora filtro de pipeline) — o "vazio" que desabilita o botão também ignora o filtro.
  const hasAnyDeals = stages.some((s) => (s.deals?.length ?? 0) > 0)
  const totalValue = filteredStages.reduce(
    (sum, s) => sum + (s.deals ?? []).reduce((sv, d) => sv + (d.value ?? 0), 0),
    0
  )

  const [createDealOpen, setCreateDealOpen] = useState(false)
  const [editingDeal, setEditingDeal] = useState<PipelineDeal | null>(null)

  // Deep link da busca global: /dashboard?deal=<id> abre o modal do deal
  useEffect(() => {
    const dealId = searchParams.get('deal')
    if (!dealId) return
    for (const stage of stages) {
      const deal = (stage.deals ?? []).find((d) => d.id === dealId)
      if (deal) {
        if (stage.pipelineId && stage.pipelineId !== selectedPipelineId) {
          setSelectedPipelineId(stage.pipelineId)
        }
        setEditingDeal(deal)
        break
      }
    }
    const params = new URLSearchParams(searchParams.toString())
    params.delete('deal')
    router.replace(params.toString() ? `${pathname}?${params}` : pathname, { scroll: false })
  }, [searchParams, stages, selectedPipelineId, pathname, router])
  const [contactDisplayMode, setContactDisplayMode] = useState<'name' | 'company'>(() => {
    if (typeof window === 'undefined') return 'name'
    return (localStorage.getItem('contact-display-mode') as 'name' | 'company') || 'name'
  })

  useEffect(() => {
    const formattedValue = totalValue >= 1_000_000
      ? `R$ ${(totalValue / 1_000_000).toFixed(1)}M`
      : totalValue >= 1000
      ? `R$ ${(totalValue / 1000).toFixed(0)}k`
      : `R$ ${totalValue.toLocaleString('pt-BR')}`

    setConfig({
      title: 'Pipeline',
      subtitle: `${totalDeals} deals · ${formattedValue}`,
      showSearch: true,
      primaryAction: {
        icon: <Plus className="h-5 w-5" />,
        onClick: () => setCreateDealOpen(true),
        label: 'Novo deal',
      },
    })
    return () => setConfig(null)
  }, [totalDeals, totalValue])

  return (
    <>
      {/* Mobile layout: stage stories + vertical list */}
      <div className="lg:hidden">
        <MobilePipelineList
          stages={filteredStages}
          pipelines={pipelines}
          selectedPipelineId={selectedPipelineId}
          onPipelineChange={handlePipelineChange}
          onCreateDeal={() => setCreateDealOpen(true)}
          onDealClick={(deal) => setEditingDeal(deal)}
        />
      </div>

      {/* Desktop layout: kanban tabs */}
      <div className="hidden lg:block h-full">
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
                  selectedPipelineId={selectedPipelineId}
                  onPipelineChange={handlePipelineChange}
                />
                <ExportButtons resourceType="deals" disabled={!hasAnyDeals} />
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
              stages={filteredStages}
              contacts={contacts}
              pipelineId={selectedPipelineId}
              currentUserId={userId}
              canViewClosings={canViewClosings}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile create deal dialog */}
      <div className="lg:hidden">
        <CreateDealDialog
          stages={filteredStages}
          contacts={contacts}
          onSuccess={syncWithServer}
          open={createDealOpen}
          onOpenChange={setCreateDealOpen}
        />
        <EditDealDialog
          deal={editingDeal}
          open={!!editingDeal}
          onOpenChange={(open) => { if (!open) setEditingDeal(null) }}
          stages={filteredStages}
          contacts={contacts}
          onSuccess={syncWithServer}
          contactDisplayMode={contactDisplayMode}
          onContactDisplayModeChange={(mode) => {
            setContactDisplayMode(mode)
            localStorage.setItem('contact-display-mode', mode)
          }}
        />
      </div>
    </>
  )
}
