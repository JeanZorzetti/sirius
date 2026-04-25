import { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Scale, Shield, AlertTriangle, Mail } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketing.terms.meta' })
  const canonical = `https://siriuscrm.com.br${locale === 'en' ? '/en' : ''}/terms`
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical },
    openGraph: { title: t('ogTitle'), description: t('ogDescription'), url: canonical },
  }
}

export default async function TermsPage(
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketing.terms' })

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://siriuscrm.com.br" },
      { "@type": "ListItem", "position": 2, "name": t('title'), "item": "https://siriuscrm.com.br/terms" },
    ]
  }

  return (
    <>
      <Script id="breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-4xl py-12 px-6">
          <Link href="/">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backHome')}
            </Button>
          </Link>

          <div className="prose prose-zinc dark:prose-invert max-w-none">
            <div className="flex items-center gap-4 mb-8">
              <FileText className="h-12 w-12 text-primary" />
              <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">{t('title')}</h1>
                <p className="text-muted-foreground">{t('lastUpdated')}</p>
              </div>
            </div>

            {/* 1 */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Scale className="h-5 w-5 text-primary" /></div>
                <h2 className="text-2xl font-bold m-0">{t('s1.title')}</h2>
              </div>
              <div className="space-y-4 ml-13">
                <p>{t('s1.p1', { product: 'Sirius CRM', company: 'ROI Labs' })}</p>
                <p>{t('s1.p2', { link: t('s1.p2Link') }).split(t('s1.p2Link')).map((part, i, arr) =>
                  i < arr.length - 1
                    ? [part, <Link key={i} href="/privacy" className="text-primary hover:underline">{t('s1.p2Link')}</Link>]
                    : part
                )}</p>
              </div>
            </div>

            {/* 2 */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{t('s2.title')}</h2>
              <div className="space-y-4">
                <p>{t('s2.intro')}</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>{t('s2.li1')}</li>
                  <li>{t('s2.li2')}</li>
                  <li>{t('s2.li3')}</li>
                  <li>{t('s2.li4')}</li>
                  <li>{t('s2.li5')}</li>
                  <li>{t('s2.li6')}</li>
                </ul>
                <p>{t('s2.outro')}</p>
              </div>
            </div>

            {/* 3 */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{t('s3.title')}</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">{t('s3.s31title')}</h3>
                <p>{t('s3.s31intro')}</p>
                <h3 className="text-xl font-semibold mt-6">{t('s3.s32title')}</h3>
                <p>{t('s3.s32text')}</p>
                <h3 className="text-xl font-semibold mt-6">{t('s3.s33title')}</h3>
                <p>{t('s3.s33text')} <strong>{t('s3.s33noRefund')}</strong></p>
                <h3 className="text-xl font-semibold mt-6">{t('s3.s34title')}</h3>
                <p>{t('s3.s34text')}</p>
              </div>
            </div>

            {/* 4 */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{t('s4.title')}</h2>
              <div className="space-y-4">
                <p>{t('s4.intro')}</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>{t('s4.li1')}</li>
                  <li>{t('s4.li2')}</li>
                  <li>{t('s4.li3')}</li>
                  <li>{t('s4.li4')}</li>
                </ul>
                <p className="font-semibold text-foreground">
                  <AlertTriangle className="inline h-5 w-5 text-yellow-600 mr-2" />
                  {t('s4.responsible')}
                </p>
              </div>
            </div>

            {/* 5 */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
                <h2 className="text-2xl font-bold m-0">{t('s5.title')}</h2>
              </div>
              <div className="space-y-4 ml-13">
                <p>{t('s5.intro')}</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>{t('s5.li1')}</li>
                  <li>{t('s5.li2')}</li>
                  <li>{t('s5.li3')}</li>
                  <li>{t('s5.li4')}</li>
                  <li>{t('s5.li5')}</li>
                  <li>{t('s5.li6')}</li>
                  <li>{t('s5.li7')}</li>
                </ul>
                <p className="font-semibold text-red-600 dark:text-red-400">{t('s5.warning')}</p>
              </div>
            </div>

            {/* 6 */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{t('s6.title')}</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">{t('s6.s61title')}</h3>
                <p>{t('s6.s61text')}</p>
                <h3 className="text-xl font-semibold mt-6">{t('s6.s62title')}</h3>
                <p>{t('s6.s62text')}</p>
                <h3 className="text-xl font-semibold mt-6">{t('s6.s63title')}</h3>
                <p>{t('s6.s63text')}</p>
              </div>
            </div>

            {/* 7 */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10"><Shield className="h-5 w-5 text-yellow-600" /></div>
                <h2 className="text-2xl font-bold m-0">{t('s7.title')}</h2>
              </div>
              <div className="space-y-4 ml-13">
                <p>{t('s7.asIs')}</p>
                <p><strong>{t('s7.noGuarantee')}</strong></p>
                <ul className="list-disc list-inside space-y-2">
                  <li>{t('s7.li1')}</li>
                  <li>{t('s7.li2')}</li>
                  <li>{t('s7.li3')}</li>
                  <li>{t('s7.li4')}</li>
                </ul>
                <p className="font-semibold text-foreground">{t('s7.liability')}</p>
                <p>{t('s7.notResponsible')}</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>{t('s7.li5')}</li>
                  <li>{t('s7.li6')}</li>
                  <li>{t('s7.li7')}</li>
                </ul>
              </div>
            </div>

            {/* 8 */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{t('s8.title')}</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">{t('s8.s81title')}</h3>
                <p>{t('s8.s81text')}</p>
                <h3 className="text-xl font-semibold mt-6">{t('s8.s82title')}</h3>
                <p>{t('s8.s82intro')}</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>{t('s8.li1')}</li>
                  <li>{t('s8.li2')}</li>
                  <li>{t('s8.li3')}</li>
                </ul>
                <p>{t('s8.s82outro')}</p>
              </div>
            </div>

            {/* 9 */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{t('s9.title')}</h2>
              <p>{t('s9.p1')}</p>
              <p>{t('s9.p2')}</p>
            </div>

            {/* 10 */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{t('s10.title')}</h2>
              <p>{t('s10.p1')}</p>
              <p>{t('s10.p2', { jurisdiction: t('s10.jurisdiction') }).split(t('s10.jurisdiction')).map((part, i, arr) =>
                i < arr.length - 1
                  ? [part, <strong key={i}>{t('s10.jurisdiction')}</strong>]
                  : part
              )}</p>
            </div>

            {/* 11 */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Mail className="h-5 w-5 text-primary" /></div>
                <h2 className="text-2xl font-bold m-0">{t('s11.title')}</h2>
              </div>
              <div className="space-y-4 ml-13">
                <p>{t('s11.intro')}</p>
                <ul className="list-none space-y-2">
                  <li><strong>{t('s11.emailLabel')}</strong> <a href="mailto:juridico@roilabs.com.br" className="text-primary hover:underline">juridico@roilabs.com.br</a></li>
                  <li><strong>{t('s11.companyLabel')}</strong> {t('s11.company')}</li>
                  <li><strong>{t('s11.productLabel')}</strong> {t('s11.product')}</li>
                </ul>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-12 p-6 bg-muted/50 rounded-lg border">
              <h3 className="text-xl font-semibold mb-4">{t('cta.readAlso')}</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/privacy" className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
                  {t('cta.privacy')}
                </Link>
                <Link href="/help" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-semibold hover:bg-accent hover:text-accent-foreground transition-colors">
                  {t('cta.help')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
