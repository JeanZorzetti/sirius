# Store Assets

Assets necessários para publicação nas lojas. Coloque os arquivos aqui antes de gerar ícones e fazer upload.

## Arquivos necessários

### Ícones (criar manualmente)
- `icon-1024.png` — 1024×1024px, PNG, sem transparência (App Store Connect obrigatório)
- Fontes: use o logo em `/public/logo.png` e adapte

### Feature Graphic (Play Store)
- `feature-graphic-1024x500.png` — 1024×500px
- Mostrar: UI do app + tagline

### Splash Screen Source
- Coloque em `/assets/splash.png` — 2732×2732px, fundo #4F46E5 (indigo)
- Centro: logo branco 512×512px

### Screenshots (capturar do app)
```
screenshots/
  android/
    phone-1080x1920-01-pipeline.png
    phone-1080x1920-02-deal.png
    phone-1080x1920-03-chat.png
    phone-1080x1920-04-analytics.png
    phone-1080x1920-05-contacts.png
  ios/
    iphone-1284x2778-01-pipeline.png
    iphone-1284x2778-02-deal.png
    iphone-1284x2778-03-chat.png
    iphone-1284x2778-04-analytics.png
    iphone-1284x2778-05-contacts.png
```

## Gerar ícones e splash automaticamente

```bash
# Após colocar icon-1024.png e splash.png nesta pasta:
npx capacitor-assets generate
```

Isso gera todos os tamanhos necessários em `android/` e `ios/`.
