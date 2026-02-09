/**
 * Sirius Scraping Server
 * 
 * Servidor simples de scraping usando Puppeteer
 * Roda em Docker/EasyPanel
 */

const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

let browser = null;

// Inicializar browser
async function initBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    });
  }
  return browser;
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Buscar no Google
app.post('/search', async (req, res) => {
  const { query, city, limit = 10 } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const searchQuery = city ? `${query} ${city} telefone contato` : `${query} telefone contato`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&num=${limit}&hl=pt-BR`;

    const br = await initBrowser();
    const page = await br.newPage();
    
    // User agent realista
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Aguardar resultados carregarem
    await page.waitForSelector('div.g, div.tF2Cxc, h3', { timeout: 5000 });

    // Extrair dados
    const results = await page.evaluate(() => {
      const leads = [];
      const items = document.querySelectorAll('div.g, div.tF2Cxc, [data-result-index]');
      
      items.forEach(item => {
        const titleEl = item.querySelector('h3');
        const linkEl = item.querySelector('a[href^="http"]');
        const snippetEl = item.querySelector('.VwiC3b, .s3v94d');
        
        if (titleEl) {
          leads.push({
            title: titleEl.textContent?.trim() || '',
            link: linkEl?.href || '',
            snippet: snippetEl?.textContent?.trim() || item.textContent?.trim() || '',
          });
        }
      });
      
      return leads;
    });

    await page.close();

    // Extrair telefones e emails
    const leads = results.map(r => {
      const text = `${r.title} ${r.snippet}`;
      
      // Extrair telefone
      const phoneMatch = text.match(/\(?\d{2}\)?[\s.-]?(?:9\d{4}|\d{4})[\s.-]?\d{4}/);
      let phone = phoneMatch ? phoneMatch[0].replace(/[^\d]/g, '') : null;
      if (phone && !phone.startsWith('55') && phone.length >= 10) {
        phone = '55' + phone;
      }

      // Extrair email
      const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
      let email = emailMatch ? emailMatch[0] : null;
      
      // Filtrar emails genéricos
      if (email) {
        const generic = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
        if (generic.some(d => email.toLowerCase().includes(d))) {
          email = null;
        }
      }

      return {
        name: r.title.substring(0, 100),
        phone,
        email,
        website: r.link,
        source: 'PUPPETEER',
      };
    }).filter(l => l.phone || l.email);

    res.json({
      success: true,
      query: searchQuery,
      leadsFound: leads.length,
      leads,
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Scrape URL específica
app.post('/scrape', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const br = await initBrowser();
    const page = await br.newPage();
    
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    const content = await page.evaluate(() => document.body.innerText);
    await page.close();

    // Extrair contatos
    const phones = content.match(/\(?\d{2}\)?[\s.-]?(?:9\d{4}|\d{4})[\s.-]?\d{4}/g) || [];
    const emails = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi) || [];

    res.json({
      success: true,
      url,
      phones: [...new Set(phones)],
      emails: [...new Set(emails)],
    });

  } catch (error) {
    console.error('Scrape error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Sirius Scraping Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing browser...');
  if (browser) await browser.close();
  process.exit(0);
});
