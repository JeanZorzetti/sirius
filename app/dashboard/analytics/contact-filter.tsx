'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X } from 'lucide-react'

interface Contact {
    id: string
    name: string
}

interface Props {
    contacts: Contact[]
}

export function ContactFilter({ contacts }: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const cid = searchParams.get('cid') ?? ''
    const isFiltered = !!cid

    function select(value: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (value && value !== 'all') {
            params.set('cid', value)
        } else {
            params.delete('cid')
        }
        router.push(`${pathname}?${params.toString()}`)
    }

    function clear() {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('cid')
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="flex items-end gap-3 flex-wrap">
            <div className="flex flex-col gap-1">
                <Label className="text-xs text-zinc-500">Contato / Cliente</Label>
                <Select value={cid || 'all'} onValueChange={select}>
                    <SelectTrigger className="h-8 w-48 text-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700">
                        <SelectValue placeholder="Todos os contatos" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os contatos</SelectItem>
                        {contacts.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {isFiltered && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clear}
                    className="h-8 text-xs text-zinc-500 hover:text-zinc-700 gap-1"
                >
                    <X className="h-3.5 w-3.5" />
                    Limpar
                </Button>
            )}
        </div>
    )
}
