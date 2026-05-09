import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Calendar,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ChevronRight,
} from "lucide-react";
import { getArticle, helpArticles } from "@/lib/help-articles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";

// Gera páginas estáticas para todos os artigos no build
export async function generateStaticParams() {
  return helpArticles.map((article) => ({
    categoria: article.categorySlug,
    slug: article.slug,
  }));
}

// Força geração estática e retorna 404 para rotas não geradas
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; categoria: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, categoria, slug } = await params;
  const article = getArticle(categoria, slug);

  if (!article) {
    return {
      title: "Artigo não encontrado - Sirius CRM",
    };
  }

  const ptUrl = `https://siriuscrm.com.br/help/${categoria}/${slug}`;
  const enUrl = `https://siriuscrm.com.br/en/help/${categoria}/${slug}`;
  const canonicalUrl = locale === 'en' ? enUrl : ptUrl;
  const isEn = locale === 'en'
  const hasEnContent = !!(article.titleEn && article.descriptionEn)
  const displayTitle = isEn && article.titleEn ? article.titleEn : article.title
  const displayDescription = isEn && article.descriptionEn ? article.descriptionEn : article.description
  const helpLabel = isEn ? 'Help Center' : 'Central de Ajuda'

  return {
    title: `${displayTitle} - ${helpLabel} | Sirius CRM`,
    description: displayDescription,
    keywords: [article.category, isEn ? 'help' : 'ajuda', 'tutorial', 'CRM', 'Sirius'],
    ...(isEn && !hasEnContent ? { robots: { index: false, follow: false } } : {}),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'pt-BR': ptUrl,
        ...(hasEnContent ? { 'en': enUrl, 'x-default': ptUrl } : {}),
      },
    },
    openGraph: {
      title: `${displayTitle} - ${helpLabel} | Sirius CRM`,
      description: displayDescription,
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary',
      title: `${displayTitle} - ${helpLabel}`,
      description: article.description,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; categoria: string; slug: string }>;
}) {
  const { locale, categoria, slug } = await params;
  const article = getArticle(categoria, slug);
  const isEn = locale === 'en';
  const displayTitle = isEn && article?.titleEn ? article.titleEn : article?.title;
  const displayDescription = isEn && article?.descriptionEn ? article.descriptionEn : article?.description;
  const displayContent = isEn && article?.contentEn ? article.contentEn : article?.content;
  const labels = isEn
    ? { help: 'Help', backToHelp: 'Back to Help', updatedAt: 'Updated on', readTime: 'read', relatedArticles: 'Related Articles', startTrial: 'Start Free Trial', importantTips: 'Important Tips', attention: 'Note' }
    : { help: 'Ajuda', backToHelp: 'Voltar para Ajuda', updatedAt: 'Atualizado em', readTime: 'Leitura de', relatedArticles: 'Artigos Relacionados', startTrial: 'Começar Teste Grátis', importantTips: 'Dicas Importantes', attention: 'Atenção' };

  if (!article) {
    notFound();
  }

  // BreadcrumbList JSON-LD for Google Rich Results
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://siriuscrm.com.br" },
      { "@type": "ListItem", "position": 2, "name": "Ajuda", "item": "https://siriuscrm.com.br/help" },
      { "@type": "ListItem", "position": 3, "name": article.category, "item": `https://siriuscrm.com.br/help#${article.categorySlug}` },
      { "@type": "ListItem", "position": 4, "name": article.title, "item": `https://siriuscrm.com.br/help/${categoria}/${slug}` }
    ]
  }

  // TechArticle JSON-LD for help documentation
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": article.title,
    "description": article.description,
    "url": `https://siriuscrm.com.br/help/${categoria}/${slug}`,
    "dateModified": article.lastUpdated,
    "author": {
      "@type": "Organization",
      "name": "Sirius CRM",
      "url": "https://siriuscrm.com.br",
    },
    "publisher": {
      "@type": "Organization",
      "name": "ROI Labs",
      "url": "https://roilabs.com.br",
      "logo": {
        "@type": "ImageObject",
        "url": "https://siriuscrm.com.br/logo.png",
      },
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://siriuscrm.com.br/help/${categoria}/${slug}`,
    },
    "about": {
      "@type": "SoftwareApplication",
      "name": "Sirius CRM",
      "applicationCategory": "BusinessApplication",
    },
  }

  return (
    <>
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />
      <div className="min-h-screen bg-background">
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/help" className="hover:text-foreground transition-colors">
              {labels.help}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link
              href={`/help#${article.categorySlug}`}
              className="hover:text-foreground transition-colors"
            >
              {article.category}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{displayTitle}</span>
          </div>

          {/* Article Header */}
          <div className="mb-8">
            <Badge variant="secondary" className="mb-4">
              {article.category}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {displayTitle}
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              {displayDescription}
            </p>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {labels.updatedAt}{" "}
                  {new Date(article.lastUpdated).toLocaleDateString(isEn ? "en-US" : "pt-BR")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{isEn ? article.readTime : `${labels.readTime} ${article.readTime}`}</span>
              </div>
            </div>
          </div>

          {/* Article Content */}
          <div className="bg-card border border-border rounded-xl p-8 mb-8">
            <article className="prose prose-gray max-w-none dark:prose-invert">
              {displayContent!.sections.map((section, index) => (
                <div key={index} className="mb-8 last:mb-0">
                  <h2 className="text-2xl font-semibold mb-4">
                    {section.title}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {section.content}
                  </p>

                  {/* Steps */}
                  {section.steps && section.steps.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {section.steps.map((step, stepIndex) => (
                        <div
                          key={stepIndex}
                          className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                        >
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                            {stepIndex + 1}
                          </div>
                          <p className="text-sm pt-0.5">{step}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tips */}
                  {section.tips && section.tips.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                          {labels.importantTips}
                        </h3>
                      </div>
                      <ul className="space-y-2">
                        {section.tips.map((tip, tipIndex) => (
                          <li
                            key={tipIndex}
                            className="flex items-start gap-2 text-sm text-blue-900 dark:text-blue-100"
                          >
                            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Warning */}
                  {section.warning && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                            {labels.attention}
                          </h3>
                          <p className="text-sm text-amber-900 dark:text-amber-100">
                            {section.warning}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </article>
          </div>

          {/* Related Articles */}
          {article.relatedArticles && article.relatedArticles.length > 0 && (
            <div className="bg-muted/30 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">{labels.relatedArticles}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {article.relatedArticles.map((related, index) => (
                  <Link
                    key={index}
                    href={`/help/${article.categorySlug}/${related.slug}`}
                    className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <BookOpen className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {related.title}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {related.category}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="flex justify-between items-center mt-8 pt-8 border-t">
            <Link href="/help">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {labels.backToHelp}
              </Button>
            </Link>
            <Link href="/register">
              <Button>{labels.startTrial}</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
