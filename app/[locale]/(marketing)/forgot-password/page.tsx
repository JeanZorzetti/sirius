'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
    const [error, setError] = useState<string>('')
    const [success, setSuccess] = useState(false)
    const [isPending, startTransition] = useTransition()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')

        const formData = new FormData(e.currentTarget)
        const email = formData.get('email') as string

        startTransition(async () => {
            try {
                const response = await fetch('/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                })

                const data = await response.json()

                if (!response.ok) {
                    setError(data.error || 'Erro ao enviar email')
                    return
                }

                setSuccess(true)
            } catch {
                setError('Erro ao processar sua solicitacao. Tente novamente.')
            }
        })
    }

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-muted/30">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Email enviado!</CardTitle>
                        <CardDescription>
                            Se existir uma conta com esse email, voce recebera um link para redefinir sua senha.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground text-center">
                            Verifique sua caixa de entrada e pasta de spam. O link expira em 1 hora.
                        </p>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/login">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Voltar para o login
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-muted/30">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-center">Esqueceu sua senha?</CardTitle>
                    <CardDescription className="text-center">
                        Digite seu email e enviaremos um link para redefinir sua senha.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="seu@email.com"
                                required
                                autoComplete="email"
                                autoFocus
                            />
                        </div>
                        {error && (
                            <div className="text-sm text-red-500 font-medium">{error}</div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full" type="submit" disabled={isPending}>
                            {isPending ? 'Enviando...' : 'Enviar link de recuperacao'}
                        </Button>

                        <div className="text-center text-sm text-muted-foreground">
                            Lembrou sua senha?{' '}
                            <Link href="/login" className="text-primary hover:underline">
                                Voltar para o login
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
