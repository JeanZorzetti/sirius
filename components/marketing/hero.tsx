import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function Hero() {
    return (
        <section className="relative overflow-hidden pt-32 pb-24 lg:pt-48 lg:pb-32">
            {/* Spotlight Effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] -z-10" />

            <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-sm text-indigo-400 mb-8 animate-fade-in backdrop-blur-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span className="font-medium">O CRM da Nova Geração</span>
                </div>

                {/* Headline */}
                <h1 className="mx-auto max-w-4xl font-display text-5xl font-bold tracking-tight text-white sm:text-7xl animate-fade-in [animation-delay:200ms] opacity-0 fill-mode-forwards">
                    Transforme Leads em <br />
                    <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Receita Recorrente
                    </span>
                </h1>

                {/* Subheadline */}
                <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 animate-fade-in [animation-delay:400ms] opacity-0 fill-mode-forwards">
                    Sirius é a plataforma de vendas desenhada para times de alta performance.
                    Sem planilhas, sem complexidade. Apenas foco em fechar negócios.
                </p>

                {/* CTA Buttons */}
                <div className="mt-10 flex items-center justify-center gap-x-6 animate-fade-in [animation-delay:600ms] opacity-0 fill-mode-forwards">
                    <Button asChild size="lg" className="h-12 px-8 text-base bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_30px_-5px_var(--color-indigo-500)] border border-indigo-400/20">
                        <Link href="/register">
                            Começar Grátis
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white bg-transparent">
                        <Link href="/login">
                            Entrar
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    )
}
