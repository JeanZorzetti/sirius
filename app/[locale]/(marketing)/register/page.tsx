import { Metadata } from 'next'
import Link from 'next/link'
import { RegisterForm } from "./register-form"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { getTranslations } from 'next-intl/server'
import { buildLocaleAlternates } from "@/lib/seo/canonical"
import { DEFAULT_OG_IMAGES } from '@/lib/seo/canonical'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketing.register.meta' })
  const alternates = buildLocaleAlternates(locale, '/cadastrar', '/register')
  return {
    title: t('title'),
    description: t('description'),
    alternates,
    openGraph: {
      images: DEFAULT_OG_IMAGES,
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: alternates.canonical,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('ogTitle'),
      description: t('ogDescription'),
    },
  }
}

export default async function RegisterPage({
    searchParams,
}: {
    searchParams: Promise<{ invite?: string }>
}) {
    const { invite: inviteToken } = await searchParams
    let inviteData = null

    if (inviteToken) {
        inviteData = await prisma.invite.findUnique({
            where: { token: inviteToken },
            include: { organization: true }
        })
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Left side - Value Proposition (hidden on mobile for invite flow) */}
                {!inviteData && (
                    <div className="hidden lg:block space-y-8">
                        <div>
                            <h1 className="text-4xl font-bold text-foreground mb-4">
                                Feche mais negócios em menos tempo
                            </h1>
                            <p className="text-xl text-muted-foreground">
                                Junte-se a 120+ times que já aumentaram suas vendas com o Sirius
                            </p>
                        </div>

                        {/* Social Proof Benefits */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 flex-shrink-0">
                                    <svg className="h-6 w-6 text-foreground" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">Configure em 5 minutos</h3>
                                    <p className="text-sm text-muted-foreground">Não precisa ser expert em tecnologia. Interface intuitiva e pronta para usar.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-1 flex-shrink-0">
                                    <svg className="h-6 w-6 text-foreground" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">Sem cartão de crédito</h3>
                                    <p className="text-sm text-muted-foreground">Plano gratuito para sempre. Faça upgrade apenas quando precisar.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-1 flex-shrink-0">
                                    <svg className="h-6 w-6 text-foreground" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">Dados 100% seguros</h3>
                                    <p className="text-sm text-muted-foreground">Criptografia de ponta a ponta. Seus dados nunca serão compartilhados.</p>
                                </div>
                            </div>
                        </div>

                        {/* Mini testimonial */}
                        <div className="border border-white/10 bg-white/[0.02] rounded-xl p-6 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-foreground font-bold text-sm">
                                    CS
                                </div>
                                <div>
                                    <div className="font-semibold text-foreground text-sm">Carlos Silva</div>
                                    <div className="text-xs text-muted-foreground">CEO, TechFlow</div>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground italic">
                                "Em 10 minutos já estava usando. <span className="text-muted-foreground font-semibold">+40% de conversão</span> no primeiro mês."
                            </p>
                        </div>
                    </div>
                )}

                {/* Right side - Registration Form */}
                <Card className="w-full bg-muted border-border text-foreground">
                    <CardHeader className="space-y-1">
                        {!inviteData && (
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                <span className="text-xs font-medium text-muted-foreground">Comece grátis — sem cartão de crédito</span>
                            </div>
                        )}
                        <CardTitle className="text-2xl font-bold">
                            {inviteData ? `Junte-se a ${inviteData.organization.name}` : "Crie sua conta grátis"}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            {inviteData ? "Crie sua conta para acessar o time." : "Sem cartão de crédito. Cancele quando quiser."}
                        </CardDescription>
                    </CardHeader>
                    <RegisterForm inviteData={inviteData} inviteToken={inviteToken} />
                </Card>
            </div>
        </div>
    )
}
