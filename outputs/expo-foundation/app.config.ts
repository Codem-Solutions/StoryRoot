import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: process.env.EXPO_PUBLIC_APP_NAME ?? 'Foundation',
  slug: 'expo-foundation',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'foundation',
  userInterfaceStyle: 'automatic',
  backgroundColor: '#F2EFE8',
  ios: {
    supportsTablet: true,
    bundleIdentifier: process.env.IOS_BUNDLE_ID ?? 'com.yourcompany.foundation',
  },
  android: {
    package: process.env.ANDROID_PACKAGE ?? 'com.yourcompany.foundation',
    googleServicesFile: process.env.GOOGLE_SERVICES_FILE || undefined,
    adaptiveIcon: {
      backgroundColor: '#F2EFE8',
    },
    predictiveBackGestureEnabled: true,
  },
  web: {
    output: 'static',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-notifications',
      {
        color: '#1D563B',
        defaultChannel: 'default',
        enableBackgroundRemoteNotifications: false,
      },
    ],
    [
      'expo-local-authentication',
      {
        faceIDPermission:
          'Use o Face ID para proteger sua conta e entrar com segurança.',
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#F2EFE8',
        resizeMode: 'contain',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
});
