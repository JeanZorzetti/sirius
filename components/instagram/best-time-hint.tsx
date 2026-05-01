'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { isGoodTime, PostType } from '@/lib/instagram/scheduling'

export function BestTimeHint({ scheduledFor, postType }: { scheduledFor: string; postType: PostType }) {
  const good = scheduledFor ? isGoodTime(new Date(scheduledFor), postType) : false

  return (
    <AnimatePresence>
      {good && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-2.5 py-1.5"
        >
          <Sparkles className="h-3 w-3" />
          Bom horário para {postType === 'feed' ? 'Feed' : postType === 'carousel' ? 'Carrossel' : 'Stories'} ✓
        </motion.div>
      )}
    </AnimatePresence>
  )
}
