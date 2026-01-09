# Como Gerar Screenshots PWA

Os screenshots PWA são usados nas lojas de aplicativos (Google Play, Microsoft Store) e na instalação do PWA para mostrar previews do aplicativo.

## Requisitos

### Screenshot Wide (Desktop)
- **Tamanho**: 1280x720px
- **Formato**: PNG
- **Nome**: `screenshot-wide.png`
- **Localização**: `public/`

### Screenshot Mobile (Celular)
- **Tamanho**: 750x1334px (iPhone 8 Plus)
- **Formato**: PNG
- **Nome**: `screenshot-mobile.png`
- **Localização**: `public/`

## Método 1: Captura Manual

### Desktop Screenshot (1280x720)

1. Abra o aplicativo em um navegador desktop
2. Configure a janela para 1280x720:
   ```javascript
   // Cole no console do navegador:
   window.resizeTo(1280, 720)
   ```
3. Navegue para a página principal do dashboard
4. Use a ferramenta de screenshot do SO:
   - **Windows**: `Win + Shift + S`
   - **Mac**: `Cmd + Shift + 4`
   - **Linux**: `PrtScn` ou ferramenta de screenshot

5. Salve como `screenshot-wide.png` em `public/`

### Mobile Screenshot (750x1334)

1. Abra DevTools (F12)
2. Ative o modo responsivo (Ctrl+Shift+M)
3. Configure para iPhone 8 Plus (750x1334)
4. Navegue para a página principal do dashboard
5. Capture a tela inteira
6. Salve como `screenshot-mobile.png` em `public/`

## Método 2: Usar Puppeteer (Automatizado)

```javascript
// scripts/generate-screenshots.js
const puppeteer = require('puppeteer');

async function generateScreenshots() {
  const browser = await puppeteer.launch();

  // Desktop Screenshot
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1280, height: 720 });
  await desktopPage.goto('http://localhost:3000/dashboard');
  await desktopPage.waitForTimeout(2000); // Wait for page to load
  await desktopPage.screenshot({
    path: 'public/screenshot-wide.png',
    fullPage: false
  });

  // Mobile Screenshot
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 750, height: 1334 });
  await mobilePage.goto('http://localhost:3000/dashboard');
  await mobilePage.waitForTimeout(2000);
  await mobilePage.screenshot({
    path: 'public/screenshot-mobile.png',
    fullPage: false
  });

  await browser.close();
  console.log('✅ Screenshots gerados com sucesso!');
}

generateScreenshots().catch(console.error);
```

Execute:
```bash
npm install --save-dev puppeteer
node scripts/generate-screenshots.js
```

## Método 3: Ferramentas Online

1. **Browserstack**: https://www.browserstack.com/screenshots
2. **Responsive Screenshot Generator**: https://responsivescreenshot.com/
3. **Screely**: https://www.screely.com/

## Verificação

Após gerar os screenshots, verifique no `manifest.json`:

```json
{
  "screenshots": [
    {
      "src": "/screenshot-wide.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "/screenshot-mobile.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ]
}
```

## Dicas

- **Use dados reais**: Popule o dashboard com dados de exemplo antes de capturar
- **Modo claro**: Screenshots em modo claro geralmente têm melhor aparência
- **Sem dados sensíveis**: Use dados fictícios, nunca dados reais de clientes
- **Qualidade**: Use PNG para melhor qualidade
- **Consistência**: Use o mesmo tema/estilo em ambos screenshots
- **Conteúdo**: Mostre as principais funcionalidades (pipeline, deals, analytics)

## Páginas Sugeridas para Screenshot

### Desktop (1280x720)
- Dashboard com cards de métricas
- Pipeline visual com deals
- Analytics com gráficos

### Mobile (750x1334)
- Dashboard principal
- Lista de contatos
- Deal detail

## Placeholders Temporários

Enquanto não tiver screenshots reais, você pode:

1. **Criar placeholders coloridos** com Figma/Canva
2. **Usar screenshots de mockups** do design
3. **Remover a seção screenshots** do manifest.json temporariamente

## Validação

Teste o manifest.json:
```bash
npx web-app-manifest-validator public/manifest.json
```

Ou use: https://manifest-validator.appspot.com/
