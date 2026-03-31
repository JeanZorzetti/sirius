import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"

export function Hero() {
    const t = useTranslations("marketing.home.hero")
    const locale = useLocale()

    return (
        <section className="relative overflow-hidden pt-32 pb-24 lg:pt-48 lg:pb-32">
            {/* Spotlight Effect — reduced blur for mobile performance */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-500/20 rounded-full blur-[60px] md:blur-[120px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[50px] md:blur-[100px] -z-10" />

            <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-sm text-indigo-400 mb-8 animate-fade-in backdrop-blur-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span className="font-medium">{t('badge')}</span>
                </div>

                {/* Headline */}
                <h1 className="mx-auto max-w-4xl font-display text-5xl font-bold tracking-tight text-white sm:text-7xl animate-fade-in [animation-delay:200ms] opacity-0 fill-mode-forwards">
                    {t('title_prefix')} <br />
                    <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {t('title_highlight')}
                    </span>
                </h1>

                {/* Subheadline */}
                <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 animate-fade-in [animation-delay:400ms] opacity-0 fill-mode-forwards">
                    {t('subtitle')}
                </p>

                {/* CTA Buttons */}
                <div className="mt-10 flex items-center justify-center gap-x-6 animate-fade-in [animation-delay:600ms] opacity-0 fill-mode-forwards">
                    <Button asChild size="lg" className="h-12 px-8 text-base bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_30px_-5px_var(--color-indigo-500)] border border-indigo-400/20">
                        <Link href="/register">
                            {t('cta1')}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white bg-transparent">
                        <Link href="/login">
                            {t('cta2')}
                        </Link>
                    </Button>
                </div>

                {/* Risk Reversal + Social Proof */}
                <div className="mt-8 flex flex-col items-center gap-4 animate-fade-in [animation-delay:800ms] opacity-0 fill-mode-forwards">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{t('risk1')}</span>
                        <span className="text-zinc-600">•</span>
                        <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{t('risk2')}</span>
                        <span className="text-zinc-600">•</span>
                        <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{t('risk3')}</span>
                    </div>

                    {/* Social Proof Stats */}
                    {locale === 'pt-BR' && (
                        <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 border-2 border-zinc-950" />
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 border-2 border-zinc-950" />
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-400 to-red-500 border-2 border-zinc-950" />
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 border-2 border-zinc-950 flex items-center justify-center text-xs font-bold">
                                        +120
                                    </div>
                                </div>
                                <span className="text-zinc-300">
                                    {t.rich('socialProof', {
                                        white: (chunks) => <strong className="text-white">{chunks}</strong>
                                    })}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
