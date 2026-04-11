'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface LazyOnVisibleProps {
  /**
   * Conteúdo que será montado apenas quando o placeholder entrar
   * (ou estiver próximo de entrar) no viewport.
   */
  children: React.ReactNode
  /**
   * Placeholder renderizado antes do conteúdo aparecer. Geralmente um
   * skeleton com a altura mínima do conteúdo real, para evitar layout shift.
   */
  fallback?: React.ReactNode
  /**
   * Margem de pré-carregamento. Default: '200px' — começa a montar quando
   * o placeholder está a 200px de entrar no viewport.
   */
  rootMargin?: string
  /**
   * Se true, mantém o componente montado depois que ele aparece (default).
   * Se false, desmonta quando sai do viewport (não recomendado para charts).
   */
  keepMounted?: boolean
  /**
   * Altura mínima reservada para evitar layout shift. Pode passar Tailwind
   * (ex: 'min-h-[300px]') ou usar o fallback para controlar isso.
   */
  className?: string
}

/**
 * LazyOnVisible — monta o conteúdo filho apenas quando o placeholder entra
 * no viewport via IntersectionObserver.
 *
 * Uso típico: envolver charts pesados (Recharts), tabelas grandes, mapas etc.
 *
 * ```tsx
 * <LazyOnVisible fallback={<ChartSkeleton />}>
 *   <OverviewChart data={data} />
 * </LazyOnVisible>
 * ```
 *
 * O IntersectionObserver é desfeito após a primeira interseção (one-shot)
 * quando keepMounted=true (default), evitando overhead.
 */
export function LazyOnVisible({
  children,
  fallback = null,
  rootMargin = '200px',
  keepMounted = true,
  className,
}: LazyOnVisibleProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const node = ref.current
    if (!node) return

    // Fallback para browsers sem IntersectionObserver: monta imediatamente
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            if (keepMounted) {
              observer.disconnect()
            }
          } else if (!keepMounted) {
            setVisible(false)
          }
        }
      },
      { rootMargin },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [rootMargin, keepMounted])

  return (
    <div ref={ref} className={cn(className)}>
      {visible ? children : fallback}
    </div>
  )
}
