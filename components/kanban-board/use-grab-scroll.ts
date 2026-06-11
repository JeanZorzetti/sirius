'use client'

import { useEffect, useRef } from 'react'

/**
 * Grab-to-scroll horizontal: drag the board background (not cards/buttons)
 * to scroll the column strip.
 */
export function useGrabScroll() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isDraggingScroll = useRef(false)
  const dragStartX = useRef(0)
  const scrollStartX = useRef(0)

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const onMouseDown = (e: MouseEvent) => {
      // Only activate on middle-click or when clicking the container background (not cards)
      const target = e.target as HTMLElement
      if (target.closest('[data-rfd-draggable-id]') || target.closest('button') || target.closest('input')) return
      isDraggingScroll.current = true
      dragStartX.current = e.clientX
      scrollStartX.current = el.scrollLeft
      el.style.cursor = 'grabbing'
      el.style.userSelect = 'none'
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingScroll.current) return
      const dx = e.clientX - dragStartX.current
      el.scrollLeft = scrollStartX.current - dx
    }

    const onMouseUp = () => {
      if (!isDraggingScroll.current) return
      isDraggingScroll.current = false
      el.style.cursor = ''
      el.style.userSelect = ''
    }

    el.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      el.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return scrollContainerRef
}
