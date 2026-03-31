'use client'

import { useState, useEffect, useTransition, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, KeyRound, CheckCircle, XCircle, Loader2, Eye, EyeOff } from 'lucide-react'

function ResetPasswordForm() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get('token')

    const [error, setError] = useState<string>('')
    const [success, setSuccess] = useState(false)
    const [isValidating, setIsValidating] = useState(true)
    const [isValidToken, setIsValidToken] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // Validate token on mount
    useEffect(() => {
        if (!token) {
            setIsValidating(false)
            return
        }

        fetch(`/api/auth/reset-password?token=${token}`)
            .then(res => res.json())
            .then(data => {
                setIsValidToken(data.valid)
                if (!data.valid) {
                    setError(data.error || 'Token invalido')
                }
            })
            .catch(() => {
                setError('Erro ao validar token')
            })
            .finally(() => {
                setIsValidating(false)
            })
    }, [token])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')

        const formData = new FormData(e.currentTarget)
        const password = formData.get('password') as string
        const confirmPassword = formData.get('confirmPassword') as string

        if (password !== confirmPassword) {
            setError('As senhas nao coincidem')
            return
        }

        startTransition(async () => {
            try {
                const response = await fetch('/api/auth/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, password }),
                })

                const data = await response.json()

                if (!response.ok) {
                    setError(data.error || 'Erro ao redefinir senha')
                    return
                }

                setSuccess(true)

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push('/login')
                }, 3000)
            } catch {
                setError('Erro ao processar sua solicitacao. Tente novamente.')
            }
        })
    }

    // Loading state
    if (isValidating) {
        return (
            <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-muted/30">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Validando...</CardTitle>
                        <CardDescription>
                            Verificando o link de redefinicao de senha.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    // No token or invalid token
    if (!token || !isValidToken) {
        return (
            <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-muted/30">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                            <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Link invalido</CardTitle>
                        <CardDescription>
                            {error || 'Este link de redefinicao de senha e invalido ou expirou.'}
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex flex-col gap-4">
                        <Button asChild className="w-full">
                            <Link href="/forgot-password">
                                Solicitar novo link
                            </Link>
                        </Button>
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

    // Success state
    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-muted/30">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Senha alterada!</CardTitle>
                        <CardDescription>
                            Sua senha foi redefinida com sucesso.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground text-center">
                            Voce sera redirecionado para a pagina de login em alguns segundos...
                        </p>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button asChild className="w-full">
                            <Link href="/login">
                                Ir para o login
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    // Form to reset password
    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-muted/30">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <KeyRound className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-center">Criar nova senha</CardTitle>
                    <CardDescription className="text-center">
                        Digite sua nova senha abaixo.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Nova senha</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    minLength={8}
                                    autoComplete="new-password"
                                    autoFocus
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Minimo 8 caracteres, com maiuscula, minuscula e numero.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    minLength={8}
                                    autoComplete="new-password"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {error && (
                            <div className="text-sm text-red-500 font-medium">{error}</div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full" type="submit" disabled={isPending}>
                            {isPending ? 'Salvando...' : 'Salvar nova senha'}
                        </Button>

                        <div className="text-center text-sm text-muted-foreground">
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

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    )
}
