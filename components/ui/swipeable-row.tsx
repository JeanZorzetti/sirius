'use client'

import * as React from 'react'
import { useDrag } from '@use-gesture/react'
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

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

/**
 * SwipeableRow — envolve qualquer card/linha e adiciona swipe horizontal
 * para revelar ações à esquerda e/ou direita.
 *
 * - Feedback tátil ao cruzar o threshold (haptic Light Impact)
 * - Snap de volta com easing ao soltar antes do threshold
 * - Acessibilidade: usuário pode ignorar gestos; ações também devem
 *   estar disponíveis via botões tradicionais no card.
 *
 * O movimento é aplicado direto no DOM (transform/opacity por ref) com
 * transição CSS no snap-back — framer-motion fazia o mesmo e custava a
 * lib inteira no chunk do dashboard (o kanban usa este componente).
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

  const contentRef = React.useRef<HTMLDivElement>(null)
  const leftBgRef = React.useRef<HTMLDivElement>(null)
  const rightBgRef = React.useRef<HTMLDivElement>(null)
  // Só lógica de haptic — não participa do render, então ref e não state
  const triggeredRef = React.useRef<'left' | 'right' | null>(null)
  const hasLeft = !!leftAction
  const hasRight = !!rightAction

  // Move o conteúdo e ajusta a opacidade dos fundos conforme o drag;
  // `animated` liga a transição CSS (snap-back ao soltar)
  const setX = React.useCallback((mx: number, animated: boolean) => {
    const transition = animated ? 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)' : 'none'
    const opacityTransition = animated ? 'opacity 0.3s ease' : 'none'
    if (contentRef.current) {
      contentRef.current.style.transition = transition
      contentRef.current.style.transform = `translateX(${mx}px)`
    }
    if (leftBgRef.current) {
      leftBgRef.current.style.transition = opacityTransition
      leftBgRef.current.style.opacity = String(clamp01(mx / threshold))
    }
    if (rightBgRef.current) {
      rightBgRef.current.style.transition = opacityTransition
      rightBgRef.current.style.opacity = String(clamp01(-mx / threshold))
    }
  }, [threshold])

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
        setX(mx, false)
        // Haptic ao cruzar o threshold pela primeira vez
        if (mx > threshold && triggeredRef.current !== 'left') {
          triggeredRef.current = 'left'
          hapticImpact('light')
        } else if (mx < -threshold && triggeredRef.current !== 'right') {
          triggeredRef.current = 'right'
          hapticImpact('light')
        } else if (Math.abs(mx) < threshold && triggeredRef.current) {
          triggeredRef.current = null
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
        setX(0, true)
        triggeredRef.current = null
      }
    },
    {
      axis: 'x',
      pointer: { touch: true },
      filterTaps: true,
    },
  )

  const dragHandlers = effectiveDisabled ? {} : bind()

  return (
    <div className={cn('relative overflow-hidden rounded-2xl', className)}>
      {/* Left action background */}
      {hasLeft && (
        <div
          ref={leftBgRef}
          style={{ opacity: 0 }}
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
        </div>
      )}

      {/* Right action background */}
      {hasRight && (
        <div
          ref={rightBgRef}
          style={{ opacity: 0 }}
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
        </div>
      )}

      {/* Content — o elemento que efetivamente move */}
      <div
        ref={contentRef}
        {...(dragHandlers as Record<string, unknown>)}
        style={{ touchAction: effectiveDisabled ? 'auto' : 'pan-y' }}
        className="relative will-change-transform"
      >
        {children}
      </div>
    </div>
  )
}
