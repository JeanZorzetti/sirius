import { Lock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function FeatureBlocked({ feature }: { feature: string }) {
    return (
        <div className="flex flex-1 items-center justify-center p-8">
            <div className="max-w-md text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                    <Lock className="h-6 w-6 text-zinc-500" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    {feature} indisponível
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                    Sua função não tem permissão para acessar {feature.toLowerCase()}.
                    Entre em contato com o administrador da organização para solicitar acesso.
                </p>
                <Link href="/dashboard" className="mt-6 inline-block">
                    <Button variant="outline">Voltar ao Dashboard</Button>
                </Link>
            </div>
        </div>
    )
}
