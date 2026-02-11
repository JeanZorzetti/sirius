import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.roilabs.sirius',
  appName: 'Sirius CRM',
  webDir: 'out',
  server: {
    // App carrega o site em produção - sem necessidade de static export
    url: 'https://sirius.roilabs.com.br',
    cleartext: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#4F46E5',
      showSpinner: false,
    },
  },
}

export default config
