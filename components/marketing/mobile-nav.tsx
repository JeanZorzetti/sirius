'use client'

import Link from 'next/link'
import { Menu, ChevronDown, Building2, Sun, Megaphone, Briefcase, Users, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from '@/components/ui/sheet'
import { useState } from 'react'
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

function CollapsibleSection({ title, children, onNavigate }: {
    title: string
    children: React.ReactNode
    onNavigate: () => void
}) {
    const [expanded, setExpanded] = useState(false)

    return (
        <div>
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center justify-between w-full text-sm font-medium transition-colors hover:text-primary py-1"
            >
                {title}
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
            </button>
            {expanded && (
                <div className="ml-3 mt-2 flex flex-col gap-2 border-l-2 border-muted pl-3">
                    {children}
                </div>
            )}
        </div>
    )
}

export function MobileNav() {
    const [open, setOpen] = useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" className="md:hidden" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left">
                <nav className="flex flex-col gap-4 mt-8">
                    <Link
                        href="/features"
                        onClick={() => setOpen(false)}
                        className="text-sm font-medium transition-colors hover:text-primary"
                    >
                        Funcionalidades
                    </Link>

                    <CollapsibleSection title="Soluções por Segmento" onNavigate={() => setOpen(false)}>
                        {NICHES.map((niche) => {
                            const Icon = NICHE_ICONS[niche.slug] || Building2
                            return (
                                <Link
                                    key={niche.slug}
                                    href={`/solucoes/${niche.slug}`}
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Icon className="h-4 w-4" />
                                    {NICHE_LABELS[niche.slug] || niche.slug}
                                </Link>
                            )
                        })}
                    </CollapsibleSection>

                    <CollapsibleSection title="Ferramentas Grátis" onNavigate={() => setOpen(false)}>
                        {FERRAMENTAS.map((tool) => (
                            <Link
                                key={tool.href}
                                href={tool.href}
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Calculator className="h-4 w-4" />
                                {tool.label}
                            </Link>
                        ))}
                    </CollapsibleSection>

                    <Link
                        href="/pricing"
                        onClick={() => setOpen(false)}
                        className="text-sm font-medium transition-colors hover:text-primary"
                    >
                        Preços
                    </Link>
                    <Link
                        href="/blog"
                        onClick={() => setOpen(false)}
                        className="text-sm font-medium transition-colors hover:text-primary"
                    >
                        Blog
                    </Link>
                    <Link
                        href="/fundadores"
                        onClick={() => setOpen(false)}
                        className="text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1"
                    >
                        <span>⭐</span>
                        Fundadores — 41% OFF vitalício
                    </Link>
                    <div className="border-t pt-4 mt-4 flex flex-col gap-4">
                        <Button variant="outline" asChild className="w-full justify-start">
                            <Link href="/login" onClick={() => setOpen(false)}>Entrar</Link>
                        </Button>
                        <Button asChild className="w-full justify-start">
                            <Link href="/register" onClick={() => setOpen(false)}>Começar Grátis</Link>
                        </Button>
                    </div>
                </nav>
            </SheetContent>
        </Sheet>
    )
}
