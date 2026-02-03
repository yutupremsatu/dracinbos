import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dracinku.app',
  appName: 'Dracinku',
  webDir: 'out', // Next.js export directory
  server: {
    // url: 'https://dracinbos.vercel.app', // COMMENTED OUT: Load from local assets to enable native plugins
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '500800985060-75mc0dfbc69ckikv9ltbqs7hpvqa7fg1.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    }
  }
};

export default config;
