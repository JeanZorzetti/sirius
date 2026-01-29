'use client'

import { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { FunnelCalculator } from './funnel-calculator'
import { FunnelTemplateDownload } from './funnel-template-download'
import { CalculadoraROI } from '@/components/calculadora-roi'

interface BlogContentWrapperProps {
  content: string
  slug: string
}

export function BlogContentWrapper({ content, slug }: BlogContentWrapperProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contentRef.current) return

    // For funil-de-vendas article, inject interactive components
    if (slug === 'funil-de-vendas-guia-completo') {
      // Inject FunnelCalculator
      const calculatorPlaceholder = contentRef.current.querySelector('.funnel-calculator-component')
      if (calculatorPlaceholder && !calculatorPlaceholder.hasChildNodes()) {
        const root = createRoot(calculatorPlaceholder)
        root.render(<FunnelCalculator />)
      }

      // Inject FunnelTemplateDownload
      const templatePlaceholder = contentRef.current.querySelector('.funnel-template-download-component')
      if (templatePlaceholder && !templatePlaceholder.hasChildNodes()) {
        const root = createRoot(templatePlaceholder)
        root.render(<FunnelTemplateDownload />)
      }
    }

    // For planilha-controle-comissao-corretor, inject ROI Calculator (Honey Trap)
    if (slug === 'planilha-controle-comissao-corretor') {
      const roiCalculatorPlaceholder = contentRef.current.querySelector('.roi-calculator-component')
      if (roiCalculatorPlaceholder && !roiCalculatorPlaceholder.hasChildNodes()) {
        const root = createRoot(roiCalculatorPlaceholder)
        root.render(
          <CalculadoraROI
            ctaText="Pare de perder comissões - Teste o Sirius CRM Grátis"
            ctaHref="/register"
          />
        )
      }
    }
  }, [slug])

  return (
    <div
      ref={contentRef}
      className="prose prose-zinc dark:prose-invert max-w-none
        text-base sm:text-lg leading-relaxed
        prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
        prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:mt-8 sm:prose-h2:mt-12 prose-h2:mb-4 sm:prose-h2:mb-6 prose-h2:border-b prose-h2:pb-3 sm:prose-h2:pb-4
        prose-h3:text-xl sm:prose-h3:text-2xl prose-h3:mt-6 sm:prose-h3:mt-8 prose-h3:mb-3 sm:prose-h3:mb-4
        !prose-p:mb-10 prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-p:leading-[2]
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium
        !prose-strong:text-blue-600 dark:!prose-strong:text-blue-400 prose-strong:font-bold
        prose-ul:my-8 prose-ul:space-y-3 prose-li:text-zinc-700 dark:prose-li:text-zinc-300
        !prose-li:marker:text-blue-600 !prose-li:marker:text-xl prose-li:marker:font-bold prose-li:pl-2
        prose-ol:my-8 prose-ol:space-y-4
        prose-ol>li:text-zinc-700 dark:prose-ol>li:text-zinc-300 prose-ol>li:pl-3
        [&_ol>li::marker]:text-blue-600! dark:[&_ol>li::marker]:text-blue-400! [&_ol>li::marker]:text-xl! [&_ol>li::marker]:font-bold!
        prose-blockquote:text-xl prose-blockquote:font-medium prose-blockquote:text-primary
        prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5
        prose-blockquote:pl-6 prose-blockquote:py-6 prose-blockquote:rounded-r-2xl prose-blockquote:not-italic
        prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
        prose-img:rounded-xl prose-img:shadow-lg prose-img:my-10
        prose-table:text-zinc-700 dark:prose-table:text-zinc-300 prose-table:my-10
        !prose-table:border-2 !prose-table:border-blue-200 dark:!prose-table:border-blue-800 !prose-table:shadow-lg !prose-table:rounded-xl !prose-table:overflow-hidden
        !prose-thead:bg-gradient-to-r !prose-thead:from-blue-50 !prose-thead:to-blue-100 dark:!prose-thead:from-blue-950 dark:!prose-thead:to-blue-900
        !prose-th:text-blue-900 dark:!prose-th:text-blue-100 !prose-th:p-5 !prose-th:font-bold !prose-th:text-base !prose-th:tracking-wide !prose-th:border-b-2 !prose-th:border-blue-300
        !prose-td:p-5 !prose-td:border-b !prose-td:border-blue-100 dark:!prose-td:border-blue-900
        !prose-tr:transition-colors hover:!prose-tr:bg-blue-50/50 dark:hover:!prose-tr:bg-blue-950/30
        prose-tbody:prose-tr:last:!prose-tr:border-b-0
        [&>p:first-of-type]:first-letter:text-6xl [&>p:first-of-type]:first-letter:font-bold
        [&>p:first-of-type]:first-letter:text-primary [&>p:first-of-type]:first-letter:mr-2
        [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:leading-none
        [&_.callout-tip]:bg-blue-50 dark:[&_.callout-tip]:bg-blue-950/30
        [&_.callout-tip]:border-l-4 [&_.callout-tip]:border-blue-500
        [&_.callout-tip]:p-6 [&_.callout-tip]:rounded-r-xl [&_.callout-tip]:my-8
        [&_.callout-tip]:shadow-sm
        [&_.callout-tip_strong]:text-blue-700 dark:[&_.callout-tip_strong]:text-blue-400
        [&_.callout-tip_strong]:flex [&_.callout-tip_strong]:items-center [&_.callout-tip_strong]:gap-2
        [&_.callout-tip_strong]:text-sm [&_.callout-tip_strong]:uppercase [&_.callout-tip_strong]:tracking-wide
        [&_.callout-tip_strong]:mb-2
        [&_.callout-warning]:bg-amber-50 dark:[&_.callout-warning]:bg-amber-950/30
        [&_.callout-warning]:border-l-4 [&_.callout-warning]:border-amber-500
        [&_.callout-warning]:p-6 [&_.callout-warning]:rounded-r-xl [&_.callout-warning]:my-8
        [&_.callout-warning]:shadow-sm
        [&_.callout-warning_strong]:text-amber-700 dark:[&_.callout-warning_strong]:text-amber-400
        [&_.callout-warning_strong]:flex [&_.callout-warning_strong]:items-center [&_.callout-warning_strong]:gap-2
        [&_.callout-warning_strong]:text-sm [&_.callout-warning_strong]:uppercase [&_.callout-warning_strong]:tracking-wide
        [&_.callout-warning_strong]:mb-2
        [&_.callout-key]:bg-green-50 dark:[&_.callout-key]:bg-green-950/30
        [&_.callout-key]:border-l-4 [&_.callout-key]:border-green-500
        [&_.callout-key]:p-6 [&_.callout-key]:rounded-r-xl [&_.callout-key]:my-8
        [&_.callout-key]:shadow-sm
        [&_.callout-key_strong]:text-blue-700 dark:[&_.callout-key_strong]:text-blue-400
        [&_.callout-key_strong]:flex [&_.callout-key_strong]:items-center [&_.callout-key_strong]:gap-2
        [&_.callout-key_strong]:text-sm [&_.callout-key_strong]:uppercase [&_.callout-key_strong]:tracking-wide
        [&_.callout-key_strong]:mb-2"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
