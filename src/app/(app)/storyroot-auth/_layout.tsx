import { Redirect, Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StoryRootBoot } from '@/storyroot/StoryRootBoot';
import { useAuthStore } from '@/storyroot/store/authStore';
import { useOnboardingConcluido } from '@/storyroot/store/childStore';

export default function StoryRootAuthLayout() {
  const usuarioAtualId = useAuthStore(state => state.usuarioAtualId);
  const onboardingConcluido = useOnboardingConcluido();

  if (usuarioAtualId) {
    if (onboardingConcluido) {
      return <Redirect href="/(app)/storyroot-main/(tabs)/home" />;
    }

    return (
      <Redirect
        href={{
          pathname: '/(app)/storyroot-onboarding/cadastro-crianca',
          params: { mode: 'onboarding' },
        }}
      />
    );
  }

  return (
    <StoryRootBoot>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="cadastro-conta" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="verify-otp" />
          <Stack.Screen name="reset-password" />
          <Stack.Screen name="recuperar-senha" />
        </Stack>
      </SafeAreaProvider>
    </StoryRootBoot>
  );
}
