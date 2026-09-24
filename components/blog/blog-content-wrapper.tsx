'use client'

import { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'

interface BlogContentWrapperProps {
  content: string
  slug: string
}

export function BlogContentWrapper({ content, slug }: BlogContentWrapperProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contentRef.current) return

    // Dynamic imports: only load component JS for the specific slug
    if (slug === 'funil-de-vendas-guia-completo') {
      const calcPlaceholder = contentRef.current.querySelector('.funnel-calculator-component')
      if (calcPlaceholder && !calcPlaceholder.hasChildNodes()) {
        import('./funnel-calculator').then(({ FunnelCalculator }) => {
          const root = createRoot(calcPlaceholder)
          root.render(<FunnelCalculator />)
        })
      }

      const templatePlaceholder = contentRef.current.querySelector('.funnel-template-download-component')
      if (templatePlaceholder && !templatePlaceholder.hasChildNodes()) {
        import('./funnel-template-download').then(({ FunnelTemplateDownload }) => {
          const root = createRoot(templatePlaceholder)
          root.render(<FunnelTemplateDownload />)
        })
      }
    }

    if (slug === 'planilha-controle-comissao-corretor') {
      const placeholder = contentRef.current.querySelector('.roi-calculator-component')
      if (placeholder && !placeholder.hasChildNodes()) {
        import('@/components/calculadora-roi').then(({ CalculadoraROI }) => {
          const root = createRoot(placeholder)
          root.render(
            <CalculadoraROI
              ctaText="Pare de perder comissões - Teste o Sirius CRM Grátis"
              ctaHref="/register"
            />
          )
        })
      }
    }

    if (slug === 'custo-oculto-inacao-crm') {
      const placeholder = contentRef.current.querySelector('.roi-calculator-component')
      if (placeholder && !placeholder.hasChildNodes()) {
        import('@/components/calculadora-roi').then(({ CalculadoraROI }) => {
          const root = createRoot(placeholder)
          root.render(
            <CalculadoraROI
              ctaText="Calcule seu custo de inação agora"
              ctaHref="/register"
            />
          )
        })
      }
    }

    if (slug === 'crm-ia-inteligencia-artificial-2026') {
      const placeholder = contentRef.current.querySelector('.crm-ia-quiz-component')
      if (placeholder && !placeholder.hasChildNodes()) {
        import('./crm-ia-quiz').then(({ CRMIAQuiz }) => {
          const root = createRoot(placeholder)
          root.render(<CRMIAQuiz />)
        })
      }
    }

    if (slug === 'crm-automacao-vendas-guia-completo') {
      const placeholder = contentRef.current.querySelector('.roi-automacao-component')
      if (placeholder && !placeholder.hasChildNodes()) {
        import('./roi-automacao-calc').then(({ ROIAutomacaoCalc }) => {
          const root = createRoot(placeholder)
          root.render(<ROIAutomacaoCalc />)
        })
      }
    }

    if (slug === 'melhor-crm-2026-comparativo') {
      const placeholder = contentRef.current.querySelector('.crm-finder-component')
      if (placeholder && !placeholder.hasChildNodes()) {
        import('./crm-finder').then(({ CRMFinder }) => {
          const root = createRoot(placeholder)
          root.render(<CRMFinder />)
        })
      }
    }
  }, [slug])

  return (
    <div
      ref={contentRef}
      className="prose prose-zinc max-w-none
        text-base sm:text-lg leading-relaxed
        prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
        prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:mt-8 sm:prose-h2:mt-12 prose-h2:mb-4 sm:prose-h2:mb-6 prose-h2:border-b prose-h2:pb-3 sm:prose-h2:pb-4
        prose-h3:text-xl sm:prose-h3:text-2xl prose-h3:mt-6 sm:prose-h3:mt-8 prose-h3:mb-3 sm:prose-h3:mb-4
        !prose-p:mb-10 prose-p:text-zinc-700 prose-p:leading-[2]
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium
        !prose-strong:text-foreground prose-strong:font-bold
        prose-ul:my-8 prose-ul:space-y-3 prose-li:text-zinc-700 
        !prose-li:marker:text-foreground !prose-li:marker:text-xl prose-li:marker:font-bold prose-li:pl-2
        prose-ol:my-8 prose-ol:space-y-4
        prose-ol>li:text-zinc-700 prose-ol>li:pl-3
        [&_ol>li::marker]:text-foreground! [&_ol>li::marker]:text-xl! [&_ol>li::marker]:font-bold!
        prose-blockquote:text-xl prose-blockquote:font-medium prose-blockquote:text-primary
        prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5
        prose-blockquote:pl-6 prose-blockquote:py-6 prose-blockquote:rounded-r prose-blockquote:not-italic
        prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
        prose-img:rounded prose-img:my-10
        prose-table:text-zinc-700 prose-table:my-10
        !prose-table:border-2 !prose-table:border-border !prose-table:rounded !prose-table:overflow-hidden
        !prose-thead:bg-muted  
        !prose-th:text-foreground !prose-th:p-5 !prose-th:font-bold !prose-th:text-base !prose-th:tracking-wide !prose-th:border-b-2 !prose-th:border-border
        !prose-td:p-5 !prose-td:border-b !prose-td:border-border 
        !prose-tr:transition-colors hover:!prose-tr:bg-muted 
        prose-tbody:prose-tr:last:!prose-tr:border-b-0
        [&>p:first-of-type]:first-letter:text-6xl [&>p:first-of-type]:first-letter:font-bold
        [&>p:first-of-type]:first-letter:text-primary [&>p:first-of-type]:first-letter:mr-2
        [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:leading-none
        [&_.callout-tip]:bg-muted 
        [&_.callout-tip]:border-l-4 [&_.callout-tip]:border-foreground
        [&_.callout-tip]:p-6 [&_.callout-tip]:rounded-r [&_.callout-tip]:my-8
        [&_.callout-tip_strong]:text-foreground 
        [&_.callout-tip_strong]:flex [&_.callout-tip_strong]:items-center [&_.callout-tip_strong]:gap-2
        [&_.callout-tip_strong]:text-sm [&_.callout-tip_strong]:uppercase [&_.callout-tip_strong]:tracking-wide
        [&_.callout-tip_strong]:mb-2
        [&_.callout-warning]:bg-muted 
        [&_.callout-warning]:border-l-4 [&_.callout-warning]:border-destaque
        [&_.callout-warning]:p-6 [&_.callout-warning]:rounded-r [&_.callout-warning]:my-8
        [&_.callout-warning_strong]:text-destaque 
        [&_.callout-warning_strong]:flex [&_.callout-warning_strong]:items-center [&_.callout-warning_strong]:gap-2
        [&_.callout-warning_strong]:text-sm [&_.callout-warning_strong]:uppercase [&_.callout-warning_strong]:tracking-wide
        [&_.callout-warning_strong]:mb-2
        [&_.callout-key]:bg-muted 
        [&_.callout-key]:border-l-4 [&_.callout-key]:border-foreground
        [&_.callout-key]:p-6 [&_.callout-key]:rounded-r [&_.callout-key]:my-8
        [&_.callout-key_strong]:text-foreground 
        [&_.callout-key_strong]:flex [&_.callout-key_strong]:items-center [&_.callout-key_strong]:gap-2
        [&_.callout-key_strong]:text-sm [&_.callout-key_strong]:uppercase [&_.callout-key_strong]:tracking-wide
        [&_.callout-key_strong]:mb-2"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
