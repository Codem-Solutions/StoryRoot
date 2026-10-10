import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  Newsreader_600SemiBold,
  Newsreader_600SemiBold_Italic,
} from '@expo-google-fonts/newsreader';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/features/auth/auth-provider';
import { NotificationsProvider } from '@/features/notifications/notifications-provider';
import { PurchasesProvider } from '@/features/purchases/purchases-provider';
import { QueryProvider } from '@/core/query/query-provider';
import { ThemeProvider, useTheme } from '@/theme/theme-provider';
import { OfflineBanner } from '@/ui/offline-banner';
import { ToastProvider } from '@/ui/toast-provider';

void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { colors, resolved } = useTheme();

  return (
    <PurchasesProvider>
      <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(app)" />
      </Stack>
    </PurchasesProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    Newsreader_600SemiBold,
    Newsreader_600SemiBold_Italic,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <QueryProvider>
          <ToastProvider>
            <AuthProvider>
              <NotificationsProvider>
                <RootNavigator />
              </NotificationsProvider>
            </AuthProvider>
          </ToastProvider>
        </QueryProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
