/**
 * Sirius Scraping Server
 * 
 * Servidor de scraping usando Puppeteer
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
    console.log('Initializing browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-blink-features=AutomationControlled', // Esconder que é automation
      ],
    });
    console.log('Browser initialized');
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

  console.log(`Search request: query="${query}", city="${city || 'none'}"`);

  try {
    const searchQuery = city ? `${query} ${city} telefone contato` : `${query} telefone contato`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&num=${limit}&hl=pt-BR`;

    console.log(`Navigating to: ${url}`);

    const br = await initBrowser();
    const page = await br.newPage();
    
    // Configurar viewport realista
    await page.setViewport({ width: 1366, height: 768 });
    
    // User agent realista
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    );

    // Scripts para esconder automation
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
      Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt', 'en-US', 'en'] });
    });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    console.log('Page loaded, checking for results...');

    // Verificar se é página de verificação/bloqueio
    const pageTitle = await page.title();
    const pageUrl = page.url();
    
    console.log(`Page title: ${pageTitle}`);
    console.log(`Page URL: ${pageUrl}`);

    if (pageUrl.includes('google.com/sorry') || 
        pageUrl.includes('recaptcha') ||
        pageTitle.includes('before continuing') ||
        pageTitle.includes('unusual traffic')) {
      
      console.log('Google is showing verification page');
      await page.close();
      
      return res.status(429).json({ 
        error: 'Google bloqueou a requisição (CAPTCHA/verificação). Tente novamente em alguns minutos.',
        pageTitle,
        pageUrl
      });
    }

    // Aguardar resultados com timeout maior
    let results = [];
    try {
      await page.waitForSelector('div.g, div.tF2Cxc, #search, #rso', { timeout: 10000 });
      
      results = await page.evaluate(() => {
        const leads = [];
        
        // Tentar múltiplos seletores
        const selectors = [
          'div.g',
          'div.tF2Cxc', 
          'div[data-result-index]',
          'div.v7W49e',
          'div.MjjYud',
          'div[data-sokoban-container]',
        ];
        
        let items = [];
        for (const selector of selectors) {
          items = document.querySelectorAll(selector);
          if (items.length > 0) break;
        }
        
        console.log(`Found ${items.length} result items`);
        
        items.forEach((item, index) => {
          // Tentar múltiplas formas de extrair título
          const titleEl = item.querySelector('h3') ||
                         item.querySelector('[role="heading"]') ||
                         item.querySelector('a > div > div');
          
          const linkEl = item.querySelector('a[href^="http"]') ||
                        item.querySelector('a[ping]');
          
          const snippetEl = item.querySelector('.VwiC3b, .s3v94d, .st') ||
                           item.querySelector('span:not([class])');

          if (titleEl) {
            leads.push({
              title: titleEl.textContent?.trim() || '',
              link: linkEl?.href || linkEl?.getAttribute('href') || '',
              snippet: snippetEl?.textContent?.trim() || item.textContent?.trim() || '',
            });
          }
        });
        
        return leads;
      });
      
    } catch (waitError) {
      console.log('Timeout waiting for results, trying fallback...');
      
      // Fallback: pegar qualquer link com título
      results = await page.evaluate(() => {
        const leads = [];
        const links = document.querySelectorAll('a[href^="http"]');
        
        links.forEach(link => {
          const title = link.textContent?.trim() || 
                       link.querySelector('h3')?.textContent?.trim() ||
                       link.parentElement?.querySelector('h3')?.textContent?.trim();
          
          if (title && title.length > 10 && title.length < 200) {
            leads.push({
              title,
              link: link.href,
              snippet: link.parentElement?.textContent?.trim() || '',
            });
          }
        });
        
        return leads.slice(0, 20);
      });
    }

    console.log(`Extracted ${results.length} raw results`);

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
        const generic = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com'];
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

    console.log(`Found ${leads.length} leads with contact info`);

    res.json({
      success: true,
      query: searchQuery,
      leadsFound: leads.length,
      leads,
    });

  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Scrape URL específica
app.post('/scrape', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  console.log(`Scrape request: ${url}`);

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

    // Limpar e formatar
    const cleanPhones = [...new Set(phones)].map(p => {
      let cleaned = p.replace(/[^\d]/g, '');
      if (!cleaned.startsWith('55') && cleaned.length >= 10) {
        cleaned = '55' + cleaned;
      }
      return cleaned;
    });

    const cleanEmails = [...new Set(emails)].filter(e => {
      const generic = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
      return !generic.some(d => e.toLowerCase().includes(d));
    });

    res.json({
      success: true,
      url,
      phones: cleanPhones,
      emails: cleanEmails,
    });

  } catch (error) {
    console.error('Scrape error:', error.message);
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
