'use client'

import { useState, useTransition } from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { OrgRole } from "@prisma/client"
import { updateMemberRole } from "./actions"
import { toast } from "sonner"

interface RoleSelectProps {
    userId: string
    currentRole: OrgRole
    assignableRoles: OrgRole[]
    roleLabels: Record<string, string>
    disabled?: boolean
}

export function RoleSelect({ userId, currentRole, assignableRoles, roleLabels, disabled }: RoleSelectProps) {
    const [role, setRole] = useState<OrgRole>(currentRole)
    const [isPending, startTransition] = useTransition()

    // Always include the current role in options so it shows up even if not assignable
    const options = assignableRoles.includes(currentRole)
        ? assignableRoles
        : [currentRole, ...assignableRoles]

    function onChange(next: string) {
        const nextRole = next as OrgRole
        if (nextRole === role) return
        const previous = role
        setRole(nextRole)
        startTransition(async () => {
            try {
                await updateMemberRole(userId, nextRole)
                toast.success('Função atualizada')
            } catch (e: any) {
                setRole(previous)
                toast.error(e.message ?? 'Falha ao atualizar função')
            }
        })
    }

    return (
        <Select value={role} onValueChange={onChange} disabled={disabled || isPending}>
            <SelectTrigger className="h-7 w-[140px] text-xs">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {options.map((r) => (
                    <SelectItem key={r} value={r} className="text-xs">
                        {roleLabels[r] ?? r}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
