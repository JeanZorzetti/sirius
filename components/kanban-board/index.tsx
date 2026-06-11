'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { DragDropContext } from '@hello-pangea/dnd'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { updateStage, deleteStage, createStage } from '@/app/[locale]/dashboard/pipeline/actions'
import { EditDealDialog } from '@/components/deals/edit-deal-dialog'
import { KanbanColumn, LostColumn } from './kanban-column'
import { LostReasonDialog } from './lost-reason-dialog'
import { useGrabScroll } from './use-grab-scroll'
import { useKanbanDrag } from './use-kanban-drag'
import type { ContactDisplayMode, Deal, KanbanBoardProps } from './types'

export type { KanbanBoardProps } from './types'

export function KanbanBoard({
  stages: initialStages,
  contacts,
  pipelineId,
  currentUserId,
  canViewClosings = true,
  onOptimisticUpdate,
  onOptimisticDelete,
  onRollback,
  onSuccess
}: KanbanBoardProps) {
  const tCommon = useTranslations('common')
  const tComponents = useTranslations('components')
  const [stages, setStages] = useState(() => [...initialStages].sort((a, b) => a.order - b.order))
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [contactDisplayMode, setContactDisplayMode] = useState<ContactDisplayMode>(() => {
    if (typeof window === 'undefined') return 'name'
    return (localStorage.getItem('contact-display-mode') as ContactDisplayMode) || 'name'
  })

  // New Stage Dialog
  const [isNewStageOpen, setIsNewStageOpen] = useState(false)
  const [newStageName, setNewStageName] = useState("")

  // Delete Stage Confirmation
  const [deleteStageId, setDeleteStageId] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")

  const scrollContainerRef = useGrabScroll()

  // Sync stages when the server sends new data (render-adjust pattern instead
  // of setState-in-effect). Sorting a copy — the original sorted the parent's
  // array in place.
  const [prevInitialStages, setPrevInitialStages] = useState(initialStages)
  if (initialStages !== prevInitialStages) {
    setPrevInitialStages(initialStages)
    setStages([...initialStages].sort((a, b) => a.order - b.order))
  }

  // Filter deals based on search, excluding LOST deals from regular columns
  const filteredStages = useMemo(() => {
    const activeStages = stages.map(stage => ({
      ...stage,
      deals: stage.deals.filter(d => d.status !== 'LOST'),
    }))

    const query = searchQuery.toLowerCase()
    const filtered = !searchQuery
      ? activeStages
      : activeStages.map(stage => ({
          ...stage,
          deals: stage.deals.filter(deal =>
            deal.title.toLowerCase().includes(query) ||
            deal.contact?.name?.toLowerCase().includes(query)
          ),
        }))

    // Sort: deals with dueDate ascending first, then deals without dueDate
    return filtered.map(stage => ({
      ...stage,
      deals: [...stage.deals].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }),
    }))
  }, [stages, searchQuery])

  // LOST deals for the fixed "Perdido" column
  const lostDeals = useMemo(() => {
    const allLost = stages.flatMap(s => s.deals.filter(d => d.status === 'LOST'))
    if (!searchQuery) return allLost
    const query = searchQuery.toLowerCase()
    return allLost.filter(d =>
      d.title.toLowerCase().includes(query) ||
      d.contact?.name?.toLowerCase().includes(query)
    )
  }, [stages, searchQuery])

  const { handleDragEnd, handleSwipeMove, pendingLostDealId, confirmLost, cancelLost } =
    useKanbanDrag({ stages, setStages, filteredStages, onSuccess })

  // Handlers for Stage CRUD
  const handleRenameStage = async (id: string, name: string) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, name } : s))
    await updateStage(id, name)
    onSuccess?.()
  }

  const handleDeleteStage = async (id: string) => {
    const result = await deleteStage(id)
    if (result.success) {
      setStages(prev => prev.filter(s => s.id !== id))
      onSuccess?.()
    } else {
      alert(result.error || "Erro ao excluir etapa")
    }
    setDeleteStageId(null)
  }

  const handleCreateStage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStageName) return

    const result = await createStage(newStageName, pipelineId)
    if (result.success) {
      setIsNewStageOpen(false)
      setNewStageName("")
      onSuccess?.()
    } else {
      alert('Erro ao criar etapa')
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full gap-4">
        {/* Pipeline Header / Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Filtrar por nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full sm:w-[200px] bg-white/5 border-white/10"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsNewStageOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            {tCommon('buttons.add')}
          </Button>
        </div>

        <div
          ref={scrollContainerRef}
          data-tour="pipeline"
          className="flex h-full gap-3 sm:gap-6 pb-4 px-2 overflow-x-auto snap-x snap-mandatory sm:snap-none cursor-grab active:cursor-grabbing"
        >
          {filteredStages.map((stage, idx) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              onDealClick={(deal) => setEditingDeal(deal)}
              onRename={handleRenameStage}
              onDelete={(id) => setDeleteStageId(id)}
              onSwipeMoveDeal={handleSwipeMove}
              hasPrevStage={idx > 0}
              hasNextStage={idx < filteredStages.length - 1}
              contactDisplayMode={contactDisplayMode}
            />
          ))}
          <LostColumn
            deals={lostDeals}
            onDealClick={(deal) => setEditingDeal(deal)}
            contactDisplayMode={contactDisplayMode}
          />
          <div className="w-10 shrink-0" />
        </div>
      </div>

      <EditDealDialog
        deal={editingDeal}
        open={!!editingDeal}
        onOpenChange={(open) => !open && setEditingDeal(null)}
        stages={stages}
        contacts={contacts}
        currentUserId={currentUserId}
        canViewClosings={canViewClosings}
        onOptimisticUpdate={onOptimisticUpdate}
        onOptimisticDelete={onOptimisticDelete}
        onRollback={onRollback}
        onSuccess={onSuccess}
        contactDisplayMode={contactDisplayMode}
        onContactDisplayModeChange={(mode) => {
          setContactDisplayMode(mode)
          localStorage.setItem('contact-display-mode', mode)
        }}
      />

      <Dialog open={isNewStageOpen} onOpenChange={setIsNewStageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tCommon('buttons.add')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateStage} className="space-y-4">
            <Input
              placeholder="Nome da etapa (ex: Negociação)"
              value={newStageName}
              onChange={e => setNewStageName(e.target.value)}
              autoFocus
            />
            <DialogFooter>
              <Button type="submit">{tCommon('buttons.create')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteStageId}
        onOpenChange={(open) => !open && setDeleteStageId(null)}
        title={tCommon('buttons.delete')}
        description={tComponents('shared.dialogs.confirmDeleteDesc')}
        confirmLabel={tCommon('buttons.delete')}
        onConfirm={() => deleteStageId && handleDeleteStage(deleteStageId)}
      />

      {/* Lost Reason Modal */}
      <LostReasonDialog
        open={!!pendingLostDealId}
        onConfirm={confirmLost}
        onCancel={cancelLost}
      />
    </DragDropContext>
  )
}
