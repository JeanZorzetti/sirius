'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'

export function ValueSearch() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const current = searchParams.get('vsearch') ?? ''

    function apply(val: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (val) params.set('vsearch', val); else params.delete('vsearch')
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="relative group flex items-center">
            <span className="absolute left-3 text-sm font-medium text-muted-foreground group-focus-within:text-primary transition-colors">R$</span>
            <Input
                type="number"
                min={0}
                placeholder="Valor..."
                defaultValue={current}
                className="h-10 w-[140px] text-sm bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-3 pl-9 placeholder:text-muted-foreground transition-all"
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
