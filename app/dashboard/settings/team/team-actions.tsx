'use client'

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { removeMember, revokeInvite } from "./actions"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { toast } from "sonner"

export function RemoveMemberButton({ userId }: { userId: string }) {
    const [isPending, startTransition] = useTransition()
    const [confirmOpen, setConfirmOpen] = useState(false)

    const handleRemove = () => {
        startTransition(async () => {
            try {
                await removeMember(userId)
                toast.success("Membro removido com sucesso")
            } catch {
                toast.error("Erro ao remover membro")
            }
        })
    }

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => setConfirmOpen(true)}
                disabled={isPending}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Remover membro"
                description="Tem certeza que deseja remover este membro da equipe? Ele perderá acesso ao CRM."
                confirmLabel="Remover"
                onConfirm={handleRemove}
            />
        </>
    )
}

export function RevokeInviteButton({ inviteId }: { inviteId: string }) {
    const [isPending, startTransition] = useTransition()
    const [confirmOpen, setConfirmOpen] = useState(false)

    const handleRevoke = () => {
        startTransition(async () => {
            try {
                await revokeInvite(inviteId)
                toast.success("Convite revogado com sucesso")
            } catch {
                toast.error("Erro ao revogar convite")
            }
        })
    }

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700"
                onClick={() => setConfirmOpen(true)}
                disabled={isPending}
            >
                Revogar
            </Button>
            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Revogar convite"
                description="Tem certeza que deseja revogar este convite? O link de convite deixará de funcionar."
                confirmLabel="Revogar"
                onConfirm={handleRevoke}
            />
        </>
    )
}
