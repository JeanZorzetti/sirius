'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CreateDealDialog } from '@/components/deals/create-deal-dialog'
import { EditDealDialog } from '@/components/deals/edit-deal-dialog'
import { PipelineSelector } from '@/components/pipelines/pipeline-selector'
import { ExportButtons } from '@/components/ui/export-buttons'
import { toast } from 'sonner'
import { Loader2, Plus } from 'lucide-react'
import { MobilePipelineList } from './mobile-pipeline-list'
import { FilaDeHoje } from './fila-de-hoje'
import { dinheiroCompacto, resumirEtapa } from '@/lib/pipeline/hoje'
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
  /** The value and contact searches, rendered by the page (server) into the top row */
  buscas?: React.ReactNode
}

export function DashboardTabs({
  pipelines,
  stages,
  contacts,
  userId,
  userName,
  organizationId,
  canViewClosings = true,
  buscas,
}: DashboardTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

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

  // Open and won deals of the selected pipeline (lost ones live in their own column): the queue and the summaries read these
  const emJogo = useMemo(
    () => filteredStages.flatMap((s) => (s.deals ?? []).filter((d) => d.status !== 'LOST')),
    [filteredStages]
  )
  // Exportação baixa TODOS os deals do usuário (ignora filtro de pipeline) — o "vazio" que desabilita o botão também ignora o filtro.
  const hasAnyDeals = stages.some((s) => (s.deals?.length ?? 0) > 0)
  const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId)

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
    // Honest summary (spec 009): 80% of real deals carry no value, so "R$ 0" was a claim about missing data
    const r = resumirEtapa(emJogo, new Date())
    const valor = r.comValor > 0 ? `${dinheiroCompacto(r.soma)} em ${r.comValor} com valor` : 'sem valor'

    setConfig({
      title: 'Pipeline',
      subtitle: `${r.n} ${r.n === 1 ? 'negócio' : 'negócios'} · ${valor}`,
      showSearch: true,
      primaryAction: {
        icon: <Plus className="h-5 w-5" />,
        onClick: () => setCreateDealOpen(true),
        label: 'Novo deal',
      },
    })
    return () => setConfig(null)
  }, [emJogo])

  return (
    <>
      {/* Mobile layout: today's queue, then stage chips + vertical list */}
      <div className="lg:hidden">
        <div className="px-3 pt-2">
          <FilaDeHoje deals={emJogo} onAbrir={setEditingDeal} />
        </div>
        <MobilePipelineList
          stages={filteredStages}
          pipelines={pipelines}
          selectedPipelineId={selectedPipelineId}
          onPipelineChange={handlePipelineChange}
          onCreateDeal={() => setCreateDealOpen(true)}
          onDealClick={(deal) => setEditingDeal(deal)}
        />
      </div>

      {/* Desktop layout (spec 009): one top row, today's queue, then the board as context */}
      <div className="hidden lg:flex lg:h-full lg:flex-col">
        <h1 className="sr-only">Pipeline {selectedPipeline?.name}</h1>
        <div className="mb-5 flex items-center justify-between gap-4">
          <PipelineSelector
            pipelines={pipelines}
            selectedPipelineId={selectedPipelineId}
            onPipelineChange={handlePipelineChange}
          />
          <div className="flex items-center gap-2">
            {buscas}
            <ExportButtons resourceType="deals" disabled={!hasAnyDeals} />
            <CreateDealDialog
              stages={filteredStages}
              contacts={contacts}
              onSuccess={syncWithServer}
            />
          </div>
        </div>

        <FilaDeHoje deals={emJogo} onAbrir={setEditingDeal} />

        <div className="min-h-[60vh] flex-1">
          <KanbanBoard
            stages={filteredStages}
            contacts={contacts}
            pipelineId={selectedPipelineId}
            currentUserId={userId}
            canViewClosings={canViewClosings}
          />
        </div>
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
