'use client'

import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { Trash2, Archive } from 'lucide-react'

interface SwipeableRowProps {
  children: React.ReactNode
  onDelete?: () => void
  onArchive?: () => void
  deleteLabel?: string
  archiveLabel?: string
}

const SWIPE_THRESHOLD = 80

export function SwipeableRow({
  children,
  onDelete,
  onArchive,
  deleteLabel,
  archiveLabel,
}: SwipeableRowProps) {
  const tCommon = useTranslations('common')
  const resolvedDeleteLabel = deleteLabel ?? tCommon('buttons.delete')
  const resolvedArchiveLabel = archiveLabel ?? tCommon('buttons.archive')
  const x = useMotionValue(0)
  const triggered = useRef(false)

  const deleteOpacity = useTransform(x, [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD / 2], [1, 0])
  const archiveOpacity = useTransform(x, [SWIPE_THRESHOLD / 2, SWIPE_THRESHOLD], [0, 1])
  const deleteScale = useTransform(x, [-SWIPE_THRESHOLD * 1.5, -SWIPE_THRESHOLD], [1.2, 1])
  const archiveScale = useTransform(x, [SWIPE_THRESHOLD, SWIPE_THRESHOLD * 1.5], [1, 1.2])

  const handleDragEnd = async (_: unknown, info: { offset: { x: number } }) => {
    if (triggered.current) return

    if (info.offset.x < -SWIPE_THRESHOLD && onDelete) {
      triggered.current = true
      try {
        const { triggerHaptic } = await import('@/lib/mobile/haptics')
        triggerHaptic('warning')
      } catch {}
      onDelete()
      triggered.current = false
    } else if (info.offset.x > SWIPE_THRESHOLD && onArchive) {
      triggered.current = true
      try {
        const { triggerHaptic } = await import('@/lib/mobile/haptics')
        triggerHaptic('success')
      } catch {}
      onArchive()
      triggered.current = false
    }
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Delete background (right swipe reveals, swipe left) */}
      {onDelete && (
        <motion.div
          className="absolute inset-y-0 right-0 flex items-center justify-end bg-destructive px-6 rounded-lg"
          style={{ opacity: deleteOpacity }}
        >
          <motion.div className="flex flex-col items-center gap-1" style={{ scale: deleteScale }}>
            <Trash2 className="h-5 w-5 text-destructive-foreground" />
            <span className="text-xs text-destructive-foreground font-medium">{resolvedDeleteLabel}</span>
          </motion.div>
        </motion.div>
      )}

      {/* Archive background (swipe right) */}
      {onArchive && (
        <motion.div
          className="absolute inset-y-0 left-0 flex items-center justify-start bg-muted px-6 rounded-lg"
          style={{ opacity: archiveOpacity }}
        >
          <motion.div className="flex flex-col items-center gap-1" style={{ scale: archiveScale }}>
            <Archive className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">{resolvedArchiveLabel}</span>
          </motion.div>
        </motion.div>
      )}

      {/* Draggable content */}
      <motion.div
        drag="x"
        dragConstraints={{
          left: onDelete ? -SWIPE_THRESHOLD * 1.5 : 0,
          right: onArchive ? SWIPE_THRESHOLD * 1.5 : 0,
        }}
        dragElastic={0.1}
        style={{ x }}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: 'grabbing' }}
        className="relative z-10 bg-card"
      >
        {children}
      </motion.div>
    </div>
  )
}
