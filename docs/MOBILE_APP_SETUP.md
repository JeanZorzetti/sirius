# Sirius CRM - Mobile App Setup (Capacitor)

## Architecture

The mobile app uses Capacitor as a WebView wrapper over the production site at
`https://sirius.roilabs.com.br`. This means:

- The native app shell loads the production Next.js site via `server.url`
- Native plugins (camera, GPS, push notifications) are bridged via Capacitor
- No `output: 'export'` needed — the PWA and web app remain unchanged
- Web users continue using the site normally without any impact

## What is already implemented (Phase 18)

- `capacitor.config.ts` — app config pointing to production URL
- `lib/mobile/platform.ts` — detect native vs web at runtime
- `lib/mobile/push.ts` — push notification registration (FCM/APNs + web fallback)
- `lib/mobile/ocr.ts` — business card scanning via Tesseract.js
- `lib/mobile/checkin.ts` — GPS check-ins via Capacitor Geolocation
- `lib/mobile/offline.ts` — offline queue with Capacitor Preferences fallback
- `components/mobile/scan-card-button.tsx` — OCR scan button component
- `components/mobile/checkin-button.tsx` — GPS check-in button component
- `components/mobile/native-initializer.tsx` — initializes push + offline sync
- `app/api/mobile/push-token/route.ts` — saves push tokens to DB
- `app/api/mobile/checkin/route.ts` — saves visit logs to DB
- `app/api/mobile/sync/route.ts` — sync trigger endpoint
- `app/dashboard/visits/page.tsx` — visits dashboard page
- Prisma models: `PushToken`, `VisitLog`

## Publishing to App Store / Google Play

These steps require macOS + Xcode (for iOS) or Android Studio (for Android).
They are MANUAL and should be done outside of automated CI/CD.

### Prerequisites

- macOS machine with Xcode 15+ installed (for iOS)
- Android Studio installed (for Android)
- Apple Developer account ($99/year) for iOS
- Google Play Console account ($25 one-time) for Android

### Step 1: Install platform packages

```bash
npm install @capacitor/ios @capacitor/android
```

### Step 2: Add platforms

```bash
npx cap add ios     # Creates ios/ directory (requires macOS + Xcode)
npx cap add android # Creates android/ directory (requires Android Studio)
```

### Step 3: Sync web assets

After any code change, sync the native projects:

```bash
npx cap sync
```

This copies the `webDir` (`out/`) into the native projects and updates plugins.

### Step 4: Open in Xcode (iOS)

```bash
npx cap open ios
```

In Xcode:
1. Set the Bundle Identifier to `com.roilabs.sirius`
2. Select your Apple Developer Team
3. Configure Push Notifications capability
4. Add `NSLocationWhenInUseUsageDescription` to Info.plist
5. Add `NSCameraUsageDescription` to Info.plist
6. Archive and upload to App Store Connect

### Step 5: Open in Android Studio (Android)

```bash
npx cap open android
```

In Android Studio:
1. Update `applicationId` in `app/build.gradle` to `com.roilabs.sirius`
2. Configure Firebase for FCM push notifications
3. Add `google-services.json` to `android/app/`
4. Generate signed APK/AAB and upload to Google Play Console

### Step 6: Configure Push Notifications

#### iOS (APNs)
1. Create APNs certificate in Apple Developer Console
2. Configure in Firebase Console (if using FCM) or directly in your backend

#### Android (FCM)
1. Create a Firebase project at `console.firebase.google.com`
2. Add Android app with package `com.roilabs.sirius`
3. Download `google-services.json` and place in `android/app/`
4. Store the FCM Server Key in environment variables for backend use

### Step 7: Update server URL for development

To test with a local backend during development, temporarily update
`capacitor.config.ts`:

```typescript
server: {
  url: 'http://YOUR_LOCAL_IP:3000', // e.g. http://192.168.1.100:3000
  cleartext: true, // only for local dev
},
```

Do NOT commit this change. Restore `https://sirius.roilabs.com.br` before
building for production.

## Environment Variables for Push Notifications

Add to your backend `.env`:

```
FCM_SERVER_KEY=your_firebase_server_key
APNS_KEY_ID=your_apns_key_id
APNS_TEAM_ID=your_apple_team_id
APNS_PRIVATE_KEY_PATH=./apns-key.p8
```

## Useful Commands

```bash
npx cap sync          # Sync web code to native projects
npx cap copy          # Copy web code without updating plugins
npx cap update        # Update native plugins to match package.json
npx cap doctor        # Diagnose environment issues
npx cap ls            # List installed platforms and plugins
```
