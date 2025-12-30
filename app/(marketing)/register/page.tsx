'use client'

import Link from 'next/link'
import { registerAction } from "@/app/auth/actions"
import { SubmitButton } from "@/components/submit-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"

export default async function RegisterPage({
    searchParams,
}: {
    searchParams: { invite?: string }
}) {
    const inviteToken = searchParams.invite
    let inviteData = null

    if (inviteToken) {
        inviteData = await prisma.invite.findUnique({
            where: { token: inviteToken },
            include: { organization: true }
        })
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-950">
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">
                        {inviteData ? `Junte-se a ${inviteData.organization.name}` : "Crie sua conta"}
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                        {inviteData ? "Crie sua conta para acessar o time." : "Comece a usar o Sirius CRM gratuitamente."}
                    </CardDescription>
                </CardHeader>
                <form action={registerAction}>
                    <CardContent className="space-y-4">
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
            </Card>
        </div>
    )
}
