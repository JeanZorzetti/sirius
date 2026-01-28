'use client'

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { impersonateUser } from "../actions"
import { LogIn } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface UserActionsProps {
    userId: string
    userName: string
}

export function UserActions({ userId, userName }: UserActionsProps) {
    const [isPending, startTransition] = useTransition()

    const handleImpersonate = () => {
        if (!confirm(`Log in as ${userName}? You will lose your Admin session.`)) return

        startTransition(async () => {
            await impersonateUser(userId)
        })
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleImpersonate}
                        disabled={isPending}
                        className="text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10"
                    >
                        <LogIn className="h-4 w-4" />
                        <span className="sr-only">Login as {userName}</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Login as {userName}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
