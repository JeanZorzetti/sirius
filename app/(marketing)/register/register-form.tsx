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
                <SubmitButton text={inviteData ? "Entrar na Equipe" : "Criar Conta Grátis"} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" />

                {!inviteData && (
                    <div className="flex items-center justify-center gap-4 text-xs text-zinc-500 border-t border-zinc-800 pt-4">
                        <div className="flex items-center gap-1">
                            <svg className="h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            SSL Seguro
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                            <svg className="h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            LGPD
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                            <svg className="h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Sem Spam
                        </div>
                    </div>
                )}

                <div className="text-center text-sm text-zinc-400">
                    Já tem uma conta? <Link href="/login" className="text-indigo-400 hover:text-indigo-300">Entrar</Link>
                </div>
            </CardFooter>
        </form>
    )
}
