'use client'

import * as React from 'react'
import { useDrag } from '@use-gesture/react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { cn } from '@/lib/utils'
import { hapticImpact } from '@/lib/mobile/haptics'
import { useMediaQuery } from '@/hooks/use-media-query'

export interface SwipeAction {
  /** Ícone renderizado (Lucide). */
  icon: React.ReactNode
  /** Rótulo curto exibido sob o ícone (opcional). */
  label?: string
  /** Cor de fundo tailwind (ex: 'bg-green-500'). */
  background: string
  /** Callback disparado quando a ação é confirmada. */
  onAction: () => void
}

interface SwipeableRowProps {
  /** Ação revelada ao arrastar para a direita (left→right). */
  leftAction?: SwipeAction
  /** Ação revelada ao arrastar para a esquerda (right→left). */
  rightAction?: SwipeAction
  /** Distância em px para confirmar a ação. Default: 80. */
  threshold?: number
  /** Desativa os gestos (útil em desktop ou quando linha está em edição). */
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

/**
 * SwipeableRow — envolve qualquer card/linha e adiciona swipe horizontal
 * para revelar ações à esquerda e/ou direita.
 *
 * - Feedback tátil ao cruzar o threshold (haptic Light Impact)
 * - Snap de volta com spring ao soltar antes do threshold
 * - Acessibilidade: usuário pode ignorar gestos; ações também devem
 *   estar disponíveis via botões tradicionais no card.
 */
export function SwipeableRow({
  leftAction,
  rightAction,
  threshold = 80,
  disabled = false,
  className,
  children,
}: SwipeableRowProps) {
  // Em viewports desktop (lg+), desabilita gestos para não interferir com
  // drag-and-drop do kanban, hover states e seleção de texto.
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const effectiveDisabled = disabled || isDesktop

  const x = useMotionValue(0)
  const [triggered, setTriggered] = React.useState<'left' | 'right' | null>(null)
  const hasLeft = !!leftAction
  const hasRight = !!rightAction

  // Background fading in/out conforme o drag
  const leftOpacity = useTransform(x, [0, threshold], [0, 1])
  const rightOpacity = useTransform(x, [-threshold, 0], [1, 0])

  const bind = useDrag(
    ({ down, movement: [mx], velocity: [vx], cancel }) => {
      if (effectiveDisabled) {
        cancel?.()
        return
      }

      // Bloqueia swipe na direção de uma ação inexistente
      if (mx > 0 && !hasLeft) {
        cancel?.()
        return
      }
      if (mx < 0 && !hasRight) {
        cancel?.()
        return
      }

      if (down) {
        x.set(mx)
        // Haptic ao cruzar o threshold pela primeira vez
        if (mx > threshold && triggered !== 'left') {
          setTriggered('left')
          hapticImpact('light')
        } else if (mx < -threshold && triggered !== 'right') {
          setTriggered('right')
          hapticImpact('light')
        } else if (Math.abs(mx) < threshold && triggered) {
          setTriggered(null)
        }
      } else {
        // Soltou — decide ação ou snap back
        const fastEnough = Math.abs(vx) > 0.4
        const farEnough = Math.abs(mx) > threshold
        if (mx > 0 && hasLeft && (farEnough || fastEnough)) {
          leftAction?.onAction()
        } else if (mx < 0 && hasRight && (farEnough || fastEnough)) {
          rightAction?.onAction()
        }
        animate(x, 0, { type: 'spring', stiffness: 400, damping: 35 })
        setTriggered(null)
      }
    },
    {
      axis: 'x',
      pointer: { touch: true },
      filterTaps: true,
      preventScroll: true,
    },
  )

  return (
    <div className={cn('relative overflow-hidden rounded-2xl', className)}>
      {/* Left action background */}
      {hasLeft && (
        <motion.div
          style={{ opacity: leftOpacity }}
          className={cn(
            'absolute inset-y-0 left-0 flex items-center justify-start pl-6 text-white',
            leftAction!.background,
          )}
        >
          <div className="flex flex-col items-center gap-1">
            {leftAction!.icon}
            {leftAction!.label && (
              <span className="text-[10px] font-semibold uppercase tracking-wide">
                {leftAction!.label}
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Right action background */}
      {hasRight && (
        <motion.div
          style={{ opacity: rightOpacity }}
          className={cn(
            'absolute inset-y-0 right-0 flex items-center justify-end pr-6 text-white',
            rightAction!.background,
          )}
        >
          <div className="flex flex-col items-center gap-1">
            {rightAction!.icon}
            {rightAction!.label && (
              <span className="text-[10px] font-semibold uppercase tracking-wide">
                {rightAction!.label}
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Content — o elemento que efetivamente move */}
      <SwipeableContent
        bind={bind}
        x={x}
        disabled={effectiveDisabled}
      >
        {children}
      </SwipeableContent>
    </div>
  )
}

// Subcomponente isolado para tipar corretamente o spread do useDrag
function SwipeableContent({
  bind,
  x,
  disabled,
  children,
}: {
  bind: ReturnType<typeof useDrag>
  x: ReturnType<typeof useMotionValue<number>>
  disabled: boolean
  children: React.ReactNode
}) {
  const dragHandlers = disabled ? {} : bind()
  return (
    <motion.div
      {...(dragHandlers as Record<string, unknown>)}
      style={{ x, touchAction: disabled ? 'auto' : 'pan-y' }}
      className="relative will-change-transform"
    >
      {children}
    </motion.div>
  )
}
