import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pocketfree.app',
  appName: 'Pocketfree',
  webDir: 'public',
  server: {
    url: 'https://pocketfree.vercel.app',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
