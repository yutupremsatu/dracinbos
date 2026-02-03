import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dracinku.app',
  appName: 'Dracinku',
  webDir: 'public',
  server: {
    url: 'https://dracinbos.vercel.app',
    androidScheme: 'https'
  }
};

export default config;
