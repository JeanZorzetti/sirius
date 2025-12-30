'use client'

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Copy, Check } from "lucide-react"
import { createInvite } from "./actions"

export function InviteDialog() {
    const [open, setOpen] = useState(false)
    const [email, setEmail] = useState("")
    const [inviteLink, setInviteLink] = useState("")
    const [isPending, startTransition] = useTransition()
    const [copied, setCopied] = useState(false)

    const handleInvite = () => {
        startTransition(async () => {
            try {
                const res = await createInvite(email)
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
                        Envie o link de convite para adicionar alguém ao seu time.
                    </DialogDescription>
                </DialogHeader>

                {!inviteLink ? (
                    <div className="flex flex-col gap-4 py-4">
                        <Input
                            placeholder="email@exemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-zinc-900 border-zinc-800 focus:border-indigo-500"
                        />
                        <Button
                            onClick={handleInvite}
                            disabled={!email || isPending}
                            className="w-full bg-white text-black hover:bg-zinc-200"
                        >
                            {isPending ? "Gerando..." : "Gerar Link"}
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 py-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
                            Convite criado com sucesso!
                        </div>
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
                        <p className="text-xs text-zinc-500 text-center">
                            Copie e envie este link para o novo membro.
                        </p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
