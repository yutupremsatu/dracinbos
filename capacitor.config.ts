import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dracinku.app',
  appName: 'Dracinku',
  webDir: 'public', // Exists and satisfies Capacitor CLI
  server: {
    androidScheme: 'https',
    url: 'https://dracinbos.vercel.app', // Use Vercel for SSR and API routes
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

