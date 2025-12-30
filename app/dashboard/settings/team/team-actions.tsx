'use client'

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { removeMember, revokeInvite } from "./actions"

export function RemoveMemberButton({ userId }: { userId: string }) {
    const [isPending, startTransition] = useTransition()

    const handleRemove = async () => {
        if (!confirm("Tem certeza que deseja remover este membro?")) return

        startTransition(async () => {
            try {
                await removeMember(userId)
            } catch (error) {
                alert("Erro ao remover membro")
                console.error(error)
            }
        })
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={handleRemove}
            disabled={isPending}
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    )
}

export function RevokeInviteButton({ inviteId }: { inviteId: string }) {
    const [isPending, startTransition] = useTransition()

    const handleRevoke = async () => {
        if (!confirm("Tem certeza que deseja revogar este convite?")) return

        startTransition(async () => {
            try {
                await revokeInvite(inviteId)
            } catch (error) {
                alert("Erro ao revogar convite")
                console.error(error)
            }
        })
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700"
            onClick={handleRevoke}
            disabled={isPending}
        >
            Revogar
        </Button>
    )
}
