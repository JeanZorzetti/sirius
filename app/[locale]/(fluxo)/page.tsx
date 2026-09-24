import { Metadata } from "next"
import { useTranslations, useLocale } from "next-intl"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/routing"
import { buildLocaleAlternates } from "@/lib/seo/canonical"
import { ORG_SAME_AS } from "@/lib/geo/entity"
import { blogPosts } from "@/lib/blog-data"
import { Campo } from "@/components/fluxo/campo"
import { linhaDePulso } from "@/components/fluxo/geometria"

// The eight lanes the tangle is combed into.
const FAIXAS = [
  ["Pipeline Kanban", "Arraste o negócio de etapa em etapa e veja o funil inteiro numa tela."],
  ["WhatsApp integrado", "Converse com o cliente sem sair do CRM, com inbox único, tags e respostas rápidas."],
  ["AGI Sirius", "A IA comercial qualifica cada lead por BANT e MEDDIC e recomenda a próxima ação."],
  ["Prospecção no Google Maps", "Busque empresas por segmento e cidade e traga nome, telefone e site para o pipeline."],
  ["Automações de follow-up", "E-mail e WhatsApp disparados quando o negócio muda de etapa ou fica parado."],
  ["Analytics com previsão", "Receita prevista, conversão por etapa e onde o funil está perdendo negócio."],
  ["Modo offline", "O vendedor de rua registra a visita sem sinal e o app sincroniza depois."],
  ["API pública e webhooks", "Ligue o Sirius ao resto da operação."],
] as const

const PULSO = linhaDePulso()

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketing.home.meta' })
  const alternates = buildLocaleAlternates(locale, '', '')
  return {
    title: t('title'),
    description: t('description'),
    keywords: t.raw('keywords') as string[],
    alternates,
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: alternates.canonical,
      images: [{ url: 'https://siriuscrm.com.br/og-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('ogTitle'),
      description: t('ogDescription'),
    },
  }
}

