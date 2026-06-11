'use client'

import { useState, type Dispatch, type SetStateAction } from 'react'
import type { DropResult } from '@hello-pangea/dnd'
import { updateDealStage, updateDealStatus } from '@/app/[locale]/dashboard/actions'
import { reorderDeals } from '@/app/[locale]/dashboard/deals/actions'
import { LOST_COLUMN_ID, type Deal, type Stage } from './types'

// Reorder helper
function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)
  return result
}

/**
 * All the drag/swipe movement logic of the board: stage-to-stage drags
 * (optimistic + server sync), drags in/out of the "Perdido" column (with
 * the pending lost-reason flow), and mobile swipe-to-move.
 */
export function useKanbanDrag({
  stages,
  setStages,
  filteredStages,
  onSuccess,
}: {
  stages: Stage[]
  setStages: Dispatch<SetStateAction<Stage[]>>
  filteredStages: Stage[]
  onSuccess?: () => void
}) {
  // Deal dragged into "Perdido", waiting for the reason modal
  const [pendingLostDealId, setPendingLostDealId] = useState<string | null>(null)

  const confirmLost = async (reason: string) => {
    if (!pendingLostDealId) return
    const dealId = pendingLostDealId
    setPendingLostDealId(null)
    await updateDealStatus(dealId, 'LOST', reason || undefined)
  }

  const cancelLost = () => {
    if (!pendingLostDealId) return
    const revertId = pendingLostDealId
    // Revert the optimistic update
    setStages((prev: Stage[]) => prev.map((s: Stage) => ({
      ...s,
      deals: s.deals.map((d: Deal) => d.id === revertId ? { ...d, status: 'ACTIVE' } : d),
    })))
    setPendingLostDealId(null)
  }

  // Swipe-to-move: permite mover um deal para stage anterior/próximo com swipe em mobile.
  // Reusa a mesma lógica do drag-and-drop desktop (optimistic update + updateDealStage).
  const handleSwipeMove = async (dealId: string, direction: 'prev' | 'next') => {
    const orderedStages = [...stages].sort((a, b) => a.order - b.order)
    const currentStageIdx = orderedStages.findIndex(s => s.deals.some(d => d.id === dealId))
    if (currentStageIdx === -1) return

    const targetIdx = direction === 'prev' ? currentStageIdx - 1 : currentStageIdx + 1
    if (targetIdx < 0 || targetIdx >= orderedStages.length) return

    const targetStage = orderedStages[targetIdx]
    const deal = orderedStages[currentStageIdx].deals.find(d => d.id === dealId)
    if (!deal) return

    // Optimistic update
    setStages(prev => {
      const srcIdx = prev.findIndex(s => s.id === orderedStages[currentStageIdx].id)
      const dstIdx = prev.findIndex(s => s.id === targetStage.id)
      if (srcIdx === -1 || dstIdx === -1) return prev
      return prev.map((s, i) => {
        if (i === srcIdx) return { ...s, deals: s.deals.filter(d => d.id !== dealId) }
        if (i === dstIdx) return { ...s, deals: [{ ...deal, stageId: targetStage.id }, ...s.deals] }
        return s
      })
    })

    await updateDealStage(dealId, targetStage.id)
    onSuccess?.()
  }

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result
    const dealId = draggableId

    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    // --- Drag INTO Perdido: optimistic update + open reason modal ---
    if (destination.droppableId === LOST_COLUMN_ID) {
      setStages(prev => prev.map(s => ({
        ...s,
        deals: s.deals.map(d => d.id === dealId ? { ...d, status: 'LOST' } : d),
      })))
      setPendingLostDealId(dealId)
      return
    }

    // --- Drag OUT OF Perdido to a real stage: restore as ACTIVE ---
    if (source.droppableId === LOST_COLUMN_ID) {
      const destStageIdx = stages.findIndex(s => s.id === destination.droppableId)
      if (destStageIdx === -1) return

      setStages(prev => {
        const srcStageIdx = prev.findIndex(s => s.deals.some(d => d.id === dealId))
        if (srcStageIdx === -1) return prev

        const deal = prev[srcStageIdx].deals.find(d => d.id === dealId)!
        const updatedDeal = { ...deal, status: 'ACTIVE', stageId: destination.droppableId }

        return prev.map((s, i) => {
          if (i === srcStageIdx) {
            return { ...s, deals: s.deals.filter(d => d.id !== dealId) }
          }
          if (i === destStageIdx) {
            const activeDeals = s.deals.filter(d => d.status !== 'LOST')
            const lostDealsInStage = s.deals.filter(d => d.status === 'LOST')
            const newActive = [...activeDeals]
            newActive.splice(destination.index, 0, updatedDeal)
            return { ...s, deals: [...newActive, ...lostDealsInStage] }
          }
          return s
        })
      })

      await Promise.all([
        updateDealStatus(dealId, 'ACTIVE'),
        updateDealStage(dealId, destination.droppableId),
      ])
      return
    }

    // --- Normal stage-to-stage drag ---
    // filteredStages matches exactly what DnD rendered — use it for index resolution
    const filteredSourceStage = filteredStages.find(s => s.id === source.droppableId)
    const filteredDestStage = filteredStages.find(s => s.id === destination.droppableId)

    if (!filteredSourceStage || !filteredDestStage) return

    const sourceDeal = filteredSourceStage.deals[source.index]
    if (!sourceDeal) return

    const sourceStageIndex = stages.findIndex(s => s.id === source.droppableId)
    const destStageIndex = stages.findIndex(s => s.id === destination.droppableId)

    if (sourceStageIndex === -1 || destStageIndex === -1) return

    const sourceStage = stages[sourceStageIndex]
    const destStage = stages[destStageIndex]

    const sourceLostDeals = sourceStage.deals.filter(d => d.status === 'LOST')

    if (source.droppableId === destination.droppableId) {
      const reorderedFiltered = reorder(filteredSourceStage.deals, source.index, destination.index)

      setStages(prev => {
        const newStages = [...prev]
        newStages[sourceStageIndex] = {
          ...sourceStage,
          deals: [...reorderedFiltered, ...sourceLostDeals],
        }
        return newStages
      })

      const reorderedDeals = reorderedFiltered.map((deal, index) => ({ id: deal.id, order: index }))
      await reorderDeals(sourceStage.id, reorderedDeals)
    } else {
      const destLostDeals = destStage.deals.filter(d => d.status === 'LOST')

      const newSourceFiltered = filteredSourceStage.deals.filter(d => d.id !== sourceDeal.id)
      const newDestFiltered = [...filteredDestStage.deals]
      const updatedDeal = { ...sourceDeal, stageId: destStage.id }
      newDestFiltered.splice(destination.index, 0, updatedDeal)

      setStages(prev => {
        const newStages = [...prev]
        newStages[sourceStageIndex] = {
          ...sourceStage,
          deals: [...newSourceFiltered, ...sourceLostDeals],
        }
        newStages[destStageIndex] = {
          ...destStage,
          deals: [...newDestFiltered, ...destLostDeals],
        }
        return newStages
      })

      await updateDealStage(sourceDeal.id, destStage.id)
      const reorderedDeals = newDestFiltered.map((deal, index) => ({ id: deal.id, order: index }))
      await reorderDeals(destStage.id, reorderedDeals)
    }
  }

  return { handleDragEnd, handleSwipeMove, pendingLostDealId, confirmLost, cancelLost }
}
