'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { registerAction } from "@/app/auth/actions"
import { SubmitButton } from "@/components/submit-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CardContent, CardFooter } from "@/components/ui/card"

export function RegisterForm({ inviteData, inviteToken }: { inviteData: any, inviteToken?: string }) {
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        startTransition(async () => {
            const result = await registerAction(null, formData)
            if (result?.error) {
                setError(result.error)
            } else {
                // Redirect on success
                router.push('/dashboard?new_user=true')
            }
        })
    }

    return (
        <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
                {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
                        {error}
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
                <Button type="submit" disabled={isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                    {isPending ? 'Criando conta...' : (inviteData ? "Entrar na Equipe" : "Criar Conta Grátis")}
                </Button>

                {!inviteData && (
                    <>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-zinc-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-zinc-900 px-2 text-zinc-500">Ou continue com</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                        >
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Continue with Google
                        </Button>

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
                    </>
                )}

                <div className="text-center text-sm text-zinc-400">
                    Já tem uma conta? <Link href="/login" className="text-indigo-400 hover:text-indigo-300">Entrar</Link>
                </div>
            </CardFooter>
        </form>
    )
}
