import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dracinku.app',
  appName: 'Dracinku',
  webDir: 'public',
  server: {
    url: 'https://dracinbos.vercel.app',
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
