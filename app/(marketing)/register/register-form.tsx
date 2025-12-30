'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { registerAction } from "@/app/auth/actions"
import { SubmitButton } from "@/components/submit-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CardContent, CardFooter } from "@/components/ui/card"

export function RegisterForm({ inviteData, inviteToken }: { inviteData: any, inviteToken?: string }) {
    const [state, action] = useActionState(registerAction, null)

    return (
        <form action={action}>
            <CardContent className="space-y-4">
                {state?.error && (
                    <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
                        {state.error}
                    </div>
                )}

                {inviteData && (
                    <input type="hidden" name="inviteToken" value={inviteToken} />
                )}

                <div className="space-y-2">
                    <Label htmlFor="name">Seu Nome</Label>
                    <Input id="name" name="name" placeholder="João da Silva" required className="bg-zinc-800 border-zinc-700 text-white" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="joao@empresa.com"
                        required
                        defaultValue={inviteData?.email || ""}
                        className="bg-zinc-800 border-zinc-700 text-white"
                    />
                </div>

                {!inviteData && (
                    <div className="space-y-2">
                        <Label htmlFor="company">Nome da Empresa</Label>
                        <Input id="company" name="company" placeholder="Minha Empresa Ltda" required className="bg-zinc-800 border-zinc-700 text-white" />
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input id="password" name="password" type="password" required className="bg-zinc-800 border-zinc-700 text-white" />
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <SubmitButton text={inviteData ? "Entrar na Equipe" : "Criar Conta"} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" />
                <div className="text-center text-sm text-zinc-400">
                    Já tem uma conta? <Link href="/login" className="text-indigo-400 hover:text-indigo-300">Entrar</Link>
                </div>
            </CardFooter>
        </form>
    )
}
