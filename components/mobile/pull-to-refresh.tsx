'use client'

import { useRef, useState, useCallback } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void>
  threshold?: number
}

const THRESHOLD = 70

export function PullToRefresh({ children, onRefresh, threshold = THRESHOLD }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef<number | null>(null)
  const pullY = useMotionValue(0)
  const isTriggered = useRef(false)

  const iconOpacity = useTransform(pullY, [0, threshold / 2, threshold], [0, 0.5, 1])
  const iconRotate = useTransform(pullY, [0, threshold], [0, 360])
  const iconScale = useTransform(pullY, [0, threshold], [0.5, 1])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY > 0) return
    startY.current = e.touches[0].clientY
    isTriggered.current = false
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (startY.current === null || isRefreshing) return
      const delta = e.touches[0].clientY - startY.current
      if (delta < 0 || window.scrollY > 0) return
      pullY.set(Math.min(delta * 0.5, threshold * 1.5))
    },
    [isRefreshing, pullY, threshold]
  )

  const handleTouchEnd = useCallback(async () => {
    if (startY.current === null) return
    startY.current = null

    if (pullY.get() >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      try {
        const { triggerHaptic } = await import('@/lib/mobile/haptics')
        triggerHaptic('success')
      } catch {}
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        pullY.set(0)
      }
    } else {
      pullY.set(0)
    }
  }, [pullY, threshold, isRefreshing, onRefresh])

  return (
    <div
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center"
        style={{ height: pullY }}
      >
        <motion.div
          style={{ opacity: iconOpacity, scale: iconScale, rotate: isRefreshing ? undefined : iconRotate }}
          animate={isRefreshing ? { rotate: 360 } : {}}
          transition={isRefreshing ? { duration: 0.8, repeat: Infinity, ease: 'linear' } : {}}
        >
          <RefreshCw className="h-5 w-5 text-primary" />
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div style={{ y: pullY }}>
        {children}
      </motion.div>
    </div>
  )
}
