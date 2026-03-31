import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export default function NotFound() {
  const t = useTranslations('errors.notFound')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="max-w-lg">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">404</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {t('title')}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{t('description')}</p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            {t('backHome')}
          </Link>
          <Link
            href="/contact"
            className="rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
          >
            {t('contact')}
          </Link>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          {t('blogHint')}{' '}
          <Link href="/blog" className="text-primary underline-offset-4 hover:underline">
            {t('blogLink')}
          </Link>{' '}
          {t('blogSuffix')}
        </p>
      </div>
    </div>
  )
}
