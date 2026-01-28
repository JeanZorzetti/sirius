'use client'

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, ShieldCheck, ShieldAlert, Trash2 } from "lucide-react"
import { updateOrganizationPlan, deleteOrganization } from "../actions"
import { useRouter } from "next/navigation"

interface OrgActionsProps {
    orgId: string
    currentPlan: string
}

export function OrgActions({ orgId, currentPlan }: OrgActionsProps) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handlePlanChange = (plan: "FREE" | "PRO") => {
        startTransition(async () => {
            await updateOrganizationPlan(orgId, plan)
            router.refresh()
        })
    }

    const handleDelete = () => {
        if (!confirm("Are you sure? This will delete the Organization and ALL its data (Users, Deals, Contacts). This cannot be undone.")) return

        startTransition(async () => {
            await deleteOrganization(orgId)
            router.refresh()
        })
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:text-white">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-200">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(orgId)}>
                    Copy ID
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800" />

                {currentPlan === 'FREE' ? (
                    <DropdownMenuItem
                        onClick={() => handlePlanChange('PRO')}
                        className="text-indigo-400 focus:text-indigo-300 focus:bg-indigo-500/10 cursor-pointer"
                        disabled={isPending}
                    >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Upgrade to PRO
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem
                        onClick={() => handlePlanChange('FREE')}
                        className="text-yellow-400 focus:text-yellow-300 focus:bg-yellow-500/10 cursor-pointer"
                        disabled={isPending}
                    >
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        Downgrade to FREE
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-500 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                    disabled={isPending}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Organization
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
