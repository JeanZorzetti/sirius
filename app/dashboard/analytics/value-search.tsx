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
        <div className="flex flex-col gap-1">
            <Label className="text-xs text-zinc-500">Buscar por valor (R$)</Label>
            <div className="relative">
                <Input
                    type="number"
                    min={0}
                    placeholder="ex: 5000"
                    defaultValue={current}
                    className="h-8 w-36 text-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 pr-6"
                    onBlur={(e) => apply(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && apply((e.target as HTMLInputElement).value)}
                />
                {current && (
                    <button
                        onClick={() => apply('')}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                    >
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>
        </div>
    )
}
