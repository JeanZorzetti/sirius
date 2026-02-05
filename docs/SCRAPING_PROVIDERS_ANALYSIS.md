# 🕵️ Análise de Scraping Providers

**Objetivo:** Escolher o melhor provider para prospecção automática de leads (Google Maps, LinkedIn, etc)

**Requisitos:**
- Suportar Google Maps (prioridade #1)
- Suportar LinkedIn (nice to have)
- Custo controlado (~R$ 0,10-0,20 por lead)
- API confiável (uptime >99%)
- Compliance legal
- Escalável (0-10k leads/mês)

---

## 🔍 Providers Analisados

### 1. Outscraper ⭐ (Recomendado para Google Maps)

**Website:** https://outscraper.com
**Especialidade:** Google Maps, Google Search, Google Reviews

#### Pricing
```
Pay-as-you-go:
- Google Maps: $1.50 / 1000 results (~R$ 7,50)
- = R$ 0,0075 por lead ✅ MUITO BARATO

Subscription:
- Starter: $29/mês (40k créditos)
- Business: $99/mês (200k créditos)
```

#### Features
- ✅ Google Maps scraper nativo
- ✅ Google Business Profile completo
- ✅ Emails + Telefones + Website
- ✅ Reviews e ratings
- ✅ Horários de funcionamento
- ✅ API REST + SDKs (Python, Node.js)
- ✅ Webhook support
- ✅ Geo-targeting (cidade, raio)
- ✅ Filtros avançados (rating, categoria)
- ✅ Export CSV/JSON

#### Prós
- 💰 **Custo excelente** (mais barato do mercado)
- 🎯 Foco em Google Maps (nosso caso de uso principal)
- 📊 Dados ricos (reviews, horários, etc)
- 🔌 API simples e bem documentada
- ⚡ Rápido (100 leads em ~30s)
- 🛡️ Compliance (respeita robots.txt)

#### Contras
- ❌ Não tem LinkedIn scraper
- ⚠️ Só funciona para Google products
- ⚠️ Rate limits (100 requests/min)

#### Uso Estimado (Sirius CRM)
```
PRO plan: 50 créditos/mês
50 leads × R$ 0,0075 = R$ 0,375/cliente

100 clientes PRO: R$ 37,50/mês

Custo real: $29/mês (Starter plan) = R$ 145/mês
Margem: 100% OK ✅
```

#### Exemplo de Código
```typescript
import { OutscraperClient } from 'outscraper'

const client = new OutscraperClient({ apiKey: process.env.OUTSCRAPER_API_KEY })

// Buscar restaurantes em São Paulo
const results = await client.googleMaps([
  'restaurantes em São Paulo, SP'
], {
  limit: 50,
  language: 'pt',
  region: 'BR'
})

// Resultado:
[
  {
    name: 'Restaurante X',
    address: 'Rua Y, 123 - Pinheiros, São Paulo',
    phone: '+55 11 1234-5678',
    website: 'https://restaurantex.com.br',
    email: 'contato@restaurantex.com.br',
    rating: 4.5,
    reviews: 234,
    category: 'Restaurante',
    latitude: -23.5505,
    longitude: -46.6333
  },
  // ...
]
```

**🎯 Recomendação:** **SIM** - Usar como provider principal para Google Maps

---

### 2. Apify 🎭 (Recomendado para LinkedIn)

**Website:** https://apify.com
**Especialidade:** Web scraping marketplace (1000+ scrapers prontos)

#### Pricing
```
Platform Credits:
- $1 = 1 credit
- Google Maps scraper: ~$0.15 / 100 results (~R$ 0,75)
- LinkedIn scraper: ~$0.20 / 100 profiles (~R$ 1,00)

Subscription:
- Starter: $49/mês (US$ 59 de créditos)
- Team: $499/mês (US$ 699 de créditos)
```

#### Features
- ✅ 1000+ scrapers prontos (actors)
- ✅ Google Maps actor (mas mais caro que Outscraper)
- ✅ LinkedIn scraper (perfis, companies, jobs)
- ✅ Instagram, Facebook, Twitter, etc
- ✅ API REST + Webhooks
- ✅ Integração com Zapier/Make
- ✅ Proxy rotation incluído
- ✅ Scheduled runs (cron)

#### Prós
- 🌍 **Versatilidade** (muitos scrapers)
- 🔗 LinkedIn support (único que funciona bem)
- 🔄 Marketplace ativo (scrapers sempre atualizados)
- 🛠️ Custom actors (pode criar próprio scraper)
- 🔐 Proxy premium incluído

#### Contras
- 💸 Mais caro que Outscraper para Google Maps
- 📚 Complexidade (muitas opções)
- ⚠️ LinkedIn scraper viola ToS do LinkedIn (risco)

#### Uso Estimado (Sirius CRM)
```
Uso secundário (apenas LinkedIn):
- ~10% dos clientes usam LinkedIn scraping
- 10 clientes × 50 leads/mês = 500 leads
- 500 leads × R$ 0,01 = R$ 5/mês

Custo: $49/mês (Starter) = R$ 245/mês
Decisão: Só vale se >50% usar LinkedIn scraping ❌
```

**🎯 Recomendação:** **TALVEZ** - Apenas se houver demanda real por LinkedIn

---

### 3. Bright Data (ex-Luminati) 🏢 (Enterprise)

**Website:** https://brightdata.com
**Especialidade:** Proxy network + Web scraping (enterprise)

#### Pricing
```
Proxy Network:
- Residential: $500/mês (mínimo) + $10/GB
- Datacenter: $500/mês + $1.25/GB

Scraping Browser:
- $3.50 / 1000 page loads

Data Collector (ready-made datasets):
- Google Maps: $0.001 / record (~R$ 0,005)
- LinkedIn: Custom pricing
```

#### Features
- ✅ Melhor infra de proxy do mundo (72M IPs)
- ✅ Compliance legal (GDPR, CCPA)
- ✅ Data Collector (datasets prontos)
- ✅ Scraping Browser (Puppeteer/Playwright na nuvem)
- ✅ API robusta
- ✅ SLA 99.99%
- ✅ Suporte enterprise

#### Prós
- 🏆 **Melhor qualidade** de dados
- 🛡️ Legal e compliance-first
- 🌍 Proxy global (qualquer país)
- 📊 Analytics detalhado
- 🚀 Escalável até milhões de requests

#### Contras
- 💰💰💰 **MUITO CARO** (mínimo $500/mês)
- 📞 Sales-driven (precisa falar com vendedor)
- 🔧 Setup complexo
- 🎯 Overkill para nosso volume

**🎯 Recomendação:** **NÃO** - Muito caro para estágio atual (revisar quando >1000 clientes PRO)

---

### 4. ScraperAPI 🔧 (Developer-friendly)

**Website:** https://scraperapi.com
**Especialidade:** Proxy + scraping simplificado

#### Pricing
```
Hobby: $49/mês (100k API calls)
Business: $149/mês (1M API calls)
```

#### Features
- ✅ Proxy rotation automático
- ✅ JavaScript rendering
- ✅ CAPTCHA solving
- ✅ API simples (apenas URL)
- ✅ Geotargeting
- ❌ Não tem scrapers prontos (você faz o parse)

#### Prós
- 🎯 Simples de usar
- 💰 Custo razoável
- 🔄 Proxy rotation automático

#### Contras
- ❌ Não tem scrapers prontos
- ❌ Você precisa fazer o parsing do HTML
- ⚠️ Manutenção constante (Google muda HTML)

**🎯 Recomendação:** **NÃO** - Muito trabalho manual

---

### 5. Custom (Puppeteer/Playwright) 🛠️ (DIY)

**Descrição:** Criar scraper próprio usando Puppeteer/Playwright + proxy

#### Pricing
```
VPS (DigitalOcean): $24/mês (2GB RAM)
Proxy residencial (BrightData/Smartproxy): $75/mês
Total: ~$100/mês (~R$ 500/mês)
```

#### Features
- ✅ Controle total
- ✅ Customizável 100%
- ✅ Sem vendor lock-in

#### Prós
- 🎯 Personalizado para nosso caso
- 💰 Custo fixo (previsível)
- 🔓 Código aberto

#### Contras
- ❌ **Manutenção constante** (Google muda HTML)
- ❌ Risco de bloqueio (anti-bot)
- ❌ Precisa de proxy premium
- ❌ Precisa de CAPTCHA solving
- ⏰ Tempo de dev alto (~40h iniciais + 4h/mês manutenção)

**Custo Real:**
```
Dev inicial: 40h × R$ 100/h = R$ 4.000
Manutenção: 4h/mês × R$ 100/h = R$ 400/mês
Infra: R$ 500/mês
Total mês 1: R$ 4.900
Total meses seguintes: R$ 900/mês

vs Outscraper: R$ 145/mês
Diferença: R$ 755/mês MAIS CARO ❌
```

**🎯 Recomendação:** **NÃO** - Não vale a pena (a menos que >10k leads/mês)

---

## 📊 Comparação Lado a Lado

| Provider | Google Maps | LinkedIn | Custo/100 leads | Setup | Manutenção | Recomendado |
|----------|-------------|----------|-----------------|-------|------------|-------------|
| **Outscraper** | ⭐⭐⭐⭐⭐ | ❌ | **R$ 0,75** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ SIM |
| **Apify** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | R$ 0,75-1,00 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⚠️ TALVEZ |
| **Bright Data** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | R$ 0,50 | ⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ Caro |
| **ScraperAPI** | ⭐⭐⭐ | ⭐⭐⭐ | R$ 1,50 | ⭐⭐⭐ | ⭐⭐ | ❌ Manual |
| **Custom** | ⭐⭐⭐⭐ | ⭐⭐⭐ | R$ 0,50 | ⭐ | ⭐ | ❌ Alto custo dev |

---

## ✅ Recomendação Final

### Abordagem Híbrida (Custo-benefício ideal)

```
PRIMARY: Outscraper (Google Maps)
  - Custo: $29/mês (Starter) = R$ 145/mês
  - Cobre 80-90% dos casos de uso
  - Implementar AGORA ✅

SECONDARY: Apify (LinkedIn) - OPCIONAL
  - Custo: $49/mês (Starter) = R$ 245/mês
  - Apenas se >20% dos clientes pedirem LinkedIn
  - Implementar depois se houver demanda ⏳

FALLBACK: Custom scraper
  - Apenas para casos específicos que não cobertos
  - Ex: Mercado Livre, OLX, portais específicos
  - Implementar sob demanda 🔧
```

### Custo Total Estimado

**Fase 1 (v2.0 Launch):**
```
Outscraper: R$ 145/mês
TOTAL: R$ 145/mês ✅ BAIXO
```

**Fase 2 (Se houver demanda por LinkedIn):**
```
Outscraper: R$ 145/mês
Apify: R$ 245/mês
TOTAL: R$ 390/mês ✅ OK
```

**Margem:**
```
Receita de scraping (50 leads × 100 clientes PRO):
- Incluído no plano PRO (R$ 97/mês)
- 100 clientes × R$ 97 = R$ 9.700/mês

Custo de scraping:
- R$ 145/mês (Outscraper)

Margem: 98,5% ✅ EXCELENTE
```

---

## 🚀 Plano de Implementação

### Fase 1: Outscraper (Semana 6 do roadmap)

**Setup (2h):**
```bash
# 1. Criar conta Outscraper
https://app.outscraper.com/signup

# 2. Gerar API key
Dashboard → API → Create Key

# 3. Instalar SDK
npm install outscraper

# 4. Testar
node scripts/test-outscraper.js
```

**Código:**
```typescript
// lib/scraping/outscraper-client.ts
import { OutscraperClient } from 'outscraper'

export class OutscraperService {
  private client: OutscraperClient

  constructor() {
    this.client = new OutscraperClient({
      apiKey: process.env.OUTSCRAPER_API_KEY!
    })
  }

  async searchGoogleMaps(params: {
    query: string
    limit?: number
    city?: string
    category?: string
  }) {
    const { query, limit = 50, city, category } = params

    const fullQuery = city ? `${query} in ${city}` : query

    const results = await this.client.googleMaps([fullQuery], {
      limit,
      language: 'pt',
      region: 'BR',
      ...(category && { categories_filter: category })
    })

    // Parse results
    return results[0].map(place => ({
      name: place.name,
      address: place.full_address,
      phone: place.phone,
      website: place.site,
      email: place.emails?.[0],
      rating: place.rating,
      reviews: place.reviews,
      category: place.category,
      latitude: place.latitude,
      longitude: place.longitude,
      businessStatus: place.business_status
    }))
  }
}
```

**Integração com CRM:**
```typescript
// app/api/scraping/search/route.ts
export async function POST(req: Request) {
  const { query, maxResults } = await req.json()

  // Criar job
  const job = await prisma.scrapingJob.create({
    data: {
      provider: 'OUTSCRAPER',
      source: 'GOOGLE_MAPS',
      query,
      status: 'PENDING'
    }
  })

  // Executar async
  executeScrapingJob(job.id)

  return NextResponse.json({ jobId: job.id })
}

async function executeScrapingJob(jobId: string) {
  const job = await prisma.scrapingJob.findUnique({ where: { id: jobId } })

  const outscraper = new OutscraperService()

  const leads = await outscraper.searchGoogleMaps({
    query: job.query,
    limit: 50
  })

  // Dedupe contra contacts existentes
  const newLeads = await deduplicateLeads(leads, job.organizationId)

  // Criar contacts
  for (const lead of newLeads) {
    await prisma.contact.create({
      data: {
        organizationId: job.organizationId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.name,
        source: 'SCRAPING',
        tags: ['google-maps', 'scraped']
      }
    })
  }

  // Atualizar job
  await prisma.scrapingJob.update({
    where: { id: jobId },
    data: {
      status: 'COMPLETED',
      resultsCount: newLeads.length
    }
  })
}
```

**Checklist:**
- [ ] Criar conta Outscraper
- [ ] Adicionar `OUTSCRAPER_API_KEY` em .env
- [ ] Implementar `OutscraperService`
- [ ] Integrar com API de scraping
- [ ] Testar em dev (10 leads)
- [ ] Testar em staging (50 leads)
- [ ] Deploy para produção

---

### Fase 2: Apify (Opcional - Se houver demanda)

**Setup (2h):**
```bash
# 1. Criar conta Apify
https://console.apify.com/sign-up

# 2. Instalar SDK
npm install apify-client

# 3. Configurar
```

**Código:**
```typescript
// lib/scraping/apify-client.ts
import { ApifyClient } from 'apify-client'

export class ApifyService {
  private client: ApifyClient

  constructor() {
    this.client = new ApifyClient({
      token: process.env.APIFY_API_TOKEN!
    })
  }

  async searchLinkedIn(params: {
    query: string
    limit?: number
  }) {
    const { query, limit = 50 } = params

    // Usar actor "pocesar/linkedin-people-search"
    const run = await this.client.actor('pocesar/linkedin-people-search').call({
      search: query,
      maxResults: limit
    })

    const { items } = await this.client.dataset(run.defaultDatasetId).listItems()

    return items.map(profile => ({
      name: profile.fullName,
      title: profile.headline,
      company: profile.companyName,
      location: profile.location,
      linkedinUrl: profile.url,
      email: profile.email, // Se disponível
      phone: profile.phone // Se disponível
    }))
  }
}
```

**Checklist:**
- [ ] Criar conta Apify (só se necessário)
- [ ] Adicionar `APIFY_API_TOKEN` em .env
- [ ] Implementar `ApifyService`
- [ ] Integrar com API de scraping (source: LINKEDIN)
- [ ] Testar compliance (LinkedIn ToS)
- [ ] Adicionar warnings de uso

---

## 📋 Compliance & Legal

### Google Maps Scraping
✅ **Legal** (com ressalvas):
- Respeitar robots.txt
- Rate limiting (não DDoS)
- Não revender dados brutos
- Uso interno ou transformação (CRM)
- Citar fonte quando aplicável

**Outscraper:** Compliant ✅

### LinkedIn Scraping
⚠️ **Gray Area**:
- LinkedIn ToS proíbe scraping
- Mas é permitido para uso pessoal
- Risco: Ban de conta LinkedIn
- Mitigação: Usar proxy + rate limit baixo
- Adicionar disclaimer no CRM

**Apify:** Funciona mas com risco ⚠️

**Recomendação:**
- Implementar LinkedIn scraping
- Adicionar warning na UI:
  ```
  ⚠️ LinkedIn Scraping:
  Use com moderação. Respeite os Termos de Uso do LinkedIn.
  Sirius CRM não se responsabiliza por bans de conta.
  ```

---

## 📊 Monitoramento & Alertas

### Métricas a Rastrear

```sql
-- Dashboard de Scraping
SELECT
  provider,
  source,
  COUNT(*) as total_jobs,
  SUM(resultsCount) as total_leads,
  AVG(creditsUsed) as avg_credits,
  AVG(EXTRACT(EPOCH FROM (completedAt - startedAt))) as avg_duration_seconds
FROM scraping_jobs
WHERE createdAt > NOW() - INTERVAL '30 days'
GROUP BY provider, source
ORDER BY total_jobs DESC
```

### Alertas Sentry

```typescript
// lib/scraping/monitoring.ts
export async function trackScrapingJob(job: ScrapingJob) {
  // Alert se taxa de falha >20%
  const recentJobs = await getRecentJobs(24) // últimas 24h
  const failureRate = recentJobs.filter(j => j.status === 'FAILED').length / recentJobs.length

  if (failureRate > 0.2) {
    Sentry.captureMessage('High scraping failure rate', {
      level: 'warning',
      extra: { failureRate, provider: job.provider }
    })
  }

  // Alert se custo mensal >R$ 500
  const monthlyCost = await getMonthlyScrapingCost()
  if (monthlyCost > 500) {
    Sentry.captureMessage('Scraping cost exceeded budget', {
      level: 'warning',
      extra: { monthlyCost }
    })
  }
}
```

---

## 🎯 Conclusão

**Implementar AGORA:**
- ✅ **Outscraper** (Google Maps) - R$ 145/mês
- ✅ Simples, barato, eficaz
- ✅ Cobre 80-90% dos casos

**Avaliar DEPOIS (se houver demanda):**
- ⏳ **Apify** (LinkedIn) - R$ 245/mês
- ⏳ Apenas se >20% dos clientes PRO pedirem
- ⏳ Monitorar requests de suporte

**NÃO implementar:**
- ❌ Bright Data (muito caro)
- ❌ Custom scraper (alto custo de manutenção)
- ❌ ScraperAPI (muito trabalho manual)

**Custo Total Fase 1:** R$ 145/mês ✅
**Margem:** 98,5% ✅
**ROI:** Positivo desde o primeiro cliente PRO ✅

---

**Status:** ✅ Pronto para implementação
**Owner:** Jean (Dev)
**Próximo passo:** Criar conta Outscraper e começar integração
