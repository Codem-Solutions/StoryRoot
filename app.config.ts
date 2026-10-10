import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: process.env.EXPO_PUBLIC_APP_NAME ?? 'storyRoot',
  slug: 'storyroot',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'storyroot',
  userInterfaceStyle: 'automatic',
  backgroundColor: '#F2EFE8',
  ios: {
    supportsTablet: true,
    bundleIdentifier: process.env.IOS_BUNDLE_ID ?? 'com.gbizarria.storyroot',
  },
  android: {
    package: process.env.ANDROID_PACKAGE ?? 'com.gbizarria.storyroot',
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
      projectId:
        process.env.EAS_PROJECT_ID ?? 'd42a982c-e2f5-4164-a237-632d73390a01',
    },
  },
});