export default function LandingPage() {
  const t = useTranslations("marketing.home")
  const locale = useLocale()
  const isEn = locale === 'en'

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Sirius CRM",
    "applicationCategory": "BusinessApplication",
    "applicationSubCategory": "CRM",
    "operatingSystem": "Web, iOS, Android",
    "url": "https://siriuscrm.com.br",
    "description": "O Assistente de Inteligência Artificial para Vendedores Brasileiros: pipeline Kanban, WhatsApp integrado, AGI que qualifica leads com BANT e MEDDIC, prospecção Google Maps e automação de follow-ups.",
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "BRL",
      "lowPrice": "0",
      "highPrice": "397",
      "offerCount": "4",
      "availability": "https://schema.org/InStock"
    },
    "featureList": [
      "Pipeline Kanban visual com drag-and-drop",
      "WhatsApp integrado via Evolution API",
      "AGI Sirius — IA que qualifica leads com BANT e MEDDIC",
      "Prospecção automática pelo Google Maps",
      "Automações de follow-up por email e WhatsApp",
      "Analytics PRO com previsão de receita",
      "Modo offline para vendedores externos",
      "API pública e webhooks"
    ],
    "screenshot": "https://siriuscrm.com.br/og-image.png",
    "softwareVersion": "2.0",
    "datePublished": "2024-01-01",
    "author": {
      "@type": "Organization",
      "name": "ROI Labs",
      "url": "https://roilabs.com.br"
    }
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Sirius CRM",
    "description": "CRM completo para vendas brasileiras com pipeline Kanban, WhatsApp integrado via Evolution API, AGI com IA comercial, prospecção Google Maps, automações de deals e email, analytics avançado e API pública.",
    "brand": {
      "@type": "Brand",
      "name": "ROI Labs"
    },
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "BRL",
      "lowPrice": "0",
      "highPrice": "397",
      "offerCount": "4",
      "availability": "https://schema.org/InStock",
      "url": "https://siriuscrm.com.br/pricing"
    },
    "image": "https://siriuscrm.com.br/og-image.png",
    "url": "https://siriuscrm.com.br"
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "O que é o Sirius CRM?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sirius CRM é uma plataforma completa de vendas com pipeline Kanban, WhatsApp integrado via Evolution API, IA comercial (AGI Sirius), prospecção automática pelo Google Maps, automações de deals e email, analytics avançado e API pública. Feito para vendedores brasileiros."
        }
      },
      {
        "@type": "Question",
        "name": "O Sirius CRM é gratuito?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sim! O plano Gratuito inclui 250 contatos, 100 negócios e 1 pipeline sem prazo de expiração. Para mais recursos, oferecemos Starter (R$67/mês), Pro (R$147/mês) e Business (R$397/mês)."
        }
      },
      {
        "@type": "Question",
        "name": "Como funciona o WhatsApp integrado?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "O Sirius se conecta ao WhatsApp via Evolution API com pareamento por QR Code. Você envia e recebe mensagens direto do CRM, com inbox unificado, tags, respostas rápidas e atribuição de conversas por vendedor."
        }
      },
      {
        "@type": "Question",
        "name": "Como funciona a prospecção pelo Google Maps?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Busque leads por segmento e cidade. O Sirius extrai automaticamente nome, telefone, email, site e endereço do Google Maps. Cada plano inclui créditos mensais: Starter 75, Pro 300 e Business 1.500 leads/mês."
        }
      },
      {
        "@type": "Question",
        "name": "Posso cancelar quando quiser?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sim, sem multas ou taxas. Cancele a qualquer momento e mantenha acesso até o fim do período pago. Garantia de 7 dias em todos os planos pagos."
        }
      }
    ]
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "ROI Labs - Sirius CRM",
    "url": "https://siriuscrm.com.br",
    "logo": "https://siriuscrm.com.br/logo.png",
    "image": "https://siriuscrm.com.br/og-image.png",
    "description": "CRM completo com pipeline Kanban, WhatsApp integrado, IA comercial, prospecção Google Maps e automações para vendedores brasileiros",
    "telephone": "+55-62-98344-3919",
    "email": "roilabs.ia@gmail.com",
    "areaServed": { "@type": "Country", "name": "Brasil" },
    "address": { "@type": "PostalAddress", "addressCountry": "BR", "addressRegion": "GO" },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "18:00"
      }
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+55-62-98344-3919",
      "contactType": "customer support",
      "availableLanguage": "Portuguese",
      "areaServed": "BR"
    },
    "sameAs": ORG_SAME_AS,
    "priceRange": "R$ 0 - R$ 397/mês"
  };

  const plans = [
    {
      name: isEn ? 'Free' : 'Gratuito',
      price: 'R$ 0',
      period: isEn ? '' : '',
      description: isEn ? 'To test the CRM' : 'Para testar o CRM',
      features: isEn ? ['2 Users', '250 Contacts', '100 Deals', '1 Pipeline'] : ['2 Usuários', '250 Contatos', '100 Negócios', '1 Pipeline'],
      highlighted: false,
    },
    {
      name: 'Starter',
      price: 'R$ 67',
      period: isEn ? '/mo' : '/mês',
      description: isEn ? 'For small businesses' : 'Para pequenas empresas',
      features: isEn ? ['5 Users', '1,000 Contacts', 'WhatsApp', '75 leads/mo'] : ['5 Usuários', '1.000 Contatos', 'WhatsApp', '75 leads/mês'],
      highlighted: false,
    },
    {
      name: 'Pro',
      price: 'R$ 147',
      period: isEn ? '/mo' : '/mês',
      description: isEn ? 'For growing teams' : 'Para equipes em crescimento',
      features: isEn ? ['15 Users', '5,000 Contacts', 'Sales AI', '300 leads/mo'] : ['15 Usuários', '5.000 Contatos', 'IA Comercial', '300 leads/mês'],
      highlighted: true,
    },
    {
      name: 'Business',
      price: 'R$ 397',
      period: isEn ? '/mo' : '/mês',
      description: isEn ? 'For large operations' : 'Para grandes operações',
      features: isEn ? ['50 Users', 'Unlimited', 'Round-Robin', '1,500 leads/mo'] : ['50 Usuários', 'Ilimitado', 'Round-Robin', '1.500 leads/mês'],
      highlighted: false,
    },
  ]

  const h = useTranslations("marketing.home.hero")

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      {/* Tangle → pulse: the field combs itself as the page scrolls */}
      <section className="abertura" aria-labelledby="titulo-abertura">
        <div className="abertura__topo">
          <h1 id="titulo-abertura" className="abertura__titulo">
            {h("title_prefix")} <em>{h("title_highlight")}</em>
          </h1>
          <div className="abertura__apoio">
            <p className="lide">{h("subtitle")}</p>
            <div className="acoes">
              <Link href="/register" className="fluxo-botao">{h("cta1")}</Link>
              <Link href="/login" className="fluxo-link">{h("cta2")}</Link>
            </div>
            <p className="garantias">{h("risk1")} · {h("risk2")} · {h("risk3")}</p>
          </div>
        </div>
        <Campo />
      </section>

      {/* The comb: what came in tangled, one lane each */}
      <section className="secao" aria-labelledby="titulo-faixas">
        <header className="secao__cabeca">
          <h2 id="titulo-faixas" className="secao__titulo">{t("about.title")}</h2>
          <p className="lide">{t("about.description")}</p>
        </header>
        <ol className="faixas">
          {FAIXAS.map(([nome, texto], i) => (
            <li key={nome} className="faixa">
              <span className="faixa__numero" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="faixa__nome">{nome}</h3>
              <p className="faixa__texto">{texto}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Plans */}
      <section className="secao secao--planos" aria-labelledby="titulo-planos">
        <header className="secao__cabeca">
          <h2 id="titulo-planos" className="secao__titulo">{t("plans.title")}</h2>
          <p className="lide">{t("plans.subtitle")} 7 dias grátis com acesso PRO completo, sem cartão de crédito.</p>
        </header>
        <div className="planos">
          {plans.map((plan) => (
            <article key={plan.name} className="plano" data-destaque={plan.highlighted || undefined}>
              <h3 className="plano__nome">{plan.name}</h3>
              {plan.highlighted && <p className="plano__selo">{t("plans.mostPopular")}</p>}
              <p className="plano__preco">
                {plan.price}
                {plan.period && <span className="plano__periodo">{plan.period}</span>}
              </p>
              <p className="plano__descricao">{plan.description}</p>
              <ul className="plano__lista">
                {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
              <Link
                href={plan.highlighted ? "/register" : "/pricing"}
                className={plan.highlighted ? "fluxo-botao plano__acao" : "fluxo-link plano__acao"}
              >
                {plan.price === "R$ 0" ? t("plans.startFree") : t("plans.seeDetails")}
              </Link>
            </article>
          ))}
        </div>
        <Link href="/pricing" className="fluxo-link secao__rodape">{t("plans.compareLink")}</Link>
      </section>

      {/* Readings — blog */}
      <section className="secao" aria-labelledby="titulo-leituras">
        <header className="secao__cabeca">
          <h2 id="titulo-leituras" className="secao__titulo">{t("blog.title")}</h2>
          <p className="lide">{t("blog.subtitle")}</p>
        </header>
        <div>
          <ol className="faixas">
            {blogPosts.slice(0, 3).map((post, i) => (
              <li key={post.slug} className="faixa">
                <span className="faixa__numero" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <Link href={{ pathname: "/blog/[slug]", params: { slug: post.slug } }} className="faixa__nome faixa__nome--link">
                  {post.title}
                </Link>
                <p className="faixa__texto">{post.excerpt}</p>
              </li>
            ))}
          </ol>
          <Link href="/blog" className="fluxo-link secao__rodape">{t("blog.viewAll")}</Link>
        </div>
      </section>

      {/* The pulse: where every line ends up */}
      <section className="fecho" aria-labelledby="titulo-fecho">
        <svg className="fecho__pulso" viewBox="0 0 1000 100" preserveAspectRatio="xMinYMid slice" aria-hidden="true">
          <path d={PULSO} pathLength={1} />
        </svg>
        <div className="fecho__texto">
          <h2 id="titulo-fecho" className="secao__titulo">{t("cta.title")}</h2>
          <p className="lide">{t("cta.subtitle")}</p>
          <div className="acoes">
            <Link href="/register" className="fluxo-botao">{t("cta.btnPrimary")}</Link>
            <Link href="/pricing" className="fluxo-link">{t("cta.btnSecondary")}</Link>
          </div>
        </div>
        <p className="fecho__assinatura">Sirius CRM é feito pela ROI Labs, em Goiás.</p>
      </section>
    </>
  )
}
