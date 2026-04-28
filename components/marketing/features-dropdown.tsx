'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronRight, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { FEATURE_CATEGORIES } from '@/config/features-data'
import type { FeatureCategory } from '@/config/features-data'

function CollapsibleSection({
  sectionKey,
  section,
  tFeatNav,
  tSections,
  onLinkClick,
  defaultOpen,
}: {
  sectionKey: string
  section: FeatureCategory['sections'][number]
  tFeatNav: ReturnType<typeof useTranslations>
  tSections: ReturnType<typeof useTranslations>
  onLinkClick: () => void
  defaultOpen?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultOpen ?? false)

  return (
    <div className="mb-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-[11px] font-medium text-primary/70 hover:text-primary px-2 py-1 rounded transition-colors"
      >
        <span>{tFeatNav(sectionKey as any)}</span>
        <ChevronRight
          className={`h-3 w-3 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
        />
      </button>
      {expanded && (
        <div className="mt-0.5 space-y-0.5">
          {section.features.map((feature) => (
            <Link
              key={feature.slug}
              href={`/features/${feature.slug}` as any}
              onClick={onLinkClick}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <feature.icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {tSections(`${section.sectionKey}.${feature.featureKey}.name` as any)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function FeaturesDropdown() {
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tNav = useTranslations('marketing.home.nav')
  const tFeatNav = useTranslations('marketing.features.nav')
  const tSections = useTranslations('marketing.features.sections')

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(true)
  }

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 200)
  }

  const updateDropdownPosition = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const dropdownWidth = Math.min(720, window.innerWidth - 32)
    const centeredLeft = rect.left + rect.width / 2 - dropdownWidth / 2
    const margin = 16
    const clampedLeft = Math.max(margin, Math.min(centeredLeft, window.innerWidth - dropdownWidth - margin))
    const offsetFromCenter = clampedLeft - centeredLeft
    setDropdownStyle({ transform: `translateX(calc(-50% + ${offsetFromCenter}px))` })
  }, [])

  useEffect(() => {
    if (open) updateDropdownPosition()
  }, [open, updateDropdownPosition])

  useEffect(() => {
    if (!open) return
    window.addEventListener('resize', updateDropdownPosition)
    return () => window.removeEventListener('resize', updateDropdownPosition)
  }, [open, updateDropdownPosition])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {tNav('features')}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-1/2 pt-2 z-50" style={{ ...dropdownStyle, width: `min(720px, calc(100vw - 2rem))` }}>
          <div className="w-full max-h-[70vh] overflow-y-auto rounded-xl border bg-popover/95 backdrop-blur-xl shadow-xl p-4 animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="grid grid-cols-3 gap-6">
              {FEATURE_CATEGORIES.map((cat, catIdx) => (
                <div key={cat.menuKey}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-2">
                    {tNav(`features_menu.${cat.menuKey}` as any)}
                  </h3>
                  <div className="space-y-0.5">
                    {cat.sections.map((sec, secIdx) => (
                      <CollapsibleSection
                        key={sec.sectionKey}
                        sectionKey={sec.sectionKey}
                        section={sec}
                        tFeatNav={tFeatNav}
                        tSections={tSections}
                        onLinkClick={() => setOpen(false)}
                        defaultOpen={catIdx === 0 && secIdx === 0}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer link */}
            <div className="mt-4 pt-3 border-t">
              <Link
                href="/features"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors py-1"
              >
                {tNav('features_menu.all_features' as any)}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
