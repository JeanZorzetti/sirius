'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import type { Locale } from '@/i18n/config'
import { Globe } from 'lucide-react'
import { useTransition } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

const LOCALE_LABELS: Record<Locale, { label: string; flag: string }> = {
  'pt-BR': { label: 'Português', flag: '🇧🇷' },
  en: { label: 'English', flag: '🇺🇸' },
}

export function LanguageSwitcher() {
  const t = useTranslations('common')
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function switchLocale(nextLocale: Locale) {
    startTransition(() => {
      // @ts-expect-error: pathname from usePathname() includes dynamic segments, which next-intl strict routing cannot resolve statically without params
      router.replace(pathname, { locale: nextLocale })
    })
  }

  const current = LOCALE_LABELS[locale]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-sm font-medium"
          disabled={isPending}
          aria-label={t('language')}
        >
          <Globe className="h-4 w-4" />
          <span>{current.flag}</span>
          <span className="hidden sm:inline">{current.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {routing.locales.map((loc) => {
          const info = LOCALE_LABELS[loc as Locale]
          return (
            <DropdownMenuItem
              key={loc}
              onClick={() => switchLocale(loc as Locale)}
              className={`gap-2 cursor-pointer ${locale === loc ? 'font-semibold' : ''}`}
            >
              <span>{info.flag}</span>
              <span>{info.label}</span>
              {locale === loc && <span className="ml-auto text-primary">✓</span>}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
