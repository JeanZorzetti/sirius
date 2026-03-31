'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RotateCcw } from 'lucide-react'

const DEFAULT_FROM = '2025-01'

function currentYearMonth() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function MonthlyChartFilter() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const mfrom = searchParams.get('mfrom') ?? DEFAULT_FROM
    const mto = searchParams.get('mto') ?? currentYearMonth()
    const isCustom = searchParams.has('mfrom') || searchParams.has('mto')

    function apply(newFrom: string, newTo: string) {
        const params = new URLSearchParams(searchParams.toString())
        params.set('mfrom', newFrom)
        params.set('mto', newTo)
        router.push(`${pathname}?${params.toString()}`)
    }

    function reset() {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('mfrom')
        params.delete('mto')
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="flex items-end gap-3 flex-wrap">
            <div className="flex flex-col gap-1">
                <Label className="text-xs text-zinc-500">De</Label>
                <Input
                    type="month"
                    value={mfrom}
                    className="h-8 w-36 text-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                    onChange={(e) => apply(e.target.value, mto)}
                />
            </div>
            <div className="flex flex-col gap-1">
                <Label className="text-xs text-zinc-500">Até</Label>
                <Input
                    type="month"
                    value={mto}
                    className="h-8 w-36 text-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                    onChange={(e) => apply(mfrom, e.target.value)}
                />
            </div>
            {isCustom && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={reset}
                    className="h-8 text-xs text-zinc-500 hover:text-zinc-700 gap-1"
                >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restaurar padrão
                </Button>
            )}
        </div>
    )
}
