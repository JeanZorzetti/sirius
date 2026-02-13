'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Building2, Sun, Megaphone, Briefcase, Users, Calculator } from 'lucide-react'
import { NICHES } from '@/config/niche-data'

const NICHE_ICONS: Record<string, typeof Building2> = {
  'corretores-de-imoveis': Building2,
  'energia-solar': Sun,
  'agencias-de-marketing': Megaphone,
  'consultores-empresariais': Briefcase,
  'representantes-comerciais': Users,
}

const NICHE_LABELS: Record<string, string> = {
  'corretores-de-imoveis': 'Corretores de Imóveis',
  'energia-solar': 'Energia Solar',
  'agencias-de-marketing': 'Agências de Marketing',
  'consultores-empresariais': 'Consultores Empresariais',
  'representantes-comerciais': 'Representantes Comerciais',
}

const FERRAMENTAS = [
  { href: '/ferramentas/calculadora-roi', label: 'Calculadora ROI Geral' },
  { href: '/ferramentas/calculadora-roi-corretores', label: 'ROI para Corretores' },
  { href: '/ferramentas/calculadora-roi-energia-solar', label: 'ROI para Energia Solar' },
  { href: '/ferramentas/calculadora-roi-agencias', label: 'ROI para Agências' },
  { href: '/ferramentas/calculadora-roi-consultores', label: 'ROI para Consultores' },
  { href: '/ferramentas/calculadora-roi-representantes', label: 'ROI para Representantes' },
]

function DropdownMenu({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(true)
  }

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150)
  }

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
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50">
          <div className="min-w-[240px] rounded-xl border bg-popover/95 backdrop-blur-xl shadow-xl p-2 animate-in fade-in-0 zoom-in-95 duration-150">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

function DropdownItem({ href, icon: Icon, label, onClick }: {
  href: string
  icon?: typeof Building2
  label: string
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      {label}
    </Link>
  )
}

export function NavDropdowns() {
  return (
    <>
      <DropdownMenu label="Soluções">
        {NICHES.map((niche) => {
          const Icon = NICHE_ICONS[niche.slug] || Building2
          return (
            <DropdownItem
              key={niche.slug}
              href={`/solucoes/${niche.slug}`}
              icon={Icon}
              label={NICHE_LABELS[niche.slug] || niche.slug}
            />
          )
        })}
      </DropdownMenu>

      <DropdownMenu label="Ferramentas">
        {FERRAMENTAS.map((tool) => (
          <DropdownItem
            key={tool.href}
            href={tool.href}
            icon={Calculator}
            label={tool.label}
          />
        ))}
      </DropdownMenu>
    </>
  )
}
