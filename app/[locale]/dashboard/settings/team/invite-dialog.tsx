'use client'

import { useState, useTransition } from "react"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { Plus, Copy, Check } from "lucide-react"
import { createInvite } from "./actions"
import { OrgRole } from "@prisma/client"

interface InviteDialogProps {
    assignableRoles: OrgRole[]
    roleLabels: Record<string, string>
}

export function InviteDialog({ assignableRoles, roleLabels }: InviteDialogProps) {
    const [open, setOpen] = useState(false)
    const [email, setEmail] = useState("")
    const [role, setRole] = useState<OrgRole>(
        (assignableRoles.find((r) => r === 'VENDEDOR') ?? assignableRoles[assignableRoles.length - 1]) as OrgRole
    )
    const [inviteLink, setInviteLink] = useState("")
    const [isPending, startTransition] = useTransition()
    const [copied, setCopied] = useState(false)
    const tCommon = useTranslations('common')

    const handleInvite = () => {
        startTransition(async () => {
            try {
                const res = await createInvite(email, role)
                if (res.token) {
                    const link = `${window.location.origin}/register?invite=${res.token}`
                    setInviteLink(link)
                }
            } catch (e: any) {
                alert(e.message)
            }
        })
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const reset = () => {
        setOpen(false)
        setInviteLink("")
        setEmail("")
        setCopied(false)
    }

    return (
        <Dialog open={open} onOpenChange={(val) => !val && reset()}>
            <DialogTrigger asChild>
                <Button onClick={() => setOpen(true)} className="bg-indigo-500 hover:bg-indigo-600">
                    <Plus className="mr-2 h-4 w-4" />
                    Convidar
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                <DialogHeader>
                    <DialogTitle>Convidar Membro</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Envie o convite e defina a função inicial. Permissões e features são herdadas do template da função.
                    </DialogDescription>
                </DialogHeader>

                {!inviteLink ? (
                    <div className="flex flex-col gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="invite-email" className="text-zinc-300">Email</Label>
                            <Input
                                id="invite-email"
                                placeholder="email@exemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-zinc-900 border-zinc-800 focus:border-indigo-500"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-zinc-300">Função</Label>
                            <Select value={role} onValueChange={(v) => setRole(v as OrgRole)}>
                                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {assignableRoles.map((r) => (
                                        <SelectItem key={r} value={r}>
                                            {roleLabels[r] ?? r}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-zinc-500">
                                As permissões serão aplicadas conforme o template configurado para essa função.
                            </p>
                        </div>
                        <Button
                            onClick={handleInvite}
                            disabled={!email || isPending}
                            className="w-full bg-white text-black hover:bg-zinc-200"
                        >
                            {isPending ? tCommon('buttons.sending') : tCommon('buttons.invite')}
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 py-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
                            E-mail de convite enviado para <strong>{email}</strong>!
                        </div>
                        <p className="text-xs text-zinc-500 text-center">
                            O link de convite também está disponível abaixo caso precise compartilhá-lo manualmente.
                        </p>
                        <div className="flex gap-2">
                            <Input
                                readOnly
                                value={inviteLink}
                                className="bg-zinc-900 border-zinc-800 font-mono text-xs"
                            />
                            <Button size="icon" variant="outline" onClick={copyToClipboard} className="border-zinc-800 hover:bg-zinc-900">
                                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
