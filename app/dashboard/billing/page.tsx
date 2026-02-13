import { Metadata } from 'next'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Star, Users } from "lucide-react"
import { EmbeddedCheckoutModal } from "@/components/dashboard/billing/embedded-checkout-modal"
import { BillingPageTracker } from "@/components/analytics/billing-page-tracker"
import { PurchaseTracker } from "@/components/analytics/purchase-tracker"
import { CopyReferralButton } from "./copy-referral-button"

export const metadata: Metadata = {
  title: 'Assinatura & Faturamento | Sirius CRM'
}

export const dynamic = 'force-dynamic'

const FOUNDER_LIMIT = 100

export default async function BillingPage() {
  const session = await getSession()

  // Fetch user plan info
  let tier = 'FREE'
  let isFounder = false
  let founderNumber: number | null = null
  let referralCode: string | null = null

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        referralCode: true,
        organization: {
          select: { tier: true, isFounder: true, founderNumber: true }
        }
      }
    })
    if (user) {
      tier = user.organization?.tier ?? 'FREE'
      isFounder = user.organization?.isFounder ?? false
      founderNumber = user.organization?.founderNumber ?? null
      referralCode = user.referralCode ?? null
    }
  }

  const isPro = ['PRO', 'BUSINESS'].includes(tier)
  const isFree = tier === 'FREE'

  // Count founders for the CTA
  const foundersCount = await prisma.organization.count({ where: { isFounder: true } })
  const spotsLeft = FOUNDER_LIMIT - foundersCount
  const foundersProgamOpen = spotsLeft > 0

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sirius.roilabs.com.br'
  const referralUrl = referralCode ? `${appUrl}/r/${referralCode}` : null

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <BillingPageTracker />
      <PurchaseTracker />

      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Assinatura & Faturamento</h2>
      </div>

      {/* Founder Badge */}
      {isFounder && founderNumber && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
              <Star className="w-6 h-6 text-amber-600 fill-amber-500" />
            </div>
            <div>
              <p className="font-bold text-amber-900">Você é o Fundador #{founderNumber} do Sirius CRM!</p>
              <p className="text-sm text-amber-700">
                Plano PRO por <strong>R$29/mês para sempre</strong> — benefício vitalício garantido.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Founders Program CTA (for FREE users) */}
      {isFree && foundersProgamOpen && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="flex items-center justify-between gap-4 py-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Star className="w-6 h-6 text-primary shrink-0" />
              <div>
                <p className="font-semibold">Programa de Fundadores — {spotsLeft} vagas restantes!</p>
                <p className="text-sm text-muted-foreground">
                  Plano PRO por <strong>R$29/mês para sempre</strong> (vs R$49 regular). Desconto vitalício.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href="/fundadores">Ver oferta</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plan cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:gap-12 max-w-4xl">
        {/* Free Plan */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Plano Free</CardTitle>
            <CardDescription>Para começar a organizar suas vendas.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="text-3xl font-bold">R$ 0<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Até 10 Negócios (Deals)</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Até 50 Contatos</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 1 Pipeline Kanban</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" disabled={isFree}>
              {isFree ? 'Plano Atual' : 'Plano Gratuito'}
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className="flex flex-col border-primary shadow-lg relative overflow-hidden">
          {isFounder ? (
            <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
              <Star className="w-3 h-3 fill-white" />
              FUNDADOR #{founderNumber}
            </div>
          ) : (
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
              RECOMENDADO
            </div>
          )}
          <CardHeader>
            <CardTitle>Sirius PRO {isFounder ? '⭐' : ''}</CardTitle>
            <CardDescription>
              {isFounder
                ? `Preço de Fundador: R$29/mês para sempre`
                : 'Para empresas que querem escalar.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="text-3xl font-bold">
              {isFounder ? (
                <>R$ 29<span className="text-sm font-normal text-muted-foreground">/mês vitalício</span></>
              ) : (
                <>R$ 49<span className="text-sm font-normal text-muted-foreground">/mês</span></>
              )}
            </div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> ✨ Múltiplos Pipelines</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Negócios Ilimitados</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Contatos Ilimitados</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Analytics Avançado</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Suporte Prioritário</li>
            </ul>
          </CardContent>
          <CardFooter>
            {isPro ? (
              <Button className="w-full" disabled>
                {isFounder ? '⭐ Fundador Ativo' : 'Plano Atual'}
              </Button>
            ) : (
              <div className="w-full space-y-2">
                {foundersProgamOpen && (
                  <Button asChild className="w-full" variant="default">
                    <Link href="/fundadores">
                      <Star className="w-4 h-4 mr-2" />
                      Ser Fundador — R$29/mês
                    </Link>
                  </Button>
                )}
                <EmbeddedCheckoutModal />
              </div>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Referral Section */}
      {referralUrl && (
        <Card className="max-w-4xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-primary" />
              Indique e Ganhe
            </CardTitle>
            <CardDescription>
              Compartilhe seu link e ganhe 1 mês de desconto para cada amigo que assinar o PRO.
              Quem você indicar ganha <strong>30 dias grátis no PRO</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <code className="bg-muted rounded-md px-3 py-2 text-sm flex-1 min-w-0 truncate">
                {referralUrl}
              </code>
              <CopyReferralButton url={referralUrl} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

