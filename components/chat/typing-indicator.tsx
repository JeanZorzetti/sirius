'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TypingIndicatorProps {
  className?: string
  variant?: 'bubble' | 'inline'
}

// Dot animation variants
const dotVariants = {
  animate: {
    y: [0, -6, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  }
}

const containerVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.2,
      staggerChildren: 0.1
    }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { duration: 0.15 }
  }
}

/**
 * Typing Indicator Component (Fase 5 - UI/UX Premium)
 * Com animações suaves dos 3 pontinhos
 */
export function TypingIndicator({ className, variant = 'bubble' }: TypingIndicatorProps) {
  const Dot = ({ delay }: { delay: number }) => (
    <motion.div
      className={cn(
        "rounded-full",
        variant === 'inline' 
          ? "w-1.5 h-1.5 bg-[#00a884]" 
          : "w-2 h-2 bg-[#8696a0]"
      )}
      variants={dotVariants}
      animate="animate"
      style={{ animationDelay: `${delay}s` }}
      transition={{ delay }}
    />
  )

  if (variant === 'inline') {
    return (
      <motion.div 
        className={cn('flex items-center gap-1.5', className)}
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <span className="text-[13px] text-[#00a884] font-normal italic">digitando</span>
        <div className="flex items-center gap-0.5">
          <Dot delay={0} />
          <Dot delay={0.15} />
          <Dot delay={0.3} />
        </div>
      </motion.div>
    )
  }

  // Bubble variant
  return (
    <motion.div 
      className={cn('flex justify-start', className)}
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="bg-white dark:bg-zinc-800 rounded-[18px] px-4 py-3 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] flex items-center gap-1.5 min-w-[60px]">
        <Dot delay={0} />
        <Dot delay={0.15} />
        <Dot delay={0.3} />
      </div>
    </motion.div>
  )
}
