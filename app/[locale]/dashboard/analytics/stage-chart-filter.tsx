'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RotateCcw } from 'lucide-react'

export function StageChartFilter() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const sfrom = searchParams.get('sfrom') ?? ''
    const sto = searchParams.get('sto') ?? ''
    const isCustom = searchParams.has('sfrom') || searchParams.has('sto')

    function apply(newFrom: string, newTo: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (newFrom) params.set('sfrom', newFrom); else params.delete('sfrom')
        if (newTo) params.set('sto', newTo); else params.delete('sto')
        router.push(`${pathname}?${params.toString()}`)
    }

    function reset() {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('sfrom')
        params.delete('sto')
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="flex items-end gap-3 flex-wrap">
            <div className="flex flex-col gap-1">
                <Label className="text-xs text-zinc-500">De</Label>
                <Input
                    type="date"
                    value={sfrom}
                    className="h-8 w-36 text-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                    onChange={(e) => apply(e.target.value, sto)}
                />
            </div>
            <div className="flex flex-col gap-1">
                <Label className="text-xs text-zinc-500">Até</Label>
                <Input
                    type="date"
                    value={sto}
                    className="h-8 w-36 text-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                    onChange={(e) => apply(sfrom, e.target.value)}
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
                    Limpar
                </Button>
            )}
        </div>
    )
}
