import Link from 'next/link'
import Script from 'next/script'
import { Shield, Lock, Eye, Server, UserCheck, FileText } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketing.privacy.meta' })
  const canonical = `https://siriuscrm.com.br${locale === 'en' ? '/en' : ''}/privacy`
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical },
    openGraph: { title: t('ogTitle'), description: t('ogDescription'), url: canonical },
  }
}

export default async function PrivacyPage(
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketing.privacy' })

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://siriuscrm.com.br" },
      { "@type": "ListItem", "position": 2, "name": t('title'), "item": "https://siriuscrm.com.br/privacy" },
    ]
  }

  return (
    <>
      <Script id="breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="bg-background">
        {/* Hero */}
        <section className="py-20 sm:py-32">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{t('title')}</h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">{t('lastUpdated')}</p>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">{t('intro')}</p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">

              {/* 1 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
                  <h2 className="text-2xl font-bold text-foreground m-0">{t('s1.title')}</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7"><strong className="text-foreground">{t('s1.registration')}</strong> {t('s1.registrationText')}</p>
                  <p className="text-base leading-7"><strong className="text-foreground">{t('s1.usage')}</strong> {t('s1.usageText')}</p>
                  <p className="text-base leading-7"><strong className="text-foreground">{t('s1.crm')}</strong> {t('s1.crmText')}</p>
                  <p className="text-base leading-7"><strong className="text-foreground">{t('s1.payment')}</strong> {t('s1.paymentText')}</p>
                </div>
              </div>

              {/* 2 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Eye className="h-5 w-5 text-primary" /></div>
                  <h2 className="text-2xl font-bold text-foreground m-0">{t('s2.title')}</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <ul className="list-disc list-inside space-y-2 text-base leading-7">
                    <li><strong className="text-foreground">{t('s2.provide')}</strong> {t('s2.provideText')}</li>
                    <li><strong className="text-foreground">{t('s2.improve')}</strong> {t('s2.improveText')}</li>
                    <li><strong className="text-foreground">{t('s2.communicate')}</strong> {t('s2.communicateText')}</li>
                    <li><strong className="text-foreground">{t('s2.security')}</strong> {t('s2.securityText')}</li>
                  </ul>
                  <p className="text-base leading-7 font-semibold text-foreground">{t('s2.neverSell')}</p>
                </div>
              </div>

              {/* 3 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Lock className="h-5 w-5 text-primary" /></div>
                  <h2 className="text-2xl font-bold text-foreground m-0">{t('s3.title')}</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7">
                    {t('s3.p1', { orgA: t('s3.orgA'), orgB: t('s3.orgB') }).split(t('s3.orgA')).reduce<React.ReactNode[]>((acc, part, i) => {
                      if (i === 0) return [part]
                      return [...acc, <strong key={`a${i}`} className="text-foreground">{t('s3.orgA')}</strong>, part]
                    }, []).flatMap((node, i, arr) => {
                      if (typeof node !== 'string') return [node]
                      return node.split(t('s3.orgB')).reduce<React.ReactNode[]>((acc2, p, j) => {
                        if (j === 0) return [p]
                        return [...acc2, <strong key={`b${j}`} className="text-foreground">{t('s3.orgB')}</strong>, p]
                      }, [])
                    })}
                  </p>
                  <p className="text-base leading-7">
                    {t('s3.p2', { field: 'organizationId' }).split('organizationId').map((part, i, arr) =>
                      i < arr.length - 1 ? [part, <code key={i} className="bg-muted px-1.5 py-0.5 rounded text-sm">organizationId</code>] : part
                    )}
                  </p>
                </div>
              </div>

              {/* 4 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Shield className="h-5 w-5 text-primary" /></div>
                  <h2 className="text-2xl font-bold text-foreground m-0">{t('s4.title')}</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <ul className="list-disc list-inside space-y-2 text-base leading-7">
                    <li><strong className="text-foreground">{t('s4.encryption')}</strong> {t('s4.encryptionText')}</li>
                    <li><strong className="text-foreground">{t('s4.auth')}</strong> {t('s4.authText')}</li>
                    <li><strong className="text-foreground">{t('s4.db')}</strong> {t('s4.dbText')}</li>
                    <li><strong className="text-foreground">{t('s4.monitoring')}</strong> {t('s4.monitoringText')}</li>
                  </ul>
                </div>
              </div>

              {/* 5 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Server className="h-5 w-5 text-primary" /></div>
                  <h2 className="text-2xl font-bold text-foreground m-0">{t('s5.title')}</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7"><strong className="text-foreground">{t('s5.essential')}</strong> {t('s5.essentialText')}</p>
                  <p className="text-base leading-7"><strong className="text-foreground">{t('s5.analytics')}</strong> {t('s5.analyticsText')}</p>
                  <p className="text-base leading-7">{t('s5.optOut')}</p>
                </div>
              </div>

              {/* 6 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><UserCheck className="h-5 w-5 text-primary" /></div>
                  <h2 className="text-2xl font-bold text-foreground m-0">{t('s6.title')}</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7">{t('s6.intro')}</p>
                  <ul className="list-disc list-inside space-y-2 text-base leading-7">
                    <li><strong className="text-foreground">{t('s6.mp')}</strong> {t('s6.mpText')}</li>
                    <li><strong className="text-foreground">{t('s6.resend')}</strong> {t('s6.resendText')}</li>
                    <li><strong className="text-foreground">{t('s6.vercel')}</strong> {t('s6.vercelText')}</li>
                    <li><strong className="text-foreground">{t('s6.sentry')}</strong> {t('s6.sentryText')}</li>
                  </ul>
                  <p className="text-base leading-7 font-semibold text-foreground">{t('s6.dpa')}</p>
                </div>
              </div>

              {/* 7 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Shield className="h-5 w-5 text-primary" /></div>
                  <h2 className="text-2xl font-bold text-foreground m-0">{t('s7.title')}</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7">{t('s7.intro')}</p>
                  <ul className="list-disc list-inside space-y-2 text-base leading-7">
                    <li><strong className="text-foreground">{t('s7.access')}</strong> {t('s7.accessText')}</li>
                    <li><strong className="text-foreground">{t('s7.correction')}</strong> {t('s7.correctionText')}</li>
                    <li><strong className="text-foreground">{t('s7.deletion')}</strong> {t('s7.deletionText')}</li>
                    <li><strong className="text-foreground">{t('s7.portability')}</strong> {t('s7.portabilityText')}</li>
                    <li><strong className="text-foreground">{t('s7.revocation')}</strong> {t('s7.revocationText')}</li>
                  </ul>
                  <p className="text-base leading-7">{t('s7.contact')} <a href="mailto:privacidade@roilabs.com.br" className="text-primary hover:underline">privacidade@roilabs.com.br</a></p>
                </div>
              </div>

              {/* 8 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Server className="h-5 w-5 text-primary" /></div>
                  <h2 className="text-2xl font-bold text-foreground m-0">{t('s8.title')}</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7"><strong className="text-foreground">{t('s8.active')}</strong> {t('s8.activeText')}</p>
                  <p className="text-base leading-7"><strong className="text-foreground">{t('s8.afterCancel')}</strong> {t('s8.afterCancelText')}</p>
                  <p className="text-base leading-7"><strong className="text-foreground">{t('s8.logs')}</strong> {t('s8.logsText')}</p>
                </div>
              </div>

              {/* 9 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
                  <h2 className="text-2xl font-bold text-foreground m-0">{t('s9.title')}</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7">{t('s9.p1')}</p>
                  <p className="text-base leading-7">{t('s9.p2')}</p>
                </div>
              </div>

              {/* 10 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><UserCheck className="h-5 w-5 text-primary" /></div>
                  <h2 className="text-2xl font-bold text-foreground m-0">{t('s10.title')}</h2>
                </div>
                <div className="text-muted-foreground space-y-4 ml-13">
                  <p className="text-base leading-7">{t('s10.intro')}</p>
                  <ul className="list-none space-y-2 text-base leading-7">
                    <li><strong className="text-foreground">{t('s10.emailLabel')}</strong> <a href="mailto:privacidade@roilabs.com.br" className="text-primary hover:underline">privacidade@roilabs.com.br</a></li>
                    <li><strong className="text-foreground">{t('s10.companyLabel')}</strong> {t('s10.company')}</li>
                    <li><strong className="text-foreground">{t('s10.dpoLabel')}</strong> privacidade@roilabs.com.br</li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-muted/50">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">{t('cta.title')}</h2>
              <p className="text-muted-foreground mb-6">{t('cta.subtitle')}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="mailto:privacidade@roilabs.com.br" className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
                  {t('cta.dpo')}
                </Link>
                <Link href="/terms" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-semibold hover:bg-accent hover:text-accent-foreground transition-colors">
                  {t('cta.terms')}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
