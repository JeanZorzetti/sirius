'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { loginAction } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const initialState = {
    error: '',
}

export default function LoginPage() {
    const [state, action, pending] = useActionState(loginAction, initialState)

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-muted/30">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Acesse sua conta</CardTitle>
                    <CardDescription>
                        Bem-vindo de volta ao ROI Labs CRM.
                    </CardDescription>
                </CardHeader>
                <form action={action}>
                    <CardContent className="space-y-4">
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
                            {pending ? 'Entrando...' : 'Entrar'}
                        </Button>
                        <div className="text-center text-sm text-muted-foreground">
                            Não tem uma conta?{' '}
                            <Link href="/register" className="text-primary hover:underline">
                                Cadastre-se grátis
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
