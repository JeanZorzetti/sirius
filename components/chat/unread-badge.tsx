'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface UnreadBadgeProps {
  count: number
}

const badgeVariants = {
  initial: { 
    scale: 0, 
    opacity: 0,
    y: 10
  },
  animate: { 
    scale: 1, 
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 20,
      mass: 0.8
    }
  },
  exit: { 
    scale: 0, 
    opacity: 0,
    y: -10,
    transition: { duration: 0.15 }
  }
}

const pulseVariants = {
  initial: { 
    scale: 1,
    opacity: 1
  },
  animate: {
    scale: [1, 1.15, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

/**
 * Unread Badge Component (Fase 5 - UI/UX Premium)
 * Com micro-animações de entrada e pulse
 */
export function UnreadBadge({ count }: UnreadBadgeProps) {
  if (count === 0) return null

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={count}
        variants={badgeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="relative inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-[#25d366] rounded-full tabular-nums"
      >
        {/* Pulse effect ring */}
        <motion.span
          className="absolute inset-0 rounded-full bg-[#25d366]"
          variants={pulseVariants}
          initial="initial"
          animate="animate"
          style={{ zIndex: -1 }}
        />
        
        {/* Count with animation on change */}
        <motion.span
          key={count}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          {count > 99 ? '99+' : count}
        </motion.span>
      </motion.span>
    </AnimatePresence>
  )
}
