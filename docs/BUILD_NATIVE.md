# Sirius CRM — Build Nativo (iOS + Android)

## Pré-requisitos

- Node.js 20+
- Capacitor CLI 8: `npm install -g @capacitor/cli`
- **Android:** Android Studio + JDK 17 + Android SDK (API 34)
- **iOS:** macOS + Xcode 15+ + Apple Developer account ($99/year)

---

## Setup inicial (uma vez)

### 1. Gerar estruturas nativas

```bash
cd crm-project

# Adicionar plataformas (gera android/ e ios/)
npx cap add android
npx cap add ios

# Sync (copia web assets e plugins)
npm run cap:sync
```

### 2. Configurar Firebase (Android Push Notifications)

1. Criar projeto no Firebase Console → Android app → `com.roilabs.sirius`
2. Baixar `google-services.json`
3. Colocar em `android/app/google-services.json`
4. No `android/app/build.gradle`, verificar que está configurado:
   ```groovy
   apply plugin: 'com.google.gms.google-services'
   ```

### 3. Configurar APNs (iOS Push Notifications)

1. Apple Developer → Certificates → Keys → Create APNs Key (.p8)
2. Salvar `AuthKey_XXXXXXXXXX.p8` com segurança
3. Anotar: Key ID, Team ID, Bundle ID (`com.roilabs.sirius`)
4. Configurar no backend em `.env`:
   ```
   APNS_KEY_PATH=/path/to/AuthKey.p8
   APNS_KEY_ID=XXXXXXXXXX
   APNS_TEAM_ID=XXXXXXXXXX
   APNS_BUNDLE_ID=com.roilabs.sirius
   ```

### 4. Configurar Signing Android

```bash
# Gerar keystore (guardar FORA do repositório)
keytool -genkey -v \
  -keystore sirius-release.keystore \
  -alias sirius \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Adicionar em `android/app/build.gradle`:
```groovy
android {
  signingConfigs {
    release {
      storeFile file(System.getenv("ANDROID_KEYSTORE_PATH") ?: "sirius-release.keystore")
      storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
      keyAlias System.getenv("ANDROID_KEY_ALIAS") ?: "sirius"
      keyPassword System.getenv("ANDROID_KEY_PASSWORD")
    }
  }
  buildTypes {
    release {
      signingConfig signingConfigs.release
      minifyEnabled false
    }
  }
}
```

### 5. Gerar ícones e splash screens

```bash
# Instalar ferramenta de geração de assets
npm install --save-dev @capacitor/assets

# Colocar ícone base em assets/icon.png (1024×1024, sem transparência para Android)
# Colocar splash em assets/splash.png (2732×2732, tema indigo)
mkdir -p assets

# Gerar todos os tamanhos automaticamente
npx capacitor-assets generate
```

---

## Build de produção

### Bump de versão

```bash
npm run version:bump
# Incrementa patch: 1.0.0 → 1.0.1
# Atualiza android/app/build.gradle e ios/App/App/Info.plist automaticamente
```

### Android — APK / AAB

```bash
# Sync
npm run cap:sync

# Opção 1: Via linha de comando
cd android
./gradlew bundleRelease  # AAB (recomendado para Play Store)
# Saída: android/app/build/outputs/bundle/release/app-release.aab

# Opção 2: Via Android Studio
npm run cap:open:android
# Build → Generate Signed Bundle/APK → Android App Bundle → Next → Configure key...
```

### iOS — IPA

```bash
# Sync
npm run cap:sync

# Abrir no Xcode
npm run cap:open:ios

# No Xcode:
# 1. Selecionar target "App"
# 2. Signing & Capabilities → Team → selecionar sua equipe Apple Developer
# 3. Product → Archive
# 4. Organizer → Distribute App → App Store Connect → Upload
```

---

## Deploy nas lojas

### Google Play Console

1. Criar app em play.google.com/console
2. App content → Privacy policy → https://siriuscrm.com.br/privacy
3. Store listing → preencher com dados de `docs/STORE_LISTING.md`
4. Internal Testing → Upload AAB
5. Testar com 2-3 dispositivos
6. Production → Gradual rollout (20% → 50% → 100%)

### Apple App Store Connect

1. Criar app em appstoreconnect.apple.com
2. App Information → Bundle ID: `com.roilabs.sirius`
3. Pricing → Free (SaaS com subscription externa)
4. App Privacy → Declarar dados coletados
5. App Review → TestFlight → Adicionar testers
6. Submit for Review → aguardar 24-72h

---

## Checklist pré-submissão

- [ ] `npm run version:bump` executado
- [ ] `npm run build:mobile` sem erros
- [ ] `npx cap sync` sem warnings críticos
- [ ] Splash screen aparece e desaparece corretamente
- [ ] Status bar com cor correta (dark/light theme)
- [ ] Push notifications funcionando (FCM Android, APNs iOS)
- [ ] Biometria funciona (Face ID no iPhone, fingerprint no Android)
- [ ] Deep links: `siriuscrm.com.br/dashboard/deals/123` abre corretamente
- [ ] Offline: criar deal offline, reconectar, verificar sync
- [ ] Screenshots tirados para as resoluções corretas
- [ ] Privacy policy atualizada e acessível
- [ ] STORE_LISTING.md preenchido em pt-BR
- [ ] Keystore Android com backup seguro
- [ ] Provisioning profile iOS não expirado

---

## Variáveis de ambiente necessárias

```env
# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=suporte@roilabs.com.br

# Firebase (Android)
# Configurado via google-services.json, não env

# APNs (iOS)  
APNS_KEY_PATH=/path/to/AuthKey.p8
APNS_KEY_ID=XXXXXXXXXX
APNS_TEAM_ID=XXXXXXXXXX
APNS_BUNDLE_ID=com.roilabs.sirius

# Android Signing (CI/CD)
ANDROID_KEYSTORE_PATH=/path/to/sirius-release.keystore
ANDROID_KEYSTORE_PASSWORD=...
ANDROID_KEY_ALIAS=sirius
ANDROID_KEY_PASSWORD=...
```
