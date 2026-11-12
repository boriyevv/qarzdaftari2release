import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uz.debtbook.app',
  appName: 'Qarz Daftari',
  webDir: 'public',
  server: {
    // In production, the native shell seamlessly loads the live production app
    // enabling instant over-the-air updates, server actions, and API webhooks.
    // For local emulator/device testing, set CAPACITOR_LIVE_URL to your local IP (e.g. http://192.168.100.3:3000)
    url: process.env.CAPACITOR_LIVE_URL || 'https://debtbook.uz',
    cleartext: true,
    allowNavigation: [
      'debtbook.uz',
      '*.debtbook.uz',
      '*.supabase.co',
      '*.click.uz',
      '*.payme.uz',
      '*.uzumbank.uz',
      '*.eskiz.uz'
    ]
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f172a'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#0f172a',
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined
    }
  },
  ios: {
    backgroundColor: '#0f172a',
    contentInset: 'automatic',
    preferredContentMode: 'mobile'
  }
};

export default config;
