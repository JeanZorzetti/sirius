'use client'

import { useState } from 'react'
import { Menu, ChevronDown, ChevronRight, Building2, Sun, Megaphone, Briefcase, Users, Calculator, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { NICHES } from '@/config/niche-data'
import { FEATURE_CATEGORIES } from '@/config/features-data'

const NICHE_ICONS: Record<string, typeof Building2> = {
    'corretores-de-imoveis': Building2,
    'energia-solar': Sun,
    'agencias-de-marketing': Megaphone,
    'consultores-empresariais': Briefcase,
    'representantes-comerciais': Users,
}

const FERRAMENTAS_KEYS = [
    { href: '/ferramentas/calculadora-roi' as const, tKey: 'roi_general' },
    { href: '/ferramentas/calculadora-roi-corretores' as const, tKey: 'roi_realtors' },
    { href: '/ferramentas/calculadora-roi-energia-solar' as const, tKey: 'roi_solar' },
    { href: '/ferramentas/calculadora-roi-agencias' as const, tKey: 'roi_agencies' },
    { href: '/ferramentas/calculadora-roi-consultores' as const, tKey: 'roi_consultants' },
    { href: '/ferramentas/calculadora-roi-representantes' as const, tKey: 'roi_reps' },
]

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
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

function MobileCollapsibleSub({ title, children }: { title: string; children: React.ReactNode }) {
    const [expanded, setExpanded] = useState(false)
    return (
        <div className="mb-1">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center justify-between w-full text-[11px] font-medium text-primary/70 hover:text-primary py-0.5 transition-colors"
            >
                {title}
                <ChevronRight className={`h-3 w-3 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
            </button>
            {expanded && (
                <div className="ml-2 mt-0.5 flex flex-col gap-0.5 border-l border-muted pl-2">
                    {children}
                </div>
            )}
        </div>
    )
}

export function MobileNav() {
    const [open, setOpen] = useState(false)
    const tNav = useTranslations('marketing.home.nav')
    const tNiches = useTranslations('marketing.home.niche_labels')
    const tFeatNav = useTranslations('marketing.features.nav')
    const tSections = useTranslations('marketing.features.sections')

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
                    <CollapsibleSection title={tNav('features')}>
                        {FEATURE_CATEGORIES.map((cat) => (
                            <div key={cat.menuKey} className="mb-2">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                                    {tNav(`features_menu.${cat.menuKey}` as any)}
                                </p>
                                {cat.sections.map((sec) => (
                                    <MobileCollapsibleSub key={sec.sectionKey} title={tFeatNav(sec.sectionKey as any)}>
                                        {sec.features.map((feature) => (
                                            <Link
                                                key={feature.slug}
                                                href={`/features/${feature.slug}` as any}
                                                onClick={() => setOpen(false)}
                                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-0.5"
                                            >
                                                <feature.icon className="h-3.5 w-3.5 shrink-0" />
                                                {tSections(`${sec.sectionKey}.${feature.featureKey}.name` as any)}
                                            </Link>
                                        ))}
                                    </MobileCollapsibleSub>
                                ))}
                            </div>
                        ))}
                        <Link
                            href="/features"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors mt-1"
                        >
                            {tNav('features_menu.all_features' as any)}
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </CollapsibleSection>

                    <CollapsibleSection title={tNav('solutions')}>
                        {NICHES.map((niche) => {
                            const Icon = NICHE_ICONS[niche.slug] || Building2
                            return (
                                <Link
                                    key={niche.slug}
                                    href={`/solucoes/${niche.slug}` as any}
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Icon className="h-4 w-4" />
                                    {tNiches(niche.slug as any)}
                                </Link>
                            )
                        })}
                    </CollapsibleSection>

                    <CollapsibleSection title={tNav('tools')}>
                        {FERRAMENTAS_KEYS.map((tool) => (
                            <Link
                                key={tool.href}
                                href={tool.href}
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Calculator className="h-4 w-4" />
                                {tNav(`tools_labels.${tool.tKey}` as any)}
                            </Link>
                        ))}
                    </CollapsibleSection>

                    <Link
                        href="/pricing"
                        onClick={() => setOpen(false)}
                        className="text-sm font-medium transition-colors hover:text-primary"
                    >
                        {tNav('pricing')}
                    </Link>
                    <Link
                        href="/blog"
                        onClick={() => setOpen(false)}
                        className="text-sm font-medium transition-colors hover:text-primary"
                    >
                        {tNav('blog')}
                    </Link>
                    <Link
                        href="/fundadores"
                        onClick={() => setOpen(false)}
                        className="text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1"
                    >
                        <span>⭐</span>
                        {tNav('founders')}
                    </Link>
                    <div className="border-t pt-4 mt-4 flex flex-col gap-4">
                        <Button variant="outline" asChild className="w-full justify-start">
                            <Link href="/login" onClick={() => setOpen(false)}>{tNav('login')}</Link>
                        </Button>
                        <Button asChild className="w-full justify-start">
                            <Link href="/register" onClick={() => setOpen(false)}>{tNav('startFree')}</Link>
                        </Button>
                    </div>
                </nav>
            </SheetContent>
        </Sheet>
    )
}
