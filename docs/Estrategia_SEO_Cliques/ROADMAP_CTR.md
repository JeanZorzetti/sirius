# Roadmap de CTR — Sirius CRM

## Situacao Atual (Marco 2026)
- **13.517 impressoes**, **29 cliques**, **0.21% CTR**
- Posicao media: 7 (boa, deveria gerar ~3-5% CTR)
- 12 dos 29 cliques sao brand ("sirius crm") — CTR nao-brand efetivo: **0.13%**

## Meta
CTR de **3%** em 3 meses (Jun 2026) = **~400 cliques/mes** vs 29 atual

---

## Fase 1: Quick Wins (Semana 1-2) -- DONE
- [x] Reescrever titles e meta descriptions das top 5 paginas
- [x] Adicionar hreflang pt-BR em todas as paginas dinamicas
- [ ] Forcar re-crawl das 5 URLs no GSC (Inspecionar URL > Solicitar indexacao)

## Fase 2: Structured Data + Rich Snippets (Semana 3-4) -- DONE
Objetivo: ganhar rich snippets (FAQ, HowTo, estrelas) que aumentam CTR em 20-30%.

- [x] 2.1 FAQ schema nas top 5 paginas (5/5 agora tem — adicionado planilha-comissao e como-escolher-crm)
- [x] 2.2 HowTo schema em 4 paginas (melhor-crm, kpis, planilha-comissao, como-escolher-crm)
- [x] 2.3 Breadcrumb schema em todas as paginas de blog (ja existia)
- [x] 2.4 ItemList schema no comparativo (Review/Rating descartado — sem ratings numericos, violaria diretrizes Google)

## Fase 3: Conteudo que Converte Cliques (Semana 5-8) -- DONE
Atacar queries com mais impressoes e 0 cliques:

| Query | Impressoes | Acao | Status |
|---|---|---|---|
| "melhores crms para pequenas empresas brasil 2026" | 561 | Adicionar H2 "Melhor CRM para Pequenas Empresas" + anchor link no comparativo | DONE |
| "crm mais usados no brasil 2026" | 264 | Adicionar H2 "CRMs Mais Usados no Brasil em 2026" + tabela ranking popularidade | DONE |
| "tecnicas de fechamento de vendas" | 146 (pos 11.8) | Otimizar title/H1 para subir para top 10 | DONE |
| "crm para representante comercial" | 57 (pos 20) | Otimizar title/excerpt com long-tail keywords (autonomo, gratuito, offline) | DONE |

Novas paginas para gap de conteudo:
- [x] 3.1 "CRM gratuito Brasil 2026" — post criado com FAQ, ItemList, meta description
- [x] 3.2 Paginas individuais de comparacao — ja existiam (post28-31)
- [x] 3.3 "CRM para varejo" — DESCARTADO: apenas 7 impressoes, ROI muito baixo para artigo dedicado
- [x] 3.4 Otimizar H2s do comparativo — renomeados para incluir "sistema de vendas", "tipo de negocio", "ranking"

## Fase 4: Internal Linking e Topical Authority (Semana 9-12) -- DONE
- [x] 4.1 Auditar e adicionar links contextuais nos top 5 posts (10 links internos adicionados no corpo do texto)
- [x] 4.2 Auditado: zero anchor texts genericos encontrados — todos ja usam keywords
- [x] 4.3 RelatedLinksBar ja funciona por cluster via relatedSlugs (100% dos posts tem 2-3 slugs)
- [x] 4.4 Breadcrumbs visuais + BreadcrumbList schema ja existiam em page.tsx

## Fase 5: Core Web Vitals (Semana 9-12, paralelo)
- [ ] 5.1 Auditar LCP, FID, CLS das top 5 paginas via PageSpeed Insights
- [ ] 5.2 Otimizar imagens de blog (Unsplash direto → next/image)
- [ ] 5.3 Lazy load componentes pesados (calculadoras, tabelas)

## Fase 6: Monitoramento e Iteracao (Continuo)
- [ ] 6.1 Exportar GSC semanalmente
- [ ] 6.2 Dashboard de acompanhamento: CTR por pagina, por query, posicao vs CTR
- [ ] 6.3 A/B test de titles para paginas com >500 impressoes
- [ ] 6.4 Identificar quais tipos de title geram mais cliques

---

## KPIs de Acompanhamento

| Metrica | Mar 2026 (baseline) | Meta Abr | Meta Mai | Meta Jun |
|---|---|---|---|---|
| Impressoes | 13.517 | 15.000 | 18.000 | 22.000 |
| Cliques | 29 | 100 | 200 | 400 |
| CTR | 0.21% | 0.67% | 1.1% | 1.8% |
| Cliques nao-brand | 17 | 70 | 160 | 350 |
| Posicao media | 7.0 | 6.5 | 6.0 | 5.5 |
