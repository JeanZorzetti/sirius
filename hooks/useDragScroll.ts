"use client"

import { useRef, useEffect } from 'react'

export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleMouseDown = (e: MouseEvent) => {
      // Only start drag if not clicking on interactive elements or drag handles
      const target = e.target as HTMLElement

      // CRITICAL: Check for drag handle FIRST - must not interfere with dnd-kit
      if (
        target.closest('[data-drag-handle="true"]') ||
        target.hasAttribute('data-drag-handle') ||
        target.closest('[data-dnd-kit-drag-handle]') ||
        target.closest('.cursor-grab')
      ) {
        return // Let dnd-kit handle this
      }

      // Check other interactive elements
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT' ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('[role="button"]') ||
        target.closest('a') ||
        (target as any).draggable === true
      ) {
        return
      }

      // Prevent text selection during scroll drag
      e.preventDefault()

      isDragging.current = true
      startX.current = e.pageX - element.offsetLeft
      scrollLeft.current = element.scrollLeft
      element.style.cursor = 'grabbing'
      element.style.userSelect = 'none'
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      e.preventDefault()
      const x = e.pageX - element.offsetLeft
      const walk = (x - startX.current) * 2 // Scroll speed multiplier
      element.scrollLeft = scrollLeft.current - walk
    }

    const handleMouseUp = () => {
      isDragging.current = false
      element.style.cursor = 'grab'
      element.style.userSelect = ''
    }

    const handleMouseLeave = () => {
      if (isDragging.current) {
        isDragging.current = false
        element.style.cursor = 'grab'
        element.style.userSelect = ''
      }
    }

    element.addEventListener('mousedown', handleMouseDown)
    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseup', handleMouseUp)
    element.addEventListener('mouseleave', handleMouseLeave)

    // Set initial cursor
    element.style.cursor = 'grab'

    return () => {
      element.removeEventListener('mousedown', handleMouseDown)
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseup', handleMouseUp)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return ref
}
