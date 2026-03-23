'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, X } from 'lucide-react'

export function ContactSearch() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const current = searchParams.get('csearch') ?? ''

    function apply(val: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (val.trim()) params.set('csearch', val.trim()); else params.delete('csearch')
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
                type="text"
                placeholder="Buscar por contato..."
                defaultValue={current}
                className="h-10 w-[200px] sm:w-[260px] text-sm bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-3 pl-9 placeholder:text-muted-foreground transition-all"
                onBlur={(e) => apply(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && apply((e.target as HTMLInputElement).value)}
            />
            {current && (
                <button
                    onClick={() => apply('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    )
}
