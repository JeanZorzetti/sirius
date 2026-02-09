# Sirius Scraping Server

Servidor de scraping usando Puppeteer para o Sirius CRM.

## Instalação no EasyPanel

### Opção 1: Git (quando o GitHub não estiver bloqueando)

1. Create Service → Docker
2. Source: Git Repository
3. Owner: `JeanZorzetti`
4. Repository: `sirius`
5. Branch: `main`
6. Build Path: `/scraping-server`

### Opção 2: Upload Direto (quando GitHub bloqueia)

1. Baixe estes 3 arquivos do GitHub:
   - `server.js`
   - `package.json`
   - `Dockerfile`

2. No EasyPanel: Create Service → Upload

3. Faça upload dos 3 arquivos

4. Port: `3000`

### Opção 3: Docker Hub (mais estável)

Se você buildar a imagem localmente e subir pro Docker Hub:

```bash
# Build local
docker build -t seuusuario/sirius-scraper:latest .

# Push para Docker Hub
docker push seuusuario/sirius-scraper:latest
```

Depois no EasyPanel:
- Source: Docker Image
- Image: `seuusuario/sirius-scraper:latest`

## Configuração no Vercel

Depois de instalado, adicione a variável:

```
SIRIUS_SCRAPER_URL=https://siriusscraper.seudominio.com
```

## Teste

Acesse:
```
https://siriusscraper.seudominio.com/health
```

Deve retornar:
```json
{"status":"ok","timestamp":"..."}
```

## Troubleshooting

### Erro 429 do GitHub

Esperar 10-15 minutos e tentar novamente, ou usar Opção 2 (Upload Direto).

### Google bloqueando (CAPTCHA)

O Google detecta datacenters. Soluções:

1. **Usar Google Places API** (recomendado)
   - Gratuito até $200/mês
   - Configure: `GOOGLE_PLACES_API_KEY`

2. **Usar ScrapingBee**
   - Trial gratuito: 200 requisições
   - Configure: `SCRAPINGBEE_API_KEY`

3. **Aguardar**
   - Tente novamente em algumas horas
   - O Google pode liberar o IP temporariamente

## Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta do servidor | `3000` |

## Endpoints

### GET /health
Health check do servidor.

### POST /search
Busca no Google.

**Body:**
```json
{
  "query": "advogados",
  "city": "goiania",
  "limit": 10
}
```

### POST /scrape
Extrai contatos de uma URL específica.

**Body:**
```json
{
  "url": "https://exemplo.com"
}
```
