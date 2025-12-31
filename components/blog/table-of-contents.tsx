'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface Heading {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  content: string
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    // Extract H2 and H3 from HTML string
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/html')
    const headingElements = doc.querySelectorAll('h2, h3')

    const extractedHeadings: Heading[] = []
    headingElements.forEach((heading, index) => {
      const text = heading.textContent || ''
      const id = `heading-${index}`
      const level = parseInt(heading.tagName.substring(1))

      extractedHeadings.push({ id, text, level })
    })

    setHeadings(extractedHeadings)
  }, [content])

  useEffect(() => {
    // Observe headings in viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-100px 0px -80% 0px' }
    )

    // Add IDs to actual headings in the DOM
    document.querySelectorAll('article h2, article h3').forEach((heading, index) => {
      heading.id = `heading-${index}`
      observer.observe(heading)
    })

    return () => observer.disconnect()
  }, [headings])

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 100
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      })
    }
  }

  if (headings.length === 0) return null

  return (
    <nav className="sticky top-24 hidden lg:block">
      <div className="bg-card/50 backdrop-blur-sm rounded-2xl border p-6 shadow-sm">
        <h4 className="font-bold text-sm uppercase tracking-wide text-muted-foreground mb-4">
          Neste Artigo
        </h4>
        <ul className="space-y-2 text-sm">
          {headings.map((heading) => (
            <li
              key={heading.id}
              className={cn(
                heading.level === 3 && 'ml-4'
              )}
            >
              <button
                onClick={() => scrollToHeading(heading.id)}
                className={cn(
                  'text-left w-full py-1.5 px-3 rounded-lg transition-all border-l-2',
                  activeId === heading.id
                    ? 'border-primary bg-primary/5 text-primary font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {heading.text}
              </button>
            </li>
          ))}
        </ul>

        {/* Reading Progress */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Tempo de leitura: 10 min</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Atualizado recentemente</span>
          </div>
        </div>
      </div>
    </nav>
  )
}
