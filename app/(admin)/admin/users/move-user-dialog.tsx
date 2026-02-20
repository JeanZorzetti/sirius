'use client'

import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ArrowRightLeft, Loader2 } from "lucide-react"
import { moveUserToOrganization } from "../actions"
import { toast } from "sonner"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface Org {
    id: string
    name: string
    tier: string
    _count: { users: number }
}

interface MoveUserDialogProps {
    userId: string
    userName: string
    currentOrgId: string
}

export function MoveUserDialog({ userId, userName, currentOrgId }: MoveUserDialogProps) {
    const [open, setOpen] = useState(false)
    const [orgs, setOrgs] = useState<Org[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedOrgId, setSelectedOrgId] = useState("")
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        if (!open) return
        setLoading(true)
        fetch('/api/admin/users')
            .then(r => r.json())
            .then(d => setOrgs((d.organizations || []).filter((o: Org) => o.id !== currentOrgId)))
            .finally(() => setLoading(false))
    }, [open, currentOrgId])

    const handleMove = () => {
        if (!selectedOrgId) return
        startTransition(async () => {
            try {
                await moveUserToOrganization(userId, selectedOrgId)
                toast.success(`${userName} movido com sucesso`)
                setOpen(false)
                setSelectedOrgId("")
                window.location.reload()
            } catch (e: any) {
                toast.error(e.message)
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10"
                            >
                                <ArrowRightLeft className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Mover para outra organização</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Mover Usuário</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Mover <strong className="text-zinc-300">{userName}</strong> para outra organização.
                        O usuário perderá o papel atual e entrará como MEMBER.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                        </div>
                    ) : (
                        <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                            <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-100">
                                <SelectValue placeholder="Selecione a organização de destino" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 max-h-[240px]">
                                {orgs.length === 0 ? (
                                    <SelectItem value="-" disabled>Nenhuma outra organização</SelectItem>
                                ) : (
                                    orgs.map(org => (
                                        <SelectItem key={org.id} value={org.id}>
                                            {org.name} <span className="text-zinc-500">({org.tier} · {org._count.users} usuários)</span>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleMove}
                        disabled={!selectedOrgId || isPending}
                        className="bg-amber-600 hover:bg-amber-700"
                    >
                        {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Mover
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
