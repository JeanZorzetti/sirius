'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { registerAction } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const initialState = {
    error: '',
}

export default function RegisterPage() {
    const [state, action, pending] = useActionState(registerAction, initialState)

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-muted/30">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Crie sua conta</CardTitle>
                    <CardDescription>
                        Comece a usar o CRM da ROI Labs gratuitamente.
                    </CardDescription>
                </CardHeader>
                <form action={action}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome Completo</Label>
                            <Input id="name" name="name" placeholder="Jean L." required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company">Nome da Empresa</Label>
                            <Input id="company" name="company" placeholder="Sua Empresa" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        {state?.error && (
                            <div className="text-sm text-red-500 font-medium">{state.error}</div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full" type="submit" disabled={pending}>
                            {pending ? 'Criando conta...' : 'Criar Conta'}
                        </Button>
                        <div className="text-center text-sm text-muted-foreground">
                            Já tem uma conta?{' '}
                            <Link href="/login" className="text-primary hover:underline">
                                Entrar
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
